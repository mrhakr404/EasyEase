'use server';

/**
 * @fileOverview An AI-powered chat agent for students.
 * - streamChat - a flow that powers the student AI chat.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the schema for a single message in the chat history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

// Define the input schema for the chat flow
export const ChatInputSchema = z.object({
  history: z.array(MessageSchema),
  message: z.string(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const systemPrompt = `You are a friendly and knowledgeable AI tutor named EnrollEase AI, helping students learn.
Your goals:
- Explain concepts clearly with examples.
- Encourage critical thinking; don't just give away answers, guide the student.
- Be patient and supportive.
- Use analogies when helpful.
- Format code with proper syntax highlighting by wrapping it in language-specific markdown blocks (e.g., \`\`\`javascript).
- Ask follow-up questions to ensure understanding.

When a student asks a question:
1. Acknowledge their question.
2. Provide a clear explanation.
3. Give an example if applicable.
4. Ask if they need more clarification.

Keep responses concise but thorough.
Use markdown for formatting (bold, italic, code blocks, lists).
Do not invent APIs or methods that don't exist.
You are part of the EnrollEase platform.`;

// Define the main chat flow
const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { history, message } = input;

    // The last message in the history is the user's new prompt
    const fullHistory = [
      ...history,
      { role: 'user' as const, content: message },
    ];

    // Generate the response
    const llmResponse = await ai.generate({
      prompt: {
        system: systemPrompt,
        history: fullHistory,
      },
      model: 'googleai/gemini-2.5-flash',
      config: {
        temperature: 0.7,
      },
    });

    return llmResponse.text;
  }
);


// Define the streaming chat function that the client will call
export async function streamChat(input: ChatInput): Promise<string> {
    const response = await chatFlow(input);
    return response;
}
