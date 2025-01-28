'use client';

import { useEffect, useRef } from 'react';

export default function Boids() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;

      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resizeCanvas();
 
      window.addEventListener('resize', resizeCanvas);
  
      const boids = Array(30).fill(null).map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        dx: Math.random() * 2 - 1,
        dy: Math.random() * 2 - 1,
      }));

  
      const animate = () => {
        console.log('animating');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgb(255, 0, 0)'; 
        boids.forEach(boid => {
            boid.x += boid.dx;
            boid.y += boid.dy;
            
            if (boid.x > canvas.width) boid.x = 0;
            if (boid.x < 0) boid.x = canvas.width;
            if (boid.y > canvas.height) boid.y = 0;
            if (boid.y < 0) boid.y = canvas.height;
            
            ctx.beginPath();
            ctx.arc(boid.x, boid.y, 5, 0, Math.PI * 2);
            ctx.fill();
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