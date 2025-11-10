import React from 'react';

// Mock data for demonstration
const mockLogs = [
  { id: 1, timestamp: new Date().toISOString(), user: 'admin@chihealth.com', action: 'LOGIN_SUCCESS', details: 'User logged in from IP 192.168.1.1' },
  { id: 2, timestamp: new Date(Date.now() - 5 * 60000).toISOString(), user: 'dr.adebayo@chihealth.com', action: 'CREATE_PRESCRIPTION', details: 'Prescription for Lisinopril created for patient user-patient-01' },
  { id: 3, timestamp: new Date(Date.now() - 10 * 60000).toISOString(), user: 'nurse.joy@chihealth.com', action: 'UPDATE_VITALS', details: 'Vitals updated for patient user-patient-02' },
  { id: 4, timestamp: new Date(Date.now() - 12 * 60000).toISOString(), user: 'pharma.ken@chihealth.com', action: 'UPDATE_PRESCRIPTION_STATUS', details: 'Prescription rx-001 marked as Filled' },
  { id: 5, timestamp: new Date(Date.now() - 15 * 60000).toISOString(), user: 'admin@chihealth.com', action: 'CREATE_USER', details: 'New staff member "Dr. Funmi" created' },
  { id: 6, timestamp: new Date(Date.now() - 25 * 60000).toISOString(), user: 'receptionist@chihealth.com', action: 'PATIENT_CHECK_IN', details: 'Patient user-patient-01 checked in for appointment appt-001' },
];

const getActionChipClass = (action: string) => {
    if (action.includes('CREATE')) return 'status-chip-green';
    if (action.includes('UPDATE')) return 'status-chip-cyan';
    if (action.includes('LOGIN')) return 'status-chip-slate';
    return 'status-chip-amber';
};

export const AuditLogView: React.FC = () => {
  return (
    <>
      <h2 className="text-3xl font-bold text-text-primary mb-6">System Audit Log</h2>
      <div className="content-card">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {mockLogs.map(log => (
              <tr key={log.id}>
                <td className="font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.user}</td>
                <td><span className={`status-chip ${getActionChipClass(log.action)}`}>{log.action}</span></td>
                <td className="text-sm">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
