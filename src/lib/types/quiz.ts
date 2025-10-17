import { z } from 'zod';
import { McqQuestionSchema } from './index';

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

export const QuizSchema = z.object({
  title: z.string().describe('The title of the quiz.'),
  questions: z
    .array(McqQuestionSchema)
    .describe('An array of multiple-choice questions.'),
});
export type Quiz = z.infer<typeof QuizSchema>;
