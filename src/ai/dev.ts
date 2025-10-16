'use client';
import { config } from 'dotenv';
config();

import '@/ai/flows/ai-code-review.ts';
import '@/ai/flows/quiz-generator.ts';
import '@/ai/flows/daily-quiz-flow.ts';
import '@/ai/flows/chat-flow.ts';
