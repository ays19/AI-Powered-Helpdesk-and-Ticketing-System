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
    `inline-flex items-center gap-[6px] px-5 py-[10px] rounded-md font-sans text-sm font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap border ${
      pathname === path
        ? 'bg-accent/10 text-accent border-accent/40'
        : 'bg-transparent text-text-secondary border-border-color hover:bg-bg-hover hover:text-text-primary'
    }`;

  return (
    <>
      <header className="bg-gradient-to-br from-bg-secondary to-bg-card border-b border-border-color backdrop-blur-[20px] sticky top-0 z-[100]">
        <div className="max-w-[1200px] mx-auto py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[1.8rem] drop-shadow-[0_0_8px_var(--color-accent-glow)]">🎫</span>
            <Link
              to="/"
              className="text-[1.5rem] font-extrabold bg-gradient-to-br from-accent to-[#a78bfa] bg-clip-text text-transparent tracking-[-0.02em] hover:opacity-90"
            >
              Helpdesk
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[0.9rem] font-medium text-text-secondary">
              Welcome, {session?.user.name}
            </span>

            {/* Tickets nav link — visible to all */}
            <Link to="/tickets" className={navLinkClass('/tickets')}>
              Tickets
            </Link>

            {/* Users nav link — admins only */}
            {session?.user.role === UserRole.ADMIN && (
              <Link to="/users" className={navLinkClass('/users')}>
                Users
              </Link>
            )}

            {/* Optional page-specific action button */}
            {headerAction}

            <button
              className="inline-flex items-center gap-[6px] px-5 py-[10px] rounded-md font-sans text-sm font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap bg-transparent text-text-secondary border border-border-color hover:bg-bg-hover hover:text-text-primary"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto py-8 px-6">{children}</main>
    </>
  );
}
