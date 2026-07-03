import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { authClient } from '@/lib/auth-client';
import AppLayout from '@/components/AppLayout';

const formatResolutionTime = (ms: number) => {
  if (!ms || ms <= 0) return 'N/A';
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  const { data: stats } = useQuery({
    queryKey: ['ticketStats'],
    queryFn: async () => {
      const res = await axios.get('/api/tickets/stats');
      return res.data as {
        totalTickets: number;
        openTickets: number;
        resolvedByAI: number;
        percentResolvedByAI: number;
        averageResolutionTimeMs: number;
        ticketsPerDay: {
          date: string;
          label: string;
          count: number;
        }[];
      };
    },
    enabled: !!session,
  });

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

  return (
    <AppLayout>
      {/* Dashboard Metrics Grid */}
      {stats && typeof stats.totalTickets === 'number' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-bg-secondary to-bg-card border border-border-color/60 rounded-xl p-5 shadow-sm transition-all hover:border-accent/40">
            <span className="text-[0.75rem] font-bold uppercase tracking-wider text-text-muted">Total Tickets</span>
            <div className="text-[1.8rem] font-extrabold text-text-primary mt-1">{stats.totalTickets}</div>
            <span className="text-[0.7rem] text-text-muted mt-2 block">All tickets in system</span>
          </div>
          <div className="bg-gradient-to-br from-bg-secondary to-bg-card border border-border-color/60 rounded-xl p-5 shadow-sm transition-all hover:border-accent/40">
            <span className="text-[0.75rem] font-bold uppercase tracking-wider text-text-muted">Open Tickets</span>
            <div className="text-[1.8rem] font-extrabold text-[#f9a826] mt-1">{stats.openTickets}</div>
            <span className="text-[0.7rem] text-text-muted mt-2 block">Waiting for response</span>
          </div>
          <div className="bg-gradient-to-br from-bg-secondary to-bg-card border border-border-color/60 rounded-xl p-5 shadow-sm transition-all hover:border-accent/40">
            <div className="flex justify-between items-start">
              <span className="text-[0.75rem] font-bold uppercase tracking-wider text-text-muted">Resolved by AI</span>
              <span className="bg-[rgba(139,92,246,0.15)] text-[#a78bfa] text-[0.65rem] font-bold px-1.5 py-0.5 rounded border border-[rgba(139,92,246,0.3)] text-center tracking-wider">AI</span>
            </div>
            <div className="text-[1.8rem] font-extrabold text-[#c084fc] mt-1">{stats.resolvedByAI}</div>
            <span className="text-[0.7rem] text-text-muted mt-2 block">Auto-resolved tickets</span>
          </div>
          <div className="bg-gradient-to-br from-bg-secondary to-bg-card border border-border-color/60 rounded-xl p-5 shadow-sm transition-all hover:border-accent/40">
            <div className="flex justify-between items-start">
              <span className="text-[0.75rem] font-bold uppercase tracking-wider text-text-muted">AI Success Rate</span>
              <span className="bg-[rgba(139,92,246,0.15)] text-[#a78bfa] text-[0.65rem] font-bold px-1.5 py-0.5 rounded border border-[rgba(139,92,246,0.3)] text-center tracking-wider">AI</span>
            </div>
            <div className="text-[1.8rem] font-extrabold text-[#c084fc] mt-1">{stats.percentResolvedByAI}%</div>
            <span className="text-[0.7rem] text-text-muted mt-2 block">Of total tickets resolved</span>
          </div>
          <div className="bg-gradient-to-br from-bg-secondary to-bg-card border border-border-color/60 rounded-xl p-5 shadow-sm transition-all hover:border-accent/40">
            <span className="text-[0.75rem] font-bold uppercase tracking-wider text-text-muted">Avg. Resolution Time</span>
            <div className="text-[1.8rem] font-extrabold text-[#4ecdc4] mt-1">
              {formatResolutionTime(stats.averageResolutionTimeMs)}
            </div>
            <span className="text-[0.7rem] text-text-muted mt-2 block">Time to resolution</span>
          </div>
        </div>
      )}

      {/* Ticket Volume Bar Chart */}
      {stats && Array.isArray(stats.ticketsPerDay) && (
        <div className="bg-gradient-to-br from-bg-secondary to-bg-card border border-border-color/60 rounded-xl p-6 shadow-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Ticket Volume</h3>
              <p className="text-xs text-text-secondary mt-1">Total tickets created per day over the past 30 days</p>
            </div>
            <span className="text-xs bg-accent/10 border border-accent/20 text-accent font-semibold px-2.5 py-1 rounded-full">
              Last 30 Days
            </span>
          </div>

          <div className="h-[200px] flex items-end gap-[6px] md:gap-[10px] w-full select-none pt-4 relative">
            {/* Gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-border-color/40 pb-6 pt-4">
              {[0, 1, 2, 3, 4].map((i) => {
                const maxVal = Math.max(...stats.ticketsPerDay.map((d) => d.count), 5);
                const val = Math.round(maxVal * (1 - i / 4));
                return (
                  <div key={i} className="w-full flex items-center justify-between border-t border-border-color/20 h-0 relative">
                    <span className="absolute -left-1 -translate-x-full text-[0.65rem] font-bold text-text-muted/60 bg-bg-secondary px-1">
                      {val}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bars */}
            <div className="flex items-end gap-1.5 md:gap-3 w-full h-[160px] z-10 px-2">
              {stats.ticketsPerDay.map((d, index) => {
                const maxVal = Math.max(...stats.ticketsPerDay.map((d) => d.count), 5);
                const heightPercent = maxVal > 0 ? (d.count / maxVal) * 100 : 0;
                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center group relative cursor-pointer"
                    style={{ height: '100%' }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-[#12121e]/95 border border-border-color text-text-primary text-[0.7rem] px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none whitespace-nowrap z-30 flex flex-col gap-0.5 items-center">
                      <span className="font-bold text-[0.72rem] text-accent">
                        {d.count} {d.count === 1 ? 'ticket' : 'tickets'}
                      </span>
                      <span className="text-text-muted text-[0.65rem]">{d.label}</span>
                    </div>

                    {/* Bar */}
                    <div className="w-full flex items-end justify-center h-full">
                      <div
                        className="w-full rounded-t-[3px] bg-accent/60 hover:bg-accent hover:shadow-[0_0_15px_var(--color-accent-glow)] transition-all duration-300"
                        style={{
                          height: `${Math.max(heightPercent, 2)}%`,
                          minHeight: d.count > 0 ? '4px' : '2px',
                          opacity: d.count > 0 ? 1 : 0.2,
                        }}
                      />
                    </div>

                    {/* X-axis labels */}
                    <span className="absolute top-full mt-2 text-[0.65rem] font-bold text-text-muted group-hover:text-text-primary transition-colors hidden md:block">
                      {index % 5 === 0 || index === stats.ticketsPerDay.length - 1 ? d.label : ''}
                    </span>
                    <span className="absolute top-full mt-2 text-[0.65rem] font-bold text-text-muted group-hover:text-text-primary transition-colors block md:hidden">
                      {index % 10 === 0 || index === stats.ticketsPerDay.length - 1 ? d.label : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="h-6" />
        </div>
      )}
    </AppLayout>
  );
}
