import { UserRole } from 'core';
export { UserRole };

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketCategory = 'general_question' | 'technical_question' | 'refund_request' | 'none';

export interface TicketReply {
  id: string;
  content: string;
  senderType: 'agent' | 'customer';
  ticketId: string;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null;
  customerEmail?: string | null;
  customerName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  customerEmail?: string;
  userId?: string;
  user?: {
    name: string;
    email: string;
  } | null;
  assignedToId?: string | null;
  assigned_to?: User | null;
  replies?: TicketReply[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketBody {
  title: string;
  description?: string;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned_to?: string | null;
}

