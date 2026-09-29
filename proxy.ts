import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
let response = NextResponse.next({
request,
});

const supabase = createServerClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
{
cookies: {
getAll() {
return request.cookies.getAll();
},
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        request.cookies.set(name, value);
        response.cookies.set(name, value, options);
      });
    },
  },
}
);

const {
data: { user },
} = await supabase.auth.getUser();

const pathname = request.nextUrl.pathname;

const isDashboardRoute = pathname.startsWith("/dashboard");
const isLoginRoute = pathname === "/login";

if (isDashboardRoute && !user) {
return NextResponse.redirect(new URL("/login", request.url));
}

if (isLoginRoute && user) {
return NextResponse.redirect(new URL("/dashboard", request.url));
}

return response;
}

export const config = {
matcher: ["/dashboard/:path*", "/login"],
};
