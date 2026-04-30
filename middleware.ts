import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const TEXT_ENCODER = new TextEncoder();
const JWT_KEY = TEXT_ENCODER.encode(process.env.JWT_SECRET || "");

// Pages anyone can see without signing in
const PUBLIC_PATHS = [
  "/",          // landing
  "/about",
  "/signin",
  "/signup",
];

// API routes that don't need auth
const PUBLIC_API = [
  "/api/signin",
  "/api/signup",
  "/api/signout",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_API.includes(pathname)) return true;
  // Static assets
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/screenshots")) return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Auth required from here on
  const token = req.cookies.get("session")?.value;

  // No token at all -> bounce
  if (!token) {
    return redirectOrUnauthorized(req, pathname);
  }

  // Verify the JWT (the actual account-existence check happens in route handlers
  // via getCurrentAccount; middleware just enforces "has a valid, unexpired
  // session token").
  try {
    await jwtVerify(token, JWT_KEY);
    return NextResponse.next();
  } catch {
    return redirectOrUnauthorized(req, pathname);
  }
}

function redirectOrUnauthorized(req: NextRequest, pathname: string) {
  // For API requests return 401 JSON; for pages redirect to /signin
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/signin";
  // Preserve the intended destination so the user lands on the right page
  // after sign-in
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on every request EXCEPT static files
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|screenshots).*)",
  ],
};
