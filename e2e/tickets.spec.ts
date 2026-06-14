import { test, expect } from '@playwright/test';

test.describe('Ticket Dashboard Listing', () => {
  const CLIENT_URL = 'http://localhost:5174';
  const API_URL = 'http://localhost:4100';

  test.beforeEach(async ({ page }) => {
    await page.goto(`${CLIENT_URL}/login`);
    
    // Using specified accessible role locators for login
    await page.getByRole('textbox', { name: 'Email' }).fill('test-admin@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('testpassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page).toHaveURL(`${CLIENT_URL}/`);
  });

  test('should load the ticket dashboard successfully', async ({ page }) => {
    await expect(page).toHaveURL(`${CLIENT_URL}/`);
    // Verify header is visible
    await expect(page.getByText('Helpdesk')).toBeVisible();
    // Verify session user is displayed
    await expect(page.getByText(/Welcome, Admin/i)).toBeVisible();
  });

  test('should render existing tickets with correct details', async ({ page }) => {
    // Create a test ticket via API to ensure data exists
    const response = await page.request.post(`${API_URL}/api/tickets`, {
      data: {
        title: 'E2E Listing Test Ticket',
        description: 'Testing the listing feature',
        priority: 'high',
        category: 'technical_question'
      }
    });
    expect(response.ok()).toBeTruthy();
    const ticket = await response.json();

    await page.reload();

    // Verify the ticket card is rendered
    const ticketCard = page.locator('div').filter({ hasText: ticket.title }).first();
    await expect(ticketCard).toBeVisible();
    await expect(ticketCard).toContainText(ticket.description);
    await expect(ticketCard).toContainText('high');
    await expect(ticketCard).toContainText('open');
  });

  test('should filter tickets by status', async ({ page }) => {
    // Create tickets with different statuses
    await page.request.post(`${API_URL}/api/tickets`, {
      data: { title: 'Open Ticket', status: 'open' }
    });
    await page.request.post(`${API_URL}/api/tickets`, {
      data: { title: 'Closed Ticket', status: 'closed' }
    });

    await page.reload();

    // Filter by "Open"
    await page.locator('button').filter({ has: page.locator('span', { hasText: /^open$/i }) }).click();
    await expect(page.getByText('Open Ticket')).toBeVisible();
    await expect(page.getByText('Closed Ticket')).not.toBeVisible();

    // Filter by "Closed"
    await page.locator('button').filter({ has: page.locator('span', { hasText: /^closed$/i }) }).click();
    await expect(page.getByText('Closed Ticket')).toBeVisible();
    await expect(page.getByText('Open Ticket')).not.toBeVisible();

    // Reset to "All"
    await page.locator('button').filter({ has: page.locator('span', { hasText: /^all$/i }) }).click();
    await expect(page.getByText('Open Ticket')).toBeVisible();
    await expect(page.getByText('Closed Ticket')).toBeVisible();
  });

  test('should display ticket categories as badges', async ({ page }) => {
    await page.request.post(`${API_URL}/api/tickets`, {
      data: {
        title: 'Category Test Ticket',
        category: 'technical_question'
      }
    });

    await page.reload();

    // Verify the category badge is present and text is normalized (underscores to spaces)
    await expect(page.getByText('technical question').first()).toBeVisible();
  });
});
