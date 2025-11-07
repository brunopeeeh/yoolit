import { Dialog, DialogContent } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ticket, Calendar, Tag, Coins, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PurchaseTicketProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: {
    id: string;
    rewardName: string;
    rewardCategory: string;
    pointsSpent: number;
    purchasedAt: string;
    userName: string;
  } | null;
}

const categoryLabels: Record<string, string> = {
  coupon: 'Cupom',
  giftcard: 'Gift Card',
  time_off: 'Folga',
  lunch: 'Almoço',
  early_leave: 'Saída Antecipada',
  physical_prize: 'Prêmio Físico',
};

export const PurchaseTicket = ({ open, onOpenChange, purchase }: PurchaseTicketProps) => {
  if (!purchase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none">
        <div className="relative bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground">
          {/* Decorative circles */}
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-background rounded-full" />
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-background rounded-full" />
          
          {/* Ticket icon */}
          <div className="flex justify-center mb-4">
            <div className="bg-primary-foreground/20 p-4 rounded-full">
              <Ticket className="h-12 w-12" />
            </div>
          </div>

          {/* Success message */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full mb-2">
              <Check className="h-4 w-4" />
              <span className="font-semibold">Resgate Confirmado!</span>
            </div>
            <h2 className="text-2xl font-bold mt-4">{purchase.rewardName}</h2>
          </div>

          {/* Ticket details */}
          <div className="space-y-4 bg-primary-foreground/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 opacity-80" />
              <div>
                <p className="text-sm opacity-80">Categoria</p>
                <p className="font-semibold">{categoryLabels[purchase.rewardCategory] || purchase.rewardCategory}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 opacity-80" />
              <div>
                <p className="text-sm opacity-80">Pontos Gastos</p>
                <p className="font-semibold">{purchase.pointsSpent} pts</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 opacity-80" />
              <div>
                <p className="text-sm opacity-80">Data do Resgate</p>
                <p className="font-semibold">
                  {format(new Date(purchase.purchasedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Ticket code */}
          <div className="mt-6 text-center">
            <p className="text-sm opacity-80 mb-2">Código do Comprovante</p>
            <div className="bg-primary-foreground/20 rounded px-4 py-2 font-mono text-sm">
              {purchase.id.slice(0, 8).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-card p-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Aguarde a aprovação do supervisor para receber sua recompensa
          </p>
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Fechar Comprovante
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
