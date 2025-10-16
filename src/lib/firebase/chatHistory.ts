'use client';

import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  deleteDoc,
  writeBatch,
  getDoc,
  collectionGroup,
  CollectionReference,
  DocumentData,
  Query,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import type { Message, ChatSession } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { InternalQuery } from '@/firebase/firestore/use-collection';

// Path builders
const sessionsCol = (userId: string) => `userProfiles/${userId}/chatSessions`;
const sessionDoc = (userId: string, sessionId: string) => doc(firestore, sessionsCol(userId), sessionId);
const messagesCol = (userId:string, sessionId: string) => `userProfiles/${userId}/chatSessions/${sessionId}/messages`;

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

  const sessionRef = await addDoc(sessionsCollectionRef, newSessionData).catch((error) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: sessionsCollectionRef.path,
      operation: 'create',
      requestResourceData: newSessionData,
    }));
    throw error;
  });

  // Add the initial message
  const initialMsgWithTimestamp = {
      ...initialMessage,
      timestamp: serverTimestamp(),
  };
  
  await addDoc(collection(firestore, messagesCol(userId, sessionRef.id)), initialMsgWithTimestamp).catch((error) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: messagesCol(userId, sessionRef.id),
        operation: 'create',
        requestResourceData: initialMsgWithTimestamp
    }));
    throw error;
  });


  return sessionRef.id;
}

/**
 * Saves a single chat message to a session. This is a non-blocking write.
 */
export function saveChatMessage(userId: string, sessionId: string, message: Message): Promise<void> {
  const { id, ...messageData } = message;
  const messagesCollectionRef = collection(firestore, messagesCol(userId, sessionId));
  const sessionRef = sessionDoc(userId, sessionId);

  const messagePayload = {
      ...messageData,
      timestamp: Timestamp.fromDate(new Date(message.timestamp)),
  };

  // Perform writes without awaiting to keep UI responsive
  setDoc(doc(messagesCollectionRef, id), messagePayload).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: doc(messagesCollectionRef, id).path,
      operation: 'create',
      requestResourceData: messagePayload,
    }));
  });

  updateDoc(sessionRef, { updatedAt: serverTimestamp() }).catch(error => {
     errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: sessionRef.path,
      operation: 'update',
      requestResourceData: { updatedAt: 'serverTimestamp' },
    }));
  });

  return Promise.resolve();
}


/**
 * A helper function to safely execute a getDocs query and handle permissions errors.
 */
async function safeGetDocs(q: Query<DocumentData>) {
    try {
        return await getDocs(q);
    } catch (error) {
        const contextualError = new FirestorePermissionError({
            path: (q as unknown as InternalQuery)._query.path.canonicalString(),
            operation: 'list',
        });
        errorEmitter.emit('permission-error', contextualError);
        throw contextualError;
    }
}


/**
 * Loads the most recent chat session for a user.
 */
export async function loadChatSession(userId: string): Promise<ChatSession | null> {
  const sessionsCollectionRef = collection(firestore, sessionsCol(userId));
  const q = query(sessionsCollectionRef, orderBy('updatedAt', 'desc'), limit(1));

  const querySnapshot = await safeGetDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const sessionDocSnap = querySnapshot.docs[0];
  const sessionId = sessionDocSnap.id;

  const messagesCollectionRef = collection(firestore, messagesCol(userId, sessionId));
  const messagesQuery = query(messagesCollectionRef, orderBy('timestamp', 'asc'));
  
  const messagesSnapshot = await safeGetDocs(messagesQuery);

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
}


/**
 * Deletes a chat session and all its messages.
 */
export async function deleteChatSession(userId: string, sessionId: string): Promise<void> {
    const sessionRef = sessionDoc(userId, sessionId);
    const messagesCollectionRef = collection(firestore, messagesCol(userId, sessionId));

    const sessionSnap = await getDoc(sessionRef).catch(error => {
        const contextualError = new FirestorePermissionError({
            path: sessionRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', contextualError);
        throw contextualError;
    });

    if (!sessionSnap.exists()) {
        console.warn("Attempted to delete a non-existent chat session.");
        return;
    }
    
    const messagesSnapshot = await safeGetDocs(query(messagesCollectionRef));

    const batch = writeBatch(firestore);

    messagesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    batch.delete(sessionRef);

    await batch.commit().catch(error => {
        const contextualError = new FirestorePermissionError({
            path: sessionRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', contextualError);
        throw contextualError;
    });
}
