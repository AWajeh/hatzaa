import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_SEGMENTS = [
  "dashboard",
  "customers",
  "services",
  "quotes",
  "settings",
  "verify",
];

function isProtectedPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean); // ["he", "dashboard", ...]
  const segment = parts[1];
  return segment ? PROTECTED_SEGMENTS.includes(segment) : false;
}

export default async function middleware(req: NextRequest) {
  const response = intlMiddleware(req);

  if (isProtectedPath(req.nextUrl.pathname)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const locale = req.nextUrl.pathname.split("/")[1] || routing.defaultLocale;
      const loginUrl = new URL(`/${locale}/login`, req.url);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  ],
};
