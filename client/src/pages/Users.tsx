import { Navigate, Link } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import { UserRole, type User } from '../types';
import { ShieldAlert, Users as UsersIcon, ArrowLeft, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import UserModal, { CreateUserButton } from '../components/UserModal';
import UserTable from '../components/UserTable';
import DeleteUserModal from '../components/DeleteUserModal';
import AppLayout from '../components/AppLayout';

export default function Users() {
  const { data: session, isPending } = authClient.useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

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

  const handleOpenDeleteModal = (user: User) => {
    setUserToDelete(user);
  };

  const handleCloseDeleteModal = () => {
    setUserToDelete(null);
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
    <>
      <AppLayout headerAction={<CreateUserButton onClick={handleOpenCreateModal} />}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/20">
              <UsersIcon className="size-5" />
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-br from-text-primary to-text-secondary bg-clip-text text-transparent tracking-tight">Users</h1>
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
              <UserTable users={users} isLoading={isLoading} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
            </CardContent>
          </Card>
        </div>
      </AppLayout>

      {isModalOpen && (
        <UserModal
          user={editingUser || undefined}
          onClose={handleCloseModal}
          title={editingUser ? 'Edit User' : 'Create User'}
        />
      )}

      {userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          onClose={handleCloseDeleteModal}
        />
      )}
    </>
  );
}
