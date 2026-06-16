import { test, expect, type Page, type TestInfo } from '@playwright/test';

/**
 * Helper — sign in through the browser UI so the session cookie is set.
 */
async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill('test-admin@example.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('testpassword123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL('/');
}

/**
 * Helper — build a browser-unique title prefix.
 * Two Playwright projects (chromium, firefox) share one test database,
 * so ticket titles must be scoped per-project to avoid strict-mode violations.
 */
function prefix(testInfo: TestInfo) {
  return testInfo.project.name; // "chromium" | "firefox"
}

/**
 * Helper — create a ticket via the Vite proxy so the session cookie is sent.
 * Returns the created ticket object.
 */
async function createTicketViaAPI(
  page: Page,
  overrides: {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    category?: 'general_question' | 'technical_question' | 'refund_request';
  } = {},
) {
  const response = await page.request.post('/api/tickets', {
    data: {
      title: overrides.title ?? 'Default Ticket',
      description: overrides.description ?? 'Default description',
      priority: overrides.priority ?? 'medium',
      category: overrides.category ?? 'general_question',
    },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

/**
 * Helper — change the status of an existing ticket via PATCH.
 */
async function changeTicketStatus(page: Page, ticketId: string, status: string) {
  const response = await page.request.patch(`/api/tickets/${ticketId}`, {
    data: { status },
  });
  expect(response.ok()).toBeTruthy();
}

/**
 * Helper — locate the innermost ticket card that contains a specific h3 heading.
 * Targets the `.bg-bg-card` CSS class used by TicketCard to avoid matching wrapper divs.
 */
function getCardByTitle(page: Page, title: string) {
  return page
    .locator('.bg-bg-card')
    .filter({ has: page.getByRole('heading', { name: title, level: 3 }) });
}

// ---------------------------------------------------------------------------
// Test suite
//
// Two browser workers (chromium + firefox) share a single test database.
// Every ticket title includes the project name (via `prefix()`) so that
// cards created by one worker never collide with the other's assertions.
// ---------------------------------------------------------------------------

test.describe('Ticket Dashboard Listing', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  // -----------------------------------------------------------------------
  // Dashboard basics
  // -----------------------------------------------------------------------

  test('should load the dashboard with header and welcome message', async ({ page }) => {
    await expect(page.getByText('Helpdesk')).toBeVisible();
    await expect(page.getByText(/Welcome,/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /new ticket/i })).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // Ticket card rendering
  // -----------------------------------------------------------------------

  test('should render a ticket card with title, description, and date', async ({ page }, testInfo) => {
    const title = `${prefix(testInfo)}-Card-Details`;
    await createTicketViaAPI(page, {
      title,
      description: 'Users cannot sign in after the latest deployment',
      priority: 'critical',
      category: 'technical_question',
    });

    await page.reload();

    const card = getCardByTitle(page, title);
    await expect(card).toBeVisible();

    // Description
    await expect(card.getByText('Users cannot sign in after the latest deployment')).toBeVisible();

    // Date — should show today's date
    const today = new Date().toLocaleDateString();
    await expect(card.getByText(today)).toBeVisible();
  });

  test('should render the status dropdown defaulting to open', async ({ page }, testInfo) => {
    const title = `${prefix(testInfo)}-Status-Dropdown`;
    await createTicketViaAPI(page, { title });

    await page.reload();

    const card = getCardByTitle(page, title);
    await expect(card).toBeVisible();

    // Status change dropdown with correct default
    const statusSelect = card.locator('select');
    await expect(statusSelect).toBeVisible();
    await expect(statusSelect).toHaveValue('open');

    // Delete button
    await expect(card.getByRole('button', { name: 'Delete' })).toBeVisible();
  });

  test('should render multiple ticket cards in descending creation order', async ({ page }, testInfo) => {
    const p = prefix(testInfo);
    await createTicketViaAPI(page, { title: `${p}-Order-First` });
    await createTicketViaAPI(page, { title: `${p}-Order-Second` });
    await createTicketViaAPI(page, { title: `${p}-Order-Third` });

    await page.reload();

    await expect(page.getByRole('heading', { name: `${p}-Order-First` })).toBeVisible();
    await expect(page.getByRole('heading', { name: `${p}-Order-Second` })).toBeVisible();
    await expect(page.getByRole('heading', { name: `${p}-Order-Third` })).toBeVisible();

    // Cards are returned newest-first by the API
    const headings = page.locator('h3');
    const allTitles = await headings.allTextContents();
    const idxThird = allTitles.indexOf(`${p}-Order-Third`);
    const idxFirst = allTitles.indexOf(`${p}-Order-First`);
    expect(idxThird).toBeLessThan(idxFirst);
  });

  // -----------------------------------------------------------------------
  // Priority display
  // -----------------------------------------------------------------------

  test('should display correct priority emoji for each level', async ({ page }, testInfo) => {
    const p = prefix(testInfo);
    await createTicketViaAPI(page, { title: `${p}-Priority-Low`, priority: 'low' });
    await createTicketViaAPI(page, { title: `${p}-Priority-High`, priority: 'high' });

    await page.reload();

    const lowCard = getCardByTitle(page, `${p}-Priority-Low`);
    await expect(lowCard.getByText('🟢 low')).toBeVisible();

    const highCard = getCardByTitle(page, `${p}-Priority-High`);
    await expect(highCard.getByText('🟠 high')).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // Category badges
  // -----------------------------------------------------------------------

  test('should display General Question category badge', async ({ page }, testInfo) => {
    const title = `${prefix(testInfo)}-Cat-General`;
    await createTicketViaAPI(page, { title, category: 'general_question' });

    await page.reload();

    const card = getCardByTitle(page, title);
    await expect(card.getByText('General Question')).toBeVisible();
  });

  test('should display Technical Question category badge', async ({ page }, testInfo) => {
    const title = `${prefix(testInfo)}-Cat-Technical`;
    await createTicketViaAPI(page, { title, category: 'technical_question' });

    await page.reload();

    const card = getCardByTitle(page, title);
    await expect(card.getByText('Technical Question')).toBeVisible();
  });

  test('should display Refund Request category badge', async ({ page }, testInfo) => {
    const title = `${prefix(testInfo)}-Cat-Refund`;
    await createTicketViaAPI(page, { title, category: 'refund_request' });

    await page.reload();

    const card = getCardByTitle(page, title);
    await expect(card.getByText('Refund Request')).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // Status filter bar
  // -----------------------------------------------------------------------

  test('should filter tickets by status correctly', async ({ page }, testInfo) => {
    const p = prefix(testInfo);
    await createTicketViaAPI(page, { title: `${p}-Filter-Open` });
    const ticketResolved = await createTicketViaAPI(page, { title: `${p}-Filter-Resolved` });
    const ticketClosed = await createTicketViaAPI(page, { title: `${p}-Filter-Closed` });

    await changeTicketStatus(page, ticketResolved.id, 'resolved');
    await changeTicketStatus(page, ticketClosed.id, 'closed');

    await page.reload();

    // ── All filter (default) — all three should be visible ──
    await expect(page.getByRole('heading', { name: `${p}-Filter-Open` })).toBeVisible();
    await expect(page.getByRole('heading', { name: `${p}-Filter-Resolved` })).toBeVisible();
    await expect(page.getByRole('heading', { name: `${p}-Filter-Closed` })).toBeVisible();

    // ── Open filter ──
    await page.getByRole('button', { name: /^open/i }).click();
    await expect(page.getByRole('heading', { name: `${p}-Filter-Open` })).toBeVisible();
    await expect(page.getByRole('heading', { name: `${p}-Filter-Resolved` })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: `${p}-Filter-Closed` })).not.toBeVisible();

    // ── Resolved filter ──
    await page.getByRole('button', { name: /^resolved/i }).click();
    await expect(page.getByRole('heading', { name: `${p}-Filter-Resolved` })).toBeVisible();
    await expect(page.getByRole('heading', { name: `${p}-Filter-Open` })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: `${p}-Filter-Closed` })).not.toBeVisible();

    // ── Closed filter ──
    await page.getByRole('button', { name: /^closed/i }).click();
    await expect(page.getByRole('heading', { name: `${p}-Filter-Closed` })).toBeVisible();
    await expect(page.getByRole('heading', { name: `${p}-Filter-Open` })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: `${p}-Filter-Resolved` })).not.toBeVisible();

    // ── Back to All ──
    await page.getByRole('button', { name: /^all/i }).click();
    await expect(page.getByRole('heading', { name: `${p}-Filter-Open` })).toBeVisible();
    await expect(page.getByRole('heading', { name: `${p}-Filter-Resolved` })).toBeVisible();
    await expect(page.getByRole('heading', { name: `${p}-Filter-Closed` })).toBeVisible();
  });

  test('should show empty state when active filter has no matching tickets', async ({ page }, testInfo) => {
    const title = `${prefix(testInfo)}-EmptyFilter-Open`;
    await createTicketViaAPI(page, { title });

    await page.reload();

    // Filter by "in-progress" — our test ticket won't match
    await page.getByRole('button', { name: /^in-progress/i }).click();

    // The test ticket should not be visible under this filter
    await expect(page.getByRole('heading', { name: title })).not.toBeVisible();
  });

  // -----------------------------------------------------------------------
  // Inline status change
  // -----------------------------------------------------------------------

  test('should change ticket status via the dropdown', async ({ page }, testInfo) => {
    const title = `${prefix(testInfo)}-StatusChange`;
    await createTicketViaAPI(page, { title });

    await page.reload();

    const card = getCardByTitle(page, title);
    await expect(card).toBeVisible();

    // Change status from "open" to "resolved"
    await card.locator('select').selectOption('resolved');

    // After the mutation the select value should update
    await expect(card.locator('select')).toHaveValue('resolved');
  });

  // -----------------------------------------------------------------------
  // Delete ticket
  // -----------------------------------------------------------------------

  test('should delete a ticket from the listing', async ({ page }, testInfo) => {
    const title = `${prefix(testInfo)}-DeleteMe`;
    await createTicketViaAPI(page, { title });

    await page.reload();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    // Click the Delete button on that card
    const card = getCardByTitle(page, title);
    await card.getByRole('button', { name: 'Delete' }).click();

    // Ticket should disappear
    await expect(page.getByRole('heading', { name: title })).not.toBeVisible();
  });
});
