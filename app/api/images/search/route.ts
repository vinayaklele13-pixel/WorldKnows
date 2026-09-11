import { NextResponse } from 'next/server';
import { getImageSearchProvider } from '@/lib/providers/images/tavily-image-provider';
import { apiRateLimiter, getClientIp } from '@/lib/ratelimit';

export async function GET(request: Request) {
  // Rate limiting
  const clientIp = getClientIp(request);
  const rateLimitResult = apiRateLimiter.check(clientIp);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || typeof query !== 'string' || !query.trim()) {
    return NextResponse.json({ error: 'Query parameter "q" is required.' }, { status: 400 });
  }

  try {
    const provider = getImageSearchProvider();
    const images = await provider.search({ query: query.trim(), limit: 8 });

    return NextResponse.json({
      query: query.trim(),
      images,
      provider: 'tavily-image-hybrid',
    });
  } catch (error) {
    console.error('Image Search API Error:', error);
    return NextResponse.json({ error: 'Image search is temporarily unavailable.' }, { status: 500 });
  }
}
