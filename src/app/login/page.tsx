'use client';
import AuthApp from '@/app/AuthApp';
import { StaticSparkles } from '@/components/landing/static-sparkles';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="flex-grow flex flex-col relative">
        <div className="absolute inset-0 -z-10">
            <StaticSparkles />
        </div>
        <AuthApp initialView="login" />
      </main>
      <Footer />
    </>
  );
}
