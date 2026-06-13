import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  X, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  User as UserIcon 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Re-defining the schema here or importing from core if available. 
// Based on previous grep, it exists in 'core'.
import { createUserSchema, type CreateUserFormValues } from 'core';

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '' },
    mode: 'onChange',
  });

  const { ref: nameFormRef, ...nameRegister } = register('name');

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: (data: CreateUserFormValues) => axios.post('/api/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setServerError(err.response.data.error);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    },
  });

  const onSubmit = (data: CreateUserFormValues) => {
    setServerError(null);
    mutation.mutate(data);
  };

  const inputClass = (hasError?: string) =>
    `w-full px-3 py-2.5 rounded-lg text-sm bg-bg-primary text-text-primary placeholder:text-text-muted border transition-[border-color,box-shadow] duration-150 outline-none focus:ring-2 focus:ring-accent/30 ${
      hasError ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border-color focus:border-accent'
    }`;

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease]" aria-hidden="true" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="create-user-title" className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-bg-card border border-border-color shadow-2xl animate-[slideUp_0.2s_cubic-bezier(0.16,1,0.3,1)]">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border-color">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <UserIcon className="size-4" />
              </div>
              <h2 id="create-user-title" className="text-lg font-bold text-text-primary">Create User</h2>
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
              <label htmlFor="cu-name" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Name</label>
              <input
                id="cu-name"
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
              <label htmlFor="cu-email" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</label>
              <input
                id="cu-email"
                type="email"
                autoComplete="email"
                placeholder="jane@example.com"
                className={inputClass(errors.email?.message)}
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-danger flex items-center gap-1"><AlertCircle className="size-3" /> {errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cu-password" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  id="cu-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
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
                {mutation.isPending ? <><Loader2 className="size-4 animate-spin" /> Creating…</> : <><Plus className="size-4" /> Create User</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export function CreateUserButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-400 active:bg-emerald-600 transition-colors shadow-[0_0_14px_rgba(16,185,129,0.35)]">
        <Plus className="size-4" /> Create User
      </button>
      {open && <CreateUserModal onClose={() => setOpen(false)} />}
    </>
  );
}
