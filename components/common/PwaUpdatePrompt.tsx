import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import * as Icons from '../icons';

export const PwaUpdatePrompt: React.FC = () => {
  const [showErrorRecovery, setShowErrorRecovery] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registered: ' + r);
      // Check for updates every 60 seconds
      if (r) {
        setInterval(() => {
          r.update();
        }, 60000);
      }
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  });

  // Detect stale cache issues (React context errors)
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      if (event.message.includes('createContext') || 
          event.message.includes('Cannot read properties of undefined')) {
        console.error('🔴 Stale cache detected! Showing recovery prompt...');
        setShowErrorRecovery(true);
      }
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowErrorRecovery(false);
  };

  const forceReload = () => {
    // Unregister service worker and hard reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
        }
        // Clear cache and reload
        if (typeof caches !== 'undefined') {
          caches.keys().then(names => {
            Promise.all(names.map(name => caches.delete(name)))
              .then(() => {
                setTimeout(() => window.location.reload(), 100);
              });
          });
        } else {
          window.location.reload();
        }
      }).catch(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  // Show error recovery if detected or if update needed
  if (showErrorRecovery) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#fef2f2',
          border: '2px solid #ef4444',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
          borderRadius: '12px',
          padding: '16px 20px',
          maxWidth: '420px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          animation: 'slideIn 0.3s ease-out'
        }}
        className="pwa-error-recovery"
      >
        <div 
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#ef4444',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Icons.AlertCircleIcon className="w-5 h-5 text-white" />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#991b1b', marginBottom: '4px' }}>
            ⚠️ Stale Cache Detected
          </div>
          <div style={{ fontSize: '13px', color: '#7f1d1d', marginBottom: '12px', lineHeight: '1.5' }}>
            Your browser is loading an outdated version. Click "Fix Now" to clear the cache and reload.
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={close}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#7f1d1d',
                backgroundColor: '#fee2e2',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
            >
              Dismiss
            </button>
            <button
              onClick={forceReload}
              style={{
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'white',
                backgroundColor: '#ef4444',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
            >
              🔧 Fix Now
            </button>
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
  }

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
