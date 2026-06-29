import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  ArrowLeft, 
  Trash2, 
  Calendar, 
  Mail, 
  User as UserIcon, 
  Tag, 
  Clock,
  Shield,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import type { Ticket, TicketStatus, TicketPriority } from '@/types';
import { UserRole } from '@/types';
import { authClient } from '@/lib/auth-client';

const PRIORITY_DOT_CLASSES: Record<TicketPriority, string> = {
  low: 'bg-priority-low',
  medium: 'bg-priority-medium',
  high: 'bg-priority-high',
  critical: 'bg-priority-critical',
};

const PRIORITY_TEXT_CLASSES: Record<TicketPriority, string> = {
  low: 'text-priority-low',
  medium: 'text-priority-medium',
  high: 'text-priority-high',
  critical: 'text-priority-critical',
};

const STATUS_BADGE_CLASSES: Record<TicketStatus, string> = {
  open: 'bg-[rgba(78,205,196,0.15)] text-status-open border border-[rgba(78,205,196,0.3)]',
  'in-progress': 'bg-[rgba(249,168,38,0.15)] text-status-in-progress border border-[rgba(249,168,38,0.3)]',
  resolved: 'bg-[rgba(108,99,255,0.15)] text-status-resolved border border-[rgba(108,99,255,0.3)]',
  closed: 'bg-[rgba(107,107,138,0.15)] text-status-closed border border-[rgba(107,107,138,0.3)]',
};

