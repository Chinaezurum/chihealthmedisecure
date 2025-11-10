import { test, expect } from '@playwright/test';

test.describe('Admin Workflow', () => {
  test('should allow an admin to log in and view the staff list', async ({ page }) => {
    // 1. Log in as the admin user
    await test.step('Admin logs in', async () => {
      await page.goto('/');
      await page.getByLabel('Email Address').fill('admin@chihealth.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Administrator Dashboard' })).toBeVisible({ timeout: 10000 });
    });

    // 2. Navigate to Staff Management
    await test.step('Navigate to Staff Management', async () => {
      await page.getByRole('button', { name: 'Staff Management' }).click();
      await expect(page.getByRole('heading', { name: 'Staff Management' })).toBeVisible();
    });

    // 3. Verify key staff members are present in the table
    await test.step('Verify staff list', async () => {
      const staffTable = page.locator('table.styled-table');
      await expect(staffTable).toBeVisible();

      // Check for presence of key roles seeded in the database
      const doctorRow = staffTable.locator('tr', { hasText: 'Dr. Adebayo' });
      await expect(doctorRow).toContainText('dr.adebayo@chihealth.com');
      await expect(doctorRow).toContainText('Healthcare Worker');

      const nurseRow = staffTable.locator('tr', { hasText: 'Nurse Joy' });
      await expect(nurseRow).toContainText('nurse.joy@chihealth.com');
      await expect(nurseRow).toContainText('Nurse');

      const pharmacistRow = staffTable.locator('tr', { hasText: 'Pharmacist Ken' });
      await expect(pharmacistRow).toContainText('pharma.ken@chihealth.com');
      await expect(pharmacistRow).toContainText('Pharmacist');
    });

    // 4. Test opening the edit modal for a staff member
     await test.step('Open edit modal', async () => {
        const doctorRow = page.locator('tr', { hasText: 'Dr. Adebayo' });
        await doctorRow.getByRole('button', { name: 'Edit' }).click();

        await expect(page.getByRole('heading', { name: 'Edit Staff: Dr. Adebayo' })).toBeVisible();
        
        // Check if the form is pre-filled correctly
        const nameInput = page.locator('input[name="name"]');
        await expect(nameInput).toHaveValue('Dr. Adebayo');
        const roleSelect = page.locator('select[name="role"]');
        await expect(roleSelect).toHaveValue('hcw');
     });
  });
});
