import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRoles } from '@/hooks/useRoles';
import Header from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ShiftSwapRequests } from '@/components/admin/ShiftSwapRequests';
import { RewardsStore } from '@/components/gamification/RewardsStore';
import { AgentScheduleView } from '@/components/colaborador/AgentScheduleView';
import { ColaboradorNav } from '@/components/colaborador/ColaboradorNav';
import { AgentTasks } from '@/components/gamification/AgentTasks';
import { GlobalScheduleView } from '@/components/colaborador/GlobalScheduleView';
import { TodayScheduleCard } from '@/components/colaborador/TodayScheduleCard';
import { SystemUpdates } from '@/components/colaborador/SystemUpdates';
import { HubInterno } from '@/components/colaborador/HubInterno';
import type { User } from '@supabase/supabase-js';

const LS_KEY = 'oraculo_updates_read';

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

const Colaborador = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAgent, isAdmin, isLoading: rolesLoading } = useRoles(user?.id);
  const activeTab = searchParams.get('tab') || 'inicio';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadUpdatesCount, setUnreadUpdatesCount] = useState(0);
  const isMobile = useIsMobile();

  const handleTabChange = (newTab: string) => {
    setSearchParams({ tab: newTab });
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };
    getSession();
  }, []);

  const computeUnreadCount = useCallback(async () => {
    const { data } = await supabase.from('system_updates').select('id');
    if (!data) return;
    const readSet = getReadIds();
    setUnreadUpdatesCount(data.filter(u => !readSet.has(u.id)).length);
  }, []);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      };
      fetchProfile();

      computeUnreadCount();

      const channel = supabase
        .channel('updates-badge-count')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_updates' }, computeUnreadCount)
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user, computeUnreadCount]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  // Track sidebar collapse state
  useEffect(() => {
    if (isMobile) return;
    const checkSidebar = () => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        setSidebarCollapsed(sidebar.classList.contains('w-[52px]'));
      }
    };
    const observer = new MutationObserver(checkSidebar);
    const tick = setTimeout(() => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
        checkSidebar();
      }
    }, 100);
    return () => {
      clearTimeout(tick);
      observer.disconnect();
    };
  });

  if (isLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  const firstName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Colaborador';

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return (
          <div className="space-y-8">

            {/* 1. Card de Expediente — destaque total */}
            <TodayScheduleCard />

            {/* 2. Saudação personalizada */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {getGreeting()}, {firstName}! 👋
              </h1>
              <p className="text-muted-foreground text-sm">
                Aqui está um resumo do seu dia de trabalho.
              </p>
            </div>

            {/* 3. Resumo Diário — espaço reservado para métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Placeholder: futuros cards de métricas virão aqui */}
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 flex flex-col items-center justify-center gap-2 text-center min-h-[120px]">
                <span className="text-2xl">📊</span>
                <p className="text-sm font-medium text-muted-foreground">Atendimentos do Dia</p>
                <p className="text-xs text-muted-foreground/60">Em breve</p>
              </div>
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 flex flex-col items-center justify-center gap-2 text-center min-h-[120px]">
                <span className="text-2xl">✅</span>
                <p className="text-sm font-medium text-muted-foreground">Chamados Finalizados</p>
                <p className="text-xs text-muted-foreground/60">Em breve</p>
              </div>
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 flex flex-col items-center justify-center gap-2 text-center min-h-[120px] sm:col-span-2 lg:col-span-1">
                <span className="text-2xl">⏱️</span>
                <p className="text-sm font-medium text-muted-foreground">Tempo Médio de Resposta</p>
                <p className="text-xs text-muted-foreground/60">Em breve</p>
              </div>
            </div>

          </div>
        );
      case 'hub':
        return <HubInterno />;
      case 'updates':
        return <SystemUpdates onReadAll={() => setUnreadUpdatesCount(0)} />;
      case 'schedule':
        return <AgentScheduleView />;
      case 'global-schedule':
        return <GlobalScheduleView />;
      case 'swap-requests':
        return <ShiftSwapRequests isAgentView={true} />;
      case 'tasks':
        return <AgentTasks />;
      case 'rewards':
        return <RewardsStore />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
        profile={profile}
        onUserChange={() => { }}
        onProfileChange={setProfile}
      />

      <ColaboradorNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        badges={{ updates: unreadUpdatesCount }}
      />

      <main className={cn(
        'py-6 page-enter transition-all duration-300',
        activeTab === 'global-schedule' ? 'px-2 sm:px-3' : 'px-4',
        !isMobile && (sidebarCollapsed ? 'ml-[52px]' : 'ml-[200px]')
      )}>
        <div
          className={cn(
            activeTab === 'global-schedule' ? 'w-full' : 'max-w-7xl mx-auto space-y-6'
          )}
        >
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Colaborador;
