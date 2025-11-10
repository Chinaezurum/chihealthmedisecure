
import React from 'react';
import { Appointment, Patient } from '../../types.ts';
import { VideoIcon } from '../../components/icons/index.tsx';
import * as api from '../../services/apiService.ts';
import { ConfirmationModal } from '../../components/common/ConfirmationModal.tsx';
import { RescheduleModal } from '../../components/common/RescheduleModal.tsx';
import { useState } from 'react';

interface ScheduleViewProps {
    appointments: Appointment[];
    patients: Patient[];
    onStartCall: (patientId: string) => void;
  onRefresh?: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ appointments, patients, onStartCall, onRefresh }) => {
  const today = new Date().toISOString().split('T')[0];
  const todaySchedule = appointments.filter(a => a.date === today);
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [activeAppt, setActiveAppt] = useState<Appointment | null>(null);
  const getPatientName = (patientId: string) => {
    return patients.find(p => p.id === patientId)?.name || patientId;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Today's Schedule</h2>
          <p className="text-slate-500 dark:text-slate-400">Your appointments for {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
        {todaySchedule.length > 0 ? (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {todaySchedule.sort((a,b) => a.time.localeCompare(b.time)).map(appt => (
              <li key={appt.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 p-3 rounded-lg w-24 text-center">
                    <span className="font-bold text-lg">{appt.time}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{getPatientName(appt.patientId)}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Consultation ({appt.patientId})</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <button onClick={() => onStartCall(appt.patientId)} className="flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 font-semibold transition-colors">
                        <VideoIcon className="w-5 h-5"/>
                        Join Call
                    </button>
                    <div className="flex items-center gap-3">
                      <button className="link-button" onClick={() => { setActiveAppt(appt); setConfirmOpen(true); }}>Cancel</button>
                      <button className="link-button" onClick={() => { setActiveAppt(appt); setRescheduleOpen(true); }}>Reschedule</button>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${appt.status === 'Confirmed' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'}`}>{appt.status}</span>
                    </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
            <p className="p-6 text-slate-500 dark:text-slate-400">No appointments scheduled for today.</p>
        )}
      </div>
      <ConfirmationModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={async () => {
        if (!activeAppt) return;
        try { await api.deleteAppointment(activeAppt.id); if (onRefresh) onRefresh(); else window.location.reload(); } catch (err: any) { alert('Failed to cancel: ' + (err.message || err)); }
      }} title="Cancel Appointment" message={`Are you sure you want to cancel the appointment on ${activeAppt ? new Date(activeAppt.date).toDateString() + ' at ' + activeAppt.time : ''}?`} type="danger" />

      <RescheduleModal isOpen={rescheduleOpen} onClose={() => setRescheduleOpen(false)} initialDate={activeAppt?.date} initialTime={activeAppt?.time} onSave={async (date, time) => {
        if (!activeAppt) return;
        await api.rescheduleAppointment(activeAppt.id, { date, time });
        if (onRefresh) onRefresh(); else window.location.reload();
      }} />
    </>
  );
};