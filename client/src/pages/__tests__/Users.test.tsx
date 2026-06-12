import { screen } from '@testing-library/react';
import { renderWithQuery } from '@/test-utils';
import Users from '../Users';
import { authClient } from '@/lib/auth-client';
import axios from 'axios';
import { UserRole } from '@/types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

// Mock axios
vi.mock('axios');

const mockUseSession = authClient.useSession as any;
const mockAxiosGet = axios.get as any;

describe('Users Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading session state when session is pending', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    });

    renderWithQuery(<Users />);
    expect(screen.getByText('Loading session…')).toBeInTheDocument();
  });

  it('redirects/renders nothing for unauthenticated users', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    });

    renderWithQuery(<Users />);
    expect(screen.queryByText('User Directory')).not.toBeInTheDocument();
  });

  it('renders Access Denied for non-admin users', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Regular Agent',
          email: 'agent@test.com',
          role: UserRole.AGENT,
        },
      },
      isPending: false,
    });

    renderWithQuery(<Users />);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText('This page is only accessible to administrators. Please contact your system administrator if you believe this is an error.')).toBeInTheDocument();
    expect(screen.queryByText('User Directory')).not.toBeInTheDocument();
  });

  it('renders skeletons while loading user directory list for admin users', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@test.com',
          role: UserRole.ADMIN,
        },
      },
      isPending: false,
    });

    // Mock axios to stay pending (unresolved promise)
    mockAxiosGet.mockReturnValue(new Promise(() => {}));

    renderWithQuery(<Users />);
    
    expect(screen.getByText('User Directory')).toBeInTheDocument();
    // Verify skeletons are rendered by looking for data-slot="skeleton"
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error state when user query fails', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@test.com',
          role: UserRole.ADMIN,
        },
      },
      isPending: false,
    });

    const errorMessage = 'Failed to fetch users';
    mockAxiosGet.mockRejectedValue(new Error(errorMessage));

    renderWithQuery(<Users />);

    const alertMsg = await screen.findByText(errorMessage);
    expect(alertMsg).toBeInTheDocument();
  });

  it('renders empty list message when no users are found', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@test.com',
          role: UserRole.ADMIN,
        },
      },
      isPending: false,
    });

    mockAxiosGet.mockResolvedValue({ data: [] });

    renderWithQuery(<Users />);

    const noUsersMsg = await screen.findByText('No users found.');
    expect(noUsersMsg).toBeInTheDocument();
  });

  it('renders list of users when data is loaded successfully', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@test.com',
          role: UserRole.ADMIN,
        },
      },
      isPending: false,
    });

    const mockUsers = [
      {
        id: 'u-1',
        name: 'Alice Agent',
        email: 'alice@test.com',
        role: UserRole.AGENT,
        createdAt: '2026-01-01T12:00:00Z',
      },
      {
        id: 'u-2',
        name: 'Bob Admin',
        email: 'bob@test.com',
        role: UserRole.ADMIN,
        createdAt: '2026-02-01T12:00:00Z',
      },
    ];

    mockAxiosGet.mockResolvedValue({ data: mockUsers });

    renderWithQuery(<Users />);

    expect(await screen.findByText('Alice Agent')).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Admin')).toBeInTheDocument();
    expect(screen.getByText('bob@test.com')).toBeInTheDocument();
  });
});
