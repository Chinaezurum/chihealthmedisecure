import React, { useState, useEffect } from 'react';
import { Appointment, Room } from '../../types.ts';
import { Button } from '../../components/common/Button.tsx';
import { BookingModal } from './BookingModal.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from '../../components/icons/index.tsx';
import * as api from '../../services/apiService.ts';
import { ConfirmationModal } from '../../components/common/ConfirmationModal.tsx';
import { RescheduleModal } from '../../components/common/RescheduleModal.tsx';

interface AppointmentsViewProps {
  appointments: Appointment[];
  rooms: Room[];
  onBookAppointment: (newAppointment: Omit<Appointment, 'id' | 'status' | 'patientId'>) => void;
  suggestedSpecialty?: string | null;
  onSuggestionHandled: () => void;
  onRefresh?: () => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ appointments, rooms, onBookAppointment, suggestedSpecialty, onSuggestionHandled, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [activeAppt, setActiveAppt] = useState<Appointment | null>(null);

  useEffect(() => {
    if (suggestedSpecialty) {
      setIsModalOpen(true);
    }
  }, [suggestedSpecialty]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (suggestedSpecialty) {
      onSuggestionHandled();
    }
  };

  const normalizeDate = (value: string) => {
    const parsed = new Date(value);
    parsed.setHours(0, 0, 0, 0);
    return parsed.getTime();
  };
  const today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();

  const upcomingAppointments = appointments.filter(a => normalizeDate(a.date) >= today && a.status !== 'Completed' && a.status !== 'Cancelled');
  const pastAppointments = appointments.filter(a => normalizeDate(a.date) < today || a.status === 'Completed' || a.status === 'Cancelled');

  const formatAppointmentDate = (date: string, time: string) => {
    const appointmentDate = new Date(`${date}T${time}`);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = appointmentDate.toDateString() === today.toDateString();
    const isTomorrow = appointmentDate.toDateString() === tomorrow.toDateString();
    
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    
    return appointmentDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: appointmentDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <>
      <div className="appointments-page-header">
        <div>
          <h2 className="appointments-page-title">My Appointments</h2>
          <p className="appointments-page-subtitle">View your upcoming and past appointments.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="appointments-book-button"
        >
          <CalendarIcon className="w-5 h-5" />
          <span>Book New Appointment</span>
        </button>
      </div>

      <div className="appointments-sections">
        <div className="appointments-section">
          <div className="appointments-section-header">
            <h3 className="appointments-section-title">Upcoming Appointments</h3>
            {upcomingAppointments.length > 0 && (
              <span className="appointments-count">{upcomingAppointments.length}</span>
            )}
          </div>
          {upcomingAppointments.length > 0 ? (
            <div className="appointments-grid">
              {upcomingAppointments.sort((a,b) => {
                const dateA = new Date(`${a.date}T${a.time}`).getTime();
                const dateB = new Date(`${b.date}T${b.time}`).getTime();
                return dateA - dateB;
              }).map(appt => {
                const appointmentDateTime = new Date(`${appt.date}T${appt.time}`);
                const isUpcoming = appointmentDateTime > new Date();
                
                return (
                  <div key={appt.id} className="appointment-card appointment-card-upcoming">
                    <div className="appointment-card-header">
                      <div className="appointment-date-badge">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{formatAppointmentDate(appt.date, appt.time)}</span>
                      </div>
                      <span className={`appointment-status-badge appointment-status-${appt.status.toLowerCase()}`}>
                        {appt.status}
                      </span>
                    </div>
                    
                    <div className="appointment-card-body">
                      <div className="appointment-specialty">{appt.specialty}</div>
                      <div className="appointment-doctor-info">
                        <UserIcon className="w-4 h-4" />
                        <span>{appt.doctorName}</span>
                      </div>
                      
                      <div className="appointment-details">
                        <div className="appointment-detail-item">
                          <ClockIcon className="w-4 h-4" />
                          <span>{formatTime(appt.time)}</span>
                        </div>
                        <div className="appointment-detail-item">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{appt.consultingRoomName}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="appointment-card-actions">
                      <button 
                        className="appointment-action-button appointment-action-cancel"
                        onClick={() => { setActiveAppt(appt); setConfirmOpen(true); }}
                      >
                        Cancel
                      </button>
                      <button 
                        className="appointment-action-button appointment-action-reschedule"
                        onClick={() => { setActiveAppt(appt); setRescheduleOpen(true); }}
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="appointments-empty-state">
              <EmptyState icon={CalendarIcon} title="No Upcoming Appointments" message="You can book a new appointment using the button above." />
            </div>
          )}
        </div>
        
        <div className="appointments-section">
          <div className="appointments-section-header">
            <h3 className="appointments-section-title">Past Appointments</h3>
            {pastAppointments.length > 0 && (
              <span className="appointments-count">{pastAppointments.length}</span>
            )}
          </div>
          {pastAppointments.length > 0 ? (
            <div className="appointments-grid">
              {pastAppointments.sort((a,b) => {
                const dateA = new Date(`${a.date}T${a.time}`).getTime();
                const dateB = new Date(`${b.date}T${b.time}`).getTime();
                return dateB - dateA;
              }).map(appt => (
                <div key={appt.id} className="appointment-card appointment-card-past">
                  <div className="appointment-card-header">
                    <div className="appointment-date-badge">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{formatAppointmentDate(appt.date, appt.time)}</span>
                    </div>
                    <span className={`appointment-status-badge appointment-status-${appt.status.toLowerCase()}`}>
                      {appt.status}
                    </span>
                  </div>
                  
                  <div className="appointment-card-body">
                    <div className="appointment-specialty">{appt.specialty}</div>
                    <div className="appointment-doctor-info">
                      <UserIcon className="w-4 h-4" />
                      <span>{appt.doctorName}</span>
                    </div>
                    
                    <div className="appointment-details">
                      <div className="appointment-detail-item">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatTime(appt.time)}</span>
                      </div>
                      {appt.consultingRoomName && (
                        <div className="appointment-detail-item">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{appt.consultingRoomName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="appointments-empty-state">
              <EmptyState icon={CalendarIcon} title="No Past Appointments" message="Your completed appointment history will appear here." />
            </div>
          )}
        </div>
      </div>

      <BookingModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onBookAppointment={onBookAppointment} 
        suggestedSpecialty={suggestedSpecialty}
        rooms={rooms}
      />
      <ConfirmationModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={async () => {
        if (!activeAppt) return;
        try {
          await api.deleteAppointment(activeAppt.id);
          if (onRefresh) onRefresh(); else window.location.reload();
        } catch (err: any) {
          alert('Failed to cancel: ' + (err.message || err));
        }
      }} title="Cancel Appointment" message={`Are you sure you want to cancel the appointment on ${activeAppt ? new Date(activeAppt.date).toDateString() + ' at ' + activeAppt.time : ''}?`} type="danger" />

      <RescheduleModal isOpen={rescheduleOpen} onClose={() => setRescheduleOpen(false)} initialDate={activeAppt?.date} initialTime={activeAppt?.time} onSave={async (date, time) => {
        if (!activeAppt) return;
        await api.rescheduleAppointment(activeAppt.id, { date, time });
        if (onRefresh) onRefresh(); else window.location.reload();
      }} />
    </>
  );
};