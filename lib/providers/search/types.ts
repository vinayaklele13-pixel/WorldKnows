import { SearchResultData } from '@/types/search';

export interface SearchOptions {
  query: string;
  limit?: number;
  locale?: string;
}

export interface SearchProvider {
  name: string;
  search(options: SearchOptions): Promise<SearchResultData>;
}
