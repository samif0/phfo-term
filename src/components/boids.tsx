'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useMemo, useState } from 'react';
import { useTheme } from './theme-provider';


// performance constants
const NEIGHBOR_RADIUS = 15;

// cache for image point clouds by src|density
const imageCloudCache = new Map<string, { x: number; y: number }[]>();

async function getImagePointCloud(src: string, density = 9) {
  const cacheKey = `${src}|${density}`;
  if (imageCloudCache.has(cacheKey)) {
    return imageCloudCache.get(cacheKey)!;
  }
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


export default function Boids() {
    const { theme } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const boidsRef = useRef<Array<{ x: number; y: number; dx: number; dy: number, s: number, tx: number, ty: number}>>([]);
    const mousePositionRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
    const targetsPointRef = useRef<{ x: number; y: number }[]>([]);
    const hoverTargetRef = useRef<{ x: number; y: number } | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const [scrollOffset, setScrollOffset] = useState(0);
    const targetScrollRef = useRef(0);
    // Typed buffers stored in a ref to avoid re-allocating on every render/mount
    const buffersRef = useRef<{
      positionsX: Float32Array;
      positionsY: Float32Array;
      velocitiesX: Float32Array;
      velocitiesY: Float32Array;
      targetsX: Float32Array;
      targetsY: Float32Array;
      states: Uint8Array;
      neighborIndexPool: Int32Array;
      neighborPoolLength: number;
    } | null>(null);

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
      // ensure fresh canvas without existing context (fix transferControlToOffscreen error)
      let canvas = canvasRef.current!;
      const originalCanvas = canvas;
      const newCanvas = originalCanvas.cloneNode(true) as HTMLCanvasElement;
      originalCanvas.parentNode?.replaceChild(newCanvas, originalCanvas);
      canvas = newCanvas;
      canvasRef.current = newCanvas;
      // set initial size before worker transfer
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const cellSize = NEIGHBOR_RADIUS * 2;
      const MAX_NEIGHBORS = 3;
      // defer worker setup until we have loaded initial targets
      let worker: Worker;
      let initialized = false;
      let lastWidth = window.innerWidth;
      let lastHeight = window.innerHeight;

      // on remount clear hover target
      hoverTargetRef.current = null;

      const route = pathname.replace(/\/$/, '');
      const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = lastWidth / rect.width;
        const scaleY = lastHeight / rect.height;
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;
        mousePositionRef.current = { x: canvasX, y: canvasY };
        // send free-move pointer position to worker for repulsion
        if (initialized && !hoverTargetRef.current) worker.postMessage({ type: 'pointer', x: canvasX, y: canvasY });
      };
      
      const resizeCanvas = async () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        const widthDiff = Math.abs(newWidth - lastWidth);
        const heightDiff = Math.abs(newHeight - lastHeight);

        const smallViewportChange = widthDiff < 10 && heightDiff < 120;
        if (worker && initialized && smallViewportChange) {
          worker.postMessage({ type: 'viewport', width: newWidth, height: newHeight });
          lastWidth = newWidth;
          lastHeight = newHeight;
          return;
        }

        if (!initialized) {
          canvas.width = newWidth;
          canvas.height = newHeight;
        }

        lastWidth = newWidth;
        lastHeight = newHeight;

        let updated = false;
        const wordD = { small: 5, medium: 3, large: 4 };
        const imgD = { small: 6, medium: 4, large: 5 };
        const MAX_POINTS = { small: 2000, medium: 4000, large: 3000 };
        // pick image src by matching route prefix
        const keys = Object.keys(imageMap);
        const matchKey = keys.find(key => route.startsWith(key));
        const imgSrc = matchKey ? imageMap[matchKey as keyof typeof imageMap] : undefined;

        async function loadTargetsForSize(
          imgSrc: string | undefined,
          imgDensity: number,
          wordFontSize: number,
          wordDensity: number,
          maxPts: number
        ) {
          if (imgSrc) {
            try {
              let pts = await getImagePointCloud(imgSrc, imgDensity);
              if (pts.length > maxPts) {
                pts = pts.filter((_, i) => i % Math.ceil(pts.length / maxPts) === 0);
              }
              return pts;
            } catch (err) {
              console.error('Failed to load image point cloud', err);
              const wp = getWordPointCloud("sami f.", wordFontSize, wordDensity);
              return wp.slice(0, maxPts);
            }
          }
          const wp = getWordPointCloud("sami f.", wordFontSize, wordDensity);
          return wp.slice(0, maxPts);
        }

        const sizeConfigs = {
          small: { imgDensity: imgD.small, wordFontSize: 80, wordDensity: wordD.small, maxPts: MAX_POINTS.small },
          medium: { imgDensity: imgD.medium, wordFontSize: 150, wordDensity: wordD.medium, maxPts: MAX_POINTS.medium },
          large: { imgDensity: imgD.large, wordFontSize: 300, wordDensity: wordD.large, maxPts: MAX_POINTS.large },
        };

        // always load a target point cloud: image (if available) or fallback word
        const sizeKey = isScreenSize('small') ? 'small' : isScreenSize('medium') ? 'medium' : 'large';
        const cfg = sizeConfigs[sizeKey];
        targetsPointRef.current = await loadTargetsForSize(
          imgSrc,
          cfg.imgDensity,
          cfg.wordFontSize,
          cfg.wordDensity,
          cfg.maxPts
        );
        updated = true;

        if(updated) {
          const N = targetsPointRef.current.length;
          // store buffers in ref
          buffersRef.current = {
            positionsX: new Float32Array(N),
            positionsY: new Float32Array(N),
            velocitiesX: new Float32Array(N),
            velocitiesY: new Float32Array(N),
            targetsX: new Float32Array(N),
            targetsY: new Float32Array(N),
            states: new Uint8Array(N),
            neighborIndexPool: new Int32Array(N * 9),
            neighborPoolLength: 0,
          };
          const buf = buffersRef.current;
          // initialize buffers - start boids from center with aesthetic burst pattern
          const centerX = newWidth / 2;
          const centerY = newHeight / 2;
          const burstRadius = 20; // tighter starting cluster
          
          for (let i = 0; i < N; i++) {
            // Create a spiral/flower pattern
            const t = i / N;
            const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // golden ratio angle
            const angle = i * goldenAngle;
            const spiralRadius = Math.sqrt(i / N) * burstRadius;
            
            // Start position with slight spiral
            buf.positionsX[i] = centerX + Math.cos(angle) * spiralRadius;
            buf.positionsY[i] = centerY + Math.sin(angle) * spiralRadius;
            
            const wavePhase = t * Math.PI * 4; 
            const waveFactor = 0.5 + 0.5 * Math.sin(wavePhase);
            const burstSpeed = (4 + waveFactor * 6) * (0.7 + 0.3 * Math.random());
            
            const perpAngle = angle + Math.PI / 2;
            const spiralFactor = 0.2;
            
            buf.velocitiesX[i] = Math.cos(angle) * burstSpeed + Math.cos(perpAngle) * burstSpeed * spiralFactor;
            buf.velocitiesY[i] = Math.sin(angle) * burstSpeed + Math.sin(perpAngle) * burstSpeed * spiralFactor;
            
            buf.targetsX[i] = targetsPointRef.current[i].x;
            buf.targetsY[i] = targetsPointRef.current[i].y;
            buf.states[i] = i % 4; // more varied states for color groups
          }
          // notify worker of resize and new targets
          if (!initialized) {
            // instantiate worker via URL import; Next/webpack will emit correct file path in prod
            const workerUrl = new URL('../workers/boids.worker.ts', import.meta.url);

             worker = new Worker(
              workerUrl,
              { type: 'module' }
            );

            // transfer control to offscreen after creating worker
            const offscreen = canvas.transferControlToOffscreen();
            worker.postMessage({
              type: 'init',
              canvas: offscreen,
              width: newWidth,
              height: newHeight,
              neighborRadius: NEIGHBOR_RADIUS,
              maxNeighbors: MAX_NEIGHBORS,
              cellSize,
              mouseInfluenceRadius,
              targetPoints: targetsPointRef.current
            }, [offscreen]);
            // listen for frameTime messages from worker
            worker.onmessage = (e: MessageEvent) => {
              const msg = e.data;
              if (msg.type === 'frameTime' && typeof msg.duration === 'number') {
                // expose for profiler
                // @ts-expect-error global var
                window.__lastBoidFrameTime = msg.duration;
              }
            };
            initialized = true;
            workerRef.current = worker;
            // Send initial theme
            worker.postMessage({ type: 'theme', isDark: theme === 'dark' });
          } else {
            worker.postMessage({ type: 'resize', width: newWidth, height: newHeight, targetPoints: targetsPointRef.current });
          }
        }

        if (targetsPointRef.current.length > 0) {
            boidsRef.current.forEach((boid, i) => {
                const tps = targetsPointRef.current[i];
                boid.tx = tps.x;
                boid.ty = tps.y;
            });
        }
      };

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
        const scaleX = lastWidth / canvasRect.width;
        const scaleY = lastHeight / canvasRect.height;
        hoverTargetRef.current = {
          x: (rect.left + rect.width / 2 - canvasRect.left) * scaleX,
          y: (rect.top + rect.height / 2 - canvasRect.top) * scaleY
        };
        // notify worker of hover start (trigger attraction animation)
        worker.postMessage({ type: 'hover', subtype: 'start', x: hoverTargetRef.current!.x, y: hoverTargetRef.current!.y });
        // disable repulsion during hover
        worker.postMessage({ type: 'pointer', x: -1000, y: -1000 });
      };
      
      const onLeave = () => {
        // notify worker of hover end
        hoverTargetRef.current = null;
        worker.postMessage({ type: 'hover', subtype: 'end' });
        // restore repulsion on hover end
        const { x, y } = mousePositionRef.current;
        worker.postMessage({ type: 'pointer', x, y });
      };

      buttons.forEach((button) => {
        button.addEventListener('mouseenter', onEnter);
        button.addEventListener('mouseleave', onLeave);
      });
      
      resizeCanvas();

      return () => {
        // terminate worker on cleanup
        if (typeof worker !== 'undefined' && worker) {
          worker.terminate();
        }
        window.removeEventListener('resize', debouncedResize);
        window.removeEventListener('mousemove', handleMouseMove);
        buttons.forEach((button) => {
          button.removeEventListener('mouseenter', onEnter);
          button.removeEventListener('mouseleave', onLeave);
        });
      }
      
    }, [pathname, imageMap, theme]);

    // Update worker theme when theme changes
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'theme', isDark: theme === 'dark' });
    }
  }, [theme]);

  // Smoothly follow scroll position
  useEffect(() => {
    const onScroll = () => {
      targetScrollRef.current = window.scrollY * 0.3;
    };
    const animate = () => {
      setScrollOffset(prev => {
        const diff = targetScrollRef.current - prev;
        return Math.abs(diff) < 0.1 ? targetScrollRef.current : prev + diff * 0.1;
      });
      requestAnimationFrame(animate);
    };
    animate();
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  
    return (
        <div>
            <canvas
                key="boids-canvas"
                ref={canvasRef}
                className="fixed top-0 left-0 w-screen h-screen opacity-40"
                style={{ transform: `translateY(${scrollOffset}px)` }}
            />

        </div>
        
    );
};
