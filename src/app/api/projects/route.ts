import { NextRequest, NextResponse } from "next/server";
import { getProjects, createProject, updateProject } from "@/lib/db";

function uuid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function GET() {
  try {
    const projects = await getProjects();
    return NextResponse.json(projects);
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = uuid();
    const project = await createProject({
      id,
      name: body.name,
      description: body.description || "",
      status: body.status || "active",
      department: body.department || "ceo"
    });
    return NextResponse.json(project, { status: 201 });
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    await updateProject(body.id, {
      name: body.name,
      description: body.description,
      status: body.status
    });
    const projects = await getProjects();
    const project = projects.find(p => p.id === body.id);
    return NextResponse.json(project);
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
