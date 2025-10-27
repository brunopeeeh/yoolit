import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type StatusChange = {
  id: string;
  old_status: string | null;
  new_status: string;
  reason: string | null;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
  changed_by_user: {
    name: string;
    email: string;
  };
};

export const StatusHistory = () => {
  const [changes, setChanges] = useState<StatusChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatusChanges();
  }, []);

  const fetchStatusChanges = async () => {
    try {
      const { data, error } = await supabase
        .from('status_changes')
        .select(`
          id,
          old_status,
          new_status,
          reason,
          created_at,
          user:profiles!status_changes_user_id_fkey(name, email),
          changed_by_user:profiles!status_changes_changed_by_fkey(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setChanges(data as any || []);
    } catch (error) {
      console.error('Error fetching status changes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'busy': return 'destructive';
      case 'away': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Alterações de Status</CardTitle>
        <CardDescription>
          Registro das últimas 50 alterações de status dos usuários
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Status Anterior</TableHead>
              <TableHead>Novo Status</TableHead>
              <TableHead>Alterado por</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {changes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhuma alteração registrada
                </TableCell>
              </TableRow>
            ) : (
              changes.map((change) => (
                <TableRow key={change.id}>
                  <TableCell className="font-medium">
                    {change.user?.name || change.user?.email}
                  </TableCell>
                  <TableCell>
                    {change.old_status ? (
                      <Badge variant={getStatusBadgeVariant(change.old_status)}>
                        {change.old_status}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(change.new_status)}>
                      {change.new_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {change.changed_by_user?.name || change.changed_by_user?.email}
                  </TableCell>
                  <TableCell>
                    {format(new Date(change.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
