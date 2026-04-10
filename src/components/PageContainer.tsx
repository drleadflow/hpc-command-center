"use client";

import { usePathname } from "next/navigation";

export function PageContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWide = pathname === "/os";

  return (
    <div className={isWide ? "max-w-[1600px] mx-auto w-full" : "max-w-6xl mx-auto"}>
      {children}
    </div>
  );
}
