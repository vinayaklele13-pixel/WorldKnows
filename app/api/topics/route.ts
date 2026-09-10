import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        _count: {
          select: {
            topicEntities: true,
          },
        },
      },
    });

    return NextResponse.json({ topics });
  } catch (error: any) {
    console.error('Topics directory API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
