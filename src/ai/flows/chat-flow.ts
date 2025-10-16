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
    input: { schema: ChatRequestSchema },
    system: `You are an expert personal tutor named EnrollEase AI. Your goal is to help students understand concepts, not just give them answers. Engage in a Socratic dialogue. When a student asks a question, guide them with leading questions to help them arrive at the answer themselves. Keep your responses concise and encouraging. Analyze the provided chat history to understand the context of the conversation.`,
    prompt: `{{#if history}}
Chat History:
{{#each history}}
  {{#if (eq role 'user')}}
    Student: {{{text}}}
  {{else}}
    Tutor: {{{text}}}
  {{/if}}
{{/each}}
{{/if}}

New Question: {{{currentMessage.text}}}

Tutor:
`,
  },
);

export async function continueChat(request: ChatRequest): Promise<MessageData> {
  const { text } = await ai.run(tutorPrompt, { input: request });
  
  return {
      role: 'model' as const,
      text: text,
  };
}
