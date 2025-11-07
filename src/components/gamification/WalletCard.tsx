import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Wallet {
  points: number;
  total_earned: number;
  total_spent: number;
}

interface WalletCardProps {
  onOpenHistory: () => void;
}

export const WalletCard = ({ onOpenHistory }: WalletCardProps) => {
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
    <Card className="shadow-lg border-primary/20 hover:shadow-xl transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Wallet className="h-5 w-5 text-yellow-500" />
              </div>
              Minha Wallet
            </CardTitle>
            <CardDescription>Seus pontos e estatísticas</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenHistory}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            Histórico
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center p-6 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20">
            <p className="text-sm text-muted-foreground mb-2 font-medium">Pontos Disponíveis</p>
            <p className="text-5xl font-bold text-yellow-500 tracking-tight">{wallet?.points || 0}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="p-1.5 rounded bg-green-500/10">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <span className="font-medium">Total Ganho</span>
              </div>
              <p className="text-2xl font-bold">{wallet?.total_earned || 0}</p>
            </div>
            <div className="space-y-2 p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="p-1.5 rounded bg-red-500/10">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </div>
                <span className="font-medium">Total Gasto</span>
              </div>
              <p className="text-2xl font-bold">{wallet?.total_spent || 0}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
