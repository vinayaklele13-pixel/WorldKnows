import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
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

    if (!collection || collection.userId !== session.userId) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({ collection });
  } catch (error: any) {
    console.error('Collection Detail GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!collection || collection.userId !== session.userId) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    await prisma.collection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Collection DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
