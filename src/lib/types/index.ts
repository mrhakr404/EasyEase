import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  role: 'student' | 'institute' | 'admin';
  createdAt: Timestamp;
  instituteId?: string; // ID of the institute the user belongs to
}

export interface Institute {
  id: string;
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
  slug: string;
  description: string;
  modules: string[]; // Array of module IDs
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


// --- AI Chat Types ---

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  title?: string; // Auto-generated from first message
}

// Define the schema for a single message in the chat history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

// Define the input schema for the chat flow
export const ChatInputSchema = z.object({
  history: z.array(MessageSchema),
  message: z.string(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;
