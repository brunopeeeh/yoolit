import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ListChecks } from 'lucide-react';

interface ChecklistItem {
  id: string;
  description: string;
  points: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  completion_rules: string | null;
  points: number;
  task_type: 'simple' | 'checklist';
  checklist_items: ChecklistItem[] | null;
}

interface CompleteTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CompleteTaskDialog = ({ task, open, onOpenChange, onSuccess }: CompleteTaskDialogProps) => {
  const [notes, setNotes] = useState('');
  const [links, setLinks] = useState('');
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const toggleItem = (itemId: string) => {
    setCompletedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getCompletedPoints = () => {
    if (!task.checklist_items) return 0;
    return task.checklist_items
      .filter(item => completedItems.includes(item.id))
      .reduce((sum, item) => sum + item.points, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (task.task_type === 'checklist' && completedItems.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Marque pelo menos um item da checklist',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const completionData: any = {
        task_id: task.id,
        user_id: user.id,
        notes: notes || null,
        links: links || null,
      };

      if (task.task_type === 'checklist' && task.checklist_items) {
        completionData.completed_items = task.checklist_items
          .filter(item => completedItems.includes(item.id))
          .map(item => ({ id: item.id, description: item.description, points: item.points }));
      }

      const { error } = await supabase.from('task_completions').insert(completionData);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tarefa enviada para aprovação',
      });

      setNotes('');
      setLinks('');
      setCompletedItems([]);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast({
        title: 'Erro',
        description: error.message === 'duplicate key value violates unique constraint "task_completions_task_id_user_id_key"'
          ? 'Você já enviou esta tarefa para aprovação'
          : 'Não foi possível completar a tarefa',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Concluir Tarefa</DialogTitle>
          <DialogDescription>
            {task.title} - {task.points} pontos
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {task.task_type === 'simple' && task.completion_rules && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <ListChecks className="h-4 w-4" />
                Regras para Conclusão
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {task.completion_rules}
              </p>
            </div>
          )}

          {task.task_type === 'checklist' && task.checklist_items && (
            <div className="space-y-3">
              <Label>Marque os itens concluídos *</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-3">
                {task.checklist_items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                    <Checkbox
                      id={item.id}
                      checked={completedItems.includes(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <label
                      htmlFor={item.id}
                      className="flex-1 text-sm cursor-pointer"
                    >
                      {item.description}
                    </label>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {item.points} pts
                    </span>
                  </div>
                ))}
              </div>
              {completedItems.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Pontos selecionados: <span className="font-semibold">{getCompletedPoints()}</span> / {task.points}
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione detalhes sobre como você completou esta tarefa..."
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="links">Links (opcional)</Label>
            <Textarea
              id="links"
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder="Adicione links relevantes, um por linha..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#83cef6] hover:bg-[#8dd1f6] text-[#0a639a]">
              {isLoading ? 'Enviando...' : 'Enviar para Aprovação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
