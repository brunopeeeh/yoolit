import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Coins, Tag, Package, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { PurchaseTicket } from './PurchaseTicket';

interface Purchase {
  id: string;
  points_spent: number;
  status: string;
  purchased_at: string;
  reward_items: {
    name: string;
    category: string;
  };
}

interface MyPurchasesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryLabels: Record<string, string> = {
  coupon: 'Cupom',
  giftcard: 'Gift Card',
  time_off: 'Folga',
  lunch: 'Almoço',
  early_leave: 'Saída Antecipada',
  physical_prize: 'Prêmio Físico',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export const MyPurchasesDialog = ({ open, onOpenChange }: MyPurchasesDialogProps) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState<string>('all');
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [ticketOpen, setTicketOpen] = useState(false);
  const { toast } = useToast();

  const fetchPurchases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: purchasesData, error } = await supabase
        .from('reward_purchases')
        .select(`
          *,
          reward_items (
            name,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (error) throw error;

      setPurchases(purchasesData || []);
      setFilteredPurchases(purchasesData || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar suas compras',
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

  useEffect(() => {
    if (daysFilter === 'all') {
      setFilteredPurchases(purchases);
      return;
    }

    const days = parseInt(daysFilter);
    const cutoffDate = startOfDay(subDays(new Date(), days));

    const filtered = purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.purchased_at);
      return purchaseDate >= cutoffDate;
    });

    setFilteredPurchases(filtered);
  }, [daysFilter, purchases]);

  const handleViewTicket = (purchase: Purchase) => {
    setSelectedPurchase({
      id: purchase.id,
      rewardName: purchase.reward_items.name,
      rewardCategory: purchase.reward_items.category,
      pointsSpent: purchase.points_spent,
      purchasedAt: purchase.purchased_at,
      userName: '',
    });
    setTicketOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meu Histórico de Resgates</DialogTitle>
            <DialogDescription>
              Visualize todas as suas compras de recompensas
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={daysFilter} onValueChange={setDaysFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {filteredPurchases.length} {filteredPurchases.length === 1 ? 'resgate' : 'resgates'}
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredPurchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum resgate encontrado neste período</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPurchases.map((purchase) => (
                <Card key={purchase.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{purchase.reward_items.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Tag className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {categoryLabels[purchase.reward_items.category]}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={
                              purchase.status === 'delivered'
                                ? 'default'
                                : purchase.status === 'cancelled'
                                ? 'destructive'
                                : purchase.status === 'approved'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {statusLabels[purchase.status]}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Coins className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{purchase.points_spent} pts</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(purchase.purchased_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewTicket(purchase)}
                        className="shrink-0"
                      >
                        Ver Comprovante
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PurchaseTicket
        open={ticketOpen}
        onOpenChange={setTicketOpen}
        purchase={selectedPurchase}
      />
    </>
  );
};
