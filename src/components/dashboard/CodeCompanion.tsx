'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BotMessageSquare, Code, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { aiCodeReview, type AICodeReviewOutput } from '@/ai/flows/ai-code-review';

export function CodeCompanion() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [review, setReview] = useState<AICodeReviewOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReview = async () => {
    if (!code) {
      setError('Please enter some code to review.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setReview(null);
    try {
      const result = await aiCodeReview({ code, language });
      setReview(result);
    } catch (err) {
      console.error(err);
      setError('An error occurred while reviewing the code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full">
        <div className="flex items-center gap-3">
            <BotMessageSquare className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">AI Code Companion</h1>
        </div>
        <div className="grid md:grid-cols-2 gap-8 flex-1">
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Code className="w-5 h-5" /> Your Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                    <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                </SelectContent>
                </Select>
                <Textarea
                placeholder="Paste your code snippet here..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-full min-h-[300px] font-code text-sm"
                />
                <Button onClick={handleReview} disabled={isLoading} className="w-full">
                {isLoading ? 'Analyzing...' : 'Review Code'}
                </Button>
                {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-400" /> AI Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/3 mt-4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </div>
                )}
                {review && (
                <div className="space-y-6 text-sm">
                    <div>
                    <h3 className="font-semibold mb-2">Suggestions:</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{review.suggestions}</p>
                    </div>
                    {review.reasoning && (
                    <div>
                        <h3 className="font-semibold mb-2">Reasoning:</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{review.reasoning}</p>
                    </div>
                    )}
                </div>
                )}
                {!isLoading && !review && (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Your code review will appear here.</p>
                    </div>
                )}
            </CardContent>
            </Card>
        </div>
    </div>
  );
}
