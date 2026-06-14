import { renderWithQuery } from '@/test-utils';
import { screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import TicketCard from '../TicketCard';
import type { Ticket } from '../../types';

const mockTicket: Ticket = {
  id: 'ticket-1',
  title: 'Payment Failed',
  description: 'My payment was deducted twice.',
  status: 'open',
  priority: 'high',
  category: 'refund_request',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('TicketCard', () => {
  const onStatusChange = vi.fn();
  const onDelete = vi.fn();

  it('renders the ticket details and the category badge correctly', () => {
    renderWithQuery(
      <TicketCard
        ticket={mockTicket}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
      />
    );

    // Verify card details are displayed
    expect(screen.getByText('Payment Failed')).toBeInTheDocument();
    expect(screen.getByText('My payment was deducted twice.')).toBeInTheDocument();
    
    // Verify the category badge displays the translated label
    expect(screen.getByText('Refund Request')).toBeInTheDocument();
    
    // Verify status displays
    expect(screen.getByText('open')).toBeInTheDocument();
  });

  it('triggers onStatusChange when status is changed', () => {
    renderWithQuery(
      <TicketCard
        ticket={mockTicket}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'in-progress' } });

    expect(onStatusChange).toHaveBeenCalledWith('ticket-1', 'in-progress');
  });

  it('triggers onDelete when delete button is clicked', () => {
    renderWithQuery(
      <TicketCard
        ticket={mockTicket}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith('ticket-1');
  });
});
