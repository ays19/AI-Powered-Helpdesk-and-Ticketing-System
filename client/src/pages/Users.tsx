import { Navigate, Link } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { UserRole } from '@/types';
import { ShieldAlert, Users as UsersIcon, ArrowLeft } from 'lucide-react';

export default function Users() {
  const { data: session, isPending } = authClient.useSession();

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

  // Check if role is admin. Better-auth admin plugin adds `role` to the user object.
  const isAdmin = session.user.role === UserRole.ADMIN;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary text-text-primary px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 border border-danger/20 mb-6 text-danger animate-bounce">
          <ShieldAlert className="size-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-text-secondary max-w-md mb-8">
          This page is only accessible to administrators. Please contact your system administrator if you believe this is an error.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-[10px] rounded-md font-sans text-sm font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] bg-bg-secondary text-text-secondary border border-border-color hover:bg-bg-hover hover:text-text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
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
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-[8px] rounded-md font-sans text-xs font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] bg-bg-secondary text-text-secondary border border-border-color hover:bg-bg-hover hover:text-text-primary"
            >
              <ArrowLeft className="size-3" />
              Tickets
            </Link>
            <button 
              className="inline-flex items-center gap-[6px] px-5 py-[10px] rounded-md font-sans text-sm font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap bg-transparent text-text-secondary border border-border-color hover:bg-bg-hover hover:text-text-primary" 
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto py-12 px-6 animate-[fadeIn_0.3s_ease]">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/20">
              <UsersIcon className="size-5" />
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-br from-text-primary to-text-secondary bg-clip-text text-transparent tracking-tight">
              Users
            </h1>
          </div>
        </div>
      </main>
    </div>
  );
}
