'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

/**
 * Custom hook to protect routes by checking authentication
 * - Checks for NextAuth session OR JWT token OR localStorage user data
 * - Redirects to /auth if not authenticated
 * - Returns true if authorized, false/null if not
 */
export function useAuthGuard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Skip check while auth status is loading
    if (status === 'loading') {
      return;
    }

    // Check if user is authenticated via any method
    const hasSession = !!session?.user;
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('token');
    const hasUser = typeof window !== 'undefined' && localStorage.getItem('user');
    const isAuthenticated = hasSession || hasToken || hasUser;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [session, status, router]);

  // Compute current auth status without setting state
  const hasSession = !!session?.user;
  const hasToken = typeof window !== 'undefined' && localStorage.getItem('token');
  const hasUser = typeof window !== 'undefined' && localStorage.getItem('user');
  const isAuthenticated = hasSession || hasToken || hasUser;

  // Return auth status or null if still loading
  return status === 'loading' ? null : isAuthenticated;
}
