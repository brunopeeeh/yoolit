import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Package, CheckCircle, XCircle, ImageIcon, Pencil } from 'lucide-react';
import { CreateRewardDialog } from './CreateRewardDialog';
import { EditRewardDialog } from './EditRewardDialog';
import { RewardPurchasesDialog } from './RewardPurchasesDialog';
import { useToast } from '@/hooks/use-toast';

interface RewardItem {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  category: string;
  stock: number | null;
  image_url: string | null;
  is_active: boolean;
  max_purchases_per_user: number | null;
  max_uses_per_month: number | null;
}

const categoryLabels: Record<string, string> = {
  coupon: 'Cupom',
  giftcard: 'Gift Card',
  time_off: 'Folga',
  lunch: 'Almoço',
  early_leave: 'Saída Antecipada',
  physical_prize: 'Prêmio Físico',
};

export const RewardsManagement = () => {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPurchasesDialog, setShowPurchasesDialog] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);
  const { toast } = useToast();

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('reward_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as recompensas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const toggleRewardStatus = async (rewardId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('reward_items')
        .update({ is_active: !currentStatus })
        .eq('id', rewardId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Recompensa ${!currentStatus ? 'ativada' : 'desativada'} com sucesso`,
      });
      fetchRewards();
    } catch (error) {
      console.error('Error toggling reward status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a recompensa',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Recompensas</CardTitle>
              <CardDescription>
                Crie e gerencie recompensas para a loja
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPurchasesDialog(true)}>
                Ver Compras
              </Button>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-[#83cef6] hover:bg-[#8dd1f6] text-[#0a639a]">
                <Plus className="mr-2 h-4 w-4" />
                Nova Recompensa
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rewards.map((reward) => (
                <TableRow key={reward.id}>
                  <TableCell>
                    {reward.image_url ? (
                      <img
                        src={reward.image_url}
                        alt={reward.name}
                        className="h-12 w-12 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={reward.image_url ? 'hidden' : 'flex h-12 w-12 items-center justify-center bg-muted rounded'}>
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{reward.name}</p>
                      {reward.description && (
                        <p className="text-sm text-muted-foreground">{reward.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {categoryLabels[reward.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>{reward.cost} pts</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      {reward.stock !== null ? `${reward.stock} un.` : 'Ilimitado'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={reward.is_active ? 'default' : 'secondary'}>
                      {reward.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingReward(reward)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRewardStatus(reward.id, reward.is_active)}
                      >
                        {reward.is_active ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateRewardDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchRewards}
      />

      <EditRewardDialog
        reward={editingReward}
        open={!!editingReward}
        onOpenChange={(open) => !open && setEditingReward(null)}
        onSuccess={fetchRewards}
      />

      <RewardPurchasesDialog
        open={showPurchasesDialog}
        onOpenChange={setShowPurchasesDialog}
      />
    </div>
  );
};
