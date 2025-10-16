'use client';

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import type { Message, ChatSession } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Path builders
const sessionsCol = (userId: string) => `userProfiles/${userId}/chatSessions`;
const sessionDoc = (userId: string, sessionId: string) => doc(firestore, sessionsCol(userId), sessionId);
const messagesCol = (userId: string, sessionId: string) => `userProfiles/${userId}/chatSessions/${sessionId}/messages`;
const messageDoc = (userId: string, sessionId: string, messageId: string) => doc(firestore, messagesCol(userId, sessionId), messageId);

/**
 * Creates a new chat session for a user.
 */
export async function createNewChatSession(userId: string, initialMessage: Omit<Message, 'id' | 'timestamp'>): Promise<string> {
  const sessionsCollectionRef = collection(firestore, sessionsCol(userId));
  
  const newSessionData = {
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    title: 'New Chat',
  };

  try {
    const sessionRef = await addDoc(sessionsCollectionRef, newSessionData);
    
    // Add the initial message
    const initialMsgWithTimestamp = {
        ...initialMessage,
        timestamp: serverTimestamp(),
    };
    await addDoc(collection(firestore, messagesCol(userId, sessionRef.id)), initialMsgWithTimestamp);

    return sessionRef.id;
  } catch (error) {
    console.error('Error creating new chat session:', error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: sessionsCollectionRef.path,
      operation: 'create',
      requestResourceData: newSessionData,
    }));
    throw error;
  }
}

/**
 * Saves a single chat message to a session.
 */
export async function saveChatMessage(userId: string, sessionId: string, message: Message): Promise<void> {
  const { id, ...messageData } = message;
  const messagesCollectionRef = collection(firestore, messagesCol(userId, sessionId));
  const sessionRef = sessionDoc(userId, sessionId);

  const messagePayload = {
      ...messageData,
      timestamp: Timestamp.fromDate(new Date(message.timestamp)),
  };

  try {
    // Non-blocking write
    setDoc(doc(messagesCollectionRef, id), messagePayload).catch(err => { throw err });

    // Update session's `updatedAt` timestamp
    updateDoc(sessionRef, { updatedAt: serverTimestamp() }).catch(err => { throw err });

  } catch (error) {
    console.error('Error saving chat message:', error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: messagesCollectionRef.path,
      operation: 'create',
      requestResourceData: messagePayload,
    }));
    throw error;
  }
}

/**
 * Loads the most recent chat session for a user.
 */
export async function loadChatSession(userId: string): Promise<ChatSession | null> {
  const sessionsCollectionRef = collection(firestore, sessionsCol(userId));
  const q = query(sessionsCollectionRef, orderBy('updatedAt', 'desc'), limit(1));

  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const sessionDocSnap = querySnapshot.docs[0];
    const sessionId = sessionDocSnap.id;

    const messagesCollectionRef = collection(firestore, messagesCol(userId, sessionId));
    const messagesQuery = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

    const messagesSnapshot = await getDocs(messagesQuery);
    const messages = messagesSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        timestamp: (data.timestamp as Timestamp).toDate(),
      } as Message;
    });

    return {
      id: sessionId,
      ...sessionDocSnap.data(),
      messages,
      createdAt: (sessionDocSnap.data().createdAt as Timestamp).toDate(),
      updatedAt: (sessionDocSnap.data().updatedAt as Timestamp).toDate(),
    } as ChatSession;

  } catch (error) {
    console.error('Error loading chat session:', error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: q.toString(),
      operation: 'list',
    }));
    return null;
  }
}

/**
 * Deletes a chat session and all its messages.
 */
export async function deleteChatSession(userId: string, sessionId: string): Promise<void> {
  const sessionRef = sessionDoc(userId, sessionId);
  const messagesCollectionRef = collection(firestore, messagesCol(userId, sessionId));

  try {
    const messagesSnapshot = await getDocs(messagesCollectionRef);
    const batch = writeBatch(firestore);

    messagesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    batch.delete(sessionRef);

    await batch.commit();
  } catch (error) {
    console.error('Error deleting chat session:', error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: sessionRef.path,
      operation: 'delete',
    }));
    throw error;
  }
}
