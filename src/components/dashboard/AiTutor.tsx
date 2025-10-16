'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BrainCircuit, Send, User as UserIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { continueChat } from '@/ai/flows/chat-flow';
import { saveChatMessage } from '@/lib/firebase/chat';
import type { ChatMessage, MessageData } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

const SESSION_ID = 'default_tutor_session'; // In a real app, this would be dynamic

export function AiTutor() {
  const { user, profile } = useAuth();
  const firestore = useFirestore();
  const [input, setInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `userProfiles/${user.uid}/chatSessions/${SESSION_ID}/messages`),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
  }, [user, firestore]);

  const { data: messages, isLoading } = useCollection<ChatMessage>(messagesQuery);
  
  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
        setTimeout(() => {
            const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || !firestore) return;
    const userMessage = input;
    setInput('');

    // Optimistically save user message
    const userMessageData: MessageData = { role: 'user', text: userMessage };
    saveChatMessage(firestore, user.uid, SESSION_ID, userMessageData);

    setIsResponding(true);
    
    try {
        const history: MessageData[] = messages ? messages.map(m => ({ role: m.role, text: m.text })) : [];
        const aiResponse = await continueChat({ history: history, currentMessage: userMessageData });
        
        // Save AI response
        saveChatMessage(firestore, user.uid, SESSION_ID, aiResponse);
    } catch(e) {
        console.error("Error calling AI tutor:", e);
        // Optionally save an error message to the chat
        saveChatMessage(firestore, user.uid, SESSION_ID, {
            role: 'model',
            text: "I'm sorry, I encountered an error. Please try again in a moment."
        });
    } finally {
        setIsResponding(false);
    }

  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : names[0][0].toUpperCase();
  };

  return (
    <div className="flex flex-col h-full gap-4 animate-fade-in">
        <div className="flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">AI Personal Tutor</h1>
        </div>
      <Card className="flex flex-col flex-1">
        <CardContent className="flex-1 flex flex-col p-6">
          <ScrollArea className="flex-1 pr-4 -mr-4" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages?.map((message, index) => (
                <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : '')}>
                  {message.role === 'model' && (
                    <Avatar className="w-8 h-8 border-2 border-primary">
                      <AvatarFallback><BrainCircuit className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("max-w-md p-3 rounded-lg", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                    <ReactMarkdown className="prose prose-sm dark:prose-invert prose-p:my-0">{message.text}</ReactMarkdown>
                  </div>
                   {message.role === 'user' && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.photoURL ?? ''} />
                      <AvatarFallback>{getInitials(profile?.firstName)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isResponding && (
                 <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 border-2 border-primary">
                        <AvatarFallback><Loader2 className="w-4 h-4 animate-spin" /></AvatarFallback>
                    </Avatar>
                     <div className="max-w-md p-3 rounded-lg bg-muted">
                        <p className="text-sm italic">AI Tutor is thinking...</p>
                     </div>
                 </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <div className="p-4 border-t">
          <div className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isResponding && handleSend()}
              placeholder="Ask your AI Tutor anything..."
              className="pr-12"
              disabled={isResponding}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={handleSend}
              disabled={isResponding || !input.trim()}
            >
              {isResponding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
