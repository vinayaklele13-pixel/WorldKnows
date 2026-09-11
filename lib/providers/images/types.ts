export interface ImageSearchResult {
  id: string;
  title: string;
  thumbnailUrl: string;
  imageUrl: string;
  sourceUrl?: string;
  sourceDomain: string;
  sourceName: string;
  width?: number;
  height?: number;
  attribution?: string;
  isMock?: boolean;
}

export interface ImageSearchOptions {
  query: string;
  limit?: number;
}

export interface ImageSearchProvider {
  search(options: ImageSearchOptions): Promise<ImageSearchResult[]>;
}
