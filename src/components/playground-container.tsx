'use client';

import { useState, lazy, Suspense } from 'react';
import { PlaygroundProgram, PlaygroundState, PlaygroundControls } from '@/lib/playground-types';
import Button from '@/components/btn';

// Dynamically import playground components based on ID
const playgroundComponents: Record<string, React.LazyExoticComponent<React.ComponentType<PlaygroundControls>>> = {
  'game-of-life': lazy(() => import('@/components/playgrounds/game-of-life')),
  'l-systems': lazy(() => import('@/components/playgrounds/l-systems')),
  'mlp-visualizer': lazy(() => import('@/components/playgrounds/mlp-visualizer')),
  // Add more components here as needed
};

interface PlaygroundContainerProps {
  program: PlaygroundProgram;
}

export default function PlaygroundContainer({ program }: PlaygroundContainerProps) {
  const [state, setState] = useState<PlaygroundState>({
    isRunning: false,
    isPaused: false,
  });

  const handleRun = () => {
    setState({ isRunning: true, isPaused: false });
  };

  const handlePause = () => {
    setState(prev => ({ ...prev, isPaused: true }));
  };

  const handleResume = () => {
    setState(prev => ({ ...prev, isPaused: false }));
  };

  const handleStop = () => {
    setState({ isRunning: false, isPaused: false });
  };

  const Component = playgroundComponents[program.id];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold mb-2">{program.name}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{program.description}</p>
        
        <div className="flex gap-2">
          {!state.isRunning && (
            <Button
              text="Run"
              variant="outline"
              size="small"
              onClick={handleRun}
            />
          )}
          
          {state.isRunning && !state.isPaused && (
            <Button
              text="Pause"
              variant="outline"
              size="small"
              onClick={handlePause}
            />
          )}
          
          {state.isRunning && state.isPaused && (
            <Button
              text="Resume"
              variant="outline"
              size="small"
              onClick={handleResume}
            />
          )}
          
          {state.isRunning && (
            <Button
              text="Stop"
              variant="outline"
              size="small"
              onClick={handleStop}
            />
          )}
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-hidden">
        {Component ? (
          <Suspense fallback={<div className="text-gray-400">Loading {program.name}...</div>}>
            <Component
              isRunning={state.isRunning}
              isPaused={state.isPaused}
              onRun={handleRun}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
            />
          </Suspense>
        ) : (
          <div className="text-red-500">Component not found for {program.id}</div>
        )}
      </div>
    </div>
  );
}
