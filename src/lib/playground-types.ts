export interface PlaygroundProgram {
  id: string;
  name: string;
  description: string;
}

export interface PlaygroundControls {
  isRunning: boolean;
  isPaused: boolean;
  onRun: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export interface PlaygroundState {
  isRunning: boolean;
  isPaused: boolean;
}