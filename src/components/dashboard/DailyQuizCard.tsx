'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateDailyQuizQuestion } from '@/ai/flows/daily-quiz-flow';
import { saveDailyQuizAttempt } from '@/lib/firebase/dailyQuiz';
import type { DailyQuizAttempt, McqQuestion } from '@/lib/types';
import { isToday, differenceInMilliseconds, formatDuration } from 'date-fns';

const RECOMMENDED_TOPIC = "State Management with Zustand"; // This would be dynamic in a real app

type QuizStatus = 'loading' | 'ready' | 'answered' | 'completed' | 'error';

export function DailyQuizCard({ className }: { className?: string }) {
  const { user } = useAuth();
  const firestore = useFirestore();

  const [status, setStatus] = useState<QuizStatus>('loading');
  const [question, setQuestion] = useState<McqQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const latestAttemptQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return query(
      collection(firestore, `userProfiles/${user.uid}/dailyQuizAttempts`),
      orderBy('attemptedAt', 'desc'),
      limit(1)
    );
  }, [user, firestore]);

  const { data: latestAttemptData, isLoading: isLoadingAttempt } = useCollection<DailyQuizAttempt>(latestAttemptQuery);
  const latestAttempt = useMemo(() => (latestAttemptData && latestAttemptData[0]) || null, [latestAttemptData]);

  useEffect(() => {
    if (isLoadingAttempt) {
        setStatus('loading');
        return;
    }

    if (latestAttempt && isToday(latestAttempt.attemptedAt.toDate())) {
        setStatus('completed');
        setQuestion(latestAttempt.question);
        setSelectedAnswer(latestAttempt.submittedAnswer);
        setIsCorrect(latestAttempt.isCorrect);
    } else {
        fetchNewQuestion();
    }
  }, [latestAttempt, isLoadingAttempt]);
  
  useEffect(() => {
      if (status === 'completed') {
          const interval = setInterval(() => {
              const now = new Date();
              const tomorrow = new Date();
              tomorrow.setHours(24, 0, 0, 0);
              const duration = differenceInMilliseconds(tomorrow, now);
              setTimeLeft(formatDuration({
                  hours: Math.floor((duration / (1000 * 60 * 60)) % 24),
                  minutes: Math.floor((duration / (1000 * 60)) % 60),
                  seconds: Math.floor((duration / 1000) % 60)
              }));
          }, 1000);
          return () => clearInterval(interval);
      }
  }, [status]);

  const fetchNewQuestion = async () => {
    setStatus('loading');
    try {
      const q = await generateDailyQuizQuestion(RECOMMENDED_TOPIC);
      setQuestion(q);
      setStatus('ready');
    } catch (e) {
      console.error("Failed to generate question:", e);
      setError("Couldn't generate a question. Please try again later.");
      setStatus('error');
    }
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !question || !user || !firestore) return;

    const correct = selectedAnswer === question.answer;
    setIsCorrect(correct);
    setStatus('answered');
    
    saveDailyQuizAttempt(firestore, user.uid, {
        question,
        submittedAnswer: selectedAnswer,
        isCorrect: correct,
    });
  };

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      );
    }

    if (status === 'error' || !question) {
        return (
            <div className="text-center text-destructive">
                <p>{error || "Something went wrong."}</p>
                <Button onClick={fetchNewQuestion} variant="link">Try again</Button>
            </div>
        )
    }

    if (status === 'completed') {
        return (
            <div className="text-center">
                <h3 className="font-semibold text-lg">Quiz Completed for Today!</h3>
                <p className="text-muted-foreground text-sm">You answered {isCorrect ? 'correctly' : 'incorrectly'}.</p>
                <div className="mt-4 p-4 bg-background/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Next question in:</p>
                    <p className="text-2xl font-bold font-mono tracking-wider">{timeLeft || '...'}</p>
                </div>
            </div>
        )
    }

    // Ready or Answered state
    return (
      <div className="space-y-6">
        <p className="font-semibold leading-snug">{question.question}</p>
        <RadioGroup
          value={selectedAnswer ?? ''}
          onValueChange={setSelectedAnswer}
          disabled={status === 'answered'}
        >
          {question.options.map((option, index) => {
            const isTheCorrectAnswer = option === question.answer;
            const isTheSelectedAnswer = option === selectedAnswer;
            const isRevealed = status === 'answered';

            return (
              <div
                key={index}
                className={cn(
                  'flex items-center space-x-3 p-3 rounded-md border transition-all',
                  isRevealed && isTheCorrectAnswer && 'bg-green-500/20 border-green-500/50',
                  isRevealed && isTheSelectedAnswer && !isTheCorrectAnswer && 'bg-red-500/20 border-red-500/50'
                )}
              >
                <RadioGroupItem value={option} id={`q-opt-${index}`} />
                <Label htmlFor={`q-opt-${index}`} className="flex-1 cursor-pointer">{option}</Label>
                {isRevealed && isTheCorrectAnswer && <CheckCircle className="w-5 h-5 text-green-500" />}
                {isRevealed && isTheSelectedAnswer && !isTheCorrectAnswer && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            );
          })}
        </RadioGroup>
      </div>
    );
  };

  return (
    <Card className={cn("transition-all duration-300 hover:shadow-yellow-500/20 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group", className)}>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
      <CardHeader>
        <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                <HelpCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <CardTitle>Daily Quiz 🗓️</CardTitle>
        </div>
        <CardDescription>A quick question to test your knowledge.</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
      {status === 'ready' && (
        <CardFooter>
            <Button onClick={handleSubmit} disabled={!selectedAnswer} className="w-full">
                Submit Answer
            </Button>
        </CardFooter>
      )}
       {status === 'answered' && isCorrect !== null && (
        <CardFooter className="flex-col items-center justify-center gap-2">
            <p className={cn("font-bold text-lg", isCorrect ? 'text-green-400' : 'text-red-400')}>
                {isCorrect ? "Correct!" : "Not quite!"}
            </p>
            {!isCorrect && <p className="text-sm text-muted-foreground">The correct answer was: <span className="font-semibold">{question?.answer}</span></p>}
             <Button onClick={() => setStatus('completed')} variant="secondary" className="mt-2">Continue</Button>
        </CardFooter>
      )}
    </Card>
  );
}
