import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  return (
    <>
      <header className="mb-2 flex justify-between items-start">
        <Link href="/">
          <Image 
            src="/logo.png" 
            alt="Variance Logo" 
            width={200} 
            height={80}
            className="h-auto cursor-pointer rounded-lg"
            priority
          />
        </Link>
        <ThemeToggle />
      </header>
      
      <p className="text-muted-foreground mb-8">NBA Analytics & Predictions</p>
    </>
  );
}