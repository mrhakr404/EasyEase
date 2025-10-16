'use client';

import React from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarSeparator } from '@/components/ui/sidebar';
import { Building, LayoutDashboard, BarChart3, Users, BookCopy, Settings, BotMessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/components/ui/user-profile';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ProfileSettings = dynamic(() => import('@/components/dashboard/ProfileSettings').then(mod => mod.ProfileSettings), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const CourseManagement = dynamic(() => import('@/components/dashboard/institute/CourseManagement').then(mod => mod.CourseManagement), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });


export default function InstituteDashboardPage() {
  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, color: 'text-sky-400' },
    { name: 'Course Management', icon: BookCopy, color: 'text-amber-400' },
    { name: 'Student Management', icon: Users, color: 'text-blue-400' },
    { name: 'AI Tools', icon: BotMessageSquare, color: 'text-violet-400' },
    { name: 'Analytics', icon: BarChart3, color: 'text-rose-400' },
    { name: 'Settings', icon: Settings, color: 'text-slate-400' },
  ];
  const [activeComponent, setActiveComponent] = React.useState('Overview');
  
  const renderContent = () => {
    switch (activeComponent) {
      case 'Settings':
        return <ProfileSettings />;
      case 'Course Management':
        return <CourseManagement />;
      case 'Overview':
      default:
        return (
          <div className="animate-fade-in">
             <h1 className="text-3xl font-bold mb-8 font-headline">Institute Dashboard</h1>
              {/* SECURITY NOTE: All critical write actions (e.g., creating courses, enrolling students)
                  must be validated on the server-side via Firebase Callable Functions to ensure
                  the user has the 'institute' role and proper permissions. Client-side checks are for UI only.
              */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <CardHeader>
                    <CardTitle>Total Courses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground">Active Courses</p>
                  </CardContent>
                </Card>
                <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <CardHeader>
                    <CardTitle>Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold">452</p>
                    <p className="text-sm text-muted-foreground">Enrolled</p>
                  </CardContent>
                </Card>
                 <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Generate and view key reports.</p>
                    <Button>Generate Monthly Report</Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>John Doe</TableCell>
                        <TableCell>Advanced React</TableCell>
                        <TableCell>Completed Lesson 3</TableCell>
                        <TableCell className="text-right">
                          Just now
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Jane Smith</TableCell>
                        <TableCell>Intro to AI</TableCell>
                        <TableCell>Enrolled</TableCell>
                        <TableCell className="text-right">
                          5m ago
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Sam Wilson</TableCell>
                        <TableCell>UX Design Fundamentals</TableCell>
                        <TableCell>Submitted Assignment</TableCell>
                        <TableCell className="text-right">
                          1h ago
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Building className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold font-headline">Institute Panel</h2>
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
        <main className="p-8 animate-fade-in" data-main-scroll>
          {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
