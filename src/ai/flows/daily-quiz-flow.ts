'use server';

/**
 * @fileOverview A flow for generating a daily quiz for a student based on their course.
 */

import { ai } from '@/ai/genkit';
import { QuizSchema } from '@/lib/types';
import { z } from 'zod';

const DailyQuizInputSchema = z.object({
  course: z.string().describe('The course topic for the quiz (e.g., Advanced React).'),
});

const quizPrompt = ai.definePrompt(
  {
    name: 'dailyQuizPrompt',
    input: { schema: DailyQuizInputSchema },
    output: { schema: QuizSchema },
    prompt: `You are an expert educational quiz generator. Your task is to create a daily multiple-choice quiz for a student currently enrolled in a specific course.

**COURSE TOPIC:** {{{course}}}
**QUIZ FOCUS:** Focus on core concepts, common pitfalls, and intermediate-level knowledge.
**QUIZ REQUIREMENTS:**
1.  Generate exactly **5** multiple-choice questions (MCQs).
2.  Each question must have **4** options (A, B, C, D) and only **1** correct answer.
3.  Provide a brief, helpful **explanation** for the correct answer.
4.  The entire output **must be a single JSON object** that strictly adheres to the provided JSON Schema.

**JSON SCHEMA (for Output):**
\'\'\'json
{
  "type": "object",
  "properties": {
    "quizTitle": { "type": "string", "description": "A relevant title for the daily quiz." },
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "integer", "description": "The question number, starting from 1." },
          "questionText": { "type": "string" },
          "options": {
            "type": "object",
            "properties": {
              "A": { "type": "string" },
              "B": { "type": "string" },
              "C": { "type": "string" },
              "D": { "type": "string" }
            },
            "required": ["A", "B", "C", "D"]
          },
          "correctAnswer": { "type": "string", "enum": ["A", "B", "C", "D"] },
          "explanation": { "type": "string", "description": "A concise explanation of the correct answer." }
        },
        "required": ["id", "questionText", "options", "correctAnswer", "explanation"]
      }
    }
  },
  "required": ["quizTitle", "questions"]
}
\'\'\'
Instruction: Generate the JSON quiz now based on the COURSE TOPIC.`,
  },
);

export const generateDailyQuiz = ai.defineFlow(
  {
    name: 'generateDailyQuizFlow',
    inputSchema: DailyQuizInputSchema,
    outputSchema: QuizSchema,
  },
  async (input) => {
    const { output } = await quizPrompt(input);
    if (!output) {
      throw new Error('Failed to generate quiz: AI returned no output.');
    }
    return output;
  },
);
