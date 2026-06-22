import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SortingState } from '@tanstack/react-table';
import type { Ticket, CreateTicketBody, TicketStatus } from './types';
import { UserRole } from './types';
import TicketTable from './components/TicketTable';
import CreateTicketModal from './components/CreateTicketModal';
import { authClient } from './lib/auth-client';
import Login from '@/pages/Login';
import Users from '@/pages/Users';
import ProtectedRoute from '@/components/ProtectedRoute';

axios.defaults.withCredentials = true;

const STATUS_OPTIONS: TicketStatus[] = ['open', 'in-progress', 'resolved', 'closed'];

export function Home() {
  const { data: session, isPending } = authClient.useSession();
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const queryClient = useQueryClient();

  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined;

  const { data: tickets = [], isLoading: loading } = useQuery<Ticket[]>({
    queryKey: ['tickets', sortBy, sortOrder],
    queryFn: async () => {
      const res = await axios.get<Ticket[]>('/api/tickets', {
        params: { sortBy, sortOrder },
      });
      return res.data;
    },
    enabled: !!session,
  });

  const createMutation = useMutation({
    mutationFn: async (body: CreateTicketBody) => {
      const res = await axios.post('/api/tickets', body);
      return res.data;
    },
    onSuccess: () => {
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TicketStatus }) => {
      const res = await axios.patch(`/api/tickets/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/tickets/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const handleCreate = async (body: CreateTicketBody) => {
    createMutation.mutate(body);
  };

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    statusMutation.mutate({ id, status });
  };

  const handleDelete = async (id: string) => {
    deleteMutation.mutate(id);
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

        <TicketTable
          tickets={filteredTickets}
          isLoading={loading}
          sorting={sorting}
          onSortingChange={setSorting}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      </main>

      {showModal && (
        <CreateTicketModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
}

const queryClientInstance = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
