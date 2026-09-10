import { SearchProvider } from './types';
import { MockSearchProvider } from './mock-provider';
import { TavilySearchProvider } from './tavily-provider';

export function getSearchProvider(): SearchProvider {
  const providerType = process.env.SEARCH_PROVIDER || 'mock';

  switch (providerType.toLowerCase()) {
    case 'tavily':
      return new TavilySearchProvider();
    case 'mock':
    default:
      return new MockSearchProvider();
  }
}

export * from './types';
