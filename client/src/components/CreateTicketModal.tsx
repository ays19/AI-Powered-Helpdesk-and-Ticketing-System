import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CreateTicketBody } from '../types';

interface Props {
  onClose: () => void;
  onCreate: (body: CreateTicketBody) => void;
}

const ticketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical'] as const),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export default function CreateTicketModal({ onClose, onCreate }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { title: '', description: '', priority: 'medium' },
  });

  const onSubmit = (data: TicketFormValues) => {
    onCreate({
      title: data.title.trim(),
      description: data.description?.trim(),
      priority: data.priority,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Ticket</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-body" noValidate>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              {...register('title')}
              placeholder="Describe the issue briefly"
              autoFocus
              className={errors.title ? 'input-error' : ''}
            />
            {errors.title && <span className="field-error">{errors.title.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              placeholder="Add details about the issue…"
              className={errors.description ? 'input-error' : ''}
            />
            {errors.description && <span className="field-error">{errors.description.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              {...register('priority')}
              className={errors.priority ? 'input-error' : ''}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            {errors.priority && <span className="field-error">{errors.priority.message}</span>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
