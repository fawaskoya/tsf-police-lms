import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page in Arabic by default', async ({ page }) => {
    await page.goto('/');

    // Should redirect to /ar
    await expect(page).toHaveURL('/ar');

    // Check for Arabic content
    await expect(page.locator('h1')).toContainText('TSF Learning');
    await expect(page.locator('text=تسجيل الدخول')).toBeVisible();
  });

  test('should switch to English', async ({ page }) => {
    await page.goto('/ar');

    // Click language switch
    await page.locator('button:has-text("العربية")').click();
    await page.locator('text=English').click();

    // Should redirect to English
    await expect(page).toHaveURL('/en');
    await expect(page.locator('text=Login')).toBeVisible();
  });

  test('should login successfully', async ({ page }) => {
    await page.goto('/ar/auth/login');

    // Fill login form
    await page.fill('input[type="email"]', 'admin@kbn.local');
    await page.fill('input[type="password"]', 'Passw0rd!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/ar/admin');
    await expect(page.locator('text=مرحباً')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/ar/auth/login');

    // Fill with wrong credentials
    await page.fill('input[type="email"]', 'admin@kbn.local');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('text=بيانات الدخول غير صحيحة')).toBeVisible();
  });
});
