import { NextRequest, NextResponse } from "next/server";
import { getTasks, createNotification, getNotifications } from "@/lib/db";

const AD_SPEND_THRESHOLD = 500; // USD daily spend alert threshold

// Track which alerts we've already fired this session (in-memory dedup)
const firedAlerts = new Set<string>();

export async function GET(req: NextRequest) {
  const created: string[] = [];

  // --- Check overdue tasks ---
  try {
    const tasks = await getTasks();
    const now = new Date();

    for (const task of tasks) {
      if (task.status === "completed") continue;
      if (!task.due_date) continue;

      const due = new Date(task.due_date);
      if (due < now) {
        const alertKey = `overdue-${task.id}`;
        if (!firedAlerts.has(alertKey)) {
          // Check if we already have an unread notification for this task
          const existingNotifications = await getNotifications(50);
          const existing = existingNotifications.find(
            n => n.type === "task_overdue" && n.title.includes(task.title) && !n.read
          );
          if (!existing) {
            await createNotification({
              type: "task_overdue",
              title: `Overdue: ${task.title}`,
              message: `Task was due ${due.toLocaleDateString()} and is still ${task.status}.`,
              link: "/tasks",
            });
            firedAlerts.add(alertKey);
            created.push(`task_overdue:${task.id}`);
          }
        }
      }
    }
  } catch {
    // Non-fatal if tasks can't be fetched
  }

  // --- Check ad spend ---
  try {
    const origin = new URL(req.url).origin;
    const adsRes = await fetch(`${origin}/api/ads`, { cache: "no-store" });
    if (adsRes.ok) {
      const adsData = await adsRes.json();
      const clients: any[] = Array.isArray(adsData) ? adsData : (adsData.clients || []);

      for (const client of clients) {
        const spend = parseFloat(client.spend || client.todaySpend || "0");
        if (spend > AD_SPEND_THRESHOLD) {
          const alertKey = `spend-${client.name || client.id}-${new Date().toISOString().split("T")[0]}`;
          if (!firedAlerts.has(alertKey)) {
            const spendNotifications = await getNotifications(50);
            const existing = spendNotifications.find(
              n => n.type === "spend_alert" && n.message.includes(client.name || "") && !n.read
            );
            if (!existing) {
              await createNotification({
                type: "spend_alert",
                title: `High Spend Alert: ${client.name || "Client"}`,
                message: `Daily ad spend of $${spend.toFixed(2)} exceeds $${AD_SPEND_THRESHOLD} threshold.`,
                link: "/ads",
              });
              firedAlerts.add(alertKey);
              created.push(`spend_alert:${client.name}`);
            }
          }
        }
      }
    }
  } catch {
    // Non-fatal if ads API is unavailable
  }

  return NextResponse.json({ checked: true, created });
}
