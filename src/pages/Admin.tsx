import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRoles } from '@/hooks/useRoles';
import Header from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { UserManagement } from '@/components/admin/UserManagement';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { AgentScheduleChart } from '@/components/admin/AgentScheduleChart';
import { ShiftSwapRequests } from '@/components/admin/ShiftSwapRequests';
import { AgentWeeklySchedule } from '@/components/admin/AgentWeeklySchedule';
import { SwapCalendar } from '@/components/admin/SwapCalendar';
import { TasksManagement } from '@/components/gamification/TasksManagement';
import { AgentTasks } from '@/components/gamification/AgentTasks';
import { RewardsStore } from '@/components/gamification/RewardsStore';
import { RewardsManagement } from '@/components/gamification/RewardsManagement';
import type { User } from '@supabase/supabase-js';
import { AdminNav } from '@/components/admin/AdminNav';

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, hasRole, isLoading: rolesLoading } = useRoles(user?.id);
  const isAgent = hasRole('agent');
  const activeTab = searchParams.get('tab') || (isAgent && !isAdmin ? 'tasks' : 'dashboard');
  const [dashboardData, setDashboardData] = useState({
    availableAgents: 6,
    totalAgents: 13,
    pendingSwaps: 8,
    approvedSwaps: 24,
    coverage: 95,
  });

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
    console.log('Admin access check:', { 
      userId: user?.id, 
      isAdmin, 
      isLoading, 
      rolesLoading 
    });
    
    // Apenas redireciona se não houver usuário após loading
    if (!isLoading && !user) {
      console.log('Redirecting to home - no user');
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  // Mostra loading enquanto carrega
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#83cef6] border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não tem usuário, não renderiza (redirect acontece no useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={user} 
        profile={profile}
        onUserChange={() => {}}
        onProfileChange={setProfile}
      />

      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-semibold tracking-tight">Painel</h1>
              <span className="hidden sm:block text-muted-foreground/30 select-none">·</span>
              <p className="hidden sm:block text-xs text-muted-foreground">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto py-6 px-4 page-enter">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="overflow-x-auto pb-1 -mx-1 px-1">
            <TabsList className="inline-flex h-9 items-center gap-0.5 rounded-xl bg-muted/60 p-1 border border-border/40 w-max min-w-full sm:w-auto">
              {!isAgent || isAdmin ? (
                <TabsTrigger value="dashboard" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground whitespace-nowrap">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Dashboard
                </TabsTrigger>
              ) : null}
              <TabsTrigger value="tasks" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground whitespace-nowrap">
                <Trophy className="h-3.5 w-3.5" />
                Tarefas
              </TabsTrigger>
              <TabsTrigger value="store" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground whitespace-nowrap">
                <ShoppingBag className="h-3.5 w-3.5" />
                Loja
              </TabsTrigger>
              <TabsTrigger value="swap-requests" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground whitespace-nowrap">
                <RefreshCw className="h-3.5 w-3.5" />
                Trocas
              </TabsTrigger>
              {!isAgent || isAdmin ? (
                <>
                  <TabsTrigger value="users" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground whitespace-nowrap">
                    <Users className="h-3.5 w-3.5" />
                    Agentes
                  </TabsTrigger>
                  <TabsTrigger value="shifts" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground whitespace-nowrap">
                    <Calendar className="h-3.5 w-3.5" />
                    Escalas
                  </TabsTrigger>
                  <TabsTrigger value="manage-tasks" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground whitespace-nowrap">
                    <Trophy className="h-3.5 w-3.5" />
                    Ger. Tarefas
                  </TabsTrigger>
                  <TabsTrigger value="manage-rewards" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground whitespace-nowrap">
                    <Gift className="h-3.5 w-3.5" />
                    Recompensas
                  </TabsTrigger>
                </>
              ) : null}
            </TabsList>
          </div>

          {!isAgent || isAdmin ? (
            <TabsContent value="dashboard" className="mt-6 space-y-6">
              <DashboardStats
                availableAgents={dashboardData.availableAgents}
                totalAgents={dashboardData.totalAgents}
                pendingSwaps={dashboardData.pendingSwaps}
                approvedSwaps={dashboardData.approvedSwaps}
                coverage={dashboardData.coverage}
              />
              <AgentScheduleChart />
              <SwapCalendar />
            </TabsContent>
          ) : null}

          <TabsContent value="tasks" className="mt-6">
            {isAgent && !isAdmin ? <AgentTasks /> : <TasksManagement />}
          </TabsContent>

          <TabsContent value="store" className="mt-6">
            <RewardsStore />
          </TabsContent>

          <TabsContent value="swap-requests" className="mt-6">
            <ShiftSwapRequests isAgentView={isAgent && !isAdmin} />
          </TabsContent>

          {!isAgent || isAdmin ? (
            <>
              <TabsContent value="users" className="mt-6">
                <UserManagement />
              </TabsContent>

              <TabsContent value="shifts" className="mt-6">
                <AgentWeeklySchedule />
              </TabsContent>

              <TabsContent value="manage-tasks" className="mt-6">
                <TasksManagement />
              </TabsContent>

              <TabsContent value="manage-rewards" className="mt-6">
                <RewardsManagement />
              </TabsContent>
            </>
          ) : null}
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
