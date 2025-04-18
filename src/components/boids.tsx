'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useMemo } from 'react';

// performance constants
const NEIGHBOR_RADIUS = 15;
const NEIGHBOR_RADIUS_SQ = NEIGHBOR_RADIUS * NEIGHBOR_RADIUS;

// cache for image point clouds by src|density
const imageCloudCache = new Map<string, { x: number; y: number }[]>();


async function getImagePointCloud(src: string, density = 9) {
  const cacheKey = `${src}|${density}`;
  if (imageCloudCache.has(cacheKey)) {
    return imageCloudCache.get(cacheKey)!;
  }
  // load image asset
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  const iw = image.width;
  const ih = image.height;
  const scale = Math.min(sw / iw / 1.25, sh / ih / 1.25);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (sw - dw) / 2;
  const dy = (sh - dh) / 2;
  const off = document.createElement('canvas');
  off.width = sw; off.height = sh;
  const octx = off.getContext('2d')!;
  octx.drawImage(image, dx, dy, dw, dh);
  const data = octx.getImageData(0, 0, sw, sh).data;
  const points: { x: number; y: number }[] = [];
  for (let y = 0; y < sh; y += density) {
    for (let x = 0; x < sw; x += density) {
      if (data[(y * sw + x) * 4 + 3] > 128) {
        points.push({ x, y });
      }
    }
  }
  imageCloudCache.set(cacheKey, points);
  console.log(`Image ${src} → ${points.length} pts at density ${density}`);
  return points;
}

function getWordPointCloud(text: string, fontSize = 500, density = 9) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
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
  const dx = otherBoid.x - boid.x;
  const dy = otherBoid.y - boid.y;
  return dx * dx + dy * dy < NEIGHBOR_RADIUS_SQ;
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

