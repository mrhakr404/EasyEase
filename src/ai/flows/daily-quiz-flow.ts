'use server';

/**
 * @fileOverview An AI-powered quiz generation tool for students.
 *
 * - generateQuiz - a function that handles the quiz generation process.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz (e.g., React Hooks, Component State).'),
  questionCount: z.number().min(1).max(10).default(5).describe('The number of questions to generate.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium').describe('The difficulty level of the quiz.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
    question: z.string().describe("The question text."),
    options: z.array(z.string()).describe("An array of 4 possible answers."),
    correctAnswer: z.string().describe("The correct answer from the options array."),
    explanation: z.string().describe("A brief explanation for why the answer is correct.")
});

const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of generated quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: GenerateQuizInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `You are an expert educator. Generate a multiple-choice quiz based on the following criteria.
For each question, provide 4 options and clearly indicate the correct answer. Also, provide a short explanation for the correct answer.

Topic: {{{topic}}}
Number of Questions: {{{questionCount}}}
Difficulty: {{{difficulty}}}
`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    const { output } = await generateQuizPrompt(input);
    if (!output) {
      throw new Error("AI response was empty.");
    }
    return output;
  }
);

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}
