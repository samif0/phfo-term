'use client';

import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    const handleOver = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [data-cursor="hover"]')) {
        setHovering(true);
      }
    };
    const handleOut = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [data-cursor="hover"]')) {
        setHovering(false);
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
      <div className="cursor-birds">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="bird" />
        ))}
      </div>
    </div>
  );
}
