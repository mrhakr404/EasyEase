'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { generateQuiz, type Quiz, type QuizRequest } from '@/ai/flows/quiz-generator';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';

type QuizState = 'idle' | 'loading' | 'taking' | 'results';

export function QuizGenerator() {
  const [topic, setTopic] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [quizState, setQuizState] = useState<QuizState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleGenerateQuiz = async () => {
    if (!topic) {
      setError('Please enter a topic.');
      return;
    }
    setError(null);
    setQuizState('loading');
    setQuiz(null);

    try {
      const generatedQuiz = await generateQuiz({ topic, numQuestions: 5 });
      setQuiz(generatedQuiz);
      setUserAnswers(new Array(generatedQuiz.questions.length).fill(''));
      setQuizState('taking');
    } catch (err) {
      console.error(err);
      setError('Failed to generate quiz. The AI might be busy. Please try again in a moment.');
      setQuizState('idle');
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };
  
  const handleSubmitQuiz = () => {
    setQuizState('results');
  };
  
  const handleReset = () => {
    setQuizState('idle');
    setTopic('');
    setQuiz(null);
    setUserAnswers([]);
    setError(null);
  }

  const score = quiz ? userAnswers.reduce((correct, answer, index) => {
    return answer === quiz.questions[index].answer ? correct + 1 : correct;
  }, 0) : 0;


  const renderContent = () => {
    switch (quizState) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center text-center gap-4 py-16">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Generating your quiz on "{topic}"...</p>
            <p className="text-sm text-muted-foreground/80">This might take a moment.</p>
          </div>
        );
      case 'taking':
      case 'results':
        if (!quiz) return null;
        return (
          <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold font-headline">{quiz.title}</h2>
                {quizState === 'taking' && <p className="text-muted-foreground">Answer the questions below.</p>}
            </div>
            
            {quizState === 'results' && (
                <Card className="bg-primary/10 border-primary/30">
                    <CardContent className="p-6 text-center">
                        <h3 className="text-xl font-semibold mb-2">Quiz Complete!</h3>
                        <p className="text-4xl font-bold">You scored {score} out of {quiz.questions.length}</p>
                        <Progress value={(score / quiz.questions.length) * 100} className="w-1/2 mx-auto mt-4" />
                    </CardContent>
                </Card>
            )}

            {quiz.questions.map((q, qIndex) => (
              <Card key={qIndex} className={cn(
                  'transition-all',
                   quizState === 'results' && userAnswers[qIndex] === q.answer && 'border-green-500/50 bg-green-500/10',
                   quizState === 'results' && userAnswers[qIndex] !== q.answer && 'border-red-500/50 bg-red-500/10'
              )}>
                <CardHeader>
                  <CardTitle className="flex items-start gap-3">
                    <span>{qIndex + 1}.</span>
                    <span>{q.question}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={userAnswers[qIndex]}
                    onValueChange={(value) => handleAnswerChange(qIndex, value)}
                    disabled={quizState === 'results'}
                  >
                    {q.options.map((option, oIndex) => (
                      <div key={oIndex} className={cn(
                          "flex items-center space-x-3 p-3 rounded-md transition-all",
                          quizState === 'results' && option === q.answer && 'bg-green-500/20',
                          quizState === 'results' && userAnswers[qIndex] === option && option !== q.answer && 'bg-red-500/20'
                      )}>
                        <RadioGroupItem value={option} id={`q${qIndex}-o${oIndex}`} />
                        <Label htmlFor={`q${qIndex}-o${oIndex}`} className="flex-1 cursor-pointer">{option}</Label>
                        {quizState === 'results' && option === q.answer && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {quizState === 'results' && userAnswers[qIndex] === option && option !== q.answer && <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
            <div className="flex justify-center gap-4">
                {quizState === 'taking' && (
                    <Button onClick={handleSubmitQuiz} size="lg">Submit Quiz</Button>
                )}
                {quizState === 'results' && (
                    <Button onClick={handleReset} size="lg" variant="secondary">Create Another Quiz</Button>
                )}
            </div>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="text-center max-w-lg mx-auto py-16">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
            <h2 className="text-2xl font-bold font-headline mb-2">Auto Quiz Generator</h2>
            <p className="text-muted-foreground mb-6">
              Enter any topic, and our AI will instantly generate a multiple-choice quiz to test your knowledge.
            </p>
            <div className="flex w-full items-center space-x-2">
              <Input
                type="text"
                placeholder="e.g., React Hooks, Photosynthesis, World War II"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateQuiz()}
              />
              <Button onClick={handleGenerateQuiz}>Generate</Button>
            </div>
             {error && <p className="text-sm text-destructive mt-4">{error}</p>}
          </div>
        );
    }
  };

  return (
    <div className="h-full w-full animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
}
