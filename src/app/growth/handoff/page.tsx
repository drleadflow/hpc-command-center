"use client";
import { GrowthStagePage } from "@/components/GrowthStagePage";
import { GROWTH_STAGES } from "@/lib/growth-engine-data";

const stage = GROWTH_STAGES.find((s) => s.id === "handoff")!;
export default function HandoffPage() { return <GrowthStagePage stage={stage} />; }
