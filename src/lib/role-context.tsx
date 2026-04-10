"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { HpcRole, TeamStatus } from "./types";
import { isAdminRole } from "./types";

interface RoleContextValue {
  role: HpcRole;
  isAdmin: boolean;
  status: TeamStatus;
  setRole: (role: HpcRole) => void;
  setStatus: (status: TeamStatus) => void;
  memberId: string | null;
  memberName: string;
}

const RoleContext = createContext<RoleContextValue>({
  role: "ceo",
  isAdmin: true,
  status: "active",
  setRole: () => {},
  setStatus: () => {},
  memberId: null,
  memberName: "",
});

export function useRole(): RoleContextValue {
  return useContext(RoleContext);
}

interface RoleProviderProps {
  children: React.ReactNode;
}

export function RoleProvider({ children }: RoleProviderProps) {
  const [role, setRoleState] = useState<HpcRole>("ceo");
  const [status, setStatus] = useState<TeamStatus>("active");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState("");

  // Load persisted role from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("hpc_role");
      if (stored) {
        setRoleState(stored as HpcRole);
      }
      const storedName = localStorage.getItem("hpc_member_name");
      if (storedName) {
        setMemberName(storedName);
      }
      const storedId = localStorage.getItem("hpc_member_id");
      if (storedId) {
        setMemberId(storedId);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const setRole = useCallback((newRole: HpcRole) => {
    setRoleState(newRole);
    try {
      localStorage.setItem("hpc_role", newRole);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const value: RoleContextValue = {
    role,
    isAdmin: isAdminRole(role),
    status,
    setRole,
    setStatus,
    memberId,
    memberName,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}
