import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        name: session.name || null,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Session Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
