import { adminAuth } from '@/lib/firebase/auth/firebase-admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idToken } = body;
    
    if (!idToken) {
      console.error('❌ No idToken provided');
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (verifyError: any) {
      console.error('❌ Token verification failed:', {
        message: verifyError.message,
        code: verifyError.code,
      });
      return NextResponse.json(
        {
          error: 'Token verification failed',
          details: verifyError.message,
          code: verifyError.code
        },
        { status: 401 }
      );
    }
    let sessionCookie;
    try {
      // expiresIn en millisecondes (5 jours)
      sessionCookie = await adminAuth.createSessionCookie(idToken, { 
        expiresIn: 1000 * 60 * 60 * 24 * 5
      });
    } catch (sessionError: any) {
      console.error('❌ Session cookie creation failed:', {
        message: sessionError.message,
        code: sessionError.code,
        stack: sessionError.stack
      });
      return NextResponse.json(
        {
          error: 'Session creation failed',
          details: sessionError.message,
          code: sessionError.code
        },
        { status: 500 }
      );
    }
   
    // Définir le cookie
    const cookiesStore = await cookies();
    cookiesStore.set('session', sessionCookie, {
      maxAge: 60 * 60 * 24 * 5, // 5 jours en secondes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax'
    });
    
    return NextResponse.json(
      {
        status: 'signed_up',
        message: 'Session created successfully',
        uid: decodedToken.uid
      },
      { status: 200 }
    );
   
  } catch (err: any) {
    console.error('❌ Unexpected error in signup:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
   
    return NextResponse.json(
      {
        error: 'Signup session failed',
        details: err.message || 'Unknown error',
        code: err.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}