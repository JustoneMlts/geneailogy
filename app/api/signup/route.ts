'use server'

import { auth } from '@/lib/firebase/auth/firebase-admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { idToken } = await req.json();

  if (!idToken) {
    return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000; 

  try {
    const authInstance = await auth;
    await authInstance.verifyIdToken(idToken);

    const sessionCookie = await authInstance.createSessionCookie(idToken, { expiresIn });
    console.log('session cookie', sessionCookie)
    const cookiesStore = await cookies();
    cookiesStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax'
    });

    return new Response(JSON.stringify({ status: 'signed_up' }), { status: 200 });
  } catch (err) {
    console.log(err)
    return new Response(JSON.stringify({ error: 'Signup session failed' }), { status: 401 });
  }
}
