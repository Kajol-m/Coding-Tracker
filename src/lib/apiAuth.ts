import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from './authMiddleware';

/**
 * Validates authentication for protected API routes.
 * Returns null if authenticated, otherwise returns error response.
 */
export async function validateApiAuth(req: NextRequest): Promise<NextResponse | null> {
  const authUser = await getAuthenticatedUser(req);

  if (!authUser) {
    return NextResponse.json(
      { message: 'Unauthenticated' },
      { status: 401 }
    );
  }

  return null;
}

/**
 * Wraps an API route handler with authentication validation.
 * Usage: export const GET = withAuth(async (req, authUser) => { ... })
 */
export function withAuth(
  handler: (req: NextRequest, authUser: { user_id: string; email: string; provider: string }) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authError = await validateApiAuth(req);
    if (authError) return authError;

    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { message: 'Unauthenticated' },
        { status: 401 }
      );
    }

    try {
      return await handler(req, authUser);
    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
