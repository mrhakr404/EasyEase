'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bot, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import type { Message } from '@/lib/types';
import { streamChat } from '@/ai/flows/chat-flow';
import {
  saveChatMessage,
  loadChatSession,
  createNewChatSession,
  deleteChatSession,
} from '@/lib/firebase/chatHistory';

export function ChatInterface() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isGenerating = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      if (user) {
        setIsLoading(true);
        const latestSession = await loadChatSession(user.uid);
        if (latestSession) {
          setMessages(latestSession.messages);
          setSessionId(latestSession.id);
        } else {
          const newSessionId = await createNewChatSession(user.uid, {
            role: 'assistant',
            content: 'Hi there! How can I help you today?',
          });
          setSessionId(newSessionId);
          setMessages([
            {
              id: 'initial',
              role: 'assistant',
              content: 'Hi there! How can I help you today?',
              timestamp: new Date(),
            },
          ]);
        }
        setIsLoading(false);
      }
    };
    initializeChat();
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    isGenerating.current = true;

    await saveChatMessage(user.uid, sessionId, userMessage);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      const history = messages.map((msg) => ({
        role: msg.role === 'user' ? ('user' as const) : ('model' as const),
        content: msg.content,
      }));

      const responseText = await streamChat({ history, message: input });
      
      // Check if a chat clear was requested while waiting
      if (!isGenerating.current) return;

      const finalAiMessage = {
          ...aiMessage,
          content: responseText,
          isStreaming: false,
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiMessage.id ? finalAiMessage : msg))
      );

      await saveChatMessage(user.uid, sessionId, finalAiMessage);

    } catch (error) {
      console.error('Error streaming chat:', error);
      // Check if a chat clear was requested while waiting
      if (!isGenerating.current) return;

      const errorMessage = {
          ...aiMessage,
          content: 'Sorry, I ran into an error. Please try again.',
          isStreaming: false,
          error: true,
      };
      setMessages(prev => prev.map(msg => msg.id === aiMessage.id ? errorMessage : msg));
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to get a response from the AI.',
      });
    } finally {
      setIsLoading(false);
      isGenerating.current = false;
    }
  };
  
  const handleClearChat = async () => {
    if (!user || !sessionId) return;
    setIsLoading(true);
    isGenerating.current = false; // Stop any ongoing generation from updating state

    try {
        await deleteChatSession(user.uid, sessionId);
        const newSessionId = await createNew_chat_session(user.uid);
        setSessionId(newSessionId);
    } catch(error) {
        console.error("Error clearing chat", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not clear chat history."
        })
    } finally {
        setIsLoading(false);
    }
  };

  async function createNew_chat_session(userId: string) {
    const newSessionId = await createNewChatSession(userId, {
        role: 'assistant',
        content: 'Hi there! How can I help you today?',
    });
    setMessages([
        {
            id: 'initial',
            role: 'assistant',
            content: 'Chat cleared. How can I help you now?',
            timestamp: new Date(),
        },
    ]);
    return newSessionId;
}

  return (
    <Card className="h-full w-full flex flex-col bg-transparent border-0 shadow-none">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
            <Bot className="w-7 h-7 text-primary" />
            <h1 className="text-xl font-bold font-headline">AI Learning Assistant</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClearChat} disabled={isLoading}>
            <Trash2 className="w-5 h-5" />
            <span className="sr-only">Clear Chat</span>
        </Button>
      </header>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && messages[messages.length-1]?.role === 'user' && <TypingIndicator />}
      </CardContent>

      <ChatInput
        input={input}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </Card>
  );
}
