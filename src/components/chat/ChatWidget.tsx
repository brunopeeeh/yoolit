import { useState } from "react";
import { LogIn, LogInIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col max-w-6xl mx-auto">
      {/* Messages */}
      <ChatMessages messages={messages} isTyping={isTyping} />

      {/* Login Alert (when not logged in) */}
      {!user && (
        <div className="border-t bg-background p-6">
          <div className="max-w-4xl mx-auto mb-4">
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800">
              <LogInIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-300">
                Por favor, faça login para enviar mensagens
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput 
        onSendMessage={handleSendMessage} 
        onClear={handleClearChat}
        disabled={!user}
      />
    </div>
  );
};

export default ChatWidget;