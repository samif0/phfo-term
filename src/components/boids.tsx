'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useTheme } from './theme-provider';


// performance constants
const NEIGHBOR_RADIUS = 15;
const MAX_NEIGHBORS = 3;

const imageMap = {
  '/writings': '/images/writing-img.svg',
  '/thoughts': '/images/thought-img.svg',
  '/programs': '/images/programs-img.svg',
};

type Point = { x: number; y: number };

// cache for image point clouds by src|density|viewport size
const imageCloudCache = new Map<string, Point[]>();

async function getImagePointCloud(src: string, sw: number, sh: number, density = 9) {
  const cacheKey = `${src}|${density}|${sw}x${sh}`;
  if (imageCloudCache.has(cacheKey)) {
    return imageCloudCache.get(cacheKey)!;
  }
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
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
  const points: Point[] = [];
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

function getWordPointCloud(text: string, width: number, height: number, fontSize = 500, density = 9, maxWidthRatio = 0.9) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }
  canvas.width = width;
  canvas.height = height;

  // shrink the word until it fits, so it never runs off narrow screens
  ctx.font = `${fontSize}px sans-serif`;
  const textWidth = ctx.measureText(text).width;
  if (textWidth > width * maxWidthRatio) {
    ctx.font = `${Math.floor(fontSize * width * maxWidthRatio / textWidth)}px sans-serif`;
  }
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  const imageData = ctx.getImageData(0, 0, width, height);
  const points: Point[] = [];

  for (let y = 0; y < height; y += density) {
    for (let x = 0; x < width; x += density) {
      const index = (y * width + x) * 4;
      const alpha = imageData.data[index + 3];

      if (alpha > 128) {
        points.push({ x, y });
      }
    }
  }

  return points;
}

// thin evenly so the whole shape survives the cap, not just its top rows
function capPoints(points: Point[], maxPts: number) {
  if (points.length <= maxPts) return points;
  const stride = Math.ceil(points.length / maxPts);
  return points.filter((_, i) => i % stride === 0);
}

function getScreenSize(width: number): 'small' | 'medium' | 'large' {
  if (width <= 768) return 'small';
  if (width <= 1200) return 'medium';
  return 'large';
}

// 350px works on desktop but would cover an entire phone screen
function getInfluenceRadius(width: number, height: number) {
  return Math.min(350, Math.max(120, Math.round(Math.min(width, height) * 0.4)));
}


