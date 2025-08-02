'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';


export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  // useRef requires an initial value; we start with undefined to store the
  // requestAnimationFrame id once it's set.
  const rafId = useRef<number | undefined>(undefined);
  const [hovering, setHovering] = useState(false);
  const [birdColor, setBirdColor] = useState('');

  useEffect(() => {
    const updatePosition = () => {
      if (cursorRef.current) {
        const { x, y } = pos.current;
        cursorRef.current.style.left = `${x}px`;
        cursorRef.current.style.top = `${y}px`;
      }
      rafId.current = undefined;
    };
    const handleMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (rafId.current === undefined) {
        rafId.current = requestAnimationFrame(updatePosition);
      }
    };
    const handleOver = (e: Event) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest('a, button, [data-cursor="hover"]') as
        | HTMLElement
        | null;
      if (interactive) {
        const styles = window.getComputedStyle(interactive);
        let base = styles.backgroundColor;
        if (!base || base === 'rgba(0, 0, 0, 0)' || base === 'transparent') {
          base = styles.color;
        }
        const rgb = base.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
        const luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
        setBirdColor(luminance > 186 ? '#000' : '#fff');
        setHovering(true);
      }
    };
    const handleOut = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [data-cursor="hover"]')) {
        setHovering(false);
        setBirdColor('');
      }
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerover', handleOver);
    document.addEventListener('pointerout', handleOut);
    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerover', handleOver);
      document.removeEventListener('pointerout', handleOut);
      if (rafId.current !== undefined) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className={`custom-cursor ${hovering ? 'hover' : ''}`}
    >
      <svg className="cursor-outer" width="24" height="24">
        <circle cx="12" cy="12" r="11" />
      </svg>
      <div className="cursor-inner" />
      <div
        className="cursor-birds"
        style={{ '--bird-color': birdColor } as CSSProperties}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="bird" />
        ))}
      </div>
    </div>
  );
}
