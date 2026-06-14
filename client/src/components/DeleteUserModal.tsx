import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface DeleteUserModalProps {
  user: User;
  onClose: () => void;
}

export default function DeleteUserModal({ user, onClose }: DeleteUserModalProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await axios.delete(`/api/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err: any) => {
      setServerError(err.response?.data?.error || 'Failed to delete user. Please try again.');
    },
  });

  const handleDelete = () => {
    setServerError(null);
    deleteMutation.mutate(user.id);
  };

  return (
    <Dialog open={true} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="size-5" />
            <DialogTitle>Delete User</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete <strong>{user.name}</strong>? This action can be undone by an administrator.
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <DialogFooter className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
