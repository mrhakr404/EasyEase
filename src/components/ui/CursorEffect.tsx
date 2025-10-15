"use client";

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export function CursorEffect() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

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

  const onMouseDown = () => {
    setIsClicked(true);
  };

  const onMouseUp = () => {
    setIsClicked(false);
  };

  useEffect(() => {
    document.body.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('mousedown', onMouseDown);
    document.body.addEventListener('mouseup', onMouseUp);

    return () => {
      document.body.removeEventListener('mousemove', onMouseMove);
      document.body.removeEventListener('mousedown', onMouseDown);
      document.body.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove]);

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
        'border-2 border-yellow-300',
        'transition-all duration-200',
        isClicked ? 'scale-110' : '',
        isPointer ? 'h-8 w-8 shadow-[0_0_15px_2px_rgba(250,204,21,0.7)]' : 'h-7 w-7'
      )}
    />
  );
}
