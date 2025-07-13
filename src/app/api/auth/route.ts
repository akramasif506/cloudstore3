// src/app/api/auth/route.ts
import { cookies, headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { initializeAdmin } from '@/lib/firebase-admin';

// The POST handler has been removed as login is now handled by a direct server action.
// This route is now only used for checking session status and logging out.

export async function GET(request: NextRequest) {
  try {
    const { adminAuth } = initializeAdmin();
    const session = cookies().get('session')?.value || '';

    if (!session) {
      return NextResponse.json({ isLogged: false }, { status: 401 });
    }

    const decodedClaims = await adminAuth.verifySessionCookie(session, true);

    if (!decodedClaims) {
      return NextResponse.json({ isLogged: false }, { status: 401 });
    }

    return NextResponse.json({ isLogged: true }, { status: 200 });
  } catch (error) {
     return NextResponse.json({ isLogged: false }, { status: 401 });
  }
}
