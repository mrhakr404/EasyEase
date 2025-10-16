'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth as useAppAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Camera, ShieldCheck, KeyRound, MailCheck, MailWarning, BadgeCheck, AlertTriangle } from 'lucide-react';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { sendEmailVerification, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { uploadProfilePicture } from '@/lib/firebase/storage';

function getInitials(name?: string | null) {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1 && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
}


export function ProfileSettings() {
  const { user, profile, loading: authLoading } = useAppAuth();
  const firebaseAuth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // Personal Info State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Email Verification State
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  // Image Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setUsername(profile.username || '');
    }
  }, [profile]);
  
  const handleSaveChanges = async () => {
      if (!user) {
          toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
          return;
      }
      setIsSaving(true);
      try {
          await updateUserProfile(firestore, user.uid, { firstName, lastName, username });
          toast({ title: 'Success', description: 'Your profile has been updated.' });
      } catch (error) {
          console.error("Error updating profile:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
      } finally {
          setIsSaving(false);
      }
  }
  
  const handlePasswordChange = async () => {
    if (!user || !firebaseAuth) {
        toast({ variant: 'destructive', title: 'Error', description: 'Authentication service not available.'});
        return;
    }
    if (newPassword !== confirmPassword) {
        toast({ variant: 'destructive', title: 'Error', description: 'New passwords do not match.'});
        return;
    }
    if (newPassword.length < 6) {
        toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 6 characters long.'});
        return;
    }

    setIsChangingPassword(true);
    try {
        if (user.email) {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            toast({ title: 'Success', description: 'Your password has been changed.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    } catch (error: any) {
        console.error("Error changing password:", error);
        let message = 'Failed to change password. Please check your current password.';
        if (error.code === 'auth/wrong-password') {
            message = 'Incorrect current password.';
        }
        toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
        setIsChangingPassword(false);
    }
  };
  
  const handleSendVerification = async () => {
    if (user && !user.emailVerified) {
        setIsSendingVerification(true);
        try {
            await sendEmailVerification(user);
            toast({ title: 'Email Sent', description: 'A new verification email has been sent to your address.'});
        } catch (error: any) {
            console.error("Error sending verification email:", error);
            let description = 'Failed to send verification email.';
            if (error.code === 'auth/too-many-requests') {
                description = 'Too many requests. Please wait a few minutes before trying again.';
            }
            toast({ variant: 'destructive', title: 'Error', description });
        } finally {
            setIsSendingVerification(false);
        }
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  }
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user && firestore) {
      setIsUploading(true);
      try {
        const photoURL = await uploadProfilePicture(user.uid, file);
        await updateUserProfile(firestore, user.uid, { photoURL });
        toast({
          title: "Success",
          description: "Profile picture updated successfully!",
        });
      } catch (error) {
        console.error("Error uploading file:", error);
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "Could not upload your profile picture. Please try again.",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const displayName = profile?.username || profile?.firstName || user?.displayName || user?.email;
  const initials = getInitials(profile?.firstName || user?.displayName || user?.email || undefined);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">Profile Settings</h1>
        </div>

        <Card className="overflow-hidden">
            <div className="bg-card-foreground/5 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        <Avatar className="h-24 w-24 border-4 border-background/20 cursor-pointer group" onClick={handleAvatarClick}>
                            <AvatarImage src={user?.photoURL || profile?.photoURL || ''} alt="Profile Picture" />
                            <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {isUploading ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Camera className="h-8 w-8 text-white" />}
                            </div>
                        </Avatar>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-2xl font-bold">{profile?.firstName} {profile?.lastName}</h2>
                        <p className="text-muted-foreground">@{displayName}</p>
                         <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                            {user?.emailVerified ? (
                                <Badge variant="secondary" className="bg-green-500/10 text-green-300 border-green-500/30">
                                    <BadgeCheck className="mr-1 h-4 w-4" />
                                    Verified
                                </Badge>
                            ) : (
                                <Badge variant="destructive" className="bg-yellow-500/10 text-yellow-300 border-yellow-500/30">
                                     <AlertTriangle className="mr-1 h-4 w-4" />
                                    Not Verified
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Separator />
            <CardContent className="p-6 space-y-6">
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
                 <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                        id="username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isSaving || authLoading}
                    />
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSaveChanges} disabled={isSaving || authLoading}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Changes
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-blue-400"/>
                    <CardTitle>Account Security</CardTitle>
                </div>
                <CardDescription>Manage your account settings and security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                       {user?.emailVerified ? <MailCheck className="text-green-400" /> : <MailWarning className="text-yellow-400" />}
                       <div>
                            <p className="font-medium">Email Address</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                       </div>
                    </div>
                    {!user?.emailVerified && (
                        <Button variant="secondary" onClick={handleSendVerification} disabled={isSendingVerification}>
                             {isSendingVerification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Verification
                        </Button>
                    )}
                </div>

                <Separator />

                <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <KeyRound className="w-5 h-5 text-muted-foreground"/>
                        <p className="font-medium">Change Password</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input 
                            id="currentPassword" 
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={isChangingPassword}
                        />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input 
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={isChangingPassword}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input 
                                id="confirmPassword" 
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isChangingPassword}
                            />
                        </div>
                    </div>
                     <div className="flex justify-end">
                        <Button onClick={handlePasswordChange} disabled={isChangingPassword || !currentPassword || !newPassword}>
                            {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Update Password
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
