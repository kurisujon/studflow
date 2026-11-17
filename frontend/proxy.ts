import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { resolveSafeRedirectPath } from '@/lib/safe-redirect'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/upload(.*)',
])

const isSignInRoute = createRouteMatcher(['/sign-in(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  if (req.nextUrl.pathname === '/' || isSignInRoute(req)) {
    const { userId } = await auth()

    if (userId) {
      const destination = isSignInRoute(req)
        ? resolveSafeRedirectPath(
            req.nextUrl.searchParams.get('redirect_url'),
            req.url,
          )
        : '/dashboard'
      return NextResponse.redirect(new URL(destination, req.url))
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
