import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RewardPurchase {
  id: string;
  points_spent: number;
  status: string;
  purchased_at: string;
  profiles: {
    name: string;
  };
  reward_items: {
    name: string;
  };
}

interface RewardPurchasesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RewardPurchasesDialog = ({ open, onOpenChange }: RewardPurchasesDialogProps) => {
  const [purchases, setPurchases] = useState<RewardPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('reward_purchases')
        .select('*, profiles(name), reward_items(name)')
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as compras',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPurchases();
    }
  }, [open]);

  const handleApprove = async (purchaseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('reward_purchases')
        .update({
          status: 'approved',
          delivered_by: user.id,
        })
        .eq('id', purchaseId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Compra aprovada',
      });
      fetchPurchases();
    } catch (error) {
      console.error('Error approving purchase:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar a compra',
        variant: 'destructive',
      });
    }
  };

  const handleDeliver = async (purchaseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('reward_purchases')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          delivered_by: user.id,
        })
        .eq('id', purchaseId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Recompensa marcada como entregue',
      });
      fetchPurchases();
    } catch (error) {
      console.error('Error delivering purchase:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar como entregue',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (purchaseId: string) => {
    try {
      const { error } = await supabase
        .from('reward_purchases')
        .update({ status: 'cancelled' })
        .eq('id', purchaseId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Compra cancelada',
      });
      fetchPurchases();
    } catch (error) {
      console.error('Error cancelling purchase:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a compra',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Compras de Recompensas</DialogTitle>
          <DialogDescription>
            Gerencie as compras dos agentes
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div>Carregando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>Recompensa</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>{purchase.profiles.name}</TableCell>
                  <TableCell>{purchase.reward_items.name}</TableCell>
                  <TableCell>{purchase.points_spent} pts</TableCell>
                  <TableCell>
                    {format(new Date(purchase.purchased_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        purchase.status === 'delivered'
                          ? 'default'
                          : purchase.status === 'cancelled'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {purchase.status === 'pending'
                        ? 'Pendente'
                        : purchase.status === 'approved'
                        ? 'Aprovada'
                        : purchase.status === 'delivered'
                        ? 'Entregue'
                        : 'Cancelada'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {purchase.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(purchase.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(purchase.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                    {purchase.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeliver(purchase.id)}
                      >
                        <Package className="h-4 w-4 mr-1" />
                        Marcar Entregue
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
