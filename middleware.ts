import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/auth', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check for NextAuth session (Google OAuth)
  const token = await getToken({ req: request })
  
  // Check for JWT token in cookies (for local auth)
  const jwtToken = request.cookies.get('token')?.value

  // If no authentication found, redirect to auth page
  if (!token && !jwtToken) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.webp$).*)',
  ],
}