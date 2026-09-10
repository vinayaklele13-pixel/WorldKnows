import { SearchProvider, SearchOptions } from './types';
import { SearchResultData } from '@/types/search';
import { MockSearchProvider } from './mock-provider';

export class TavilySearchProvider implements SearchProvider {
  name = 'tavily';
  private fallbackProvider = new MockSearchProvider();

  async search(options: SearchOptions): Promise<SearchResultData> {
    const apiKey = process.env.TAVILY_API_KEY;
    const rawQuery = options.query || '';
    const normalizedKey = rawQuery.toLowerCase().trim();

    if (!apiKey) {
      throw new Error('[TavilySearchProvider] TAVILY_API_KEY not configured.');
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: rawQuery,
          search_depth: 'advanced',
          include_answer: true,
          include_images: false,
          max_results: options.limit || 6,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API responded with status ${response.status}`);
      }

      const data = await response.json();
      const results = data.results || [];

      const sources = results.map((r: any, idx: number) => {
        let domain = 'web';
        try {
          domain = new URL(r.url).hostname.replace(/^www\./, '');
        } catch {
          domain = 'web';
        }

        return {
          id: `src-${idx + 1}`,
          title: r.title || 'Web Result',
          url: r.url || '#',
          domain,
          snippet: r.content || r.snippet || '',
          reliabilityScore: r.score ? Math.round(r.score * 100) / 100 : 0.95,
        };
      });

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
          { label: 'Retrieved Sources', value: `${sources.length} active items` },
          { label: 'Provider', value: 'Tavily Advanced Web Retrieval' },
          { label: 'Status', value: 'Live' }
        ],
        detailedSections: [
          {
            title: `Web Synthesis: ${rawQuery}`,
            content: quickAnswer
          },
          {
            title: 'Retrieved Evidence Summary',
            content: sources.map((s: any) => `• [${s.title}](${s.url}) (${s.domain}): ${s.snippet.slice(0, 160)}...`).join('\n\n')
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
      console.error('[TavilySearchProvider] Error fetching live search results:', error.message);
      throw error;
    }
  }
}
