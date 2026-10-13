import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMe } from '@/api/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export function ProtectedLayout() {
  const location = useLocation();
  const { data, isPending } = useMe();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar
        userRole={user.role}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <Header
          user={user}
          onToggleMenu={() => setMobileMenuOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
