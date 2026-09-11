import { NextResponse } from 'next/server';
import { getImageGenerationProvider } from '@/lib/providers/image-generation';
import { apiRateLimiter, getClientIp } from '@/lib/ratelimit';

export async function POST(request: Request) {
  // Rate limiting
  const clientIp = getClientIp(request);
  const rateLimitResult = apiRateLimiter.check(clientIp);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { prompt, size } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const provider = getImageGenerationProvider();
    const images = await provider.generate({ prompt, size });

    return NextResponse.json({
      images,
      provider: provider.name,
    });
  } catch (error: any) {
    console.error('Image Generation API Error:', error);
    return NextResponse.json(
      {
        error: 'Image generation is temporarily unavailable.',
        details: error.message || 'Provider failure'
      },
      { status: 502 }
    );
  }
}
