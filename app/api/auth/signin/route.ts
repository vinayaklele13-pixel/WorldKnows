import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, setSessionCookie } from '@/lib/auth';
import { authRateLimiter, getClientIp } from '@/lib/ratelimit';

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to sign in.' },
    { status: 405 }
  );
}

export async function POST(request: Request) {
  // Rate limiting check
  const clientIp = getClientIp(request);
  const rateLimitResult = authRateLimiter.check(clientIp);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many sign-in attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.reset),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        },
      }
    );
  }

  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: 'Invalid or missing request body.' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generic error to prevent user enumeration
    const genericError = { error: 'Invalid email or password.' };

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    }).catch((prismaError: any) => {
      console.error('Prisma connection error during signin:', prismaError);
      throw new Error('Database lookup failed. Ensure PostgreSQL is running.');
    });

    if (!user) {
      return NextResponse.json(genericError, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(genericError, { status: 401 });
    }

    // Set session cookie
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error('Signin Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
