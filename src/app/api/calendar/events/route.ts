import { NextRequest, NextResponse } from "next/server";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string | null;
  description: string | null;
  attendees: string[];
  meetLink: string | null;
  status: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
  attendees?: { email?: string; displayName?: string }[];
  hangoutLink?: string;
  conferenceData?: { entryPoints?: { uri?: string; entryPointType?: string }[] };
  status?: string;
}

function extractMeetLink(event: GoogleCalendarEvent): string | null {
  if (event.hangoutLink) return event.hangoutLink;
  const entries = event.conferenceData?.entryPoints ?? [];
  const video = entries.find((e) => e.entryPointType === "video");
  return video?.uri ?? null;
}

function normalizeEvent(event: GoogleCalendarEvent): CalendarEvent {
  const start = event.start?.dateTime ?? event.start?.date ?? "";
  const end = event.end?.dateTime ?? event.end?.date ?? "";
  const attendees = (event.attendees ?? [])
    .map((a) => a.displayName ?? a.email ?? "")
    .filter(Boolean);

  return {
    id: event.id,
    title: event.summary ?? "(No title)",
    start,
    end,
    location: event.location ?? null,
    description: event.description ?? null,
    attendees,
    meetLink: extractMeetLink(event),
    status: event.status ?? "confirmed",
  };
}

async function fetchWithToken(accessToken: string): Promise<Response> {
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: sevenDaysLater.toISOString(),
    maxResults: "20",
    singleEvents: "true",
    orderBy: "startTime",
  });

  return fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const refreshHeader = request.headers.get("X-Refresh-Token");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
  }

  let accessToken = authHeader.slice(7);

  let calendarResponse = await fetchWithToken(accessToken);

  // Try token refresh if unauthorized
  if (calendarResponse.status === 401 && refreshHeader) {
    const newToken = await refreshAccessToken(refreshHeader);
    if (!newToken) {
      return NextResponse.json({ error: "Token expired and refresh failed" }, { status: 401 });
    }
    accessToken = newToken;
    calendarResponse = await fetchWithToken(accessToken);
  }

  if (!calendarResponse.ok) {
    const errorText = await calendarResponse.text();
    return NextResponse.json(
      { error: "Failed to fetch calendar events", details: errorText },
      { status: calendarResponse.status }
    );
  }

  const data = await calendarResponse.json();
  const events: CalendarEvent[] = (data.items ?? []).map(normalizeEvent);

  return NextResponse.json({ events, newAccessToken: accessToken !== authHeader.slice(7) ? accessToken : undefined });
}
