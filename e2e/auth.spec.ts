import { test, expect } from '@playwright/test';

const AUTH_USER = {
  email: 'test-admin@example.com',
  password: 'testpassword123',
  name: 'Test Admin'
};

test.describe('Authentication System', () => {

  // Guarantee that the test user exists in the backend before running the suite
  test.beforeAll(async ({ playwright }) => {
    const apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:4100' // Target the backend server url directly
    });

    try {
      // Create the user programmatically via Better Auth registration endpoint
      await apiContext.post('/api/auth/sign-up', {
        data: {
          email: AUTH_USER.email,
          password: AUTH_USER.password,
          name: AUTH_USER.name,
        }
      });
    } catch (e) {
      console.log('User might already exist, proceeding to tests...', e);
    } finally {
      await apiContext.dispose();
    }
  });
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Better Practice: Using user-facing accessible locators matching your DOM tree snapshot
    await page.getByRole('textbox', { name: 'Email' }).fill(AUTH_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(AUTH_USER.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify successful redirection
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Welcome back')).not.toBeVisible();
  });

  test('should show error with incorrect password', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Email' }).fill(AUTH_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Catching the explicit validation banner from your alert role snapshot
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText('Invalid email or password');
  });

  test('should show error with non-existent email', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Email' }).fill('nonexistent@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText('Invalid email or password');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Zod client side validation catch
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Email' }).fill('not-an-email');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('should redirect unauthenticated users from home to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });
});