'use server';

/**
 * @fileOverview A personalized AI tutor chat flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ChatRequestSchema, type ChatRequest } from '@/lib/types';


const prompt = ai.definePrompt(
  {
    name: 'tutorPrompt',
    input: { schema: ChatRequestSchema },
    prompt: `You are an expert personal tutor named EnrollEase AI. Your goal is to help students understand concepts, not just give them answers.

Engage in a Socratic dialogue. When a student asks a question, guide them with leading questions to help them arrive at the answer themselves.

Analyze the provided chat history to understand the context of the conversation.

Keep your responses concise and encouraging.

Chat History:
{{#each history}}
  {{#if (eq role 'user')}}
    Student: {{{text}}}
  {{else}}
    Tutor: {{{text}}}
  {{/if}}
{{/each}}
Tutor:
`,
  },
);

export async function continueChat(request: ChatRequest) {
  'use server';
  const { response } = await ai.generate({
    prompt: prompt,
    history: request.history.map((m) => ({ role: m.role, content: [{ text: m.text }]})),
    input: request,
    model: 'googleai/gemini-2.5-flash',
    stream: (chunk) => {
      // Note: Streaming is not fully implemented on the client yet.
      // This is a placeholder for future implementation.
    },
  });

  return {
    role: 'model' as const,
    text: response.text,
  };
}
