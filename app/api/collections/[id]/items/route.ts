import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { bookmarkId, searchId } = body;

    if (!bookmarkId && !searchId) {
      return NextResponse.json({ error: 'bookmarkId or searchId is required' }, { status: 400 });
    }

    const collection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!collection || collection.userId !== session.userId) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const item = await prisma.collectionItem.create({
      data: {
        collectionId: id,
        bookmarkId: bookmarkId || null,
        searchId: searchId || null,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    console.error('Collection Item POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
