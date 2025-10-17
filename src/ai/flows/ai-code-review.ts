'use server';

/**
 * @fileOverview An AI-powered code review tool for students.
 *
 * - aiCodeReview - A function that handles the code review process.
 * - AICodeReviewInput - The input type for the aiCodeReview function.
 * - AICodeReviewOutput - The return type for the aiCodeReview function.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';

const AICodeReviewInputSchema = z.object({
  code: z.string().describe('The code snippet to be reviewed.'),
  language: z.string().describe('The programming language of the code snippet.'),
  instructions: z.string().optional().describe('Any specific instructions or context for the review.'),
});
export type AICodeReviewInput = z.infer<typeof AICodeReviewInputSchema>;

const AICodeReviewOutputSchema = z.object({
  suggestions: z.string().describe('The AI-powered suggestions for improving the code snippet.'),
  reasoning: z.string().optional().describe('The reasoning behind the suggestions.'),
});
export type AICodeReviewOutput = z.infer<typeof AICodeReviewOutputSchema>;

export async function aiCodeReview(input: AICodeReviewInput): Promise<AICodeReviewOutput> {
  return aiCodeReviewFlow(input);
}

const aiCodeReviewPrompt = ai.definePrompt({
  name: 'aiCodeReviewPrompt',
  input: { schema: AICodeReviewInputSchema },
  output: { schema: AICodeReviewOutputSchema },
  prompt: `You are an expert code reviewer. Analyze the following code snippet and provide suggestions for improvement.

Language: {{{language}}}
Code:
\`\`\`{{{code}}}\`\`\`

Instructions: {{{instructions}}}

Provide suggestions for improving code quality, performance, and security. Explain your reasoning behind each suggestion. Focus on best practices and common pitfalls in the given language.
`,
});

const aiCodeReviewFlow = ai.defineFlow(
  {
    name: 'aiCodeReviewFlow',
    inputSchema: AICodeReviewInputSchema,
    outputSchema: AICodeReviewOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({ prompt: aiCodeReviewPrompt, input });
    if (!output) {
      throw new Error("AI response was empty.");
    }
    return output;
  }
);
