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

  // 2. Query Validation (Missing, Empty, or Excessively Large)
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

      // Verify that the payload contains only public search/AI result data before caching
      responsePayload = {
        ...searchResults,
        query: trimmedQuery,
        normalizedQuery,
        quickAnswer: synthesizedAnswer,
      };

      // Cache only successful completed search responses (TTL: 15 minutes, bounded size)
      searchCache.set(normalizedQuery, responsePayload);
    }

    // 6. Non-blocking search persistence for authenticated users (runs on both cache hits and misses)
    try {
      const session = await getSession();
      if (session && session.userId) {
        await prisma.search.create({
          data: {
            userId: session.userId,
            query: trimmedQuery,
            intent: responsePayload.intent || null,
            summary: responsePayload.quickAnswer || null,
            sources: {
              create: (responsePayload.sources || []).map((source: any) => ({
                title: source.title || 'Untitled',
                url: source.url || '#',
                domain: source.domain || new URL(source.url || 'http://localhost').hostname,
                snippet: source.snippet || null,
                reliabilityScore: source.reliabilityScore || null,
              })),
            },
          },
        });
      }
    } catch (dbError) {
      // Non-blocking: log error but do not fail the search request
      console.error('Failed to persist search for user:', dbError);
    }

    // 7. Return normalized result with rate limit headers
    return NextResponse.json(responsePayload, {
      headers: {
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.reset),
      },
    });
  } catch (error) {
    // Log internal error privately but return generic error without exposing provider details
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Failed to process search request' }, { status: 500 });
  }
}
