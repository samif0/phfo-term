import { PlaygroundProgram } from './playground-types';

// Registry of all playground programs
export const playgroundPrograms: Record<string, PlaygroundProgram> = {
  'game-of-life': {
    id: 'game-of-life',
    name: 'Game of Life',
    description: 'Conway\'s Game of Life - A cellular automaton simulation',
  },
  'l-systems': {
    id: 'l-systems',
    name: 'L-Systems',
    description: 'Lindenmayer Systems - Algorithmic generation of organic patterns',
  },
  'mlp-visualizer': {
    id: 'mlp-visualizer',
    name: 'MLP Playground',
    description: 'Train a configurable multi-layer perceptron on clustered 2D points',
  },
  'transformer-attention': {
    id: 'transformer-attention',
    name: 'Transformer Attention',
    description: 'Load a real Hugging Face transformer and inspect its self-attention weights',
  },
  // Add more playground programs here in the future
  // 'langtons-ant': {
  //   id: 'langtons-ant',
  //   name: 'Langton\'s Ant',
  //   description: 'A two-dimensional Turing machine',
  // },
};

export function getPlaygroundProgram(id: string): PlaygroundProgram | undefined {
  return playgroundPrograms[id];
}

export function getAllPlaygroundPrograms(): PlaygroundProgram[] {
  return Object.values(playgroundPrograms);
}
