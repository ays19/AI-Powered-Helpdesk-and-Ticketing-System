import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SortingState } from '@tanstack/react-table';
import type { Ticket, CreateTicketBody, TicketStatus } from '@/types';
import { UserRole } from '@/types';
import TicketTable from '@/components/TicketTable';
import CreateTicketModal from '@/components/CreateTicketModal';
import { authClient } from '@/lib/auth-client';

const STATUS_OPTIONS: TicketStatus[] = ['open', 'in-progress', 'resolved', 'closed'];

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const filteredTickets = tickets.filter((t) => {
    // 1. Status Filter
    if (filterStatus !== 'all' && t.status !== filterStatus) {
      return false;
    }

    // 2. Search Query (searches across subject, sender name, and sender email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const subject = t.title.toLowerCase();
      
      let senderName = 'System';
      let senderEmail = 'system@helpdesk.com';
      if (t.customerEmail) {
        senderEmail = t.customerEmail;
        if (t.user && t.user.email === t.customerEmail) {
          senderName = t.user.name;
        } else {
          const prefix = t.customerEmail.split('@')[0];
          senderName = prefix
            .split('.')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        }
      } else if (t.user) {
        senderName = t.user.name;
        senderEmail = t.user.email;
      }
      
      const nameMatch = senderName.toLowerCase().includes(query);
      const emailMatch = senderEmail.toLowerCase().includes(query);
      const subjectMatch = subject.includes(query);

      if (!nameMatch && !emailMatch && !subjectMatch) {
        return false;
      }
    }

    // 3. Category Filter
    if (categoryFilter !== 'all' && t.category !== categoryFilter) {
      return false;
    }

    // 4. Priority Filter
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
      return false;
    }

    // 5. Date Range Filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (new Date(t.createdAt) < fromDate) {
        return false;
      }
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(t.createdAt) > toDate) {
        return false;
      }
    }

    return true;
  });

  const getFilteredTicketsForCounts = (status: TicketStatus | 'all') => {
    return tickets.filter((t) => {
      if (status !== 'all' && t.status !== status) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const subject = t.title.toLowerCase();
        let senderName = 'System';
        let senderEmail = 'system@helpdesk.com';
        if (t.customerEmail) {
          senderEmail = t.customerEmail;
          if (t.user && t.user.email === t.customerEmail) {
            senderName = t.user.name;
          } else {
            const prefix = t.customerEmail.split('@')[0];
            senderName = prefix
              .split('.')
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ');
          }
        } else if (t.user) {
          senderName = t.user.name;
          senderEmail = t.user.email;
        }
        
        const nameMatch = senderName.toLowerCase().includes(query);
        const emailMatch = senderEmail.toLowerCase().includes(query);
        const subjectMatch = subject.includes(query);
        if (!nameMatch && !emailMatch && !subjectMatch) {
          return false;
        }
      }
      if (categoryFilter !== 'all' && t.category !== categoryFilter) {
        return false;
      }
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
        return false;
      }
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (new Date(t.createdAt) < fromDate) return false;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(t.createdAt) > toDate) return false;
      }
      return true;
    });
  };

  const counts = {
    all: getFilteredTicketsForCounts('all').length,
    open: getFilteredTicketsForCounts('open').length,
    'in-progress': getFilteredTicketsForCounts('in-progress').length,
    resolved: getFilteredTicketsForCounts('resolved').length,
    closed: getFilteredTicketsForCounts('closed').length,
  };

  const hasActiveFilters = 
    searchQuery !== '' || 
    categoryFilter !== 'all' || 
    priorityFilter !== 'all' || 
    dateFrom !== '' || 
    dateTo !== '';

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const totalItems = filteredTickets.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, categoryFilter, priorityFilter, dateFrom, dateTo, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

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
          {(['all', ...STATUS_OPTIONS] as const).map((s) => {
            const isActive = filterStatus === s;
            return (
              <button
                key={s}
                className={`flex items-center gap-2 py-2 px-4 border rounded-xl font-sans text-[0.8rem] font-medium cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] capitalize ${
                  isActive 
                    ? 'bg-accent border-accent text-[#0f0f1a] font-bold shadow-glow' 
                    : 'bg-bg-secondary border-border-color text-text-secondary hover:bg-bg-hover hover:border-accent hover:text-text-primary'
                }`}
                onClick={() => setFilterStatus(s)}
              >
                <span>{s}</span>
                <span className={`py-[2px] px-2 rounded-full text-[0.75rem] font-bold ${
                  isActive 
                    ? 'bg-[#0f0f1a] text-white' 
                    : 'bg-[rgba(255,255,255,0.15)] text-text-primary'
                }`}>{counts[s]}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="bg-bg-card border border-border-color rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4 text-text-primary">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
            <label htmlFor="search" className="text-xs font-semibold text-text-secondary">Search</label>
            <input
              id="search"
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 py-[6px] px-3 border border-border-color rounded-md bg-bg-secondary text-text-primary font-sans text-xs transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus:border-accent placeholder:text-text-muted"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-auto min-w-[150px] flex flex-col gap-1.5">
            <label htmlFor="category" className="text-xs font-semibold text-text-secondary">Category</label>
            <select
              id="category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-9 py-[6px] px-3 border border-border-color rounded-md bg-bg-secondary text-text-primary font-sans text-xs cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] hover:border-accent focus:outline-none focus:border-accent"
            >
              <option value="all">All Categories</option>
              <option value="general_question">General Question</option>
              <option value="technical_question">Technical Question</option>
              <option value="refund_request">Refund Request</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="w-full sm:w-auto min-w-[150px] flex flex-col gap-1.5">
            <label htmlFor="priority" className="text-xs font-semibold text-text-secondary">Priority</label>
            <select
              id="priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full h-9 py-[6px] px-3 border border-border-color rounded-md bg-bg-secondary text-text-primary font-sans text-xs cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] hover:border-accent focus:outline-none focus:border-accent"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Date From */}
          <div className="w-[calc(50%-8px)] sm:w-auto min-w-[130px] flex flex-col gap-1.5">
            <label htmlFor="dateFrom" className="text-xs font-semibold text-text-secondary">From Date</label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full h-9 py-[6px] px-3 border border-border-color rounded-md bg-bg-secondary text-text-primary font-sans text-xs transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus:border-accent"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Date To */}
          <div className="w-[calc(50%-8px)] sm:w-auto min-w-[130px] flex flex-col gap-1.5">
            <label htmlFor="dateTo" className="text-xs font-semibold text-text-secondary">To Date</label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full h-9 py-[6px] px-3 border border-border-color rounded-md bg-bg-secondary text-text-primary font-sans text-xs transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus:border-accent"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="w-full sm:w-auto self-end flex flex-col">
              <button
                onClick={handleClearFilters}
                className="h-9 py-[6px] px-4 rounded-md font-sans text-xs font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap bg-transparent text-danger border border-danger/40 hover:bg-danger/10"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        <TicketTable
          tickets={paginatedTickets}
          isLoading={loading}
          sorting={sorting}
          onSortingChange={setSorting}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="mt-4 bg-bg-card border border-border-color rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-text-secondary text-sm">
            {/* Page Size & Info */}
            <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 py-1 px-2 border border-border-color rounded-md bg-bg-secondary text-text-primary font-sans text-xs cursor-pointer focus:outline-none focus:border-accent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>entries</span>
              </div>
              <span className="text-text-muted text-xs">
                Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems} entries
              </span>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border-color bg-bg-secondary text-text-primary text-xs font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] hover:bg-bg-hover hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-bg-secondary disabled:hover:border-border-color"
                title="First Page"
              >
                &laquo;
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 inline-flex items-center justify-center rounded-md border border-border-color bg-bg-secondary text-text-primary text-xs font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] hover:bg-bg-hover hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-bg-secondary disabled:hover:border-border-color"
                title="Previous Page"
              >
                Previous
              </button>
              <span className="text-xs text-text-muted px-2 select-none">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 inline-flex items-center justify-center rounded-md border border-border-color bg-bg-secondary text-text-primary text-xs font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] hover:bg-bg-hover hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-bg-secondary disabled:hover:border-border-color"
                title="Next Page"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border-color bg-bg-secondary text-text-primary text-xs font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] hover:bg-bg-hover hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-bg-secondary disabled:hover:border-border-color"
                title="Last Page"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
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
