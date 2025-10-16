'use server';

/**
 * @fileOverview An AI-powered daily quiz question generator.
 *
 * - generateDailyQuizQuestion - A function that generates a single multiple-choice question.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { McqQuestionSchema, type McqQuestion } from '@/lib/types';

const DailyQuizRequestSchema = z.object({
  topic: z.string().describe('The topic for the quiz question (e.g., "React Hooks")'),
});

const prompt = ai.definePrompt({
  name: 'dailyQuizPrompt',
  input: { schema: DailyQuizRequestSchema },
  output: { schema: McqQuestionSchema },
  prompt: `You are an expert educator. Generate a single, challenging multiple-choice question about the given topic.

Topic: {{{topic}}}

- The question must have exactly 4 options.
- One of the options must be the correct answer.
- The "answer" field must exactly match one of the strings in the "options" array.
- The question should be suitable for a student learning the topic.
- Do not use markdown in the output.
`,
});

const dailyQuizFlow = ai.defineFlow(
  {
    name: 'dailyQuizFlow',
    inputSchema: DailyQuizRequestSchema,
    outputSchema: McqQuestionSchema,
  },
  async (input) => {
    const response = await prompt(input);
    const output = response.output();
    if (!output) {
      throw new Error('Failed to generate daily quiz question');
    }
    return output;
  }
);

export async function generateDailyQuizQuestion(topic: string): Promise<McqQuestion> {
  return dailyQuizFlow({ topic });
}
