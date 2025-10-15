"use client";

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function CursorEffect() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

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
    const target = e.target as Element;
    if (target) {
      setIsPointer(!!target.closest('button, a, [role="button"], input, textarea, select'));
    }
  }, []);
  
  const onMouseDown = (e: MouseEvent) => {
    setIsClicked(true);
    if (!isReducedMotion) {
      setRipples((prev) => [...prev, { id: Date.now(), x: e.clientX, y: e.clientY }]);
    }
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

  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples((prev) => prev.slice(1));
      }, 500); // Corresponds to animation duration
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  if (isReducedMotion) {
    return null;
  }

  return (
    <>
      <div
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        className={cn(
          'pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full z-[9999]',
          'border-2 border-yellow-300',
          'transition-[height,width,box-shadow,transform] duration-200',
          isClicked ? 'scale-110' : '',
          isPointer ? 'h-8 w-8 shadow-[0_0_15px_2px_rgba(250,204,21,0.7)]' : 'h-7 w-7'
        )}
      />
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="pointer-events-none fixed z-[9999] animate-ripple rounded-full border border-yellow-300"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </>
  );
}
