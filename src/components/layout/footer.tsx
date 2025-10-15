import { BookOpenCheck } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-primary" />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built by Professionals. Powered by AI.
            </p>
        </div>
        <p className="text-center text-sm text-muted-foreground">&copy; {new Date().getFullYear()} EnrollEase. All rights reserved.</p>
      </div>
    </footer>
  );
}
