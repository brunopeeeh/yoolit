import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';
import { useRoles } from '@/hooks/useRoles';
import Header from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { UserManagement } from '@/components/admin/UserManagement';
import { ShiftManagement } from '@/components/admin/ShiftManagement';
import { StatusHistory } from '@/components/admin/StatusHistory';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { AgentScheduleChart } from '@/components/admin/AgentScheduleChart';
import { BarChart3, Shield, Calendar, History } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

const Admin = () => {
  const { user: localUser, isLoading: userLoading } = useUser();
  const { isAdmin, isLoading: rolesLoading } = useRoles(localUser?.id);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState({
    availableAgents: 6,
    totalAgents: 13,
    pendingSwaps: 8,
    approvedSwaps: 24,
    coverage: 95,
  });

  const mockAgentShifts = [
    { name: 'Andrea Guarani', startTime: '06:00', endTime: '14:00', status: 'available' as const },
    { name: 'Bruno Oliveira', startTime: '06:00', endTime: '14:00', status: 'busy' as const },
    { name: 'Caio Fernandes', startTime: '06:00', endTime: '14:00', status: 'busy' as const },
    { name: 'Filipe de Oliveira Gramlich', startTime: '06:00', endTime: '14:00', status: 'available' as const },
    { name: 'Herick Rodrigues', startTime: '06:00', endTime: '14:00', status: 'busy' as const },
    { name: 'Julio Cesar Oliveira Monteiro', startTime: '06:00', endTime: '14:00', status: 'break' as const },
    { name: 'Lucas Rocha', startTime: '06:00', endTime: '14:00', status: 'break' as const },
    { name: 'Lucas Duarte', startTime: '06:00', endTime: '14:00', status: 'available' as const },
    { name: 'Marlon Alves da Silva', startTime: '06:00', endTime: '14:00', status: 'offline' as const },
    { name: 'Romério Barbosa de Oliveira Júnior', startTime: '06:00', endTime: '14:00', status: 'available' as const },
    { name: 'Soha L', startTime: '06:00', endTime: '14:00', status: 'available' as const },
    { name: 'Wagner Bustamante', startTime: '06:00', endTime: '14:00', status: 'available' as const },
    { name: 'Wardney Martins Bolonha', startTime: '06:00', endTime: '14:00', status: 'busy' as const },
  ];

  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setSupabaseUser(user);
    };
    getSession();
  }, []);

  useEffect(() => {
    if (localUser) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', localUser.id)
          .single();
        setProfile(data);
      };
      fetchProfile();
    }
  }, [localUser]);

  useEffect(() => {
    console.log('Admin access check:', { 
      localUser: localUser?.id, 
      isAdmin, 
      userLoading, 
      rolesLoading 
    });
    
    // Só redireciona se tiver certeza que o loading terminou E o usuário não tem acesso
    if (!userLoading && !rolesLoading && localUser && !isAdmin) {
      console.log('Redirecting to home - no access');
      navigate('/');
    }
  }, [localUser, isAdmin, userLoading, rolesLoading, navigate]);

  if (userLoading || rolesLoading || !localUser) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !supabaseUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={supabaseUser} 
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

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-[800px]">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard Supervisor
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
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
            <AgentScheduleChart shifts={mockAgentShifts} />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="shifts" className="mt-6">
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
