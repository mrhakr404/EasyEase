"use client";

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export function CursorEffect() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(reducedMotionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    reducedMotionQuery.addEventListener('change', handleMotionChange);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
    if (e.target instanceof Element) {
      setIsPointer(!!e.target.closest('button, a, [role="button"], input, textarea, select'));
    } else {
      setIsPointer(false);
    }
  }, []);

  const onMouseDown = useCallback(() => {
    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 200);
  }, []);

  useEffect(() => {
    document.body.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);

    return () => {
      document.body.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, [onMouseMove, onMouseDown]);

  if (isReducedMotion) {
    return null;
  }

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className={cn(
        'pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full z-[9999]',
        'bg-yellow-300/40',
        'transition-transform duration-200',
        isPointer ? 'scale-50 h-12 w-12' : 'h-8 w-8',
        isClicking ? 'scale-[0.4] h-12 w-12' : ''
      )}
    />
  );
}
