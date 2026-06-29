import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface TicketLike {
  customerEmail?: string | null;
  user?: {
    name: string;
    email: string;
  } | null;
}

export function getTicketSender(ticket: TicketLike) {
  let name = 'System';
  let email = 'system@helpdesk.com';

  if (ticket.customerEmail) {
    email = ticket.customerEmail;
    if (ticket.user && ticket.user.email === ticket.customerEmail) {
      name = ticket.user.name;
    } else {
      const prefix = ticket.customerEmail.split('@')[0] || '';
      name = prefix
        .split('.')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
  } else if (ticket.user) {
    name = ticket.user.name;
    email = ticket.user.email;
  }

  return { name, email };
}

