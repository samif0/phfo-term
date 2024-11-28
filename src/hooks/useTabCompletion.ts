import { useCallback } from 'react';

export const useTabCompletion = (availableCommands: string[]) => {
  const getCompletions = useCallback((input: string) => {
    if (!input) return [];
    
    const matches = availableCommands.filter(cmd => 
      cmd.startsWith(input.toLowerCase())
    );

    return matches;
  }, [availableCommands]);

  const completeCommand = useCallback((input: string) => {
    const matches = getCompletions(input);

    if (matches.length === 1) {
      return matches[0];
    } else if (matches.length > 1) {
      // Return the longest common prefix
      const first = matches[0];
      const last = matches[matches.length - 1];
      let i = 0;
      while (i < first.length && i < last.length && first[i] === last[i]) {
        i++;
      }
      return first.substring(0, i);
    }
    return input;
  }, [getCompletions]);

  return {
    getCompletions,
    completeCommand
  };
};
