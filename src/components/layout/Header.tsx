import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginPopover from "./LoginPopover";
import { useState } from "react";

interface HeaderProps {
  user: any;
  onUserChange: (user: any) => void;
}

const Header = ({ user, onUserChange }: HeaderProps) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-[#4A9FBD] to-[#2E7D9B] text-white py-4 px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-bold">Maya</h1>
        
        <LoginPopover
          user={user}
          onUserChange={onUserChange}
          isOpen={isLoginOpen}
          onOpenChange={setIsLoginOpen}
        >
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/30"
          >
            <User className="h-5 w-5" />
          </Button>
        </LoginPopover>
      </div>
    </header>
  );
};

export default Header;
