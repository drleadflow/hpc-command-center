import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Required env vars: MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
const DB_CONFIG = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

// We'll use a simple HTTP proxy approach via the Railway API
// since mysql2 isn't available in edge. For Node.js runtime this works.

async function queryDB(sql: string, params: any[] = []) {
  // Use mysql2 via dynamic import
  try {
    const mysql = await import("mysql2/promise");
    const conn = await mysql.createConnection(DB_CONFIG);
    const [rows] = await conn.execute(sql, params);
    await conn.end();
    return rows;
  } catch (e) {
    console.error("DB error:", e);
    return [];
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "overview";

  try {
    if (type === "leads") {
      const source = new URL(req.url).searchParams.get("source");
      const leads = await queryDB(
        source
          ? `SELECT id, firstName, email, phone, leadSource, leadStatus,
               practiceType, leadWebsite, leadCreatedAt
             FROM leads WHERE leadSource = ?
             ORDER BY leadCreatedAt DESC LIMIT 100`
          : `SELECT id, firstName, email, phone, leadSource, leadStatus,
               practiceType, leadWebsite, leadCreatedAt
             FROM leads
             ORDER BY leadCreatedAt DESC LIMIT 100`,
        source ? [source] : []
      );
      return NextResponse.json({ leads });
    }

    if (type === "webinar") {
      const webinarLeads = await queryDB(`
        SELECT id, firstName, email, phone, practiceType, leadCreatedAt
        FROM leads
        WHERE leadSource = 'webinar'
        ORDER BY leadCreatedAt DESC
        LIMIT 200
      `);
      const total = await queryDB(`SELECT COUNT(*) as total FROM leads WHERE leadSource = 'webinar'`);
      return NextResponse.json({
        leads: webinarLeads,
        total: (total as any[])[0]?.total || 0,
      });
    }

    if (type === "analytics") {
      const analytics = await queryDB(`
        SELECT pageSlug, eventType, COUNT(*) as count
        FROM funnelEvents
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY pageSlug, eventType
        ORDER BY pageSlug, count DESC
      `);

      const topPages = await queryDB(`
        SELECT pageSlug, 
               COUNT(DISTINCT sessionId) as sessions,
               SUM(CASE WHEN eventType = 'page_view' THEN 1 ELSE 0 END) as views,
               SUM(CASE WHEN eventType = 'checkout_start' THEN 1 ELSE 0 END) as checkouts
        FROM funnelEvents
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY pageSlug
        ORDER BY views DESC
      `);

      const recentActivity = await queryDB(`
        SELECT eventType, pageSlug, createdAt
        FROM funnelEvents
        ORDER BY createdAt DESC
        LIMIT 20
      `);

      return NextResponse.json({ analytics, topPages, recentActivity });
    }

    // Default overview
    const [leadsCount, recentLeads, topPageResult] = await Promise.all([
      queryDB("SELECT COUNT(*) as total FROM leads"),
      queryDB(`
        SELECT firstName, email, practiceType, leadSource, leadCreatedAt
        FROM leads ORDER BY leadCreatedAt DESC LIMIT 5
      `),
      queryDB(`
        SELECT pageSlug, COUNT(*) as views
        FROM funnelEvents
        WHERE eventType = 'page_view' AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY pageSlug ORDER BY views DESC LIMIT 5
      `),
    ]);

    return NextResponse.json({
      totalLeads: (leadsCount as any[])[0]?.total || 0,
      recentLeads,
      topPages: topPageResult,
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
