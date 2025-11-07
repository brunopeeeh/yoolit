import { useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  onCommand?: (command: string, args?: string[]) => void;
}

const ChatInput = ({ onSendMessage, onClear, disabled = false, onCommand }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const trimmedInput = input.trim();
      
      // Verificar se é um comando interno
      if (trimmedInput.startsWith('/')) {
        const parts = trimmedInput.slice(1).split(' ');
        const command = parts[0];
        const args = parts.slice(1);
        
        if (onCommand) {
          onCommand(command, args);
        }
      } else {
        onSendMessage(trimmedInput);
      }
      
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t bg-background p-3 sm:p-6">
      <div className="flex gap-2 sm:gap-3 items-end max-w-4xl mx-auto">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Faça login para enviar mensagens" : "Digite sua mensagem..."}
          className="flex-1 text-sm sm:text-base min-h-[40px] max-h-[200px] resize-none"
          disabled={disabled}
          rows={1}
        />
        {onClear && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={onClear}
            disabled={disabled}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-red-50 border-red-200 hover:bg-red-100 text-red-600 dark:bg-red-950 dark:border-red-800 dark:hover:bg-red-900 dark:text-red-400 flex-shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        )}
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || disabled}
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex-shrink-0 bg-[#83cef6] hover:bg-[#8dd1f6] text-[#0a639a]"
        >
          <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
