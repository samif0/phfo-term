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

const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
];

// ~3 frames at 60Hz; timed rather than counted so 120Hz phones don't run it twice as fast
const GENERATION_MS = 50;

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

        for (const [dx, dy] of DIRECTIONS) {
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

        // Size from the element: h-screen tracks the large viewport on phones, so the
        // browser toolbar collapsing during scroll doesn't restart the pattern
        const setup = () => {
            const pixelWidth = canvas.clientWidth || window.innerWidth;
            const pixelHeight = canvas.clientHeight || window.innerHeight;
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;

            // Calculate grid dimensions based on screen size
            const width = Math.floor(pixelWidth / CELL_SIZE);
            const height = Math.floor(pixelHeight / CELL_SIZE);
            dimensionsRef.current = { width, height };
            initGrid(width, height);
        };

        setup();

        let lastUpdate = 0;

        const animate = (now: number) => {
            // 1ms of slack absorbs frame timing jitter
            if (now - lastUpdate >= GENERATION_MS - 1) {
                lastUpdate = now;
                updateGrid(dimensionsRef.current.width, dimensionsRef.current.height);
                // The picture only changes once per generation
                draw(dimensionsRef.current.width, dimensionsRef.current.height);
            }
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        const handleResize = () => {
            const width = canvas.clientWidth || window.innerWidth;
            const height = canvas.clientHeight || window.innerHeight;
            if (width === canvas.width && height === canvas.height) return;
            setup();
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
            className="fixed top-0 left-0 w-screen h-screen pointer-events-none"
            style={{
                zIndex: 0,
                opacity: 0.5,
            }}
        />
    );
}
