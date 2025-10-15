'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import useUserProfile from '@/hooks/useUserProfile';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/landing/hero';
import { StaticSparkles } from '@/components/landing/static-sparkles';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const router = useRouter();

  useEffect(() => {
    // We only want to redirect if the user is already logged in.
    if (!isUserLoading && !isProfileLoading && user && userProfile) {
      const { role } = userProfile;
      if (role === 'student') {
        router.replace('/dashboard/student');
      } else if (role === 'institute') {
        router.replace('/dashboard/institute');
      }
      // If role is admin or something else, they'll just stay on the landing page for now.
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  // If we are checking for a user, show a loading screen to prevent flicker.
  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="absolute inset-0 -z-10">
          <StaticSparkles />
        </div>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no user, show the full landing page.
  return (
    <>
      <Header />
      <main className="flex-grow flex flex-col">
        <Hero />
      </main>
      <Footer />
    </>
  );
}
