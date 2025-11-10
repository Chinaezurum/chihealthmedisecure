import { test, expect } from '@playwright/test';

test.describe('Appointment Booking Workflow', () => {
  test('should allow a patient to book a new appointment and see it in their list', async ({ page }) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateString = futureDate.toISOString().split('T')[0];
    const appointmentTime = '14:30';
    const doctorName = 'Dr. Okoro';
    const department = 'Dermatology';

    // 1. Log in as the patient
    await test.step('Patient logs in', async () => {
      await page.goto('/');
      await page.getByLabel('Email Address').fill('amina.bello@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      // Use a broader regex to accommodate different greetings
      await expect(page.getByRole('heading', { name: /Good (Morning|Afternoon|Evening), Amina/i })).toBeVisible({ timeout: 10000 });
    });

    // 2. Navigate to the Appointments view
    await test.step('Navigate to Appointments', async () => {
      await page.getByRole('button', { name: 'Appointments' }).click();
      await expect(page.getByRole('heading', { name: 'My Appointments' })).toBeVisible();
    });

    // 3. Open the booking modal and fill out the form
    await test.step('Fill out booking form', async () => {
      await page.getByRole('button', { name: 'Book New Appointment' }).click();
      await expect(page.getByRole('heading', { name: 'Book a New Appointment' })).toBeVisible();

      await page.getByLabel('Select Department').selectOption(department);
      // The doctor dropdown is now enabled and filtered
      await page.getByLabel('Select Doctor').selectOption({ label: `${doctorName} (${department})` });
      await page.getByLabel('Preferred Date').fill(dateString);
      await page.getByLabel('Preferred Time').fill(appointmentTime);

      await page.getByRole('button', { name: 'Confirm Booking' }).click();
    });

    // 4. Verify the appointment was booked
    await test.step('Verify new appointment', async () => {
      // Check for success toast
      await expect(page.getByText('Appointment booked successfully!')).toBeVisible();
      
      // Modal should be closed
      await expect(page.getByRole('heading', { name: 'Book a New Appointment' })).not.toBeVisible();

      // Find the new appointment in the "Upcoming Appointments" list
      const upcomingList = page.locator('div', { has: page.getByRole('heading', { name: 'Upcoming Appointments' }) });
      
      const newAppointmentItem = upcomingList.locator('li', { hasText: doctorName });
      await expect(newAppointmentItem).toBeVisible();
      await expect(newAppointmentItem).toContainText(department);
      
      // Check for the date.
      const expectedDateString = futureDate.toDateString(); // e.g., "Mon Jul 29 2024"
      await expect(newAppointmentItem).toContainText(expectedDateString);
      await expect(newAppointmentItem).toContainText(appointmentTime);
    });
  });
});
