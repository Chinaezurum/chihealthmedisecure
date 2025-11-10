import React from 'react';
import { Button } from '../../components/common/Button.tsx';
import { TransportRequest } from '../../types.ts';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TruckIcon } from '../../components/icons/index.tsx';

interface TransportViewProps {
  requests: TransportRequest[];
  onUpdateStatus: (id: string, status: TransportRequest['status']) => void;
}

const RequestCard: React.FC<{ request: TransportRequest; onUpdateStatus: TransportViewProps['onUpdateStatus'] }> = ({ request, onUpdateStatus }) => (
    <div className="kanban-card">
        <div className="flex justify-between items-center">
            <h4 className="font-bold text-text-primary">{request.type} Request</h4>
            <span className="font-mono text-xs text-text-tertiary">{request.id}</span>
        </div>
        <p className="text-sm"><span className="text-text-secondary">From:</span> {request.from}</p>
        <p className="text-sm"><span className="text-text-secondary">To:</span> {request.to}</p>
        <div className="flex gap-2 pt-3">
          {request.status === 'Pending' && <Button onClick={() => onUpdateStatus(request.id, 'In-Transit')} fullWidth>Accept & Start</Button>}
          {request.status === 'In-Transit' && <Button onClick={() => onUpdateStatus(request.id, 'Delivered')} fullWidth>Mark as Delivered</Button>}
        </div>
    </div>
);

const KanbanColumn: React.FC<{ title: string, count: number, colorClass: string, children: React.ReactNode }> = ({title, count, colorClass, children}) => (
    <div className="kanban-column">
        <h3 className={`font-semibold ${colorClass}`}>{title} ({count})</h3>
        <div className="kanban-column-content">
            {children}
        </div>
    </div>
);


export const TransportView: React.FC<TransportViewProps> = ({ requests, onUpdateStatus }) => {
  const pending = requests.filter(r => r.status === 'Pending');
  const inTransit = requests.filter(r => r.status === 'In-Transit');
  const delivered = requests.filter(r => r.status === 'Delivered');

  return (
    <>
      <h2 className="text-3xl font-bold text-text-primary mb-6">Transport Requests</h2>
      <div className="kanban-board">
        <KanbanColumn title="Pending" count={pending.length} colorClass="text-amber-500">
          {pending.length > 0 ? pending.map(req => <RequestCard key={req.id} request={req} onUpdateStatus={onUpdateStatus} />) : <EmptyState icon={TruckIcon} title="No Pending Requests" message="" />}
        </KanbanColumn>

        <KanbanColumn title="In-Transit" count={inTransit.length} colorClass="text-cyan-500">
           {inTransit.length > 0 ? inTransit.map(req => <RequestCard key={req.id} request={req} onUpdateStatus={onUpdateStatus} />) : <EmptyState icon={TruckIcon} title="No Requests In Transit" message="" />}
        </KanbanColumn>
        
        <KanbanColumn title="Delivered" count={delivered.length} colorClass="text-green-500">
            {delivered.length > 0 ? delivered.map(req => <RequestCard key={req.id} request={req} onUpdateStatus={onUpdateStatus} />) : <EmptyState icon={TruckIcon} title="No Delivered Requests" message="" />}
        </KanbanColumn>
      </div>
    </>
  );
};