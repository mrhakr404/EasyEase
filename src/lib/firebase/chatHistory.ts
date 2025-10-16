'use client';

import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  type Firestore,
  type DocumentData,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { ChatSession, Message } from '@/lib/types';
import type { InternalQuery } from '@/firebase/firestore/use-collection';

/**
 * Loads the most recent chat session for a user, or creates a new one if none exists.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user.
 * @returns An object containing the session ID and the messages of that session.
 */
export async function loadChatSession(firestore: Firestore, userId: string): Promise<{ sessionId: string, messages: Message[] }> {
  const sessionsRef = collection(firestore, `userProfiles/${userId}/chatSessions`);
  const q = query(sessionsRef, orderBy('createdAt', 'desc'), limit(1));
  
  const sessionSnapshot = await getDocs(q).catch((error) => {
    console.error("Error loading chat session:", error);
    const contextualError = new FirestorePermissionError({
      path: (q as unknown as InternalQuery)._query.path.canonicalString(),
      operation: 'list',
    });
    errorEmitter.emit('permission-error', contextualError);
    throw contextualError;
  });
    
  if (sessionSnapshot.empty) {
    // No sessions exist, so return a new session structure without creating it yet
    return { sessionId: '', messages: [] };
  }
  
  const sessionDoc = sessionSnapshot.docs[0];
  const sessionId = sessionDoc.id;
  const messagesRef = collection(firestore, `userProfiles/${userId}/chatSessions/${sessionId}/messages`);
  const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

  const messagesSnapshot = await getDocs(messagesQuery).catch((error) => {
    console.error("Error loading messages:", error);
    const contextualError = new FirestorePermissionError({
      path: (messagesQuery as unknown as InternalQuery)._query.path.canonicalString(),
      operation: 'list',
    });
    errorEmitter.emit('permission-error', contextualError);
    throw contextualError;
  });

  const messages = messagesSnapshot.docs.map(doc => doc.data() as Message);
  return { sessionId, messages };
}

/**
 * Creates a new chat session and adds the first message.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user.
 * @param firstMessage The initial message to start the session.
 * @returns The ID of the newly created chat session.
 */
export async function createChatSession(firestore: Firestore, userId: string, firstMessage: Message): Promise<string> {
  const sessionsRef = collection(firestore, `userProfiles/${userId}/chatSessions`);
  const newSessionData: Omit<ChatSession, 'id'> = {
    userId,
    createdAt: serverTimestamp(),
    lastMessage: firstMessage.content,
  };
  
  const sessionDocRef = await addDoc(sessionsRef, newSessionData).catch(error => {
    console.error("Error creating new chat session:", error);
    const contextualError = new FirestorePermissionError({
      path: sessionsRef.path,
      operation: 'create',
      requestResourceData: newSessionData
    });
    errorEmitter.emit('permission-error', contextualError);
    throw contextualError;
  });

  const messagesRef = collection(sessionDocRef, 'messages');
  
  await addDoc(messagesRef, firstMessage).catch(error => {
      console.error("Error adding first message to new chat session:", error);
      const contextualError = new FirestorePermissionError({
          path: messagesRef.path,
          operation: 'create',
          requestResourceData: firstMessage,
      });
      errorEmitter.emit('permission-error', contextualError);
      throw contextualError;
  });

  return sessionDocRef.id;
}

/**
 * Adds a new message to an existing chat session.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user.
 * @param sessionId The ID of the chat session.
 * @param message The message to add.
 */
export async function updateChatSession(firestore: Firestore, userId: string, sessionId: string, message: Message): Promise<void> {
  const sessionRef = doc(firestore, `userProfiles/${userId}/chatSessions/${sessionId}`);
  const messageRef = doc(collection(sessionRef, 'messages'));

  const batch = writeBatch(firestore);
  batch.set(messageRef, message);
  batch.update(sessionRef, { lastMessage: message.content, lastActivity: serverTimestamp() });
  
  await batch.commit().catch(error => {
    console.error("Error updating chat session:", error);
    // Determine which operation failed is tricky in a batch. We'll report the message creation.
    const contextualError = new FirestorePermissionError({
      path: messageRef.path,
      operation: 'create',
      requestResourceData: message
    });
    errorEmitter.emit('permission-error', contextualError);
    throw contextualError;
  });
}
