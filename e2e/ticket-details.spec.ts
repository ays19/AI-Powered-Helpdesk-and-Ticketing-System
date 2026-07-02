import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const ADMIN_USER = {
  email: 'test-admin@example.com',
  password: 'testpassword123',
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('#login-email', ADMIN_USER.email);
  await page.fill('#login-password', ADMIN_USER.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/');
}

async function createTestTicket(page: Page, title: string) {
  await page.getByRole('button', { name: /new ticket/i }).click();
  await page.getByLabel('Title *').fill(title);
  await page.getByLabel('Description').fill('E2E test ticket description.');
  await page.getByRole('button', { name: /create ticket/i }).click();
  await expect(page.getByRole('heading', { name: /create new ticket/i })).not.toBeVisible();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Ticket Details – DB Persistence & Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should support navigation, ticket updates, and reply persistence across reloads', async ({ page }) => {
    const title = `E2E Detail Persist ${Date.now()}`;
    await createTestTicket(page, title);

    // 1. NAVIGATION: Go to details page
    await page.getByRole('link', { name: title }).click();
    await expect(page).toHaveURL(/\/tickets\/[a-zA-Z0-9-]+/);

    // 2. UPDATES: Change status and category
    await page.locator('#details-status').selectOption('in-progress');
    await page.locator('#details-category').selectOption('refund_request');

    // 3. REPLIES: Submit a new reply
    const replyContent = `Persisted reply at ${Date.now()}`;
    await page.getByPlaceholder('Type your message here...').fill(replyContent);
    await page.getByRole('button', { name: /submit reply/i }).click();

    // Verify reply is added in the UI
    await expect(page.getByText(replyContent)).toBeVisible();

    // 4. PERSISTENCE: Reload and verify database updates are preserved
    await page.reload();
    await expect(page.locator('#details-status')).toHaveValue('in-progress');
    await expect(page.locator('#details-category')).toHaveValue('refund_request');
    await expect(page.getByText(replyContent)).toBeVisible();

    // 5. NAVIGATION BACK: Go back to dashboard
    await page.getByRole('link', { name: /back to tickets/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should handle ticket deletion and database removal', async ({ page }) => {
    const title = `E2E Detail Delete ${Date.now()}`;
    await createTestTicket(page, title);

    // Go to details page
    await page.getByRole('link', { name: title }).click();

    // Accept confirm dialog on delete
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Delete ticket
    await page.getByRole('button', { name: /delete ticket/i }).click();

    // Verify redirection to dashboard
    await expect(page).toHaveURL('/');

    // Verify ticket is permanently gone from dashboard (survives reload)
    await expect(page.getByRole('link', { name: title })).not.toBeVisible();
    await page.reload();
    await expect(page.getByRole('link', { name: title })).not.toBeVisible();
  });
});
