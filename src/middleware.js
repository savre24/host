import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(request) {
    const token = request.nextauth.token;
    const { pathname } = request.nextUrl;

    // Redirect root to appropriate dashboard
    if (pathname === '/') {
      if (token?.role === 'CLIENT') {
        return NextResponse.redirect(new URL('/client/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Protect Admin routes from Clients
    if (!(pathname === '/client' || pathname.startsWith('/client/')) && !pathname.startsWith('/auth') && token?.role === 'CLIENT') {
       return NextResponse.redirect(new URL('/client/dashboard', request.url));
    }
    
    // Protect Client routes from Admins (optional, but good practice)
    if ((pathname === '/client' || pathname.startsWith('/client/')) && token?.role === 'ADMIN') {
       return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (req.nextUrl.pathname.startsWith('/auth')) {
          return true; // Allow public access to auth routes
        }
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/login',
    }
  }
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};