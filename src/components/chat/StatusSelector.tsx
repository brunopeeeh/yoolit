import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { STATUS_CONFIG, getStatusConfig } from "@/lib/statusConfig";

interface StatusSelectorProps {
  userId: string;
  currentStatus: string;
}

const StatusSelector = ({ userId, currentStatus }: StatusSelectorProps) => {
  const [status, setStatus] = useState(currentStatus);

  const handleStatusChange = async (newStatus: string) => {
    const oldStatus = status;
    setStatus(newStatus);
    
    try {
      // Update profile status in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Create status change record
      const { error: changeError } = await supabase
        .from('status_changes')
        .insert({
          user_id: userId,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: userId,
        });

      if (changeError) throw changeError;

      // Update localStorage for backward compatibility
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const updatedUsers = users.map((u: any) =>
        u.id === userId ? { ...u, status: newStatus } : u
      );
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      if (currentUser.id === userId) {
        currentUser.status = newStatus;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
      }

      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
      // Revert status on error
      setStatus(oldStatus);
    }
  };

  const currentStatusObj = getStatusConfig(status);
  const Icon = currentStatusObj.icon;

  return (
    <Select value={status} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[180px] h-8 text-xs">
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon className={`h-3 w-3 ${currentStatusObj.textColor}`} />
            <span>{currentStatusObj.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_CONFIG.map((s) => {
          const StatusIcon = s.icon;
          return (
            <SelectItem key={s.value} value={s.value}>
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-4 w-4 ${s.textColor}`} />
                <span>{s.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default StatusSelector;
