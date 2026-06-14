import { z } from 'zod';

export const EmailWebhookSchema = z.object({
  from: z.string().email('Invalid sender email'),
  subject: z.string().min(1, 'Subject is required').max(255),
  body: z.string().min(1, 'Body is required'),
});

export type EmailWebhookBody = z.infer<typeof EmailWebhookSchema>;
