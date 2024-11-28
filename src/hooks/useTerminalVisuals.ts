import { useState, useCallback } from 'react';

interface VisualEffect {
  id: string;
  type: 'typing' | 'loading';
  content?: string;
}

export const useTerminalVisuals = () => {
  const [activeEffects, setActiveEffects] = useState<VisualEffect[]>([]);

  const startTypingEffect = useCallback((id: string, content: string) => {
    setActiveEffects(prev => [...prev, { id, type: 'typing', content }]);
    return () => {
      setActiveEffects(prev => prev.filter(effect => effect.id !== id));
    };
  }, []);

  const startLoadingEffect = useCallback((id: string) => {
    setActiveEffects(prev => [...prev, { id, type: 'loading' }]);
    return () => {
      setActiveEffects(prev => prev.filter(effect => effect.id !== id));
    };
  }, []);

  return {
    activeEffects,
    startTypingEffect,
    startLoadingEffect
  };
};
