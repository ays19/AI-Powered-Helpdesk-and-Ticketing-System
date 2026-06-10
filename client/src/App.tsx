import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import type { Ticket, CreateTicketBody, TicketStatus, TicketPriority } from './types';
import { UserRole } from './types';
import TicketCard from './components/TicketCard';
import CreateTicketModal from './components/CreateTicketModal';
import { authClient } from './lib/auth-client';
import Login from '@/pages/Login';
import Users from '@/pages/Users';

const STATUS_OPTIONS: TicketStatus[] = ['open', 'in-progress', 'resolved', 'closed'];

function Home() {
  const { data: session, isPending } = authClient.useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchTickets();
    }
  }, [session]);

  const handleCreate = async (body: CreateTicketBody) => {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowModal(false);
      fetchTickets();
    }
  };

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    await fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchTickets();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
    fetchTickets();
  };

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-4" style={{ height: '100vh' }}>
        <div className="w-9 h-9 border-[3px] border-border-color border-t-accent rounded-full animate-spin-slow" />
        <p>Loading session…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  const filteredTickets =
    filterStatus === 'all'
      ? tickets
      : tickets.filter((t) => t.status === filterStatus);

  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    'in-progress': tickets.filter((t) => t.status === 'in-progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };

  return (
    <div>
      <header className="bg-gradient-to-br from-bg-secondary to-bg-card border-b border-border-color backdrop-blur-[20px] sticky top-0 z-[100]">
        <div className="max-w-[1200px] mx-auto py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[1.8rem] drop-shadow-[0_0_8px_var(--color-accent-glow)]">🎫</span>
            <h1 className="text-[1.5rem] font-extrabold bg-gradient-to-br from-accent to-[#a78bfa] bg-clip-text text-transparent tracking-[-0.02em]">Helpdesk</h1>
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
              className="inline-flex items-center gap-[6px] px-5 py-[10px] border-none rounded-md font-sans text-sm font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap bg-gradient-to-br from-accent to-[#8b5cf6] text-white shadow-glow hover:-translate-y-[1px] hover:shadow-[0_0_40px_var(--color-accent-glow)]" 
              onClick={() => setShowModal(true)}
            >
              + New Ticket
            </button>
            <button 
              className="inline-flex items-center gap-[6px] px-5 py-[10px] rounded-md font-sans text-sm font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap bg-transparent text-text-secondary border border-border-color hover:bg-bg-hover hover:text-text-primary" 
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto py-8 px-6">
        {/* Stats Bar */}
        <div className="flex gap-[10px] flex-wrap mb-8">
          {(['all', ...STATUS_OPTIONS] as const).map((s) => (
            <button
              key={s}
              className={`flex items-center gap-2 py-2 px-4 border rounded-xl font-sans text-[0.8rem] font-medium cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] capitalize ${
                filterStatus === s 
                  ? 'bg-accent border-accent text-white shadow-glow' 
                  : 'bg-bg-secondary border-border-color text-text-secondary hover:bg-bg-hover hover:border-accent hover:text-text-primary'
              }`}
              onClick={() => setFilterStatus(s)}
            >
              <span>{s}</span>
              <span className="bg-[rgba(255,255,255,0.15)] py-[2px] px-2 rounded-full text-[0.75rem] font-bold">{counts[s]}</span>
            </button>
          ))}
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-4">
            <div className="w-9 h-9 border-[3px] border-border-color border-t-accent rounded-full animate-spin-slow" />
            <p>Loading tickets…</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <span className="text-[3rem] block mb-3">📭</span>
            <p>No tickets found</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <CreateTicketModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/users" element={<Users />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}
