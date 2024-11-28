import { useState, useCallback } from 'react';

export const useCommandHistory = () => {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addToHistory = useCallback((command: string) => {
    setHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
  }, []);

  const navigateHistory = useCallback((direction: 'up' | 'down', currentInput: string) => {
    const numCommands = history.length;

    if (numCommands === 0) return currentInput;

    if (direction === 'up') {
      if (historyIndex === -1) {
        setHistoryIndex(numCommands - 1);
        return history[numCommands - 1];
      } else if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1);
        return history[historyIndex - 1];
      }
      return history[0];
    } else {
      if (historyIndex === -1) return currentInput;
      if (historyIndex < numCommands - 1) {
        setHistoryIndex(historyIndex + 1);
        return history[historyIndex + 1];
      } else {
        setHistoryIndex(-1);
        return '';
      }
    }
  }, [history, historyIndex]);

  return {
    addToHistory,
    navigateHistory
  };
};
