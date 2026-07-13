// types/next-auth.d.ts
import type { DefaultSession } from "next-auth"
import type { Role } from "@/lib/generated/prisma/enums"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
  }
}
