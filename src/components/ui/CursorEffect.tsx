"use client";

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface CursorEffectProps {
  cursorColor?: string;
  intensity?: number;
  enableHalo?: boolean;
  enableRipple?: boolean;
}

export function CursorEffect({
  cursorColor = 'hsl(45 100% 70%)',
  intensity = 1,
  enableHalo = true,
  enableRipple = true,
}: CursorEffectProps) {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [clickKey, setClickKey] = useState(0);
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
      const targetIsInteractive = e.target.closest('button, a, [role="button"], input, textarea, select');
      setIsInteractive(!!targetIsInteractive);
      setIsPointer(!!targetIsInteractive);
    } else {
      setIsInteractive(false);
      setIsPointer(false);
    }
  }, []);

  const onMouseDown = useCallback(() => {
    setIsClicking(true);
    setClickKey(prev => prev + 1);
    setTimeout(() => setIsClicking(false), 500);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mousedown', onMouseDown);

      return () => {
        document.body.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mousedown', onMouseDown);
      };
    }
  }, [onMouseMove, onMouseDown]);
  
  if (!isClient || isReducedMotion) {
    return null;
  }

  const haloSize = 256 * intensity;
  const cursorSize = 32;
  const rippleSize = 32;

  const haloStyle = {
    '--cursor-color': cursorColor,
    left: `${position.x}px`,
    top: `${position.y}px`,
  } as React.CSSProperties;

  return (
    <>
      {/* Halo Effect */}
      {enableHalo && (
        <div
          style={{ ...haloStyle, width: `${haloSize}px`, height: `${haloSize}px` }}
          className={cn(
            'pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-300 z-[9999]',
            'bg-[var(--cursor-color)] opacity-10 blur-3xl',
            isInteractive ? 'scale-100' : 'scale-0'
          )}
        />
      )}
      
      {/* Click Ripple Effect */}
      {enableRipple && (
        <div
          key={clickKey}
          style={{ ...haloStyle, width: `${rippleSize}px`, height: `${rippleSize}px` }}
          className={cn(
            'pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full z-[9999]',
            'border-2 border-[var(--cursor-color)]',
            isClicking ? 'animate-ripple' : 'scale-0 opacity-0'
          )}
        />
      )}

      {/* Main Cursor Dot */}
      <div
        style={{ ...haloStyle, width: `${cursorSize}px`, height: `${cursorSize}px` }}
        className={cn(
          'pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full z-[9999]',
          'bg-[var(--cursor-color)]',
          'transition-transform duration-200',
          isInteractive ? 'scale-0.5' : 'scale-0.25',
          isClicking ? 'scale-0.4' : ''
        )}
      />
    </>
  );
}

// We need to define the animation in globals.css or via a style tag,
// but for simplicity with the current setup, we'll inject it.
// In a real app, this would be in the CSS file.
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes ripple {
      0% {
        transform: scale(1);
        opacity: 0.8;
      }
      100% {
        transform: scale(3);
        opacity: 0;
      }
    }
    .animate-ripple {
      animation: ripple 0.5s ease-out forwards;
    }
  `;
  document.head.appendChild(style);
}
