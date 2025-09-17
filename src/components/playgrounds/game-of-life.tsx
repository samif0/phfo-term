'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { PlaygroundControls } from '@/lib/playground-types';
import { useTheme } from '@/components/theme-provider';

const CELL_SIZE = 8;

export default function GameOfLife({ isRunning, isPaused }: PlaygroundControls) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<boolean[][]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);
  const generationRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const [generation, setGeneration] = useState<number>(0);
  const { theme } = useTheme();

  // Keep ref in sync with prop
  isPausedRef.current = isPaused;
  
  // Theme-based colors
  const colors = useMemo(() => ({
    grid: theme === 'dark' ? '#374151' : '#E5E7EB',
    alive: theme === 'dark' ? '#10B981' : '#059669',
    dead: theme === 'dark' ? '#0A0A0A' : '#F4F1ED',
  }), [theme]);

  const initializeGrid = useCallback((width: number, height: number, pattern: 'random' | 'empty' | 'glider' | 'blinker' | 'toad' | 'beacon' | 'pulsar' | 'pentadecathlon' | 'gosper-gun' | 'lightweight-spaceship' | 'middleweight-spaceship' | 'heavyweight-spaceship' | 'r-pentomino' | 'b-heptomino' = 'empty') => {
    const cols = Math.floor(width / CELL_SIZE);
    const rows = Math.floor(height / CELL_SIZE);
    const grid: boolean[][] = [];
    
    for (let i = 0; i < rows; i++) {
      grid[i] = [];
      for (let j = 0; j < cols; j++) {
        grid[i][j] = false;
      }
    }
    
    const centerRow = Math.floor(rows / 2);
    const centerCol = Math.floor(cols / 2);
    
    if (pattern === 'random') {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          grid[i][j] = Math.random() > 0.7;
        }
      }
    } else if (pattern === 'glider') {
      // Glider - moves diagonally
      if (centerRow > 1 && centerCol > 1) {
        grid[centerRow - 1][centerCol] = true;
        grid[centerRow][centerCol + 1] = true;
        grid[centerRow + 1][centerCol - 1] = true;
        grid[centerRow + 1][centerCol] = true;
        grid[centerRow + 1][centerCol + 1] = true;
      }
    } else if (pattern === 'blinker') {
      // Blinker - period 2 oscillator
      if (centerRow >= 1 && centerCol >= 1) {
        grid[centerRow][centerCol - 1] = true;
        grid[centerRow][centerCol] = true;
        grid[centerRow][centerCol + 1] = true;
      }
    } else if (pattern === 'toad') {
      // Toad - period 2 oscillator
      if (centerRow >= 1 && centerCol >= 2) {
        grid[centerRow][centerCol] = true;
        grid[centerRow][centerCol + 1] = true;
        grid[centerRow][centerCol + 2] = true;
        grid[centerRow + 1][centerCol - 1] = true;
        grid[centerRow + 1][centerCol] = true;
        grid[centerRow + 1][centerCol + 1] = true;
      }
    } else if (pattern === 'beacon') {
      // Beacon - period 2 oscillator
      if (centerRow >= 2 && centerCol >= 2) {
        grid[centerRow][centerCol] = true;
        grid[centerRow][centerCol + 1] = true;
        grid[centerRow + 1][centerCol] = true;
        grid[centerRow + 2][centerCol + 3] = true;
        grid[centerRow + 3][centerCol + 2] = true;
        grid[centerRow + 3][centerCol + 3] = true;
      }
    } else if (pattern === 'pulsar') {
      // Pulsar - period 3 oscillator
      const coords = [
        [-6,-4],[-6,-3],[-6,-2],[-6,2],[-6,3],[-6,4],
        [-4,-6],[-4,-1],[-4,1],[-4,6],
        [-3,-6],[-3,-1],[-3,1],[-3,6],
        [-2,-6],[-2,-1],[-2,1],[-2,6],
        [-1,-4],[-1,-3],[-1,-2],[-1,2],[-1,3],[-1,4],
        [1,-4],[1,-3],[1,-2],[1,2],[1,3],[1,4],
        [2,-6],[2,-1],[2,1],[2,6],
        [3,-6],[3,-1],[3,1],[3,6],
        [4,-6],[4,-1],[4,1],[4,6],
        [6,-4],[6,-3],[6,-2],[6,2],[6,3],[6,4]
      ];
      coords.forEach(([dr, dc]) => {
        const r = centerRow + dr;
        const c = centerCol + dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          grid[r][c] = true;
        }
      });
    } else if (pattern === 'pentadecathlon') {
      // Pentadecathlon - period 15 oscillator
      if (centerRow >= 5 && centerCol >= 1) {
        const coords = [
          [-4,0],[-3,-1],[-3,1],[-2,0],[-1,0],[0,0],[1,0],[2,0],[3,-1],[3,1],[4,0]
        ];
        coords.forEach(([dr, dc]) => {
          const r = centerRow + dr;
          const c = centerCol + dc;
          if (r >= 0 && r < rows && c >= 0 && c < cols) {
            grid[r][c] = true;
          }
        });
      }
    } else if (pattern === 'gosper-gun') {
      // Gosper Glider Gun - creates gliders
      const coords = [
        [0,24],[1,22],[1,24],[2,12],[2,13],[2,20],[2,21],[2,34],[2,35],
        [3,11],[3,15],[3,20],[3,21],[3,34],[3,35],[4,0],[4,1],[4,10],
        [4,16],[4,20],[4,21],[5,0],[5,1],[5,10],[5,14],[5,16],[5,17],
        [5,22],[5,24],[6,10],[6,16],[6,24],[7,11],[7,15],[8,12],[8,13]
      ];
      coords.forEach(([dr, dc]) => {
        const r = centerRow - 15 + dr;
        const c = centerCol - 20 + dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          grid[r][c] = true;
        }
      });
    } else if (pattern === 'lightweight-spaceship') {
      // LWSS - moves horizontally
      if (centerRow >= 2 && centerCol >= 2) {
        grid[centerRow][centerCol + 1] = true;
        grid[centerRow][centerCol + 4] = true;
        grid[centerRow + 1][centerCol] = true;
        grid[centerRow + 2][centerCol] = true;
        grid[centerRow + 2][centerCol + 4] = true;
        grid[centerRow + 3][centerCol] = true;
        grid[centerRow + 3][centerCol + 1] = true;
        grid[centerRow + 3][centerCol + 2] = true;
        grid[centerRow + 3][centerCol + 3] = true;
      }
    } else if (pattern === 'middleweight-spaceship') {
      // MWSS - moves horizontally
      if (centerRow >= 2 && centerCol >= 3) {
        grid[centerRow][centerCol + 2] = true;
        grid[centerRow + 1][centerCol] = true;
        grid[centerRow + 1][centerCol + 5] = true;
        grid[centerRow + 2][centerCol + 6] = true;
        grid[centerRow + 3][centerCol] = true;
        grid[centerRow + 3][centerCol + 6] = true;
        grid[centerRow + 4][centerCol + 1] = true;
        grid[centerRow + 4][centerCol + 2] = true;
        grid[centerRow + 4][centerCol + 3] = true;
        grid[centerRow + 4][centerCol + 4] = true;
        grid[centerRow + 4][centerCol + 5] = true;
        grid[centerRow + 4][centerCol + 6] = true;
      }
    } else if (pattern === 'heavyweight-spaceship') {
      // HWSS - moves horizontally
      if (centerRow >= 2 && centerCol >= 3) {
        grid[centerRow][centerCol + 2] = true;
        grid[centerRow][centerCol + 3] = true;
        grid[centerRow + 1][centerCol] = true;
        grid[centerRow + 1][centerCol + 6] = true;
        grid[centerRow + 2][centerCol + 7] = true;
        grid[centerRow + 3][centerCol] = true;
        grid[centerRow + 3][centerCol + 7] = true;
        grid[centerRow + 4][centerCol + 1] = true;
        grid[centerRow + 4][centerCol + 2] = true;
        grid[centerRow + 4][centerCol + 3] = true;
        grid[centerRow + 4][centerCol + 4] = true;
        grid[centerRow + 4][centerCol + 5] = true;
        grid[centerRow + 4][centerCol + 6] = true;
        grid[centerRow + 4][centerCol + 7] = true;
      }
    } else if (pattern === 'r-pentomino') {
      // R-pentomino - famous for evolving for 1103 generations
      if (centerRow >= 1 && centerCol >= 1) {
        grid[centerRow][centerCol + 1] = true;
        grid[centerRow][centerCol + 2] = true;
        grid[centerRow + 1][centerCol] = true;
        grid[centerRow + 1][centerCol + 1] = true;
        grid[centerRow + 2][centerCol + 1] = true;
      }
    } else if (pattern === 'b-heptomino') {
      // B-heptomino - evolves for thousands of generations
      if (centerRow >= 2 && centerCol >= 2) {
        grid[centerRow][centerCol] = true;
        grid[centerRow][centerCol + 1] = true;
        grid[centerRow + 1][centerCol] = true;
        grid[centerRow + 1][centerCol + 2] = true;
        grid[centerRow + 2][centerCol] = true;
        grid[centerRow + 2][centerCol + 1] = true;
        grid[centerRow + 2][centerCol + 2] = true;
      }
    }
    
    return grid;
  }, []);

  const countNeighbors = useCallback((grid: boolean[][], row: number, col: number) => {
    const rows = grid.length;
    const cols = grid[0].length;
    let count = 0;
    
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        
        const newRow = row + i;
        const newCol = col + j;
        
        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
          if (grid[newRow][newCol]) count++;
        }
      }
    }
    
    return count;
  }, []);

  const updateGrid = useCallback((grid: boolean[][]) => {
    const rows = grid.length;
    const cols = grid[0].length;
    const newGrid: boolean[][] = [];
    
    for (let i = 0; i < rows; i++) {
      newGrid[i] = [];
      for (let j = 0; j < cols; j++) {
        const neighbors = countNeighbors(grid, i, j);
        const isAlive = grid[i][j];
        
        if (isAlive && (neighbors === 2 || neighbors === 3)) {
          newGrid[i][j] = true;
        } else if (!isAlive && neighbors === 3) {
          newGrid[i][j] = true;
        } else {
          newGrid[i][j] = false;
        }
      }
    }
    
    return newGrid;
  }, [countNeighbors]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, grid: boolean[][]) => {
    const rows = grid.length;
    const cols = grid[0].length;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    ctx.fillStyle = colors.dead;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        ctx.fillStyle = grid[i][j] ? colors.alive : colors.dead;
        ctx.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
      }
    }
    
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= rows; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(cols * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }
    
    for (let j = 0; j <= cols; j++) {
      ctx.beginPath();
      ctx.moveTo(j * CELL_SIZE, 0);
      ctx.lineTo(j * CELL_SIZE, rows * CELL_SIZE);
      ctx.stroke();
    }
  }, [colors]);

  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Only update if not paused
    if (!isPausedRef.current && timestamp - lastUpdateRef.current > 100) {
      gridRef.current = updateGrid(gridRef.current);
      generationRef.current++;
      setGeneration(generationRef.current);
      lastUpdateRef.current = timestamp;
    }
    
    drawGrid(ctx, gridRef.current);
    
    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isRunning, updateGrid, drawGrid]);

  // Resize canvas when simulation state changes
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const container = canvas.parentElement;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Preserve existing grid or initialize if empty
    if (gridRef.current.length === 0) {
      gridRef.current = initializeGrid(canvas.width, canvas.height, 'empty');
      generationRef.current = 0;
      setGeneration(0);
    } else {
      // Resize existing grid to new dimensions
      const newCols = Math.floor(rect.width / CELL_SIZE);
      const newRows = Math.floor(rect.height / CELL_SIZE);
      const oldRows = gridRef.current.length;
      const oldCols = gridRef.current[0]?.length || 0;
      
      // Create new grid with new dimensions
      const newGrid: boolean[][] = [];
      for (let i = 0; i < newRows; i++) {
        newGrid[i] = [];
        for (let j = 0; j < newCols; j++) {
          // Copy existing cells or set to false for new areas
          // When shrinking, we keep the top-left portion
          // When expanding, we add new cells at bottom and right
          if (i < oldRows && j < oldCols) {
            newGrid[i][j] = gridRef.current[i][j];
          } else {
            newGrid[i][j] = false;
          }
        }
      }
      gridRef.current = newGrid;
    }
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawGrid(ctx, gridRef.current);
    }
  }, [initializeGrid, drawGrid]);

  // Initialize canvas and grid
  useEffect(() => {
    resizeCanvas();
  }, [resizeCanvas]);

  // Resize when simulation state changes
  useEffect(() => {
    // Small delay to let DOM update after button visibility change
    const timeoutId = setTimeout(() => {
      resizeCanvas();
    }, 10);
    
    return () => clearTimeout(timeoutId);
  }, [isRunning, resizeCanvas]);
  
  // Redraw when theme changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx && gridRef.current.length > 0) {
      drawGrid(ctx, gridRef.current);
    }
  }, [theme, drawGrid]);

  // Handle animation
  useEffect(() => {
    if (isRunning && animationRef.current === undefined) {
      // Reset generation when starting but don't reset the grid
      generationRef.current = 0;
      setGeneration(0);
      animationRef.current = requestAnimationFrame(animate);
    } else if (!isRunning && animationRef.current !== undefined) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
      // Reset generation when stopped
      generationRef.current = 0;
      setGeneration(0);
    }
    
    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, isRunning]);

  // Handle canvas click to toggle cells
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isRunning) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    
    if (row >= 0 && row < gridRef.current.length && col >= 0 && col < gridRef.current[0].length) {
      gridRef.current[row][col] = !gridRef.current[row][col];
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawGrid(ctx, gridRef.current);
      }
    }
  }, [isRunning, drawGrid]);

  const applyPattern = useCallback((pattern: 'random' | 'empty' | 'glider' | 'blinker' | 'toad' | 'beacon' | 'pulsar' | 'pentadecathlon' | 'gosper-gun' | 'lightweight-spaceship' | 'middleweight-spaceship' | 'heavyweight-spaceship' | 'r-pentomino' | 'b-heptomino') => {
    if (isRunning) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    gridRef.current = initializeGrid(canvas.width, canvas.height, pattern);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawGrid(ctx, gridRef.current);
    }
  }, [isRunning, initializeGrid, drawGrid]);

  return (
    <div className="w-full h-full relative">
      {/* Fixed button overlay */}
      {!isRunning && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-inherit p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col gap-2">
            {/* First row - Classic patterns */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyPattern('empty')}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Clear
              </button>
              <button
                onClick={() => applyPattern('random')}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Random
              </button>
              <button
                onClick={() => applyPattern('glider')}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Glider
              </button>
              <button
                onClick={() => applyPattern('blinker')}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Blinker
              </button>
              <button
                onClick={() => applyPattern('toad')}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Toad
              </button>
              <button
                onClick={() => applyPattern('beacon')}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Beacon
              </button>
              <button
                onClick={() => applyPattern('pulsar')}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Pulsar
              </button>
              <button
                onClick={() => applyPattern('pentadecathlon')}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Pentadecathlon
              </button>
              <button
                onClick={() => applyPattern('gosper-gun')}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Gosper Gun
              </button>
              <button
                onClick={() => applyPattern('lightweight-spaceship')}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                LWSS
              </button>
              <button
                onClick={() => applyPattern('middleweight-spaceship')}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                MWSS
              </button>
              <button
                onClick={() => applyPattern('heavyweight-spaceship')}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                HWSS
              </button>
            </div>
            {/* Second row - Long-evolving patterns */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyPattern('r-pentomino')}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                R-pentomino
              </button>
              <button
                onClick={() => applyPattern('b-heptomino')}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                B-heptomino
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Canvas container with dynamic top margin */}
      <div 
        className="absolute inset-0 flex flex-col"
        style={{ 
          paddingTop: !isRunning ? '132px' : '0px',
          transition: 'padding-top 0.1s ease'
        }}
      >
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="border border-gray-200 dark:border-gray-700 cursor-pointer w-full h-full"
            onClick={handleCanvasClick}
          />
          <div className="absolute bottom-4 left-4 text-xs text-gray-500 dark:text-gray-400">
            {!isRunning ? 'Click cells to toggle them' : `Generation: ${generation}`}
          </div>
        </div>
      </div>
    </div>
  );
}
