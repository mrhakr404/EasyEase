'use client';

import { 
    doc, 
    collection,
    addDoc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp,
    type Firestore 
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Note } from '@/lib/types';

const notesPath = (userId: string) => `userProfiles/${userId}/notes`;

/**
 * Creates a new note for a user.
 * This is a non-blocking operation.
 */
export function createNote(firestore: Firestore, userId: string, data: Pick<Note, 'title' | 'content'>): void {
  const notesCollectionRef = collection(firestore, notesPath(userId));
  const newNoteData = {
    ...data,
    ownerId: userId,
    privacy: 'private',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  addDoc(notesCollectionRef, newNoteData)
    .catch(error => {
        console.error("Error creating note:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: notesCollectionRef.path,
            operation: 'create',
            requestResourceData: newNoteData,
        }));
    });
}

/**
 * Updates an existing note.
 * This is a non-blocking operation.
 */
export function updateNote(firestore: Firestore, userId: string, noteId: string, data: Partial<Pick<Note, 'title' | 'content'>>): void {
  const noteRef = doc(firestore, notesPath(userId), noteId);
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  updateDoc(noteRef, updateData)
    .catch(error => {
        console.error("Error updating note:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: noteRef.path,
            operation: 'update',
            requestResourceData: updateData,
        }));
    });
}

/**
 * Deletes a note.
 * This is a non-blocking operation.
 */
export function deleteNote(firestore: Firestore, userId: string, noteId: string): void {
  const noteRef = doc(firestore, notesPath(userId), noteId);

  deleteDoc(noteRef)
    .catch(error => {
        console.error("Error deleting note:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: noteRef.path,
            operation: 'delete',
        }));
    });
}
