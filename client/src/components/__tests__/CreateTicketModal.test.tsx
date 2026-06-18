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

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders all fields and defaults category to "general_question"', () => {
    renderWithQuery(<CreateTicketModal onClose={onClose} onCreate={onCreate} />);

    expect(screen.getByRole('heading', { name: /create new ticket/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/title \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();

    const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
    expect(categorySelect).toBeInTheDocument();
    expect(categorySelect.value).toBe('general_question');
  });

  it('defaults the priority select to "medium"', () => {
    renderWithQuery(<CreateTicketModal onClose={onClose} onCreate={onCreate} />);

    const prioritySelect = screen.getByLabelText(/priority/i) as HTMLSelectElement;
    expect(prioritySelect.value).toBe('medium');
  });

  // ── Successful submission ──────────────────────────────────────────────────

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

  it('trims leading/trailing whitespace from title before calling onCreate', async () => {
    renderWithQuery(<CreateTicketModal onClose={onClose} onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText(/title \*/i), { target: { value: '  Trimmed Title  ' } });
    fireEvent.click(screen.getByRole('button', { name: /create ticket/i }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Trimmed Title' }),
      );
    });
  });

  // ── Client-side validation ─────────────────────────────────────────────────

  it('shows a validation error and does NOT call onCreate when title is empty', async () => {
    renderWithQuery(<CreateTicketModal onClose={onClose} onCreate={onCreate} />);

    // Submit without filling in the title
    fireEvent.click(screen.getByRole('button', { name: /create ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('shows a validation error when title contains only whitespace', async () => {
    renderWithQuery(<CreateTicketModal onClose={onClose} onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText(/title \*/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /create ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
    expect(onCreate).not.toHaveBeenCalled();
  });

  // ── Modal close triggers ───────────────────────────────────────────────────

  it('calls onClose when the Cancel button is clicked', () => {
    renderWithQuery(<CreateTicketModal onClose={onClose} onCreate={onCreate} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('calls onClose when the × close button is clicked', () => {
    renderWithQuery(<CreateTicketModal onClose={onClose} onCreate={onCreate} />);

    // The × button is rendered adjacent to the heading
    fireEvent.click(screen.getByRole('button', { name: /×/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop overlay is clicked', () => {
    renderWithQuery(<CreateTicketModal onClose={onClose} onCreate={onCreate} />);

    // The outermost div is the backdrop; clicking it calls onClose.
    // The inner modal card stops propagation, so clicking the heading should NOT close it.
    const backdrop = screen.getByRole('heading', { name: /create new ticket/i })
      .closest('[class*="fixed"]') as HTMLElement;

    // Click the backdrop element directly (not the inner modal)
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT close when clicking inside the modal card (propagation is stopped)', () => {
    renderWithQuery(<CreateTicketModal onClose={onClose} onCreate={onCreate} />);

    // Clicking the heading (inside the modal card) must not trigger onClose
    fireEvent.click(screen.getByRole('heading', { name: /create new ticket/i }));

    expect(onClose).not.toHaveBeenCalled();
  });
});
