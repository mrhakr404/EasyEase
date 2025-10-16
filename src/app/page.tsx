'use client';

import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/landing/hero';

export default function Home() {
  const { user, loading } = useAuth();
  
  // If loading, and we have a user object, AuthProvider is likely handling a redirect.
  // We can show a loader or null.
  if (loading && user) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-background text-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
  }
  
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
  
  // If user is logged in, AuthProvider is redirecting.
  // Showing a loader here is a good user experience.
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-lg">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}
