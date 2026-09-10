import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Entity ID is required' },
        { status: 400 }
      );
    }

    const entityId = id.trim();

    // Fetch entity by ID with safe public relations
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      include: {
        topicEntities: {
          include: {
            topic: {
              select: {
                id: true,
                slug: true,
                name: true,
                description: true,
              },
            },
          },
        },
        sourceRelationA: {
          include: {
            entityB: {
              select: {
                id: true,
                name: true,
                type: true,
                description: true,
              },
            },
            source: {
              select: {
                id: true,
                title: true,
                url: true,
                domain: true,
              },
            },
          },
        },
        sourceRelationB: {
          include: {
            entityA: {
              select: {
                id: true,
                name: true,
                type: true,
                description: true,
              },
            },
            source: {
              select: {
                id: true,
                title: true,
                url: true,
                domain: true,
              },
            },
          },
        },
        entitySources: {
          include: {
            source: {
              select: {
                id: true,
                title: true,
                url: true,
                domain: true,
                snippet: true,
              },
            },
          },
        },
      },
    });

    if (!entity) {
      return NextResponse.json(
        { error: `Entity with ID "${entityId}" not found` },
        { status: 404 }
      );
    }

    // Format associated topics
    const topics = entity.topicEntities.map((te: typeof entity.topicEntities[number]) => te.topic);

    // Format relationships in both directions
    const outgoingRelationships = entity.sourceRelationA.map(
  (rel: typeof entity.sourceRelationA[number]) => ({
      id: rel.id,
      type: rel.type,
      description: rel.description,
      relatedEntity: rel.entityB,
      source: rel.source,
      direction: 'outgoing' as const,
      createdAt: rel.createdAt,
    }));

     const incomingRelationships = entity.sourceRelationB.map(
  (rel: typeof entity.sourceRelationB[number]) => ({
    id: rel.id,
    type: rel.type,
    description: rel.description,
    relatedEntity: rel.entityA,
    source: rel.source,
    direction: 'incoming' as const,
    createdAt: rel.createdAt,
  }));


    const relationships = [...outgoingRelationships, ...incomingRelationships];

    // Format provenance sources and evidence
    const sources = entity.entitySources.map(
  (es: typeof entity.entitySources[number]) => ({
    id: es.source.id,
    title: es.source.title,
    url: es.source.url,
    domain: es.source.domain,
    snippet: es.source.snippet,
    evidence: es.evidence,
    createdAt: es.createdAt,
  })
);

    return NextResponse.json({
      entity: {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        description: entity.description,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
      topics,
      relationships,
      sources,
    });
  } catch (error: any) {
    console.error('Entity Detail API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while fetching entity details' },
      { status: 500 }
    );
  }
}
