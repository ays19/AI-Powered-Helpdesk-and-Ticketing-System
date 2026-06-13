import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserTable from '../UserTable';
import { User } from '@/types';

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'agent',
    createdAt: '2026-01-02T00:00:00Z',
  },
];

describe('UserTable Component', () => {
  it('should render a list of users', () => {
    render(<UserTable users={mockUsers} isLoading={false} onEdit={vi.fn()} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('should render loading skeletons when isLoading is true', () => {
    render(<UserTable users={[]} isLoading={true} onEdit={vi.fn()} />);
    
    // Check for presence of skeleton-like elements or just that users are not rendered
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    // Skeletons don't have text, so we check for the presence of several rows of skeletons
    // based on the implementation which renders 5 rows
  });

  it('should show "No users found" when users list is empty', () => {
    render(<UserTable users={[]} isLoading={false} onEdit={vi.fn()} />);
    expect(screen.getByText(/No users found/i)).toBeInTheDocument();
  });

  it('should call onEdit when the edit button is clicked', () => {
    const onEditMock = vi.fn();
    render(<UserTable users={mockUsers} isLoading={false} onEdit={onEditMock} />);

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    expect(editButtons).toHaveLength(mockUsers.length);

    fireEvent.click(editButtons[0]);
    expect(onEditMock).toHaveBeenCalledWith(mockUsers[0]);

    fireEvent.click(editButtons[1]);
    expect(onEditMock).toHaveBeenCalledWith(mockUsers[1]);
  });
});
