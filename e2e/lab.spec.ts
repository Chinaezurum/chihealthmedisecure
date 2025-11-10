import { test, expect } from '@playwright/test';

test.describe('Laboratory Workflow', () => {
  const patientName = 'Amina Bello';
  const labTestName = 'Lipid Panel';
  const labResult = 'Total Chol: 200 mg/dL';

  test('should allow a doctor to order a test and a lab tech to complete it', async ({ page }) => {
    
    // --- Step 1: Doctor logs in and orders a lab test ---
    await test.step('Doctor orders lab test', async () => {
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

      // Order a new lab test
      await page.getByRole('button', { name: 'Order Lab Test' }).click();
      await expect(page.getByRole('heading', { name: `Order Lab Test for ${patientName}` })).toBeVisible();
      
      await page.getByLabel('Test Name').selectOption(labTestName);
      await page.getByRole('button', { name: 'Submit Order' }).click();

      // Wait for modal to close and check for toast notification
      await expect(page.getByRole('heading', { name: `Order Lab Test for ${patientName}` })).not.toBeVisible();
      await expect(page.getByText('Lab test ordered.')).toBeVisible();
    });

    // --- Step 2: Doctor logs out ---
    await test.step('Doctor logs out', async () => {
      await page.getByLabel('Sign Out').click();
      await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Secure, Intelligent Healthcare' })).toBeVisible();
    });

    // --- Step 3: Lab Technician logs in and verifies the test ---
    await test.step('Lab Technician logs in and finds the test', async () => {
      await page.getByLabel('Email Address').fill('lab.tech@chihealth.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Lab Technician Dashboard' })).toBeVisible({ timeout: 10000 });
      
      // The lab queue should be the default view
      await expect(page.getByRole('heading', { name: 'Lab Test Queue' })).toBeVisible();
      
      // Find the row for the newly ordered test
      const testRow = page.locator('tr', { hasText: labTestName });
      await expect(testRow).toBeVisible();
      await expect(testRow).toContainText(patientName);
      await expect(testRow).toContainText('Ordered');
    });

    // --- Step 4: Lab Technician enters results ---
    await test.step('Lab Technician enters results', async () => {
      const testRow = page.locator('tr', { hasText: labTestName });
      await testRow.getByRole('button', { name: 'Enter Results' }).click();

      // Verify the modal is open
      await expect(page.getByRole('heading', { name: `Enter Results for ${labTestName}` })).toBeVisible();
      
      // Fill and submit the result
      await page.getByLabel('Test Result').fill(labResult);
      await page.getByRole('button', { name: 'Save Results' }).click();

      // Wait for modal to close
      await expect(page.getByRole('heading', { name: `Enter Results for ${labTestName}` })).not.toBeVisible();
    });

    // --- Step 5: Verify the test is now in the completed section ---
    await test.step('Verify test is completed', async () => {
        const completedSection = page.locator('div', { has: page.getByRole('heading', { name: 'Completed - Awaiting Pickup' }) });
        const completedRow = completedSection.locator('tr', { hasText: labTestName });

        await expect(completedRow).toBeVisible();
        await expect(completedRow).toContainText(patientName);
        await expect(completedRow).toContainText(labResult);
    });

  });
});
