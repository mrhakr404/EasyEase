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
import type { Message, ChatInput as ChatInputType } from '@/lib/types';
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
  const [isLoading, setIsLoading] = useState(true); // Manages loading state for chat initialization
  const [isGenerating, setIsGenerating] = useState(false); // Manages AI response generation state
  const [sessionId, setSessionId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to the bottom of the chat on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  // Effect to initialize the chat session on component mount
  useEffect(() => {
    const initializeChat = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Try to load the most recent chat session
        const latestSession = await loadChatSession(user.uid);
        if (latestSession) {
          setMessages(latestSession.messages);
          setSessionId(latestSession.id);
        } else {
          // If no session exists, create a new one with a welcome message
          const welcomeMessage = { role: 'assistant' as const, content: 'Hi there! How can I help you today?' };
          const newSessionId = await createNewChatSession(user.uid, welcomeMessage);
          setSessionId(newSessionId);
          setMessages([
            {
              id: 'initial-welcome',
              ...welcomeMessage,
              timestamp: new Date(),
            },
          ]);
        }
      } catch (error) {
          console.error("Failed to initialize chat:", error);
          toast({
              variant: 'destructive',
              title: 'Could not load chat history',
              description: 'Please check your permissions or refresh the page.'
          })
      } finally {
          setIsLoading(false);
      }
    };
    initializeChat();
  }, [user, toast]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !sessionId || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    // Optimistically update UI with user's message
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    // Save user message to Firestore non-blockingly
    saveChatMessage(user.uid, sessionId, userMessage);
    
    try {
      // Prepare history for the AI model
      const history = messages.map((msg) => ({
        role: msg.role === 'user' ? ('user' as const) : ('model' as const),
        content: msg.content,
      }));

      const chatInput: ChatInputType = { history, message: input };
      
      // Get AI response
      const responseText = await streamChat(chatInput);
      
      const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
      };

      // Update UI with final AI message
      setMessages((prev) => [...prev, aiMessage]);

      // Save AI message to Firestore non-blockingly
      saveChatMessage(user.uid, sessionId, aiMessage);

    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I ran into an error. Please try again.',
          timestamp: new Date(),
          error: true,
      };
      setMessages(prev => [...prev, errorMessage]);
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
    if (!user || !sessionId || isGenerating || isLoading) return;
    
    setIsLoading(true);
    try {
        await deleteChatSession(user.uid, sessionId);
        
        // After deleting, create a new fresh session
        const welcomeMessage = { role: 'assistant' as const, content: 'Chat cleared. How can I help you now?' };
        const newSessionId = await createNewChatSession(user.uid, welcomeMessage);
        
        setSessionId(newSessionId);
        setMessages([
            {
                id: 'cleared-welcome',
                ...welcomeMessage,
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
            description: "Could not clear chat history. Please check permissions."
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
        {isLoading ? (
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
