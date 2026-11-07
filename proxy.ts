import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

export function proxy(request: NextRequest) {
  // const hostname = request.headers.get("host")?.split(":")[0].toLowerCase();
  const hostname = request.headers.get("host")?.toLowerCase();

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  if (!ROOT_DOMAIN) {
    return NextResponse.next();
  }

  // Marketplace
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    url.pathname =
      pathname === "/" ? "/marketplace" : `/marketplace${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Admin application
  if (hostname === `admin.${ROOT_DOMAIN}`) {
    url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;

    return NextResponse.rewrite(url);
  }

  // Auth application
  if (hostname === `auth.${ROOT_DOMAIN}`) {
    url.pathname = pathname === "/" ? "/auth" : `/auth${pathname}`;

    return NextResponse.rewrite(url);
  }

  // Vendor application
  if (hostname === `vendor.${ROOT_DOMAIN}`) {
    url.pathname = pathname === "/" ? "/vendor" : `/vendor${pathname}`;

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
