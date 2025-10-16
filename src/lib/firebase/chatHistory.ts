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
const sessionsCol = (userId: string) => collection(firestore, 'userProfiles', userId, 'chatSessions');
const sessionDoc = (userId: string, sessionId: string) => doc(firestore, 'userProfiles', userId, 'chatSessions', sessionId);
const messagesCol = (userId: string, sessionId: string) => collection(firestore, 'userProfiles', userId, 'chatSessions', sessionId, 'messages');


/**
 * Creates a new chat session for a user with an initial welcome message.
 */
export async function createNewChatSession(userId: string, initialMessage: Omit<Message, 'id' | 'timestamp'>): Promise<string> {
  const sessionsCollectionRef = sessionsCol(userId);
  
  const newSessionData = {
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    title: 'New Chat',
  };

  try {
    const sessionRef = await addDoc(sessionsCollectionRef, newSessionData);

    const initialMsgWithTimestamp = {
        ...initialMessage,
        timestamp: serverTimestamp(),
    };
    
    // Add the initial message to the new session
    const messagesCollectionRef = messagesCol(userId, sessionRef.id);
    await addDoc(messagesCollectionRef, initialMsgWithTimestamp);

    return sessionRef.id;

  } catch (error) {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: sessionsCollectionRef.path,
      operation: 'create',
      requestResourceData: newSessionData,
    }));
    // Re-throw the error to be caught by the calling UI
    throw error;
  }
}

/**
 * Saves a single chat message to a session. This is a non-blocking write.
 * It does not wait for the write to complete on the server.
 */
export function saveChatMessage(userId: string, sessionId: string, message: Message): void {
  // Destructure to remove the client-side 'id' before saving to Firestore.
  const { id, ...messageData } = message;
  const messagesCollectionRef = messagesCol(userId, sessionId);
  const sessionRef = sessionDoc(userId, sessionId);

  // Firestore documents can have custom IDs, so we use the client-generated ID here.
  const messageDocRef = doc(messagesCollectionRef, id);

  const messagePayload = {
      ...messageData,
      // Convert JS Date back to Firestore Timestamp for consistency
      timestamp: Timestamp.fromDate(new Date(message.timestamp)),
  };

  // Set the message document non-blockingly
  setDoc(messageDocRef, messagePayload).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: messageDocRef.path,
      operation: 'create',
      requestResourceData: messagePayload,
    }));
  });

  // Update the parent session's 'updatedAt' timestamp non-blockingly
  updateDoc(sessionRef, { updatedAt: serverTimestamp() }).catch(error => {
     errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: sessionRef.path,
      operation: 'update',
      requestResourceData: { updatedAt: 'serverTimestamp' },
    }));
  });
}


/**
 * Loads the most recent chat session for a user, including all its messages.
 */
export async function loadChatSession(userId: string): Promise<ChatSession | null> {
  const sessionsCollectionRef = sessionsCol(userId);
  const q = query(sessionsCollectionRef, orderBy('updatedAt', 'desc'), limit(1));

  let querySnapshot;
  try {
      querySnapshot = await getDocs(q);
  } catch (error) {
      const contextualError = new FirestorePermissionError({
          path: (q as unknown as InternalQuery)._query.path.canonicalString(),
          operation: 'list',
      });
      errorEmitter.emit('permission-error', contextualError);
      throw contextualError;
  }

  if (querySnapshot.empty) {
    return null;
  }

  const sessionDocSnap = querySnapshot.docs[0];
  const sessionId = sessionDocSnap.id;

  const messagesCollectionRef = messagesCol(userId, sessionId);
  const messagesQuery = query(messagesCollectionRef, orderBy('timestamp', 'asc'));
  
  let messagesSnapshot;
  try {
    messagesSnapshot = await getDocs(messagesQuery);
  } catch(error) {
    const contextualError = new FirestorePermissionError({
        path: (messagesQuery as unknown as InternalQuery)._query.path.canonicalString(),
        operation: 'list',
    });
    errorEmitter.emit('permission-error', contextualError);
    throw contextualError;
  }


  const messages = messagesSnapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      // Convert Firestore Timestamp to JS Date for use in the client
      timestamp: (data.timestamp as Timestamp).toDate(),
    } as Message;
  });

  const sessionData = sessionDocSnap.data();
  return {
    id: sessionId,
    ...sessionData,
    messages,
    createdAt: (sessionData.createdAt as Timestamp).toDate(),
    updatedAt: (sessionData.updatedAt as Timestamp).toDate(),
  } as ChatSession;
}


/**
 * Deletes a chat session and all its messages within a transaction (batch write).
 */
export async function deleteChatSession(userId: string, sessionId: string): Promise<void> {
    const sessionRef = sessionDoc(userId, sessionId);
    const messagesCollectionRef = messagesCol(userId, sessionId);

    try {
        // Get all messages to delete them in a batch
        const messagesSnapshot = await getDocs(messagesCollectionRef);

        const batch = writeBatch(firestore);

        messagesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete the parent session document
        batch.delete(sessionRef);

        // Commit the batch write
        await batch.commit();
    } catch (error) {
        // If any part of the batch fails, it's likely a permission issue on one of the documents.
        const contextualError = new FirestorePermissionError({
            path: sessionRef.path, // Report error on the parent session for simplicity
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', contextualError);
        throw contextualError;
    }
}
