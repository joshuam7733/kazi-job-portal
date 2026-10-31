import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runJobAlerts } from "@/lib/alerts";

/**
 * Scheduled job-alert delivery. Call hourly from any scheduler (cron, GitHub Actions, Vercel Cron)
 * with `Authorization: Bearer $CRON_SECRET`. Daily and weekly alerts are only sent when due.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || header.length !== expected.length || !timingSafeEqual(Buffer.from(header), Buffer.from(expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [daily, weekly] = await Promise.all([runJobAlerts("DAILY"), runJobAlerts("WEEKLY")]);
  return NextResponse.json({ ok: true, notified: { daily, weekly } });
}
