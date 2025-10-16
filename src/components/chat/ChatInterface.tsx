'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFirestore } from '@/firebase';
import { chat } from '@/ai/flows/chat-flow';
import {
  createChatSession,
  loadChatSession,
  updateChatSession,
} from '@/lib/firebase/chatHistory';
import type { Message } from '@/lib/types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot } from 'lucide-react';

export function ChatInterface() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isNewSession, setIsNewSession] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeChat = async () => {
      if (!user || !firestore) return;
      setIsLoading(true);
      try {
        const { sessionId: loadedSessionId, messages: loadedMessages } = await loadChatSession(firestore, user.uid);
        setSessionId(loadedSessionId);
        setMessages(loadedMessages);
        if (loadedMessages.length === 0) {
          setIsNewSession(true);
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to load chat session. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    initializeChat();
  }, [user, firestore]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !firestore) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    let currentSessionId = sessionId;

    try {
      if (!currentSessionId) {
        const newSessionId = await createChatSession(firestore, user.uid, userMessage);
        setSessionId(newSessionId);
        currentSessionId = newSessionId;
        setIsNewSession(false);
      } else {
        await updateChatSession(firestore, user.uid, currentSessionId, userMessage);
      }

      const history = messages.map(m => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: userMessage.content });

      const aiResponse = await chat(history);

      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };

      await updateChatSession(firestore, user.uid, currentSessionId, assistantMessage);
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (err) {
      console.error('Message sending error:', err);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg shadow-lg">
      <div className="p-4 border-b flex items-center gap-3">
        <Bot className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold font-headline">AI Assistant</h2>
      </div>
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {isNewSession && !isLoading && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="w-12 h-12 mx-auto mb-4"/>
              <p className="text-lg font-medium">Welcome!</p>
              <p>How can I help you with your studies today?</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
        </div>
      </ScrollArea>
      <ChatInput
        input={input}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
