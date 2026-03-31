import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import CredentialsCopyButton from "./CredentialsCopyButton";
import { Sparkles, MessageCircle } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot" | "system";
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
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#83cef6]/20 to-[#0a639a]/10 flex items-center justify-center border border-[#83cef6]/20">
              <MessageCircle className="w-6 h-6 text-[#0a639a]/50" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground/60">Olá! Sou a Maya</p>
              <p className="text-xs text-muted-foreground">Como posso te ajudar hoje?</p>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
              message.sender === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.sender === "bot" && (
              <div className="flex-shrink-0 mt-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-[#83cef6]/30 to-[#0a639a]/20 border border-[#83cef6]/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0a639a]" />
              </div>
            )}

            {message.sender === "system" && (
              <div className="w-full flex justify-center">
                <div className="text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/50">
                  {message.content}
                </div>
              </div>
            )}

            {message.sender !== "system" && (
              <div
                className={cn(
                  "max-w-[82%] sm:max-w-[75%]",
                  message.sender === "bot"
                    ? "bg-muted/70 border border-border/40 rounded-2xl rounded-tl-sm px-3.5 sm:px-4 py-2.5"
                    : ""
                )}
                style={
                  message.sender === "user"
                    ? {
                        background: "linear-gradient(135deg, #115883 0%, #001723 100%)",
                        color: "white",
                        padding: "10px 16px",
                        borderRadius: "20px 20px 6px 20px",
                        wordWrap: "break-word",
                        boxShadow: "0 2px 12px rgba(10, 99, 154, 0.2)"
                      }
                    : undefined
                }
              >
              <div className="text-sm leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    code: ({ inline, children }: any) =>
                      inline
                        ? <code className={cn("px-1.5 py-0.5 rounded text-[0.8em] font-mono", message.sender === "user" ? "bg-white/20" : "bg-muted border border-border/50")}>{children}</code>
                        : <code className="block bg-muted border border-border/40 rounded-lg p-3 text-xs font-mono overflow-x-auto">{children}</code>,
                    pre: ({ children }) => <pre className="mb-2 last:mb-0">{children}</pre>,
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className={cn("underline underline-offset-2 break-all", message.sender === "user" ? "text-white/80 hover:text-white" : "text-[#0a639a] hover:text-[#0a639a]/80")}>{children}</a>
                    ),
                    blockquote: ({ children }) => <blockquote className="border-l-2 border-current/30 pl-3 italic opacity-80 mb-2">{children}</blockquote>,
                    h1: ({ children }) => <h1 className="text-base font-bold mb-1 mt-2 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-1.5 first:mt-0">{children}</h3>,
                    hr: () => <hr className="border-current/20 my-2" />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
                {message.sender === "bot" && (
                  <CredentialsCopyButton content={message.content} />
                )}
                <p className={cn(
                  "text-[10px] mt-1.5 select-none",
                  message.sender === "user" ? "text-white/50 text-right" : "text-muted-foreground"
                )}>
                  {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-2 sm:gap-3 items-end animate-in fade-in duration-200">
            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-[#83cef6]/30 to-[#0a639a]/20 border border-[#83cef6]/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0a639a]" />
            </div>
            <div className="bg-muted/70 border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0a639a]/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0a639a]/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0a639a]/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default ChatMessages;
