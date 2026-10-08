import { labels } from '@catering/shared';
import { LogOut } from 'lucide-react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLogout, useMe } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function ProtectedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, isPending } = useMe();
  const logout = useLogout();

  if (isPending) {
    return (
      <div className="space-y-4 p-6" aria-busy="true" aria-label="טוען">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!data) return <Navigate to="/login" replace state={{ from: location }} />;

  const { user } = data;
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <span className="text-lg font-bold">ניהול קייטרינג</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user.name} · {labels.Role[user.role]}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={logout.isPending}
            onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            יציאה
          </Button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
