import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTasks, createTask, updateTask, deleteTask, getTeamMember } from "@/lib/db";

const DepartmentEnum = z.enum(["ceo", "marketing", "tech", "client-success", "media"]);
const TaskStatusEnum = z.enum(["today", "in-progress", "waiting", "completed"]);
const TaskPriorityEnum = z.enum(["low", "medium", "high"]);

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  project_id: z.string().nullable().optional(),
  department: DepartmentEnum.optional(),
  description: z.string().optional(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  client: z.string().nullable().optional(),
  assigned_to: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
});

const UpdateTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  department: DepartmentEnum.optional(),
  client: z.string().nullable().optional(),
  assigned_to: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
});

function uuid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function pingSlack(req: NextRequest, slackId: string, memberName: string, taskTitle: string, context: string) {
  try {
    const origin = new URL(req.url).origin;
    await fetch(`${origin}/api/slack/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignees: [{ id: slackId, name: memberName }],
        cardTitle: taskTitle,
        cardType: "Task",
        cardClient: context,
      }),
    });
  } catch {
    // Non-fatal: Slack ping failure should not break task creation/update
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department") || undefined;
  const status = searchParams.get("status") || undefined;
  const project_id = searchParams.get("project_id") || undefined;
  const assigned_to = searchParams.get("assigned_to") || undefined;

  const tasks = await getTasks({
    department: department as any,
    status: status as any,
    project_id,
    assigned_to,
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = CreateTaskSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues }, { status: 400 });
  }
  const data = result.data;
  const id = uuid();
  const task = await createTask({
    id,
    project_id: data.project_id || null,
    department: data.department || "ceo",
    title: data.title,
    description: data.description || "",
    status: data.status || "today",
    priority: data.priority || "medium",
    client: data.client || null,
    assigned_to: data.assigned_to || null,
    due_date: data.due_date || null,
  });

  if (data.assigned_to) {
    const member = await getTeamMember(data.assigned_to);
    if (member?.slackId) {
      await pingSlack(req, member.slackId, member.name, data.title, data.client || data.department || "ceo");
    }
  }

  return NextResponse.json(task, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const result = UpdateTaskSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues }, { status: 400 });
  }
  const data = result.data;
  await updateTask(data.id, {
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    department: data.department,
    client: data.client,
    assigned_to: data.assigned_to,
    due_date: data.due_date,
  });

  if (data.assigned_to) {
    const member = await getTeamMember(data.assigned_to);
    if (member?.slackId) {
      await pingSlack(req, member.slackId, member.name, data.title!, data.client || data.department || "ceo");
    }
  }

  const tasks = await getTasks();
  const task = tasks.find(t => t.id === data.id);
  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    await deleteTask(id);
  }
  return NextResponse.json({ ok: true });
}
