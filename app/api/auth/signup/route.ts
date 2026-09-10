import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { authRateLimiter, getClientIp } from '@/lib/ratelimit';

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to sign up.' },
    { status: 405 }
  );
}

export async function POST(request: Request) {
  // Rate limiting check
  const clientIp = getClientIp(request);
  const rateLimitResult = authRateLimiter.check(clientIp);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many sign-up attempts. Please try again later.' },
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

    const { email, password, name } = body;

    // 1. Input Validation
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Duplicate Account Handling
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    }).catch((prismaError: any) => {
      console.error('Prisma connection error during signup lookup:', prismaError);
      throw new Error('Database lookup failed. Ensure PostgreSQL is running.');
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    // 3. Password Hashing and Creation
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name?.trim() || null,
      },
    }).catch((prismaError: any) => {
      console.error('Prisma insertion error during signup:', prismaError);
      throw new Error('Database write failed. Ensure PostgreSQL is running.');
    });

    // 4. Session cookie generation
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
    console.error('Signup Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
