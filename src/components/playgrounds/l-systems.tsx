'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { PlaygroundControls } from '@/lib/playground-types';
import { useTheme } from '@/components/theme-provider';

interface LSystemRule {
  from: string;
  to: string;
}

interface LSystemConfig {
  name: string;
  axiom: string;
  rules: LSystemRule[];
  angle: number;
  description: string;
}

const L_SYSTEMS: Record<string, LSystemConfig> = {
  'sierpinski': {
    name: 'Sierpinski Triangle',
    axiom: 'F-G-G',
    rules: [
      { from: 'F', to: 'F-G+F+G-F' },
      { from: 'G', to: 'GG' }
    ],
    angle: 120,
    description: 'Classic fractal triangle'
  },
  'dragon-curve': {
    name: 'Dragon Curve',
    axiom: 'FX',
    rules: [
      { from: 'X', to: 'X+YF+' },
      { from: 'Y', to: '-FX-Y' }
    ],
    angle: 90,
    description: 'Self-similar fractal curve'
  },
  'barnsley-fern': {
    name: 'Barnsley Fern',
    axiom: 'X',
    rules: [
      { from: 'X', to: 'F+[[X]-X]-F[-FX]+X' },
      { from: 'F', to: 'FF' }
    ],
    angle: 25,
    description: 'Realistic fern pattern'
  },
  'plant': {
    name: 'Plant',
    axiom: 'X',
    rules: [
      { from: 'X', to: 'F-[[X]+X]+F[+FX]-X' },
      { from: 'F', to: 'FF' }
    ],
    angle: 25,
    description: 'Branching plant structure'
  },
  'tree': {
    name: 'Binary Tree',
    axiom: 'F',
    rules: [
      { from: 'F', to: 'F[+F]F[-F]F' }
    ],
    angle: 30,
    description: 'Simple binary tree'
  },
  'koch-snowflake': {
    name: 'Koch Snowflake',
    axiom: 'F++F++F',
    rules: [
      { from: 'F', to: 'F-F++F-F' }
    ],
    angle: 60,
    description: 'Famous fractal snowflake'
  }
};

