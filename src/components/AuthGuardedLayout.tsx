"use client";

import { usePathname } from "next/navigation";
import { RoleProvider, useRole } from "@/lib/role-context";
import { AdminSidebar } from "@/components/AdminSidebar";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { CommandPalette } from "@/components/CommandPalette";
import { QuickCapture } from "@/components/QuickCapture";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PageContainer } from "@/components/PageContainer";
import { RoleSwitcher } from "@/components/RoleSwitcher";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin } = useRole();

  const isAuthPage = pathname.startsWith("/auth");
  const isPortalPage = pathname.startsWith("/portal");

  if (isAuthPage || isPortalPage) {
    return <>{children}</>;
  }

  return (
    <>
      {isAdmin ? <AdminSidebar /> : <EmployeeSidebar />}
      <main className="ml-0 md:ml-72 min-h-screen overflow-auto p-4 pt-16 md:pt-10 md:p-10 lg:p-12">
        <PageContainer>
          {children}
        </PageContainer>
      </main>
      <NotificationBell />
      <CommandPalette />
      <QuickCapture />
      <PWAInstallPrompt />
      <RoleSwitcher />
    </>
  );
}

export function AuthGuardedLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <LayoutInner>{children}</LayoutInner>
    </RoleProvider>
  );
}
