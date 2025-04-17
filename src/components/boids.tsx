'use client';

import { useEffect, useState, useRef } from 'react';

function getWordPointCloud(text: string, fontSize = 500, density = 9) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  console.log("reached");
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;;

  ctx.fillStyle = 'black';
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const points = [];

  for (let y = 0; y < canvas.height; y += density) {
    for (let x = 0; x < canvas.width; x += density) {
      const index = (y * canvas.width + x) * 4;
      const alpha = imageData.data[index + 3];

      if (alpha > 128) {
        points.push({ x, y });
      }
    }
  }

  return points;
}

function isNeighbor(boid: { x: number, y: number, dx: number, dy: number, s: number, tx: number, ty: number}, 
  otherBoid: { x: number, y: number, dx: number, dy: number, s: number, tx: number, ty: number } ){
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

function calculateSeparation(boid: { x: number, y: number, dx: number, dy: number, s: number, tx: number, ty:number },
   boids: { x: number; y: number; dx: number; dy: number, s :number, tx: number, ty: number}[]){

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

function calculateAlignment(boid: { x: number; y: number; dx: number; dy: number, s: number, tx: number, ty: number }, 
  boids: { x: number; y: number; dx: number; dy: number, s: number, tx: number, ty: number}[]){
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

function calculateCohesion(boid: { x: number, y: number, dx: number, dy: number, s: number, tx: number, ty: number }, 
  boids: { x: number, y: number, dx: number, dy: number, s: number, tx: number, ty: number }[]){

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
    const boidsRef = useRef<Array<{ x: number; y: number; dx: number; dy: number, s: number, tx: number, ty: number}>>([]);
    const mousePositionRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
    const targetsPointRef = useRef<{ x: number; y: number }[]>([]);
    

    const mouseInfluenceRadius = 300;

    useEffect(() => {
      if (!canvasRef.current){
        return;
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;

      
      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        console.log(`Canvas resized to: ${canvas.width}x${canvas.height}`);

        if (targetsPointRef.current.length > 0) {
            boidsRef.current.forEach((boid, i) => {
                const tps = targetsPointRef.current[i];
                boid.tx = tps.x;
                boid.ty = tps.y;
            });
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;   
        const scaleY = canvas.height / rect.height;  

        const canvasX = (e.clientX - rect.left) * scaleX; 
        const canvasY = (e.clientY - rect.top) * scaleY;

        mousePositionRef.current = { x: canvasX, y: canvasY };
      };

      resizeCanvas(); 
      window.addEventListener('resize', resizeCanvas);
      window.addEventListener('mousemove', handleMouseMove);

      
      targetsPointRef.current = getWordPointCloud("sami. f");

      const maxSpeed = 4;
 
      const min = -1;
      const max = 1;
      if (boidsRef.current.length === 0 && targetsPointRef.current.length > 0) {
        if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
            console.error("Canvas dimensions invalid during boid init!", canvas?.width, canvas?.height);
        } else {
            boidsRef.current = Array(targetsPointRef.current.length).fill(null).map((_, i) => {
                const tps = targetsPointRef.current[i];
        
                 const calculatedTx = tps.x;
                 const calculatedTy = tps.y;

                return {
                    
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    dx: (Math.random() * max) + (Math.random() * min),
                    dy: (Math.random() * max) + (Math.random() * min),
                    s: Math.round(Math.random() * 3),
                    tx: calculatedTx,
                    ty: calculatedTy
                };
            });
        }
      } else if (boidsRef.current.length === 0) {
        console.warn("Skipping boid initialization: No target points available.");
      }
  
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
       
        
        boidsRef.current.forEach((boid, index) => {
        const toTargetX = boid.tx - boid.x;
        const toTargetY = boid.ty - boid.y;
        const distSq = toTargetX * toTargetX + toTargetY * toTargetY;
        const epsSq = 0.5 * 0.5;;

        let targetForceX = 0;
        let targetForceY = 0;

        if (distSq > epsSq) {
              const distToTarget = Math.sqrt(distSq);

              if (distToTarget > 0 && Number.isFinite(distToTarget)) {
                  const invDist = 3.0 / distToTarget;
                  targetForceX = toTargetX * invDist;
                  targetForceY = toTargetY * invDist;

                  if (isNaN(targetForceX) || isNaN(targetForceY)) {
                      console.error(`NaN detected AFTER normalization for Boid ${index}`, { boid, toTargetX, toTargetY, distToTarget, invDist });
                      targetForceX = 0;
                      targetForceY = 0;
                  }
              } else {
                  console.warn(`Invalid distToTarget (${distToTarget}) for Boid ${index} despite distSq > epsSq`, { boid, distSq });
              }
          }
     
          const separation = calculateSeparation(boid, boidsRef.current);
          const alignment = calculateAlignment(boid, boidsRef.current);
          const cohesion = calculateCohesion(boid, boidsRef.current);
          
          const separationWeight = 0.03;
          const alignmentWeight = 0.005;
          const cohesionWeight = 0.015;
          const targetWeight = 0.8;
          const mouseWeight = 3;

          const normSeparation = normalizeVector(separation);
          const normAlignment = normalizeVector(alignment);
          const normCohesion = normalizeVector(cohesion);

          let mouseForceX = 0;
          let mouseForceY = 0;
          const dxMouse = boid.x - mousePositionRef.current.x;
          const dyMouse = boid.y - mousePositionRef.current.y;
          const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;

          if (distMouseSq > 0 && distMouseSq < mouseInfluenceRadius * mouseInfluenceRadius) {
              const distMouse = Math.sqrt(distMouseSq);
              const strength = (mouseInfluenceRadius - distMouse) / mouseInfluenceRadius;
              mouseForceX = (dxMouse / distMouse) * strength;
              mouseForceY = (dyMouse / distMouse) * strength;

               if (isNaN(mouseForceX) || isNaN(mouseForceY)) {
                    mouseForceX = 0; mouseForceY = 0;
               }
          }
          
          let forceX = (normSeparation.x * separationWeight) 
          + (normAlignment.x * alignmentWeight) 
          + (normCohesion.x * cohesionWeight) 
          + (targetForceX * targetWeight)
          + (mouseForceX * mouseWeight);
          
          let forceY = (normSeparation.y * separationWeight) 
          + (normAlignment.y * alignmentWeight) 
          + (normCohesion.y * cohesionWeight) 
          + (targetForceY * targetWeight)
          + (mouseForceY * mouseWeight);
          


          const forceMultiplier = 0.3;
          const damping = 0.90;

          boid.dx += forceX * forceMultiplier;
          boid.dy += forceY * forceMultiplier;
          
          boid.dx *= damping;
          boid.dy *= damping;

          const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);
          if (speed > maxSpeed) {
            boid.dx = (boid.dx / speed) * maxSpeed;
            boid.dy = (boid.dy / speed) * maxSpeed;
          }
 
          boid.x += boid.dx;
          boid.y += boid.dy;
          
          const buffer = 10;

          if (boid.x > canvas.width + buffer) boid.x = -buffer;
          if (boid.x < -buffer) boid.x = canvas.width + buffer;
          if (boid.y > canvas.height + buffer) boid.y = -buffer;
          if (boid.y < -buffer) boid.y = canvas.height + buffer;
          

          const angle = Math.atan2(boid.dy, boid.dx);
          ctx.save();
          ctx.translate(boid.x, boid.y);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(3, 0);
          ctx.lineTo(-1.5, 1.5);
          ctx.lineTo(-1.5, -1.5);
          ctx.closePath();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fill();
          ctx.restore();

        });
        

        /*
        const currentMousePos = mousePositionRef.current;
        const mouseX = currentMousePos.x;
        const mouseY = currentMousePos.y;
        const isValidCoords = Number.isFinite(mouseX) && Number.isFinite(mouseY);

        if (isValidCoords) {
            ctx.save();

            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.fillRect(mouseX - 5, mouseY - 5, 10, 10);

            ctx.beginPath();
            ctx.arc(mouseX, mouseY, mouseInfluenceRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 1;
            ctx.stroke();

            ctx.restore();
        }
        */

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

        </div>
        
    );
};