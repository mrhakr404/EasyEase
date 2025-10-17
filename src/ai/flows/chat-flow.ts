'use server';

/**
 * @fileOverview A personalized AI tutor chat flow.
 */

import { ai } from '@/ai/genkit';
import { ChatRequestSchema, type ChatRequest, type MessageData } from '@/lib/types';
import { z } from 'zod';

const tutorPrompt = ai.definePrompt(
  {
    name: 'tutorPrompt',
    system: `You are an expert personal tutor named EnrollEase AI. Your goal is to help students understand concepts, not just give them answers. Engage in a Socratic dialogue. When a student asks a question, guide them with leading questions to help them arrive at the answer themselves. Keep your responses concise and encouraging. Analyze the provided chat history to understand the context of the conversation.`,
  },
);

export async function continueChat(request: ChatRequest): Promise<MessageData> {
  const history = request.history.map(m => ({role: m.role, content: [{text: m.text}]}));
  const currentMessage = { role: 'user', content: [{ text: request.currentMessage.text }] };

  const response = await ai.generate({
    prompt: tutorPrompt,
    history: [...history, currentMessage],
    model: 'googleai/gemini-2.5-flash',
  });

  const text = response.text;
  
  return {
      role: 'model' as const,
      text: text,
  };
}
