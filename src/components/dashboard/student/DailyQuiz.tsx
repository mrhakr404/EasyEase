'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { generateDailyQuiz } from '@/ai/flows/daily-quiz-flow';
import type { McqQuestion, OptionKey } from '@/lib/types/quiz';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Lightbulb, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';

export function DailyQuiz({ courseTopic }: { courseTopic: string }) {
  const [question, setQuestion] = useState<McqQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<OptionKey | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const fetchQuiz = async () => {
    setIsLoading(true);
    setError(null);
    setQuestion(null);
    setSelectedAnswer(null);
    setIsAnswered(false);
    try {
      const quiz = await generateDailyQuiz(courseTopic);
      if (quiz.questions && quiz.questions.length > 0) {
        setQuestion(quiz.questions[0]);
      } else {
        throw new Error("No questions were generated.");
      }
    } catch (err) {
      console.error(err);
      setError("Couldn't generate a question. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [courseTopic]);

  const handleAnswerSubmit = (optionKey: OptionKey) => {
    if (isAnswered) return;
    setSelectedAnswer(optionKey);
    setIsAnswered(true);
  };
  
  const getButtonClass = (optionKey: OptionKey) => {
    if (!isAnswered) {
      return 'justify-start';
    }
    const isCorrect = question?.correctAnswer === optionKey;
    const isSelected = selectedAnswer === optionKey;

    if (isCorrect) {
      return 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30 text-green-300 justify-start';
    }
    if (isSelected && !isCorrect) {
      return 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-300 justify-start';
    }
    return 'justify-start';
  };

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-[250px]" />;
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-[250px] text-destructive">
          <AlertTriangle className="w-8 h-8 mb-2" />
          <p className="font-semibold">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchQuiz} className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    if (question) {
      return (
        <>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <CardTitle>Daily Quiz ❓</CardTitle>
                <CardDescription>Test your knowledge.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-semibold">{question.questionText}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(question.options) as OptionKey[]).map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  className={cn("h-auto py-2 whitespace-normal", getButtonClass(key))}
                  onClick={() => handleAnswerSubmit(key)}
                  disabled={isAnswered}
                >
                  <span className="font-bold mr-2">{key}.</span> {question.options[key]}
                </Button>
              ))}
            </div>
            {isAnswered && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm animate-fade-in space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                    {selectedAnswer === question.correctAnswer ? (
                         <><CheckCircle className="w-5 h-5 text-green-400" /> Correct!</>
                    ) : (
                         <><XCircle className="w-5 h-5 text-red-400" /> Incorrect</>
                    )}
                </div>
                <p className="text-muted-foreground"><span className="font-semibold">Explanation:</span> {question.explanation}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={fetchQuiz} className="w-full" disabled={!isAnswered}>
              Next Question
            </Button>
          </CardFooter>
        </>
      );
    }
    
    return null;
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-yellow-500/20 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
      {renderContent()}
    </Card>
  );
}