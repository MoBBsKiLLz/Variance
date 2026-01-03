"use client";

import Image from "next/image";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";

export function TopNav() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
        </div>

        <div className="flex-1 flex justify-center">
          <Link href="/" className="flex items-center">
            <Image
              src={isDark ? "/logoDark.png" : "/logoLight.png"}
              alt="Variance Logo"
              width={120}
              height={48}
              className="h-auto w-auto"
              priority
            />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
