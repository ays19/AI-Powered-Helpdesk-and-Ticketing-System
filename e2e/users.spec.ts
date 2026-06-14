import { test, expect } from '@playwright/test';

const ADMIN_USER = {
  email: 'test-admin@example.com',
  password: 'testpassword123',
};

const uniqueUser = (prefix: string, testInfo: { project: { name: string } }) => {
  const uniqueId = `${testInfo.project.name}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: uniqueId,
    name: `${prefix} ${uniqueId}`,
    email: `${prefix.toLowerCase().replace(/\s+/g, '-')}-${uniqueId}@example.com`,
    password: 'password123',
  };
};

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('button[type="submit"]');
}

async function openUsersPage(page: import('@playwright/test').Page) {
  await page.getByRole('link', { name: 'Users' }).click();
  await expect(page).toHaveURL('/users');
}

async function createUser(
  page: import('@playwright/test').Page,
  user: { name: string; email: string; password: string },
) {
  await page.getByRole('button', { name: 'Create User' }).click();
  await expect(page.locator('#user-modal-title')).toHaveText('Create User');
  await page.fill('#u-name', user.name);
  await page.fill('#u-email', user.email);
  await page.fill('#u-password', user.password);
  await page.click('form button[type="submit"]');
  await expect(page.locator('#user-modal-title')).not.toBeVisible();
}

const userRow = (page: import('@playwright/test').Page, name: string) =>
  page.locator('tr', { hasText: name });

test.describe('User Management (CRUD Happy Paths & Validation)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);

    // Verify successful login redirection
    await expect(page).toHaveURL('/');
  });

  test('should support the full user CRUD cycle', async ({ page }, testInfo) => {
    const uniqueId = `${testInfo.project.name}-${Math.random().toString(36).substring(2, 7)}`;
    const agentEmail = `e2e-agent-${uniqueId}@example.com`;
    const agentName = `E2E Agent ${uniqueId}`;
    const agentNameUpdated = `E2E Agent Updated ${uniqueId}`;

    // 1. NAVIGATE TO USERS PAGE
    await page.click('text=Users');
    await expect(page).toHaveURL('/users');

    // 2. READ (Initial check)
    // Check if the pre-seeded Admin user is displayed in the user table
    const adminRow = page.locator('tr:has-text("Admin")').first();
    await expect(adminRow).toBeVisible();
    await expect(adminRow).toContainText(ADMIN_USER.email);
    await expect(adminRow).toContainText('admin');

    // 3. CREATE
    // Open the Create User modal
    await page.click('button:has-text("Create User")');
    const modalTitle = page.locator('#user-modal-title');
    await expect(modalTitle).toHaveText('Create User');

    // Fill in the new agent's details
    await page.fill('#u-name', agentName);
    await page.fill('#u-email', agentEmail);
    await page.fill('#u-password', 'agentpass123');

    // Submit the form
    await page.click('form button[type="submit"]');

    // Verify the modal is closed and the new user appears in the table
    await expect(modalTitle).not.toBeVisible();
    const agentRow = page.locator(`tr:has-text("${agentName}")`);
    await expect(agentRow).toBeVisible();
    await expect(agentRow).toContainText(agentEmail);
    await expect(agentRow).toContainText('agent');

    // 4. UPDATE
    // Click the Edit button for the created agent
    const editBtn = page.locator(`button[aria-label="Edit ${agentName}"]`);
    await editBtn.click();

    // Verify the modal is populated with current details
    await expect(modalTitle).toHaveText('Edit User');
    await expect(page.locator('#u-name')).toHaveValue(agentName);
    await expect(page.locator('#u-email')).toHaveValue(agentEmail);

    // Update the agent's name
    await page.fill('#u-name', agentNameUpdated);
    await page.click('form button[type="submit"]');

    // Verify the modal is closed and the updated name is displayed in the table
    await expect(modalTitle).not.toBeVisible();
    const updatedRow = page.locator(`tr:has-text("${agentNameUpdated}")`);
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow).toContainText(agentEmail);

    // 5. DELETE
    // Click the Delete button for the updated user
    const deleteBtn = page.locator(`button[aria-label="Delete ${agentNameUpdated}"]`);
    await deleteBtn.click();

    // Verify the Delete User confirmation dialog appears
    await expect(page.getByRole('heading', { name: 'Delete User' })).toBeVisible();

    // Confirm the deletion
    await page.click('button:has-text("Delete User")');

    // Verify the user is removed from the table
    await expect(updatedRow).not.toBeVisible();
  });

  test('should show client-side validation errors in create user form', async ({ page }) => {
    // Navigate to users page
    await openUsersPage(page);

    // Open Create User modal
    await page.click('button:has-text("Create User")');
    const modalTitle = page.locator('#user-modal-title');
    await expect(modalTitle).toHaveText('Create User');

    // Submit empty form to trigger validations
    await page.click('form button[type="submit"]');

    // Verify Zod validation error messages are visible
    await expect(page.locator('text=Name must be at least 3 characters long.')).toBeVisible();
    await expect(page.locator('text=A valid email address is required.')).toBeVisible();
    await expect(page.locator('text=Password must be at least 8 characters long.')).toBeVisible();

    // Fill in invalid values to check dynamic validation updates
    await page.fill('#u-name', 'Ab'); // Less than 3 chars
    await page.fill('#u-email', 'invalid-email'); // Invalid email format
    await page.fill('#u-password', '123'); // Less than 8 chars
    
    await expect(page.locator('text=Name must be at least 3 characters long.')).toBeVisible();
    await expect(page.locator('text=A valid email address is required.')).toBeVisible();
    await expect(page.locator('text=Password must be at least 8 characters long.')).toBeVisible();

    // Click Cancel and verify the modal is closed
    await page.click('button:has-text("Cancel")');
    await expect(modalTitle).not.toBeVisible();
  });

  test('should show server-side duplicate email error during creation and update', async ({ page }, testInfo) => {
    const uniqueId = `${testInfo.project.name}-${Math.random().toString(36).substring(2, 7)}`;
    const nameA = `Agent A ${uniqueId}`;
    const nameB = `Agent B ${uniqueId}`;
    const emailA = `agent-a-${uniqueId}@example.com`;
    const emailB = `agent-b-${uniqueId}@example.com`;

    // Navigate to users page
    await openUsersPage(page);

    // 1. Create Agent A
    await page.click('button:has-text("Create User")');
    await page.fill('#u-name', nameA);
    await page.fill('#u-email', emailA);
    await page.fill('#u-password', 'password123');
    await page.click('form button[type="submit"]');
    await expect(page.locator('#user-modal-title')).not.toBeVisible();
    await expect(page.locator(`tr:has-text("${nameA}")`)).toBeVisible();

    // 2. Create Agent B
    await page.click('button:has-text("Create User")');
    await page.fill('#u-name', nameB);
    await page.fill('#u-email', emailB);
    await page.fill('#u-password', 'password123');
    await page.click('form button[type="submit"]');
    await expect(page.locator('#user-modal-title')).not.toBeVisible();
    await expect(page.locator(`tr:has-text("${nameB}")`)).toBeVisible();

    // 3. Try to create another user with emailA (Duplicate Email)
    await page.click('button:has-text("Create User")');
    await page.fill('#u-name', `Agent Duplicate ${uniqueId}`);
    await page.fill('#u-email', emailA);
    await page.fill('#u-password', 'password123');
    await page.click('form button[type="submit"]');

    // Verify server-side error message "Email already exists"
    const serverError = page.locator('form div:has-text("Email already exists")');
    await expect(serverError).toBeVisible();

    // Close the creation modal
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('#user-modal-title')).not.toBeVisible();

    // 4. Try to update Agent B to have emailA (Duplicate Email Update)
    const editBtn = page.locator(`button[aria-label="Edit ${nameB}"]`);
    await editBtn.click();
    await expect(page.locator('#user-modal-title')).toHaveText('Edit User');
    await page.fill('#u-email', emailA);
    await page.click('form button[type="submit"]');

    // Verify server-side error message "Email is already in use by another user"
    const updateError = page.locator('form div:has-text("Email is already in use by another user")');
    await expect(updateError).toBeVisible();

    // Close the edit modal
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('#user-modal-title')).not.toBeVisible();
  });

  test('should disable delete action for administrative users', async ({ page }) => {
    // Navigate to users page
    await openUsersPage(page);

    // Locate the row for Admin
    const adminRow = page.locator('tr:has-text("Admin")').first();
    await expect(adminRow).toBeVisible();

    // The Delete button for Admin should be disabled
    const deleteBtn = adminRow.locator('button[aria-label^="Delete"]');
    await expect(deleteBtn).toBeDisabled();
    await expect(deleteBtn).toHaveAttribute('title', 'Cannot delete admin users');
  });

  test('should prevent non-admin users from accessing user directory', async ({ page }, testInfo) => {
    const uniqueId = `${testInfo.project.name}-${Math.random().toString(36).substring(2, 7)}`;
    const agentName = `Security Agent ${uniqueId}`;
    const agentEmail = `agent-security-${uniqueId}@example.com`;
    const agentPassword = `password123`;

    // 1. Navigate to users page
    await openUsersPage(page);

    // 2. Admin creates a new agent user
    await page.click('button:has-text("Create User")');
    await page.fill('#u-name', agentName);
    await page.fill('#u-email', agentEmail);
    await page.fill('#u-password', agentPassword);
    await page.click('form button[type="submit"]');
    await expect(page.locator('#user-modal-title')).not.toBeVisible();
    await expect(page.locator(`tr:has-text("${agentName}")`)).toBeVisible();

    // 3. Admin signs out
    await page.click('button:has-text("Sign Out")');
    await expect(page).toHaveURL('/login');

    // 4. Log in as the newly created Agent
    await page.fill('#login-email', agentEmail);
    await page.fill('#login-password', agentPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // 5. Verify "Users" navigation link is NOT visible on Home page
    const usersLink = page.locator('a:has-text("Users")');
    await expect(usersLink).not.toBeVisible();

    // 6. Navigate directly to /users URL and verify "Access Denied" view
    await page.goto('/users');
    await expect(page).toHaveURL('/users');
    await expect(page.locator('h2:has-text("Access Denied")')).toBeVisible();
    await expect(page.locator('text=This page is only accessible to administrators.')).toBeVisible();

    // 7. Click "Back to Home" and verify redirection to Home page
    await page.click('text=Back to Home');
    await expect(page).toHaveURL('/');
  });

  test('should create users with normalized email and show them in newest-first order', async ({ page }, testInfo) => {
    const olderUser = uniqueUser('Read Agent Older', testInfo);
    const newerUser = uniqueUser('Read Agent Newer', testInfo);
    newerUser.email = newerUser.email.toUpperCase();

    await openUsersPage(page);

    await createUser(page, olderUser);
    await expect(userRow(page, olderUser.name)).toContainText(olderUser.email);

    await createUser(page, newerUser);

    const normalizedNewerEmail = newerUser.email.toLowerCase();
    await expect(userRow(page, newerUser.name)).toContainText(normalizedNewerEmail);
    await expect(userRow(page, newerUser.name)).toContainText('agent');

    const names = await page.locator('tbody tr td span.font-medium').allTextContents();
    const newerIndex = names.indexOf(newerUser.name);
    const olderIndex = names.indexOf(olderUser.name);
    expect(newerIndex).toBeGreaterThan(-1);
    expect(olderIndex).toBeGreaterThan(-1);
    expect(newerIndex).toBeLessThan(olderIndex);
  });

  test('should update a user password and keep the account usable', async ({ page }, testInfo) => {
    const agent = uniqueUser('Password Agent', testInfo);
    const updatedName = `${agent.name} Updated`;
    const updatedPassword = 'updatedpass123';

    await openUsersPage(page);
    await createUser(page, agent);

    await page.locator(`button[aria-label="Edit ${agent.name}"]`).click();
    await expect(page.locator('#user-modal-title')).toHaveText('Edit User');
    await page.fill('#u-name', updatedName);
    await page.fill('#u-password', updatedPassword);
    await page.click('form button[type="submit"]');
    await expect(page.locator('#user-modal-title')).not.toBeVisible();
    await expect(userRow(page, updatedName)).toContainText(agent.email);

    await page.click('button:has-text("Sign Out")');
    await expect(page).toHaveURL('/login');

    await login(page, agent.email, agent.password);
    await expect(page.locator('div[role="alert"]')).toBeVisible();

    await login(page, agent.email, updatedPassword);
    await expect(page).toHaveURL('/');
  });

  test('should keep the user when delete is cancelled and block login after deletion', async ({ page }, testInfo) => {
    const agent = uniqueUser('Delete Agent', testInfo);

    await openUsersPage(page);
    await createUser(page, agent);

    const row = userRow(page, agent.name);
    await expect(row).toBeVisible();

    await page.locator(`button[aria-label="Delete ${agent.name}"]`).click();
    await expect(page.getByRole('heading', { name: 'Delete User' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Delete User' })).not.toBeVisible();
    await expect(row).toBeVisible();

    await page.locator(`button[aria-label="Delete ${agent.name}"]`).click();
    await page.click('button:has-text("Delete User")');
    await expect(row).not.toBeVisible();

    await page.click('button:has-text("Sign Out")');
    await expect(page).toHaveURL('/login');

    await login(page, agent.email, agent.password);
    await expect(page.locator('div[role="alert"]')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
