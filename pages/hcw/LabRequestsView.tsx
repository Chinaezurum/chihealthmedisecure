import React from 'react';
import { LabTest } from '../../types.ts';
import { EmptyState } from '../../components/common/EmptyState.tsx';

interface LabRequestsViewProps {
    labTests: LabTest[];
}

export const LabRequestsView: React.FC<LabRequestsViewProps> = ({ labTests }) => {
    
    const getStatusChipClass = (status: LabTest['status']) => {
        switch (status) {
            case 'Completed': return 'status-chip-green';
            case 'In-progress': return 'status-chip-cyan';
            case 'Ordered': return 'status-chip-amber';
            default: return 'status-chip-slate';
        }
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-text-primary mb-6">Lab Test Requests</h2>
            <div className="content-card">
              {labTests.length > 0 ? (
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Date Ordered</th>
                            <th>Patient Name</th>
                            <th>Test Name</th>
                            <th>Status</th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {labTests.map(test => (
                            <tr key={test.id}>
                                <td>{test.dateOrdered}</td>
                                <td className="font-medium">{test.patientName}</td>
                                <td>{test.testName}</td>
                                <td>
                                    <span className={`status-chip ${getStatusChipClass(test.status)}`}>
                                        {test.status}
                                    </span>
                                </td>
                                <td className="font-mono">{test.result || 'Pending'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              ) : (
                <EmptyState title="No Lab Tests Ordered" message="You can order lab tests from a patient's EHR view." />
              )}
            </div>
        </>
    );
};