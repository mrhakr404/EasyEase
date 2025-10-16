'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Camera } from 'lucide-react';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';

function getInitials(name?: string | null) {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1 && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
}


export function ProfileSettings() {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
    }
  }, [profile]);
  
  const handleSaveChanges = async () => {
      if (!user) {
          toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
          return;
      }
      setIsSaving(true);
      try {
          await updateUserProfile(user.uid, { firstName, lastName });
          toast({ title: 'Success', description: 'Your profile has been updated.' });
      } catch (error) {
          console.error("Error updating profile:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
      } finally {
          setIsSaving(false);
      }
  }

  const displayName = profile?.firstName || user?.displayName || user?.email;
  const initials = getInitials(displayName);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
            <User className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">Profile Settings</h1>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-primary/20">
                            <AvatarImage src={user?.photoURL || ''} alt="Profile Picture" />
                            <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8">
                           <Camera className="h-4 w-4" />
                           <span className="sr-only">Change Photo</span>
                        </Button>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold">{displayName}</h2>
                        <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                            id="firstName" 
                            value={firstName} 
                            onChange={(e) => setFirstName(e.target.value)}
                            disabled={isSaving || authLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                            id="lastName" 
                            value={lastName} 
                            onChange={(e) => setLastName(e.target.value)}
                            disabled={isSaving || authLoading}
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSaveChanges} disabled={isSaving || authLoading}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Changes
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
