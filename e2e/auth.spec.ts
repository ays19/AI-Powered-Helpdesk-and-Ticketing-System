import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * 
 * Coverage:
 * 1. Successful login with valid credentials.
 * 2. Failed login with incorrect password.
 * 3. Failed login with non-existent email.
 * 4. Validation errors for empty/invalid fields.
 * 5. Unauthorized access redirect (checking if / from /login works).
 */

const AUTH_USER = {
  email: 'admin@example.com',
  password: 'password123',
};

test.describe('Authentication System', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.fill('#login-email', AUTH_USER.email);
    await page.fill('#login-password', AUTH_USER.password);
    await page.click('button[type="submit"]');

    // Should redirect to home page
    await expect(page).toHaveURL('/');
    await expect(page.locator('body')).not.toContainText('Welcome back');
  });

  test('should show error with incorrect password', async ({ page }) => {
    await page.fill('#login-email', AUTH_USER.email);
    await page.fill('#login-password', 'wrongpassword');
    await page.click('button[type="submit"]');

    const alert = page.locator('div[role="alert"]');
    await expect(alert).toBeVisible();
    // Better-auth often returns "Invalid email or password"
    await expect(alert).not.toBeEmpty();
  });

  test('should show error with non-existent email', async ({ page }) => {
    await page.fill('#login-email', 'nonexistent@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button[type="submit"]');

    const alert = page.locator('div[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).not.toBeEmpty();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Submit empty form
    await page.click('button[type="submit"]');

    // Check for zod validation messages
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.fill('#login-email', 'not-an-email');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('should redirect unauthenticated users from home to login', async ({ page }) => {
    // Clear cookies/session if necessary (Playwright contexts are isolated, 
    // so this should be clean by default)
    await page.goto('/');
    
    // The App.tsx or session check should redirect to /login
    await expect(page).toHaveURL(/\/login/);
  });
});
