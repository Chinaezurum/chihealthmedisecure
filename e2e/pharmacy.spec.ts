import { test, expect } from '@playwright/test';

test.describe('Pharmacy Workflow', () => {
  test('should show a prescription in the pharmacy queue after a doctor creates it', async ({ page }) => {
    const uniqueMedication = `TestMed-${Date.now()}`;
    const patientName = 'Amina Bello';
    
    // --- Step 1: Doctor creates a prescription ---
    await test.step('Doctor logs in and creates a prescription', async () => {
      await page.goto('/');
      await page.getByLabel('Email Address').fill('dr.adebayo@chihealth.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Welcome back, Dr. Adebayo!' })).toBeVisible({ timeout: 10000 });

      // Navigate to patient's EHR
      await page.getByRole('button', { name: 'My Patients' }).click();
      const patientCard = page.locator('.patient-card', { hasText: patientName });
      await patientCard.getByRole('button', { name: 'View EHR' }).click();
      await expect(page.getByRole('heading', { name: 'Electronic Health Record' })).toBeVisible();

      // Create a new prescription
      await page.getByRole('button', { name: 'Create Prescription' }).click();
      await expect(page.getByRole('heading', { name: `Create New E-Prescription` })).toBeVisible();
      
      await page.getByLabel('Medication').fill(uniqueMedication);
      await page.getByLabel('Dosage').fill('100mg');
      await page.getByLabel('Frequency').fill('Once daily');
      await page.getByRole('button', { name: 'Issue Prescription' }).click();

      // Wait for the modal to close
      await expect(page.getByRole('heading', { name: `Create New E-Prescription` })).not.toBeVisible();
    });

    // --- Step 2: Doctor logs out ---
    await test.step('Doctor logs out', async () => {
      await page.getByLabel('Sign Out').click();
      // Wait for the confirmation modal and confirm
      await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Secure, Intelligent Healthcare' })).toBeVisible();
    });

    // --- Step 3: Pharmacist logs in and verifies the prescription ---
    await test.step('Pharmacist logs in and verifies the queue', async () => {
      await page.getByLabel('Email Address').fill('pharma.ken@chihealth.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Pharmacist Dashboard' })).toBeVisible({ timeout: 10000 });
      
      // The fulfillment queue should be the default view
      await expect(page.getByRole('heading', { name: 'Prescription Fulfillment Queue' })).toBeVisible();

      // Find the row containing the new prescription
      const prescriptionRow = page.locator('tr', { hasText: uniqueMedication });
      
      // Assert that the row is visible and contains the correct patient name
      await expect(prescriptionRow).toBeVisible();
      await expect(prescriptionRow).toContainText(patientName);
      await expect(prescriptionRow).toContainText('100mg');
    });
  });
});