import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePublicProvenanceSource } from '@/lib/graph/provenance';
import { getEntityRelationshipDefinition, canonicalizeEndpoints, ENTITY_RELATIONSHIP_TYPES } from '@/lib/graph/registry';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId')?.trim();
    const type = searchParams.get('type')?.trim().toUpperCase();
    const pageStr = searchParams.get('page') || '1';
    const limitStr = searchParams.get('limit') || '20';

    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20));
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (entityId) {
      whereClause.OR = [
        { entityAId: entityId },
        { entityBId: entityId },
      ];
    }
    if (type) {
      if (ENTITY_RELATIONSHIP_TYPES[type]) {
        whereClause.type = type;
      } else {
        return NextResponse.json(
          { error: `Invalid relationship type "${type}"` },
          { status: 400 }
        );
      }
    }

    const [relationships, total] = await Promise.all([
      prisma.entityRelationship.findMany({
        where: whereClause,
        include: {
          entityA: { select: { id: true, name: true, type: true } },
          entityB: { select: { id: true, name: true, type: true } },
          source: { select: { id: true, title: true, url: true, domain: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.entityRelationship.count({ where: whereClause }),
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
    console.error('Get Entity Relationships Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while fetching entity relationships' },
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

    const { entityAId, entityBId, type, description, sourceId } = body;

    if (!entityAId || !entityBId || !type || !sourceId) {
      return NextResponse.json(
        { error: 'Missing required fields: entityAId, entityBId, type, and sourceId are required.' },
        { status: 400 }
      );
    }

    if (entityAId === entityBId) {
      return NextResponse.json(
        { error: 'Self-relationships are prohibited (entityAId cannot equal entityBId).' },
        { status: 400 }
      );
    }

    // Validate relationship type
    const definition = getEntityRelationshipDefinition(type);
    if (!definition) {
      return NextResponse.json(
        { error: `Unknown or unsupported relationship type "${type}".` },
        { status: 400 }
      );
    }

    // Verify both entities exist
    const [entityA, entityB] = await Promise.all([
      prisma.entity.findUnique({ where: { id: entityAId }, select: { id: true } }),
      prisma.entity.findUnique({ where: { id: entityBId }, select: { id: true } }),
    ]);

    if (!entityA || !entityB) {
      return NextResponse.json(
        { error: 'One or both entities specified in the relationship were not found.' },
        { status: 404 }
      );
    }

    // Strict provenance validation (throws if private or invalid)
    const verifiedSource = await resolvePublicProvenanceSource(sourceId);

    // Canonicalize endpoints if symmetric
    const { aId, bId } = canonicalizeEndpoints(entityAId, entityBId, definition.isDirected);

    // Create or upsert relationship respecting unique constraint @@unique([entityAId, entityBId, type])
    const relationship = await prisma.entityRelationship.upsert({
      where: {
        entityAId_entityBId_type: {
          entityAId: aId,
          entityBId: bId,
          type: definition.type,
        },
      },
      update: {
        description: description || null,
        sourceId: verifiedSource.id,
      },
      create: {
        entityAId: aId,
        entityBId: bId,
        type: definition.type,
        description: description || null,
        sourceId: verifiedSource.id,
      },
      include: {
        entityA: { select: { id: true, name: true, type: true } },
        entityB: { select: { id: true, name: true, type: true } },
        source: { select: { id: true, title: true, url: true, domain: true } },
      },
    });

    return NextResponse.json({ success: true, relationship }, { status: 201 });
  } catch (error: any) {
    console.error('Create Entity Relationship Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while creating entity relationship' },
      { status: 500 }
    );
  }
}
