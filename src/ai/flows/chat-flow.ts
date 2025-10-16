'use server';

/**
 * @fileOverview A personalized AI tutor chat flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ChatRequestSchema, type ChatRequest, MessageDataSchema } from '@/lib/types';


const prompt = ai.definePrompt(
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

const continueChatFlow = ai.defineFlow(
    {
        name: 'continueChatFlow',
        inputSchema: ChatRequestSchema,
        outputSchema: MessageDataSchema
    },
    async (request) => {
        const { response } = await ai.generate({
            prompt: prompt,
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
);


export async function continueChat(request: ChatRequest): Promise<{role: 'model'; text: string}> {
  'use server';
  return await continueChatFlow(request);
}
