'use client';

import React, { useState } from 'react';
import { useUser } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import useUserProfile from '@/hooks/useUserProfile';
import dynamic from 'next/dynamic';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { GraduationCap, LayoutDashboard, NotebookText, BotMessageSquare, Route, BrainCircuit, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Mock components for lazy loading
const MockNotesTab = () => <div className="p-4">Notes Component Loaded</div>;
const MockChatInterface = () => <div className="p-4">Chat Interface Loaded</div>;
const MockWhiteboard = () => <div className="p-4">Whiteboard Loaded</div>;
const MockCodeCompanion = () => <div className="p-4">Code Companion Loaded</div>;

// Lazy load heavy components
const NotesTab = dynamic(() => Promise.resolve(MockNotesTab), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const ChatInterface = dynamic(() => Promise.resolve(MockChatInterface), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const Whiteboard = dynamic(() => Promise.resolve(MockWhiteboard), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const CodeCompanion = dynamic(() => Promise.resolve(MockCodeCompanion), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });

const DashboardSkeleton = () => (
  <div className="flex h-screen">
    <div className="w-64 p-4 border-r">
      <Skeleton className="h-8 w-32 mb-8" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
    <div className="flex-1 p-8 space-y-8">
      <Skeleton className="h-10 w-1/4" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);

const Overview = () => (
    <>
        <h1 className="text-3xl font-bold mb-8 font-headline">Student Dashboard</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
                <CardHeader>
                    <CardTitle>Current Course</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">Advanced React</p>
                    <p className="text-sm text-muted-foreground">75% Complete</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Assignments Due</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-sm text-muted-foreground">Next due: Friday</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Overall Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">82%</p>
                    <p className="text-sm text-muted-foreground">Across all courses</p>
                </CardContent>
            </Card>
        </div>
        <Card>
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
    </>
);


export default function StudentDashboardPage() {
  const { user, isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const router = useRouter();
  const [activeComponent, setActiveComponent] = useState('Overview');

  if (isUserLoading || isProfileLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    router.replace('/login');
    return <DashboardSkeleton />;
  }

  if (userProfile && userProfile.role !== 'student') {
    router.replace(`/dashboard/${userProfile.role || 'institute'}`);
    return <DashboardSkeleton />;
  }
  
  const renderContent = () => {
    switch (activeComponent) {
        case 'Notes':
            return <NotesTab />;
        case 'Chat':
            return <ChatInterface />;
        case 'Whiteboard':
            return <Whiteboard />;
        case 'Code Companion':
            return <CodeCompanion />;
        case 'Overview':
        default:
            return <Overview />;
    }
  };

  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard },
    { name: 'Notes', icon: NotebookText },
    { name: 'AI Chat', icon: BotMessageSquare },
    { name: 'Learning Path', icon: Route },
    { name: 'AR/VR Labs', icon: BrainCircuit },
    { name: 'Whiteboard', icon: Users },
    { name: 'Code Companion', icon: BotMessageSquare },
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
                    >
                        <item.icon />
                        {item.name}
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="p-8 h-full">
            {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}