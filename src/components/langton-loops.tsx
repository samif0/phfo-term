'use client';

import { useEffect, useRef } from 'react';

// Ultra-minimal self-replicating automaton
// States: 0=empty, 1=core, 2=arm
const COLORS = [
  'transparent',                    // 0: empty
  'rgba(100, 255, 100, 0.3)',      // 1: core (green)
  'rgba(100, 200, 255, 0.2)',      // 2: arm (blue)
];

const COLORS_LIGHT = [
  'transparent',                    // 0: empty
  'rgba(93, 142, 93, 0.3)',        // 1: core (green)
  'rgba(69, 137, 213, 0.2)',       // 2: arm (blue)
];

// Simple L-shaped replicator
const REPLICATOR = [
  [1, 2],
  [2, 0],
];

export default function LangtonLoops() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<number[][]>([]);
  const animationRef = useRef<number>();
  
  const CELL_SIZE = 4;
  const GRID_SIZE = 200;
  
  const initGrid = () => {
    const grid = Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(0)
    );
    
    const bottomMargin = GRID_SIZE * 0.1;
    const rightSideStart = GRID_SIZE * 0.2;
    const buttonSpacing = GRID_SIZE * 0.2;
    
    const positions = [
      { x: GRID_SIZE - rightSideStart - (buttonSpacing * 3), y: GRID_SIZE - bottomMargin },
      { x: GRID_SIZE - rightSideStart - (buttonSpacing * 2), y: GRID_SIZE - bottomMargin },
      { x: GRID_SIZE - rightSideStart - buttonSpacing, y: GRID_SIZE - bottomMargin },
      { x: GRID_SIZE - rightSideStart, y: GRID_SIZE - bottomMargin },
    ];
    
    positions.forEach(pos => {
      for (let y = 0; y < REPLICATOR.length; y++) {
        for (let x = 0; x < REPLICATOR[y].length; x++) {
          if (pos.y + y < GRID_SIZE && pos.x + x < GRID_SIZE) {
            grid[pos.y + y][pos.x + x] = REPLICATOR[y][x];
          }
        }
      }
    });
    
    gridRef.current = grid;
  };

  const hasPattern = (grid: number[][], x: number, y: number, pattern: number[][]) => {
    for (let py = 0; py < pattern.length; py++) {
      for (let px = 0; px < pattern[py].length; px++) {
        const gx = x + px;
        const gy = y + py;
        if (gx >= GRID_SIZE || gy >= GRID_SIZE) return false;
        if (grid[gy][gx] !== pattern[py][px]) return false;
      }
    }
    return true;
  };

  const placePattern = (grid: number[][], x: number, y: number, pattern: number[][]) => {
    for (let py = 0; py < pattern.length; py++) {
      for (let px = 0; px < pattern[py].length; px++) {
        const gx = x + px;
        const gy = y + py;
        if (gx < GRID_SIZE && gy < GRID_SIZE) {
          grid[gy][gx] = pattern[py][px];
        }
      }
    }
  };

  const applyRules = (grid: number[][], x: number, y: number): number => {
    const current = grid[y][x];
    
    if (current === 1) return 1;
    
    if (current === 2) {
      const neighbors = [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
      ];
      
      for (const { dx, dy } of neighbors) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          if (grid[ny][nx] === 1) {
            if (dx === 1 && dy === 0) {
              if (y > 0 && x + 1 < GRID_SIZE && 
                  grid[y-1][x] === 0 && grid[y-1][x+1] === 0 &&
                  grid[y][x+1] === 0) {
                return 2;
              }
            }
            if (dx === 0 && dy === 1) {
              if (x > 0 && y + 1 < GRID_SIZE &&
                  grid[y][x-1] === 0 && grid[y+1][x-1] === 0 &&
                  grid[y+1][x] === 0) {
                return 2;
              }
            }
          }
        }
      }
      return 2;
    }
    
    return 0;
  };

  const updateGrid = () => {
    const grid = gridRef.current;
    const newGrid = grid.map(row => [...row]);
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        newGrid[y][x] = applyRules(grid, x, y);
      }
    }
    
    const patternWidth = REPLICATOR[0].length;
    const patternHeight = REPLICATOR.length;
    const spawnDistance = patternWidth + 1;
    const clearanceRadius = 2;
    
    for (let y = 0; y < GRID_SIZE - patternHeight; y++) {
      for (let x = 0; x < GRID_SIZE - patternWidth; x++) {
        if (hasPattern(grid, x, y, REPLICATOR)) {
          if (x + spawnDistance + patternWidth < GRID_SIZE && y - 1 >= 0) {
            let canSpawn = true;
            for (let cy = y - clearanceRadius; cy <= y + clearanceRadius && canSpawn; cy++) {
              for (let cx = x + spawnDistance; cx <= x + spawnDistance + patternWidth && canSpawn; cx++) {
                if (cy >= 0 && cy < GRID_SIZE && cx >= 0 && cx < GRID_SIZE && grid[cy][cx] !== 0) {
                  canSpawn = false;
                }
              }
            }
            if (canSpawn) {
              placePattern(newGrid, x + spawnDistance, y - 1, REPLICATOR);
            }
          }
          if (y - spawnDistance - patternHeight >= 0 && x - 1 >= 0) {
            let canSpawn = true;
            for (let cy = y - spawnDistance - patternHeight; cy <= y - spawnDistance && canSpawn; cy++) {
              for (let cx = x - clearanceRadius; cx <= x + clearanceRadius && canSpawn; cx++) {
                if (cy >= 0 && cy < GRID_SIZE && cx >= 0 && cx < GRID_SIZE && grid[cy][cx] !== 0) {
                  canSpawn = false;
                }
              }
            }
            if (canSpawn) {
              placePattern(newGrid, x - 1, y - spawnDistance - patternHeight, REPLICATOR);
            }
          }
          if (x - spawnDistance >= 0 && y - spawnDistance >= 0) {
            let canSpawn = true;
            for (let cy = y - spawnDistance; cy <= y - spawnDistance + patternHeight && canSpawn; cy++) {
              for (let cx = x - spawnDistance; cx <= x - spawnDistance + patternWidth && canSpawn; cx++) {
                if (cy >= 0 && cy < GRID_SIZE && cx >= 0 && cx < GRID_SIZE && grid[cy][cx] !== 0) {
                  canSpawn = false;
                }
              }
            }
            if (canSpawn) {
              placePattern(newGrid, x - spawnDistance, y - spawnDistance, REPLICATOR);
            }
          }
        }
      }
    }
    
    gridRef.current = newGrid;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const grid = gridRef.current;
    const isLight = document.documentElement.classList.contains('light');
    const colors = isLight ? COLORS_LIGHT : COLORS;
    
    const leftBoundary = canvas.width / 3;
    const rightArea = canvas.width - leftBoundary;
    const viewWidth = Math.floor(rightArea / CELL_SIZE);
    const viewHeight = Math.floor(canvas.height / CELL_SIZE);
    
    const offsetX = GRID_SIZE - viewWidth;
    const offsetY = GRID_SIZE - viewHeight;
    
    for (let y = 0; y < viewHeight; y++) {
      for (let x = 0; x < viewWidth; x++) {
        const gridX = offsetX + x;
        const gridY = offsetY + y;
        if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
          const state = grid[gridY][gridX];
          if (state !== 0) {
            ctx.fillStyle = colors[state];
            ctx.fillRect(
              leftBoundary + x * CELL_SIZE,
              y * CELL_SIZE,
              CELL_SIZE,
              CELL_SIZE
            );
          }
        }
      }
    }
  };

  let frameCount = 0;
  const animate = () => {
    frameCount++;
    
    if (frameCount % 10 === 0) {
      updateGrid();
    }
    
    draw();
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    initGrid();
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 0,
        opacity: 0.5,
      }}
    />
  );
}