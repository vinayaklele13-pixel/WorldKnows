import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collections = await prisma.collection.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            bookmark: true,
            search: {
              include: {
                sources: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ collections });
  } catch (error: any) {
    console.error('Collections GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    const collection = await prisma.collection.create({
      data: {
        userId: session.userId,
        name,
        description: description || null,
      },
    });

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error: any) {
    console.error('Collections POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
