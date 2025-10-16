'use server';

/**
 * @fileOverview An AI-powered quiz generator.
 *
 * - generateQuiz - A function that generates a multiple-choice quiz.
 * - QuizRequest - The input type for the generateQuiz function.
 * - Quiz - The return type for the generateQuiz function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const QuizRequestSchema = z.object({
  topic: z.string().describe('The topic for the quiz (e.g., "React Hooks")'),
  numQuestions: z
    .number()
    .min(3)
    .max(10)
    .default(5)
    .describe('The number of questions to generate'),
});
export type QuizRequest = z.infer<typeof QuizRequestSchema>;

const McqQuestionSchema = z.object({
  question: z.string().describe('The question text.'),
  options: z.array(z.string()).describe('An array of 4 possible answers.'),
  answer: z.string().describe('The correct answer from the options array.'),
});

export const QuizSchema = z.object({
  title: z.string().describe('The title of the quiz.'),
  questions: z.array(McqQuestionSchema),
});
export type Quiz = z.infer<typeof QuizSchema>;

const prompt = ai.definePrompt({
  name: 'quizPrompt',
  input: { schema: QuizRequestSchema },
  output: { schema: QuizSchema },
  prompt: `You are an expert educator. Generate a multiple-choice quiz about the given topic.

Topic: {{{topic}}}
Number of Questions: {{{numQuestions}}}

- The quiz must have exactly {{{numQuestions}}} questions.
- Each question must have exactly 4 options.
- One of the options must be the correct answer.
- The "answer" field must exactly match one of the strings in the "options" array.
- The questions should be challenging but fair, suitable for a student learning the topic.
- Ensure the title of the quiz reflects the topic.
- Do not use markdown in the output.
`,
});

const quizGeneratorFlow = ai.defineFlow(
  {
    name: 'quizGeneratorFlow',
    inputSchema: QuizRequestSchema,
    outputSchema: QuizSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate quiz');
    }
    return output;
  }
);

export async function generateQuiz(input: QuizRequest): Promise<Quiz> {
  return quizGeneratorFlow(input);
}
