// import prisma from "@/lib/prisma";
// import bcrypt from "bcryptjs";
// import { nanoid } from "nanoid";
// import { NextRequest, NextResponse } from "next/server";

import { NextResponse } from "next/server";

// export async function GET() {
//   const users = await prisma.users.findMany();
//   return NextResponse.json({ status: 200, message: "success", data: users });
// }

// export async function POST(req: NextRequest) {
//   const { name, email, role, password } = await req.json();

//   if (!name || !email || !role) {
//     return NextResponse.json(
//       { message: "Name, email, and role are required" },
//       { status: 400 },
//     );
//   }

//   const findUser = await prisma.users.findFirst({ where: { email } });

//   if (findUser) {
//     return NextResponse.json(
//       { message: "User already exists" },
//       { status: 400 },
//     );
//   }

//   const rawPassword = password ?? nanoid(10)
//   const passwordHash = await bcrypt.hash(rawPassword, 10)

//   const user = await prisma.users.create({
//     data: {
//       name,
//       email,
//       role,
//       passwordHash,
//     },
//   });

//   return NextResponse.json({
//     status: 200,
//     message: "User created successfully",
//     data: {
//       ...user,
//       passwordHash: undefined,       // jangan return hash
//       generatedPassword: password ? undefined : rawPassword, // return plain password kalau auto-generated
//     },
//   });
// }

// export async function DELETE(req: NextRequest) {
//   const { id } = await req.json();

//   if (!id) {
//     return NextResponse.json({ message: "ID is required" }, { status: 400 });
//   }

//   const user = await prisma.users.findFirst({ where: { id } });

//   if (!user) {
//     return NextResponse.json({ message: "User not found" }, { status: 404 });
//   }

//   await prisma.users.delete({ where: { id } });

//   return NextResponse.json({
//     status: 200,
//     message: "User deleted successfully",
//     data: user,
//   });
// }

export async function GET() {
  return NextResponse.json({ status: 200, message: "for seeding the DB" });
}
