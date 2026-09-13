import { SearchProvider, SearchOptions } from './types';
import { SearchResultData, Source } from '@/types/search';
import { mockSearchResults, defaultMockResult } from '@/lib/mock-search-data';

export interface FreshnessIntent {
  isTimeSensitive: boolean;
  topic?: string;
  timeRange?: string;
}

export function detectFreshnessIntent(query: string): FreshnessIntent {
  if (!query || typeof query !== 'string') {
    return { isTimeSensitive: false };
  }

  const trimmed = query.trim();

  // Safe word-boundary detection for time-sensitive terms
  const dayKeywords = ['latest', 'today', 'breaking', 'just announced', 'current', 'currently', 'recent', 'recently', 'news', '2026'];
  const weekKeywords = ['this week'];
  const monthKeywords = ['this month'];
  const yearKeywords = ['this year'];

  for (const kw of dayKeywords) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(trimmed)) {
      return { isTimeSensitive: true, topic: 'news', timeRange: 'd' };
    }
  }

  for (const kw of weekKeywords) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(trimmed)) {
      return { isTimeSensitive: true, topic: 'news', timeRange: 'w' };
    }
  }

  for (const kw of monthKeywords) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(trimmed)) {
      return { isTimeSensitive: true, topic: 'general', timeRange: 'm' };
    }
  }

  for (const kw of yearKeywords) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(trimmed)) {
      return { isTimeSensitive: true, topic: 'general', timeRange: 'y' };
    }
  }

  return { isTimeSensitive: false };
}

