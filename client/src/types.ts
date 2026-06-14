export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  customerEmail?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketBody {
  title: string;
  description?: string;
  priority?: TicketPriority;
}
