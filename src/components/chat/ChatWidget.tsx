import { useState } from "react";
import { MessageSquare, Maximize2, Minimize2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import StatusSelector from "./StatusSelector";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  user: any;
}

const ChatWidget = ({ user }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

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

  if (!user) {
    return (
      <Card className="max-w-md mx-auto p-12 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-6 mx-auto">
          <LogIn className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Bem-vindo ao Maya Chat</h2>
        <p className="text-muted-foreground mb-6">
          Por favor, faça login para enviar mensagens
        </p>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <LogIn className="inline h-4 w-4 mr-1" />
            Por favor, faça login para enviar mensagens
          </p>
        </div>
      </Card>
    );
  }

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
      </div>
    </Card>
  );
};

export default ChatWidget;
