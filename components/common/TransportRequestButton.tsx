import React, { useState } from 'react';
import { TruckIcon } from '../icons/index.tsx';
import { CreateTransportRequestModal } from './CreateTransportRequestModal.tsx';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';

interface TransportRequestButtonProps {
  currentUserId: string;
  currentUserName: string;
  currentLocation?: string;
  organizationId: string;
  className?: string;
  variant?: 'default' | 'icon' | 'text';
  onRequestCreated?: () => void;
}

export const TransportRequestButton: React.FC<TransportRequestButtonProps> = ({
  currentUserId,
  currentUserName,
  currentLocation,
  organizationId,
  className = '',
  variant = 'default',
  onRequestCreated
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToasts();

  const handleCreateRequest = async (requestData: any) => {
    try {
      await api.createTransportRequest(requestData);
      
      // Audit logging
      const auditLog = {
        timestamp: new Date().toISOString(),
        userId: currentUserId,
        action: 'transport_request_created',
        requestType: requestData.type,
        from: requestData.from,
        to: requestData.to,
        priority: requestData.priority,
        organizationId
      };
      console.log('Transport Request Created Audit:', auditLog);
      
      addToast('Transport request submitted successfully. Logistics has been notified.', 'success');
      setIsModalOpen(false);
      
      if (onRequestCreated) {
        onRequestCreated();
      }
    } catch (error) {
      console.error('Failed to create transport request:', error);
      addToast('Failed to create transport request. Please try again.', 'error');
    }
  };

  const renderButton = () => {
    switch (variant) {
      case 'icon':
        return (
          <button
            onClick={() => setIsModalOpen(true)}
            className={`p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors ${className}`}
            title="Request Transport"
          >
            <TruckIcon className="w-5 h-5" />
          </button>
        );
      
      case 'text':
        return (
          <button
            onClick={() => setIsModalOpen(true)}
            className={`text-primary hover:text-primary/80 transition-colors flex items-center gap-1 ${className}`}
          >
            <TruckIcon className="w-4 h-4" />
            <span className="text-sm">Request Transport</span>
          </button>
        );
      
      default:
        return (
          <button
            onClick={() => setIsModalOpen(true)}
            className={`px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 ${className}`}
          >
            <TruckIcon className="w-5 h-5" />
            <span>Request Transport</span>
          </button>
        );
    }
  };

  return (
    <>
      {renderButton()}
      
      <CreateTransportRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateRequest={handleCreateRequest}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentLocation={currentLocation}
      />
    </>
  );
};
