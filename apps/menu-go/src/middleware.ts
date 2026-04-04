import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(req: NextRequest) {
  const jwt =
    req.cookies.get('next-auth.session-token') ||
    req.cookies.get('__Secure-next-auth.session-token');

  const { pathname } = req.nextUrl;

  // if (pathname.startsWith('/login') || pathname.startsWith('/sign-up')) {
  //   if (jwt) {
  //     req.nextUrl.pathname = '/';
  //     return NextResponse.redirect(req.nextUrl);
  //   }
  // }

  if (pathname.startsWith('/panel')) {
    if (!jwt) {
      req.nextUrl.pathname = '/login';
      return NextResponse.redirect(req.nextUrl);
    }

    try {
      return NextResponse.next();
    } catch {
      req.nextUrl.pathname = '/login';
      return NextResponse.redirect(req.nextUrl);
    }
  }

  return NextResponse.next();
}