function isScreenSize(size: 'small' | 'medium' | 'large'): boolean {
  const width = window.innerWidth;

  if (size === 'small') {
    return width <= 768;
  } else if (size === 'medium') {
    return width > 768 && width <= 1200;
  } else if (size === 'large') {
    return width > 1200;
  }
  return false;
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
    const hoverTargetRef = useRef<{ x: number; y: number } | null>(null); 

    const imageMap = useMemo(() => ({
      '/writings': '/images/writing-img.svg',
      '/thoughts': '/images/thought-img.svg',
      '/programs': '/images/programs-img.svg',
    }), []);
    const mouseInfluenceRadius = 350;


    //to reload boid + button animation to reattach listeners
    const pathname = usePathname();

    useEffect(() => {
      if (!canvasRef.current){
        return;
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      const cellSize = 100;
      const MAX_NEIGHBORS = 3;
      let cols = 0;
      let rows = 0;
      let grid: number[][] = [];

      //on remount clear hover target
      hoverTargetRef.current = null;

      const route = pathname.replace(/\/$/, '');
      const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;
        mousePositionRef.current = { x: canvasX, y: canvasY };
      };
      
      const resizeCanvas = async () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        console.log(`resizeCanvas for route: ${route}, screen: ${canvas.width}x${canvas.height}`);

        let updated = false;
        const wordD = { small: 8, medium: 12, large: 20 };
        const imgD = { small: 8, medium: 12, large: 15 };
        const imgSrc = imageMap[route as '/writings' | '/thoughts' | '/programs'];

        if (isScreenSize('small')) {
          if (imgSrc) {
            try {
              targetsPointRef.current = await getImagePointCloud(imgSrc, imgD.small);
              console.log('Loaded image targets:', targetsPointRef.current.length);
              // cap points
              const MAX_IMG_POINTS = 2000;
              if (targetsPointRef.current.length > MAX_IMG_POINTS) {
                targetsPointRef.current = targetsPointRef.current.filter((_, i) => i % Math.ceil(targetsPointRef.current.length / MAX_IMG_POINTS) === 0);
                console.log('Capped image targets to:', targetsPointRef.current.length);
              }
            } catch (err) {
              console.error('Failed to load image point cloud', err);
              targetsPointRef.current = getWordPointCloud("sami. f", 100, wordD.small);
              console.log('Fallback word targets:', targetsPointRef.current.length);
            }
          } else {
            targetsPointRef.current = getWordPointCloud("sami. f", 100, wordD.small);
            console.log('Word targets (no imgSrc):', targetsPointRef.current.length);
          }
          updated = true;
        } else if (isScreenSize('medium')) {
          if (imgSrc) {
            try {
              targetsPointRef.current = await getImagePointCloud(imgSrc, imgD.medium);
              console.log('Loaded image targets:', targetsPointRef.current.length);
              // cap points
              const MAX_IMG_POINTS = 2000;
              if (targetsPointRef.current.length > MAX_IMG_POINTS) {
                targetsPointRef.current = targetsPointRef.current.filter((_, i) => i % Math.ceil(targetsPointRef.current.length / MAX_IMG_POINTS) === 0);
                console.log('Capped image targets to:', targetsPointRef.current.length);
              }
            } catch (err) {
              console.error('Failed to load image point cloud', err);
              targetsPointRef.current = getWordPointCloud("sami. f", 200, wordD.medium);
              console.log('Fallback word targets:', targetsPointRef.current.length);
            }
          } else {
            targetsPointRef.current = getWordPointCloud("sami. f", 200, wordD.medium);
            console.log('Word targets (no imgSrc):', targetsPointRef.current.length);
          }
          updated = true;
        } else if (isScreenSize('large')) {
          if (imgSrc) {
            try {
              targetsPointRef.current = await getImagePointCloud(imgSrc, imgD.large);
              console.log('Loaded image targets:', targetsPointRef.current.length);
              // cap points
              const MAX_IMG_POINTS = 2000;
              if (targetsPointRef.current.length > MAX_IMG_POINTS) {
                targetsPointRef.current = targetsPointRef.current.filter((_, i) => i % Math.ceil(targetsPointRef.current.length / MAX_IMG_POINTS) === 0);
                console.log('Capped image targets to:', targetsPointRef.current.length);
              }
            } catch (err) {
              console.error('Failed to load image point cloud', err);
              targetsPointRef.current = getWordPointCloud("sami. f", 800, wordD.large);
              console.log('Fallback word targets:', targetsPointRef.current.length);
            }
          } else {
            targetsPointRef.current = getWordPointCloud("sami. f", 800, wordD.large);
            console.log('Word targets (no imgSrc):', targetsPointRef.current.length);
          }
          updated = true;
        }

        if(updated) {
          console.log('Initializing boids count:', targetsPointRef.current.length);
          const min = -1;
          const max = 1;
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

        if (targetsPointRef.current.length > 0) {
            boidsRef.current.forEach((boid, i) => {
                const tps = targetsPointRef.current[i];
                boid.tx = tps.x;
                boid.ty = tps.y;
            });
        }
      };

      // debounce resize to avoid repeated expensive recompute
      let resizeTimer: NodeJS.Timeout;
      const debouncedResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { resizeCanvas(); }, 200);
      };
      window.addEventListener('resize', debouncedResize);
      window.addEventListener('mousemove', handleMouseMove);

      const buttons = Array.from(document.querySelectorAll('.mono-button')) as HTMLElement[];
      const onEnter = (e: MouseEvent) => {
        const btn = e.currentTarget as HTMLElement;
        const rect = btn.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / canvasRect.width;
        const scaleY = canvas.height / canvasRect.height;
        hoverTargetRef.current = {
          x: (rect.left + rect.width / 2 - canvasRect.left) * scaleX,
          y: (rect.top + rect.height / 2 - canvasRect.top) * scaleY
        };
      };
      
      const onLeave = () => { hoverTargetRef.current = null; };

      buttons.forEach((button) => {
        button.addEventListener('mouseenter', onEnter);
        button.addEventListener('mouseleave', onLeave);
      });
      
      const maxSpeed = 3;
      let lastFrameTime = performance.now();
      const animate = (timestamp: number) => {
        // throttle @ 30 fps
        const throttle = 30;
        const delta = timestamp - lastFrameTime;
        if (delta < 1000 / throttle) {
          requestAnimationFrame(animate);
          return;
        }
        lastFrameTime = timestamp;
        const frameStart = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const neededCols = Math.ceil(canvas.width / cellSize);
        const neededRows = Math.ceil(canvas.height / cellSize);
        if (grid.length !== neededCols * neededRows) {
          cols = neededCols;
          rows = neededRows;
          grid = Array(cols * rows).fill(null).map(() => []);
        } else {
          grid.forEach(cell => { cell.length = 0; });
        }
         boidsRef.current.forEach((b, i) => {
           const xCell = Math.floor(b.x / cellSize);
           const yCell = Math.floor(b.y / cellSize);
           if (xCell >= 0 && xCell < cols && yCell >= 0 && yCell < rows) {
             grid[yCell * cols + xCell].push(i);
           }
         });

         boidsRef.current.forEach((boid, index) => {
           const xCell = Math.floor(boid.x / cellSize);
           const yCell = Math.floor(boid.y / cellSize);
           const localIndices: number[] = [];
           for (let dx = -1; dx <= 1; dx++) {
             for (let dy = -1; dy <= 1; dy++) {
               const nx = xCell + dx;
               const ny = yCell + dy;
               if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                 localIndices.push(...grid[ny * cols + nx]);
               }
             }
           }
           const neighbors = localIndices
             .map(i => boidsRef.current[i])
             .filter(o => o !== boid && boid.s === o.s && isNeighbor(boid, o));
           if (neighbors.length > MAX_NEIGHBORS) neighbors.length = MAX_NEIGHBORS;

          const separation = calculateSeparation(boid, neighbors);
          const alignment = calculateAlignment(boid, neighbors);
          const cohesion = calculateCohesion(boid, neighbors);

          const target = hoverTargetRef.current || { x: boid.tx, y: boid.ty };
          const toTargetX = target.x - boid.x;
          const toTargetY = target.y - boid.y;
          const distSq = toTargetX * toTargetX + toTargetY * toTargetY;
          const epsSq = 0.5 * 0.5;;

          let targetForceX = 0;
          let targetForceY = 0;

          if (distSq > epsSq) {
                const distToTarget = Math.sqrt(distSq);

                if (distToTarget > 0 && Number.isFinite(distToTarget)) {
                    const invDist = 2.0 / distToTarget;
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
       
          const separationWeight = 0.1;
          const alignmentWeight = 0.005;
          const cohesionWeight = 0.03;
          const targetWeight = 0.4;
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
          
          const forceX = (normSeparation.x * separationWeight) 
          + (normAlignment.x * alignmentWeight) 
          + (normCohesion.x * cohesionWeight) 
          + (targetForceX * targetWeight)
          + (mouseForceX * mouseWeight);
          
          const forceY = (normSeparation.y * separationWeight) 
          + (normAlignment.y * alignmentWeight) 
          + (normCohesion.y * cohesionWeight) 
          + (targetForceY * targetWeight)
          + (mouseForceY * mouseWeight);
          


          const forceMultiplier = 0.2;
          const damping = 0.95;

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

        const frameEnd = performance.now();
        // @ts-expect-error __lastBoidFrameTime is not defined in the global scope
        window.__lastBoidFrameTime = frameEnd - frameStart;
        requestAnimationFrame(animate);

      };
      // initial load and start loop (after animate is defined)
      (async () => {
        await resizeCanvas();
        requestAnimationFrame(animate);
      })();

      return () => {
        window.removeEventListener('resize', debouncedResize);
        window.removeEventListener('mousemove', handleMouseMove);
        buttons.forEach((button) => {
          button.removeEventListener('mouseenter', onEnter);
          button.removeEventListener('mouseleave', onLeave);
        });
      }

      
      
    }, [pathname]);
  
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