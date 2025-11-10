import { test, expect } from '@playwright/test';

test.describe('Check-in and Triage Workflow', () => {
  const patientName = 'Amina Bello';
  const appointmentTime = '10:00';

  test('should show a patient in the triage queue after being checked in', async ({ page }) => {
    
    // --- Step 1: Receptionist logs in and checks in the patient ---
    await test.step('Receptionist checks in patient', async () => {
      await page.goto('/');
      await page.getByLabel('Email Address').fill('receptionist@chihealth.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Receptionist Dashboard' })).toBeVisible({ timeout: 10000 });

      // Find the appointment row for the specific patient and time
      const appointmentRow = page.locator('tr', { hasText: patientName }).filter({ hasText: appointmentTime });
      await expect(appointmentRow).toBeVisible();
      await expect(appointmentRow).toContainText('Confirmed');

      // Click the "Check In" button
      await appointmentRow.getByRole('button', { name: 'Check In' }).click();

      // Verify the status has updated
      await expect(appointmentRow.getByRole('button', { name: 'Check In' })).not.toBeVisible();
      await expect(appointmentRow.getByText('Checked-in')).toBeVisible();
    });

    // --- Step 2: Receptionist logs out ---
    await test.step('Receptionist logs out', async () => {
      await page.getByLabel('Sign Out').click();
      await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Secure, Intelligent Healthcare' })).toBeVisible();
    });

    // --- Step 3: Nurse logs in and verifies the triage queue ---
    await test.step('Nurse verifies triage queue', async () => {
      await page.getByLabel('Email Address').fill('nurse.joy@chihealth.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Nurse Dashboard' })).toBeVisible({ timeout: 10000 });

      // Navigate to Triage Queue (it should be the default in some views, but let's be explicit)
      await page.getByRole('button', { name: 'Triage Queue' }).click();
      await expect(page.getByRole('heading', { name: 'Triage Queue' })).toBeVisible();

      // Find the triage card for the patient
      const triageCard = page.locator('.triage-card', { hasText: patientName });
      await expect(triageCard).toBeVisible();
      // The chief complaint comes from the appointment's specialty in the seed data
      await expect(triageCard).toContainText('Reason for Visit: General Checkup');
      
      // Interact with the card to ensure it's functional
      await triageCard.getByRole('button', { name: 'Record Vitals' }).click();
      await expect(page.getByRole('heading', { name: `Record Vitals for ${patientName}` })).toBeVisible();
    });
  });
});
