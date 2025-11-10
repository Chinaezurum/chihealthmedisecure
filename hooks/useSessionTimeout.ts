import { useState, useEffect, useCallback, useRef } from 'react';

const INACTIVITY_TIMEOUT = 14 * 60 * 1000; // 14 minutes
const COUNTDOWN_SECONDS = 60; // 1 minute warning

export const useSessionTimeout = (onTimeout: () => void) => {
  const [isWarningModalOpen, setWarningModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const timeoutIdRef = useRef<number | null>(null);
  const countdownIntervalIdRef = useRef<number | null>(null);

  const startWarningCountdown = useCallback(() => {
    setWarningModalOpen(true);
    
    countdownIntervalIdRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalIdRef.current!);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onTimeout]);

  const resetTimer = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (countdownIntervalIdRef.current) {
        clearInterval(countdownIntervalIdRef.current);
    }

    setWarningModalOpen(false);
    setCountdown(COUNTDOWN_SECONDS);
    
    timeoutIdRef.current = window.setTimeout(startWarningCountdown, INACTIVITY_TIMEOUT);
  }, [startWarningCountdown]);
  
  const handleStay = () => {
    resetTimer();
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    
    const eventHandler = () => resetTimer();

    events.forEach(event => window.addEventListener(event, eventHandler));
    
    resetTimer();

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (countdownIntervalIdRef.current) {
        clearInterval(countdownIntervalIdRef.current);
      }
      events.forEach(event => window.removeEventListener(event, eventHandler));
    };
  }, [resetTimer]);

  return { isWarningModalOpen, countdown, handleStay };
};
