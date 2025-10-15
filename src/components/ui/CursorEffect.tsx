"use client";

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export function CursorEffect() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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
  }, []);

  const onMouseEnter = useCallback(() => {
    setIsPointer(true);
  }, []);
  
  const onMouseLeave = useCallback(() => {
    setIsPointer(false);
  }, []);

  const onMouseDown = useCallback(() => {
    setIsClicking(true);
  }, []);

  const onMouseUp = useCallback(() => {
    setIsClicking(false);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.addEventListener('mousemove', onMouseMove);
      document.body.addEventListener('mouseenter', onMouseEnter);
      document.body.addEventListener('mouseleave', onMouseLeave);
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);

      return () => {
        document.body.removeEventListener('mousemove', onMouseMove);
        document.body.removeEventListener('mouseenter', onMouseEnter);
        document.body.removeEventListener('mouseleave', onMouseLeave);
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [onMouseMove, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp]);
  
  if (!isClient || isReducedMotion) {
    return null;
  }

  const haloStyle = {
    '--cursor-glow-color': 'hsl(45 100% 70%)',
    '--cursor-ripple-color': 'hsl(45 100% 80%)',
    '--cursor-halo-color': 'hsl(45 100% 60%)',
    left: `${position.x}px`,
    top: `${position.y}px`,
  } as React.CSSProperties;

  return (
    <>
      <div
        style={haloStyle}
        className={cn(
          'pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-500',
          'bg-[var(--cursor-glow-color)] opacity-10 blur-3xl',
          isPointer ? 'scale-100' : 'scale-0',
          'h-64 w-64 z-30'
        )}
      />
       <div
        style={haloStyle}
        className={cn(
          'pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full',
          'border-2 border-[var(--cursor-ripple-color)]',
          'transition-all duration-500 ease-out',
          isClicking ? 'scale-125 opacity-0' : 'scale-0 opacity-0',
          'h-24 w-24 z-30'
        )}
      />
      <div
        style={haloStyle}
        className={cn(
          'pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full',
          'border border-[var(--cursor-halo-color)]',
          'transition-transform duration-200',
          isPointer ? 'scale-100' : 'scale-0',
          'h-10 w-10 z-30'
        )}
      />
    </>
  );
}
