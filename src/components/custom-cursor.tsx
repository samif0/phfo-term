'use client';

import { useEffect, useRef } from 'react';

const NATIVE_CURSOR_TARGETS = [
  'input', 'textarea', 'select', 'iframe', 'video', 'audio',
  '[contenteditable]:not([contenteditable="false"])',
  '[draggable="true"]', ':disabled', '[aria-disabled="true"]',
  '[data-cursor="native"]',
].join(', ');

const INTERACTIVE_TARGETS = [
  'a[href]', 'button', 'summary', '[role="button"]', '[role="link"]',
  '[data-cursor="hover"]', '.cursor-pointer',
].join(', ');

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const root = document.documentElement;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const forcedColors = window.matchMedia('(forced-colors: active)');
    let frame: number | undefined;
    let position = { x: 0, y: 0 };
    let mousePresent = false;

    const hide = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      delete root.dataset.customCursor;
      cursor.dataset.visible = 'false';
      cursor.dataset.pressed = 'false';
    };

    const updateTarget = (target: EventTarget | null) => {
      if (!mousePresent || !finePointer.matches || forcedColors.matches ||
          !(target instanceof Element) || target.closest(NATIVE_CURSOR_TARGETS)) {
        hide();
        return;
      }

      // Crossing a control's text or icon should never reset its hover state.
      cursor.dataset.hover = String(Boolean(target.closest(INTERACTIVE_TARGETS)));
      if (frame === undefined) {
        frame = requestAnimationFrame(() => {
          cursor.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
          cursor.dataset.visible = 'true';
          root.dataset.customCursor = 'active';
          frame = undefined;
        });
      }
    };

    const move = (event: PointerEvent) => {
      mousePresent = event.pointerType === 'mouse';
      position = { x: event.clientX, y: event.clientY };
      updateTarget(event.target);
    };

    const press = (event: PointerEvent) => {
      move(event);
      if (event.pointerType === 'mouse' && event.button === 0) {
        cursor.dataset.pressed = 'true';
      }
    };

    const release = () => { cursor.dataset.pressed = 'false'; };
    const leave = () => {
      mousePresent = false;
      hide();
    };
    const pointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) leave();
    };
    const visibilityChange = () => {
      if (document.hidden) leave();
    };
    const refreshTarget = () => {
      updateTarget(document.elementFromPoint(position.x, position.y));
    };

    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', move, { passive: true });
    document.addEventListener('pointerout', pointerOut);
    document.addEventListener('pointerdown', press);
    document.addEventListener('pointerup', release);
    document.addEventListener('pointercancel', leave);
    document.addEventListener('visibilitychange', visibilityChange);
    document.addEventListener('scroll', refreshTarget, { passive: true, capture: true });
    window.addEventListener('blur', leave);
    finePointer.addEventListener('change', leave);
    forcedColors.addEventListener('change', leave);

    return () => {
      leave();
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', move);
      document.removeEventListener('pointerout', pointerOut);
      document.removeEventListener('pointerdown', press);
      document.removeEventListener('pointerup', release);
      document.removeEventListener('pointercancel', leave);
      document.removeEventListener('visibilitychange', visibilityChange);
      document.removeEventListener('scroll', refreshTarget, true);
      window.removeEventListener('blur', leave);
      finePointer.removeEventListener('change', leave);
      forcedColors.removeEventListener('change', leave);
    };
  }, []);

  return (
    <div ref={cursorRef} className="custom-cursor" aria-hidden="true">
      <span className="cursor-halo" />
      <span className="cursor-dot" />
    </div>
  );
}
