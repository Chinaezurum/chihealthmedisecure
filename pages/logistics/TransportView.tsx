import React from 'react';
import { Button } from '../../components/common/Button.tsx';
import { TransportRequest } from '../../types.ts';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TruckIcon } from '../../components/icons/index.tsx';

interface TransportViewProps {
  requests: TransportRequest[];
  onUpdateStatus: (id: string, status: TransportRequest['status']) => void;
  currentUserId?: string;
}

const RequestCard: React.FC<{ request: TransportRequest; onUpdateStatus: TransportViewProps['onUpdateStatus']; currentUserId?: string }> = ({ request, onUpdateStatus, currentUserId }) => {
  const handleStatusUpdate = (newStatus: TransportRequest['status']) => {
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: currentUserId || 'unknown',
      userRole: 'logistics',
      action: 'transport_status_change',
      requestId: request.id,
      requestType: request.type,
      from: request.from,
      to: request.to,
      oldStatus: request.status,
      newStatus,
    };
    console.log('Transport Status Change Audit:', auditLog);
    onUpdateStatus(request.id, newStatus);
  };
  
  const priorityColors = {
    Emergency: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    Urgent: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    Normal: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  };
  
  return (
    <div className="kanban-card">
        <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-text-primary">{request.type} Transport</h4>
            <span className="font-mono text-xs text-text-tertiary">{request.id}</span>
        </div>
        
        {request.priority && (
          <div className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mb-2 border ${priorityColors[request.priority] || priorityColors.Normal}`}>
            {request.priority === 'Emergency' ? '🚨 ' : request.priority === 'Urgent' ? '⚡ ' : ''}
            {request.priority}
          </div>
        )}
        
        {request.description && (
          <p className="text-sm text-text-secondary mb-2 line-clamp-2">{request.description}</p>
        )}
        
        <p className="text-sm mb-1"><span className="text-text-secondary">From:</span> <span className="font-medium text-text-primary">{request.from}</span></p>
        <p className="text-sm mb-2"><span className="text-text-secondary">To:</span> <span className="font-medium text-text-primary">{request.to}</span></p>
        
        {request.patientName && (
          <p className="text-sm mb-2 text-blue-600 dark:text-blue-400">
            👤 Patient: {request.patientName}
          </p>
        )}
        
        {request.requestedByName && (
          <p className="text-xs text-text-tertiary mb-2">
            Requested by: {request.requestedByName}
          </p>
        )}
        
        {request.contactPerson && (
          <p className="text-xs text-text-tertiary mb-2">
            Contact: {request.contactPerson}
            {request.contactPhone && ` • ${request.contactPhone}`}
          </p>
        )}
        
        <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          {request.status === 'Pending' && <Button onClick={() => handleStatusUpdate('In-Transit')} fullWidth>Accept & Start</Button>}
          {request.status === 'In-Transit' && <Button onClick={() => handleStatusUpdate('Delivered')} fullWidth>Mark as Delivered</Button>}
          {request.status === 'Delivered' && <span className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Delivered</span>}
        </div>
    </div>
  );
};

const KanbanColumn: React.FC<{ title: string, count: number, colorClass: string, children: React.ReactNode }> = ({title, count, colorClass, children}) => (
    <div className="kanban-column">
        <h3 className={`font-semibold ${colorClass}`}>{title} ({count})</h3>
        <div className="kanban-column-content">
            {children}
        </div>
    </div>
);


export const TransportView: React.FC<TransportViewProps> = ({ requests, onUpdateStatus, currentUserId }) => {
  const pending = requests.filter(r => r.status === 'Pending');
  const inTransit = requests.filter(r => r.status === 'In-Transit');
  const delivered = requests.filter(r => r.status === 'Delivered');

  return (
    <>
      <h2 className="text-3xl font-bold text-text-primary mb-4">Transport Requests</h2>
      
      {/* Audit Warning */}
      <div className="mb-6 p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          ℹ️ <strong>Audit Notice:</strong> All transport request updates and status changes are logged with timestamp and user information.
        </p>
      </div>
      
      <div className="kanban-board">
        <KanbanColumn title="Pending" count={pending.length} colorClass="text-amber-500">
          {pending.length > 0 ? pending.map(req => <RequestCard key={req.id} request={req} onUpdateStatus={onUpdateStatus} currentUserId={currentUserId} />) : <EmptyState icon={TruckIcon} title="No Pending Requests" message="" />}
        </KanbanColumn>

        <KanbanColumn title="In-Transit" count={inTransit.length} colorClass="text-cyan-500">
           {inTransit.length > 0 ? inTransit.map(req => <RequestCard key={req.id} request={req} onUpdateStatus={onUpdateStatus} currentUserId={currentUserId} />) : <EmptyState icon={TruckIcon} title="No Requests In Transit" message="" />}
        </KanbanColumn>
        
        <KanbanColumn title="Delivered" count={delivered.length} colorClass="text-green-500">
            {delivered.length > 0 ? delivered.map(req => <RequestCard key={req.id} request={req} onUpdateStatus={onUpdateStatus} currentUserId={currentUserId} />) : <EmptyState icon={TruckIcon} title="No Delivered Requests" message="" />}
        </KanbanColumn>
      </div>
    </>
  );
};