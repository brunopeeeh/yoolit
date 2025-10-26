import { useState } from "react";
import {
  MessageSquare,
  Users,
  Coffee,
  Clock,
  Droplets,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatusSelectorProps {
  userId: string;
  currentStatus: string;
}

const statuses = [
  { value: "available", label: "Disponível", icon: CheckCircle, color: "text-green-500" },
  { value: "feedback", label: "Feedback", icon: MessageSquare, color: "text-blue-500" },
  { value: "meeting", label: "Reunião/Treinamento", icon: Users, color: "text-purple-500" },
  { value: "yooga", label: "Yooga Timer⭐", icon: Coffee, color: "text-orange-500" },
  { value: "pause", label: "Pausa - Aprovada", icon: Clock, color: "text-yellow-500" },
  { value: "water", label: "Água/Banheiro", icon: Droplets, color: "text-cyan-500" },
  { value: "external", label: "Demandas Externas", icon: ExternalLink, color: "text-indigo-500" },
  { value: "unavailable", label: "Indisponível", icon: XCircle, color: "text-pink-500" },
];

const StatusSelector = ({ userId, currentStatus }: StatusSelectorProps) => {
  const [status, setStatus] = useState(currentStatus);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
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
  };

  const currentStatusObj = statuses.find((s) => s.value === status) || statuses[0];
  const Icon = currentStatusObj.icon;

  return (
    <Select value={status} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[180px] h-8 text-xs">
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon className={`h-3 w-3 ${currentStatusObj.color}`} />
            <span>{currentStatusObj.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statuses.map((s) => {
          const StatusIcon = s.icon;
          return (
            <SelectItem key={s.value} value={s.value}>
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-4 w-4 ${s.color}`} />
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
