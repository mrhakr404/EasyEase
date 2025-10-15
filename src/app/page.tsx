'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import useUserProfile from '@/hooks/useUserProfile';
import { StaticSparkles } from '@/components/landing/static-sparkles';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const router = useRouter();

  useEffect(() => {
    // Wait until user and profile loading is complete
    if (isUserLoading || isProfileLoading) {
      return;
    }

    if (!user) {
      router.replace('/login');
    } else if (userProfile) {
      const { role } = userProfile;
      if (role === 'student') {
        router.replace('/dashboard/student');
      } else if (role === 'institute') {
        router.replace('/dashboard/institute');
      } else {
        // Fallback for admin or undefined roles
        router.replace('/login');
      }
    }
    // If user exists but profile is still loading, the spinner will be shown.
    // If profile fails to load, it will remain on this page with spinner.
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  // Render a loading spinner while determining the redirect path
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
       <div className="absolute inset-0 -z-10">
            <StaticSparkles />
       </div>
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}
