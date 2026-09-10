import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        collectionItems: {
          include: {
            collection: true,
          },
        },
      },
    });

    return NextResponse.json({ bookmarks });
  } catch (error: any) {
    console.error('Bookmarks GET error:', error);
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
    const { title, url, notes } = body;

    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: session.userId,
        title,
        url,
        notes: notes || null,
      },
    });

    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error: any) {
    console.error('Bookmarks POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
