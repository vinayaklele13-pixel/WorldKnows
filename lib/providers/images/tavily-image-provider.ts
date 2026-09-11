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
          max_results: limit * 2, // Fetch extra candidates to account for server-side validation filtering
        }),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const rawCandidates: Array<{
        id: string;
        title: string;
        thumbnailUrl: string;
        imageUrl: string;
        sourceUrl?: string;
        sourceDomain: string;
        sourceName: string;
        isMock: boolean;
      }> = [];

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
                  rawCandidates.push({
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
      if (rawCandidates.length === 0 && data.images && Array.isArray(data.images)) {
        data.images.forEach((img: any, index: number) => {
          const imgUrl = typeof img === 'string' ? img : (img.url || img.image_url);
          if (imgUrl) {
            const domain = this.extractDomain(imgUrl);
            rawCandidates.push({
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

      // 3. Validate candidates in parallel to filter out 403, 401, non-image content-type, or unreachable URLs
      const validatedResults: ImageSearchResult[] = [];
      const validationPromises = rawCandidates.map(async (candidate) => {
        const isValid = await this.validateImageUrl(candidate.imageUrl);
        if (isValid) {
          validatedResults.push(candidate);
        }
      });

      await Promise.all(validationPromises);

      return validatedResults.slice(0, limit);
    } catch (err) {
      console.error('Tavily Image Search Error:', err);
      return [];
    }
  }

  private async validateImageUrl(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'WorldKnows-ImageValidator/1.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.toLowerCase().startsWith('image/')) {
        return false;
      }

      return true;
    } catch {
      return false;
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
