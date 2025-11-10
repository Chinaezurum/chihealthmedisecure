import { test, expect } from '@playwright/test';

test.describe('Logistics Workflow: Sample Tracking', () => {
  const patientName = 'Amina Bello';
  const labTestName = 'Basic Metabolic Panel (BMP)';

  test('should track a lab sample from order to in-transit', async ({ page }) => {
    
    // --- Step 1: Doctor orders a lab test ---
    await test.step('Doctor orders lab test', async () => {
      await page.goto('/');
      await page.getByLabel('Email Address').fill('dr.adebayo@chihealth.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Welcome back, Dr. Adebayo!' })).toBeVisible({ timeout: 10000 });

      await page.getByRole('button', { name: 'My Patients' }).click();
      const patientCard = page.locator('.patient-card', { hasText: patientName });
      await patientCard.getByRole('button', { name: 'View EHR' }).click();
      
      await page.getByRole('button', { name: 'Order Lab Test' }).click();
      await page.getByLabel('Test Name').selectOption(labTestName);
      await page.getByRole('button', { name: 'Submit Order' }).click();
      await expect(page.getByText('Lab test ordered.')).toBeVisible();

      await page.getByLabel('Sign Out').click();
      await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
    });

    // --- Step 2: Lab Tech completes the test and requests pickup ---
    await test.step('Lab Technician completes test', async () => {
      await page.getByLabel('Email Address').fill('lab.tech@chihealth.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Lab Test Queue' })).toBeVisible({ timeout: 10000 });

      const testRow = page.locator('tr', { hasText: labTestName });
      await testRow.getByRole('button', { name: 'Enter Results' }).click();
      await page.getByLabel('Test Result').fill('Glucose: 95 mg/dL');
      await page.getByRole('button', { name: 'Save Results' }).click();
      
      const completedSection = page.locator('div', { has: page.getByRole('heading', { name: 'Completed - Awaiting Pickup' }) });
      const completedRow = completedSection.locator('tr', { hasText: labTestName });
      await completedRow.getByRole('button', { name: 'Request Pickup' }).click();
      
      // Verify it disappeared from the completed queue
      await expect(completedRow).not.toBeVisible();
      
      await page.getByLabel('Sign Out').click();
      await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
    });

    // --- Step 3: Logistics user moves the sample to in-transit ---
    await test.step('Logistics user moves sample to in-transit', async () => {
      await page.getByLabel('Email Address').fill('logistics.sam@chihealth.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Logistics Dashboard' })).toBeVisible({ timeout: 10000 });
      
      await page.getByRole('button', { name: 'Sample Tracking' }).click();
      await expect(page.getByRole('heading', { name: 'Lab Sample Tracking' })).toBeVisible();

      // Find the card in the "Awaiting Pickup" column
      const awaitingPickupColumn = page.locator('.kanban-column', { hasText: 'Awaiting Pickup' });
      const sampleCard = awaitingPickupColumn.locator('.kanban-card', { hasText: patientName });
      await expect(sampleCard).toBeVisible();
      await expect(sampleCard).toContainText(labTestName);
      
      // Click the button to move it
      await sampleCard.getByRole('button', { name: 'Mark In Transit' }).click();

      // Verify the card is now in the "In-Transit" column
      const inTransitColumn = page.locator('.kanban-column', { hasText: 'In-Transit' });
      const movedCard = inTransitColumn.locator('.kanban-card', { hasText: patientName });
      await expect(movedCard).toBeVisible();

      // Verify it's gone from the original column
      await expect(sampleCard).not.toBeVisible();
    });

  });
});
