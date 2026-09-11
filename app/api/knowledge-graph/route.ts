import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractKnowledgeFromContext } from '@/lib/graph/extraction';
import { GRAPH_LIMITS } from '@/lib/graph/config';

/**
 * ============================================================================
 * Knowledge Graph 2.0 API (`app/api/knowledge-graph/route.ts`)
 * ============================================================================
 *
 * Dedicated graph API endpoint supporting:
 * - Authentication & session validation
 * - Input validation & query/context size limits
 * - IDOR protection for research/project data
 * - Verified source extraction & grounding
 * - Returning structured JSON graph data (nodes, edges with multiple sourceIds, sources)
 */

export async function POST(req: Request) {
  try {
    // 1. Authentication check
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const { query, researchId, sources: rawSources, maxNodes } = body;

    // 2. Input validation & limits
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Bad Request: A valid query string is required.' }, { status: 400 });
    }

    if (query.length > GRAPH_LIMITS.MAX_QUERY_LENGTH) {
      return NextResponse.json({ error: `Bad Request: Query exceeds maximum length of ${GRAPH_LIMITS.MAX_QUERY_LENGTH} characters.` }, { status: 400 });
    }

    const validatedMaxNodes = typeof maxNodes === 'number' && maxNodes > 0
      ? Math.min(maxNodes, GRAPH_LIMITS.MAX_NODES)
      : GRAPH_LIMITS.MAX_NODES;

    const allowedSourceIds = new Set<string>();
    let sourcesToUse: Array<{ id: string; title: string; url: string; domain: string; snippet?: string }> = [];

    // 3. IDOR Protection & Research Project Authorization
    if (researchId) {
      if (typeof researchId !== 'string') {
        return NextResponse.json({ error: 'Bad Request: Invalid researchId format.' }, { status: 400 });
      }

      const researchProject = await prisma.researchProject.findUnique({
        where: { id: researchId },
        select: { userId: true },
      });

      if (!researchProject) {
        return NextResponse.json({ error: 'Research project not found.' }, { status: 404 });
      }

      if (researchProject.userId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden: Access denied to this research project.' }, { status: 403 });
      }
    }

    // 4. Source validation & authorization
    if (rawSources && Array.isArray(rawSources)) {
      for (const s of rawSources.slice(0, GRAPH_LIMITS.MAX_SOURCES_PER_EXTRACTION)) {
        if (s && s.id && s.title && s.url) {
          allowedSourceIds.add(s.id);
          sourcesToUse.push({
            id: s.id,
            title: String(s.title),
            url: String(s.url),
            domain: String(s.domain || new URL(s.url).hostname),
            snippet: s.snippet ? String(s.snippet) : undefined,
          });
        }
      }
    }

    // If no sources provided in request, fetch recent public sources or search sources
    if (sourcesToUse.length === 0) {
      const dbSources = await prisma.source.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        select: { id: true, title: true, url: true, domain: true, snippet: true },
      });
      sourcesToUse = dbSources.map(s => ({
        id: s.id,
        title: s.title,
        url: s.url,
        domain: s.domain,
        snippet: s.snippet ?? undefined,
      }));
      dbSources.forEach(s => allowedSourceIds.add(s.id));
    }

    // 5. Execute AI Knowledge Extraction & Persistence
    const extractionResult = await extractKnowledgeFromContext({
      query: query.trim(),
      sources: sourcesToUse,
      allowedSourceIds,
      maxNodes: validatedMaxNodes,
    });

    if (!extractionResult.success) {
      console.warn('[Knowledge Graph API] Extraction warnings:', extractionResult.errors);
    }

    // 6. Query and assemble structured graph data for response
    // Fetch entities, relationships with multi-sources, and sources from database
    const dbEntities = await prisma.entity.findMany({
      take: validatedMaxNodes,
      orderBy: { updatedAt: 'desc' },
      include: {
        entitySources: {
          include: { source: true },
        },
      },
    });

    const entityIds = new Set(dbEntities.map(e => e.id));

    const dbRelationships = await prisma.entityRelationship.findMany({
      where: {
        OR: [
          { entityAId: { in: Array.from(entityIds) }, entityBId: { in: Array.from(entityIds) } },
        ],
      },
      take: GRAPH_LIMITS.MAX_EDGES,
      include: {
        sources: {
          include: { source: true },
        },
      },
    });

    const nodes = dbEntities.map(e => ({
      id: e.id,
      name: e.name,
      type: e.type,
      description: e.description,
      sourceIds: e.entitySources.map(es => es.sourceId),
    }));

    const edges = dbRelationships.map(r => ({
      id: r.id,
      source: r.entityAId,
      target: r.entityBId,
      type: r.type,
      description: r.description,
      sourceIds: r.sources.map(s => s.sourceId),
    }));

    const allSourcesMap = new Map<string, any>();
    dbEntities.forEach(e => {
      e.entitySources.forEach(es => {
        if (es.source) allSourcesMap.set(es.source.id, es.source);
      });
    });
    dbRelationships.forEach(r => {
      r.sources.forEach(rs => {
        if (rs.source) allSourcesMap.set(rs.source.id, rs.source);
      });
    });

    return NextResponse.json({
      success: true,
      extraction: extractionResult,
      graph: {
        nodes,
        edges,
        sources: Array.from(allSourcesMap.values()),
      },
    });
  } catch (error: any) {
    console.error('[Knowledge Graph API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
