import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRoles } from '@/hooks/useRoles';
import Header from '@/components/layout/Header';
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (isAgent && !isAdmin) return null;
        return (
          <div className="space-y-6">
            <DashboardStats
              availableAgents={dashboardData.availableAgents}
              totalAgents={dashboardData.totalAgents}
              pendingSwaps={dashboardData.pendingSwaps}
              approvedSwaps={dashboardData.approvedSwaps}
              coverage={dashboardData.coverage}
            />
            <AgentScheduleChart />
            <SwapCalendar />
          </div>
        );
      case 'tasks':
        return isAgent && !isAdmin ? <AgentTasks /> : <TasksManagement />;
      case 'store':
        return <RewardsStore />;
      case 'swap-requests':
        return <ShiftSwapRequests isAgentView={isAgent && !isAdmin} />;
      case 'users':
        return (!isAgent || isAdmin) ? <UserManagement /> : null;
      case 'shifts':
        return (!isAgent || isAdmin) ? <AgentWeeklySchedule /> : null;
      case 'manage-tasks':
        return (!isAgent || isAdmin) ? <TasksManagement /> : null;
      case 'manage-rewards':
        return (!isAgent || isAdmin) ? <RewardsManagement /> : null;
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

      <AdminNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isAdmin={isAdmin}
        isAgent={isAgent}
      />

      <main className="container mx-auto py-6 px-4 page-enter">
        {renderContent()}
      </main>
    </div>
  );
};

export default Admin;
