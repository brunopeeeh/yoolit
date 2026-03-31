import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ChecklistItem {
  id: string;
  description: string;
  points: number;
}

export const CreateTaskDialog = ({ open, onOpenChange, onSuccess }: CreateTaskDialogProps) => {
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

  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, { id: crypto.randomUUID(), description: '', points: 0 }]);
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
    
    if (taskType === 'checklist' && checklistItems.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um item à checklist',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const taskData: any = {
        title: formData.title,
        description: formData.description || null,
        deadline: new Date(formData.deadline).toISOString(),
        created_by: user.id,
        task_type: taskType,
      };

      if (taskType === 'simple') {
        taskData.completion_rules = formData.completion_rules || null;
        taskData.points = parseInt(formData.points);
      } else if (taskType === 'checklist') {
        taskData.checklist_items = checklistItems;
        taskData.points = getTotalPoints();
      } else if (taskType === 'chat_usage') {
        taskData.points = parseInt(formData.points);
        taskData.chat_target_count = parseInt(formData.chat_target_count);
        taskData.completion_rules = formData.completion_rules || null;
      }

      const { error } = await supabase.from('tasks').insert(taskData);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tarefa criada com sucesso',
      });

      setFormData({ title: '', description: '', completion_rules: '', points: '', deadline: '' });
      setChecklistItems([]);
      setTaskType('simple');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a tarefa',
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
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>
            Crie uma nova tarefa para os agentes completarem
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="taskType">Tipo de Tarefa *</Label>
            <Select value={taskType} onValueChange={(value: 'simple' | 'checklist') => setTaskType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Tarefa Simples</SelectItem>
                <SelectItem value="checklist">Checklist (To-Do List)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {taskType === 'simple' ? (
            <>
              <div>
                <Label htmlFor="completion_rules">Regras para Conclusão</Label>
                <Textarea
                  id="completion_rules"
                  value={formData.completion_rules}
                  onChange={(e) => setFormData({ ...formData, completion_rules: e.target.value })}
                  placeholder="Ex: Enviar print da tela, preencher formulário, realizar venda acima de X"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="points">Pontos *</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  required
                />
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
                      <Input
                        placeholder={`Item ${index + 1}`}
                        value={item.description}
                        onChange={(e) => updateChecklistItem(item.id, 'description', e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Pontos"
                        min="0"
                        value={item.points || ''}
                        onChange={(e) => updateChecklistItem(item.id, 'points', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeChecklistItem(item.id)}
                    >
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
            <Label htmlFor="deadline">Prazo *</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#83cef6] hover:bg-[#8dd1f6] text-[#0a639a]">
              {isLoading ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
