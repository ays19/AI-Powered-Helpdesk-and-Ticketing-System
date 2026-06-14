import { renderWithQuery } from '@/test-utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CreateTicketModal from '../CreateTicketModal';

describe('CreateTicketModal', () => {
  const onClose = vi.fn();
  const onCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fields and handles default category option correctly', () => {
    renderWithQuery(<CreateTicketModal onClose={onClose} onCreate={onCreate} />);

    expect(screen.getByRole('heading', { name: /create new ticket/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/title \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    
    // Check category label and select input
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
    expect(categorySelect.value).toBe('general_question');
  });

  it('submits form with user-entered values including custom category', async () => {
    renderWithQuery(<CreateTicketModal onClose={onClose} onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText(/title \*/i), { target: { value: 'API Issue' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Endpoint is returning 500 error.' } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'critical' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'technical_question' } });

    fireEvent.click(screen.getByRole('button', { name: /create ticket/i }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        title: 'API Issue',
        description: 'Endpoint is returning 500 error.',
        priority: 'critical',
        category: 'technical_question',
      });
    });
  });
});
