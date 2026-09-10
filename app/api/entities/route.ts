import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EntityType } from '@prisma/client';

const VALID_ENTITY_TYPES = Object.values(EntityType);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const typeParam = searchParams.get('type')?.trim().toUpperCase() || '';
    const pageStr = searchParams.get('page') || '1';
    const limitStr = searchParams.get('limit') || '20';

    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20));
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (typeParam) {
      if (VALID_ENTITY_TYPES.includes(typeParam as EntityType)) {
        whereClause.type = typeParam as EntityType;
      } else {
        return NextResponse.json(
          { error: `Invalid entity type "${typeParam}". Valid types are: ${VALID_ENTITY_TYPES.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const [entities, total] = await Promise.all([
      prisma.entity.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          type: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              topicEntities: true,
              sourceRelationA: true,
              sourceRelationB: true,
              entitySources: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.entity.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      entities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Entities API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while fetching entities' },
      { status: 500 }
    );
  }
}
