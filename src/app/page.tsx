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
    // Wait until user and profile loading is complete
    if (!isUserLoading && !isProfileLoading && user && userProfile) {
      if (user.emailVerified) {
        const { role } = userProfile;
        if (role === 'student') {
          router.replace('/dashboard/student');
        } else if (role === 'institute') {
          router.replace('/dashboard/institute');
        }
        // Admins or other roles will stay on the landing page for now.
      }
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  // While checking user auth or profile, show a loading screen.
  // This prevents the landing page from flashing for logged-in users.
  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="absolute inset-0 -z-10">
          <StaticSparkles />
        </div>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If the user is not logged in, or their email is not verified, show the full landing page.
  if (!user || !user.emailVerified) {
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
  
  // Fallback loading state while redirecting
  return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="absolute inset-0 -z-10">
          <StaticSparkles />
        </div>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}
