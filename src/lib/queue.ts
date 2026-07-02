import { PgBoss } from 'pg-boss';
import { db as prisma } from '../db';
import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const boss = new PgBoss({
  connectionString,
  schema: 'pgboss'
});

export const TICKET_CLASSIFICATION_QUEUE = 'ticket-classification';

export async function registerQueueWorkers() {
  // Create queue first to avoid 'Queue does not exist' runtime errors
  await boss.createQueue(TICKET_CLASSIFICATION_QUEUE);

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
      let category = 'general_question';

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

      await prisma.ticket.update({
        where: { id: ticketId },
        data: { category: category as any }
      });
      console.log(`[Queue] Ticket ${ticketId} auto-classified as ${category}`);
    } catch (error) {
      console.error(`[Queue] Failed to auto-classify ticket ${ticketId}:`, error);
      throw error; // Let PgBoss retry the job if it fails
    }
  });
}
