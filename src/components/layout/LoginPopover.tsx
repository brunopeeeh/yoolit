import { useState, ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LoginPopoverProps {
  user: any;
  onUserChange: (user: any) => void;
  children: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginPopover = ({ user, onUserChange, children, isOpen, onOpenChange }: LoginPopoverProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const foundUser = users.find((u: any) => u.email === email && u.password === password);

    if (foundUser) {
      localStorage.setItem("currentUser", JSON.stringify(foundUser));
      toast({ title: "Login realizado com sucesso!" });
      onUserChange(foundUser);
      onOpenChange(false);
      setShowSignup(false);
    } else {
      toast({ title: "Credenciais inválidas", variant: "destructive" });
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

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    
    if (users.find((u: any) => u.email === email)) {
      toast({ title: "Email já cadastrado", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      status: "available",
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(newUser));
    
    toast({ title: "Conta criada com sucesso!" });
    onUserChange(newUser);
    onOpenChange(false);
    setShowSignup(false);
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    onUserChange(null);
    onOpenChange(false);
    toast({ title: "Logout realizado" });
  };

  if (user) {
    return (
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                {user.name[0]}
              </div>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 mr-2" />
              ) : (
                <Moon className="h-4 w-4 mr-2" />
              )}
              Modo {theme === "dark" ? "Claro" : "Escuro"}
            </Button>
            
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              Sair
            </Button>
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
