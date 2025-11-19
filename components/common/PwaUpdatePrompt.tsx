import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import * as Icons from '../icons';

export const PwaUpdatePrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: '12px',
        padding: '16px 20px',
        maxWidth: '400px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        animation: 'slideIn 0.3s ease-out'
      }}
      className="pwa-update-prompt"
    >
      <div 
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: offlineReady ? '#10b981' : '#3b82f6',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {offlineReady ? (
          <Icons.CheckCircleIcon className="w-5 h-5 text-white" />
        ) : (
          <Icons.DownloadCloudIcon className="w-5 h-5 text-white" />
        )}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827', marginBottom: '4px' }}>
          {offlineReady ? 'App Ready to Work Offline' : 'New Update Available'}
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
          {offlineReady 
            ? 'The app is now ready to work offline.' 
            : 'A new version is available. Reload to update.'}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={close}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          >
            {offlineReady ? 'OK' : 'Later'}
          </button>
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              style={{
                padding: '6px 16px',
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
              Reload Now
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
