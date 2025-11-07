import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface Wallet {
  points: number;
  total_earned: number;
  total_spent: number;
}

export const WalletCard = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('agent_wallets')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          // Create wallet if it doesn't exist
          const { data: newWallet, error: insertError } = await supabase
            .from('agent_wallets')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (insertError) throw insertError;
          setWallet(newWallet);
        } else {
          setWallet(data);
        }
      } catch (error) {
        console.error('Error fetching wallet:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWallet();
  }, []);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-yellow-500" />
          Minha Wallet
        </CardTitle>
        <CardDescription>Seus pontos e estatísticas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Pontos Disponíveis</p>
            <p className="text-4xl font-bold text-yellow-500">{wallet?.points || 0}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Total Ganho</span>
              </div>
              <p className="text-2xl font-semibold">{wallet?.total_earned || 0}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span>Total Gasto</span>
              </div>
              <p className="text-2xl font-semibold">{wallet?.total_spent || 0}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
