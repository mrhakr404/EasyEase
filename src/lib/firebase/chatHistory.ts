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
  type Query
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
  
  try {
    const sessionSnapshot = await getDocs(q);
    
    if (sessionSnapshot.empty) {
      // No sessions exist, so return a new session structure without creating it yet
      return { sessionId: '', messages: [] };
    }
    
    const sessionDoc = sessionSnapshot.docs[0];
    const sessionId = sessionDoc.id;
    const messagesRef = collection(firestore, `userProfiles/${userId}/chatSessions/${sessionId}/messages`);
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

    try {
      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map(doc => doc.data() as Message);
      return { sessionId, messages };
    } catch (messagesError) {
      console.error("Error loading messages:", messagesError);
      const contextualError = new FirestorePermissionError({
        path: (messagesQuery as unknown as InternalQuery)._query.path.canonicalString(),
        operation: 'list',
      });
      errorEmitter.emit('permission-error', contextualError);
      throw contextualError; // Re-throw to be caught by the UI
    }

  } catch (sessionError) {
    console.error("Error loading chat session:", sessionError);
    const contextualError = new FirestorePermissionError({
      path: (q as unknown as InternalQuery)._query.path.canonicalString(),
      operation: 'list',
    });
    errorEmitter.emit('permission-error', contextualError);
    throw contextualError; // Re-throw to be caught by the UI
  }
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
    startTime: serverTimestamp(),
    lastMessage: firstMessage.content,
  };
  
  try {
    const sessionDocRef = await addDoc(sessionsRef, newSessionData);
    const messagesRef = collection(sessionDocRef, 'messages');
    await addDoc(messagesRef, firstMessage);
    return sessionDocRef.id;
  } catch (error) {
    console.error("Error creating new chat session:", error);
    const contextualError = new FirestorePermissionError({
      path: sessionsRef.path,
      operation: 'create',
      requestResourceData: newSessionData
    });
    errorEmitter.emit('permission-error', contextualError);
    throw contextualError;
  }
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

  try {
    const batch = writeBatch(firestore);
    batch.set(messageRef, message);
    batch.update(sessionRef, { lastMessage: message.content, lastActivity: serverTimestamp() });
    await batch.commit();
  } catch (error) {
    console.error("Error updating chat session:", error);
    const contextualError = new FirestorePermissionError({
      path: messageRef.path,
      operation: 'create',
      requestResourceData: message
    });
    errorEmitter.emit('permission-error', contextualError);
    throw contextualError;
  }
}
