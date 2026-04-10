import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") || "20"),
    100
  );
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

  try {
    // Fetch projects with pagination
    const { data: projects, error: projError } = await supabase
      .from("thumbnail_projects")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (projError) {
      return NextResponse.json(
        { error: "Failed to fetch projects", detail: projError.message },
        { status: 500 }
      );
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({ projects: [], total: 0 });
    }

    // Fetch thumbnails for all returned projects
    const projectIds = projects.map((p) => p.id);
    const { data: thumbnails, error: thumbError } = await supabase
      .from("thumbnails")
      .select("id, project_id, concept_label, image_base64, version, is_winner, is_clean, metadata, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: true });

    if (thumbError) {
      return NextResponse.json(
        { error: "Failed to fetch thumbnails", detail: thumbError.message },
        { status: 500 }
      );
    }

    // Group thumbnails by project
    const thumbsByProject: Record<string, typeof thumbnails> = {};
    for (const thumb of thumbnails || []) {
      if (!thumbsByProject[thumb.project_id]) {
        thumbsByProject[thumb.project_id] = [];
      }
      thumbsByProject[thumb.project_id].push(thumb);
    }

    // Get total project count for pagination
    const { count } = await supabase
      .from("thumbnail_projects")
      .select("id", { count: "exact", head: true });

    const result = projects.map((project) => {
      const projectThumbs = thumbsByProject[project.id] || [];
      const winner = projectThumbs.find((t) => t.is_winner);

      return {
        ...project,
        thumbnailCount: projectThumbs.length,
        thumbnails: projectThumbs.map((t) => ({
          id: t.id,
          conceptLabel: t.concept_label,
          version: t.version,
          isWinner: t.is_winner,
          isClean: t.is_clean,
          metadata: t.metadata,
          image: t.image_base64
            ? `data:image/png;base64,${t.image_base64}`
            : null,
          createdAt: t.created_at,
        })),
        winnerThumbnail: winner
          ? {
              id: winner.id,
              conceptLabel: winner.concept_label,
              image: winner.image_base64
                ? `data:image/png;base64,${winner.image_base64}`
                : null,
            }
          : null,
      };
    });

    return NextResponse.json({
      projects: result,
      total: count ?? projects.length,
      limit,
      offset,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: {
    thumbnailId?: string;
    projectId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { thumbnailId, projectId } = body;

  if (!thumbnailId || !projectId) {
    return NextResponse.json(
      { error: "thumbnailId and projectId are required" },
      { status: 400 }
    );
  }

  try {
    // Clear previous winner in this project
    const { error: clearError } = await supabase
      .from("thumbnails")
      .update({ is_winner: false })
      .eq("project_id", projectId);

    if (clearError) {
      return NextResponse.json(
        { error: "Failed to clear previous winner", detail: clearError.message },
        { status: 500 }
      );
    }

    // Set the new winner
    const { error: setError } = await supabase
      .from("thumbnails")
      .update({ is_winner: true })
      .eq("id", thumbnailId)
      .eq("project_id", projectId);

    if (setError) {
      return NextResponse.json(
        { error: "Failed to set winner", detail: setError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, winnerId: thumbnailId });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId query parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Delete iterations first (FK constraint)
    await supabase
      .from("thumbnail_iterations")
      .delete()
      .eq("project_id", projectId);

    // Delete thumbnails
    await supabase
      .from("thumbnails")
      .delete()
      .eq("project_id", projectId);

    // Delete grids
    await supabase
      .from("thumbnail_grids")
      .delete()
      .eq("project_id", projectId);

    // Delete the project
    const { error: delError } = await supabase
      .from("thumbnail_projects")
      .delete()
      .eq("id", projectId);

    if (delError) {
      return NextResponse.json(
        { error: "Failed to delete project", detail: delError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deletedProjectId: projectId });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
