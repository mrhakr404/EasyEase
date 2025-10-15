"use client";

import dynamic from 'next/dynamic';
import { CursorEffectProps } from './CursorEffect';

const CursorEffect = dynamic(() =>
  import('@/components/ui/CursorEffect').then((mod) => mod.CursorEffect),
  { ssr: false }
);

export function ClientCursorEffect(props: CursorEffectProps) {
  return <CursorEffect {...props} />;
}
