"use client";

import { useRole } from "@/lib/role-context";
import { BridgeDashboard } from "@/components/BridgeDashboard";
import { MyDayDashboard } from "@/components/MyDayDashboard";

export default function Home() {
  const { isAdmin } = useRole();

  if (isAdmin) {
    return <BridgeDashboard />;
  }

  return <MyDayDashboard />;
}
