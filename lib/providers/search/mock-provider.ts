import { SearchProvider, SearchOptions } from './types';
import { SearchResultData } from '@/types/search';
import { mockSearchResults, defaultMockResult } from '@/lib/mock-search-data';

export class MockSearchProvider implements SearchProvider {
  name = 'mock';

  async search(options: SearchOptions): Promise<SearchResultData> {
    const rawQuery = options.query || 'Quantum Computing';
    const normalizedKey = rawQuery.toLowerCase().trim();
    const matched = mockSearchResults[normalizedKey];

    if (matched) {
      return {
        ...matched,
        query: rawQuery,
        normalizedQuery: normalizedKey,
      };
    }

    // Dynamic intelligent fallback for any query
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
      relatedTopics: [
        `Advanced ${rawQuery}`,
        `History of ${rawQuery}`,
        `Future Outlook`,
        `Comparative Analysis`
      ]
    };
  }
}
