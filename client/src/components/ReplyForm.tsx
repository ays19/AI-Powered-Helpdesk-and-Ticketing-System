import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createReplySchema, type CreateReplyFormValues } from 'core';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import axios from 'axios';

interface ReplyFormProps {
  onSubmit: (content: string) => Promise<any> | any;
  isPending: boolean;
  customerName?: string;
}

export default function ReplyForm({ onSubmit, isPending, customerName }: ReplyFormProps) {
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishError, setPolishError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateReplyFormValues>({
    resolver: zodResolver(createReplySchema),
    defaultValues: { content: '' },
    mode: 'onChange',
  });

  const replyContent = watch('content');
  const isTooShort = (replyContent || '').length < 10;

  const handlePolish = async () => {
    const currentContent = getValues('content');
    if (!currentContent || !currentContent.trim()) {
      return;
    }

    setIsPolishing(true);
    setPolishError(null);
    try {
      const response = await axios.post('/api/tickets/polish', { content: currentContent, customerName });
      if (response.data?.polishedContent) {
        setValue('content', response.data.polishedContent, { shouldValidate: true, shouldDirty: true });
      }
    } catch (err: any) {
      setPolishError(err.response?.data?.error || 'Failed to polish reply.');
    } finally {
      setIsPolishing(false);
    }
  };

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
              errors.content && replyContent?.trim() ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]' : 'border-border-color'
            }`}
          />
          {errors.content && replyContent?.trim() && (
            <span className="text-danger text-xs mt-1 block">{errors.content.message}</span>
          )}
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="text-danger text-xs">
            {polishError && <span>{polishError}</span>}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handlePolish}
              disabled={isPending || isSubmitting || isPolishing || isTooShort}
              title={isTooShort ? 'Reply too short to polish' : undefined}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-border-color rounded-md bg-bg-secondary text-text-secondary font-sans text-sm font-semibold cursor-pointer transition-all hover:bg-bg-hover hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPolishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-purple-400" />
              )}
              {isPolishing ? 'Polishing...' : 'Polish Reply'}
            </button>
            <button
              type="submit"
              disabled={isPending || isSubmitting || isPolishing || !replyContent?.trim()}
              className="bg-gradient-to-br from-accent to-[#8b5cf6] text-white shadow-glow hover:-translate-y-[0.5px] hover:shadow-[0_0_40px_var(--color-accent-glow)] inline-flex items-center gap-2 px-5 py-2.5 border-none rounded-md font-sans text-sm font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {isPending ? 'Sending...' : 'Submit Reply'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
