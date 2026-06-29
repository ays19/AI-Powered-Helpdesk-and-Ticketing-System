import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReplyForm from '../ReplyForm';

describe('ReplyForm Component', () => {
  it('renders the reply form elements correctly', () => {
    render(<ReplyForm onSubmit={vi.fn()} isPending={false} />);

    expect(screen.getByRole('heading', { name: /New Reply/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Reply/i })).toBeInTheDocument();
  });

  it('displays a validation error when content is empty', async () => {
    const handleSubmit = vi.fn();
    render(<ReplyForm onSubmit={handleSubmit} isPending={false} />);

    const submitBtn = screen.getByRole('button', { name: /Submit Reply/i });
    fireEvent.click(submitBtn);

    await screen.findByText('Reply content cannot be empty');
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with content when valid and resets form on success', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(true);
    render(<ReplyForm onSubmit={handleSubmit} isPending={false} />);

    const textarea = screen.getByPlaceholderText('Type your message here...');
    fireEvent.change(textarea, { target: { value: 'Valid reply text' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Reply/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith('Valid reply text');
    });

    // Verify reset behavior: textarea is empty
    await waitFor(() => {
      expect((textarea as HTMLTextAreaElement).value).toBe('');
    });
  });

  it('keeps content in the textarea when onSubmit rejects/fails', async () => {
    const handleSubmit = vi.fn().mockRejectedValue(new Error('Submit failed'));
    render(<ReplyForm onSubmit={handleSubmit} isPending={false} />);

    const textarea = screen.getByPlaceholderText('Type your message here...');
    fireEvent.change(textarea, { target: { value: 'This text should stay' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Reply/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith('This text should stay');
    });

    // Content should still remain inside textarea
    expect((textarea as HTMLTextAreaElement).value).toBe('This text should stay');
  });

  it('disables the submit button and shows loading text when isPending is true', () => {
    render(<ReplyForm onSubmit={vi.fn()} isPending={true} />);

    const submitBtn = screen.getByRole('button', { name: /Sending.../i });
    expect(submitBtn).toBeDisabled();
  });
});
