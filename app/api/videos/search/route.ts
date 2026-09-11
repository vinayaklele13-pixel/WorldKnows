import { NextResponse } from 'next/server';
import { getVideoSearchProvider } from '@/lib/providers/videos/youtube-video-provider';
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
    const provider = getVideoSearchProvider();
    const videos = await provider.search({ query: query.trim(), limit: 6 });

    return NextResponse.json({
      query: query.trim(),
      videos,
      provider: process.env.YOUTUBE_API_KEY ? 'youtube-api-v3' : 'youtube-development-mock',
    });
  } catch (error: any) {
    console.error('Video Search API Error:', error);

    // Return explicit error status rather than silently failing
    return NextResponse.json(
      {
        error: 'Video search is temporarily unavailable.',
        details: error.message || 'Provider failure'
      },
      { status: 502 }
    );
  }
}
