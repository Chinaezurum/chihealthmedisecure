import { test, expect } from '@playwright/test';

test.describe('Healthcare Worker (HCW) Flow', () => {
  test('should allow an HCW to log in, view a patient EHR, and open a note modal', async ({ page }) => {
    // 1. Navigate to the app and log in as the HCW from seed data
    await page.goto('/');
    await page.getByLabel('Email Address').fill('dr.adebayo@chihealth.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // 2. Verify successful login and dashboard load
    await expect(page.getByRole('heading', { name: 'Welcome back, Dr. Adebayo!' })).toBeVisible({ timeout: 10000 });

    // 3. Navigate to the "My Patients" view via the sidebar
    await page.getByRole('button', { name: 'My Patients' }).click();
    await expect(page.getByRole('heading', { name: 'My Patients' })).toBeVisible();
    
    // 4. Find the patient card for "Amina Bello" and click "View EHR"
    // We locate the card by finding the heading with the patient's name, then find the button within that card.
    const patientCard = page.locator('.patient-card', { hasText: 'Amina Bello' });
    await patientCard.getByRole('button', { name: 'View EHR' }).click();
    
    // 5. Verify the EHR view has loaded for the correct patient
    await expect(page.getByRole('heading', { name: 'Electronic Health Record' })).toBeVisible();
    await expect(page.getByText('Patient: Amina Bello')).toBeVisible();

    // 6. Interact with the EHR by opening the "Add Clinical Note" modal
    await page.getByRole('button', { name: 'Add Clinical Note' }).click();

    // 7. Verify the modal has opened successfully
    await expect(page.getByRole('heading', { name: 'New Clinical Note for Amina Bello' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter clinical notes (e.g., SOAP format)...')).toBeVisible();
  });
});
