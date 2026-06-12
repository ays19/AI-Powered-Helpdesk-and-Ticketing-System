import { Navigate, Link } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { UserRole } from '@/types';
import { ShieldAlert, Users as UsersIcon, ArrowLeft, Mail, User as UserIcon, Calendar, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function Users() {
  const { data: session, isPending } = authClient.useSession();
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axios.get<User[]>('/api/users');
      return response.data;
    },
    enabled: !!session && session.user.role === UserRole.ADMIN,
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

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger">
              <AlertCircle className="size-5" />
              <p className="text-sm font-medium">{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
            </div>
          )}

          <Card className="border-border-color bg-bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-text-primary">User Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-color text-text-secondary text-xs uppercase tracking-wider font-semibold">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <Skeleton className="h-4 w-28" />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Skeleton className="h-4 w-40" />
                          </td>
                          <td className="px-4 py-4">
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </td>
                          <td className="px-4 py-4">
                            <Skeleton className="h-4 w-20" />
                          </td>
                        </tr>
                      ))
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-text-secondary">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-bg-hover/50 transition-colors group">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                                <UserIcon className="size-4" />
                              </div>
                              <span className="font-medium text-text-primary">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-text-secondary text-sm">
                              <Mail className="size-3.5" />
                              {user.email}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                              user.role === UserRole.ADMIN 
                                ? 'bg-accent/20 text-accent border border-accent/30' 
                                : 'bg-bg-secondary text-text-secondary border border-border-color'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-text-secondary text-sm">
                              <Calendar className="size-3.5" />
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
