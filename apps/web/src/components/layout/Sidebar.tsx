import { type Role } from '@catering/shared';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  UtensilsCrossed,
  Package,
  Building,
  ChefHat,
  Truck,
  Navigation,
  CreditCard,
  BarChart3,
  Settings,
  X
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

export const navItems: NavItem[] = [
  {
    title: 'לוח בקרה',
    href: '/',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'OFFICE']
  },
  {
    title: 'יומן אירועים',
    href: '/calendar',
    icon: Calendar,
    roles: ['ADMIN', 'OFFICE', 'KITCHEN_MANAGER', 'KITCHEN_STAFF']
  },
  {
    title: 'הזמנות',
    href: '/orders',
    icon: ClipboardList,
    roles: ['ADMIN', 'OFFICE']
  },
  {
    title: 'לקוחות',
    href: '/customers',
    icon: Users,
    roles: ['ADMIN', 'OFFICE']
  },
  {
    title: 'תפריטים ומנות',
    href: '/menus',
    icon: UtensilsCrossed,
    roles: ['ADMIN', 'KITCHEN_MANAGER']
  },
  {
    title: 'מלאי',
    href: '/inventory',
    icon: Package,
    roles: ['ADMIN', 'KITCHEN_MANAGER']
  },
  {
    title: 'ספקים ורכש',
    href: '/suppliers',
    icon: Building,
    roles: ['ADMIN', 'KITCHEN_MANAGER']
  },
  {
    title: 'לוח מטבח',
    href: '/kitchen',
    icon: ChefHat,
    roles: ['KITCHEN_MANAGER', 'KITCHEN_STAFF', 'ADMIN']
  },
  {
    title: 'משלוחים',
    href: '/deliveries',
    icon: Truck,
    roles: ['ADMIN', 'OFFICE']
  },
  {
    title: 'מסך נהג',
    href: '/driver',
    icon: Navigation,
    roles: ['DRIVER', 'ADMIN']
  },
  {
    title: 'תשלומים',
    href: '/payments',
    icon: CreditCard,
    roles: ['ADMIN', 'OFFICE']
  },
  {
    title: 'דוחות',
    href: '/reports',
    icon: BarChart3,
    roles: ['ADMIN']
  },
  {
    title: 'הגדרות',
    href: '/settings',
    icon: Settings,
    roles: ['ADMIN']
  }
];

interface SidebarProps {
  userRole: Role;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ userRole, isOpen, onClose }: SidebarProps) {
  const allowedItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-50 flex w-64 flex-col border-e bg-background transition-transform duration-200 ease-in-out md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        aria-label="תפריט ראשי"
      >
        <div className="flex h-14 items-center justify-between border-b px-6">
          <span className="text-lg font-bold tracking-tight text-primary">ניהול קייטרינג</span>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={onClose}
            aria-label="סגור תפריט"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="ניווט">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

