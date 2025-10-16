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
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      if (user) {
        setIsLoading(true);
        try {
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
        } catch (error) {
            console.error("Failed to initialize chat:", error);
            toast({
                variant: 'destructive',
                title: 'Could not load chat',
                description: 'Please refresh the page to try again.'
            })
        } finally {
            setIsLoading(false);
        }
      }
    };
    initializeChat();
  }, [user, toast]);

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
    setIsGenerating(true);

    await saveChatMessage(user.uid, sessionId, userMessage);

    const aiMessagePlaceholder: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, aiMessagePlaceholder]);

    try {
      const history = messages.map((msg) => ({
        role: msg.role === 'user' ? ('user' as const) : ('model' as const),
        content: msg.content,
      }));

      const responseText = await streamChat({ history, message: input });
      
      const finalAiMessage: Message = {
          ...aiMessagePlaceholder,
          content: responseText,
          isStreaming: false,
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiMessagePlaceholder.id ? finalAiMessage : msg))
      );

      await saveChatMessage(user.uid, sessionId, finalAiMessage);

    } catch (error) {
      console.error('Error streaming chat:', error);
      const errorMessage: Message = {
          ...aiMessagePlaceholder,
          content: 'Sorry, I ran into an error. Please try again.',
          isStreaming: false,
          error: true,
      };
      setMessages(prev => prev.map(msg => msg.id === aiMessagePlaceholder.id ? errorMessage : msg));
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to get a response from the AI.',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleClearChat = async () => {
    if (!user || !sessionId || isGenerating) return;
    
    setIsLoading(true);
    try {
        await deleteChatSession(user.uid, sessionId);
        const newSessionId = await createNewChatSession(user.uid, {
            role: 'assistant',
            content: 'Hi there! How can I help you now?',
        });
        setSessionId(newSessionId);
        setMessages([
            {
                id: 'initial-cleared',
                role: 'assistant',
                content: 'Chat cleared. How can I help you now?',
                timestamp: new Date(),
            },
        ]);
        toast({
            title: "Chat cleared",
            description: "Your conversation history has been deleted."
        })
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

  return (
    <Card className="h-full w-full flex flex-col bg-transparent border-0 shadow-none">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
            <Bot className="w-7 h-7 text-primary" />
            <h1 className="text-xl font-bold font-headline">AI Learning Assistant</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClearChat} disabled={isLoading || isGenerating}>
            <Trash2 className="w-5 h-5" />
            <span className="sr-only">Clear Chat</span>
        </Button>
      </header>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {isLoading && !messages.length ? (
            <div className="flex justify-center items-center h-full">
                <TypingIndicator />
            </div>
        ) : (
            messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
            ))
        )}
        {isGenerating && <TypingIndicator />}
      </CardContent>

      <ChatInput
        input={input}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        isLoading={isGenerating}
      />
    </Card>
  );
}