export default function Boids() {
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const themeRef = useRef(theme);

    //to reload boid + button animation to reattach listeners
    const pathname = usePathname();

    useEffect(() => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      // a canvas can only be transferred to a worker once, so every run gets its own
      const canvas = document.createElement('canvas');
      canvas.className = 'fixed top-0 left-0 w-screen h-screen opacity-40 pointer-events-none';
      container.appendChild(canvas);

      // size the bitmap to the element; h-screen tracks the large viewport on phones,
      // so the browser toolbar collapsing during scroll doesn't resize the canvas
      const measure = () => ({
        width: canvas.clientWidth || window.innerWidth,
        height: canvas.clientHeight || window.innerHeight,
      });

      const cellSize = NEIGHBOR_RADIUS * 2;
      // defer worker setup until we have loaded initial targets
      let worker: Worker | undefined;
      let disposed = false;
      let loadId = 0;
      let { width: lastWidth, height: lastHeight } = measure();
      canvas.width = lastWidth;
      canvas.height = lastHeight;

      let pointer: Point = { x: -1000, y: -1000 };
      let hoveredButton: Element | null = null;

      const route = pathname.replace(/\/$/, '');

      const toCanvas = (clientX: number, clientY: number): Point => {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (clientX - rect.left) * (lastWidth / rect.width),
          y: (clientY - rect.top) * (lastHeight / rect.height),
        };
      };

      // send free-move pointer position to worker for repulsion
      const setPointer = (p: Point) => {
        pointer = p;
        if (worker && !hoveredButton) worker.postMessage({ type: 'pointer', x: p.x, y: p.y });
      };

      const handlePointerMove = (e: PointerEvent) => {
        // touches are tracked separately so lifting a finger releases the boids
        if (e.pointerType === 'touch') return;
        setPointer(toCanvas(e.clientX, e.clientY));
      };

      const handleTouch = (e: TouchEvent) => {
        const touch = e.touches[0];
        setPointer(touch ? toCanvas(touch.clientX, touch.clientY) : { x: -1000, y: -1000 });
      };

      const resizeCanvas = async () => {
        const { width: newWidth, height: newHeight } = measure();
        const widthDiff = Math.abs(newWidth - lastWidth);
        const heightDiff = Math.abs(newHeight - lastHeight);
        const mouseInfluenceRadius = getInfluenceRadius(newWidth, newHeight);

        if (worker && widthDiff === 0 && heightDiff === 0) {
          return;
        }

        const smallViewportChange = widthDiff < 10 && heightDiff < 120;
        if (worker && smallViewportChange) {
          worker.postMessage({ type: 'viewport', width: newWidth, height: newHeight, mouseInfluenceRadius });
          lastWidth = newWidth;
          lastHeight = newHeight;
          return;
        }

        if (!worker) {
          canvas.width = newWidth;
          canvas.height = newHeight;
        }

        lastWidth = newWidth;
        lastHeight = newHeight;

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
          wordWidthRatio: number,
          maxPts: number
        ) {
          if (imgSrc) {
            try {
              const pts = await getImagePointCloud(imgSrc, newWidth, newHeight, imgDensity);
              return capPoints(pts, maxPts);
            } catch (err) {
              console.error('Failed to load image point cloud', err);
            }
          }
          const wp = getWordPointCloud("sami f.", newWidth, newHeight, wordFontSize, wordDensity, wordWidthRatio);
          return capPoints(wp, maxPts);
        }

        const sizeConfigs = {
          small: { imgDensity: imgD.small, wordFontSize: 160, wordDensity: wordD.small, wordWidthRatio: 0.75, maxPts: MAX_POINTS.small },
          medium: { imgDensity: imgD.medium, wordFontSize: 150, wordDensity: wordD.medium, wordWidthRatio: 0.9, maxPts: MAX_POINTS.medium },
          large: { imgDensity: imgD.large, wordFontSize: 300, wordDensity: wordD.large, wordWidthRatio: 0.9, maxPts: MAX_POINTS.large },
        };

        // always load a target point cloud: image (if available) or fallback word
        const cfg = sizeConfigs[getScreenSize(newWidth)];
        const id = ++loadId;
        const targetPoints = await loadTargetsForSize(
          imgSrc,
          cfg.imgDensity,
          cfg.wordFontSize,
          cfg.wordDensity,
          cfg.wordWidthRatio,
          cfg.maxPts
        );
        // unmounted, or a newer resize superseded this one while the image loaded
        if (disposed || id !== loadId) {
          return;
        }

        // notify worker of resize and new targets
        if (!worker) {
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
            targetPoints
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
          workerRef.current = worker;
          // Send initial theme
          worker.postMessage({ type: 'theme', isDark: themeRef.current === 'dark' });
        } else {
          worker.postMessage({ type: 'resize', width: newWidth, height: newHeight, mouseInfluenceRadius, targetPoints });
        }
      };

      let resizeTimer: NodeJS.Timeout;
      const debouncedResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { resizeCanvas(); }, 200);
      };

      const endHover = () => {
        // notify worker of hover end
        hoveredButton = null;
        worker?.postMessage({ type: 'hover', subtype: 'end' });
        // restore repulsion on hover end
        worker?.postMessage({ type: 'pointer', x: pointer.x, y: pointer.y });
      };

      // hovering a button pulls the swarm to it; touch has no hover, so only mice and pens.
      // delegated, so buttons that mount later (e.g. the scroll nav) work too
      const onPointerOver = (e: PointerEvent) => {
        if (e.pointerType === 'touch' || !(e.target instanceof Element)) return;
        const btn = e.target.closest('.mono-button');
        if (btn === hoveredButton) return;
        // also ends hovers on buttons that unmounted under the pointer
        if (hoveredButton) endHover();
        if (!btn) return;
        hoveredButton = btn;
        const rect = btn.getBoundingClientRect();
        const center = toCanvas(rect.left + rect.width / 2, rect.top + rect.height / 2);
        // notify worker of hover start (trigger attraction animation)
        worker?.postMessage({ type: 'hover', subtype: 'start', x: center.x, y: center.y });
        // disable repulsion during hover
        worker?.postMessage({ type: 'pointer', x: -1000, y: -1000 });
      };

      const onPointerOut = (e: PointerEvent) => {
        if (!hoveredButton) return;
        if (e.relatedTarget instanceof Node && hoveredButton.contains(e.relatedTarget)) return;
        endHover();
      };

      window.addEventListener('resize', debouncedResize);
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      window.addEventListener('touchstart', handleTouch, { passive: true });
      window.addEventListener('touchmove', handleTouch, { passive: true });
      window.addEventListener('touchend', handleTouch, { passive: true });
      window.addEventListener('touchcancel', handleTouch, { passive: true });
      document.addEventListener('pointerover', onPointerOver, { passive: true });
      document.addEventListener('pointerout', onPointerOut, { passive: true });

      resizeCanvas();

      return () => {
        disposed = true;
        clearTimeout(resizeTimer);
        // terminate worker on cleanup
        worker?.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        canvas.remove();
        window.removeEventListener('resize', debouncedResize);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('touchstart', handleTouch);
        window.removeEventListener('touchmove', handleTouch);
        window.removeEventListener('touchend', handleTouch);
        window.removeEventListener('touchcancel', handleTouch);
        document.removeEventListener('pointerover', onPointerOver);
        document.removeEventListener('pointerout', onPointerOut);
      }

    }, [pathname]);

    // Update worker theme when theme changes
  useEffect(() => {
    themeRef.current = theme;
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'theme', isDark: theme === 'dark' });
    }
  }, [theme]);

    return <div ref={containerRef} aria-hidden="true" />;
};
