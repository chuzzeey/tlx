import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const disabledDashboardRoutes = [
  '/dashboard/ai-chat',
  '/dashboard/billing',
  '/dashboard/chat',
  '/dashboard/elements',
  '/dashboard/exclusive',
  '/dashboard/forms',
  '/dashboard/kanban',
  '/dashboard/notifications',
  '/dashboard/react-query',
  '/dashboard/users',
  '/dashboard/workspaces'
];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    disabledDashboardRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
  ) {
    return NextResponse.redirect(new URL('/dashboard/overview', request.url));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      }
    }
  });

  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*']
};
