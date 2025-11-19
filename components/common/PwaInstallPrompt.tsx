import React, { useState, useEffect } from 'react';
import * as Icons from '../icons';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: '12px',
        padding: '16px 20px',
        maxWidth: '400px',
        width: '90%',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'slideUp 0.3s ease-out'
      }}
      className="pwa-install-prompt"
    >
      <div 
        style={{
          width: '48px',
          height: '48px',
          backgroundColor: '#3b82f6',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <Icons.DownloadCloudIcon className="w-6 h-6 text-white" />
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827', marginBottom: '4px' }}>
          Install ChiHealth App
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          Access faster and work offline
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleDismiss}
          style={{
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#6b7280',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Not Now
        </button>
        <button
          onClick={handleInstall}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'white',
            backgroundColor: '#3b82f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          Install
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translate(-50%, 100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
