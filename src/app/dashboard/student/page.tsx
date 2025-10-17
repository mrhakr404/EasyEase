'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarSeparator } from '@/components/ui/sidebar';
import { GraduationCap, LayoutDashboard, NotebookText, Route, BrainCircuit, Users, Code, ArrowRight, Target, Calendar, Sparkles, FileText, Spline, Settings, BookCopy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/components/ui/user-profile';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';


// Lazy load heavy components
const NotesTab = dynamic(() => import('@/components/dashboard/NotesTab').then(mod => mod.NotesTab), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const CodeCompanion = dynamic(() => import('@/components/dashboard/CodeCompanion').then(mod => mod.CodeCompanion), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const LearningPath = dynamic(() => import('@/components/dashboard/LearningPath').then(mod => mod.LearningPath), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const Whiteboard = dynamic(() => import('@/components/dashboard/Whiteboard').then(mod => mod.Whiteboard), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const PdfSummarizer = dynamic(() => import('@/components/dashboard/PdfSummarizer').then(mod => mod.PdfSummarizer), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const AiTutor = dynamic(() => import('@/components/dashboard/AiTutor').then(mod => mod.AiTutor), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const ProfileSettings = dynamic(() => import('@/components/dashboard/ProfileSettings').then(mod => mod.ProfileSettings), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const Courses = dynamic(() => import('@/components/dashboard/student/Courses').then(mod => mod.Courses), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });


const Overview = ({ setActiveComponent }: { setActiveComponent: (componentName: string) => void }) => {
    const { user, profile } = useAuth();

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 py-1">
                    Welcome back, {profile?.firstName || 'Student'}!
                </h1>
                <p className="text-muted-foreground">Here's a summary of your learning journey today.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                
                <Card className="lg:col-span-2 transition-all duration-300 hover:shadow-violet-500/20 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group">
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
        case 'Courses':
            return <Courses />;
        case 'Code Companion':
            return <CodeCompanion />;
        case 'Learning Path':
            return <LearningPath />;
        case 'PDF Summarizer':
            return <PdfSummarizer />;
        case 'AI Tutor':
            return <AiTutor />;
        case 'Whiteboard':
            return <Whiteboard />;
        case 'Settings':
            return <ProfileSettings />;
        case 'Overview':
        default:
            return <Overview setActiveComponent={setActiveComponent}/>;
    }
  };

  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, color: 'text-sky-400' },
    { name: 'Courses', icon: BookCopy, color: 'text-orange-400' },
    { name: 'Notes', icon: NotebookText, color: 'text-amber-400' },
    { name: 'AI Tutor', icon: BrainCircuit, color: 'text-violet-400' },
    { name: 'Code Companion', icon: Code, color: 'text-green-400' },
    { name: 'Learning Path', icon: Route, color: 'text-rose-400' },
    { name: 'PDF Summarizer', icon: FileText, color: 'text-orange-400' },
    { name: 'Whiteboard', icon: Spline, color: 'text-blue-400' },
    { name: 'Settings', icon: Settings, color: 'text-slate-400' },
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
          <UserProfile onProfileClick={() => setActiveComponent('Settings')} />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="p-8 h-full overflow-y-auto" data-main-scroll>
            {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
