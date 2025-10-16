'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Course } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookCopy, Search, FileX } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Courses() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'courses'),
      where('published', '==', true)
    );
  }, [firestore]);

  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter(course => 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [courses, searchTerm]);

  return (
    <div className="flex flex-col h-full gap-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <BookCopy className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline">Browse Courses</h1>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for courses..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
                 <Skeleton className="h-4 w-1/2 mt-1" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredCourses.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map((course, index) => (
            <Card key={course.id} className={cn("flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in")} style={{ animationDelay: `${index * 50}ms` }}>
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription className="line-clamp-3 h-[60px]">{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1" />
              <CardFooter>
                <Button className="w-full">Enroll Now</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground">
            <FileX className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-semibold">No Courses Found</h3>
            <p>
                {searchTerm 
                    ? `No courses match "${searchTerm}". Try a different search.`
                    : "There are no published courses available right now."
                }
            </p>
        </div>
      )}
    </div>
  );
}
