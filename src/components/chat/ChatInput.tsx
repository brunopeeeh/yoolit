import { useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onClear?: () => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, onClear, disabled = false }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
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
      <div className="flex gap-2 sm:gap-3 items-center max-w-4xl mx-auto">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Faça login para enviar mensagens" : "Digite sua mensagem..."}
          className="flex-1 text-sm sm:text-base"
          disabled={disabled}
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
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-[#83cef6] hover:bg-[#6db6f2] text-[#0a639a] dark:bg-[#6db6f2] dark:hover:bg-[#5a9ddf] flex-shrink-0"
        >
          <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
