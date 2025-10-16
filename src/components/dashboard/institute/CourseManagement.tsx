'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, BookCopy, Users, Edit, MoreVertical, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Mock data, replace with Firestore data
const initialCourses = [
  { id: '1', title: 'Advanced React', description: 'Deep dive into React performance and hooks.', studentCount: 78, published: true },
  { id: '2', title: 'Intro to AI', description: 'Learn the fundamentals of Artificial Intelligence.', studentCount: 120, published: true },
  { id: '3', title: 'UX Design Fundamentals', description: 'Principles of user experience and interface design.', studentCount: 55, published: false },
  { id: '4', title: 'Next.js for Production', description: 'Build and deploy scalable Next.js applications.', studentCount: 95, published: true },
];

type Course = typeof initialCourses[0];

export function CourseManagement() {
  const [courses, setCourses] = useState(initialCourses);
  const [isNewCourseDialogOpen, setIsNewCourseDialogOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');

  const handleCreateCourse = () => {
    if (!newCourseTitle || !newCourseDescription) return;
    const newCourse: Course = {
      id: (courses.length + 1).toString(),
      title: newCourseTitle,
      description: newCourseDescription,
      studentCount: 0,
      published: false,
    };
    setCourses([newCourse, ...courses]);
    setNewCourseTitle('');
    setNewCourseDescription('');
    setIsNewCourseDialogOpen(false);
  };
  
  const togglePublish = (courseId: string) => {
      setCourses(courses.map(c => c.id === courseId ? {...c, published: !c.published} : c));
  }

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
                Fill in the details below to create a new course. You can add content later.
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
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" onClick={handleCreateCourse}>Create Course</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <CardTitle className="leading-tight">{course.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
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
              <CardDescription className="line-clamp-2">{course.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="w-4 h-4 mr-2" />
                <span>{course.studentCount} Students Enrolled</span>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch 
                    checked={course.published} 
                    onCheckedChange={() => togglePublish(course.id)}
                    id={`publish-switch-${course.id}`}
                />
                <Label htmlFor={`publish-switch-${course.id}`} className="text-sm font-medium">{course.published ? 'Published' : 'Draft'}</Label>
              </div>
              <Button variant="outline" size="sm">View Content</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
