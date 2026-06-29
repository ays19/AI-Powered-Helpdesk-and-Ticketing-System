import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithQuery } from '@/test-utils';
import TicketDetails from '../TicketDetails';
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
      id: 'agent-1',
      name: 'Agent User',
      email: 'agent@example.com',
      role: UserRole.AGENT,
    },
  },
  isPending: false,
};

const MOCK_TICKET: Ticket = {
  id: 'ticket-123',
  title: 'Database connection fails',
  description: 'Getting 500 error when saving changes to the PostgreSQL database.',
  status: 'open',
  priority: 'high',
  category: 'technical_question',
  customerEmail: 'customer@example.com',
  createdAt: '2026-06-28T12:00:00.000Z',
  updatedAt: '2026-06-28T12:05:00.000Z',
  assignedToId: null,
  assigned_to: null,
};

const MOCK_AGENTS = [
  { id: 'agent-alice', name: 'Agent Alice', role: UserRole.AGENT },
  { id: 'admin-bob', name: 'Admin Bob', role: UserRole.ADMIN },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TicketDetails Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (authClient.useSession as any).mockReturnValue(MOCK_SESSION);
    window.confirm = vi.fn().mockReturnValue(true);

    // Default mock setup: match URL to return correct mock data
    (axios.get as any).mockImplementation((url: string) => {
      if (url.includes('/api/agents')) {
        return Promise.resolve({ data: MOCK_AGENTS });
      }
      return Promise.resolve({ data: MOCK_TICKET });
    });
  });

  it('renders loading state initially', async () => {
    // Return a pending promise for the query
    let resolveQuery: any;
    const getPromise = new Promise<{ data: any }>((resolve) => {
      resolveQuery = resolve;
    });
    (axios.get as any).mockImplementation((url: string) => {
      if (url.includes('/api/agents')) {
        return Promise.resolve({ data: MOCK_AGENTS });
      }
      return getPromise;
    });

    renderWithQuery(
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetails />} />
      </Routes>,
      { route: '/tickets/ticket-123' }
    );

    // Should display skeleton / loading indicators
    expect(screen.queryByText('Database connection fails')).not.toBeInTheDocument();

    // Clean up
    resolveQuery({ data: MOCK_TICKET });
  });

  it('renders ticket details on successful load', async () => {
    renderWithQuery(
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetails />} />
      </Routes>,
      { route: '/tickets/ticket-123' }
    );

    await screen.findByRole('heading', { name: 'Database connection fails' });

    expect(screen.getByText(/ID: ticket-123/i)).toBeInTheDocument();
    expect(screen.getByText('Technical Question')).toBeInTheDocument();
    expect(screen.getByText(/high Priority/i)).toBeInTheDocument();
    expect(screen.getByText(/customer@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Getting 500 error/i)).toBeInTheDocument();
    expect(screen.getByText('open')).toBeInTheDocument();
  });

  it('renders ticket not found state on API error', async () => {
    (axios.get as any).mockImplementation((url: string) => {
      if (url.includes('/api/agents')) {
        return Promise.resolve({ data: MOCK_AGENTS });
      }
      return Promise.reject(new Error('Not found'));
    });

    renderWithQuery(
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetails />} />
      </Routes>,
      { route: '/tickets/ticket-123' }
    );

    await screen.findByRole('heading', { name: 'Ticket Not Found' });
    expect(screen.getByText(/The ticket you are looking for does not exist/i)).toBeInTheDocument();
  });

  it('allows changing status via dropdown', async () => {
    (axios.patch as any).mockResolvedValue({ data: { ...MOCK_TICKET, status: 'in-progress' } });

    renderWithQuery(
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetails />} />
      </Routes>,
      { route: '/tickets/ticket-123' }
    );

    await screen.findByRole('heading', { name: 'Database connection fails' });

    const select = screen.getByLabelText(/Update Status/i);
    fireEvent.change(select, { target: { value: 'in-progress' } });

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('/api/tickets/ticket-123', { status: 'in-progress' });
    });
  });

  it('renders "Unassigned" and allows assigning to an agent', async () => {
    (axios.patch as any).mockResolvedValue({ 
      data: { ...MOCK_TICKET, assignedToId: 'agent-alice', assigned_to: MOCK_AGENTS[0] } 
    });

    renderWithQuery(
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetails />} />
      </Routes>,
      { route: '/tickets/ticket-123' }
    );

    await screen.findByRole('heading', { name: 'Database connection fails' });

    // Displays Unassigned initially
    expect(screen.getAllByText('Unassigned')[0]).toBeInTheDocument();

    const select = screen.getByLabelText(/Update Assignment/i);
    fireEvent.change(select, { target: { value: 'agent-alice' } });

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('/api/tickets/ticket-123', { assigned_to: 'agent-alice' });
    });
  });

  it('displays the assigned agent name and allows unassigning', async () => {
    // Ticket starts out as assigned to agent-alice
    const assignedTicket = {
      ...MOCK_TICKET,
      assignedToId: 'agent-alice',
      assigned_to: MOCK_AGENTS[0]
    };

    (axios.get as any).mockImplementation((url: string) => {
      if (url.includes('/api/agents')) {
        return Promise.resolve({ data: MOCK_AGENTS });
      }
      return Promise.resolve({ data: assignedTicket });
    });

    (axios.patch as any).mockResolvedValue({ 
      data: { ...MOCK_TICKET, assignedToId: null, assigned_to: null } 
    });

    renderWithQuery(
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetails />} />
      </Routes>,
      { route: '/tickets/ticket-123' }
    );

    await screen.findByRole('heading', { name: 'Database connection fails' });

    // Displays Agent Alice name
    expect(screen.getByText('Agent Alice')).toBeInTheDocument();
    expect(screen.getByText('(agent)')).toBeInTheDocument();

    const select = screen.getByLabelText(/Update Assignment/i);
    fireEvent.change(select, { target: { value: 'unassigned' } });

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('/api/tickets/ticket-123', { assigned_to: null });
    });
  });

  it('allows deleting the ticket and navigates to homepage', async () => {
    (axios.delete as any).mockResolvedValue({ data: {} });

    renderWithQuery(
      <Routes>
        <Route path="/" element={<div>Home Dashboard</div>} />
        <Route path="/tickets/:id" element={<TicketDetails />} />
      </Routes>,
      { route: '/tickets/ticket-123' }
    );

    await screen.findByRole('heading', { name: 'Database connection fails' });

    const deleteBtn = screen.getByRole('button', { name: /Delete Ticket/i });
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/api/tickets/ticket-123');
    });

    await screen.findByText('Home Dashboard');
  });
});
