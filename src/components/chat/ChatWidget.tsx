import { useState, useEffect } from "react";
import { MessageSquare, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import StatusSelector from "./StatusSelector";
import ChatAuth from "./ChatAuth";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  onUserChange?: (user: any) => void;
}

const ChatWidget = ({ onUserChange }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      setUser(userData);
      onUserChange?.(userData);
    }
  }, [onUserChange]);

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    onUserChange?.(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
    setMessages([]);
    onUserChange?.(null);
  };

  const handleSendMessage = async (content: string) => {
    const userMessage = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate bot response (replace with actual N8N webhook call)
    setTimeout(() => {
      const botMessage = {
        id: (Date.now() + 1).toString(),
        content: "Thank you for your message! I'm processing your request.",
        sender: "bot",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  if (!isOpen) {
    return (
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        "fixed shadow-2xl transition-all duration-300",
        isFullscreen
          ? "inset-0 rounded-none"
          : "bottom-6 right-6 h-[600px] w-[400px] rounded-lg"
      )}
    >
      <div className="flex h-full flex-col">
        {!user ? (
          <ChatAuth onAuthSuccess={handleAuthSuccess} />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {user.name[0]}
                </div>
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <StatusSelector userId={user.id} currentStatus={user.status} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleLogout}
                  title="Logout"
                >
                  ⎋
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                >
                  ×
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ChatMessages messages={messages} isTyping={isTyping} />

            {/* Input */}
            <ChatInput onSendMessage={handleSendMessage} />
          </>
        )}
      </div>
    </Card>
  );
};

export default ChatWidget;
