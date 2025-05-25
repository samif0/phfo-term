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
  const countNeighbors = (grid: number[][], x: number, y: number, state: number): number => {
    let count = 0;
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1], // von Neumann neighborhood
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < gridDimensions.width && ny >= 0 && ny < gridDimensions.height) {
        if (grid[ny][nx] === state) count++;
      }
    }

    return count;
  };

  // Check if position matches L-pattern corner
  const isLCorner = (grid: number[][], x: number, y: number): boolean => {
    // Check for L-shaped configuration in any rotation
    const patterns = [
      // Original L
      { checks: [[0, 0, 1], [1, 0, 1], [0, 1, 1]], corner: [0, 0] },
      // Rotated 90°
      { checks: [[0, 0, 1], [-1, 0, 1], [0, 1, 1]], corner: [0, 0] },
      // Rotated 180°
      { checks: [[0, 0, 1], [-1, 0, 1], [0, -1, 1]], corner: [0, 0] },
      // Rotated 270°
      { checks: [[0, 0, 1], [1, 0, 1], [0, -1, 1]], corner: [0, 0] },
    ];

    for (const pattern of patterns) {
      let matches = true;
      for (const [dx, dy, expected] of pattern.checks) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= gridDimensions.width || ny < 0 || ny >= gridDimensions.height) {
          matches = false;
          break;
        }
        if ((grid[ny][nx] === 1 ? 1 : 0) !== expected) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }

    return false;
  };

  // Update grid based on L-replicator rules
  const updateGrid = () => {
    const grid = gridRef.current;
    const newGrid: number[][] = [];

    // Copy grid
    for (let y = 0; y < gridDimensions.height; y++) {
      newGrid[y] = [...grid[y]];
    }

    // Apply rules
    for (let y = 0; y < gridDimensions.height; y++) {
      for (let x = 0; x < gridDimensions.width; x++) {
        const current = grid[y][x];
        const structureNeighbors = countNeighbors(grid, x, y, 1);
        const signalNeighbors = countNeighbors(grid, x, y, 2);

        // Rule 1: Empty cells become signals if they're at L-corners
        if (current === 0) {
          if (isLCorner(grid, x, y) && Math.random() < 0.01) {
            newGrid[y][x] = 2; // Create signal
          }
        }

        // Rule 2: Signals propagate and create new structures
        else if (current === 2) {
          newGrid[y][x] = 3; // Signal becomes new structure
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
        if (current === 0 && signalNeighbors > 0) {
          // Only grow if it would extend an L-shape
          if (structureNeighbors === 2) {
            newGrid[y][x] = 3; // Grow new structure
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

    const isLight = document.documentElement.classList.contains('light');
    const colors = isLight ? COLORS_LIGHT : COLORS;
    const grid = gridRef.current;

    // Draw grid covering entire screen
    for (let y = 0; y < gridDimensions.height; y++) {
      for (let x = 0; x < gridDimensions.width; x++) {
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

    // Draw grid lines for debugging (optional)
    if (false) { // Set to true to see grid
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.1)';
      ctx.lineWidth = 0.5;
      for (let y = 0; y <= gridDimensions.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(gridDimensions.width * CELL_SIZE, y * CELL_SIZE);
        ctx.stroke();
      }
      for (let x = 0; x <= gridDimensions.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, gridDimensions.height * CELL_SIZE);
        ctx.stroke();
      }
    }
  };

  let frameCount = 0;
  const FRAMES_PER_UPDATE = 30; // Slower updates for visibility

  const animate = () => {
    frameCount++;

    if (frameCount % FRAMES_PER_UPDATE === 0) {
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

    // Calculate grid dimensions based on screen size
    const width = Math.floor(window.innerWidth / CELL_SIZE);
    const height = Math.floor(window.innerHeight / CELL_SIZE);
    setGridDimensions({ width, height });
    initGrid(width, height);
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Recalculate grid dimensions
      const newWidth = Math.floor(window.innerWidth / CELL_SIZE);
      const newHeight = Math.floor(window.innerHeight / CELL_SIZE);
      setGridDimensions({ width: newWidth, height: newHeight });
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
