'use server';

/**
 * @fileOverview An AI-powered quiz generator.
 *
 * - generateQuiz - A function that generates a multiple-choice quiz.
 */

import { ai } from '@/ai/genkit';
import {
  QuizRequestSchema,
  QuizSchema,
  type Quiz,
  type QuizRequest,
} from '@/lib/types/quiz';

const quizPrompt = ai.definePrompt({
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
- Return strictly valid JSON that adheres to the schema.
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
    const { output } = await quizPrompt(input);
    if (!output) {
      throw new Error('Failed to generate quiz');
    }
    return output;
  }
);

export async function generateQuiz(input: QuizRequest): Promise<Quiz> {
  return quizGeneratorFlow(input);
}
