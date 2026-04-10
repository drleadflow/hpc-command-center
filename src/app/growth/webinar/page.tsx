"use client";
import { GrowthStagePage } from "@/components/GrowthStagePage";
import { GROWTH_STAGES } from "@/lib/growth-engine-data";

const stage = GROWTH_STAGES.find((s) => s.id === "webinar")!;
export default function WebinarStagePage() { return <GrowthStagePage stage={stage} />; }
