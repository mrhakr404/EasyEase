'use client';

import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/landing/hero';

export default function Home() {
  const { user, loading } = useAuth();
  
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
  
  // AuthProvider is handling redirects, so we just show a loader.
  return null;
}
