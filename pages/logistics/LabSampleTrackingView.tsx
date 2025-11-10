import React from 'react';
import { Button } from '../../components/common/Button.tsx';
import { LabTest } from '../../types.ts';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { MicroscopeIcon } from '../../components/icons/index.tsx';

interface LabSampleTrackingViewProps {
  labTests: LabTest[];
  onUpdateStatus: (id: string, status: LabTest['status']) => void;
}

const SampleCard: React.FC<{ test: LabTest; onUpdateStatus: LabSampleTrackingViewProps['onUpdateStatus'] }> = ({ test, onUpdateStatus }) => (
    <div className="kanban-card">
        <div className="flex justify-between items-center">
            <h4 className="font-bold text-text-primary">{test.patientName}</h4>
            <span className="font-mono text-xs text-text-tertiary">{test.id}</span>
        </div>
        <p className="text-sm font-medium text-primary">{test.testName}</p>
        <div className="flex gap-2 pt-3">
            {test.status === 'Awaiting Pickup' && <Button onClick={() => onUpdateStatus(test.id, 'In Transit')} fullWidth>Mark In Transit</Button>}
            {test.status === 'In Transit' && <Button onClick={() => onUpdateStatus(test.id, 'Delivered')} fullWidth>Mark as Delivered</Button>}
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


export const LabSampleTrackingView: React.FC<LabSampleTrackingViewProps> = ({ labTests, onUpdateStatus }) => {
  const awaitingPickup = labTests.filter(t => t.status === 'Awaiting Pickup');
  const inTransit = labTests.filter(t => t.status === 'In Transit');
  const delivered = labTests.filter(t => t.status === 'Delivered');

  return (
    <>
      <h2 className="text-3xl font-bold text-text-primary mb-6">Lab Sample Tracking</h2>
      <div className="kanban-board">
        <KanbanColumn title="Awaiting Pickup" count={awaitingPickup.length} colorClass="text-amber-500">
          {awaitingPickup.length > 0 ? awaitingPickup.map(test => <SampleCard key={test.id} test={test} onUpdateStatus={onUpdateStatus} />) : <EmptyState icon={MicroscopeIcon} title="No Samples Awaiting Pickup" message="" />}
        </KanbanColumn>

        <KanbanColumn title="In-Transit" count={inTransit.length} colorClass="text-cyan-500">
           {inTransit.length > 0 ? inTransit.map(test => <SampleCard key={test.id} test={test} onUpdateStatus={onUpdateStatus} />) : <EmptyState icon={MicroscopeIcon} title="No Samples In Transit" message="" />}
        </KanbanColumn>
        
        <KanbanColumn title="Delivered" count={delivered.length} colorClass="text-green-500">
            {delivered.length > 0 ? delivered.map(test => <SampleCard key={test.id} test={test} onUpdateStatus={onUpdateStatus} />) : <EmptyState icon={MicroscopeIcon} title="No Samples Delivered" message="" />}
        </KanbanColumn>
      </div>
    </>
  );
};