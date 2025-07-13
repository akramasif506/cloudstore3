// src/app/api/auth/route.ts
import { cookies, headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { initializeAdmin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { adminAuth } = initializeAdmin();
    const authorization = headers().get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
      const idToken = authorization.split('Bearer ')[1];
      const decodedToken = await adminAuth.verifyIdToken(idToken);

      if (decodedToken) {
        //Generate session cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
          expiresIn,
        });
        const options = {
          name: 'session',
          value: sessionCookie,
          maxAge: expiresIn,
          httpOnly: true,
          secure: true,
        };

        //Add the cookie to the browser
        cookies().set(options);
      }
    }
    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    console.error("Error creating session cookie:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
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
