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
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { title, content } = body;
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required for notes.' }, { status: 400 });
    }

    const project = await prisma.researchProject.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!project || project.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden or project not found.' }, { status: 403 });
    }

    const note = await prisma.researchNote.create({
      data: {
        projectId: id,
        title: title.trim(),
        content: content.trim(),
      },
    });

    return NextResponse.json({ success: true, note }, { status: 201 });
  } catch (error: any) {
    console.error('Create Research Note Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
