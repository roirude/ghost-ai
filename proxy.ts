import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL
    ? `${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}(.*)`
    : "/sign-in(.*)",
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL
    ? `${process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}(.*)`
    : "/sign-up(.*)",
]);

const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return;
  }

  if (isApiRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return;
  }

  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
