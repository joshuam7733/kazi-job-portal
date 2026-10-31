import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

/** Lets a signed-in user download the personal data KAZI holds about them (JSON). */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (!rateLimit(`export:${session.user.id}`, 5, 60 * 60_000).ok) return NextResponse.json({ error: "Try again later." }, { status: 429 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      role: true,
      createdAt: true,
      emailVerified: true,
      emailApplicationUpdates: true,
      emailMessages: true,
      emailJobAlerts: true,
      emailMarketing: true,
      jobSeekerProfile: { include: { skills: { include: { skill: { select: { name: true } } } }, experience: true, education: true } },
      employerProfile: { select: { jobTitle: true, phone: true, company: { select: { name: true } } } },
      resumes: { select: { label: true, isDefault: true, createdAt: true, file: { select: { originalName: true, size: true } } } },
      // Candidate view of applications: never includes private employer notes.
      applications: {
        select: {
          createdAt: true,
          status: true,
          coverLetter: true,
          answers: true,
          job: { select: { title: true, company: { select: { name: true } } } },
          history: { select: { toStatus: true, createdAt: true } },
          interviews: { select: { scheduledAt: true, mode: true, location: true, details: true } },
        },
      },
      savedJobs: { select: { folder: true, createdAt: true, job: { select: { title: true, slug: true } } } },
      jobAlerts: { select: { name: true, filters: true, frequency: true, isActive: true, createdAt: true } },
      messages: { select: { body: true, createdAt: true, conversation: { select: { subject: true } } } },
      notifications: { select: { type: true, title: true, body: true, createdAt: true, readAt: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), ...user }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="kazi-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
