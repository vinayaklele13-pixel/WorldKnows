import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.aIConversation.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('Conversations GET error:', error);
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
    const { title, initialMessage } = body;

    const conversation = await prisma.aIConversation.create({
      data: {
        userId: session.userId,
        title: title || 'New Conversation',
        messages: initialMessage
          ? {
              create: {
                role: 'user',
                content: initialMessage,
              },
            }
          : undefined,
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error: any) {
    console.error('Conversations POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
