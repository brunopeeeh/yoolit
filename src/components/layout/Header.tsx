import { User as UserIcon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginPopover from "./LoginPopover";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { useRoles } from "@/hooks/useRoles";
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
  { value: "unavailable", label: "Indisponível", icon: XCircle, color: "#ef4444" },
];

interface HeaderProps {
  user: User | null;
  profile: any;
  onUserChange: (user: User | null) => void;
  onProfileChange?: (profile: any) => void;
}

const Header = ({ user, profile, onUserChange, onProfileChange }: HeaderProps) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, hasRole, isLoading: rolesLoading } = useRoles(user?.id);
  const isAgent = hasRole('agent');
  const isSupervisor = hasRole('supervisor');
  const hasAdminAccess = isAdmin || isAgent || isSupervisor;

  useEffect(() => {
    console.log('Header - User:', user?.id);
    console.log('Header - IsAdmin:', isAdmin);
    console.log('Header - RolesLoading:', rolesLoading);
    console.log('Header - Location:', location.pathname);
  }, [user, isAdmin, rolesLoading, location]);

  // Usar diretamente o profile prop em vez de estado local
  // para garantir que sempre reflita o estado mais atual
  const currentStatusObj = profile?.status 
    ? statuses.find((s) => s.value === profile.status) || statuses[6] // default para "available"
    : statuses[6]; // default para "available"
  
  const CurrentStatusIcon = currentStatusObj.icon;
  return (
    <header className="bg-gradient-to-r from-[#83cef6] to-[#0a639a] text-white py-2 px-4 sm:py-4 sm:px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 sm:h-16">
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h1 className="text-sm sm:text-2xl font-bold truncate leading-none">Maya</h1>
          <p className="text-xs sm:text-sm leading-none mt-1 sm:mt-1">Utilize Maya e tenha auxilio nos atendimentos! 😇</p>
        </div>
        
        <div className="flex items-center gap-2">
          {hasAdminAccess && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/30"
              onClick={() => {
                if (location.pathname === '/admin') {
                  navigate('/');
                } else {
                  navigate(isAgent && !isAdmin ? '/admin?tab=swap-requests' : '/admin?tab=dashboard');
                }
              }}
              title={location.pathname === '/admin' ? 'Voltar ao Chat' : 'Painel Administrativo'}
            >
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
          
          <LoginPopover
          user={user}
          profile={profile}
          onUserChange={onUserChange}
          onProfileChange={onProfileChange}
          isOpen={isLoginOpen}
          onOpenChange={setIsLoginOpen}
        >
            <div className="relative flex-shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/30"
              >
                <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              {user && profile && (
                   <div 
                     className="absolute -bottom-0.5 -left-0.5 sm:-bottom-1 sm:-left-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full flex items-center justify-center border-2 border-white"
                     style={{ backgroundColor: currentStatusObj.color }}
                   >
                     <CurrentStatusIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                   </div>
                 )}
            </div>
          </LoginPopover>
        </div>
      </div>
    </header>
  );
};

export default Header;
