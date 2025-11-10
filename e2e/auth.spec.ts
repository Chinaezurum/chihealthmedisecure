import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow a patient to log in and see their dashboard', async ({ page }) => {
    // Navigate to the app's root URL
    await page.goto('/');

    // Verify the login page has loaded by checking for a key headline
    await expect(page.getByRole('heading', { name: 'Secure, Intelligent Healthcare' })).toBeVisible();
    
    // Fill in the credentials for the seeded patient 'Amina Bello'
    await page.getByLabel('Email Address').fill('amina.bello@example.com');
    await page.getByLabel('Password').fill('password123');
    
    // Click the main sign-in button
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // After login, wait for the dashboard to load and verify its content.
    // We check for the personalized greeting to confirm a successful login.
    await expect(page.getByRole('heading', { name: /Good Morning, Amina/i })).toBeVisible({ timeout: 10000 });
    
    // As a secondary check, verify another key dashboard element is present
    await expect(page.getByText('AI Daily Briefing')).toBeVisible();
  });
});
