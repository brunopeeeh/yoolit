import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TimeInput } from './TimeInput';

interface PreApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (paymentType: 'scheduled' | 'wallet', scheduledDate?: Date, startTime?: string, endTime?: string) => void;
  isLoading?: boolean;
}

export const PreApprovalDialog = ({ open, onOpenChange, onConfirm, isLoading }: PreApprovalDialogProps) => {
  const [paymentType, setPaymentType] = useState<'scheduled' | 'wallet'>('wallet');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [errors, setErrors] = useState<{ date?: string; startTime?: string; endTime?: string }>({});

  const handleConfirm = () => {
    if (paymentType === 'scheduled') {
      const newErrors: { date?: string; startTime?: string; endTime?: string } = {};
      
      if (!selectedDate) {
        newErrors.date = 'Selecione uma data';
      }
      
      if (!startTime) {
        newErrors.startTime = 'Selecione o horário inicial';
      }
      
      if (!endTime) {
        newErrors.endTime = 'Selecione o horário final';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }
    
    onConfirm(paymentType, selectedDate, startTime, endTime);
  };

  const handleClose = () => {
    setPaymentType('wallet');
    setSelectedDate(undefined);
    setStartTime('');
    setEndTime('');
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Como deseja receber essa troca?</DialogTitle>
          <DialogDescription>
            Escolha se deseja agendar o pagamento da troca ou adicionar ao seu saldo de trocas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as 'scheduled' | 'wallet')}>
            <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4">
              <RadioGroupItem value="wallet" id="wallet" />
              <div className="flex-1 space-y-1">
                <Label htmlFor="wallet" className="font-medium cursor-pointer flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Adicionar ao saldo
                </Label>
                <p className="text-sm text-muted-foreground">
                  Os pontos de troca ficarão disponíveis para você usar quando precisar
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4">
              <RadioGroupItem value="scheduled" id="scheduled" />
              <div className="flex-1 space-y-1">
                <Label htmlFor="scheduled" className="font-medium cursor-pointer flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Agendar pagamento
                </Label>
                <p className="text-sm text-muted-foreground">
                  Defina uma data e horário específicos para receber a troca
                </p>
              </div>
            </div>
          </RadioGroup>

          {paymentType === 'scheduled' && (
            <div className="space-y-4 pl-4 border-l-2">
              <div className="space-y-2">
                <Label>Data do pagamento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                        errors.date && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setErrors((prev) => ({ ...prev, date: undefined }));
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
              </div>

              <TimeInput
                label="Horário inicial"
                value={startTime}
                onChange={(value) => {
                  setStartTime(value);
                  setErrors((prev) => ({ ...prev, startTime: undefined }));
                }}
                error={errors.startTime}
              />

              <TimeInput
                label="Horário final"
                value={endTime}
                onChange={(value) => {
                  setEndTime(value);
                  setErrors((prev) => ({ ...prev, endTime: undefined }));
                }}
                error={errors.endTime}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading} className="bg-[#83cef6] hover:bg-[#8dd1f6] text-[#0a639a]">
            {isLoading ? 'Processando...' : 'Confirmar Pré-Aprovação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
