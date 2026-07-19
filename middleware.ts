import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const isStaffRoute =
    req.nextUrl.pathname.startsWith("/staff") &&
    req.nextUrl.pathname !== "/internal/staff/login";

  if (isStaffRoute) {
    const token = req.cookies.get("staff_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/internal/staff/login", req.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.STAFF_JWT_SECRET);
      await jwtVerify(token, secret);
    } catch {
      const res = NextResponse.redirect(
        new URL("/internal/staff/login", req.url)
      );
      res.cookies.delete("staff_token");
      return res;
    }
  }
  
  const res = NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/staff")) {
    res.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
  }
  return res;
}

export const config = {
  matcher: ["/staff/:path*"],
}
