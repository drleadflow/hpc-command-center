import { NextRequest, NextResponse } from "next/server";
import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember, getTasks } from "@/lib/db";

function uuid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const withStats = searchParams.get("stats") === "1";

    const members = await getTeamMembers();

    if (!withStats) {
      return NextResponse.json(members);
    }

    // Compute per-member accountability stats from tasks
    const tasks = await getTasks();
    const todayStr = new Date().toISOString().split("T")[0];

    const membersWithStats = members.map((member) => {
      const memberTasks = tasks.filter((t) => t.assigned_to === member.id);
      const completed = memberTasks.filter((t) => t.status === "completed").length;
      const overdue = memberTasks.filter(
        (t) => t.due_date && t.due_date < todayStr && t.status !== "completed"
      ).length;
      const assigned = memberTasks.length;

      const withDueDate = memberTasks.filter((t) => t.due_date && t.status === "completed");
      const onTime = withDueDate.filter((t) => t.updated_at.split("T")[0] <= t.due_date!).length;
      const onTrackPct = withDueDate.length > 0 ? Math.round((onTime / withDueDate.length) * 100) : 100;

      let status: "on-track" | "at-capacity" | "behind" = "on-track";
      if (overdue >= 2 || onTrackPct < 50) status = "behind";
      else if (overdue === 1 || assigned >= 6) status = "at-capacity";

      return {
        ...member,
        accountability: { assigned, completed, overdue, onTrackPct, status },
      };
    });

    return NextResponse.json(membersWithStats);
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = uuid();
    const member = await createTeamMember({
      id,
      name: body.name,
      email: body.email || "",
      role: body.role || "",
      department: body.department || "ceo",
      avatarColor: body.avatarColor || "#3b82f6",
      slackId: body.slackId || null,
    });
    return NextResponse.json(member, { status: 201 });
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    await updateTeamMember(body.id, {
      name: body.name,
      email: body.email,
      role: body.role,
      department: body.department,
      avatarColor: body.avatarColor,
      slackId: body.slackId,
    });
    const members = await getTeamMembers();
    const member = members.find(m => m.id === body.id);
    return NextResponse.json(member);
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      await deleteTeamMember(id);
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
