import type { Ticket, TicketStatus } from '../types';

interface Props {
  ticket: Ticket;
  onStatusChange: (id: string, status: TicketStatus) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_EMOJI: Record<string, string> = {
  low: '🟢',
  medium: '🟡',
  high: '🟠',
  critical: '🔴',
};

export default function TicketCard({ ticket, onStatusChange, onDelete }: Props) {
  return (
    <div className={`ticket-card priority-${ticket.priority}`}>
      <div className="ticket-header">
        <span className="ticket-id">#{ticket.id}</span>
        <span className={`badge status-${ticket.status}`}>{ticket.status}</span>
      </div>

      <h3 className="ticket-title">{ticket.title}</h3>
      <p className="ticket-desc">{ticket.description}</p>

      <div className="ticket-meta">
        <span className="priority-badge">
          {PRIORITY_EMOJI[ticket.priority]} {ticket.priority}
        </span>
        <span className="ticket-date">
          {new Date(ticket.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="ticket-actions">
        <select
          className="status-select"
          value={ticket.status}
          onChange={(e) => onStatusChange(ticket.id, e.target.value as TicketStatus)}
        >
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(ticket.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}
