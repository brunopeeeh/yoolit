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
import { Shield, Calendar, History } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

const Admin = () => {
  const { user: localUser, isLoading: userLoading } = useUser();
  const { isAdmin, isLoading: rolesLoading } = useRoles(localUser?.id);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, permissões, escalas e histórico de alterações
          </p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Usuários
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
