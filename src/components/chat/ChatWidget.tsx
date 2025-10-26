import { useState } from "react";
import { LogIn } from "lucide-react";
import { Card } from "@/components/ui/card";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

interface ChatWidgetProps {
  user: any;
}

const ChatWidget = ({ user }: ChatWidgetProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (content: string) => {
    const userMessage = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate bot response (replace with actual N8N webhook call)
    setTimeout(() => {
      const botMessage = {
        id: (Date.now() + 1).toString(),
        content: "Thank you for your message! I'm processing your request.",
        sender: "bot",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleClearChat = () => {
    setMessages([]);
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

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col max-w-6xl mx-auto">
      {/* Messages */}
      <ChatMessages messages={messages} isTyping={isTyping} />

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} onClear={handleClearChat} />
    </div>
  );
};

export default ChatWidget;