'use client';

import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/landing/hero';
import { StaticSparkles } from '@/components/landing/static-sparkles';

export default function Home() {
  const { user, loading, profile } = useAuth();

  // While checking user auth or profile, show a loading screen.
  // This prevents the landing page from flashing for logged-in users.
  if (loading || (user && !profile?.profileLoaded)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="absolute inset-0 -z-10">
          <StaticSparkles />
        </div>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If the user is not logged in, show the full landing page.
  if (!user) {
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
  
  // AuthProvider is handling redirects, but this is a fallback state while redirecting.
  return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="absolute inset-0 -z-10">
          <StaticSparkles />
        </div>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}
