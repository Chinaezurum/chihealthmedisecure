import React from 'react';
import { Prescription } from '../../types.ts';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { PillIcon } from '../../components/icons/index.tsx';

interface PrescriptionsViewProps {
  prescriptions: Prescription[];
}

export const PrescriptionsView: React.FC<PrescriptionsViewProps> = ({ prescriptions }) => {
  const getStatusChipClass = (status: Prescription['status']) => {
    switch (status) {
      case 'Active': return 'status-chip-green';
      case 'Filled': return 'status-chip-cyan';
      default: return 'status-chip-slate';
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold text-text-primary mb-6">My Prescriptions</h2>
      <div className="content-card">
        {prescriptions.length > 0 ? (
          <table className="styled-table">
            <thead>
              <tr>
                <th>Start Date</th>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map(rx => (
                <tr key={rx.id}>
                  <td>{new Date(rx.startDate).toLocaleDateString()}</td>
                  <td className="font-medium">{rx.medication}</td>
                  <td>{rx.dosage}</td>
                  <td>{rx.frequency}</td>
                  <td>
                    <span className={`status-chip ${getStatusChipClass(rx.status)}`}>
                      {rx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState icon={PillIcon} title="No Prescriptions" message="You do not have any prescriptions on record." />
        )}
      </div>
    </>
  );
};