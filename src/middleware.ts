import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/auth.config'

// Uses the edge-safe config directly (not the full ./auth.ts, which pulls in
// the DB client and Node's `crypto` module — neither works in the Edge
// runtime middleware always runs in).
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL('/api/auth/signin', req.nextUrl.origin)
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.href)
    return NextResponse.redirect(signInUrl)
  }
})

export const config = {
  matcher: ['/repos/:path*', '/api/repos/:path*', '/api/repo-ai/:path*'],
}
