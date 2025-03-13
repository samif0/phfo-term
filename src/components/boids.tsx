'use client';

import { useEffect, useState, useRef } from 'react';

function isNeighbor(boid: { x: number; y: number; dx: number; dy: number, s: number;}, otherBoid: { x: number; y: number; dx: number; dy: number, s: number; } ){
  const distance = Math.sqrt(Math.pow(otherBoid.x - boid.x, 2) + Math.pow(otherBoid.y - boid.y, 2));

  if(distance < 50){
    return true;
  } else {
    return false;
  }
}

function normalizeVector(vector: {x: number, y: number}) {
  const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (magnitude > 0) {
    return {
      x: vector.x / magnitude,
      y: vector.y / magnitude
    };
  }
  return vector;
}

function calculateDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function calculateSeparation(boid: { x: number; y: number; dx: number; dy: number, s: number; }, boids: { x: number; y: number; dx: number; dy: number, s :number;}[]){

  let avgSeparationX = 0;
  let avgSeparationY = 0;
  let numNeighbors = 0;

  for (const otherBoid of boids) {
    if (boid === otherBoid) continue;

    if(isNeighbor(boid, otherBoid) && boid.s == otherBoid.s) {
      const separationX = (boid.x - otherBoid.x);
      const separationY = (boid.y - otherBoid.y);
      avgSeparationX += separationX;
      avgSeparationY += separationY;
      numNeighbors++;
    }
  }

  if(numNeighbors > 0) {
    avgSeparationX /= numNeighbors;
    avgSeparationY /= numNeighbors;
  }
  return { x: avgSeparationX, y: avgSeparationY };
}

function calculateAlignment(boid: { x: number; y: number; dx: number; dy: number, s: number; }, boids: { x: number; y: number; dx: number; dy: number, s: number;}[]){
  let avgAlignmentX = 0;
  let avgAlignmentY = 0;
  let numNeighbors = 0;
  
  for (const otherBoid of boids) {
    if (boid === otherBoid) continue;

    if(isNeighbor(boid, otherBoid) && boid.s == otherBoid.s) {
      avgAlignmentX += otherBoid.dx;
      avgAlignmentY += otherBoid.dy;
      numNeighbors++;
    }
  }
  if(numNeighbors > 0) {
    avgAlignmentX /= numNeighbors;
    avgAlignmentY /= numNeighbors;
  }
  return { x: avgAlignmentX, y: avgAlignmentY };

}

function calculateCohesion(boid: { x: number; y: number; dx: number; dy: number, s: number; }, boids: { x: number; y: number; dx: number; dy: number, s: number; }[]){

  let avgCohesionX = 0;
  let avgCohesionY = 0;
  let numNeighbors = 0;

  for (const otherBoid of boids) {
    if (boid === otherBoid) continue;

    if(isNeighbor(boid, otherBoid) && boid.s == otherBoid.s) {
      avgCohesionX += otherBoid.x;
      avgCohesionY += otherBoid.y;
      numNeighbors++;
    }
  }
  if(numNeighbors > 0) {
    avgCohesionX /= numNeighbors;
    avgCohesionY /= numNeighbors;
  }
  return { x: avgCohesionX, y: avgCohesionY };
}

export default function Boids() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const boidsRef = useRef<Array<{ x: number; y: number; dx: number; dy: number, s: number}>>([]);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });


    const mouseInfluenceRadius = 50;

    useEffect(() => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      
      dimensions.height = canvas.height;
      dimensions.width = canvas.width;

      const updateDimensions = () => {
        setDimensions({
          width: canvas.width,
          height: canvas.height
        });
      }

      const handleMouseMove = (e: { clientX: number; clientY: number; }) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      };
      
      updateDimensions();
      
      window.addEventListener('resize', updateDimensions);
      window.addEventListener('mousemove', handleMouseMove);

      
      const maxSpeed = 0.5;
 
      const min = -0.05;
      const max = 0.05;
      if (boidsRef.current.length === 0) {
        boidsRef.current = Array(50).fill(null).map(() => ({
          x: Math.random() * dimensions.width,
          y: Math.random() * dimensions.height,
          dx: (Math.random() * max) + (Math.random() * min),
          dy: (Math.random() * max) + (Math.random() * min),
          s:  Math.round(Math.random() * 3)
        }));  
      }
  
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
  
        boidsRef.current.forEach((boid) => {
          const separation = calculateSeparation(boid, boidsRef.current);
          const alignment = calculateAlignment(boid, boidsRef.current);
          const cohesion = calculateCohesion(boid, boidsRef.current);

          const normSeparation = normalizeVector(separation);
          const normAlignment = normalizeVector(alignment);
          const normCohesion = normalizeVector(cohesion);
          
          let forceX = normSeparation.x * 0.04 + normAlignment.x * 0.05 + normCohesion.x * 0.01;
          let forceY = normAlignment.y * 0.05 + normCohesion.y * 0.01 + normSeparation.y * 0.04;

          const distToMouse = calculateDistance(boid.x, boid.y, mousePosition.x, mousePosition.y);

          if (distToMouse < mouseInfluenceRadius) {
            // Calculate direction vector from boid to mouse
            const toMouseX = mousePosition.x - boid.x;
            const toMouseY = mousePosition.y - boid.y;
            
            // Normalize the vector
            const distFactor = 1 - (distToMouse / mouseInfluenceRadius); // Stronger effect when closer
            const magnitude = Math.sqrt(toMouseX * toMouseX + toMouseY * toMouseY);
            
            if (magnitude > 0) {
              const normalizedX = toMouseX / magnitude;
              const normalizedY = toMouseY / magnitude;
              
              forceX -= normalizedX * 0.5 * distFactor;
              forceY -= normalizedY * 0.5 * distFactor;
            }
          }
          
          boid.dx += forceX + boid.dx * 0.9995;
          boid.dy += forceY + boid.dy * 0.9995;

          const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);
          if (speed > maxSpeed) {
            boid.dx = (boid.dx / speed) * maxSpeed;
            boid.dy = (boid.dy / speed) * maxSpeed;
          }

          const minSpeed = 0.5;
          if (speed < minSpeed && speed > 0) {
            boid.dx = (boid.dx / speed) * minSpeed;
            boid.dy = (boid.dy / speed) * minSpeed;
          }
          
          boid.x += boid.dx;
          boid.y += boid.dy;
          
          
          if (boid.x > canvas.width) boid.x = 0;
          if (boid.x < 0) boid.x = canvas.width;
          if (boid.y > canvas.height) boid.y = 0;
          if (boid.y < 0) boid.y = canvas.height;
          
          const angle = Math.atan2(boid.dy, boid.dx);
          ctx.save();
          ctx.translate(boid.x, boid.y);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(4, 0);
          ctx.lineTo(-2, 2);
          ctx.lineTo(-2, -2);
          ctx.closePath();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fill();
          ctx.restore();
        });
        
        requestAnimationFrame(animate);
      };
  
      animate();
    }, []);
  
    return (
        <div>
            <canvas
                key="boids-canvas"
                ref={canvasRef}
                className="fixed top-0 left-0 w-screen h-screen opacity-30"
            />

            {/* Debug Element */}
            <div className="fixed top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded shadow-lg z-[9999]">
              Window Mouse: X={mousePosition.x}, Y={mousePosition.y}
            </div>
        </div>
        
    );
};