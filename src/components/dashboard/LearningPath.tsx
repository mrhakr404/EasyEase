'use client';

import React from 'react';
import { CheckCircle, Circle, ArrowRight, Loader } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const learningPathData = [
  {
    id: 1,
    title: 'React Fundamentals',
    description: 'Master the basics of React, including components, props, and state.',
    status: 'Completed',
  },
  {
    id: 2,
    title: 'Advanced React Hooks',
    description: 'Dive deep into hooks like useMemo, useCallback, and custom hooks.',
    status: 'In Progress',
  },
  {
    id: 3,
    title: 'State Management with Zustand',
    description: 'Learn a simple and powerful state management library for React.',
    status: 'Next Up',
  },
  {
    id: 4,
    title: 'Server Components in Depth',
    description: 'Understand the power of Next.js App Router and Server Components.',
    status: 'Not Started',
  },
  {
    id: 5,
    title: 'Advanced Animation with Framer Motion',
    description: 'Bring your applications to life with beautiful and performant animations.',
    status: 'Not Started',
  },
];

const statusIcons = {
  Completed: <CheckCircle className="h-6 w-6 text-green-500" />,
  'In Progress': <Loader className="h-6 w-6 text-blue-500 animate-spin" />,
  'Next Up': <ArrowRight className="h-6 w-6 text-yellow-500" />,
  'Not Started': <Circle className="h-6 w-6 text-muted-foreground" />,
};

const statusColors = {
    Completed: 'bg-green-500/10 border-green-500/50 text-green-300',
    'In Progress': 'bg-blue-500/10 border-blue-500/50 text-blue-300',
    'Next Up': 'bg-yellow-500/10 border-yellow-500/50 text-yellow-300',
    'Not Started': 'bg-muted/50 border-border',
}

export function LearningPath() {
  return (
    <div className="h-full w-full">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold font-headline">Your Personalized Learning Path</h1>
      </div>
      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-11 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>
        
        <div className="space-y-12">
            {learningPathData.map((item) => (
                <div key={item.id} className="relative">
                    <div className="absolute left-0 top-1.5 -translate-x-1/2">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-background border-2 border-primary">
                            {statusIcons[item.status as keyof typeof statusIcons]}
                        </div>
                    </div>
                    <Card className={cn("ml-12", item.status === 'In Progress' && 'border-primary ring-1 ring-primary shadow-lg')}>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>{item.title}</CardTitle>
                                <Badge variant="outline" className={cn(statusColors[item.status as keyof typeof statusColors])}>
                                    {item.status}
                                </Badge>
                            </div>
                            <CardDescription>{item.description}</CardDescription>
                        </CardHeader>
                        {item.status === 'In Progress' && (
                            <CardContent>
                                <Button>Continue Learning</Button>
                            </CardContent>
                        )}
                    </Card>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
