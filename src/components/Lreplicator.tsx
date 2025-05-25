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

interface Replicator {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export default function LangtonLoops() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const replicatorsRef = useRef<Replicator[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const viewportRef = useRef({ x: 0, y: 0 });
  
  const CELL_SIZE = 4;
  const SPAWN_CHANCE = 0.02;
  
  const initReplicators = () => {
    // Start with a few replicators at random positions
    const initialCount = 3;
    const replicators: Replicator[] = [];
    
    for (let i = 0; i < initialCount; i++) {
      replicators.push({
        x: Math.random() * 200 - 100, // Random position between -100 and 100
        y: Math.random() * 200 - 100,
        dx: (Math.random() - 0.5) * 2, // Random direction between -1 and 1
        dy: (Math.random() - 0.5) * 2
      });
    }
    
    replicatorsRef.current = replicators;
  };

  const updateReplicators = () => {
    const replicators = replicatorsRef.current;
    const newReplicators: Replicator[] = [];
    
    for (const rep of replicators) {
      // Random walk: occasionally change direction
      if (Math.random() < 0.1) {
        rep.dx = (Math.random() - 0.5) * 2;
        rep.dy = (Math.random() - 0.5) * 2;
      }
      
      // Update position
      rep.x += rep.dx;
      rep.y += rep.dy;
      
      // Add some brownian motion
      rep.x += (Math.random() - 0.5) * 0.5;
      rep.y += (Math.random() - 0.5) * 0.5;
      
      newReplicators.push(rep);
      
      // Randomly spawn new replicators
      if (Math.random() < SPAWN_CHANCE) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 10 + Math.random() * 20;
        newReplicators.push({
          x: rep.x + Math.cos(angle) * distance,
          y: rep.y + Math.sin(angle) * distance,
          dx: (Math.random() - 0.5) * 2,
          dy: (Math.random() - 0.5) * 2
        });
      }
    }
    
    // Limit population to prevent performance issues
    if (newReplicators.length > 100) {
      replicatorsRef.current = newReplicators.slice(0, 100);
    } else {
      replicatorsRef.current = newReplicators;
    }
    
    // Update viewport to follow center of mass
    if (replicators.length > 0) {
      const centerX = replicators.reduce((sum, rep) => sum + rep.x, 0) / replicators.length;
      const centerY = replicators.reduce((sum, rep) => sum + rep.y, 0) / replicators.length;
      
      // Smooth camera movement
      viewportRef.current.x = viewportRef.current.x * 0.9 + centerX * 0.1;
      viewportRef.current.y = viewportRef.current.y * 0.9 + centerY * 0.1;
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const isLight = document.documentElement.classList.contains('light');
    const colors = isLight ? COLORS_LIGHT : COLORS;
    const replicators = replicatorsRef.current;
    
    // Calculate boundaries based on viewport divisions
    const viewportDivisions = 3;
    const leftBoundary = canvas.width / viewportDivisions;
    const rightArea = canvas.width - leftBoundary;
    
    // Center of the drawable area
    const centerX = leftBoundary + rightArea / 2;
    const centerY = canvas.height / 2;
    
    // Draw each replicator as an L-shape
    for (const rep of replicators) {
      // Transform replicator position to screen coordinates
      const screenX = centerX + (rep.x - viewportRef.current.x) * CELL_SIZE;
      const screenY = centerY + (rep.y - viewportRef.current.y) * CELL_SIZE;
      
      // Only draw if within viewport
      if (screenX > leftBoundary && screenX < canvas.width && 
          screenY > 0 && screenY < canvas.height) {
        
        // Draw L-shaped replicator
        for (let py = 0; py < REPLICATOR.length; py++) {
          for (let px = 0; px < REPLICATOR[py].length; px++) {
            if (REPLICATOR[py][px] !== 0) {
              ctx.fillStyle = colors[REPLICATOR[py][px]];
              ctx.fillRect(
                screenX + px * CELL_SIZE,
                screenY + py * CELL_SIZE,
                CELL_SIZE,
                CELL_SIZE
              );
            }
          }
        }
      }
    }
  };

  let frameCount = 0;
  const FRAMES_PER_UPDATE = 5; // Update more frequently for smoother motion
  
  const animate = () => {
    frameCount++;
    
    if (frameCount % FRAMES_PER_UPDATE === 0) {
      updateReplicators();
    }
    
    draw();
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    initReplicators();
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
        opacity: 0.5, // 50% transparency for subtle effect
      }}
    />
  );
}