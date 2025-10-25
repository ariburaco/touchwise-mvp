"use client";

import { useLanguage } from "@/lib/language-context";
import { LoadingSkeleton } from "./ui/loading-skeleton";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isReady } = useLanguage();

  if (!isReady) {
    return <LoadingSkeleton />;
  }

  return <>{children}</>;
}