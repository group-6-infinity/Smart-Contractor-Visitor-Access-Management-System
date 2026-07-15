import prisma from "@/lib/prisma";
import { get } from "@vercel/blob";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getStaffSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("staff_token")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.STAFF_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { id: string; role: string; email: string };
  } catch {
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const doc = await prisma.documents.findUnique({
    where: { id },
    select: { filePath: true },
  });

  console.log("[DOC VIEW] id:", id, "filePath:", doc?.filePath)
  if (!doc) {
    return new NextResponse("Document not found in DB", { status: 404 });
  }

  const result = await get(doc.filePath, { access: "private" });
  console.log("[DOC VIEW] blob statusCode:", result?.statusCode)

  if (result?.statusCode !== 200) {
    return new NextResponse("Blob not found", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
