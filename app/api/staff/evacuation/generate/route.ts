import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  getInsideRoster,
  saveSnapshot,
  readSnapshot,
  type EvacuationPerson,
} from "@/lib/evacuation-snapshot";
import { formatTimeWIB } from "@/lib/datetime";

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

async function buildPdf(
  people: EvacuationPerson[],
  generatedAt: Date,
  isFallback: boolean,
  snapshotTime: Date | null,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - margin;

  const black = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.4, 0.4, 0.4);
  const red = rgb(0.72, 0.11, 0.11);

  // Title
  page.drawText("EMERGENCY EVACUATION LIST", {
    x: margin,
    y,
    size: 18,
    font: fontBold,
    color: black,
  });
  y -= 22;
  page.drawText("SecureGate — People Currently Inside", {
    x: margin,
    y,
    size: 10,
    font,
    color: gray,
  });
  y -= 20;
  page.drawText(`Generated: ${generatedAt.toLocaleString("id-ID")}`, {
    x: margin,
    y,
    size: 9,
    font,
    color: black,
  });
  y -= 14;

  if (isFallback && snapshotTime) {
    page.drawText(
      `FALLBACK SNAPSHOT — last updated ${snapshotTime.toLocaleString("id-ID")} (live data unavailable)`,
      { x: margin, y, size: 9, font: fontBold, color: red },
    );
    y -= 14;
  }

  y -= 6;
  page.drawText(`TOTAL INSIDE: ${people.length}`, {
    x: margin,
    y,
    size: 14,
    font: fontBold,
    color: black,
  });
  y -= 24;

  if (people.length === 0) {
    page.drawText("No one is currently inside. Building is clear.", {
      x: margin,
      y,
      size: 12,
      font,
      color: rgb(0.09, 0.4, 0.2),
    });
  } else {
    // header row
    const cols = {
      no: margin,
      name: margin + 30,
      company: margin + 180,
      zones: margin + 330,
      time: margin + 450,
    };
    page.drawRectangle({
      x: margin,
      y: y - 4,
      width: width - margin * 2,
      height: 18,
      color: black,
    });
    const white = rgb(1, 1, 1);
    page.drawText("#", {
      x: cols.no + 3,
      y,
      size: 8,
      font: fontBold,
      color: white,
    });
    page.drawText("NAME", {
      x: cols.name,
      y,
      size: 8,
      font: fontBold,
      color: white,
    });
    page.drawText("COMPANY", {
      x: cols.company,
      y,
      size: 8,
      font: fontBold,
      color: white,
    });
    page.drawText("ZONES", {
      x: cols.zones,
      y,
      size: 8,
      font: fontBold,
      color: white,
    });
    page.drawText("CHECK-IN", {
      x: cols.time,
      y,
      size: 8,
      font: fontBold,
      color: white,
    });
    y -= 22;

    people.forEach((p, i) => {
      if (y < margin + 30) {
        page = pdf.addPage([595, 842]);
        y = height - margin;
      }
      if (p.isOverstay) {
        page.drawRectangle({
          x: margin,
          y: y - 4,
          width: width - margin * 2,
          height: 18,
          color: rgb(0.99, 0.89, 0.89),
        });
      }
      const color = p.isOverstay ? red : black;
      const nameText = p.fullName + (p.isOverstay ? " (OVERSTAY)" : "");
      page.drawText(String(i + 1), { x: cols.no + 3, y, size: 8, font, color });
      page.drawText(nameText.slice(0, 28), {
        x: cols.name,
        y,
        size: 8,
        font,
        color,
      });
      page.drawText(p.company.slice(0, 26), {
        x: cols.company,
        y,
        size: 8,
        font,
        color,
      });
      page.drawText((p.zones.join(", ") || "—").slice(0, 22), {
        x: cols.zones,
        y,
        size: 8,
        font,
        color,
      });
      page.drawText(formatTimeWIB(p.checkInAt), {
        x: cols.time,
        y,
        size: 8,
        font,
        color,
      });
      y -= 18;
    });
  }

  return pdf.save();
}

export async function GET() {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "SECURITY_OPERATOR"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const generatedAt = new Date();
  let people: EvacuationPerson[] = [];
  let isFallback = false;
  let snapshotTime: Date | null = null;

  try {
    const allZones = await prisma.zone.findMany({
      select: { id: true, name: true },
    });
    const zoneNames = Object.fromEntries(allZones.map((z) => [z.id, z.name]));
    people = await getInsideRoster(zoneNames);
    saveSnapshot(people).catch(() => {});
  } catch (err) {
    console.error("[EVACUATION] live failed, using snapshot", err);
    const snap = await readSnapshot().catch(() => ({
      people: [],
      updatedAt: null,
    }));
    people = snap.people;
    snapshotTime = snap.updatedAt;
    isFallback = true;
  }

  const pdfBytes = await buildPdf(
    people,
    generatedAt,
    isFallback,
    snapshotTime,
  );

  return new NextResponse(pdfBytes as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="evacuation-list-${Date.now()}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
