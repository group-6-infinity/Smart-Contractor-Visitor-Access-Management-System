import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const users = await prisma.user.findMany();

  return NextResponse.json({ status: 200, message: "success", data: users });
}

export async function POST(req: NextRequest) {
  const { name, email } = await req.json();

  if (!name || !email) {
    return NextResponse.json(
      { message: "Name and email are required" },
      { status: 400 },
    );
  }

  const findUser = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (findUser) {
    return NextResponse.json(
      { message: "User already exists" },
      { status: 400 },
    );
  }
  const user = await prisma.user.create({
    data: {
      name,
      email,
    },
  });

  return NextResponse.json({
    status: 200,
    message: "User Created successfully",
    data: user,
  });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ message: "ID is required" }, { status: 400 });
  }
  const user = await prisma.user.findFirst({
    where: { id },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: 200,
    message: "Seed data deleted successfully",
    data: user,
  });
}
