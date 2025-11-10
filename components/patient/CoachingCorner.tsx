import React, { useState, useEffect } from 'react';
import { Patient, CarePlan } from '../../types.ts';
import * as geminiService from '../../services/geminiService.ts';
import { BotMessageSquareIcon } from '../icons/index.tsx';
import { MarkdownRenderer } from '../common/MarkdownRenderer.tsx';

interface CoachingCornerProps {
  patient: Patient;
  carePlan: CarePlan;
}

export const CoachingCorner: React.FC<CoachingCornerProps> = ({ patient, carePlan }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    const fetchCoachingMessage = async () => {
      setIsLoading(true);
      try {
        const response = await geminiService.generateCoachingMessage(patient, carePlan);
        setMessage(response);
      } catch (error) {
        console.error("Failed to fetch coaching message", error);
        setMessage("Remember to take a moment for your health today!");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoachingMessage();
  }, [patient, carePlan]);

  return (
    <div className="coaching-card">
      <div className="coaching-card-icon">
        <BotMessageSquareIcon className="w-8 h-8" />
      </div>
      <div className="flex-1">
        <h3 className="coaching-card-title">Your AI Health Coach</h3>
        {isLoading ? (
          <div className="ai-insight-loading">
            <div className="ai-insight-loader-bar w-3/4"></div>
            <div className="ai-insight-loader-bar w-1/2"></div>
          </div>
        ) : (
          <div className="coaching-card-content">
            {(() => {
              const trimmed = message ? message.trim() : '';
              const looksLikeJson = /^\s*[\[{]/.test(trimmed);
              const isLarge = trimmed.length > 800 || (looksLikeJson && trimmed.length > 200);

              if (isLarge && !showFull) {
                const preview = trimmed.slice(0, 400) + (trimmed.length > 400 ? '...' : '');
                return (
                  <>
                    <MarkdownRenderer content={preview} />
                    <div className="coaching-card-actions">
                      <button type="button" className="link-button" onClick={() => setShowFull(true)}>Show full AI message</button>
                    </div>
                  </>
                );
              }

              if (looksLikeJson || showFull) {
                return (
                  <div>
                    <pre className="coaching-pre"><code>{trimmed}</code></pre>
                    {isLarge && <div className="coaching-card-actions"><button type="button" className="link-button" onClick={() => setShowFull(false)}>Collapse</button></div>}
                  </div>
                );
              }

              return <MarkdownRenderer content={message} />;
            })()}
          </div>
        )}
      </div>
    </div>
  );
};