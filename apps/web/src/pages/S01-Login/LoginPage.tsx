import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { homePathForRole, useLogin, useMe } from '@/api/auth';
import { ApiClientError } from '@/api/client';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

// UI form schema (S01 validation rules), not an API model.
const loginFormSchema = z.object({
  email: z.string().min(1, 'שדה חובה').email('אימייל לא תקין'),
  password: z.string().min(1, 'שדה חובה').min(8, 'לפחות 8 תווים'),
  rememberMe: z.boolean()
});
type LoginForm = z.infer<typeof loginFormSchema>;
const formFields: readonly string[] = ['email', 'password', 'rememberMe'];

function serverMessage(err: unknown): string {
  if (err instanceof ApiClientError) {
    switch (err.code) {
      case 'UNAUTHENTICATED':
        return 'פרטים שגויים';
      case 'RATE_LIMITED':
        return 'יותר מדי ניסיונות. נסו שוב מאוחר יותר';
      case 'NETWORK_ERROR':
        return 'שגיאת תקשורת. בדקו את החיבור ונסו שוב';
    }
  }
  return 'אירעה שגיאה. נסו שוב';
}

export function LoginPage() {
  const location = useLocation();
  const session = useMe();
  const login = useLogin();
  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '', rememberMe: false }
  });

  if (session.isPending) {
    return (
      <div className="mx-auto mt-24 w-full max-w-sm space-y-4 p-4" aria-busy="true" aria-label="טוען">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (session.data) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
    return <Navigate to={from ?? homePathForRole(session.data.user.role)} replace />;
  }

  const onSubmit = (values: LoginForm) => {
    clearErrors('root');
    login.mutate(values, {
      onError: (err) => {
        if (err instanceof ApiClientError && err.code === 'VALIDATION_ERROR') {
          let mapped = 0;
          for (const [path, message] of Object.entries(err.fields)) {
            if (formFields.includes(path)) {
              setError(path as keyof LoginForm, { message });
              mapped++;
            }
          }
          if (mapped === 0) setError('root.server', { message: err.message });
          return;
        }
        setError('root.server', { message: serverMessage(err) });
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="w-full max-w-sm space-y-5 rounded-lg border bg-background p-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold">התחברות</h1>

        {errors.root?.server && <Alert>{errors.root.server.message}</Alert>}

        <div className="space-y-2">
          <Label htmlFor="email">אימייל</Label>
          <Input
            id="email"
            type="email"
            dir="ltr"
            autoComplete="username"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">סיסמה</Label>
          <Input
            id="password"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="rememberMe"
            render={({ field }) => (
              <Checkbox
                id="rememberMe"
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v === true)}
                ref={field.ref}
              />
            )}
          />
          <Label htmlFor="rememberMe">זכור אותי</Label>
        </div>

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          התחבר
        </Button>
      </form>
    </div>
  );
}
