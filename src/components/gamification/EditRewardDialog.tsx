import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface RewardItem {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  category: string;
  stock: number | null;
  image_url: string | null;
}

interface EditRewardDialogProps {
  reward: RewardItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const categories = [
  { value: 'coupon', label: 'Cupom' },
  { value: 'giftcard', label: 'Gift Card' },
  { value: 'time_off', label: 'Folga' },
  { value: 'lunch', label: 'Almoço' },
  { value: 'early_leave', label: 'Saída Antecipada' },
  { value: 'physical_prize', label: 'Prêmio Físico' },
];

export const EditRewardDialog = ({ reward, open, onOpenChange, onSuccess }: EditRewardDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: '',
    category: '',
    stock: '',
    image_url: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (reward) {
      setFormData({
        name: reward.name,
        description: reward.description || '',
        cost: reward.cost.toString(),
        category: reward.category,
        stock: reward.stock !== null ? reward.stock.toString() : '',
        image_url: reward.image_url || '',
      });
    }
  }, [reward]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reward) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('reward_items')
        .update({
          name: formData.name,
          description: formData.description || null,
          cost: parseInt(formData.cost),
          category: formData.category,
          stock: formData.stock ? parseInt(formData.stock) : null,
          image_url: formData.image_url || null,
        })
        .eq('id', reward.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Recompensa atualizada com sucesso',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating reward:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a recompensa',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Recompensa</DialogTitle>
          <DialogDescription>
            Modifique os campos da recompensa
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cost">Custo em Pontos *</Label>
            <Input
              id="cost"
              type="number"
              min="1"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="stock">Estoque (deixe vazio para ilimitado)</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="image_url">URL da Imagem</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#83cef6] hover:bg-[#8dd1f6] text-[#0a639a]">
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
