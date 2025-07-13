// src/app/api/auth/route.ts
import { cookies, headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { initializeAdmin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { adminAuth } = initializeAdmin();
    const body = await request.json();
    const idToken = body.idToken;
    
    if (!idToken) {
        return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const options = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    cookies().set(options);

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Session Login Error:', error);
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 401 });
  }
}

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
