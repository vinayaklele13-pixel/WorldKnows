import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTopicRelationshipDefinition, canonicalizeEndpoints, TOPIC_RELATIONSHIP_TYPES } from '@/lib/graph/registry';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId')?.trim();
    const type = searchParams.get('type')?.trim().toUpperCase();
    const pageStr = searchParams.get('page') || '1';
    const limitStr = searchParams.get('limit') || '20';

    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20));
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (topicId) {
      whereClause.OR = [
        { topicAId: topicId },
        { topicBId: topicId },
      ];
    }
    if (type) {
      if (TOPIC_RELATIONSHIP_TYPES[type]) {
        whereClause.type = type;
      } else {
        return NextResponse.json(
          { error: `Invalid topic relationship type "${type}"` },
          { status: 400 }
        );
      }
    }

    const [relationships, total] = await Promise.all([
      prisma.topicRelationship.findMany({
        where: whereClause,
        include: {
          topicA: { select: { id: true, slug: true, name: true } },
          topicB: { select: { id: true, slug: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.topicRelationship.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      relationships,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get Topic Relationships Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while fetching topic relationships' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid or missing request body' }, { status: 400 });
    }

    const { topicAId, topicBId, type, description } = body;

    if (!topicAId || !topicBId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: topicAId, topicBId, and type are required.' },
        { status: 400 }
      );
    }

    if (topicAId === topicBId) {
      return NextResponse.json(
        { error: 'Self-relationships are prohibited (topicAId cannot equal topicBId).' },
        { status: 400 }
      );
    }

    // Validate relationship type
    const definition = getTopicRelationshipDefinition(type);
    if (!definition) {
      return NextResponse.json(
        { error: `Unknown or unsupported topic relationship type "${type}".` },
        { status: 400 }
      );
    }

    // Verify both topics exist
    const [topicA, topicB] = await Promise.all([
      prisma.topic.findUnique({ where: { id: topicAId }, select: { id: true } }),
      prisma.topic.findUnique({ where: { id: topicBId }, select: { id: true } }),
    ]);

    if (!topicA || !topicB) {
      return NextResponse.json(
        { error: 'One or both topics specified in the relationship were not found.' },
        { status: 404 }
      );
    }

    // Canonicalize endpoints if symmetric
    const { aId, bId } = canonicalizeEndpoints(topicAId, topicBId, definition.isDirected);

    // Create or upsert relationship respecting unique constraint @@unique([topicAId, topicBId, type])
    const relationship = await prisma.topicRelationship.upsert({
      where: {
        topicAId_topicBId_type: {
          topicAId: aId,
          topicBId: bId,
          type: definition.type,
        },
      },
      update: {
        description: description || null,
      },
      create: {
        topicAId: aId,
        topicBId: bId,
        type: definition.type,
        description: description || null,
      },
      include: {
        topicA: { select: { id: true, slug: true, name: true } },
        topicB: { select: { id: true, slug: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, relationship }, { status: 201 });
  } catch (error: any) {
    console.error('Create Topic Relationship Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while creating topic relationship' },
      { status: 500 }
    );
  }
}
