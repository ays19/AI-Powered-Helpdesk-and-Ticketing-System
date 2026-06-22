import { test, expect } from '@playwright/test';

test.describe('Email-to-Ticket Webhook', () => {
  // Configured server configurations based on your playwright.config.ts
  const SERVER_URL = 'http://localhost:4100/api/webhooks/email';
  const BACKEND_URL = 'http://localhost:4100';

  const AUTH_USER = {
    email: 'test-admin@example.com',
    password: 'testpassword123',
    name: 'Test Admin'
  };

  // Ensure the user context exists in the backend instance before webhooks drop
  test.beforeAll(async ({ playwright }) => {
    const apiContext = await playwright.request.newContext({ baseURL: BACKEND_URL });
    try {
      await apiContext.post('/api/auth/sign-up', {
        data: {
          email: AUTH_USER.email,
          password: AUTH_USER.password,
          name: AUTH_USER.name,
        }
      });
    } catch (e) {
      console.log('Setup notice: Test user might already exist, proceeding to tests.');
    } finally {
      await apiContext.dispose();
    }
  });

  test('should create a ticket for a registered user and link it', async ({ page, request }) => {
    const payload = {
      from: AUTH_USER.email,
      subject: 'E2E Registered User Ticket',
      body: 'This ticket should be linked to the admin user.',
    };

    // Use built-in Playwright request fixture instead of Axios
    const response = await request.post(SERVER_URL, {
      data: payload,
      headers: { 'x-webhook-secret': 'test_webhook_secret_123' }
    });
    expect(response.status()).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.userId).not.toBeNull(); 
    expect(data.customerEmail).toBe(payload.from);

    // Verify UI mapping matches updated database state
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(AUTH_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(AUTH_USER.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Fix: Using an explicit accessible role and targeting the first instance to clear strict mode conflicts
    await expect(page.getByRole('heading', { name: 'E2E Registered User Ticket' }).first()).toBeVisible();
  });

  test('should create a ticket for an unknown user without linking', async ({ page, request }) => {
    const payload = {
      from: 'stranger@example.com',
      subject: 'E2E Unknown User Ticket',
      body: 'This ticket should not be linked to any user.',
    };

    const response = await request.post(SERVER_URL, {
      data: payload,
      headers: { 'x-webhook-secret': 'test_webhook_secret_123' }
    });
    expect(response.status()).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.userId).toBeNull();
    expect(data.customerEmail).toBe(payload.from);

    // Verify it appears in the system interface dashboard
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(AUTH_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(AUTH_USER.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Fix: Using an explicit accessible role and targeting the first instance to clear strict mode conflicts
    await expect(page.getByRole('heading', { name: 'E2E Unknown User Ticket' }).first()).toBeVisible();
  });

  test('should return 400 for invalid payload', async ({ request }) => {
    const payload = {
      from: 'not-an-email',
      subject: 'Invalid Ticket',
    };

    const response = await request.post(SERVER_URL, {
      data: payload,
      headers: { 'x-webhook-secret': 'test_webhook_secret_123' }
    });
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.error).toBe('Validation failed');
  });
});