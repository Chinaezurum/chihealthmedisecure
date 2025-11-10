import { useEffect, useRef } from 'react';
import * as api from '../services/apiService.ts';

export const useWebSocket = (userId: string | undefined, onRefetch: () => void) => {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) {
      // If no user, ensure any existing connection is closed
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      return;
    }

  const token = api.getAuthToken();
  if (!token) return;

  // Determine protocol based on window location protocol
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const encodedToken = encodeURIComponent(token);

  // Build backend WS URL from API_BASE_URL when possible so we don't hardcode ports.
  let wsUrlBackend: string | null = null;
  try {
    const parsed = new URL(api.API_BASE_URL);
    wsUrlBackend = `${protocol}//${parsed.host}/ws?token=${encodedToken}`;
  } catch (e) {
    // fallback to the common dev backend host if parsing fails
    wsUrlBackend = `${protocol}//localhost:8080/ws?token=${encodedToken}`;
  }

  const wsUrlProxy = `${protocol}//${window.location.host}/ws?token=${encodedToken}`;

  // If the backend host differs from the current host (typical dev: 8080 vs 5173/5174),
  // prefer connecting directly to backend first to avoid proxy websocket issues.
  const preferDirect = (() => {
    try { return new URL(api.API_BASE_URL).host !== window.location.host; } catch { return true; }
  })();
    
    let reconnectTimeout: number | undefined;

    let triedDirect = false;

    function makeSocket(url: string) {
      console.info('Attempting WebSocket connection to', url);
      const s = new WebSocket(url);
      s.onopen = () => {
        console.log('WebSocket connected to', url);
        clearTimeout(reconnectTimeout);
      };

      s.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'refetch') {
            console.log('Received refetch notification');
            onRefetch();
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      s.onclose = () => {
        console.log('WebSocket disconnected. Attempting to reconnect...');
        reconnectTimeout = window.setTimeout(connect, 3000); // Reconnect after 3 seconds
      };

      s.onerror = (error) => {
        console.error('WebSocket error connecting to', url, error);
        // If this was the proxy attempt, try backend directly once
        if (url === wsUrlProxy && !triedDirect) {
          triedDirect = true;
          try {
            s.close();
          } catch (_) {}
          console.warn('Proxy failed; attempting direct backend WebSocket at', wsUrlBackend);
          // Delay slightly before trying backend URL
          if (wsUrlBackend) {
            window.setTimeout(() => {
              ws.current = makeSocket(wsUrlBackend as string);
            }, 200);
          }
          return;
        }
        try { s.close(); } catch (_) {}
      };

      return s;
    }

    function connect() {
      // Avoid creating multiple connections
      if (ws.current && ws.current.readyState === WebSocket.OPEN) return;
      // Choose initial target based on whether we prefer direct backend connections
      if (preferDirect && wsUrlBackend) {
        console.info('Preferring direct backend WebSocket at', wsUrlBackend);
        ws.current = makeSocket(wsUrlBackend);
      } else {
        ws.current = makeSocket(wsUrlProxy);
      }
    }

    connect();

    // Cleanup function
    return () => {
      clearTimeout(reconnectTimeout);
      if (ws.current) {
        // Remove the onclose listener before closing to prevent reconnection attempts on unmount
        ws.current.onclose = null;
        ws.current.close();
        ws.current = null;
      }
    };
  }, [userId, onRefetch]); // Re-run effect if userId changes (login/logout)
};