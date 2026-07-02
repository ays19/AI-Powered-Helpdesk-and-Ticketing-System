import { useState } from 'react';
import { 
  Calendar, 
  Mail, 
  Tag, 
  Clock,
  Shield,
  Copy,
  Check,
  Sparkles,
  Loader2
} from 'lucide-react';
import type { Ticket, TicketStatus, TicketPriority } from '@/types';
import { getTicketSender } from '@/lib/utils';
import axios from 'axios';

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
  none: 'None',
};

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  general_question: 'bg-[rgba(107,107,138,0.15)] text-text-secondary border border-[rgba(107,107,138,0.3)]',
  technical_question: 'bg-[rgba(108,99,255,0.15)] text-accent border border-[rgba(108,99,255,0.3)]',
  refund_request: 'bg-[rgba(255,77,106,0.15)] text-danger border border-[rgba(255,77,106,0.3)]',
  none: 'bg-bg-secondary text-text-muted border border-border-color',
};

interface TicketDetailProps {
  ticket: Ticket;
}

export default function TicketDetail({ ticket }: TicketDetailProps) {
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const response = await axios.post(`/api/tickets/${ticket.ticketNumber}/summarize`);
      if (response.data?.summary) {
        setSummary(response.data.summary);
      }
    } catch (err: any) {
      setSummaryError(err.response?.data?.error || 'Failed to generate ticket summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const { name: senderName, email: senderEmail } = getTicketSender(ticket);

  return (
    <div className="space-y-6">
      {/* Ticket Card Main */}
      <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-[0.72rem] font-mono font-bold text-text-muted bg-bg-secondary px-2.5 py-1 rounded border border-border-color">
            Reference: #{ticket.ticketNumber}
          </span>
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
          
          <span className={`inline-block px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-[0.05em] ${STATUS_BADGE_CLASSES[ticket.status]}`}>
            {ticket.status}
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
      <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-md space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4">Description</h3>
          <div className="bg-bg-secondary/40 border border-border-color/60 rounded-lg p-5 text-sm text-text-primary leading-relaxed whitespace-pre-wrap min-h-[120px]">
            {ticket.description || <span className="text-text-muted italic">No description provided.</span>}
          </div>
        </div>

        {/* Summarize button and display */}
        <div className="pt-4 border-t border-border-color/40 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border-color rounded-md bg-bg-secondary text-text-secondary font-sans text-xs font-semibold cursor-pointer transition-all hover:bg-bg-hover hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSummarizing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              )}
              {isSummarizing ? 'Summarizing...' : 'Summarize Ticket'}
            </button>
          </div>

          {summary && (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 text-sm text-text-primary animate-fadeIn">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Summary
              </h4>
              <p className="leading-relaxed whitespace-pre-wrap">{summary}</p>
            </div>
          )}
          {summaryError && (
            <span className="text-danger text-xs">{summaryError}</span>
          )}
        </div>
      </div>
    </div>
  );
}
