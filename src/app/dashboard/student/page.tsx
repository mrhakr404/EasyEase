'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarSeparator } from '@/components/ui/sidebar';
import { GraduationCap, LayoutDashboard, NotebookText, BotMessageSquare, Route, BrainCircuit, Users, Code } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/components/ui/user-profile';
import { cn } from '@/lib/utils';


// Lazy load heavy components
const NotesTab = dynamic(() => import('@/components/dashboard/NotesTab').then(mod => mod.NotesTab), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const ChatInterface = dynamic(() => import('@/components/chat/ChatInterface').then(mod => mod.ChatInterface), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const CodeCompanion = dynamic(() => import('@/components/dashboard/CodeCompanion').then(mod => mod.CodeCompanion), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const LearningPath = dynamic(() => import('@/components/dashboard/LearningPath').then(mod => mod.LearningPath), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const Whiteboard = dynamic(() => Promise.resolve(() => <div className="p-4 rounded-lg bg-card border">Whiteboard Component Loaded</div>), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });


const Overview = () => (
    <div className="animate-fade-in">
        <h1 className="text-3xl font-bold mb-8 font-headline">Student Dashboard</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <CardHeader>
                    <CardTitle>Current Course</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">Advanced React</p>
                    <p className="text-sm text-muted-foreground">75% Complete</p>
                </CardContent>
            </Card>
            <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <CardHeader>
                    <CardTitle>Assignments Due</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-sm text-muted-foreground">Next due: Friday</p>
                </CardContent>
            </Card>
            <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <CardHeader>
                    <CardTitle>Overall Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">82%</p>
                    <p className="text-sm text-muted-foreground">Across all courses</p>
                </CardContent>
            </Card>
        </div>
        <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
                <CardTitle>Predictive Learning Path</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm">
                    <li>1. State Management with Zustand</li>
                    <li>2. Server Components in Depth</li>
                    <li>3. Advanced Animation with Framer Motion</li>
                </ul>
            </CardContent>
        </Card>
    </div>
);


export default function StudentDashboardPage() {
  const { user, profile } = useAuth();
  const [activeComponent, setActiveComponent] = useState('Overview');
  
  const renderContent = () => {
    switch (activeComponent) {
        case 'Notes':
            return <NotesTab />;
        case 'AI Chat':
            return <ChatInterface />;
        case 'Code Companion':
            return <CodeCompanion />;
        case 'Learning Path':
            return <LearningPath />;
        case 'Whiteboard':
            return <Whiteboard />;
        case 'Overview':
        default:
            return <Overview />;
    }
  };

  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, color: 'text-sky-400' },
    { name: 'Notes', icon: NotebookText, color: 'text-amber-400' },
    { name: 'AI Chat', icon: BotMessageSquare, color: 'text-violet-400' },
    { name: 'Code Companion', icon: Code, color: 'text-green-400' },
    { name: 'Learning Path', icon: Route, color: 'text-rose-400' },
    { name: 'AR/VR Labs', icon: BrainCircuit, color: 'text-teal-400' },
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
