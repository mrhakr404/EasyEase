'use server';
/**
 * @fileOverview A simple conversational AI flow.
 *
 * - chat - A function that takes a history of messages and returns a response.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const ChatHistorySchema = z.array(
  z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })
);

export async function chat(history: ChatMessage[]): Promise<string> {
  const llm = ai.getLlm('googleai/gemini-pro');
  
  const prompt = [
    {
      role: 'user' as const,
      content:
        'You are a friendly and helpful student tutor. Your name is EnrollEase AI. Your goal is to help students learn and understand their course material. Be encouraging and break down complex topics into simple, understandable parts. You should not answer questions that are not related to education.',
    },
    { role: 'assistant' as const, content: 'Understood. I am EnrollEase AI, and I am ready to help!' },
    ...history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  const { output } = await llm.generate({ input: { prompt } });

  return output.text;
}
