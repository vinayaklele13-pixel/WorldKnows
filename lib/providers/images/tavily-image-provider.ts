import { ImageSearchProvider, ImageSearchOptions, ImageSearchResult } from './types';

export class TavilyImageProvider implements ImageSearchProvider {
  async search(options: ImageSearchOptions): Promise<ImageSearchResult[]> {
    const apiKey = process.env.TAVILY_API_KEY;
    const query = options.query;
    const limit = options.limit || 8;

    if (!apiKey) {
      return [];
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: `${query} images`,
          search_depth: 'basic',
          include_images: true,
          max_results: limit,
        }),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const extracted: ImageSearchResult[] = [];

      // 1. Strict verified source-linked mapping: data.results[] -> result.url -> result.images[]
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((res: any, rIdx: number) => {
          const pageUrl = res.url;
          const images = res.images;

          if (images && Array.isArray(images) && pageUrl) {
            images.forEach((img: any, iIdx: number) => {
              const imgUrl = typeof img === 'string' ? img : (img.url || img.image_url);
              if (imgUrl) {
                const domain = this.extractDomain(pageUrl);
                if (domain) {
                  extracted.push({
                    id: `img-res-${rIdx}-${iIdx}-${Date.now()}`,
                    title: res.title || `${query} image`,
                    thumbnailUrl: imgUrl,
                    imageUrl: imgUrl,
                    sourceUrl: pageUrl,
                    sourceDomain: domain,
                    sourceName: domain,
                    isMock: false,
                  });
                }
              }
            });
          }
        });
      }

      // 2. Asset-only fallback: top-level data.images[] (never fabricate a webpage URL, sourceUrl = undefined)
      if (extracted.length === 0 && data.images && Array.isArray(data.images)) {
        data.images.forEach((img: any, index: number) => {
          const imgUrl = typeof img === 'string' ? img : (img.url || img.image_url);
          if (imgUrl) {
            const domain = this.extractDomain(imgUrl);
            extracted.push({
              id: `img-tavily-${index}-${Date.now()}`,
              title: `${query} - Reference Image ${index + 1}`,
              thumbnailUrl: imgUrl,
              imageUrl: imgUrl,
              sourceUrl: undefined,
              sourceDomain: domain || 'web asset',
              sourceName: domain || 'Web Asset',
              isMock: false,
            });
          }
        });
      }

      if (extracted.length > 0) {
        return extracted.slice(0, limit);
      }

      return [];
    } catch (err) {
      console.error('Tavily Image Search Error:', err);
      return [];
    }
  }

  private extractDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch {
      return '';
    }
  }
}

export function getImageSearchProvider(): ImageSearchProvider {
  return new TavilyImageProvider();
}
