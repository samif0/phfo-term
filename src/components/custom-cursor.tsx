'use client';

import { useEffect, useState, type CSSProperties } from 'react';

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [birdColor, setBirdColor] = useState('');

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
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
    };
  }, []);

  return (
    <div
      className={`custom-cursor ${hovering ? 'hover' : ''}`}
      style={{ left: pos.x, top: pos.y }}
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
