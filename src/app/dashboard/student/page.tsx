'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarSeparator } from '@/components/ui/sidebar';
import { GraduationCap, LayoutDashboard, NotebookText, Route, BrainCircuit, Users, Code, ArrowRight, Target, Calendar, TrendingUp, Sparkles, HelpCircle, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/components/ui/user-profile';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import type { DailyQuizAttempt } from '@/lib/types';
import { DailyQuizCard } from '@/components/dashboard/DailyQuizCard';


// Lazy load heavy components
const NotesTab = dynamic(() => import('@/components/dashboard/NotesTab').then(mod => mod.NotesTab), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const CodeCompanion = dynamic(() => import('@/components/dashboard/CodeCompanion').then(mod => mod.CodeCompanion), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const LearningPath = dynamic(() => import('@/components/dashboard/LearningPath').then(mod => mod.LearningPath), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const Whiteboard = dynamic(() => Promise.resolve(() => <div className="p-4 rounded-lg bg-card border">Whiteboard Component Loaded</div>), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const QuizGenerator = dynamic(() => import('@/components/dashboard/QuizGenerator').then(mod => mod.QuizGenerator), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const PdfSummarizer = dynamic(() => import('@/components/dashboard/PdfSummarizer').then(mod => mod.PdfSummarizer), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });


const Overview = ({ setActiveComponent }: { setActiveComponent: (componentName: string) => void }) => {
    const { user, profile } = useAuth();
    const firestore = useFirestore();

    const quizAttemptsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return query(
            collection(firestore, `userProfiles/${user.uid}/dailyQuizAttempts`),
            orderBy('attemptedAt', 'desc')
        );
    }, [user, firestore]);

    const { data: quizAttempts, isLoading: isLoadingAttempts } = useCollection<DailyQuizAttempt>(quizAttemptsQuery);
    
    const quizStats = useMemo(() => {
        if (!quizAttempts) return { accuracy: 0, total: 0 };
        const total = quizAttempts.length;
        if (total === 0) return { accuracy: 0, total: 0 };
        const correct = quizAttempts.filter(qa => qa.isCorrect).length;
        return {
            accuracy: Math.round((correct / total) * 100),
            total,
            correct
        }
    }, [quizAttempts]);


    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 py-1">
                    Welcome back, {profile?.firstName || 'Student'}!
                </h1>
                <p className="text-muted-foreground">Here's a summary of your learning journey today.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="transition-all duration-300 hover:shadow-primary/20 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group lg:col-span-2">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                                <GraduationCap className="w-5 h-5 text-primary" />
                            </div>
                            <CardTitle>Current Course</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold mb-2">Advanced React</p>
                        <div className="flex items-center gap-4">
                            <Progress value={75} className="w-full" />
                            <span className="text-sm font-semibold text-primary">75%</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="transition-all duration-300 hover:shadow-green-500/20 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
                                <Target className="w-5 h-5 text-green-400" />
                            </div>
                            <CardTitle>Overall Progress</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-center gap-2">
                             <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-green-400 to-green-600">82%</p>
                        </div>
                        <p className="text-sm text-muted-foreground text-center">Course Completion</p>
                        <div className="border-t border-border my-3"></div>
                        <div className="flex items-baseline justify-center gap-2">
                            {isLoadingAttempts ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-green-400 to-green-600">{quizStats.accuracy}%</p>}
                        </div>
                        <p className="text-sm text-muted-foreground text-center">Daily Quiz Accuracy</p>
                    </CardContent>
                </Card>
                <Card className="transition-all duration-300 hover:shadow-red-500/20 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/30">
                                <Calendar className="w-5 h-5 text-red-400" />
                            </div>
                            <CardTitle>Assignments Due</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-red-400 to-red-600">3</p>
                        <p className="text-sm text-muted-foreground">Next due: Friday</p>
                    </CardContent>
                </Card>
                
                <DailyQuizCard className="lg:col-span-3" />

                <Card className="lg:col-span-1 transition-all duration-300 hover:shadow-violet-500/20 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-500/20 rounded-lg border border-violet-500/30">
                                <ArrowRight className="w-5 h-5 text-violet-400" />
                            </div>
                            <CardTitle>Quick Actions</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <Button onClick={() => setActiveComponent('Learning Path')} variant="outline">View Learning Path</Button>
                        <Button onClick={() => setActiveComponent('PDF Summarizer')} variant="outline">Summarize a Document</Button>
                    </CardContent>
                </Card>
                
            </div>
        </div>
    );
};


export default function StudentDashboardPage() {
  const { user, profile } = useAuth();
  const [activeComponent, setActiveComponent] = useState('Overview');
  
  const renderContent = () => {
    switch (activeComponent) {
        case 'Notes':
            return <NotesTab />;
        case 'Code Companion':
            return <CodeCompanion />;
        case 'Learning Path':
            return <LearningPath />;
        case 'Quiz Generator':
            return <QuizGenerator />;
        case 'PDF Summarizer':
            return <PdfSummarizer />;
        case 'Whiteboard':
            return <Whiteboard />;
        case 'Overview':
        default:
            return <Overview setActiveComponent={setActiveComponent}/>;
    }
  };

  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, color: 'text-sky-400' },
    { name: 'Notes', icon: NotebookText, color: 'text-amber-400' },
    { name: 'Code Companion', icon: Code, color: 'text-green-400' },
    { name: 'Learning Path', icon: Route, color: 'text-rose-400' },
    { name: 'Quiz Generator', icon: Sparkles, color: 'text-yellow-400' },
    { name: 'PDF Summarizer', icon: FileText, color: 'text-orange-400' },
    { name: 'Whiteboard', icon: Users, color: 'text-blue-400' },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold font-headline">Student Portal</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map(item => (
                <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                        isActive={activeComponent === item.name}
                        onClick={() => setActiveComponent(item.name)}
                        className="group"
                    >
                        <item.icon className={cn("transition-colors", item.color, activeComponent === item.name && 'text-primary-foreground')} />
                        {item.name}
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
         <SidebarFooter>
          <SidebarSeparator />
          <UserProfile />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="p-8 h-full">
            {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
