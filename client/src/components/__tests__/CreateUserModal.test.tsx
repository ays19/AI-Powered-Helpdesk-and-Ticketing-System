import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { CreateUserButton } from '../CreateUserModal';

vi.mock('axios');

const createTestWrapper = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          {ui}
        </MemoryRouter>
      </QueryClientProvider>
    ),
    queryClient,
  };
};

describe('CreateUserModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should open the modal when the Create User button is clicked', () => {
    createTestWrapper(<CreateUserButton />);
    
    const openButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(openButton);

    expect(screen.getByRole('heading', { name: /create user/i })).toBeInTheDocument();
  });

  it('should display validation errors for empty fields on submit', async () => {
    createTestWrapper(<CreateUserButton />);
    
    fireEvent.click(screen.getByRole('button', { name: /create user/i }));
    
    const submitButton = screen.getAllByRole('button', { name: /create user/i })
      .find(btn => btn.getAttribute('type') === 'submit');
    
    if (!submitButton) throw new Error('Submit button not found');
    fireEvent.click(submitButton);

    expect(await screen.findByText(/Name must be at least 3 characters long/i)).toBeInTheDocument();
    expect(await screen.findByText(/A valid email address is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();
  });

  it('should submit the form with valid data', async () => {
    (axios.post as any).mockResolvedValue({ data: { user: { id: '123' } } });
    createTestWrapper(<CreateUserButton />);
    
    fireEvent.click(screen.getByRole('button', { name: /create user/i }));

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

    const submitButton = screen.getAllByRole('button', { name: /create user/i })
      .find(btn => btn.getAttribute('type') === 'submit');
    
    fireEvent.click(submitButton!);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/users', {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /create user/i })).not.toBeInTheDocument();
    });
  });

  it('should show server error when API fails', async () => {
    (axios.post as any).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Email already exists' } },
    });
    createTestWrapper(<CreateUserButton />);
    
    fireEvent.click(screen.getByRole('button', { name: /create user/i }));

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'exists@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

    const submitButton = screen.getAllByRole('button', { name: /create user/i })
      .find(btn => btn.getAttribute('type') === 'submit');
    
    fireEvent.click(submitButton!);

    expect(await screen.findByText(/An unexpected error occurred/i)).toBeInTheDocument();
  });

  it('should toggle password visibility', () => {
    createTestWrapper(<CreateUserButton />);
    fireEvent.click(screen.getByRole('button', { name: /create user/i }));

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
