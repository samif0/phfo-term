'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTheme } from './theme-provider';

// States for minimal self-replicator
// 0: empty
// 1: active (replicating)
// 2-7: countdown states (deterministic timing)
const COLORS = [
    'transparent',                    // 0: empty
    'rgba(220, 220, 220, 0.30)',     // 1: active (slightly lighter for dark mode)
    'rgba(220, 220, 220, 0.25)',     // 2: countdown 6
    'rgba(220, 220, 220, 0.19)',     // 3: countdown 5
    'rgba(220, 220, 220, 0.11)',     // 4: countdown 4
    'rgba(220, 220, 220, 0.18)',     // 5: countdown 3
    'rgba(220, 220, 220, 0.07)',     // 6: countdown 2
    'rgba(220, 220, 220, 0.05)',     // 7: countdown 1
];

const COLORS_LIGHT = [
    'transparent',                    // 0: empty
    'rgba(180, 100, 50, 0.30)',      // 1: active (lighter brown-orange)
    'rgba(180, 100, 50, 0.25)',      // 2: countdown 6
    'rgba(180, 100, 50, 0.19)',      // 3: countdown 5
    'rgba(180, 100, 50, 0.11)',      // 4: countdown 4
    'rgba(180, 100, 50, 0.18)',      // 5: countdown 3
    'rgba(180, 100, 50, 0.07)',      // 6: countdown 2
    'rgba(180, 100, 50, 0.05)',      // 7: countdown 1
];

export default function Lreplicator() {
    const { theme } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gridRef = useRef<number[][]>([]);
    const animationRef = useRef<number | undefined>(undefined);
    const dimensionsRef = useRef({ width: 0, height: 0 });
    const themeRef = useRef(theme);

    const CELL_SIZE = 8; // Larger cells for less density

    // Initialize grid with a single seed
    const initGrid = useCallback((width: number, height: number) => {
        const grid: number[][] = [];
        for (let y = 0; y < height; y++) {
            grid[y] = new Array(width).fill(0);
        }

        // Place a single seed in the center
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        grid[centerY][centerX] = 1;

        gridRef.current = grid;
    }, []);

    // Count active neighbors
    const countActiveNeighbors = useCallback((grid: number[][], x: number, y: number, width: number, height: number): number => {
        let count = 0;
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (grid[ny][nx] === 1) count++;
            }
        }

        return count;
    }, []);

    // Update grid with deterministic self-replication rules
    const updateGrid = useCallback((width: number, height: number) => {
        const grid = gridRef.current;
        const newGrid: number[][] = [];

        // Copy grid
        for (let y = 0; y < height; y++) {
            newGrid[y] = [...grid[y]];
        }

        // Apply deterministic rules
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const current = grid[y][x];
                const activeNeighbors = countActiveNeighbors(grid, x, y, width, height);

                if (current === 0) {
                    // Empty cell: becomes active if exactly 1 active neighbor (growth rule)
                    if (activeNeighbors === 1) {
                        newGrid[y][x] = 2; // Start countdown
                    }
                } else if (current === 1) {
                    // Active cell: stays active if 1-2 neighbors, dies if isolated or crowded
                    if (activeNeighbors === 0 || activeNeighbors > 2) {
                        newGrid[y][x] = 7; // Start death countdown
                    }
                } else if (current >= 2 && current <= 7) {
                    // Countdown states: deterministic progression
                    if (current === 7) {
                        newGrid[y][x] = 0; // Death
                    } else if (current === 2) {
                        newGrid[y][x] = 1; // Birth (become active)
                    } else {
                        newGrid[y][x] = current + 1; // Continue countdown
                    }
                }
            }
        }

        gridRef.current = newGrid;
    }, [countActiveNeighbors]);

    const draw = useCallback((width: number, height: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const colors = themeRef.current === 'light' ? COLORS_LIGHT : COLORS;

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
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Calculate grid dimensions based on screen size
        const width = Math.floor(window.innerWidth / CELL_SIZE);
        const height = Math.floor(window.innerHeight / CELL_SIZE);
        dimensionsRef.current = { width, height };
        initGrid(width, height);

        let frameCount = 0;
        const FRAMES_PER_UPDATE = 3; // Slightly slower propagation

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
    }, [CELL_SIZE, draw, initGrid, updateGrid]);

    // Trigger redraw when theme changes
    useEffect(() => {
        themeRef.current = theme;
        if (dimensionsRef.current.width > 0 && dimensionsRef.current.height > 0) {
            draw(dimensionsRef.current.width, dimensionsRef.current.height);
        }
    }, [draw, theme]);

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
