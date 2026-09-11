export interface VideoSearchResult {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceName: string;
  channelName?: string;
  description?: string;
  publishedAt?: string;
  duration?: string;
  attribution?: string;
  isMock?: boolean;
}

export interface VideoSearchOptions {
  query: string;
  limit?: number;
}

export interface VideoSearchProvider {
  search(options: VideoSearchOptions): Promise<VideoSearchResult[]>;
}
