export const runtime = 'nodejs';
import { auth } from '@/lib/firebase/auth/firebase-admin';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { idToken } = await req.json();

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const authInstance = await auth;
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

    return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
  } catch (err) {
    console.log(err)
    return new Response(JSON.stringify({ error: 'Failed to create session' }), { status: 401 });
  }
}