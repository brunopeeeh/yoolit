import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { renderTextWithLinks } from "@/lib/linkUtils";
import CredentialsCopyButton from "./CredentialsCopyButton";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
}

const ChatMessages = ({ messages, isTyping }: ChatMessagesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <ScrollArea className="flex-1 p-2 sm:p-4" ref={scrollRef}>
      <div className="space-y-3 sm:space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-6 sm:py-8">
            <p className="text-sm sm:text-base">Olá! Como posso ajudá-lo hoje?</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.sender === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                message.sender === "user"
                  ? ""
                  : "bg-muted max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2"
              )}
              style={
                message.sender === "user"
                  ? {
                      background: "linear-gradient(135deg, #115883 0%, #001723 100%)",
                      color: "white",
                      padding: "10px 14px",
                      borderRadius: "18px 18px 4px 18px",
                      maxWidth: "85%",
                      wordWrap: "break-word",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                    }
                  : undefined
              }
            >
              <p className="text-sm whitespace-pre-wrap">
                {renderTextWithLinks(message.content)}
              </p>
              {message.sender === "bot" && (
                <CredentialsCopyButton content={message.content} />
              )}
              <p className="text-xs opacity-70 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 sm:px-4 py-2">
              <div className="flex gap-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce delay-100">•</span>
                <span className="animate-bounce delay-200">•</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default ChatMessages;
