import { PgBoss } from 'pg-boss';
import { db as prisma } from '../db';
import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import * as fs from 'fs';
import * as path from 'path';
import { emailService } from '../services/email.service';
import { Resend } from 'resend';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const boss = new PgBoss({
  connectionString,
  schema: 'pgboss'
});

export const TICKET_CLASSIFICATION_QUEUE = 'ticket-classification';
export const SEND_EMAIL_QUEUE = 'send-email';
export const TICKET_AUTO_RESOLVE_QUEUE = 'ticket-auto-resolve';

export async function registerQueueWorkers() {
  // Create queues first to avoid 'Queue does not exist' runtime errors
  await boss.createQueue(TICKET_CLASSIFICATION_QUEUE);
  await boss.createQueue(SEND_EMAIL_QUEUE);
  await boss.createQueue(TICKET_AUTO_RESOLVE_QUEUE);

  console.log(`[Queue] Registering worker for queue '${TICKET_CLASSIFICATION_QUEUE}'`);
  
  await boss.work(TICKET_CLASSIFICATION_QUEUE, async (jobs: any[]) => {
    const job = jobs[0];
    if (!job) return;

    const { ticketId, title, description } = job.data as {
      ticketId: string;
      title: string;
      description: string;
    };
    
    console.log(`[Queue] Processing ticket classification job for ticket ${ticketId}`);
    
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { user: true }
      });
      if (!ticket) {
        console.error(`[Queue] Ticket ${ticketId} not found in database`);
        return;
      }

      // Transition ticket status to processing
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'processing' }
      });

      if (process.env.NODE_ENV === 'test' && (title + ' ' + description).toLowerCase().includes('simulate-error')) {
        throw new Error('Simulated processing failure');
      }

      let customerName = 'Customer';
      if (ticket.user) {
        customerName = ticket.user.name;
      } else if (ticket.customerEmail) {
        const prefix = ticket.customerEmail.split('@')[0] || '';
        customerName = prefix
          .split('.')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }

      let category = 'general_question';
      let autoResolveReply: string | null = null;

      // 1. Classify Category
      if (process.env.NODE_ENV === 'test') {
        const content = (title + ' ' + description).toLowerCase();
        if (content.includes('refund')) {
          category = 'refund_request';
        } else if (content.includes('technical') || content.includes('bug') || content.includes('error')) {
          category = 'technical_question';
        } else {
          category = 'general_question';
        }
      } else if (process.env.GROQ_API_KEY) {
        const prompt = `Ticket Title: ${title}\nTicket Description: ${description}`;
        const { text } = await generateText({
          model: groq('llama-3.1-8b-instant'),
          system: `You are an AI ticket classifier. Your job is to read a customer support ticket and classify it into one of these three categories:\n- 'general_question': general inquiries, information requests, generic greetings, password changes, login/how-to assistance, account subscription cancellations (without refund requests), and settings questions.\n- 'technical_question': application crashes, system errors, bugs, database locks, data corruption, and API failures.\n- 'refund_request': explicit requests for money refunds, refund policies, billing disputes, transaction errors, and chargebacks. Do NOT classify general account cancellations under refund_request unless they explicitly mention money refunds or billing disputes.\nReturn only the classification value (exactly one of 'general_question', 'technical_question', or 'refund_request'), nothing else.`,
          prompt,
        });

        const classification = text.trim().toLowerCase();
        if (['general_question', 'technical_question', 'refund_request'].includes(classification)) {
          category = classification;
        }
      }

      // 2. Read Knowledge Base & Run Auto-Resolution
      let kbContent = '';
      try {
        const kbPath = path.join(__dirname, '../knowledge-base.md');
        kbContent = fs.readFileSync(kbPath, 'utf8');
      } catch (err) {
        console.error('[Queue] Failed to read knowledge base file:', err);
      }

      if (process.env.NODE_ENV === 'test') {
        const content = (title + ' ' + description).toLowerCase();
        const prefix = `Dear ${customerName},\n\n`;
        const suffix = `\n\nBest regards,\nSharar's`;
        if (content.includes('forgot') && content.includes('password')) {
          autoResolveReply = `${prefix}To reset your password, go to the login page, click Forgot Password, and follow the instructions.${suffix}`;
        } else if (content.includes('reset') && content.includes('progress')) {
          autoResolveReply = `${prefix}To reset your course progress, go to My Courses, open the course, click Course Options, and select Reset Progress.${suffix}`;
        }
      } else if (process.env.GROQ_API_KEY && kbContent) {
        const systemPrompt = `You are an AI support agent. Your job is to read a support ticket (title and description) and see if it can be resolved using the provided Support Knowledge Base.

Support Knowledge Base:
${kbContent}

Instructions:
1. If the knowledge base contains a direct, specific answer or policy that fully addresses the customer's issue, write a polite, professional, and customer-friendly reply to the customer answering their question. Ensure the response is properly formatted, clear, and has a helpful tone.
2. You MUST address the customer by their name at the very beginning (e.g., "Dear ${customerName}," or "Hi ${customerName},"). Do not duplicate this greeting.
3. You MUST sign the email at the very end with:
Best regards,
Sharar's
4. If the user's issue is NOT addressed in the knowledge base, or requires custom/human intervention (like investigating a specific account, looking up a transaction ID, processing refunds, or if it is a general bug that requires system logs/investigation), return exactly the word "UNRESOLVED".
5. Do NOT make up information. If the knowledge base doesn't have the answer, return "UNRESOLVED".
6. If you can resolve the ticket, return the complete, ready-to-send support reply. Do NOT prefix the reply with anything else or add extra preamble. Just return the reply text.`;

        const prompt = `Ticket Title: ${title}\nTicket Description: ${description}`;

        const { text } = await generateText({
          model: groq('llama-3.1-8b-instant'),
          system: systemPrompt,
          prompt,
        });

        let reply = text.trim();
        if (reply && reply.toUpperCase() !== 'UNRESOLVED') {
          const separators = [
            'Response to the customer:',
            'Response to customer:',
            'Customer Response:',
            'Response:',
            'Support Reply:'
          ];
          for (const sep of separators) {
            const index = reply.toLowerCase().indexOf(sep.toLowerCase());
            if (index !== -1) {
              reply = reply.substring(index + sep.length).trim();
              break;
            }
          }
          autoResolveReply = reply;
        }
      }

      // 3. Persist Classification and Resolution State
      if (autoResolveReply) {
        await prisma.ticketReply.create({
          data: {
            content: autoResolveReply,
            ticketId: ticketId,
            senderType: 'agent',
          }
        });
        await prisma.ticket.update({
          where: { id: ticketId },
          data: {
            category: category as any,
            status: 'resolved',
          }
        });
        console.log(`[Queue] Ticket ${ticketId} auto-resolved by AI and marked as resolved`);

        try {
          const resolvedTicket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { user: true }
          });
          if (resolvedTicket?.user?.email) {
            await boss.send(SEND_EMAIL_QUEUE, {
              type: 'status-update',
              to: resolvedTicket.user.email,
              ticketNumber: resolvedTicket.ticketNumber,
              status: 'resolved'
            });
          }
        } catch (emailError) {
          console.error(`[Queue] Failed to enqueue resolved email for ticket ${ticketId}:`, emailError);
        }
      } else {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: {
            category: category as any,
            status: 'open',
            assignedToId: null,
          }
        });
        console.log(`[Queue] Ticket ${ticketId} auto-classified as ${category} and transitioned to open status (unassigned)`);
      }
    } catch (error) {
      console.error(`[Queue] Failed to process ticket classification / resolution job for ticket ${ticketId}:`, error);
      try {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: {
            status: 'open',
            assignedToId: null,
          }
        });
        console.log(`[Queue] Ticket ${ticketId} status reset to open and unassigned due to processing failure`);
      } catch (dbError) {
        console.error(`[Queue] Failed to reset ticket ${ticketId} status to open:`, dbError);
      }
      throw error; // Let PgBoss retry the job if it fails
    }
  });

  await boss.work(SEND_EMAIL_QUEUE, async (jobs: any[]) => {
    const job = jobs[0];
    if (!job) return;

    const { type, to, ticketNumber, title, message, status } = job.data as {
      type: 'ticket-created' | 'ticket-reply' | 'status-update';
      to: string;
      ticketNumber: number;
      title?: string;
      message?: string;
      status?: string;
    };

    console.log(`[Queue] Processing send-email job type=${type} to=${to}`);

    try {
      if (type === 'ticket-created' && title) {
        await emailService.sendTicketCreated(to, ticketNumber, title);
      } else if (type === 'ticket-reply' && message) {
        await emailService.sendTicketReply(to, ticketNumber, message);
      } else if (type === 'status-update' && status) {
        await emailService.sendTicketStatusUpdate(to, ticketNumber, status);
      }
      console.log(`[Queue] Email sent successfully type=${type} to=${to}`);
    } catch (error) {
      console.error(`[Queue] Failed to send email type=${type} to=${to}:`, error);
      throw error; // Let PgBoss retry
    }
  });

  console.log(`[Queue] Registering worker for queue '${TICKET_AUTO_RESOLVE_QUEUE}'`);

  await boss.work(TICKET_AUTO_RESOLVE_QUEUE, async (jobs: any[]) => {
    const job = jobs[0];
    if (!job) return;

    const { ticketId } = job.data as { ticketId: string };

    console.log(`[Queue] Processing ticket-auto-resolve job for ticket ${ticketId}`);

    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { user: true },
      });

      if (!ticket) {
        console.error(`[Queue] Ticket ${ticketId} not found — skipping auto-resolve`);
        return;
      }

      // Skip if ticket is already resolved/closed (e.g. classification worker handled it)
      if (ticket.status === 'resolved' || ticket.status === 'closed') {
        console.log(`[Queue] Ticket ${ticketId} already ${ticket.status} — skipping auto-resolve`);
        return;
      }

      // Determine recipient email
      const recipientEmail = ticket.customerEmail ?? ticket.user?.email ?? null;
      if (!recipientEmail) {
        console.warn(`[Queue] Ticket ${ticketId} has no customer email — auto-resolve email will be skipped if resolved`);
      }

      // Build customer name for personalisation
      let customerName = 'Customer';
      if (ticket.user) {
        customerName = ticket.user.name;
      } else if (ticket.customerEmail) {
        const prefix = ticket.customerEmail.split('@')[0] || '';
        customerName = prefix
          .split('.')
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(' ');
      }

      // Read knowledge base
      let kbContent = '';
      try {
        const kbPath = path.join(__dirname, '../knowledge-base.md');
        kbContent = fs.readFileSync(kbPath, 'utf8');
      } catch (err) {
        console.error('[Queue] [auto-resolve] Failed to read knowledge base:', err);
      }

      let aiReply: string | null = null;

      if (process.env.NODE_ENV === 'test') {
        // Deterministic mock for automated tests
        const content = (ticket.title + ' ' + ticket.description).toLowerCase();
        const prefix = `Dear ${customerName},\n\n`;
        const suffix = `\n\nBest regards,\nSharar's`;
        if (content.includes('forgot') && content.includes('password')) {
          aiReply = `${prefix}To reset your password, go to the login page, click Forgot Password, and follow the instructions.${suffix}`;
        } else if (content.includes('reset') && content.includes('progress')) {
          aiReply = `${prefix}To reset your course progress, go to My Courses, open the course, click Course Options, and select Reset Progress.${suffix}`;
        }
      } else if (process.env.GROQ_API_KEY && kbContent) {
        const systemPrompt = `You are an AI support agent. Your job is to read a support ticket and determine if it can be fully resolved using the provided knowledge base.\n\nSupport Knowledge Base:\n${kbContent}\n\nInstructions:\n1. If the knowledge base contains a direct, specific answer that fully addresses the customer's issue, write a polite, professional reply addressed to ${customerName}.\n2. Start the reply with "Dear ${customerName}," and end it with "Best regards,\\nSharar's".\n3. If the issue is NOT covered by the knowledge base, or requires human investigation, return exactly: CANNOT_RESOLVE\n4. Do NOT make up information not present in the knowledge base.\n5. Return only the final reply text or CANNOT_RESOLVE — no preamble.`;

        const { text } = await generateText({
          model: groq('llama-3.1-8b-instant'),
          system: systemPrompt,
          prompt: `Ticket Title: ${ticket.title}\nTicket Description: ${ticket.description}`,
        });

        const trimmed = text.trim();
        if (trimmed && trimmed.toUpperCase() !== 'CANNOT_RESOLVE') {
          // Strip any accidental preamble separators
          let reply = trimmed;
          const separators = [
            'Response to the customer:',
            'Response to customer:',
            'Customer Response:',
            'Response:',
            'Support Reply:',
          ];
          for (const sep of separators) {
            const idx = reply.toLowerCase().indexOf(sep.toLowerCase());
            if (idx !== -1) {
              reply = reply.substring(idx + sep.length).trim();
              break;
            }
          }
          aiReply = reply;
        }
      }

      if (!aiReply) {
        console.log(`[Queue] Ticket ${ticketId} cannot be auto-resolved — leaving open for human agent`);
        return;
      }

      // Re-fetch ticket with reply count to guard against race with classification worker.
      // The classification worker may have already auto-resolved the ticket and created a reply;
      // if any reply exists we must not create a duplicate.
      const freshTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { _count: { select: { replies: true } } },
      });
      if (freshTicket?.status === 'resolved' || freshTicket?.status === 'closed') {
        console.log(`[Queue] Ticket ${ticketId} already ${freshTicket.status} — skipping auto-resolve write`);
        return;
      }
      if ((freshTicket?._count?.replies ?? 0) > 0) {
        console.log(`[Queue] Ticket ${ticketId} already has ${freshTicket!._count.replies} reply/replies — skipping auto-resolve to avoid duplicate`);
        return;
      }

      // Create AI reply on the ticket
      await prisma.ticketReply.create({
        data: {
          content: aiReply,
          ticketId,
          senderType: 'agent',
        },
      });

      // Mark ticket as resolved
      const resolvedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'resolved' },
        include: { user: true },
      });

      console.log(`[Queue] Ticket ${ticketId} auto-resolved by dedicated auto-resolve worker`);

      // Send resolution email to customer via Resend
      if (recipientEmail) {
        try {
          const resendClient = new Resend(process.env.RESEND_API_KEY);
          const emailBody = [
            aiReply,
            '',
            'This ticket has been automatically resolved. If you need further assistance, please reply or create a new ticket.',
          ].join('\n');

          await resendClient.emails.send({
            from: 'onboarding@resend.dev',
            to: recipientEmail,
            subject: `Re: ${resolvedTicket.title} [Ticket #${resolvedTicket.ticketNumber}]`,
            text: emailBody,
            html: emailBody.replace(/\n/g, '<br>'),
          });

          console.log(`[Queue] Auto-resolve email sent to ${recipientEmail} for ticket ${ticketId}`);
        } catch (emailError) {
          console.error(`[Queue] Failed to send auto-resolve email for ticket ${ticketId}:`, emailError);
        }
      }
    } catch (error) {
      console.error(`[Queue] Failed to process ticket-auto-resolve job for ticket ${ticketId}:`, error);
      throw error; // Let PgBoss retry
    }
  });
}