function normalizeUrlForDeduplication(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  try {
    const parsed = new URL(url);
    // Normalize hostname casing and protocol
    const hostname = parsed.hostname.toLowerCase();
    const protocol = parsed.protocol.toLowerCase();
    // Normalize trailing slash on pathname
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    // Reconstruct without altering path case or query semantics unnecessarily
    return `${protocol}//${hostname}${pathname}${parsed.search}`;
  } catch {
    // Fallback syntactic normalization if URL constructor fails
    return url.replace(/^https?:\/\//i, 'https://').replace(/\/+$/, '');
  }
}

export function deduplicateSources(sources: Source[]): Source[] {
  if (!sources || sources.length === 0) return [];
  const seen = new Set<string>();
  const uniqueSources: Source[] = [];

  for (const source of sources) {
    const normUrl = normalizeUrlForDeduplication(source.url);
    if (!normUrl || normUrl === '#' || normUrl === 'https://#') {
      uniqueSources.push(source);
      continue;
    }
    if (!seen.has(normUrl)) {
      seen.add(normUrl);
      uniqueSources.push(source);
    }
  }

  return uniqueSources;
}

export class TavilySearchProvider implements SearchProvider {
  name = 'tavily';

  async search(options: SearchOptions): Promise<SearchResultData> {
    const apiKey = process.env.TAVILY_API_KEY;
    const rawQuery = options.query || '';
    const normalizedKey = rawQuery.toLowerCase().trim();
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

    // If API key is missing or explicitly set to mock/demo
    const isKeyMissingOrMock = !apiKey || apiKey === 'your_tavily_api_key_here' || apiKey.startsWith('mock');

    if (isKeyMissingOrMock) {
      if (isProd) {
        throw new Error('Tavily search provider is not configured for production environment.');
      }

      const matched = mockSearchResults[normalizedKey];
      if (matched) {
        return {
          ...matched,
          query: rawQuery,
          normalizedQuery: normalizedKey,
          sources: deduplicateSources(matched.sources || []),
        };
      }

      // Dynamic intelligent fallback for development
      return {
        ...defaultMockResult,
        query: rawQuery,
        normalizedQuery: normalizedKey,
        quickAnswer: `WorldKnows analyzed "${rawQuery}" across reliable reference indices. This subject encompasses fundamental principles, ongoing research developments, and significant practical implications [1].`,
        keyFacts: [
          { label: 'Query', value: rawQuery },
          { label: 'Category', value: 'Universal Knowledge' },
          { label: 'Confidence', value: 'High (Verified Sources)' },
          { label: 'Index Status', value: 'Active / Cached' }
        ],
        detailedSections: [
          {
            title: `Understanding ${rawQuery}`,
            content: `A comprehensive examination of ${rawQuery} reveals multi-disciplinary relevance spanning technology, history, and modern analysis. Experts emphasize both its structural evolution and future outlook.`
          },
          {
            title: 'Key Dimensions & Context',
            content: `When researching ${rawQuery}, scholars look at primary historical milestones, current operational paradigms, and comparative frameworks to evaluate significance.`
          }
        ],
        sources: deduplicateSources([
          {
            id: 'src-web-1',
            title: `${rawQuery} - Comprehensive Overview & Analysis`,
            domain: 'wikipedia.org',
            url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(rawQuery)}`,
            publisher: 'Wikipedia Foundation',
            sourceType: 'REFERENCE',
            reliabilityScore: 0.95,
            excerpt: `Authoritative encyclopedic reference covering key aspects of ${rawQuery} and related historical developments.`
          },
          {
            id: 'src-web-2',
            title: `Research Papers and Publications on ${rawQuery}`,
            domain: 'jstor.org',
            url: `https://www.jstor.org/action/doBasicSearch?Query=${encodeURIComponent(rawQuery)}`,
            publisher: 'JSTOR Academic Repository',
            sourceType: 'ACADEMIC',
            reliabilityScore: 0.98,
            excerpt: `Peer-reviewed academic literature and scholarly articles analyzing ${rawQuery}.`
          }
        ]),
        relatedTopics: [
          `Advanced ${rawQuery}`,
          `History of ${rawQuery}`,
          `Future Outlook`,
          `Comparative Analysis`
        ]
      };
    }

    try {
      const freshness = detectFreshnessIntent(rawQuery);
      const requestBody: any = {
        api_key: apiKey,
        query: rawQuery,
        search_depth: 'advanced',
        include_answer: true,
        include_images: false,
        max_results: options.limit || 6,
      };

      if (freshness.isTimeSensitive) {
        if (freshness.topic) requestBody.topic = freshness.topic;
        if (freshness.timeRange) requestBody.time_range = freshness.timeRange;
      }

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Tavily API authorization failed.');
        }
        throw new Error(`Tavily API responded with status ${response.status}`);
      }

      const data = await response.json();
      const results = data.results || [];

      if (results.length === 0) {
        if (isProd) {
          throw new Error('No web results returned from Tavily API.');
        }
        throw new Error('No web results returned from Tavily API');
      }

      const rawSources: Source[] = results.map((r: any, idx: number) => {
        let domain = 'web';
        try {
          domain = new URL(r.url).hostname.replace(/^www\./, '');
        } catch {
          domain = 'web';
        }

        const publishedDate = r.published_date || r.publishedDate || undefined;

        return {
          id: `src-${idx + 1}`,
          title: r.title || 'Web Result',
          url: r.url || '#',
          domain,
          snippet: r.content || r.snippet || '',
          reliabilityScore: r.score ? Math.round(r.score * 100) / 100 : 0.95,
          publisher: domain,
          sourceType: 'REFERENCE' as const,
          excerpt: (r.content || r.snippet || '').slice(0, 160),
          publishedDate,
        };
      });

      const sources = deduplicateSources(rawSources);
      const quickAnswer = data.answer || `Synthesized analysis for "${rawQuery}" based on live web retrieval indices.`;

      return {
        query: rawQuery,
        normalizedQuery: normalizedKey,
        intent: 'DEFINITION',
        isMock: false,
        quickAnswer,
        sources,
        keyFacts: [
          { label: 'Query', value: rawQuery },
          { label: 'Retrieved Sources', value: `${sources.length} active verified items` },
          { label: 'Provider', value: 'Tavily Advanced Web Retrieval' },
          { label: 'Status', value: 'Live' }
        ],
        detailedSections: [
          {
            title: `Live Web Synthesis: ${rawQuery}`,
            content: quickAnswer
          },
          {
            title: 'Verified Evidence & Findings',
            content: sources.map((s: any) => `• [${s.title}](${s.url}) (${s.domain}): ${s.excerpt}`).join('\n\n')
          }
        ],
        relatedTopics: [
          `Advanced ${rawQuery}`,
          `Recent updates on ${rawQuery}`,
          `Contextual Analysis`,
          `Related Concepts`
        ]
      };
    } catch (error: any) {
      if (isProd) {
        throw error;
      }

      console.warn(`[TavilySearchProvider] Live search failed (${error.message}). Falling back to robust indexed mock.`);
      const matched = mockSearchResults[normalizedKey];
      if (matched) {
        return {
          ...matched,
          query: rawQuery,
          normalizedQuery: normalizedKey,
          sources: deduplicateSources(matched.sources || []),
        };
      }
      throw error;
    }
  }
}
