import { useEffect, useState } from 'react';
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
import type { User } from '@supabase/supabase-js';

const Colaborador = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAgent, isAdmin, isLoading: rolesLoading } = useRoles(user?.id);
  const activeTab = searchParams.get('tab') || 'inicio';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    }
  }, [user]);

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
          <div className="space-y-2">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight">
                {getGreeting()}, {firstName}!
              </h1>
              <p className="text-muted-foreground text-sm">
                Aqui está um resumo do seu dia de trabalho.
              </p>
            </div>
            <TodayScheduleCard />
          </div>
        );
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
        onUserChange={() => {}}
        onProfileChange={setProfile}
      />

      <ColaboradorNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <main className={cn(
        'py-6 px-4 page-enter transition-all duration-300',
        !isMobile && (sidebarCollapsed ? 'ml-[52px]' : 'ml-[200px]')
      )}>
        <div className="max-w-7xl mx-auto space-y-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Colaborador;
