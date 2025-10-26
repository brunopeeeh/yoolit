import { useState, ReactNode, useEffect } from "react";
import {
  Moon,
  Sun,
  MessageSquare,
  Users,
  Coffee,
  Clock,
  Droplets,
  ExternalLink,
  CheckCircle,
  XCircle,
  Settings,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

interface LoginPopoverProps {
  user: User | null;
  profile: any;
  onUserChange: (user: User | null) => void;
  children: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginPopover = ({ user, profile, onUserChange, children, isOpen, onOpenChange }: LoginPopoverProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [localProfile, setLocalProfile] = useState(profile);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({ title: "Credenciais inválidas", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Login realizado com sucesso!" });
      onUserChange(data.user);
      onOpenChange(false);
      setShowSignup(false);
    }
    
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          name,
        }
      }
    });

    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "Conta criada com sucesso!", 
        description: "Verifique seu email para confirmar a conta."
      });
      onUserChange(data.user);
      onOpenChange(false);
      setShowSignup(false);
    }
    
    setIsLoading(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
    } else {
      setLocalProfile({ ...localProfile, status: newStatus });
      const statusLabel = statuses.find((s) => s.value === newStatus)?.label;
      toast({ title: `Status alterado para: ${statusLabel}` });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onUserChange(null);
    onOpenChange(false);
    toast({ title: "Logout realizado" });
  };

  if (user && localProfile) {
    const currentStatusObj = statuses.find((s) => s.value === localProfile.status) || statuses[6];
    const CurrentStatusIcon = currentStatusObj.icon;

    return (
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                style={{ backgroundColor: currentStatusObj.color }}
              >
                {localProfile.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-base">{localProfile.name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground">{localProfile.email || user.email}</p>
              </div>
            </div>

            <Separator className="mb-3" />

            <div className="mb-3">
              <p className="text-sm font-medium text-muted-foreground mb-2">Status Atual</p>
              <ScrollArea className="h-[240px] pr-3">
                <div className="space-y-1">
                  {statuses.map((status) => {
                    const StatusIcon = status.icon;
                    const isSelected = localProfile.status === status.value;
                    return (
                      <button
                        key={status.value}
                        onClick={() => handleStatusChange(status.value)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
                          isSelected
                            ? "bg-accent"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        <StatusIcon
                          className="h-4 w-4 flex-shrink-0"
                          style={{ color: status.color }}
                        />
                        <span className="text-sm">{status.label}</span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <Separator className="my-3" />

            <div className="space-y-1">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors text-left"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="text-sm">Modo Escuro</span>
              </button>

              <button
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors text-left"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm">Configurações</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">
            {showSignup ? "Criar Conta" : "Fazer Login"}
          </h2>

          {!showSignup ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="daniel.braga@yooga.com.br"
                  className="bg-muted/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  className="bg-muted/50"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#4169E1] hover:bg-[#3457C0] text-white"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
              
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="w-full text-sm text-[#4169E1] hover:underline"
              >
                Não tem conta? Criar uma agora
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Nome</Label>
                <Input
                  id="signup-name"
                  name="name"
                  placeholder="Seu nome"
                  className="bg-muted/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="bg-muted/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  className="bg-muted/50"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#4169E1] hover:bg-[#3457C0] text-white"
                disabled={isLoading}
              >
                {isLoading ? "Criando..." : "Criar Conta"}
              </Button>
              
              <button
                type="button"
                onClick={() => setShowSignup(false)}
                className="w-full text-sm text-[#4169E1] hover:underline"
              >
                Já tem conta? Fazer login
              </button>
            </form>
          )}
          
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              Modo Escuro
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LoginPopover;
