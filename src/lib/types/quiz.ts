import { z } from 'zod';

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
