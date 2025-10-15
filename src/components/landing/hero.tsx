"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { StaticSparkles } from '@/components/landing/static-sparkles';
import { ClientCursorEffect } from '@/components/ui/ClientCursorEffect';

const ParticleBackground = dynamic(() =>
  import('@/components/ui/ParticleBackground').then((mod) => mod.ParticleBackground),
  { ssr: false, loading: () => <StaticSparkles /> }
);

export function Hero() {
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setWebGLSupported(false);
    }
  }, []);

  return (
    <div className="relative w-full flex-grow flex items-center justify-center overflow-hidden">
      {webGLSupported ? (
        <ParticleBackground />
      ) : (
        <StaticSparkles />
      )}

      <div className="container px-4 md:px-6">
        <div className="grid gap-6 items-center">
          <div className="flex flex-col justify-center space-y-4 text-center">
            <div className="space-y-4">
              <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 py-2">
                Revolutionize Your Learning Experience
              </h1>
              <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
                EnrollEase combines cutting-edge AI, immersive labs, and collaborative tools to create a personalized and engaging educational journey.
              </p>
            </div>
            <div className="flex w-full max-w-sm items-center space-x-4 mx-auto">
              <Button asChild size="lg" className="group flex-1">
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="flex-1">
                <Link href="#features">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
