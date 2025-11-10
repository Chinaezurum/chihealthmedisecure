// Fix: Add React import for JSX usage in test file.
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppointmentsView } from './AppointmentsView.tsx';
import { Appointment } from '../../types.ts';
import { ToastProvider } from '../../contexts/ToastContext.tsx';

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);
const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);

const mockAppointments: Appointment[] = [
  { id: 'appt-1', patientId: 'p1', doctorName: 'Dr. House', doctorId: 'd1', date: tomorrow.toISOString().split('T')[0], time: '10:00', specialty: 'Diagnostics', status: 'Confirmed' },
  { id: 'appt-2', patientId: 'p1', doctorName: 'Dr. Wilson', doctorId: 'd2', date: yesterday.toISOString().split('T')[0], time: '14:00', specialty: 'Oncology', status: 'Completed' },
  { id: 'appt-3', patientId: 'p1', doctorName: 'Dr. Cuddy', doctorId: 'd3', date: today.toISOString().split('T')[0], time: '12:00', specialty: 'Administration', status: 'Confirmed' },
];

const renderWithProvider = (ui: React.ReactElement) => {
    return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('AppointmentsView', () => {
  const onBookAppointment = vi.fn();
  const onSuggestionHandled = vi.fn();

  it('renders upcoming and past appointments correctly', () => {
    renderWithProvider(<AppointmentsView appointments={mockAppointments} rooms={[]} onBookAppointment={onBookAppointment} onSuggestionHandled={onSuggestionHandled} />);
    
    // Check for Upcoming Appointments section
    const upcomingSection = screen.getByText('Upcoming Appointments').closest('div');
    expect(upcomingSection).toHaveTextContent('Dr. House'); // Tomorrow's appt
    expect(upcomingSection).toHaveTextContent('Dr. Cuddy'); // Today's appt
    expect(upcomingSection).not.toHaveTextContent('Dr. Wilson');

    // Check for Past Appointments section
    const pastSection = screen.getByText('Past Appointments').closest('div');
    expect(pastSection).toHaveTextContent('Dr. Wilson');
    expect(pastSection).not.toHaveTextContent('Dr. House');
  });

  it('shows no appointments message when lists are empty', () => {
    renderWithProvider(<AppointmentsView appointments={[]} rooms={[]} onBookAppointment={onBookAppointment} onSuggestionHandled={onSuggestionHandled} />);
    expect(screen.getByText('No Upcoming Appointments')).toBeInTheDocument();
    expect(screen.getByText('No Past Appointments')).toBeInTheDocument();
  });

  it('opens the booking modal when "Book New Appointment" is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<AppointmentsView appointments={[]} rooms={[]} onBookAppointment={onBookAppointment} onSuggestionHandled={onSuggestionHandled} />);
    
    await user.click(screen.getByRole('button', { name: 'Book New Appointment' }));

    // The modal itself is a separate component, but we can check for its title to appear
    expect(await screen.findByRole('heading', { name: 'Book a New Appointment' })).toBeInTheDocument();
  });

  it('opens the booking modal with a suggested specialty', () => {
    renderWithProvider(<AppointmentsView appointments={[]} rooms={[]} onBookAppointment={onBookAppointment} onSuggestionHandled={onSuggestionHandled} suggestedSpecialty="Cardiology" />);
    
    expect(screen.getByRole('heading', { name: 'Book a New Appointment' })).toBeInTheDocument();
    // Check if the select dropdown has the suggested value
    expect(screen.getByDisplayValue('Cardiology')).toBeInTheDocument();
  });
});