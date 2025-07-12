// src/app/api/auth/route.ts
import admin from 'firebase-admin';
import { cookies, headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

function initializeAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }
  const adminApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  return adminApp;
}


export async function POST(request: NextRequest) {
  const adminApp = initializeAdmin();
  const adminAuth = adminApp.auth();
  const authorization = headers().get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth?.verifyIdToken(idToken);

    if (decodedToken) {
      //Generate session cookie
      const expiresIn = 60 * 60 * 24 * 5 * 1000;
      const sessionCookie = await adminAuth?.createSessionCookie(idToken, {
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
}

export async function GET(request: NextRequest) {
  const adminApp = initializeAdmin();
  const adminAuth = adminApp.auth();
  const session = cookies().get('session')?.value || '';

  if (!session) {
    return NextResponse.json({ isLogged: false }, { status: 401 });
  }

  try {
      const decodedClaims = await adminAuth?.verifySessionCookie(session, true);

      if (!decodedClaims) {
        return NextResponse.json({ isLogged: false }, { status: 401 });
      }

      return NextResponse.json({ isLogged: true }, { status: 200 });
  } catch (error) {
       return NextResponse.json({ isLogged: false }, { status: 401 });
  }
}