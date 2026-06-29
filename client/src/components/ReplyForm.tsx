import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createReplySchema, type CreateReplyFormValues } from 'core';
import { Send } from 'lucide-react';

interface ReplyFormProps {
  onSubmit: (content: string) => Promise<any> | any;
  isPending: boolean;
}

export default function ReplyForm({ onSubmit, isPending }: ReplyFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateReplyFormValues>({
    resolver: zodResolver(createReplySchema),
    defaultValues: { content: '' },
    mode: 'onChange',
  });

  const handleFormSubmit = async (data: CreateReplyFormValues) => {
    try {
      await onSubmit(data.content);
      reset();
    } catch (error) {
      // Keep form content if submission fails
    }
  };

  return (
    <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-md">
      <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4">New Reply</h3>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="reply-content" className="sr-only">Reply message</label>
          <textarea
            id="reply-content"
            rows={4}
            {...register('content')}
            placeholder="Type your message here..."
            className={`w-full py-3 px-4 border rounded-md bg-bg-secondary text-text-primary font-sans text-sm transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] focus:outline-none placeholder:text-text-muted resize-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)] ${
              errors.content ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]' : 'border-border-color'
            }`}
          />
          {errors.content && (
            <span className="text-danger text-xs mt-1 block">{errors.content.message}</span>
          )}
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || isSubmitting}
            className="bg-gradient-to-br from-accent to-[#8b5cf6] text-white shadow-glow hover:-translate-y-[0.5px] hover:shadow-[0_0_40px_var(--color-accent-glow)] inline-flex items-center gap-2 px-5 py-2.5 border-none rounded-md font-sans text-sm font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isPending ? 'Sending...' : 'Submit Reply'}
          </button>
        </div>
      </form>
    </div>
  );
}
