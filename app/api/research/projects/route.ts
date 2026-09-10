import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const projects = await prisma.researchProject.findMany({
      where: { userId: session.userId },
      include: {
        notes: {
          select: { id: true, title: true, createdAt: true },
        },
        _count: {
          select: {
            topics: true,
            entities: true,
            notes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error('List Research Projects Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while fetching research projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid or missing request body' }, { status: 400 });
    }

    const { title, description } = body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Project title is required.' }, { status: 400 });
    }

    // Strict user ID association derived from verified session (preventing IDOR)
    const project = await prisma.researchProject.create({
      data: {
        userId: session.userId,
        title: title.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error: any) {
    console.error('Create Research Project Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while creating research project' },
      { status: 500 }
    );
  }
}
