import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID || "app93tcET7pw7UUTx"; // Lead Flow ScaleOS

// Tool endpoint for Lyra to read/write Airtable
export async function POST(req: NextRequest) {
  // Auth: require x-internal-key header matching INTERNAL_API_KEY, or a next-auth session cookie
  const internalKey = process.env.INTERNAL_API_KEY;
  const providedKey = req.headers.get("x-internal-key");
  const hasSession = req.cookies.get("next-auth.session-token") || req.cookies.get("__Secure-next-auth.session-token");
  if (internalKey ? providedKey !== internalKey : !hasSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!AIRTABLE_KEY) return NextResponse.json({ error: "AIRTABLE_API_KEY not configured" }, { status: 500 });

  try {
    const body = await req.json();
    const { action, table, data, filters, limit = 10 } = body;

    const tableMap: Record<string, string> = {
      "tasks": "tblguI8Sa9CbGuIO1",        // TasksOS
      "content": "tblwH8cA11yfZcz7m",       // ContentOS
      "clients": "tblQUWj8Oug3bMTtG",       // ClientsOS
      "leads": "tblDbR7lLnbVZaA1q",         // LeadsOS
      "projects": "tblC56DkpOgQmBtc2",      // ProjectsOS
      "goals": "tblg7SxRGTEl6kkhl",         // GoalsOS
      "sales_calls": "tbliiQRS9m0DHb5eb",   // SalesCallsOS
    };

    const tableId = tableMap[table?.toLowerCase()] || table;
    if (!tableId) {
      return NextResponse.json({ error: `Unknown table: ${table}. Available: ${Object.keys(tableMap).join(", ")}` });
    }

    if (action === "read" || action === "list" || !action) {
      // Read records
      let url = `https://api.airtable.com/v0/${BASE_ID}/${tableId}?pageSize=${Math.min(limit, 20)}`;
      
      if (filters) {
        url += `&filterByFormula=${encodeURIComponent(filters)}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_KEY}` }
      });
      const result = await res.json();
      
      // Simplify the response
      const records = result.records?.map((r: any) => ({
        id: r.id,
        ...r.fields
      })) || [];

      return NextResponse.json({
        success: true,
        table,
        count: records.length,
        records
      });
    }

    if (action === "create") {
      // Create a new record
      const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fields: data })
      });
      const result = await res.json();
      
      return NextResponse.json({
        success: true,
        action: "created",
        id: result.id,
        fields: result.fields
      });
    }

    if (action === "update") {
      const { id, ...fields } = data;
      const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fields })
      });
      const result = await res.json();
      
      return NextResponse.json({
        success: true,
        action: "updated",
        id: result.id,
        fields: result.fields
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}. Use: read, create, update` });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
