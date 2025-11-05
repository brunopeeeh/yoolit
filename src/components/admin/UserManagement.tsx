import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';
import { RoleDialog } from './RoleDialog';
import { NewAgentDialog } from './NewAgentDialog';

type Profile = {
  id: string;
  name: string;
  email: string;
  roles: string[];
};

export const UserManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewAgentDialogOpen, setIsNewAgentDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      setIsLoading(true);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email');

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const rolesMap = new Map<string, string[]>();
      rolesData?.forEach(r => {
        if (!rolesMap.has(r.user_id)) {
          rolesMap.set(r.user_id, []);
        }
        rolesMap.get(r.user_id)?.push(r.role);
      });

      const profilesWithRoles = profilesData?.map(p => ({
        ...p,
        roles: rolesMap.get(p.id) || []
      })) || [];

      setProfiles(profilesWithRoles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleEditRoles = (profile: Profile) => {
    setSelectedUser(profile);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    fetchProfiles();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'moderator': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Gerencie permissões e roles dos usuários do sistema
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsNewAgentDialogOpen(true)}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Agente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.name || 'Sem nome'}</TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {profile.roles.length > 0 ? (
                        profile.roles.map((role) => (
                          <Badge key={role} variant={getRoleBadgeVariant(role)}>
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem permissões</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRoles(profile)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedUser && (
        <RoleDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          user={selectedUser}
          onClose={handleDialogClose}
        />
      )}

      <NewAgentDialog
        open={isNewAgentDialogOpen}
        onOpenChange={setIsNewAgentDialogOpen}
        onSuccess={fetchProfiles}
      />
    </>
  );
};
