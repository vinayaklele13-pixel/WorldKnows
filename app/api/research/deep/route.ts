import { NextResponse } from 'next/server';
import { DeepResearchOrchestrator } from '@/lib/research/research-orchestrator';
import { apiRateLimiter, getClientIp } from '@/lib/ratelimit';

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimitResult = apiRateLimiter.check(clientIp);

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { prompt } = await request.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

    const orchestrator = new DeepResearchOrchestrator();
    const result = await orchestrator.research(prompt);

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Deep Research Error:', error);
    return NextResponse.json({ error: 'Failed to perform deep research' }, { status: 500 });
  }
}
