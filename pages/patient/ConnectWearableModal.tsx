import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Select } from '../../components/common/Select.tsx';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';

interface ConnectWearableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const ConnectWearableModal: React.FC<ConnectWearableModalProps> = ({ isOpen, onClose, onConnected }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [deviceName, setDeviceName] = useState('My Watch');
  const [deviceType, setDeviceType] = useState('watch');
  const { addToast } = useToasts();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Attempt to call the backend to add a wearable device. If backend route doesn't exist, fall back to simulate call.
      if ((api as any).addWearableDevice) {
        await (api as any).addWearableDevice({ name: deviceName, type: deviceType });
      } else {
        await api.simulateWearableData();
      }
      if (onConnected) onConnected();
      onClose();
      addToast('Wearable connected successfully', 'success');
    } catch (err) {
      console.error('Failed to connect wearable', err);
      // Try to surface a useful error message
      const msg = err && (err as any).message ? (err as any).message : 'Failed to connect wearable device';
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <>
      <button
        onClick={onClose}
        type="button"
        className="wearable-modal-cancel-button"
      >
        Cancel
      </button>
      <Button type="button" onClick={handleConnect} isLoading={isLoading} className="wearable-modal-connect-button">
        Connect
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" footer={footer}>
      <div className="wearable-modal-wrapper">
        <div className="wearable-modal-header">
          <div className="wearable-modal-icon-wrapper">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="wearable-modal-title">Connect a Wearable Device</h2>
            <p className="wearable-modal-subtitle">Stream vitals and activity data into your dashboard</p>
          </div>
        </div>

        <form className="wearable-modal-form" onSubmit={(e) => { e.preventDefault(); handleConnect(); }}>
          <div className="wearable-form-section">
            <h3 className="wearable-form-section-title">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span>Device Information</span>
            </h3>
            <div className="wearable-form-grid">
              <div className="wearable-form-field">
                <Input
                  label="Device Name"
                  name="deviceName"
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g., My Watch, Fitness Tracker..."
                  required
                />
              </div>
              <div className="wearable-form-field">
                <Select
                  label="Device Type"
                  name="deviceType"
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                  required
                >
                  <option value="watch">Smart Watch</option>
                  <option value="ring">Smart Ring</option>
                  <option value="patch">Health Patch</option>
                  <option value="band">Fitness Band</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="wearable-modal-note">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>In this demo, the connection will either call the simulator or the backend device registration endpoint if available.</p>
          </div>
        </form>
      </div>
    </Modal>
  );
};
