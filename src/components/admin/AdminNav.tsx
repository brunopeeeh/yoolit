import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Calendar,
  RefreshCw,
  Users,
  Trophy,
  ShoppingBag,
  Gift,
  Menu,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  value: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const allNavItems: NavItem[] = [
  { value: 'dashboard', label: 'Dashboard', icon: BarChart3, adminOnly: true },
  { value: 'tasks', label: 'Tarefas', icon: Trophy },
  { value: 'store', label: 'Loja', icon: ShoppingBag },
  { value: 'swap-requests', label: 'Trocas', icon: RefreshCw },
  { value: 'users', label: 'Agentes', icon: Users, adminOnly: true },
  { value: 'shifts', label: 'Escalas', icon: Calendar, adminOnly: true },
  { value: 'manage-tasks', label: 'Ger. Tarefas', icon: Trophy, adminOnly: true },
  { value: 'manage-rewards', label: 'Recompensas', icon: Gift, adminOnly: true },
];

interface AdminNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
  isAgent: boolean;
}

export function AdminNav({ activeTab, onTabChange, isAdmin, isAgent }: AdminNavProps) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const visibleItems = allNavItems.filter((item) => {
    if (item.adminOnly && isAgent && !isAdmin) return false;
    return true;
  });

  const activeItem = visibleItems.find((i) => i.value === activeTab) || visibleItems[0];
  const ActiveIcon = activeItem.icon;

  if (isMobile) {
    return (
      <>
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-tight">Painel</h1>
                <span className="text-muted-foreground/30 select-none">·</span>
                <p className="text-[11px] text-muted-foreground">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 rounded-lg text-xs font-medium border-border/60"
                onClick={() => setSheetOpen(true)}
              >
                <ActiveIcon className="h-3.5 w-3.5 text-primary" />
                {activeItem.label}
                <Menu className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl px-2 pb-8 pt-3 max-h-[70vh]">
            <SheetHeader className="px-3 pb-3">
              <SheetTitle className="text-sm font-semibold text-left">Navegação</SheetTitle>
            </SheetHeader>
            <nav className="grid grid-cols-2 gap-1.5">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.value === activeTab;
                return (
                  <button
                    key={item.value}
                    onClick={() => {
                      onTabChange(item.value);
                      setSheetOpen(false);
                    }}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-primary')} />
                    <span className="truncate">{item.label}</span>
                    {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary/60" />}
                  </button>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop
  return (
    <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 h-14">
          <div className="flex items-center gap-2.5 mr-2">
            <h1 className="text-base font-semibold tracking-tight">Painel</h1>
            <span className="text-muted-foreground/30 select-none">·</span>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
          </div>

          <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.value === activeTab;
              return (
                <button
                  key={item.value}
                  onClick={() => onTabChange(item.value)}
                  className={cn(
                    'relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-[9px] left-3 right-3 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
