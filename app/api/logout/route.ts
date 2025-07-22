'use server'

import { cookies } from 'next/headers';

export async function POST() {
  const cookiesStore = await cookies();
  cookiesStore.set('session', '', {
    maxAge: 0,
    path: '/',
  });

  return new Response(JSON.stringify({ status: 'logged_out' }), { status: 200 });
}
