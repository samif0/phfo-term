'use client';

import { useEffect, useRef, useState } from 'react';

// States for L-shaped replicator CA
// 0: empty
// 1: structure (body of L)
// 2: signal (growth signal)
// 3: new (newly created structure)
const COLORS = [
  'transparent',                    // 0: empty
  'rgba(100, 255, 100, 0.8)',      // 1: structure (green)
  'rgba(255, 100, 100, 0.8)',      // 2: signal (red)
  'rgba(100, 200, 255, 0.8)',      // 3: new (blue)
];

const COLORS_LIGHT = [
  'transparent',                    // 0: empty
  'rgba(93, 142, 93, 0.8)',        // 1: structure (green)
  'rgba(200, 80, 80, 0.8)',        // 2: signal (red)
  'rgba(69, 137, 213, 0.8)',       // 3: new (blue)
];

// L-shaped seed pattern
const L_PATTERN = [
  [1, 1],
  [1, 0],
];

export default function Lreplicator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<number[][]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  const CELL_SIZE = 4;
  const [gridDimensions, setGridDimensions] = useState({ width: 0, height: 0 });

  // Initialize grid with L-shaped patterns
  const initGrid = (width: number, height: number) => {
    const grid: number[][] = [];
    for (let y = 0; y < height; y++) {
      grid[y] = new Array(width).fill(0);
    }

    // Place initial L-shaped patterns
    const positions = [
      { x: width / 2 - 20, y: height / 2 },
      { x: width / 2 + 20, y: height / 2 },
      { x: width / 2, y: height / 2 - 20 },
    ];

    positions.forEach(pos => {
      for (let py = 0; py < L_PATTERN.length; py++) {
        for (let px = 0; px < L_PATTERN[py].length; px++) {
          const x = Math.floor(pos.x) + px;
          const y = Math.floor(pos.y) + py;
          if (x >= 0 && x < width && y >= 0 && y < height) {
            grid[y][x] = L_PATTERN[py][px];
          }
        }
      }
    });

    gridRef.current = grid;
  };

  // Count neighbors of a specific state
  const countNeighbors = (grid: number[][], x: number, y: number, state: number, width: number, height: number): number => {
    let count = 0;
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1], // von Neumann neighborhood
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (grid[ny][nx] === state) count++;
      }
    }

    return count;
  };

  // Check if position matches L-pattern corner
  const isLCorner = (grid: number[][], x: number, y: number, width: number, height: number): boolean => {
    // Check for L-shaped configuration in any rotation
    // Returns true if this empty cell is at the corner of an L-shape
    const patterns = [
      // Original L (corner at top-left)
      { checks: [[1, 0, 1], [0, 1, 1]], corner: [0, 0] },
      // Rotated 90° (corner at top-right)
      { checks: [[-1, 0, 1], [0, 1, 1]], corner: [0, 0] },
      // Rotated 180° (corner at bottom-right)
      { checks: [[-1, 0, 1], [0, -1, 1]], corner: [0, 0] },
      // Rotated 270° (corner at bottom-left)
      { checks: [[1, 0, 1], [0, -1, 1]], corner: [0, 0] },
    ];

    // Current position must be empty
    if (grid[y][x] !== 0) return false;

    for (const pattern of patterns) {
      let matches = true;
      for (const [dx, dy, expected] of pattern.checks) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          matches = false;
          break;
        }
        if ((grid[ny][nx] === 1 || grid[ny][nx] === 3) ? 1 : 0 !== expected) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }

    return false;
  };

  // Update grid based on L-replicator rules
  const updateGrid = (width: number, height: number) => {
    const grid = gridRef.current;
    const newGrid: number[][] = [];

    // Copy grid
    for (let y = 0; y < height; y++) {
      newGrid[y] = [...grid[y]];
    }

    // First pass: identify L-corners and create signals
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const current = grid[y][x];
        
        // Rule 1: Empty cells at L-corners become signals (increased probability)
        if (current === 0 && isLCorner(grid, x, y, width, height)) {
          if (Math.random() < 0.05) { // 5% chance instead of 1%
            newGrid[y][x] = 2; // Create signal
          }
        }
      }
    }

    // Second pass: apply other rules
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const current = grid[y][x];
        const structureNeighbors = countNeighbors(grid, x, y, 1, width, height);
        const signalNeighbors = countNeighbors(grid, x, y, 2, width, height);
        const newNeighbors = countNeighbors(grid, x, y, 3, width, height);

        // Rule 2: Signals decay after one step
        if (current === 2) {
          newGrid[y][x] = 0; // Signal disappears
        }

        // Rule 3: New structures mature into regular structures
        else if (current === 3) {
          newGrid[y][x] = 1; // New becomes structure
        }

        // Rule 4: Structures remain stable unless overcrowded
        else if (current === 1) {
          if (structureNeighbors > 3) {
            newGrid[y][x] = 0; // Die from overcrowding
          }
        }

        // Rule 5: Empty cells with signal neighbors become new structures
        // This creates the replication effect
        if (current === 0 && signalNeighbors > 0) {
          // Create new structure to form L-shapes
          if (structureNeighbors === 1 || structureNeighbors === 2) {
            newGrid[y][x] = 3; // Grow new structure
          }
        }
      }
    }

    gridRef.current = newGrid;
  };

  const draw = (width: number, height: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isLight = document.documentElement.classList.contains('light');
    const colors = isLight ? COLORS_LIGHT : COLORS;
    const grid = gridRef.current;

    // Draw grid covering entire screen
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const state = grid[y][x];
        if (state !== 0) {
          ctx.fillStyle = colors[state];
          ctx.fillRect(
            x * CELL_SIZE,
            y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
          );
        }
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Calculate grid dimensions based on screen size
    const width = Math.floor(window.innerWidth / CELL_SIZE);
    const height = Math.floor(window.innerHeight / CELL_SIZE);
    setGridDimensions({ width, height });
    dimensionsRef.current = { width, height };
    initGrid(width, height);

    let frameCount = 0;
    const FRAMES_PER_UPDATE = 60; // Slower updates for better visibility of replication

    const animate = () => {
      frameCount++;

      if (frameCount % FRAMES_PER_UPDATE === 0) {
        updateGrid(dimensionsRef.current.width, dimensionsRef.current.height);
      }

      draw(dimensionsRef.current.width, dimensionsRef.current.height);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Recalculate grid dimensions
      const newWidth = Math.floor(window.innerWidth / CELL_SIZE);
      const newHeight = Math.floor(window.innerHeight / CELL_SIZE);
      setGridDimensions({ width: newWidth, height: newHeight });
      dimensionsRef.current = { width: newWidth, height: newHeight };
      initGrid(newWidth, newHeight);
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
