"use client";

import dynamic from 'next/dynamic';

const CursorEffect = dynamic(() =>
  import('@/components/ui/CursorEffect').then((mod) => mod.CursorEffect),
  { ssr: false }
);

export function ClientCursorEffect() {
  return <CursorEffect />;
}
