import { Navigate, Link } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import { UserRole, type User } from '../types';
import { ShieldAlert, Users as UsersIcon, ArrowLeft, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import UserModal, { CreateUserButton } from '../components/UserModal';
import UserTable from '../components/UserTable';

export default function Users() {
  const { data: session, isPending } = authClient.useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axios.get<User[]>('/api/users');
      return response.data;
    },
    enabled: !!session && session.user.role === UserRole.ADMIN,
  });

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-4" style={{ height: '100vh' }}>
        <div className="w-9 h-9 border-[3px] border-border-color border-t-accent rounded-full animate-spin-slow" />
        <p>Loading session…</p>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (session.user.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary text-text-primary px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 border border-danger/20 mb-6 text-danger animate-bounce">
          <ShieldAlert className="size-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-text-secondary max-w-md mb-8">This page is only accessible to administrators.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-[10px] rounded-md font-sans text-sm font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] bg-bg-secondary text-text-secondary border border-border-color hover:bg-bg-hover hover:text-text-primary">
          <ArrowLeft className="size-4" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="bg-gradient-to-br from-bg-secondary to-bg-card border-b border-border-color backdrop-blur-[20px] sticky top-0 z-[100]">
        <div className="max-w-[1200px] mx-auto py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[1.8rem]">🎫</span>
            <Link to="/" className="text-[1.5rem] font-extrabold bg-gradient-to-br from-accent to-[#a78bfa] bg-clip-text text-transparent tracking-[-0.02em] hover:opacity-90">Helpdesk</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[0.9rem] font-medium text-text-secondary">Welcome, {session.user.name}</span>
            <Link to="/" className="inline-flex items-center gap-2 px-4 py-[8px] rounded-md font-sans text-xs font-semibold cursor-pointer bg-bg-secondary text-text-secondary border border-border-color hover:bg-bg-hover hover:text-text-primary">
              <ArrowLeft className="size-3" /> Tickets
            </Link>
            <button className="inline-flex items-center gap-[6px] px-5 py-[10px] rounded-md font-sans text-sm font-semibold cursor-pointer bg-transparent text-text-secondary border border-border-color hover:bg-bg-hover hover:text-text-primary" onClick={() => authClient.signOut()}>Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto py-12 px-6 animate-[fadeIn_0.3s_ease]">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/20">
                <UsersIcon className="size-5" />
              </div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-br from-text-primary to-text-secondary bg-clip-text text-transparent tracking-tight">Users</h1>
            </div>
            <CreateUserButton onClick={handleOpenCreateModal} />
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger">
              <AlertCircle className="size-5" />
              <p className="text-sm font-medium">{error instanceof Error ? error.message : 'An error occurred'}</p>
            </div>
          )}

          <Card className="border-border-color bg-bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4"><CardTitle className="text-lg font-semibold text-text-primary">User Directory</CardTitle></CardHeader>
            <CardContent>
              <UserTable users={users} isLoading={isLoading} onEdit={handleOpenEditModal} />
            </CardContent>
          </Card>
        </div>
      </main>

      {isModalOpen && (
        <UserModal 
          user={editingUser || undefined} 
          onClose={handleCloseModal} 
          title={editingUser ? 'Edit User' : 'Create User'} 
        />
      )}
    </div>
  );
}
