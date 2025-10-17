'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { generateDailyQuiz } from '@/ai/flows/daily-quiz-flow';
import type { Quiz, McqQuestion } from '@/lib/types';
import { CheckCircle, XCircle, Lightbulb, Loader2, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const courseTopic = 'Advanced React'; // This would be dynamic in a real app

export function DailyQuiz() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const fetchQuiz = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const generatedQuiz = await generateDailyQuiz({ course: courseTopic });
                setQuiz(generatedQuiz);
            } catch (err) {
                console.error("Couldn't generate a question.", err);
                setError("Sorry, I couldn't generate a quiz right now. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuiz();
    }, []);

    const currentQuestion = useMemo(() => {
        return quiz?.questions[currentQuestionIndex];
    }, [quiz, currentQuestionIndex]);

    const handleAnswerSubmit = () => {
        if (!selectedAnswer || !currentQuestion) return;

        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
        if (isCorrect) {
            setScore(prev => prev + 1);
        }
        setIsAnswered(true);
    };

    const handleNextQuestion = () => {
        setIsAnswered(false);
        setSelectedAnswer(null);

        if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Quiz finished, save attempt
            if (user && firestore && quiz) {
                 const attemptData = {
                    userId: user.uid,
                    quizTitle: quiz.quizTitle,
                    course: courseTopic,
                    score: score,
                    total: quiz.questions.length,
                    attemptedAt: serverTimestamp(),
                 };
                const attemptsCollectionRef = collection(firestore, `userProfiles/${user.uid}/quizAttempts`);
                addDoc(attemptsCollectionRef, attemptData)
                    .catch(error => {
                        console.error("Error saving quiz attempt:", error);
                        errorEmitter.emit('permission-error', new FirestorePermissionError({
                            path: attemptsCollectionRef.path,
                            operation: 'create',
                            requestResourceData: attemptData,
                        }));
                    });
            }
            setCurrentQuestionIndex(quiz?.questions.length ?? 0);
        }
    };
    
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
        )
    }

    if (error) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Daily Quiz</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">{error}</p>
                </CardContent>
            </Card>
        )
    }

    if (!quiz || !currentQuestion) {
        return null; // Or some other placeholder
    }

    const isQuizFinished = currentQuestionIndex >= quiz.questions.length;

     if (isQuizFinished) {
        return (
            <Card className="flex flex-col items-center justify-center text-center p-8">
                <CardHeader>
                    <Award className="w-16 h-16 text-yellow-400 mx-auto" />
                    <CardTitle className="text-2xl mt-4">Quiz Complete!</CardTitle>
                    <CardDescription>Great job finishing your daily quiz.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{score} / {quiz.questions.length}</p>
                    <p className="text-muted-foreground">Your Score</p>
                </CardContent>
                 <CardFooter>
                    <Button onClick={() => window.location.reload()}>Take Another Quiz</Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{quiz.quizTitle}</CardTitle>
                <CardDescription>Question {currentQuestionIndex + 1} of {quiz.questions.length}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="font-semibold text-lg">{currentQuestion.questionText}</p>
                
                <RadioGroup
                    value={selectedAnswer ?? ''}
                    onValueChange={setSelectedAnswer}
                    disabled={isAnswered}
                >
                    {Object.entries(currentQuestion.options).map(([key, value]) => {
                        const isCorrect = key === currentQuestion.correctAnswer;
                        const isSelected = key === selectedAnswer;
                        
                        return (
                            <div key={key}>
                                <RadioGroupItem value={key} id={`q${currentQuestion.id}-${key}`} className="sr-only peer" />
                                <Label 
                                    htmlFor={`q${currentQuestion.id}-${key}`}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer",
                                        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                                        isAnswered && isCorrect && "bg-green-500/10 border-green-500",
                                        isAnswered && !isCorrect && isSelected && "bg-red-500/10 border-red-500"
                                    )}
                                >
                                    <span className="font-bold">{key}</span>
                                    <span>{value}</span>
                                    {isAnswered && isCorrect && <CheckCircle className="ml-auto text-green-500" />}
                                    {isAnswered && !isCorrect && isSelected && <XCircle className="ml-auto text-red-500" />}
                                </Label>
                            </div>
                        )
                    })}
                </RadioGroup>

                {isAnswered && (
                    <Alert className={cn(selectedAnswer === currentQuestion.correctAnswer ? "border-green-500/50 text-green-300" : "border-red-500/50 text-red-300")}>
                        <Lightbulb className="h-4 w-4" />
                        <AlertTitle>{selectedAnswer === currentQuestion.correctAnswer ? "Correct!" : "Not Quite"}</AlertTitle>
                        <AlertDescription>
                            {currentQuestion.explanation}
                        </AlertDescription>
                    </Alert>
                )}

            </CardContent>
            <CardFooter>
                {!isAnswered ? (
                    <Button onClick={handleAnswerSubmit} disabled={!selectedAnswer}>Submit Answer</Button>
                ) : (
                    <Button onClick={handleNextQuestion}>
                        {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
