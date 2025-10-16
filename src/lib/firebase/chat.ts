'use client';

import {
  collection,
  addDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { ChatMessage } from '@/lib/types';

const chatMessagesPath = (userId: string, sessionId: string) => `userProfiles/${userId}/chatSessions/${sessionId}/messages`;

type NewMessageData = {
    role: 'user' | 'model';
    text: string;
}

/**
 * Saves a chat message to a user's session in Firestore.
 * This is a non-blocking operation.
 */
export function saveChatMessage(firestore: Firestore, userId: string, sessionId: string, data: NewMessageData): void {
  const messagesCollectionRef = collection(firestore, chatMessagesPath(userId, sessionId));
  
  const newMessageData = {
    ...data,
    createdAt: serverTimestamp(),
  };

  addDoc(messagesCollectionRef, newMessageData)
    .catch(error => {
      console.error("Error saving chat message:", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: messagesCollectionRef.path,
        operation: 'create',
        requestResourceData: newMessageData,
      }));
    });
}
