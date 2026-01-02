'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        <SidebarTrigger />
        
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Variance Logo"
            width={120}
            height={48}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}