import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://world-knows.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/topics/', '/search'],
        disallow: ['/research', '/research/', '/api/', '/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
