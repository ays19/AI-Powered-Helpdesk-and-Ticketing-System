import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithQuery } from '@/test-utils';
import Home from '@/pages/Home';
import { authClient } from '@/lib/auth-client';
import axios from 'axios';
import { UserRole } from '@/types';
import type { Ticket } from '@/types';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

/**
 * Explicit axios mock so that `axios.defaults.withCredentials = true`
 * (evaluated at module-load time in App.tsx) does not throw.
 */
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { withCredentials: false },
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  data: {
    user: {
      id: 'user-1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    },
  },
  isPending: false,
};

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'ticket-1',
    ticketNumber: 1,
    title: 'Default Title',
    description: 'Default description',
    status: 'open',
    priority: 'medium',
    category: 'general_question',
    createdAt: '2025-03-15T10:00:00.000Z',
    updatedAt: '2025-03-15T10:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Home (Ticket Dashboard)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (authClient.useSession as any).mockReturnValue(MOCK_SESSION);
    // Default: no tickets — individual tests override as needed.
    (axios.get as any).mockResolvedValue({ data: [] });
  });

  // ── Header & welcome ──────────────────────────────────────────────────────

  it('should display the dashboard header and welcome message', () => {
    renderWithQuery(<Home />);

    expect(screen.getByText('Helpdesk')).toBeInTheDocument();
    expect(screen.getByText(/Welcome, Admin User/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new ticket/i })).toBeInTheDocument();
  });

  // ── Ticket ordering ───────────────────────────────────────────────────────

  it('should render ticket cards in the order returned by the API', async () => {
    const tickets = [
      makeTicket({ id: '3', title: 'Third Ticket' }),
      makeTicket({ id: '2', title: 'Second Ticket' }),
      makeTicket({ id: '1', title: 'First Ticket' }),
    ];
    (axios.get as any).mockResolvedValue({ data: tickets });

    renderWithQuery(<Home />);

    const headings = await screen.findAllByRole('heading', { level: 3 });
    const titles = headings.map((h) => h.textContent);

    // API returns newest-first; Third Ticket appears before First Ticket.
    expect(titles.indexOf('Third Ticket')).toBeLessThan(titles.indexOf('First Ticket'));
  });

  // ── Status filter bar ─────────────────────────────────────────────────────

  it('should filter tickets by status when filter buttons are clicked', async () => {
    const tickets = [
      makeTicket({ id: '1', title: 'Open Ticket', status: 'open' }),
      makeTicket({ id: '2', title: 'Resolved Ticket', status: 'resolved' }),
      makeTicket({ id: '3', title: 'Closed Ticket', status: 'closed' }),
    ];
    (axios.get as any).mockResolvedValue({ data: tickets });

    renderWithQuery(<Home />);

    // Wait for initial load
    await screen.findByRole('heading', { name: 'Open Ticket' });

    // ── All (default) ────────────────────────────────────────────────────
    expect(screen.getByRole('heading', { name: 'Resolved Ticket' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Closed Ticket' })).toBeInTheDocument();

    // ── Open filter ──────────────────────────────────────────────────────
    fireEvent.click(screen.getByRole('button', { name: /^open/i }));
    expect(screen.getByRole('heading', { name: 'Open Ticket' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Resolved Ticket' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Closed Ticket' })).not.toBeInTheDocument();

    // ── Resolved filter ──────────────────────────────────────────────────
    fireEvent.click(screen.getByRole('button', { name: /^resolved/i }));
    expect(screen.getByRole('heading', { name: 'Resolved Ticket' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Open Ticket' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Closed Ticket' })).not.toBeInTheDocument();

    // ── Closed filter ────────────────────────────────────────────────────
    fireEvent.click(screen.getByRole('button', { name: /^closed/i }));
    expect(screen.getByRole('heading', { name: 'Closed Ticket' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Open Ticket' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Resolved Ticket' })).not.toBeInTheDocument();

    // ── Back to All ──────────────────────────────────────────────────────
    fireEvent.click(screen.getByRole('button', { name: /^all/i }));
    expect(screen.getByRole('heading', { name: 'Open Ticket' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Resolved Ticket' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Closed Ticket' })).toBeInTheDocument();
  });

  it('should show the empty state when the active filter has no matching tickets', async () => {
    const tickets = [makeTicket({ id: '1', title: 'Open Ticket', status: 'open' })];
    (axios.get as any).mockResolvedValue({ data: tickets });

    renderWithQuery(<Home />);

    await screen.findByRole('heading', { name: 'Open Ticket' });

    // Filter by in-progress — the open ticket should not appear.
    fireEvent.click(screen.getByRole('button', { name: /^in-progress/i }));

    expect(screen.queryByRole('heading', { name: 'Open Ticket' })).not.toBeInTheDocument();
    expect(screen.getByText(/No tickets found/i)).toBeInTheDocument();
  });

  // ── Inline status change ──────────────────────────────────────────────────

  it('should call PATCH and refresh the ticket list when the status dropdown is changed', async () => {
    const ticket = makeTicket({ id: 'ticket-1', title: 'Status Test', status: 'open' });
    (axios.get as any)
      .mockResolvedValueOnce({ data: [ticket] })                              // initial fetch
      .mockResolvedValueOnce({ data: [{ ...ticket, status: 'resolved' }] }); // after invalidation
    (axios.patch as any).mockResolvedValue({ data: {} });

    renderWithQuery(<Home />);

    const select = await screen.findByRole('combobox', { name: 'Change status' });
    fireEvent.change(select, { target: { value: 'resolved' } });

    await waitFor(() =>
      expect(axios.patch).toHaveBeenCalledWith('/api/tickets/1', { status: 'resolved' }),
    );

    // After query cache is invalidated and re-fetched, the select reflects the new status.
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Change status' })).toHaveValue('resolved'));
  });

  // ── Delete ticket ─────────────────────────────────────────────────────────

  it('should call DELETE and remove the ticket from the list when Delete is clicked', async () => {
    const ticket = makeTicket({ id: 'ticket-1', title: 'Delete Me' });
    (axios.get as any)
      .mockResolvedValueOnce({ data: [ticket] }) // initial fetch
      .mockResolvedValueOnce({ data: [] });       // after invalidation
    (axios.delete as any).mockResolvedValue({ data: {} });

    renderWithQuery(<Home />);

    await screen.findByRole('heading', { name: 'Delete Me' });

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() =>
      expect(axios.delete).toHaveBeenCalledWith('/api/tickets/1'),
    );

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Delete Me' })).not.toBeInTheDocument(),
    );
  });
});
