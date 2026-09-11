import { VideoSearchProvider, VideoSearchOptions, VideoSearchResult } from './types';

export class YouTubeVideoProvider implements VideoSearchProvider {
  async search(options: VideoSearchOptions): Promise<VideoSearchResult[]> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const query = options.query;
    const limit = options.limit || 6;

    if (!apiKey) {
      console.error('YOUTUBE_API_KEY is not configured. Video search requires a valid API key in production. Returning empty results.');
      return [];
    }

    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&order=relevance&maxResults=${limit}&q=${encodeURIComponent(
        query
      )}&key=${apiKey}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('YouTube API Error Response:', errorText);
        throw new Error(`YouTube API returned status ${response.status}`);
      }

      const data = await response.json();

      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        const results: VideoSearchResult[] = [];
        for (const item of data.items) {
          const videoId = item.id?.videoId;
          if (!videoId) {
            // Rule: If a result has no valid videoId, discard that result. Do NOT invent an ID.
            continue;
          }
          const snippet = item.snippet || {};
          const thumbnails = snippet.thumbnails || {};
          const thumbUrl =
            thumbnails.high?.url ||
            thumbnails.medium?.url ||
            thumbnails.default?.url ||
            'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80';

          const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

          results.push({
            id: `yt-${videoId}`,
            videoId: videoId,
            title: snippet.title || `${query} Video`,
            thumbnailUrl: thumbUrl,
            videoUrl: videoUrl,
            sourceUrl: videoUrl,
            sourceDomain: 'youtube.com',
            sourceName: 'YouTube',
            channelName: snippet.channelTitle || 'YouTube Creator',
            description: snippet.description || '',
            publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt).toLocaleDateString() : undefined,
            isMock: false,
          });
        }
        return results;
      }

      return [];
    } catch (err) {
      console.error('YouTube Video Provider Error:', err);
      throw err;
    }
  }
}

export function getVideoSearchProvider(): VideoSearchProvider {
  return new YouTubeVideoProvider();
}
