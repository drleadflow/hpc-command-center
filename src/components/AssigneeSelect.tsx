"use client";

import { useState, useEffect } from "react";
import type { TeamMember } from "@/lib/types";

// Module-level cache to avoid re-fetching across component instances
let _cache: TeamMember[] | null = null;
let _fetching = false;
let _callbacks: Array<(members: TeamMember[]) => void> = [];

function fetchMembers(cb: (members: TeamMember[]) => void) {
  if (_cache !== null) {
    cb(_cache);
    return;
  }
  _callbacks.push(cb);
  if (_fetching) return;
  _fetching = true;
  fetch("/api/team")
    .then((r) => r.json())
    .then((data: TeamMember[]) => {
      _cache = Array.isArray(data) ? data : [];
      _fetching = false;
      const pending = _callbacks.slice();
      _callbacks = [];
      pending.forEach((fn) => fn(_cache!));
    })
    .catch(() => {
      _cache = [];
      _fetching = false;
      const pending = _callbacks.slice();
      _callbacks = [];
      pending.forEach((fn) => fn([]));
    });
}

interface Props {
  value: string | null;
  onChange: (memberId: string | null) => void;
  className?: string;
}

export function AssigneeSelect({ value, onChange, className = "" }: Props) {
  const [members, setMembers] = useState<TeamMember[]>(_cache ?? []);
  const [loaded, setLoaded] = useState(_cache !== null);

  useEffect(() => {
    if (_cache !== null) {
      setMembers(_cache);
      setLoaded(true);
      return;
    }
    fetchMembers((data) => {
      setMembers(data);
      setLoaded(true);
    });
  }, []);

  const selected = members.find((m) => m.id === value);

  return (
    <div className={`relative ${className}`}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={!loaded || members.length === 0}
        className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none appearance-none pr-8 disabled:opacity-50"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <option value="">Unassigned</option>
        {members.length === 0 && !loaded && (
          <option disabled>Loading…</option>
        )}
        {loaded && members.length === 0 && (
          <option disabled>No team members</option>
        )}
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      {/* Colored avatar indicator when a member is selected */}
      {selected && (
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full pointer-events-none flex items-center justify-center"
          style={{ backgroundColor: selected.avatarColor }}
        >
          <span className="text-white text-[8px] font-bold leading-none">
            {selected.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Custom dropdown arrow */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none themed-muted text-xs">
        ▾
      </div>

      {/* Shift text right when avatar is shown */}
      {selected && (
        <style>{`
          .assignee-select-avatar-offset select {
            padding-left: 2rem;
          }
        `}</style>
      )}
    </div>
  );
}