export default function LSystems({ isRunning, isPaused }: PlaygroundControls) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);
  const currentStepRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedSystem, setSelectedSystem] = useState<string>('barnsley-fern');
  const [maxIterations] = useState<number>(6);
  const { theme } = useTheme();

  // Keep ref in sync with prop
  isPausedRef.current = isPaused;

  // Theme-based colors
  const colors = {
    background: theme === 'dark' ? '#0A0A0A' : '#F4F1ED',
    line: theme === 'dark' ? '#10B981' : '#059669',
    branch: theme === 'dark' ? '#8B5CF6' : '#7C3AED',
  };

  // Generate L-System string for given iterations
  const generateLSystem = useCallback((config: LSystemConfig, iterations: number): string => {
    let result = config.axiom;
    
    for (let i = 0; i < iterations; i++) {
      let newResult = '';
      for (const char of result) {
        const rule = config.rules.find(r => r.from === char);
        newResult += rule ? rule.to : char;
      }
      result = newResult;
    }
    
    return result;
  }, []);

  // Draw L-System using turtle graphics
  const drawLSystem = useCallback((ctx: CanvasRenderingContext2D, lSystemString: string, config: LSystemConfig, currentIteration: number) => {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stack for saving turtle state (position and angle)
    const stack: Array<{ x: number; y: number; angle: number; generation: number }> = [];
    
    // Turtle state
    let x = canvas.width / 2;
    let y = canvas.height * 0.9; // Start near bottom for plants
    let angle = -90; // Start pointing up
    let generation = 0;

    // Adjust starting position and angle for different systems
    if (config.name === 'Sierpinski Triangle' || config.name === 'Koch Snowflake') {
      x = canvas.width * 0.2;
      y = canvas.height * 0.7;
      angle = 0;
    } else if (config.name === 'Dragon Curve') {
      x = canvas.width * 0.3;
      y = canvas.height * 0.5;
      angle = 0;
    }

    // Calculate step size based on canvas size and iterations
    const baseStepSize = Math.min(canvas.width, canvas.height) / 8;
    const stepSize = baseStepSize / Math.pow(1.5, Math.max(0, currentIteration));

    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (const command of lSystemString) {
      switch (command) {
        case 'F': // Draw forward
          const newX = x + Math.cos(angle * Math.PI / 180) * stepSize;
          const newY = y + Math.sin(angle * Math.PI / 180) * stepSize;
          
          // Color variation based on generation depth
          const hue = generation * 30;
          ctx.strokeStyle = `hsl(${hue + 120}, 70%, ${theme === 'dark' ? '60%' : '40%'})`;
          
          ctx.moveTo(x, y);
          ctx.lineTo(newX, newY);
          ctx.stroke();
          
          x = newX;
          y = newY;
          break;
          
        case 'G': // Move forward without drawing (for some systems)
          x += Math.cos(angle * Math.PI / 180) * stepSize;
          y += Math.sin(angle * Math.PI / 180) * stepSize;
          break;
          
        case '+': // Turn right
          angle += config.angle;
          break;
          
        case '-': // Turn left
          angle -= config.angle;
          break;
          
        case '[': // Save current state
          stack.push({ x, y, angle, generation });
          generation++;
          break;
          
        case ']': // Restore saved state
          const state = stack.pop();
          if (state) {
            x = state.x;
            y = state.y;
            angle = state.angle;
            generation = state.generation;
          }
          break;
          
        case 'X':
        case 'Y':
          // These are usually non-drawing symbols used in rules
          break;
      }
    }
  }, [colors, theme]);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update every 800ms for slower, more visible growth
    if (!isPausedRef.current && timestamp - lastUpdateRef.current > 800) {
      currentStepRef.current = (currentStepRef.current + 1) % (maxIterations + 1);
      setCurrentStep(currentStepRef.current);
      lastUpdateRef.current = timestamp;
    }

    // Always redraw
    const config = L_SYSTEMS[selectedSystem];
    const lSystemString = generateLSystem(config, currentStepRef.current);
    drawLSystem(ctx, lSystemString, config, currentStepRef.current);

    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isRunning, selectedSystem, maxIterations, generateLSystem, drawLSystem]);

  // Resize canvas when simulation state changes
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Redraw current state
    if (canvas.width > 0 && canvas.height > 0) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const config = L_SYSTEMS[selectedSystem];
        const lSystemString = generateLSystem(config, currentStepRef.current);
        drawLSystem(ctx, lSystemString, config, currentStepRef.current);
      }
    }
  }, [selectedSystem, generateLSystem, drawLSystem]);

  // Initialize canvas
  useEffect(() => {
    resizeCanvas();
  }, [resizeCanvas]);

  // Resize when simulation state changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      resizeCanvas();
    }, 10);
    return () => clearTimeout(timeoutId);
  }, [isRunning, resizeCanvas]);

  // Handle animation
  useEffect(() => {
    if (isRunning && animationRef.current === undefined) {
      currentStepRef.current = 0;
      setCurrentStep(0);
      lastUpdateRef.current = 0; // Reset timing
      animationRef.current = requestAnimationFrame(animate);
    } else if (!isRunning && animationRef.current !== undefined) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
      currentStepRef.current = 0;
      setCurrentStep(0);
    }

    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning]);

  // Redraw when theme or system changes
  useEffect(() => {
    resizeCanvas();
  }, [theme, selectedSystem, resizeCanvas]);

  const applySystem = useCallback((systemKey: string) => {
    if (isRunning) return;
    setSelectedSystem(systemKey);
    currentStepRef.current = 0;
    setCurrentStep(0);
  }, [isRunning]);

  return (
    <div className="w-full h-full relative">
      {/* System selection buttons */}
      {!isRunning && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-inherit p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {Object.entries(L_SYSTEMS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => applySystem(key)}
                  className={`px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    selectedSystem === key ? 'bg-gray-100 dark:bg-gray-800' : ''
                  }`}
                  title={config.description}
                >
                  {config.name}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Selected: {L_SYSTEMS[selectedSystem].description}
            </div>
          </div>
        </div>
      )}

      {/* Canvas container */}
      <div 
        className="absolute inset-0 flex flex-col"
        style={{ 
          paddingTop: !isRunning ? '100px' : '0px',
          transition: 'padding-top 0.1s ease'
        }}
      >
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="border border-gray-200 dark:border-gray-700 w-full h-full"
          />
          <div className="absolute bottom-4 left-4 text-xs text-gray-500 dark:text-gray-400">
            {!isRunning ? 'Select an L-System above' : `Iteration: ${currentStep}/${maxIterations}`}
          </div>
        </div>
      </div>
    </div>
  );
}