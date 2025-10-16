'use client';

import React from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function AIChatPage() {
  return (
    <div className="h-full w-full flex flex-col">
        <ChatInterface />
    </div>
  );
}
