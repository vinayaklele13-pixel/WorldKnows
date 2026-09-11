import { buildKnowledgeGraph } from '@/lib/knowledge-graph';
import { NextResponse } from 'next/server';
import { getSearchProvider } from '@/lib/providers/search';
import { getAIProvider } from '@/lib/providers/ai';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchCache } from '@/lib/cache';
import { apiRateLimiter, getClientIp } from '@/lib/ratelimit';

export async function GET(request: Request) {
  // 1. Rate Limiting Check
  const clientIp = getClientIp(request);
  const rateLimitResult = apiRateLimiter.check(clientIp);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.reset),
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  // 2. Query Validation
  if (!query || typeof query !== 'string' || !query.trim()) {
    return NextResponse.json({ error: 'Query parameter "q" is required and cannot be empty.' }, { status: 400 });
  }

  const trimmedQuery = query.trim();
  const MAX_QUERY_LENGTH = 250;

  if (trimmedQuery.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Query exceeds maximum allowed length of ${MAX_QUERY_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const normalizedQuery = trimmedQuery.toLowerCase();

  try {
    // 3. Check Cache
    const cachedData = searchCache.get(normalizedQuery);
    let responsePayload: any;

    if (cachedData) {
      responsePayload = cachedData;
    } else {
      const searchProvider = getSearchProvider();
      const aiProvider = getAIProvider();

      // 4. Fetch Search Results
      const searchResults = await searchProvider.search({ query: trimmedQuery });

      // 5. Synthesize via AI Adapter
      const synthesizedAnswer = await aiProvider.synthesize({
        query: trimmedQuery,
        context: JSON.stringify(searchResults.sources)
      });

      // Filter and sanitize: Remove any placeholder references or fake internal docs
      const sanitizedSources = (searchResults.sources || []).filter(
        (s: any) => !s.url.includes('worldknows.internal/docs')
      );

      responsePayload = {
        ...searchResults,
        sources: sanitizedSources,
        query: trimmedQuery,
        normalizedQuery,
        quickAnswer: synthesizedAnswer,
      };

      searchCache.set(normalizedQuery, responsePayload);
    }

    // 6. Persist search
    try {
      const session = await getSession();
      if (session && session.userId) {
        const persistedSearch = await prisma.search.create({
          data: {
            userId: session.userId,
            query: trimmedQuery,
            intent: responsePayload.intent || null,
            summary: responsePayload.quickAnswer || null,
            sources: {
              create: (responsePayload.sources || []).map((source: any) => ({
                title: source.title || 'Untitled',
                url: source.url || '#',
                domain: source.domain || 'web',
                snippet: source.snippet || null,
                reliabilityScore: source.reliabilityScore || null,
              })),
            },
          },
        });

        try {
          await buildKnowledgeGraph(persistedSearch.id, responsePayload);
        } catch (graphError) {
          console.error('Failed to build knowledge graph:', graphError);
        }
      }
    } catch (dbError) {
      console.error('Failed to persist search for user:', dbError);
    }

    return NextResponse.json(responsePayload, {
      headers: {
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.reset),
      },
    });
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Failed to process search request' }, { status: 500 });
  }
}
