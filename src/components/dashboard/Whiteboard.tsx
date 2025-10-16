'use client';

import { Tldraw } from '@tldraw/tldraw';

export function Whiteboard() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw />
    </div>
  );
}
