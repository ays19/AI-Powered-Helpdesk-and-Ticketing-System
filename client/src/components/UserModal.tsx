import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Plus, 
  X, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  User as UserIcon 
} from 'lucide-react';
import { User } from '../types';
import { createUserSchema, updateUserSchema, type CreateUserFormValues, type UpdateUserFormValues } from 'core';

type UserFormValues = CreateUserFormValues & Partial<UpdateUserFormValues>;

function UserModal({ user, onClose, title }: { user?: User; onClose: () => void; title?: string }) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);

  const isEditMode = !!user;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(isEditMode ? updateUserSchema : createUserSchema),
    defaultValues: user ? {
      name: user.name,
      email: user.email,
      password: '',
    } : {
      name: '',
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const { ref: nameFormRef, ...nameRegister } = register('name');

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('email', user.email);
      setValue('password', '');
    }
  }, [user, setValue]);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: (data: UserFormValues) => {
      if (isEditMode && user) {
        return axios.put(`/api/users/${user.id}`, data);
      }
      return axios.post('/api/users', data);
    },
    onSuccess: (data) => {
      try {
        // Debug log for E2E: visibility that onSuccess ran
        // eslint-disable-next-line no-console
        console.log('[E2E] UserModal onSuccess, invalidating queries and closing modal', data);
      } catch (e) {}
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err: unknown) => {
      // Debug log for E2E: surface server error to console
      // eslint-disable-next-line no-console
      console.error('[E2E] UserModal onError', err);
      const isAxiosError = axios.isAxiosError(err) || (err && typeof err === 'object' && 'isAxiosError' in err && (err as any).isAxiosError === true);
      if (isAxiosError && (err as any).response?.data?.error) {
        setServerError((err as any).response.data.error);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    },

  });

  const onSubmit = (data: UserFormValues) => {
    setServerError(null);
    mutation.mutate(data);
  };

  const inputClass = (hasError?: string) =>
    `w-full px-3 py-2.5 rounded-lg text-sm bg-bg-primary text-text-primary placeholder:text-text-muted border transition-[border-color,box-shadow] duration-150 outline-none focus:ring-2 focus:ring-accent/30 ${
      hasError ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border-color focus:border-accent'
    }`;

  return (
    <>
      <div 
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" 
        aria-hidden="true" 
        onClick={onClose} 
        data-testid="modal-overlay"
      />
      <div role="dialog" aria-modal="true" aria-labelledby="user-modal-title" className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-bg-card border border-border-color shadow-2xl animate-[slideUp_0.2s_cubic-bezier(0.16,1,0.3,1)]">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border-color">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <UserIcon className="size-4" />
              </div>
              <h2 id="user-modal-title" className="text-lg font-bold text-text-primary">
                {title || (isEditMode ? 'Edit User' : 'Create User')}
              </h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close dialog" className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors">
              <X className="size-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-6 pt-5 pb-6 flex flex-col gap-4">
            {serverError && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="u-name" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Name</label>
              <input
                id="u-name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                className={inputClass(errors.name?.message)}
                {...nameRegister}
                ref={(e) => {
                  nameFormRef(e);
                  nameRef.current = e;
                }}
              />
              {errors.name && <p className="text-xs text-danger flex items-center gap-1"><AlertCircle className="size-3" /> {errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="u-email" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</label>
              <input
                id="u-email"
                type="email"
                autoComplete="email"
                placeholder="jane@example.com"
                className={inputClass(errors.email?.message)}
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-danger flex items-center gap-1"><AlertCircle className="size-3" /> {errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="u-password" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                id="u-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={isEditMode ? "Leave blank to keep current" : "Min. 8 characters"}
                className={`${inputClass(errors.password?.message)} pr-10`}
                {...register('password')}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger flex items-center gap-1"><AlertCircle className="size-3" /> {errors.password.message}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary border border-border-color hover:bg-bg-hover hover:text-text-primary transition-colors">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-400 active:bg-emerald-600 transition-colors shadow-[0_0_14px_rgba(16,185,129,0.35)] disabled:opacity-60 disabled:cursor-not-allowed">
                {mutation.isPending ? <><Loader2 className="size-4 animate-spin" /> {isEditMode ? 'Saving...' : 'Creating...'}</> : <>{!isEditMode && <Plus className="size-4" />}{isEditMode ? 'Save Changes' : 'Create User'}</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export function CreateUserButton({ onClick }: { onClick: () => void }) {
  return (
    <button 
      type="button"
      onClick={onClick} 
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-400 active:bg-emerald-600 transition-colors shadow-[0_0_14px_rgba(16,185,129,0.35)]"
    >
      <Plus className="size-4" /> Create User
    </button>
  );
}

export default UserModal;
