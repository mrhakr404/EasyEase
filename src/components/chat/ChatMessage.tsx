'use client';

import React from 'react';
import { cva } from 'class-variance-authority';
import { Bot, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CodeBlock } from './CodeBlock';
import ReactMarkdown from 'react-markdown';

const messageVariants = cva('flex items-start gap-4 p-4 rounded-xl max-w-3xl', {
  variants: {
    role: {
      user: 'ml-auto bg-primary/90 text-primary-foreground',
      assistant: 'bg-card border',
      system: 'justify-center mx-auto bg-muted text-muted-foreground text-xs',
    },
    error: {
      true: 'bg-destructive/20 border-destructive text-destructive-foreground',
      false: '',
    },
  },
});

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { role, content, timestamp, error, isStreaming } = message;

  const renderAvatar = () => {
    if (role === 'user') {
      return (
        <Avatar className="w-8 h-8 border">
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      );
    }
    return (
      <Avatar className="w-8 h-8 bg-primary text-primary-foreground">
        <AvatarFallback>
          <Bot />
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div className={cn('flex items-start gap-3', role === 'user' && 'justify-end')}>
      {role !== 'user' && renderAvatar()}
      <div
        className={cn(
          'flex flex-col',
          role === 'user' ? 'items-end' : 'items-start'
        )}
      >
        <div className={cn(messageVariants({ role, error: !!error }))}>
          <div className="text-base space-y-4">
             <ReactMarkdown
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return match ? (
                    <CodeBlock
                      language={match[1]}
                      value={String(children).replace(/\n$/, '')}
                    />
                  ) : (
                    <code className="bg-muted px-1 rounded-sm" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
            {isStreaming && <span className="animate-pulse">▍</span>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1 px-2">
          {format(new Date(timestamp), 'h:mm a')}
        </p>
      </div>
      {role === 'user' && renderAvatar()}
    </div>
  );
}
