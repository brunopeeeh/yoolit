import { useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onClear?: () => void;
}

const ChatInput = ({ onSendMessage, onClear }: ChatInputProps) => {
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
    <form onSubmit={handleSubmit} className="border-t bg-background p-6">
      <div className="flex gap-3 items-center max-w-4xl mx-auto">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="flex-1"
        />
        {onClear && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={onClear}
            className="h-10 w-10 rounded-full bg-red-50 border-red-200 hover:bg-red-100 text-red-600 dark:bg-red-950 dark:border-red-800 dark:hover:bg-red-900 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim()}
          className="h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
