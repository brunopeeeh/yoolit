import { User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginPopover from "./LoginPopover";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
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

const statuses = [
  { value: "feedback", label: "Feedback", icon: MessageSquare, color: "#3B82F6" },
  { value: "meeting", label: "Reunião/Treinamento", icon: Users, color: "#8B5CF6" },
  { value: "yooga", label: "Yooga Timer⭐", icon: Coffee, color: "#F59E0B" },
  { value: "pause", label: "Pausa - Aprovada", icon: Clock, color: "#EAB308" },
  { value: "water", label: "Água/Banheiro", icon: Droplets, color: "#06B6D4" },
  { value: "external", label: "Demandas Externas", icon: ExternalLink, color: "#4338CA" },
  { value: "available", label: "Disponível", icon: CheckCircle, color: "#10B981" },
  { value: "unavailable", label: "Indisponível", icon: XCircle, color: "#EC4899" },
];

interface HeaderProps {
  user: User | null;
  profile: any;
  onUserChange: (user: User | null) => void;
  onProfileChange?: (profile: any) => void;
}

const Header = ({ user, profile, onUserChange, onProfileChange }: HeaderProps) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Usar diretamente o profile prop em vez de estado local
  // para garantir que sempre reflita o estado mais atual
  const currentStatusObj = profile?.status 
    ? statuses.find((s) => s.value === profile.status) || statuses[6] // default para "available"
    : statuses[6]; // default para "available"
  
  const CurrentStatusIcon = currentStatusObj.icon;
  return (
    <header className="bg-gradient-to-r from-[#4A9FBD] to-[#2E7D9B] text-white py-4 px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maya</h1>
          <p>Utilize Maya e tenha auxilio nos atendimentos! 😇</p>
        </div>
        
        <LoginPopover
          user={user}
          profile={profile}
          onUserChange={onUserChange}
          onProfileChange={onProfileChange}
          isOpen={isLoginOpen}
          onOpenChange={setIsLoginOpen}
        >
          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/30"
            >
              <UserIcon className="h-5 w-5" />
            </Button>
            {user && profile && (
                 <div 
                   className="absolute -bottom-1 -left-1 h-5 w-5 rounded-full flex items-center justify-center border-2 border-white"
                   style={{ backgroundColor: currentStatusObj.color }}
                 >
                   <CurrentStatusIcon className="h-3 w-3 text-white" />
                 </div>
               )}
          </div>
        </LoginPopover>
      </div>
    </header>
  );
};

export default Header;
