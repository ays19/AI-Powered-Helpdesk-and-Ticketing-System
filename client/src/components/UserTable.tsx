import { User, UserRole } from '@/types';
import { Mail, User as UserIcon, Calendar, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onEdit: (user: User) => void;
}

export default function UserTable({ users, isLoading, onEdit }: UserTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border-color text-text-secondary text-xs uppercase tracking-wider font-semibold">
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3 text-right">Actions</th>
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
                <td className="px-4 py-4"><Skeleton className="h-4 w-40" /></td>
                <td className="px-4 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                <td className="px-4 py-4"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
              </tr>
            ))
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-12 text-text-secondary">
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
                <td className="px-4 py-4 text-right">
                  <button 
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-lg text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`Edit ${user.name}`}
                  >
                    <Pencil className="size-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

