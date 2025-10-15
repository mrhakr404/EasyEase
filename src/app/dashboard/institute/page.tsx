'use client';

import React from 'react';
import { useUser } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import useUserProfile from '@/hooks/useUserProfile';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Building, LayoutDashboard, BarChart3, Users, BookCopy, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardSkeleton = () => (
  <div className="flex">
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


export default function InstituteDashboardPage() {
  const { user, isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const router = useRouter();

  if (isUserLoading || isProfileLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    router.replace('/login');
    return <DashboardSkeleton />;
  }

  if (userProfile && userProfile.role !== 'institute') {
    router.replace(`/dashboard/${userProfile.role || 'student'}`);
    return <DashboardSkeleton />;
  }

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
            <SidebarMenuItem>
              <SidebarMenuButton isActive>
                <LayoutDashboard />
                Overview
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <BookCopy />
                Course Management
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Users />
                Student Management
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <BarChart3 />
                Analytics
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Settings />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="p-8">
          <h1 className="text-3xl font-bold mb-8 font-headline">Institute Dashboard</h1>
          {/* SECURITY NOTE: All critical write actions (e.g., creating courses, enrolling students)
              must be validated on the server-side via Firebase Callable Functions to ensure
              the user has the 'institute' role and proper permissions. Client-side checks are for UI only.
          */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Total Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Active Courses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">452</p>
                <p className="text-sm text-muted-foreground">Enrolled</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Generate and view key reports.</p>
                <Button>Generate Monthly Report</Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Course Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Advanced React</TableCell>
                    <TableCell>78</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Intro to AI</TableCell>
                    <TableCell>120</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>UX Design Fundamentals</TableCell>
                    <TableCell>55</TableCell>
                    <TableCell>Draft</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}