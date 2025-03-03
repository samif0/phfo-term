'use client';

import { useEffect, useState, useRef } from 'react';

function isNeighbor(boid: { x: number; y: number; dx: number; dy: number, s: number;}, otherBoid: { x: number; y: number; dx: number; dy: number, s: number; } ){
  const distance = Math.sqrt(Math.pow(otherBoid.x - boid.x, 2) + Math.pow(otherBoid.y - boid.y, 2));

  if(distance < 10){
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

function calculateSeparation(boid: { x: number; y: number; dx: number; dy: number, s: number; }, boids: { x: number; y: number; dx: number; dy: number, s :number;}[]){

  let avgSeparationX = 0;
  let avgSeparationY = 0;
  let numNeighbors = 0;

  for (const otherBoid of boids) {
    if (boid === otherBoid) continue;

    if(isNeighbor(boid, otherBoid) && boid.s == otherBoid.s) {
      const distance = Math.sqrt(Math.pow(otherBoid.x - boid.x, 2) + Math.pow(otherBoid.y - boid.y, 2));
      const separationX = (boid.x - otherBoid.x) / distance;
      const separationY = (boid.y - otherBoid.y) / distance;
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


    useEffect(() => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas size to match window dimensions
      dimensions.height = canvas.height;
      dimensions.width = canvas.width;

      function updateDimensions() {
        setDimensions({
          width: canvas.width,
          height: canvas.height
        });
      }
      
      updateDimensions();
      
      window.addEventListener('resize', updateDimensions);
      
      // Log to verify dimensions are correct
      console.log("Canvas dimensions:", canvas.width, canvas.height);

      const maxSpeed = 3;
 
      const min = -1;
      const max = 1;
      if (boidsRef.current.length === 0) {
        boidsRef.current = Array(50).fill(null).map(() => ({
          x: Math.random() * dimensions.width,
          y: Math.random() * dimensions.height,
          dx: (Math.random() * max) + (Math.random() * min),
          dy: (Math.random() * max) + (Math.random() * min),
          s:  Math.round(Math.random() * 3)
        }));
        
        // Debug log to verify boid positions
        console.log("Initial boid positions:", boidsRef.current.slice(0, 10));
      }
  
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
  
        boidsRef.current.forEach((boid, i) => {
          const separation = calculateSeparation(boid, boidsRef.current);
          const alignment = calculateAlignment(boid, boidsRef.current);
          const cohesion = calculateCohesion(boid, boidsRef.current);

          const normSeparation = normalizeVector(separation);
          const normAlignment = normalizeVector(alignment);
          const normCohesion = normalizeVector(cohesion);
          
          const forceX = normSeparation.x * 0.05 + normAlignment.x * 0.02 
          //+ cohesion.x * 0.01;
          const forceY = normSeparation.y * 0.05 + normAlignment.y * 0.02 
          //+ cohesion.y * 0.01;

          
          boid.dx += forceX + boid.dx * 0.9995;
          boid.dy += forceY + boid.dy * 0.9995;

          const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);
          if (speed > maxSpeed) {
            boid.dx = (boid.dx / speed) * maxSpeed;
            boid.dy = (boid.dy / speed) * maxSpeed;
          }

          // Ensure minimum speed to avoid stagnation
          const minSpeed = 0.5;
          if (speed < minSpeed && speed > 0) {
            boid.dx = (boid.dx / speed) * minSpeed;
            boid.dy = (boid.dy / speed) * minSpeed;
          }
          
          // Update position
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
                className="fixed top-0 left-0 w-screen h-screen -z-50 opacity-30"
            />
        </div>
        
    );
};