import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Profile = {
  id: string;
  name: string;
  email: string;
  roles: string[];
};

const daysOfWeek = [
  { key: 'dom', label: 'Dom' },
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
];

const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'agent', label: 'Agente' },
  { value: 'supervisor', label: 'Supervisor' }
];

type DaySchedule = {
  workStart: string;
  workEnd: string;
  breakStart: string;
  breakEnd: string;
};

type WeekSchedule = {
  [key: string]: DaySchedule;
};

interface EditAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile;
  onSuccess?: () => void;
}

export const EditAgentDialog = ({ open, onOpenChange, user, onSuccess }: EditAgentDialogProps) => {
  const [selectedDay, setSelectedDay] = useState('dom');
  const [schedules, setSchedules] = useState<WeekSchedule>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [rolesChanged, setRolesChanged] = useState(false);

  useEffect(() => {
    setSelectedRoles(user.roles);
    setName(user.name);
    setEmail(user.email);
    setRolesChanged(false);
    
    // Load existing schedules
    const loadSchedules = async () => {
      try {
        const { data, error } = await supabase
          .from('agent_schedules')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          const loadedSchedules: WeekSchedule = {};
          data.forEach((schedule: any) => {
            loadedSchedules[schedule.day_of_week] = {
              workStart: schedule.work_start_time || '',
              workEnd: schedule.work_end_time || '',
              breakStart: schedule.break_start_time || '',
              breakEnd: schedule.break_end_time || '',
            };
          });
          setSchedules(loadedSchedules);
        }
      } catch (error) {
        console.error('Error loading schedules:', error);
      }
    };

    loadSchedules();
  }, [user]);

  const handleScheduleChange = (field: keyof DaySchedule, value: string) => {
    setSchedules((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [field]: value,
      },
    }));
  };

  const getCurrentSchedule = (): DaySchedule => {
    return schedules[selectedDay] || {
      workStart: '',
      workEnd: '',
      breakStart: '',
      breakEnd: '',
    };
  };

  const handleRoleToggle = (role: string) => {
    setRolesChanged(true);
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSaveRoles = async () => {
    try {
      // Get current user ID
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Remove all existing roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Add new roles with created_by field
      if (selectedRoles.length > 0) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(
            selectedRoles.map(role => ({
              user_id: user.id,
              role: role as 'admin' | 'agent' | 'supervisor',
              created_by: currentUser.id
            }))
          );

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating roles:', error);
      throw error;
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name, email })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const handleSaveSchedules = async () => {
    try {
      const schedulesToUpsert = Object.entries(schedules).map(([day, schedule]) => ({
        user_id: user.id,
        day_of_week: day,
        work_start_time: schedule.workStart || null,
        work_end_time: schedule.workEnd || null,
        break_start_time: schedule.breakStart || null,
        break_end_time: schedule.breakEnd || null,
      }));

      if (schedulesToUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from('agent_schedules')
          .upsert(schedulesToUpsert, { onConflict: 'user_id,day_of_week' });

        if (upsertError) throw upsertError;
      }
    } catch (error) {
      console.error('Error saving schedules:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await handleSaveProfile();
      
      // Só atualiza roles se foram modificadas
      if (rolesChanged) {
        await handleSaveRoles();
      }
      
      // Salvar horários
      await handleSaveSchedules();
      
      toast.success('Agente atualizado com sucesso!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Erro ao atualizar agente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSchedule = getCurrentSchedule();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Agente</DialogTitle>
          <DialogDescription>
            Atualize as informações, permissões e escala de trabalho do agente
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações e Permissões</TabsTrigger>
            <TabsTrigger value="schedule">Escala de Trabalho</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Profile Info */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome do agente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agente@yooga.com.br"
              />
            </div>

            {/* Roles */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base font-semibold">Permissões</Label>
              {AVAILABLE_ROLES.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${role.value}`}
                    checked={selectedRoles.includes(role.value)}
                    onCheckedChange={() => handleRoleToggle(role.value)}
                  />
                  <Label
                    htmlFor={`edit-${role.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {role.label}
                  </Label>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            {/* Days selector */}
            <div className="flex gap-2">
              {daysOfWeek.map((day) => (
                <Button
                  key={day.key}
                  type="button"
                  variant={selectedDay === day.key ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedDay(day.key)}
                >
                  {day.label}
                </Button>
              ))}
            </div>

            {/* Schedule configuration */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Configurar Horários</h4>
                <span className="text-sm text-muted-foreground capitalize">
                  {daysOfWeek.find((d) => d.key === selectedDay)?.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Horário de Trabalho */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Horário de Trabalho</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type="time"
                        value={currentSchedule.workStart}
                        onChange={(e) => handleScheduleChange('workStart', e.target.value)}
                        className="pl-8"
                      />
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="text-center text-xs text-muted-foreground">até</div>
                    <div className="relative">
                      <Input
                        type="time"
                        value={currentSchedule.workEnd}
                        onChange={(e) => handleScheduleChange('workEnd', e.target.value)}
                        className="pl-8"
                      />
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Intervalo */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Intervalo</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type="time"
                        value={currentSchedule.breakStart}
                        onChange={(e) => handleScheduleChange('breakStart', e.target.value)}
                        className="pl-8"
                      />
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="text-center text-xs text-muted-foreground">até</div>
                    <div className="relative">
                      <Input
                        type="time"
                        value={currentSchedule.breakEnd}
                        onChange={(e) => handleScheduleChange('breakEnd', e.target.value)}
                        className="pl-8"
                      />
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule summary */}
            {Object.keys(schedules).length > 0 && (
              <div className="border rounded-lg p-3 bg-muted/30">
                <p className="text-xs font-medium mb-2">Horários configurados:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(schedules).map(([day, schedule]) => (
                    <div
                      key={day}
                      className="text-xs bg-background px-2 py-1 rounded border"
                    >
                      <span className="font-medium capitalize">
                        {daysOfWeek.find((d) => d.key === day)?.label}:
                      </span>{' '}
                      {schedule.workStart && schedule.workEnd
                        ? `${schedule.workStart}-${schedule.workEnd}`
                        : 'Não configurado'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-[#83cef6] hover:bg-[#8dd1f6] text-[#0a639a]"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
