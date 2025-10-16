'use client';

import {
  collection,
  addDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { DailyQuizAttempt, McqQuestion } from '@/lib/types';

const dailyQuizAttemptsPath = (userId: string) => `userProfiles/${userId}/dailyQuizAttempts`;

type NewAttemptData = {
    question: McqQuestion;
    submittedAnswer: string;
    isCorrect: boolean;
}

/**
 * Saves a student's daily quiz attempt to Firestore.
 * This is a non-blocking operation.
 */
export function saveDailyQuizAttempt(firestore: Firestore, userId: string, data: NewAttemptData): void {
  const attemptsCollectionRef = collection(firestore, dailyQuizAttemptsPath(userId));
  
  const newAttemptData = {
    userId,
    ...data,
    attemptedAt: serverTimestamp(),
  };

  addDoc(attemptsCollectionRef, newAttemptData)
    .catch(error => {
      console.error("Error saving daily quiz attempt:", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: attemptsCollectionRef.path,
        operation: 'create',
        requestResourceData: newAttemptData,
      }));
    });
}
