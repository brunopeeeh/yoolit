import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Trash2, History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useMessageHistory } from "@/hooks/useMessageHistory";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  onCommand?: (command: string, args?: string[]) => void;
}

const ChatInput = ({ onSendMessage, onClear, disabled = false, onCommand }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { addMessage, getSuggestions, clearHistory } = useMessageHistory();

  const suggestions = getSuggestions(input);
  const hasSuggestions = showSuggestions && suggestions.length > 0 && input.trim().length >= 2;

  const closeSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setActiveIndex(-1);
  }, []);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSuggestions();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeSuggestions]);

  const selectSuggestion = useCallback((text: string) => {
    setInput(text);
    closeSuggestions();
    textareaRef.current?.focus();
  }, [closeSuggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    closeSuggestions();

    if (trimmedInput.startsWith("/")) {
      const parts = trimmedInput.slice(1).split(" ");
      const command = parts[0];
      const args = parts.slice(1);
      if (onCommand) onCommand(command, args);
    } else {
      addMessage(trimmedInput);
      onSendMessage(trimmedInput);
    }

    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (hasSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
        return;
      }
      if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeSuggestions();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex >= 0 ? activeIndex : 0]);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setActiveIndex(-1);
    setShowSuggestions(true);
  };

  return (
    <div
      ref={containerRef}
      className="border-t border-border/50 bg-background/80 backdrop-blur-sm px-3 sm:px-6 pt-3 pb-4 sm:pt-4 sm:pb-5"
    >
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Dropdown de sugestões — aparece acima do input */}
          {hasSuggestions && (
            <div className="absolute bottom-full mb-2 left-0 right-0 z-50 rounded-2xl border border-border/60 bg-background shadow-lg shadow-black/5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                  <History className="w-3 h-3" />
                  Histórico
                </div>
                <button
                  type="button"
                  onClick={() => { clearHistory(); closeSuggestions(); }}
                  className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors flex items-center gap-1"
                >
                  <X className="w-2.5 h-2.5" />
                  Limpar
                </button>
              </div>

              <ul className="py-1" role="listbox">
                {suggestions.map((suggestion, i) => {
                  const matchStart = suggestion.toLowerCase().indexOf(input.toLowerCase());
                  const before = suggestion.slice(0, matchStart);
                  const match = suggestion.slice(matchStart, matchStart + input.length);
                  const after = suggestion.slice(matchStart + input.length);

                  return (
                    <li key={i} role="option" aria-selected={activeIndex === i}>
                      <button
                        ref={(el) => { suggestionRefs.current[i] = el; }}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectSuggestion(suggestion);
                        }}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2 group",
                          activeIndex === i
                            ? "bg-[#83cef6]/10 text-foreground"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                      >
                        <History className={cn(
                          "w-3 h-3 flex-shrink-0 transition-colors",
                          activeIndex === i ? "text-[#0a639a]/60" : "text-muted-foreground/30 group-hover:text-muted-foreground/50"
                        )} />
                        <span className="truncate">
                          {before}
                          <mark className="bg-[#83cef6]/30 text-foreground rounded-sm font-medium px-0.5">
                            {match}
                          </mark>
                          {after}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Campo de input */}
          <div className={cn(
            "flex gap-2 sm:gap-2.5 items-end rounded-2xl border bg-background transition-all duration-200 p-2 sm:p-2.5",
            isFocused
              ? "border-[#83cef6]/60 shadow-[0_0_0_3px_rgba(131,206,246,0.12)]"
              : "border-border/60 shadow-sm"
          )}>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => { setIsFocused(true); setShowSuggestions(true); }}
              onBlur={() => setIsFocused(false)}
              placeholder={disabled ? "Faça login para enviar mensagens" : "Mensagem para Maya..."}
              className="flex-1 text-sm sm:text-base min-h-[36px] max-h-[160px] resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/60 py-1 px-1"
              disabled={disabled}
              rows={1}
              autoComplete="off"
              spellCheck={false}
            />
            <div className="flex gap-1.5 flex-shrink-0 pb-0.5">
              {onClear && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={onClear}
                  disabled={disabled}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
                  title="Limpar conversa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || disabled}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-[#0a639a] hover:bg-[#0a639a]/90 text-white transition-all duration-200 disabled:opacity-30 disabled:scale-95 hover:scale-105 shadow-sm"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
          Enter para enviar · Shift+Enter para nova linha · ↑↓ para navegar sugestões
        </p>
      </form>
    </div>
  );
};

export default ChatInput;
