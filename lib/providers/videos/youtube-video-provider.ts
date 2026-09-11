import { VideoSearchProvider, VideoSearchOptions, VideoSearchResult } from './types';

export class YouTubeVideoProvider implements VideoSearchProvider {
  async search(options: VideoSearchOptions): Promise<VideoSearchResult[]> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const query = options.query;
    const limit = options.limit || 6;

    if (!apiKey) {
      console.warn('YOUTUBE_API_KEY is not configured. Falling back to structured development mock video results.');
      return this.getMockVideos(query, limit);
    }

    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${limit}&q=${encodeURIComponent(
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
        return data.items.map((item: any, index: number) => {
          const videoId = item.id?.videoId || `vid-${index}`;
          const snippet = item.snippet || {};
          const thumbnails = snippet.thumbnails || {};
          const thumbUrl =
            thumbnails.high?.url ||
            thumbnails.medium?.url ||
            thumbnails.default?.url ||
            'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80';

          const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

          return {
            id: `yt-${videoId}`,
            title: snippet.title || `${query} Video ${index + 1}`,
            thumbnailUrl: thumbUrl,
            videoUrl: videoUrl,
            sourceUrl: videoUrl,
            sourceDomain: 'youtube.com',
            sourceName: 'YouTube',
            channelName: snippet.channelTitle || 'YouTube Creator',
            description: snippet.description || '',
            publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt).toLocaleDateString() : undefined,
            isMock: false,
          };
        });
      }

      return [];
    } catch (err) {
      console.error('YouTube Video Provider Error:', err);
      // In production, do not silently substitute unconfigured mocks on error. Return empty or let upstream handle.
      throw err;
    }
  }

  private getMockVideos(query: string, limit: number): VideoSearchResult[] {
    const pool: VideoSearchResult[] = [
      {
        id: 'mock-vid-1',
        title: `${query} - Comprehensive Documentary & Overview`,
        thumbnailUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        sourceUrl: 'https://www.youtube.com',
        sourceDomain: 'youtube.com',
        sourceName: 'YouTube (Mock)',
        channelName: 'WorldKnows Educational Channel',
        description: `Verified development mock video exploring ${query} in depth with expert interviews and visual schematics.`,
        publishedAt: '2026-01-15',
        duration: '14:25',
        isMock: true,
      },
      {
        id: 'mock-vid-2',
        title: `Understanding ${query} in 10 Minutes`,
        thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        sourceUrl: 'https://www.youtube.com',
        sourceDomain: 'youtube.com',
        sourceName: 'YouTube (Mock)',
        channelName: 'Knowledge Stream',
        description: `An animated breakdown explaining core concepts, history, and modern applications of ${query}.`,
        publishedAt: '2026-03-20',
        duration: '10:05',
        isMock: true,
      },
      {
        id: 'mock-vid-3',
        title: `${query}: Deep Dive & Expert Analysis`,
        thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        sourceUrl: 'https://www.youtube.com',
        sourceDomain: 'youtube.com',
        sourceName: 'YouTube (Mock)',
        channelName: 'Global Science & History',
        description: `Professional lecture examining ${query} through primary sources and empirical research.`,
        publishedAt: '2026-05-10',
        duration: '42:18',
        isMock: true,
      }
    ];

    return pool.slice(0, limit);
  }
}

export function getVideoSearchProvider(): VideoSearchProvider {
  return new YouTubeVideoProvider();
}
