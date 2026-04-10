"use client";

import { ProjectList } from "@/components/ProjectList";

export default function ProjectsPage() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold mb-1">Projects</h2>
      <p className="text-blade-muted text-sm mb-6">
        Manage your active workstreams and initiatives.
      </p>
      <div className="bg-blade-surface rounded-xl border border-blade-border p-5">
        <ProjectList />
      </div>
    </div>
  );
}
