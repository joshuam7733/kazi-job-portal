import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { adminCan } from "@/lib/permissions";
import { storage } from "@/lib/storage";

/**
 * Serves stored files. Public files (logos, article images) are open; private files (CVs,
 * verification documents) require the requester to be the owner, an authorised admin, or a member
 * of a company the candidate applied to with that CV.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = await db.storedFile.findUnique({ where: { id } });
  if (!file) return new NextResponse("Not found", { status: 404 });

  if (file.visibility === "PRIVATE") {
    const session = await auth();
    const user = session?.user;
    if (!user) return new NextResponse("Not found", { status: 404 });
    let allowed = file.ownerId === user.id;
    if (!allowed && user.role === "ADMIN") {
      allowed = file.purpose === "VERIFICATION_DOC" ? adminCan(user.adminRole, "companies:verify") : adminCan(user.adminRole, "users:manage");
    }
    if (!allowed && user.role === "EMPLOYER") {
      const profile = await db.employerProfile.findUnique({ where: { userId: user.id }, select: { companyId: true } });
      if (profile?.companyId) {
        if (file.purpose === "RESUME") {
          allowed = Boolean(
            await db.application.findFirst({
              where: { resume: { fileId: file.id }, job: { companyId: profile.companyId } },
              select: { id: true },
            }),
          );
        } else if (file.purpose === "VERIFICATION_DOC") {
          allowed = Boolean(await db.companyVerification.findFirst({ where: { documentFileId: file.id, companyId: profile.companyId }, select: { id: true } }));
        }
      }
    }
    // Respond 404 rather than 403 so file ids can't be probed.
    if (!allowed) return new NextResponse("Not found", { status: 404 });
  }

  const data = await storage().get(file.key);
  if (!data) return new NextResponse("Not found", { status: 404 });

  const isImage = file.mimeType.startsWith("image/");
  const safeName = file.originalName.replace(/[^\w.\- ]+/g, "_");
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(data.length),
      "Content-Disposition": `${isImage || file.mimeType === "application/pdf" ? "inline" : "attachment"}; filename="${safeName}"`,
      "Cache-Control": file.visibility === "PUBLIC" ? "public, max-age=86400, immutable" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