const CATEGORY_LABELS: Record<string, string> = {
  general_question: 'General Question',
  technical_question: 'Technical Question',
  refund_request: 'Refund Request',
};

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  general_question: 'bg-[rgba(107,107,138,0.15)] text-text-secondary border border-[rgba(107,107,138,0.3)]',
  technical_question: 'bg-[rgba(108,99,255,0.15)] text-accent border border-[rgba(108,99,255,0.3)]',
  refund_request: 'bg-[rgba(255,77,106,0.15)] text-danger border border-[rgba(255,77,106,0.3)]',
};

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: ticket, isLoading, error } = useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const res = await axios.get<Ticket>(`/api/tickets/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: agents = [], isLoading: isLoadingAgents } = useQuery<any[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await axios.get<any[]>('/api/agents');
      return res.data;
    },
    enabled: !!session,
  });

  const statusMutation = useMutation({
    mutationFn: async (status: TicketStatus) => {
      const res = await axios.patch(`/api/tickets/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      showToast('Status updated successfully', 'success');
    },
    onError: () => {
      showToast('Failed to update status', 'error');
    }
  });

  const assignMutation = useMutation({
    mutationFn: async (assignedToId: string | null) => {
      const res = await axios.patch(`/api/tickets/${id}`, { assigned_to: assignedToId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      showToast('Assignment updated successfully', 'success');
    },
    onError: () => {
      showToast('Failed to update assignment', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.delete(`/api/tickets/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      navigate('/');
    },
  });

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate('/login');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAssignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const assignedToId = val === 'unassigned' ? null : val;
    assignMutation.mutate(assignedToId);
  };

  if (!session) {
    return null;
  }

  // Sender details formatting helper (similar to dashboard)
  let senderName = 'System';
  let senderEmail = 'system@helpdesk.com';
  if (ticket) {
    if (ticket.customerEmail) {
      senderEmail = ticket.customerEmail;
      if (ticket.user && ticket.user.email === ticket.customerEmail) {
        senderName = ticket.user.name;
      } else {
        const prefix = ticket.customerEmail.split('@')[0] || '';
        senderName = prefix
          .split('.')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }
    } else if (ticket.user) {
      senderName = ticket.user.name;
      senderEmail = ticket.user.email;
    }
  }

  return (
    <>
      <header className="bg-gradient-to-br from-bg-secondary to-bg-card border-b border-border-color backdrop-blur-[20px] sticky top-0 z-[100]">
        <div className="max-w-[1200px] mx-auto py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[1.8rem] drop-shadow-[0_0_8px_var(--color-accent-glow)]">🎫</span>
            <Link to="/" className="text-[1.5rem] font-extrabold bg-gradient-to-br from-accent to-[#a78bfa] bg-clip-text text-transparent tracking-[-0.02em] hover:opacity-90">
              Helpdesk
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[0.9rem] font-medium text-text-secondary">Welcome, {session.user.name}</span>
            {session.user.role === UserRole.ADMIN && (
              <Link 
                to="/users"
                className="inline-flex items-center gap-[6px] px-5 py-[10px] rounded-md font-sans text-sm font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap bg-transparent text-text-secondary border border-border-color hover:bg-bg-hover hover:text-text-primary"
              >
                Users
              </Link>
            )}
            <button 
              className="inline-flex items-center gap-[6px] px-5 py-[10px] rounded-md font-sans text-sm font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap bg-transparent text-text-secondary border border-border-color hover:bg-bg-hover hover:text-text-primary" 
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto py-8 px-6">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </Link>

        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-10 bg-bg-card border border-border-color rounded-xl w-3/4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="h-32 bg-bg-card border border-border-color rounded-xl" />
                <div className="h-48 bg-bg-card border border-border-color rounded-xl" />
              </div>
              <div className="h-64 bg-bg-card border border-border-color rounded-xl" />
            </div>
          </div>
        ) : error || !ticket ? (
          <div className="bg-bg-card border border-border-color rounded-xl p-8 text-center flex flex-col items-center justify-center gap-4">
            <AlertCircle className="w-12 h-12 text-danger" />
            <h2 className="text-xl font-bold">Ticket Not Found</h2>
            <p className="text-text-secondary max-w-md">
              The ticket you are looking for does not exist or you do not have permission to view it.
            </p>
            <Link 
              to="/" 
              className="px-5 py-2.5 bg-gradient-to-br from-accent to-[#8b5cf6] text-white font-semibold rounded-md shadow-glow hover:shadow-[0_0_40px_var(--color-accent-glow)] transition-all"
            >
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Left Content Area: Ticket Details */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Ticket Card Main */}
              <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-md relative overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-[0.72rem] font-mono font-bold text-text-muted bg-bg-secondary px-2.5 py-1 rounded border border-border-color flex items-center gap-1.5">
                    ID: {ticket.id}
                    <button 
                      onClick={() => copyToClipboard(ticket.id)} 
                      className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                      title="Copy Ticket ID"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-status-open" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </span>
                  
                  <span className={`px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-[0.05em] ${CATEGORY_BADGE_CLASSES[ticket.category] || CATEGORY_BADGE_CLASSES.general_question}`}>
                    <Tag className="w-3 h-3 inline mr-1 -mt-0.5" />
                    {CATEGORY_LABELS[ticket.category] || ticket.category}
                  </span>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-[0.05em] bg-bg-secondary border border-border-color ${PRIORITY_TEXT_CLASSES[ticket.priority]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT_CLASSES[ticket.priority]}`} />
                    {ticket.priority} Priority
                  </span>
                </div>

                <h1 className="text-xl md:text-2xl font-bold text-text-primary mb-4 leading-snug">
                  {ticket.title.replace(/\s*\(Ticket #\d+\)/, '')}
                </h1>

                <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs text-text-secondary border-t border-border-color/60 pt-4 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-text-muted" />
                    Created: {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-text-muted" />
                    Last Updated: {new Date(ticket.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Sender Info Card */}
              <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-md">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4">Requester Details</h3>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-lg font-bold">
                    {senderName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-text-primary flex items-center gap-2">
                      {senderName}
                      {ticket.user && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-accent/20 text-accent border border-accent/30">
                          <Shield className="w-2.5 h-2.5" /> Registered
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-text-secondary flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-4 h-4 text-text-muted" />
                      <a href={`mailto:${senderEmail}`} className="hover:underline hover:text-accent">
                        {senderEmail}
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-md">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4">Description</h3>
                <div className="bg-bg-secondary/40 border border-border-color/60 rounded-lg p-5 text-sm text-text-primary leading-relaxed whitespace-pre-wrap min-h-[120px]">
                  {ticket.description || <span className="text-text-muted italic">No description provided.</span>}
                </div>
              </div>

            </div>

            {/* Right Sidebar: Control Panel */}
            <div className="space-y-6">
              
              <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-md space-y-6">
                
                {/* Current Status Display */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2.5">Ticket Status</h3>
                  <div className="flex items-center justify-between">
                    <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.05em] ${STATUS_BADGE_CLASSES[ticket.status]}`}>
                      {ticket.status}
                    </span>
                    {ticket.status === 'resolved' && (
                      <CheckCircle2 className="w-5 h-5 text-status-resolved" />
                    )}
                  </div>
                </div>

                {/* Status Update Control */}
                <div className="border-t border-border-color/60 pt-4">
                  <label htmlFor="details-status" className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                    Update Status
                  </label>
                  <select
                    id="details-status"
                    className="w-full py-2.5 px-3 border border-border-color rounded-md bg-bg-secondary text-text-primary font-sans text-sm cursor-pointer transition-all hover:border-accent focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)]"
                    value={ticket.status}
                    onChange={(e) => statusMutation.mutate(e.target.value as TicketStatus)}
                    disabled={statusMutation.isPending}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Assigned To Section */}
                <div className="border-t border-border-color/60 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2.5">Assigned To</h3>
                  <div className="mb-3">
                    {ticket.assigned_to ? (
                      <span className="text-sm font-semibold text-text-primary">
                        {ticket.assigned_to.name} <span className="text-xs font-normal text-text-muted capitalize">({ticket.assigned_to.role})</span>
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-text-muted italic">Unassigned</span>
                    )}
                  </div>
                  
                  <label htmlFor="details-assign" className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                    Update Assignment
                  </label>
                  <select
                    id="details-assign"
                    className="w-full py-2.5 px-3 border border-border-color rounded-md bg-bg-secondary text-text-primary font-sans text-sm cursor-pointer transition-all hover:border-accent focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)]"
                    value={ticket.assignedToId || 'unassigned'}
                    onChange={handleAssignChange}
                    disabled={assignMutation.isPending || isLoadingAgents}
                  >
                    <option value="unassigned" className="text-text-muted">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} {agent.role ? `(${agent.role})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions: Delete */}
                <div className="border-t border-border-color/60 pt-6">
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
                        deleteMutation.mutate();
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="w-full bg-danger/10 text-danger border border-danger/30 hover:bg-danger hover:text-white transition-all flex items-center justify-center gap-2 py-2.5 rounded-md font-sans text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Ticket
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}
      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[1000] px-4 py-3 rounded-lg border shadow-lg flex items-center gap-2 animate-fadeIn ${
          toast.type === 'success' 
            ? 'bg-[rgba(78,205,196,0.15)] text-status-open border-[rgba(78,205,196,0.3)] backdrop-blur-md'
            : 'bg-[rgba(255,77,106,0.15)] text-danger border-[rgba(255,77,106,0.3)] backdrop-blur-md'
        }`}>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
    </>
  );
}
