import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateTaskDialog = ({ open, onOpenChange, onSuccess }: CreateTaskDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    completion_rules: '',
    points: '',
    deadline: '',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('tasks').insert({
        title: formData.title,
        description: formData.description || null,
        completion_rules: formData.completion_rules || null,
        points: parseInt(formData.points),
        deadline: new Date(formData.deadline).toISOString(),
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tarefa criada com sucesso',
      });

      setFormData({ title: '', description: '', completion_rules: '', points: '', deadline: '' });
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
