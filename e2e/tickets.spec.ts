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

/** Opens the "New Ticket" modal. */
async function openCreateModal(page: Page) {
  await page.getByRole('button', { name: /new ticket/i }).click();
  await expect(page.getByRole('heading', { name: /create new ticket/i })).toBeVisible();
}

/** Fills and submits the create-ticket form. */
async function createTicket(
  page: Page,
  opts: {
    title: string;
    description?: string;
    priority?: string;
    category?: string;
  },
) {
  await openCreateModal(page);

  await page.getByLabel('Title *').fill(opts.title);

  if (opts.description) {
    await page.getByLabel('Description').fill(opts.description);
  }
  if (opts.priority) {
    await page.getByLabel('Priority').selectOption(opts.priority);
  }
  if (opts.category) {
    await page.getByLabel('Category').selectOption(opts.category);
  }

  await page.getByRole('button', { name: /create ticket/i }).click();

  // Modal must close after successful submission
  await expect(page.getByRole('heading', { name: /create new ticket/i })).not.toBeVisible();

  // The new ticket card must appear in the list
  await expect(page.getByRole('heading', { name: opts.title, level: 3 })).toBeVisible();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Ticket Dashboard – Full CRUD & Status Flows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ── 1. Create + Persistence ───────────────────────────────────────────────

  test('should create a ticket and persist it so it survives a page reload', async ({ page }) => {
    const title = `Persist Test ${Date.now()}`;

    await createTicket(page, {
      title,
      description: 'This ticket should survive a reload.',
      priority: 'high',
      category: 'technical_question',
    });

    // Hard-reload: unit tests cannot verify real DB persistence
    await page.reload();

    await expect(page.getByRole('heading', { name: title, level: 3 })).toBeVisible();
  });

  // ── 2. Priority emoji badge ───────────────────────────────────────────────

  test('should show the correct priority emoji in the ticket card after creation', async ({
    page,
  }) => {
    const title = `Priority Badge Test ${Date.now()}`;

    await createTicket(page, { title, priority: 'critical' });

    const card = page.locator('div').filter({ hasText: title }).first();
    await expect(card).toContainText('🔴');
    await expect(card).toContainText('critical');
  });

  // ── 3. Category badge ─────────────────────────────────────────────────────

  test('should display the correct category badge after creation', async ({ page }) => {
    const title = `Category Badge Test ${Date.now()}`;

    await createTicket(page, { title, category: 'refund_request' });

    const card = page.locator('div').filter({ hasText: title }).first();
    await expect(card).toContainText('Refund Request');
  });

  // ── 4. Inline status change → DB persistence ──────────────────────────────

  test('should update ticket status via the dropdown and persist it after reload', async ({
    page,
  }) => {
    const title = `Status Persist Test ${Date.now()}`;

    await createTicket(page, { title, priority: 'low' });

    const card = page.locator('div').filter({ hasText: title }).first();
    const statusSelect = card.getByRole('combobox');
    await statusSelect.selectOption('resolved');

    // Badge should update immediately
    await expect(card.locator('span', { hasText: /resolved/i })).toBeVisible();

    // Reload to confirm DB persistence
    await page.reload();

    const reloadedCard = page.locator('div').filter({ hasText: title }).first();
    await expect(reloadedCard.getByRole('combobox')).toHaveValue('resolved');
  });

  // ── 5. Delete → permanent removal ────────────────────────────────────────

  test('should delete a ticket and remove it from the list permanently', async ({ page }) => {
    const title = `Delete Persist Test ${Date.now()}`;

    await createTicket(page, { title });

    const card = page.locator('div').filter({ hasText: title }).first();
    await card.getByRole('button', { name: /delete/i }).click();

    // Card must disappear immediately
    await expect(page.getByRole('heading', { name: title, level: 3 })).not.toBeVisible();

    // Reload to confirm DB deletion
    await page.reload();
    await expect(page.getByRole('heading', { name: title, level: 3 })).not.toBeVisible();
  });

  // ── 6. Status filter bar ──────────────────────────────────────────────────

  test('should filter tickets by status using the filter bar', async ({ page }) => {
    const openTitle = `Filter Open ${Date.now()}`;
    const resolvedTitle = `Filter Resolved ${Date.now() + 1}`;

    await createTicket(page, { title: openTitle });
    await createTicket(page, { title: resolvedTitle });

    // Change the second ticket to resolved
    const resolvedCard = page.locator('div').filter({ hasText: resolvedTitle }).first();
    await resolvedCard.getByRole('combobox').selectOption('resolved');
    await expect(resolvedCard.locator('span', { hasText: /resolved/i })).toBeVisible();

    // ── "resolved" filter
    await page.getByRole('button', { name: /^resolved/i }).click();
    await expect(page.getByRole('heading', { name: resolvedTitle, level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: openTitle, level: 3 })).not.toBeVisible();

    // ── "open" filter
    await page.getByRole('button', { name: /^open/i }).click();
    await expect(page.getByRole('heading', { name: openTitle, level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: resolvedTitle, level: 3 })).not.toBeVisible();

    // ── Back to "all"
    await page.getByRole('button', { name: /^all/i }).click();
    await expect(page.getByRole('heading', { name: openTitle, level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: resolvedTitle, level: 3 })).toBeVisible();
  });

  // ── 7. Newest-first ordering ──────────────────────────────────────────────

  test('should list tickets in newest-first order after creation', async ({ page }) => {
    const olderTitle = `Older Ticket ${Date.now()}`;
    const newerTitle = `Newer Ticket ${Date.now() + 1}`;

    await createTicket(page, { title: olderTitle });
    await createTicket(page, { title: newerTitle });

    const headings = await page.getByRole('heading', { level: 3 }).allTextContents();
    const olderIdx = headings.indexOf(olderTitle);
    const newerIdx = headings.indexOf(newerTitle);

    expect(newerIdx).toBeGreaterThan(-1);
    expect(olderIdx).toBeGreaterThan(-1);
    // Newest must appear before (lower index) older one
    expect(newerIdx).toBeLessThan(olderIdx);
  });

  // ── 8. Empty state ────────────────────────────────────────────────────────

  test('should show "No tickets found" empty state when active filter has no matches', async ({
    page,
  }) => {
    // Ensure at least one open ticket exists
    await createTicket(page, { title: `Empty State Ticket ${Date.now()}` });

    // Filter by "closed" — no closed tickets after a fresh DB seed
    await page.getByRole('button', { name: /^closed/i }).click();

    await expect(page.getByText(/no tickets found/i)).toBeVisible();
  });

  // ── 9. Modal close behaviours ─────────────────────────────────────────────

  test('should close the create-ticket modal when the Cancel button is clicked', async ({
    page,
  }) => {
    await openCreateModal(page);

    await page.getByRole('button', { name: /cancel/i }).click();

    await expect(page.getByRole('heading', { name: /create new ticket/i })).not.toBeVisible();
  });

  test('should close the create-ticket modal when clicking the backdrop overlay', async ({
    page,
  }) => {
    await openCreateModal(page);

    // Click far top-left corner — guaranteed to hit the backdrop, not the modal card
    await page.mouse.click(10, 10);

    await expect(page.getByRole('heading', { name: /create new ticket/i })).not.toBeVisible();
  });

  // ── 10. Client-side validation ────────────────────────────────────────────

  test('should show a validation error when submitting with an empty title', async ({ page }) => {
    await openCreateModal(page);

    // Submit without entering a title
    await page.getByRole('button', { name: /create ticket/i }).click();

    // react-hook-form + Zod renders inline error
    await expect(page.getByText(/title is required/i)).toBeVisible();

    // Modal must remain open
    await expect(page.getByRole('heading', { name: /create new ticket/i })).toBeVisible();
  });

  // ── 11. Unauthenticated redirect ──────────────────────────────────────────

  test('should redirect unauthenticated users who visit / to /login', async ({ page }) => {
    // Navigate without logging in — rely on a fresh page with no session cookie
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });
});
