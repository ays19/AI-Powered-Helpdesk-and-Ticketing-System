import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithQuery } from '../../test-utils';
import Users from '../Users';
import { authClient } from '@/lib/auth-client';
import axios from 'axios';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

vi.mock('axios');

describe('Users Page - Create User Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock session as Admin to access the page and see the button
    (authClient.useSession as any).mockReturnValue({
      data: {
        user: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
        },
      },
      isPending: false,
    });
  });

  it('should show the Create User modal when the "Create User" button is clicked', async () => {
    renderWithQuery(<Users />);

    const createButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createButton);

    // Check if the modal title is visible (specifically the heading)
    expect(screen.getByRole('heading', { name: /create user/i })).toBeInTheDocument();
  });

  it('should hide the modal when clicking the overlay (outside the modal)', async () => {
    renderWithQuery(<Users />);

    const createButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createButton);

    expect(screen.getByRole('heading', { name: /create user/i })).toBeInTheDocument();

    // The overlay is the fixed div that closes the modal
    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /create user/i })).not.toBeInTheDocument();
    });
  });


  it('should hide the modal when the Escape key is pressed', async () => {
    renderWithQuery(<Users />);

    const createButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createButton);

    expect(screen.getByRole('heading', { name: /create user/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /create user/i })).not.toBeInTheDocument();
    });
  });

  it('should hide the modal when the close button is clicked', async () => {
    renderWithQuery(<Users />);

    const createButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createButton);

    expect(screen.getByRole('heading', { name: /create user/i })).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /close dialog/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /create user/i })).not.toBeInTheDocument();
    });
  });

  it('should show validation errors when submitting an empty form', async () => {
    renderWithQuery(<Users />);

    const createButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createButton);

    const submitButton = screen.getAllByRole('button', { name: /create user/i }).find(btn => btn.getAttribute('type') === 'submit');
    if (!submitButton) throw new Error('Submit button not found');
    
    fireEvent.click(submitButton);

    expect(screen.getByText(/Name must be at least 3 characters long/i)).toBeInTheDocument();
    expect(screen.getByText(/A valid email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();
  });

  it('should call the API and close the modal on successful submission', async () => {
    (axios.post as any).mockResolvedValue({ data: { user: { id: 'new-1', name: 'Test User' } } });
    renderWithQuery(<Users />);

    const createButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createButton);

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    const submitButton = screen.getAllByRole('button', { name: /create user/i }).find(btn => btn.getAttribute('type') === 'submit');
    if (!submitButton) throw new Error('Submit button not found');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/users', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(screen.queryByRole('heading', { name: /create user/i })).not.toBeInTheDocument();
    });
  });

  it('should display a server error message when submission fails', async () => {
    (axios.post as any).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: { error: 'Email already exists' },
      },
    });
    renderWithQuery(<Users />);

    const createButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createButton);

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'exists@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    const submitButton = screen.getAllByRole('button', { name: /create user/i }).find(btn => btn.getAttribute('type') === 'submit');
    if (!submitButton) throw new Error('Submit button not found');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('should toggle password visibility when the eye icon is clicked', async () => {
    renderWithQuery(<Users />);

    const createButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createButton);

    const passwordInput = screen.getByLabelText(/Password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
