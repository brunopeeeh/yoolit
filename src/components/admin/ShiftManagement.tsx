import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Profile = {
  id: string;
  name: string;
  email: string;
};

export const ShiftManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .order('name');

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    setProfiles(data || []);
  };

  const generateShifts = async () => {
    if (!selectedUserId || !startDate) {
      toast({
        title: 'Erro',
        description: 'Selecione um usuário e uma data inicial',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);

      // Generate 30 days of shifts (5x2 pattern)
      const shifts = [];
      let currentDate = startDate;
      let workDaysCount = 0;

      for (let i = 0; i < 30; i++) {
        const shiftType = workDaysCount < 5 ? 'trabalho' : 'folga';
        
        shifts.push({
          user_id: selectedUserId,
          shift_date: format(currentDate, 'yyyy-MM-dd'),
          shift_type: shiftType,
          start_time: shiftType === 'trabalho' ? '09:00' : null,
          end_time: shiftType === 'trabalho' ? '18:00' : null
        });

        workDaysCount++;
        if (workDaysCount === 7) {
          workDaysCount = 0;
        }

        currentDate = addDays(currentDate, 1);
      }

      // Delete existing shifts for this period
      const endDate = addDays(startDate, 29);
      await supabase
        .from('shifts')
        .delete()
        .eq('user_id', selectedUserId)
        .gte('shift_date', format(startDate, 'yyyy-MM-dd'))
        .lte('shift_date', format(endDate, 'yyyy-MM-dd'));

      // Insert new shifts
      const { error } = await supabase
        .from('shifts')
        .insert(shifts);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Escala gerada com sucesso para os próximos 30 dias'
      });
    } catch (error) {
      console.error('Error generating shifts:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar a escala',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Escalas 5x2</CardTitle>
        <CardDescription>
          Gere automaticamente escalas no formato 5 dias de trabalho e 2 dias de folga
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecione o usuário</label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um usuário" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.name || profile.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Data inicial da escala</label>
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={setStartDate}
            locale={ptBR}
            className="rounded-md border"
          />
        </div>

        <Button 
          onClick={generateShifts} 
          disabled={isLoading || !selectedUserId || !startDate}
          className="w-full"
        >
          {isLoading ? 'Gerando...' : 'Gerar Escala (30 dias)'}
        </Button>
      </CardContent>
    </Card>
  );
};
