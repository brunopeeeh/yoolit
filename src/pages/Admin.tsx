import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRoles } from '@/hooks/useRoles';
import Header from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { UserManagement } from '@/components/admin/UserManagement';
import { ShiftManagement } from '@/components/admin/ShiftManagement';
import { StatusHistory } from '@/components/admin/StatusHistory';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { AgentScheduleChart } from '@/components/admin/AgentScheduleChart';
import { ShiftSwapRequests } from '@/components/admin/ShiftSwapRequests';
import { ShiftGenerator } from '@/components/admin/ShiftGenerator';
import { BarChart3, Shield, Calendar, History, RefreshCw, Users } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, isLoading: rolesLoading } = useRoles(user?.id);
  const activeTab = searchParams.get('tab') || 'dashboard';
  const [dashboardData, setDashboardData] = useState({
    availableAgents: 6,
    totalAgents: 13,
    pendingSwaps: 8,
    approvedSwaps: 24,
    coverage: 95,
  });


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
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Carregando...</p>
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
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 max-w-[1000px]">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard Supervisor
            </TabsTrigger>
            <TabsTrigger value="swap-requests" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Solicitações de Troca
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Agentes
            </TabsTrigger>
            <TabsTrigger value="shifts" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Escalas
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6 space-y-6">
            <DashboardStats
              availableAgents={dashboardData.availableAgents}
              totalAgents={dashboardData.totalAgents}
              pendingSwaps={dashboardData.pendingSwaps}
              approvedSwaps={dashboardData.approvedSwaps}
              coverage={dashboardData.coverage}
            />
            <AgentScheduleChart />
          </TabsContent>

          <TabsContent value="swap-requests" className="mt-6">
            <ShiftSwapRequests />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="shifts" className="mt-6 space-y-6">
            <ShiftGenerator />
            <ShiftManagement />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <StatusHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
