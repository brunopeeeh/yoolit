import { User as UserIcon, SquareArrowOutUpRight, Sparkles } from "lucide-react";
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

  const currentStatusObj = profile?.status 
    ? statuses.find((s) => s.value === profile.status) || statuses[6]
    : statuses[6];
  
  const CurrentStatusIcon = currentStatusObj.icon;

  return (
    <header className="header-gradient header-shimmer relative text-white shadow-lg overflow-hidden">
      <div className="relative max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-[60px] sm:h-[68px]">
        
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-inner">
            <Sparkles className="sparkle-pulse h-4 w-4 sm:h-4 sm:w-4 text-white" />
          </div>
          <div className="flex flex-col justify-center leading-none">
            <h1 className="text-base sm:text-xl font-bold tracking-tight">Maya</h1>
            <p className="text-[10px] sm:text-xs text-white/75 mt-0.5 hidden xs:block">Auxílio inteligente para atendimentos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          {hasAdminAccess && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
              onClick={() => {
                const adminUrl = isAgent && !isAdmin ? '/admin?tab=swap-requests' : '/admin?tab=dashboard';
                window.open(adminUrl, '_blank');
              }}
              title="Abrir Dashboard"
            >
              <SquareArrowOutUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
              >
                <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              {user && profile && (
                <div 
                  className="absolute -bottom-1 -left-1 h-4 w-4 sm:h-4.5 sm:w-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                  style={{ backgroundColor: currentStatusObj.color }}
                >
                  <CurrentStatusIcon className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
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
