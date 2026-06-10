import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '../lib/auth-client';
import '../index.css';

const loginSchema = z.object({
  email: z.email({ error: 'Invalid email format' }).min(1, { error: 'Email is required' }),
  password: z.string().min(1, { error: 'Password is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError('');

    const { error: signInError } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      setError(signInError.message || 'Login failed');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-bg-primary">
      <div className="bg-bg-card p-10 rounded-lg border border-border-color w-full max-w-[400px] shadow-lg">
        <div className="flex items-center gap-3 justify-center mb-6">
          <span className="text-[1.8rem] drop-shadow-[0_0_8px_var(--color-accent-glow)]">🎫</span>
          <h1 className="text-[1.5rem] font-extrabold bg-gradient-to-br from-accent to-[#a78bfa] bg-clip-text text-transparent tracking-[-0.02em]">Helpdesk</h1>
        </div>
        <h2 className="text-center mb-6 text-[1.5rem] font-bold">Sign In</h2>
        {error && <div className="bg-[rgba(255,77,106,0.15)] text-danger p-3 rounded-md mb-5 text-[0.85rem] border border-[rgba(255,77,106,0.3)] text-center">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-5">
            <label htmlFor="email" className="block text-[0.85rem] font-semibold text-text-secondary mb-[6px]">Email</label>
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder="abc@example.com"
              className={`w-full py-[10px] px-[14px] border rounded-md bg-bg-secondary text-text-primary font-sans text-[0.9rem] transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] focus:outline-none placeholder:text-text-muted ${
                errors.email 
                  ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]' 
                  : 'border-border-color focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)]'
              }`}
            />
            {errors.email && <span className="text-danger text-[0.75rem] mt-1 block">{errors.email.message}</span>}
          </div>
          <div className="mb-5">
            <label htmlFor="password" className="block text-[0.85rem] font-semibold text-text-secondary mb-[6px]">Password</label>
            <input
              id="password"
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className={`w-full py-[10px] px-[14px] border rounded-md bg-bg-secondary text-text-primary font-sans text-[0.9rem] transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] focus:outline-none placeholder:text-text-muted ${
                errors.password 
                  ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]' 
                  : 'border-border-color focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)]'
              }`}
            />
            {errors.password && <span className="text-danger text-[0.75rem] mt-1 block">{errors.password.message}</span>}
          </div>
          <button
            type="submit"
            className="bg-gradient-to-br from-accent to-[#8b5cf6] text-white shadow-glow hover:-translate-y-[1px] hover:shadow-[0_0_40px_var(--color-accent-glow)] inline-flex items-center gap-[6px] border-none rounded-md font-sans font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap w-full justify-center mt-[10px] p-3 text-[1rem]"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
