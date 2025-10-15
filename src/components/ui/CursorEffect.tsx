"use client";

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export function CursorEffect() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

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
    if (e.target instanceof Element) {
      const targetIsInteractive = e.target.closest('button, a, [role="button"]');
      setIsInteractive(!!targetIsInteractive);
    } else {
      setIsInteractive(false);
    }
  }, []);

  const onMouseOver = useCallback((e: MouseEvent) => {
    if (e.target instanceof Element) {
      const targetIsInteractive = e.target.closest('button, a, [role="button"]');
      setIsPointer(true);
      setIsInteractive(!!targetIsInteractive);
    }
  }, []);

  const onMouseOut = useCallback(() => {
    setIsPointer(false);
    setIsInteractive(false);
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
      document.body.addEventListener('mouseover', onMouseOver);
      document.body.addEventListener('mouseout', onMouseOut);
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);

      return () => {
        document.body.removeEventListener('mousemove', onMouseMove);
        document.body.removeEventListener('mouseover', onMouseOver);
        document.body.removeEventListener('mouseout', onMouseOut);
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [onMouseMove, onMouseOver, onMouseOut, onMouseDown, onMouseUp]);
  
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
          'pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-300 z-[9999]',
          'bg-[var(--cursor-glow-color)] opacity-10 blur-3xl',
          isInteractive ? 'scale-100' : 'scale-0',
          'h-64 w-64'
        )}
      />
       <div
        style={haloStyle}
        className={cn(
          'pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full z-[9999]',
          'border-2 border-[var(--cursor-ripple-color)]',
          'transition-all duration-500 ease-out',
          isClicking ? 'scale-[2.5] opacity-0' : 'scale-0 opacity-0',
          'h-8 w-8'
        )}
      />
      <div
        style={haloStyle}
        className={cn(
          'pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full z-[9999]',
          'border-2 border-[var(--cursor-halo-color)]',
          'transition-transform duration-200',
          isPointer ? 'scale-100' : 'scale-0',
          isInteractive ? 'scale-110' : 'scale-100',
          isClicking ? 'scale-90' : '',
          'h-8 w-8'
        )}
      />
    </>
  );
}
