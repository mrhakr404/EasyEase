'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, BookCopy, Users, Edit, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { createCourse, updateCourse } from '@/lib/firebase/courses';
import type { Course } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export function CourseManagement() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const [isNewCourseDialogOpen, setIsNewCourseDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');

  const coursesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'courses'), where('instituteId', '==', user.uid));
  }, [user, firestore]);

  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

  const handleCreateCourse = async () => {
    if (!newCourseTitle || !newCourseDescription || !user || !firestore) return;
    setIsSaving(true);
    try {
      await createCourse(firestore, user.uid, {
        title: newCourseTitle,
        description: newCourseDescription,
      });
      setNewCourseTitle('');
      setNewCourseDescription('');
      setIsNewCourseDialogOpen(false);
    } catch (error) {
      console.error("Failed to create course:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = (course: Course) => {
    if (!user || !firestore) return;
    updateCourse(firestore, course.id, { published: !course.published });
  };
  
  const courseColors = [
    { color: 'text-sky-400', borderColor: 'hover:border-sky-400/50' },
    { color: 'text-violet-400', borderColor: 'hover:border-violet-400/50' },
    { color: 'text-amber-400', borderColor: 'hover:border-amber-400/50' },
    { color: 'text-rose-400', borderColor: 'hover:border-rose-400/50' },
    { color: 'text-emerald-400', borderColor: 'hover:border-emerald-400/50' },
    { color: 'text-blue-400', borderColor: 'hover:border-blue-400/50' },
  ];

  return (
    <div className="flex flex-col h-full gap-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BookCopy className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline">Course Management</h1>
        </div>
        <Dialog open={isNewCourseDialogOpen} onOpenChange={setIsNewCourseDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new course. You can add content and publish it later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} className="col-span-3" placeholder="e.g., Advanced React" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea id="description" value={newCourseDescription} onChange={(e) => setNewCourseDescription(e.target.value)} className="col-span-3" placeholder="A brief summary of the course..." />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
              <Button type="submit" onClick={handleCreateCourse} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Course
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
             <Card key={i} className="flex flex-col">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
               <CardContent className="flex-1">
                 <Skeleton className="h-4 w-2/4" />
               </CardContent>
              <CardFooter>
                  <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses?.map((course, index) => {
            const style = courseColors[index % courseColors.length];
            return (
              <Card key={course.id} className={cn("flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1", style.borderColor)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <BookCopy className={cn("w-6 h-6 mt-1 flex-shrink-0", style.color)} />
                        <CardTitle className="leading-tight">{course.title}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 flex-shrink-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem><Edit className="mr-2"/> Edit Course</DropdownMenuItem>
                            <DropdownMenuItem><Users className="mr-2"/> View Students</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500"><Trash2 className="mr-2"/> Delete Course</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                  <CardDescription className="line-clamp-2 pl-10">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center text-sm text-muted-foreground pl-10">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{course.studentIds?.length || 0} Students Enrolled</span>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                        checked={course.published}
                        onCheckedChange={() => handleTogglePublish(course)}
                        id={`publish-switch-${course.id}`}
                    />
                    <Label htmlFor={`publish-switch-${course.id}`} className="text-sm font-medium">{course.published ? 'Published' : 'Draft'}</Label>
                  </div>
                  <Button variant="outline" size="sm">View Content</Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  );
}
