import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "maya_message_history";
const MAX_ENTRIES = 100;
const MAX_SUGGESTIONS = 6;

export function useMessageHistory() {
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // localStorage indisponível (modo privado, quota excedida, etc.)
    }
  }, [history]);

  const addMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.startsWith("/")) return;

    setHistory((prev) => {
      const deduped = prev.filter(
        (entry) => entry.toLowerCase() !== trimmed.toLowerCase()
      );
      return [trimmed, ...deduped].slice(0, MAX_ENTRIES);
    });
  }, []);

  const getSuggestions = useCallback(
    (query: string): string[] => {
      if (!query || query.startsWith("/")) return [];
      const q = query.toLowerCase();

      const startsWith = history.filter((entry) =>
        entry.toLowerCase().startsWith(q)
      );
      const contains = history.filter(
        (entry) =>
          !entry.toLowerCase().startsWith(q) &&
          entry.toLowerCase().includes(q)
      );

      return [...startsWith, ...contains].slice(0, MAX_SUGGESTIONS);
    },
    [history]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, addMessage, getSuggestions, clearHistory };
}
