 import { test, expect } from '@playwright/test';
import axios from 'axios';

test.describe('Email-to-Ticket Webhook', () => {
  const SERVER_URL = 'http://localhost:4000/api/webhooks/email';

  test('should create a ticket for a registered user and link it', async ({ page }) => {
    const payload = {
      from: 'test-admin@example.com',
      subject: 'E2E Registered User Ticket',
      body: 'This ticket should be linked to the admin user.',
    };

    const response = await axios.post(SERVER_URL, payload);
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data.userId).not.toBeNull();
    expect(response.data.customerEmail).toBe(payload.from);

    // Verify it appears in the UI
    await page.goto('/login');
    await page.getByPlaceholder('Email address').fill('test-admin@example.com');
    await page.getByPlaceholder('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('E2E Registered User Ticket')).toBeVisible();
  });

  test('should create a ticket for an unknown user without linking', async ({ page }) => {
    const payload = {
      from: 'stranger@example.com',
      subject: 'E2E Unknown User Ticket',
      body: 'This ticket should not be linked to any user.',
    };

    const response = await axios.post(SERVER_URL, payload);
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data.userId).toBeNull();
    expect(response.data.customerEmail).toBe(payload.from);

    // Verify it appears in the UI for admin
    await page.goto('/login');
    await page.getByPlaceholder('Email address').fill('test-admin@example.com');
    await page.getByPlaceholder('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('E2E Unknown User Ticket')).toBeVisible();
  });

  test('should return 400 for invalid payload', async () => {
    const payload = {
      from: 'not-an-email',
      subject: 'Invalid Ticket',
      // body missing
    };

    try {
      await axios.post(SERVER_URL, payload);
      throw new Error('Should have failed');
    } catch (error: any) {
      expect(error.response?.status).toBe(400);
      expect(error.response?.data?.error).toBe('Validation failed');
    }
  });
});
