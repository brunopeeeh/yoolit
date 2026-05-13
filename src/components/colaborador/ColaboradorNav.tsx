import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Calendar,
  RefreshCw,
  Gift,
  Trophy,
  Menu,
  ChevronLeft,
  ChevronRight,
  Table as TableIcon,
} from 'lucide-react';

interface NavItem {
  value: string;
  label: string;
  icon: React.ElementType;
}

const allNavItems: NavItem[] = [
  { value: 'schedule', label: 'Minha Escala', icon: Calendar },
  { value: 'global-schedule', label: 'Escala Global', icon: TableIcon },
  { value: 'swap-requests', label: 'Trocas de Escalas', icon: RefreshCw },
  { value: 'tasks', label: 'Tarefas', icon: Trophy },
  { value: 'rewards', label: 'Recompensas', icon: Gift },
];

interface ColaboradorNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ColaboradorNav({ activeTab, onTabChange }: ColaboradorNavProps) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeItem = allNavItems.find((i) => i.value === activeTab) || allNavItems[0];
  const ActiveIcon = activeItem.icon;

  // Mobile: bottom sheet drawer
  if (isMobile) {
    return (
      <>
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-4 flex items-center justify-between h-12">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight">Área do Colaborador</h1>
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

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl px-2 pb-8 pt-3 max-h-[70vh]">
            <SheetHeader className="px-3 pb-3">
              <SheetTitle className="text-sm font-semibold text-left">Navegação</SheetTitle>
            </SheetHeader>
            <nav className="grid grid-cols-1 gap-1.5">
              {allNavItems.map((item) => {
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

  // Desktop: left sidebar
  return (
    <aside
      className={cn(
        'fixed left-0 top-[68px] bottom-0 z-20 flex flex-col border-r border-border/50 bg-background/95 backdrop-blur-sm transition-all duration-300',
        collapsed ? 'w-[52px]' : 'w-[200px]'
      )}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-border/30">
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-tight text-foreground">Colaborador</span>
            <span className="text-[10px] text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors',
            collapsed && 'mx-auto'
          )}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 px-2 py-2 overflow-y-auto">
        {allNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.value === activeTab;
          return (
            <button
              key={item.value}
              onClick={() => onTabChange(item.value)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all',
                collapsed ? 'justify-center px-0' : '',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
