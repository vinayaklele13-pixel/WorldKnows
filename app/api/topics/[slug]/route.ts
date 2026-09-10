import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Topic slug is required' },
        { status: 400 }
      );
    }

    const normalizedSlug = slug.trim().toLowerCase();

    // Fetch topic by slug with safe public relations
    const topic = await prisma.topic.findUnique({
      where: { slug: normalizedSlug },
      include: {
        topicEntities: {
          include: {
            entity: {
              select: {
                id: true,
                name: true,
                type: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                entitySources: {
                  include: {
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
              },
            },
          },
        },
        topicA: {
          include: {
            topicB: {
              select: {
                id: true,
                slug: true,
                name: true,
                description: true,
              },
            },
          },
        },
        topicB: {
          include: {
            topicA: {
              select: {
                id: true,
                slug: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!topic) {
      return NextResponse.json(
        { error: `Topic with slug "${normalizedSlug}" not found` },
        { status: 404 }
      );
    }

    // Format response cleanly, flattening relations and avoiding any private workspace exposure
    const formattedEntities = topic.topicEntities.map((te) => ({
      id: te.entity.id,
      name: te.entity.name,
      type: te.entity.type,
      description: te.entity.description,
      createdAt: te.entity.createdAt,
      updatedAt: te.entity.updatedAt,
      sources: te.entity.entitySources.map((es) => es.source),
    }));

    const outgoingRelationships = topic.topicA.map((rel) => ({
      id: rel.id,
      type: rel.type,
      description: rel.description,
      relatedTopic: rel.topicB,
      direction: 'outgoing' as const,
    }));

    const incomingRelationships = topic.topicB.map((rel) => ({
      id: rel.id,
      type: rel.type,
      description: rel.description,
      relatedTopic: rel.topicA,
      direction: 'incoming' as const,
    }));

    const relationships = [...outgoingRelationships, ...incomingRelationships];

    return NextResponse.json({
      topic: {
        id: topic.id,
        slug: topic.slug,
        name: topic.name,
        description: topic.description,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      },
      entities: formattedEntities,
      relationships,
    });
  } catch (error: any) {
    console.error('Topic Detail API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while fetching topic details' },
      { status: 500 }
    );
  }
}
