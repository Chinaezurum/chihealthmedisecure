import React from 'react';
import { Button } from '../../components/common/Button.tsx';
import { Appointment, Patient } from '../../types.ts';
import { EmptyState } from '../../components/common/EmptyState.tsx';

interface CheckInViewProps {
  appointments: Appointment[];
  patients: Patient[];
  onCheckIn: (appointmentId: string) => void;
}

export const CheckInView: React.FC<CheckInViewProps> = ({ appointments, patients, onCheckIn }) => {
  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments.filter(a => a.date === today);

  const getPatientName = (patientId: string) => patients.find(p => p.id === patientId)?.name || 'Unknown';

  const getStatusChip = (status: Appointment['status']) => {
    switch (status) {
        case 'Checked-in':
            return <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300">{status}</span>;
        case 'Confirmed':
             return <span className="px-3 py-1 text-xs font-medium rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">{status}</span>;
        case 'Completed':
             return <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">{status}</span>;
        default:
             return <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">{status}</span>;
    }
  }

  return (
    <>
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">Patient Check-In for Today</h2>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
        {todaysAppointments.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="p-4 font-semibold">Time</th>
                <th className="p-4 font-semibold">Patient Name</th>
                <th className="p-4 font-semibold">Doctor</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {todaysAppointments.sort((a,b) => a.time.localeCompare(b.time)).map(appt => (
                <tr key={appt.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-semibold">{appt.time}</td>
                  <td className="p-4">{getPatientName(appt.patientId)}</td>
                  <td className="p-4">{appt.doctorName}</td>
                  <td className="p-4">
                      {getStatusChip(appt.status)}
                  </td>
                  <td className="p-4">
                      {appt.status === 'Confirmed' ? (
                          <Button onClick={() => onCheckIn(appt.id)}>Check In</Button>
                      ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-sm">No Action</span>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No Appointments Today" message="There are no appointments scheduled for today's date." />
        )}
      </div>
    </>
  );
};