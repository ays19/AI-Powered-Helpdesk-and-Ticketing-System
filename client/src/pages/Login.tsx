import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LogIn, Mail, Lock, AlertCircle, Ticket } from 'lucide-react';
import { loginSchema, type LoginFormValues } from 'core';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';



export default function Login() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

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
      setError(signInError.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06070a] px-4 py-12">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 animate-[pulse_6s_ease-in-out_infinite] rounded-full bg-[#00f0ff]/10 blur-[128px]" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 animate-[pulse_8s_ease-in-out_infinite_1s] rounded-full bg-[#bd00ff]/10 blur-[128px]" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-[pulse_7s_ease-in-out_infinite_0.5s] rounded-full bg-[#00f0ff]/8 blur-[100px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,240,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 w-full max-w-md animate-[fadeIn_0.5s_ease]">
        {/* Logo & Branding */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-[#bd00ff] shadow-[0_0_40px_rgba(0,240,255,0.25)]">
            <Ticket className="size-7 text-bg-primary" />
          </div>
          <div className="text-center">
            <h1 className="bg-gradient-to-r from-accent to-[#00ff88] bg-clip-text text-2xl font-bold font-heading tracking-widest text-transparent uppercase">
              Helpdesk.sys
            </h1>
            <p className="mt-1.5 font-mono text-[0.7rem] uppercase tracking-wider text-text-secondary">
              AI_TICKET_MANAGEMENT_INTERFACE
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border-color/60 bg-bg-card/90 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent to-[#bd00ff] opacity-65" />
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-lg font-bold font-heading uppercase tracking-wider text-text-primary">Welcome back</CardTitle>
            <CardDescription className="font-mono text-xs tracking-wide text-text-secondary">
              Sign in to terminate tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-5 bg-danger/10 border border-danger/30 text-danger font-mono text-xs">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
              {/* Email Field */}
              <div className="grid gap-2">
                <Label htmlFor="login-email" className="font-mono text-[0.68rem] uppercase tracking-wider text-text-secondary">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="user@helpdesk.sys"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    className="h-10 pl-9 font-mono text-sm bg-bg-secondary border-border-color/60 text-text-primary placeholder:text-text-muted focus-visible:border-accent/60"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-mono text-danger">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="grid gap-2">
                <Label htmlFor="login-password" className="font-mono text-[0.68rem] uppercase tracking-wider text-text-secondary">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    className="h-10 pl-9 font-mono text-sm bg-bg-secondary border-border-color/60 text-text-primary placeholder:text-text-muted focus-visible:border-accent/60"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs font-mono text-danger">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="mt-1 w-full bg-accent hover:bg-accent-hover text-bg-primary font-mono text-xs uppercase tracking-wider font-bold shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:shadow-[0_0_25px_rgba(0,240,255,0.45)] cursor-pointer transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin-slow" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center font-mono text-[0.65rem] tracking-wider uppercase text-text-muted">
          Secure login powered by Better Auth
        </p>
      </div>
    </div>
  );
}
