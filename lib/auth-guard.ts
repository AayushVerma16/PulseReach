import { auth } from "@/lib/auth";

/**
 * Require authentication for an API route.
 * Returns the userId on success, or a 401 Response on failure.
 */
export async function requireAuth(): Promise<
  { userId: string; error?: never } | { userId?: never; error: Response }
> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: Response.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      ),
    };
  }

  return { userId: session.user.id };
}
