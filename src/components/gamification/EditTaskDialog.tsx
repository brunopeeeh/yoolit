import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { generateUUID } from '@/lib/utils';

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
  deadline: string;
  task_type: 'simple' | 'checklist' | 'chat_usage';
  checklist_items: ChecklistItem[] | null;
  chat_target_count: number | null;
}

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditTaskDialog = ({ task, open, onOpenChange, onSuccess }: EditTaskDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [taskType, setTaskType] = useState<'simple' | 'checklist' | 'chat_usage'>('simple');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    completion_rules: '',
    points: '',
    deadline: '',
    chat_target_count: '',
  });
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (task) {
      const deadlineDate = new Date(task.deadline);
      const localDeadline = new Date(deadlineDate.getTime() - deadlineDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      setTaskType(task.task_type);
      setFormData({
        title: task.title,
        description: task.description || '',
        completion_rules: task.completion_rules || '',
        points: task.points.toString(),
        deadline: localDeadline,
        chat_target_count: task.chat_target_count?.toString() || '',
      });
      setChecklistItems(task.checklist_items || []);
    }
  }, [task]);

  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, { id: generateUUID(), description: '', points: 0 }]);
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== id));
  };

  const updateChecklistItem = (id: string, field: 'description' | 'points', value: string | number) => {
    setChecklistItems(checklistItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const getTotalPoints = () => {
    return checklistItems.reduce((sum, item) => sum + item.points, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    if (taskType === 'checklist' && checklistItems.length === 0) {
      toast({ title: 'Erro', description: 'Adicione pelo menos um item à checklist', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const updateData: any = {
        title: formData.title,
        description: formData.description || null,
        deadline: new Date(formData.deadline).toISOString(),
        task_type: taskType,
        completion_rules: null,
        checklist_items: null,
        chat_target_count: null,
      };

      if (taskType === 'simple') {
        updateData.completion_rules = formData.completion_rules || null;
        updateData.points = parseInt(formData.points);
      } else if (taskType === 'checklist') {
        updateData.checklist_items = checklistItems;
        updateData.points = getTotalPoints();
      } else if (taskType === 'chat_usage') {
        updateData.points = parseInt(formData.points);
        updateData.chat_target_count = parseInt(formData.chat_target_count);
        updateData.completion_rules = formData.completion_rules || null;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', task.id);

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Tarefa atualizada com sucesso' });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar a tarefa', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
          <DialogDescription>Modifique os campos da tarefa</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Título *</Label>
            <Input id="edit-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>

          <div>
            <Label>Tipo de Tarefa *</Label>
            <Select value={taskType} onValueChange={(value: 'simple' | 'checklist' | 'chat_usage') => setTaskType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Tarefa Simples</SelectItem>
                <SelectItem value="checklist">Checklist (To-Do List)</SelectItem>
                <SelectItem value="chat_usage">Uso do Chat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {taskType === 'simple' ? (
            <>
              <div>
                <Label htmlFor="edit-rules">Regras para Conclusão</Label>
                <Textarea id="edit-rules" value={formData.completion_rules} onChange={(e) => setFormData({ ...formData, completion_rules: e.target.value })} placeholder="Ex: Enviar print da tela, preencher formulário" rows={3} />
              </div>
              <div>
                <Label htmlFor="edit-points">Pontos *</Label>
                <Input id="edit-points" type="number" min="1" value={formData.points} onChange={(e) => setFormData({ ...formData, points: e.target.value })} required />
              </div>
            </>
          ) : taskType === 'chat_usage' ? (
            <>
              <div>
                <Label htmlFor="edit-chat-target">Quantidade de mensagens necessárias *</Label>
                <Input id="edit-chat-target" type="number" min="1" value={formData.chat_target_count} onChange={(e) => setFormData({ ...formData, chat_target_count: e.target.value })} placeholder="Ex: 10" required />
              </div>
              <div>
                <Label htmlFor="edit-chat-rules">Regras / Descrição da auditoria</Label>
                <Textarea id="edit-chat-rules" value={formData.completion_rules} onChange={(e) => setFormData({ ...formData, completion_rules: e.target.value })} placeholder="Ex: Enviar perguntas relevantes sobre atendimento" rows={3} />
              </div>
              <div>
                <Label htmlFor="edit-chat-points">Pontos *</Label>
                <Input id="edit-chat-points" type="number" min="1" value={formData.points} onChange={(e) => setFormData({ ...formData, points: e.target.value })} required />
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Itens da Checklist *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Item
                </Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {checklistItems.map((item, index) => (
                  <div key={item.id} className="flex gap-2 items-start p-2 border rounded-md">
                    <div className="flex-1">
                      <Input placeholder={`Item ${index + 1}`} value={item.description} onChange={(e) => updateChecklistItem(item.id, 'description', e.target.value)} required />
                    </div>
                    <div className="w-24">
                      <Input type="number" placeholder="Pontos" min="0" value={item.points || ''} onChange={(e) => updateChecklistItem(item.id, 'points', parseInt(e.target.value) || 0)} required />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeChecklistItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              {checklistItems.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Total de Pontos: <span className="font-semibold">{getTotalPoints()}</span>
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="edit-deadline">Prazo *</Label>
            <Input id="edit-deadline" type="datetime-local" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="bg-[#83cef6] hover:bg-[#8dd1f6] text-[#0a639a]">
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
