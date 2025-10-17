'use client';

import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoURL?: string;
  role: 'student' | 'institute' | 'admin';
  createdAt: Timestamp;
  instituteId?: string; // ID of the institute the user belongs to
}

export interface Institute {
  id:string;
  name: string;
  ownerId: string; // The UID of the user who created the institute
  admins: string[]; // List of UIDs of institute admins
  settings: {
    theme?: 'light' | 'dark';
    customDomain?: string;
  };
  billing: {
    plan: 'free' | 'pro' | 'enterprise';
    stripeCustomerId?: string;
    status: 'active' | 'trialing' | 'canceled';
  };
  featureFlags: {
    [key: string]: boolean;
  };
  createdAt: Timestamp;
}

export interface Course {
  id: string;
  instituteId: string;
  title: string;
  description: string;
  studentIds: string[];
  published: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  lessons: string[]; // Array of lesson IDs
  resources: Resource[];
  order: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string; // Could be Markdown, HTML, etc.
  attachments: Attachment[];
  duration: number; // in minutes
}

interface Resource {
  name: string;
  url: string;
}

interface Attachment {
  name:string;
  url: string; // URL to Firebase Storage
  type: 'file' | 'video' | 'link';
}

export interface Note {
  id: string;
  ownerId: string; // UID of the student who owns the note
  courseId?: string; // Optional: to associate note with a course
  title: string;
  content: string; // The body of the note
  privacy: 'private' | 'public'; // 'public' could mean visible to institute instructors
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Enrollment {
    enrollmentId: string;
    courseId: string;
    studentId: string;
    status: 'active' | 'completed' | 'dropped';
    enrolledAt: Timestamp;
    progress?: number; // e.g., percentage completion
}

export const McqQuestionSchema = z.object({
  question: z.string().describe('The question text.'),
  options: z.array(z.string()).length(4).describe('An array of 4 possible answers.'),
  answer: z.string().describe('The correct answer from the options array.'),
  explanation: z.string().optional().describe('A brief explanation for why the answer is correct.'),
});
export type McqQuestion = z.infer<typeof McqQuestionSchema>;


export interface DailyQuizAttempt {
  id: string;
  userId: string;
  question: McqQuestion;
  submittedAnswer: string;
  isCorrect: boolean;
  attemptedAt: Timestamp;
}

export const MessageDataSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
});
export type MessageData = z.infer<typeof MessageDataSchema>;

export const ChatRequestSchema = z.object({
  history: z.array(MessageDataSchema),
  currentMessage: MessageDataSchema,
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export interface ChatMessage extends MessageData {
  id: string;
  createdAt: Timestamp;
}
