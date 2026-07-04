import { Link, useLocation } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { UserRole } from '@/types';

interface AppLayoutProps {
  children: React.ReactNode;
  /** If provided, renders this button in the header right area (e.g. "+ New Ticket") */
  headerAction?: React.ReactNode;
}

export default function AppLayout({ children, headerAction }: AppLayoutProps) {
  const { data: session } = authClient.useSession();
  const { pathname } = useLocation();

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  const navLinkClass = (path: string) =>
    `inline-flex items-center gap-[6px] px-4 py-[8px] rounded-lg font-mono text-xs uppercase tracking-wider cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap border ${
      pathname === path
        ? 'bg-[#00d4a1]/15 text-[#00d4a1] border-[#00d4a1]/40 shadow-[0_0_12px_rgba(0,212,161,0.2)] font-bold'
        : 'bg-transparent text-[#c0c0d0] border-border-color/60 hover:bg-bg-hover hover:text-white hover:border-[#00d4a1]/30'
    }`;

  return (
    <>
      <header className="bg-bg-secondary/80 border-b border-border-color/50 backdrop-blur-[20px] sticky top-0 z-[100] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="max-w-[1200px] mx-auto py-3 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[1.6rem] filter drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">🎫</span>
            <Link
              to="/"
              className="text-[1.3rem] font-bold font-heading bg-gradient-to-r from-[#00d4a1] to-[#6c63ff] bg-clip-text text-transparent tracking-widest hover:opacity-90 transition-opacity uppercase"
            >
              Helpdesk
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-text-secondary pr-3 border-r border-border-color/60 tracking-wider">
              Welcome, {session?.user.name}
            </span>

            {/* Tickets nav link — visible to all */}
            <Link to="/tickets" className={`${navLinkClass('/tickets')} before:content-['//'] before:mr-1 before:opacity-50`}>
              Tickets
            </Link>

            {/* Users nav link — admins only */}
            {session?.user.role === UserRole.ADMIN && (
              <Link to="/users" className={`${navLinkClass('/users')} before:content-['//'] before:mr-1 before:opacity-50`}>
                Users
              </Link>
            )}

            {/* Optional page-specific action button */}
            {headerAction}

            <button
              className="inline-flex items-center gap-[6px] px-4 py-[8px] rounded-lg font-mono text-xs uppercase tracking-wider cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap bg-transparent text-[#c0c0d0] border border-border-color/60 hover:bg-bg-hover hover:text-white hover:border-danger/40 hover:text-danger"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto py-8 px-6 min-h-[calc(100vh-65px)] bg-bg-primary">{children}</main>
    </>
  );
}
