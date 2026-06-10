import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CreateTicketBody } from '../types';

interface Props {
  onClose: () => void;
  onCreate: (body: CreateTicketBody) => void;
}

const ticketSchema = z.object({
  title: z.string().min(1, { error: 'Title is required' }).max(100, { error: 'Title is too long' }),
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
    mode: 'onChange',
  });

  const onSubmit = (data: TicketFormValues) => {
    onCreate({
      title: data.title.trim(),
      description: data.description?.trim(),
      priority: data.priority,
    });
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.65)] backdrop-blur-[6px] flex items-center justify-center z-[1000] animate-fadeIn" onClick={onClose}>
      <div className="bg-bg-card border border-border-color rounded-lg w-[90%] max-w-[520px] shadow-lg animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center pt-6 px-6 pb-0">
          <h2 className="text-[1.25rem] font-bold">Create New Ticket</h2>
          <button className="bg-none border-none text-text-muted text-[1.5rem] cursor-pointer p-1 leading-none transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] hover:text-text-primary bg-transparent" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6" noValidate>
          <div className="mb-5">
            <label htmlFor="title" className="block text-[0.85rem] font-semibold text-text-secondary mb-[6px]">Title *</label>
            <input
              id="title"
              type="text"
              {...register('title')}
              placeholder="Describe the issue briefly"
              autoFocus
              className={`w-full py-[10px] px-[14px] border rounded-md bg-bg-secondary text-text-primary font-sans text-[0.9rem] transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] focus:outline-none placeholder:text-text-muted ${
                errors.title 
                  ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]' 
                  : 'border-border-color focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)]'
              }`}
            />
            {errors.title && <span className="text-danger text-[0.75rem] mt-1 block">{errors.title.message}</span>}
          </div>

          <div className="mb-5">
            <label htmlFor="description" className="block text-[0.85rem] font-semibold text-text-secondary mb-[6px]">Description</label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              placeholder="Add details about the issue…"
              className={`w-full py-[10px] px-[14px] border rounded-md bg-bg-secondary text-text-primary font-sans text-[0.9rem] transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] focus:outline-none placeholder:text-text-muted ${
                errors.description 
                  ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]' 
                  : 'border-border-color focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)]'
              }`}
            />
            {errors.description && <span className="text-danger text-[0.75rem] mt-1 block">{errors.description.message}</span>}
          </div>

          <div className="mb-5">
            <label htmlFor="priority" className="block text-[0.85rem] font-semibold text-text-secondary mb-[6px]">Priority</label>
            <select
              id="priority"
              {...register('priority')}
              className={`w-full py-[10px] px-[14px] border rounded-md bg-bg-secondary text-text-primary font-sans text-[0.9rem] transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] focus:outline-none placeholder:text-text-muted ${
                errors.priority 
                  ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]' 
                  : 'border-border-color focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)]'
              }`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            {errors.priority && <span className="text-danger text-[0.75rem] mt-1 block">{errors.priority.message}</span>}
          </div>

          <div className="flex justify-end gap-[10px] pt-2">
            <button type="button" className="bg-transparent text-text-secondary border border-border-color hover:bg-bg-hover hover:text-text-primary inline-flex items-center gap-[6px] px-5 py-[10px] rounded-md font-sans text-sm font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="bg-gradient-to-br from-accent to-[#8b5cf6] text-white shadow-glow hover:-translate-y-[1px] hover:shadow-[0_0_40px_var(--color-accent-glow)] inline-flex items-center gap-[6px] px-5 py-[10px] border-none rounded-md font-sans text-sm font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap" disabled={isSubmitting}>
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
