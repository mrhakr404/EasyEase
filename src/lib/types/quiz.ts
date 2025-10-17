'use client';

import { z } from 'zod';

export const McqQuestionSchema = z.object({
  id: z.number().describe('The question number, starting from 1.'),
  questionText: z.string(),
  options: z.object({
    A: z.string(),
    B: z.string(),
    C: z.string(),
    D: z.string(),
  }),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().describe('A concise explanation of the correct answer.'),
});

export const QuizSchema = z.object({
  quizTitle: z.string().describe('A relevant title for the daily quiz.'),
  questions: z.array(McqQuestionSchema),
});

export type McqQuestion = z.infer<typeof McqQuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
export type OptionKey = keyof McqQuestion['options'];
