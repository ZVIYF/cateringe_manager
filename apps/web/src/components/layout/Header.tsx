import { labels, type AuthSchemas } from '@catering/shared';
import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  user: AuthSchemas.AuthUser;
  onToggleMenu: () => void;
}

export function Header({ user, onToggleMenu }: HeaderProps) {
  const navigate = useNavigate();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={onToggleMenu}
          aria-label="פתח תפריט"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold text-muted-foreground md:hidden">ניהול קייטרינג</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">{user.name}</span>
          <Badge variant="secondary" className="font-normal">
            {labels.Role[user.role]}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={logout.isPending}
          onClick={() =>
            logout.mutate(undefined, {
              onSettled: () => navigate('/login', { replace: true }),
            })
          }
          className="gap-1.5 text-xs"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span>יציאה</span>
        </Button>
      </div>
    </header>
  );
}

