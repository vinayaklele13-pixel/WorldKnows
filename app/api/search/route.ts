import { buildKnowledgeGraph } from '@/lib/knowledge-graph';
import { NextResponse } from 'next/server';
import { getSearchProvider } from '@/lib/providers/search';
import { getAIProvider } from '@/lib/providers/ai';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchCache } from '@/lib/cache';
import { apiRateLimiter, getClientIp } from '@/lib/ratelimit';
import { detectFreshnessIntent } from '@/lib/providers/search/tavily-provider';

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
  const freshness = detectFreshnessIntent(trimmedQuery);

  try {
    // 3. Check Cache (Bypass cache entirely for strongly time-sensitive queries)
    let cachedData = null;
    if (!freshness.isTimeSensitive) {
      cachedData = searchCache.get(normalizedQuery);
    }

    let responsePayload: any;

    if (cachedData) {
      responsePayload = cachedData;
    } else {
      const searchProvider = getSearchProvider();
      const aiProvider = getAIProvider();

      // 4. Fetch Search Results
      const searchResults = await searchProvider.search({ query: trimmedQuery });

      // Format sources cleanly for AI context (including published date if available)
      const formattedSourcesContext = (searchResults.sources || [])
        .map((s: any, idx: number) => {
          let line = `SOURCE ${idx + 1}\nTitle: ${s.title}\nDomain: ${s.domain}\nURL: ${s.url}`;
          if (s.publishedDate) {
            line += `\nPublished: ${s.publishedDate}`;
          }
          line += `\nSnippet: ${s.snippet || s.excerpt || ''}`;
          return line;
        }).join('\n\n');

      // 5. Synthesize via AI Adapter and generate dynamic related topics in parallel
      const [synthesizedAnswer, dynamicRelatedTopics] = await Promise.all([
        aiProvider.synthesize({
          query: trimmedQuery,
          context: formattedSourcesContext
        }),
        aiProvider.generateRelatedTopics ? aiProvider.generateRelatedTopics({
          query: trimmedQuery,
          context: formattedSourcesContext
        }).catch(() => []) : Promise.resolve([])
      ]);

      // Filter and sanitize: Remove any placeholder references or fake internal docs
      const sanitizedSources = (searchResults.sources || []).filter(
        (s: any) => !s.url.includes('worldknows.internal/docs')
      );

      const finalRelatedTopics = (dynamicRelatedTopics && dynamicRelatedTopics.length > 0)
        ? dynamicRelatedTopics
        : [];

      responsePayload = {
        ...searchResults,
        sources: sanitizedSources,
        query: trimmedQuery,
        normalizedQuery,
        quickAnswer: synthesizedAnswer,
        relatedTopics: finalRelatedTopics,
      };

      if (!freshness.isTimeSensitive) {
        searchCache.set(normalizedQuery, responsePayload);
      }
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
  } catch (error: any) {
    console.error('Search API Error:', error);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? "We couldn't complete that search. Please try again."
      : (error.message || 'Failed to process search request');
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
