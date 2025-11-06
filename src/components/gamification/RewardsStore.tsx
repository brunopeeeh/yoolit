import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, ShoppingCart, Package, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WalletCard } from './WalletCard';

interface RewardItem {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  category: string;
  stock: number | null;
  image_url: string | null;
}

interface Wallet {
  points: number;
}

const categoryLabels: Record<string, string> = {
  coupon: 'Cupom',
  giftcard: 'Gift Card',
  time_off: 'Folga',
  lunch: 'Almoço',
  early_leave: 'Saída Antecipada',
  physical_prize: 'Prêmio Físico',
};

export const RewardsStore = () => {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const [rewardsResult, walletResult] = await Promise.all([
        supabase
          .from('reward_items')
          .select('*')
          .eq('is_active', true)
          .order('cost', { ascending: true }),
        supabase
          .from('agent_wallets')
          .select('points')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (rewardsResult.error) throw rewardsResult.error;
      if (walletResult.error) throw walletResult.error;

      setRewards(rewardsResult.data || []);
      setWallet(walletResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a loja',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePurchase = async (reward: RewardItem) => {
    if (!wallet || wallet.points < reward.cost) {
      toast({
        title: 'Pontos insuficientes',
        description: `Você precisa de ${reward.cost - (wallet?.points || 0)} pontos a mais`,
        variant: 'destructive',
      });
      return;
    }

    if (reward.stock !== null && reward.stock <= 0) {
      toast({
        title: 'Sem estoque',
        description: 'Este item está esgotado',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('reward_purchases').insert({
        reward_id: reward.id,
        user_id: user.id,
        points_spent: reward.cost,
      });

      if (error) throw error;

      toast({
        title: 'Compra realizada!',
        description: 'Aguarde a aprovação do supervisor',
      });

      fetchData();
    } catch (error) {
      console.error('Error purchasing reward:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível realizar a compra',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <WalletCard />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Loja de Recompensas
          </CardTitle>
          <CardDescription>
            Troque seus pontos por recompensas incríveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => {
              const canAfford = wallet && wallet.points >= reward.cost;
              const hasStock = reward.stock === null || reward.stock > 0;

              return (
                <Card key={reward.id} className="overflow-hidden">
                  {reward.image_url && (
                    <div className="relative h-48 w-full overflow-hidden bg-muted">
                      <img
                        src={reward.image_url}
                        alt={reward.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{reward.name}</CardTitle>
                      <Badge variant="secondary">
                        {categoryLabels[reward.category]}
                      </Badge>
                    </div>
                    {reward.description && (
                      <CardDescription>{reward.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-yellow-500" />
                        <span className="font-bold text-lg">{reward.cost} pts</span>
                      </div>
                      {reward.stock !== null && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Package className="h-4 w-4" />
                          {reward.stock} un.
                        </div>
                      )}
                    </div>
                    <Button
                      className="w-full bg-[#83cef6] hover:bg-[#8dd1f6] text-[#0a639a]"
                      onClick={() => handlePurchase(reward)}
                      disabled={!canAfford || !hasStock}
                    >
                      {!hasStock
                        ? 'Esgotado'
                        : !canAfford
                        ? 'Pontos insuficientes'
                        : 'Comprar'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
