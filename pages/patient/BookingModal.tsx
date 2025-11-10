import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Select } from '../../components/common/Select.tsx';
import { Appointment, Room } from '../../types.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import { CalendarIcon, ClockIcon, UserIcon, MapPinIcon, FileTextIcon } from '../../components/icons/index.tsx';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookAppointment: (newAppointment: Omit<Appointment, 'id' | 'status' | 'patientId'>) => Promise<void>;
  suggestedSpecialty?: string | null;
  rooms: Room[];
}

const allDoctors = [
    { id: 'user-hcw-01', name: 'Dr. Adebayo', specialty: 'Cardiology' },
    { id: 'user-hcw-02', name: 'Dr. Okoro', specialty: 'Dermatology' },
    { id: 'user-hcw-03', name: 'Dr. Chike', specialty: 'General Practice' },
    { id: 'user-hcw-04', name: 'Dr. Nwosu', specialty: 'Neurology' },
    { id: 'user-hcw-05', name: 'Dr. Ibrahim', specialty: 'Cardiology' },
];

const allDepartments = [...new Set(allDoctors.map(d => d.specialty))];

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onBookAppointment, suggestedSpecialty, rooms }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToasts();
  const [department, setDepartment] = useState(suggestedSpecialty || '');
  const [filteredDoctors, setFilteredDoctors] = useState(allDoctors);
  
  const consultingRooms = rooms.filter(r => r.type === 'Consulting Room');

  useEffect(() => {
    if (department) {
      setFilteredDoctors(allDoctors.filter(d => d.specialty === department));
    } else {
      setFilteredDoctors(allDoctors);
    }
  }, [department]);

  useEffect(() => {
    if (suggestedSpecialty) {
        setDepartment(suggestedSpecialty);
    }
  }, [suggestedSpecialty]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any event bubbling that might cause issues
    
    const formData = new FormData(e.currentTarget);
    const doctorInfo = (formData.get('doctor') as string)?.split('|') || [];
    const roomInfo = (formData.get('consultingRoomId') as string)?.split('|') || [];
    
    // Validate required fields
    if (!doctorInfo[0] || !roomInfo[0] || !formData.get('date') || !formData.get('time')) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }
    
    const newAppointment = {
        doctorId: doctorInfo[0],
        doctorName: doctorInfo[1] || '',
        specialty: doctorInfo[2] || '',
        date: formData.get('date') as string,
        time: formData.get('time') as string,
        consultingRoomId: roomInfo[0],
        consultingRoomName: roomInfo[1] || '',
    };

    setIsLoading(true);
    try {
        // Call the parent handler which will handle the API call
        await onBookAppointment(newAppointment);
        // Only close and show success if no error was thrown
        onClose();
    } catch (error: any) {
        // Error is already handled in handleBookAppointment, just stop loading
        // Don't re-throw or do anything that might cause sign out
        console.error('Booking error in modal:', error);
        // Don't close modal on error so user can retry
        // Error message is already shown by handleBookAppointment
    } finally {
        setIsLoading(false);
    }
  }

  const footerContent = (
    <>
      <button
        onClick={onClose}
        type="button"
        className="booking-cancel-button"
      >
        Cancel
      </button>
      <Button type="submit" form="bookingForm" isLoading={isLoading} className="booking-confirm-button">
        Confirm Booking
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" footer={footerContent}>
      <div className="booking-modal-wrapper">
        <div className="booking-modal-header">
          <div className="booking-modal-icon-wrapper">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="booking-modal-title">Book a New Appointment</h2>
            <p className="booking-modal-subtitle">Fill in the details below to schedule your appointment</p>
          </div>
        </div>

        <form id="bookingForm" onSubmit={handleSubmit} className="booking-form-modern">
          <div className="booking-form-section">
            <h3 className="booking-form-section-title">
              <UserIcon className="w-4 h-4" />
              <span>Doctor & Department</span>
            </h3>
            <div className="booking-form-grid">
              <div className="booking-form-field">
                <Select label="Select Department" name="department" value={department} onChange={(e) => setDepartment(e.target.value)} required>
                    <option value="">Choose a department...</option>
                    {allDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </Select>
              </div>
              
              <div className="booking-form-field">
                <Select label="Select Doctor" name="doctor" required disabled={!department}>
                    <option value="">Choose a doctor...</option>
                    {filteredDoctors.map(doc => (
                         <option key={doc.id} value={`${doc.id}|${doc.name}|${doc.specialty}`}>{doc.name} ({doc.specialty})</option>
                    ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="booking-form-section">
            <h3 className="booking-form-section-title">
              <MapPinIcon className="w-4 h-4" />
              <span>Location</span>
            </h3>
            <div className="booking-form-grid">
              <div className="booking-form-field booking-form-field-full">
                <Select label="Select Consulting Room" name="consultingRoomId" required>
                    <option value="">Choose a consulting room...</option>
                    {consultingRooms.map(room => (
                         <option key={room.id} value={`${room.id}|${room.name}`}>{room.name}</option>
                    ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="booking-form-section">
            <h3 className="booking-form-section-title">
              <ClockIcon className="w-4 h-4" />
              <span>Date & Time</span>
            </h3>
            <div className="booking-form-grid">
              <div className="booking-form-field">
                <Input label="Preferred Date" name="date" type="date" required min={new Date().toISOString().split("T")[0]} />
              </div>
              
              <div className="booking-form-field">
                <Input label="Preferred Time" name="time" type="time" required />
              </div>
            </div>
          </div>
          
          <div className="booking-form-section">
            <h3 className="booking-form-section-title">
              <FileTextIcon className="w-4 h-4" />
              <span>Additional Information</span>
            </h3>
            <div className="booking-form-field booking-form-field-full">
              <Input name="reason" label="Reason for Visit (optional)" placeholder="e.g. Annual Checkup, Follow-up, Consultation..." multiline rows={4} />
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
