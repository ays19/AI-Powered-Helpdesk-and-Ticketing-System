import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { Ticket, CreateTicketBody, TicketStatus, TicketPriority } from './types';
import TicketCard from './components/TicketCard';
import CreateTicketModal from './components/CreateTicketModal';
import { authClient } from './lib/auth-client';
import Login from './pages/Login';

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
      <div className="loader" style={{ height: '100vh' }}>
        <div className="spinner" />
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
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🎫</span>
            <h1>Helpdesk</h1>
          </div>
          <div className="header-actions">
            <span className="user-name">Welcome, {session.user.name}</span>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + New Ticket
            </button>
            <button className="btn btn-ghost" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Stats Bar */}
        <div className="stats-bar">
          {(['all', ...STATUS_OPTIONS] as const).map((s) => (
            <button
              key={s}
              className={`stat-chip ${filterStatus === s ? 'active' : ''} status-${s}`}
              onClick={() => setFilterStatus(s)}
            >
              <span className="stat-label">{s}</span>
              <span className="stat-count">{counts[s]}</span>
            </button>
          ))}
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="loader">
            <div className="spinner" />
            <p>Loading tickets…</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">📭</span>
            <p>No tickets found</p>
          </div>
        ) : (
          <div className="ticket-grid">
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
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}
