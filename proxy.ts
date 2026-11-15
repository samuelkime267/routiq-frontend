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

  // The standalone auth host is retired: every app now serves its own
  // `/auth/*` routes, so old links land on the marketplace equivalent.
  if (hostname === `auth.${ROOT_DOMAIN}`) {
    const target = new URL(request.nextUrl.toString());
    target.protocol = request.nextUrl.protocol;
    target.host = ROOT_DOMAIN;
    target.pathname = pathname === "/" ? "/auth" : `/auth${pathname}`;

    return NextResponse.redirect(target.toString(), 308);
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
