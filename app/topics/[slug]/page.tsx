import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import TopicPageClient from './TopicPageClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const topic = await prisma.topic.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!topic) {
    return {
      title: 'Topic Not Found — WorldKnows',
      description: 'The requested knowledge topic could not be found.',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://worldknows.com';
  const title = `${topic.name} — Knowledge Graph & Research | WorldKnows`;
  const description = topic.description || `Explore verified entities, relationships, and provenanced research for ${topic.name} on WorldKnows.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/topics/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/topics/${slug}`,
      type: 'article',
      siteName: 'WorldKnows',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;

  // Fetch topic data for Schema.org JSON-LD structured data
  const topicData = await prisma.topic.findUnique({
    where: { slug },
    include: {
      topicEntities: {
        include: {
          entity: {
            select: { id: true, name: true, type: true, description: true },
          },
        },
      },
      topicA: {
        include: {
          topicB: {
            select: { slug: true, name: true },
          },
        },
      },
      topicB: {
        include: {
          topicA: {
            select: { slug: true, name: true },
          },
        },
      },
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://worldknows.com';
  const canonicalUrl = `${baseUrl}/topics/${slug}`;

  const jsonLd = topicData ? {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    'name': topicData.name,
    'description': topicData.description || `Knowledge graph topic for ${topicData.name}`,
    'url': canonicalUrl,
    'inDefinedTermSet': `${baseUrl}/topics`,
    'about': topicData.topicEntities.map((te) => ({
      '@type': 'Thing',
      'name': te.entity.name,
      'additionalType': te.entity.type,
      'description': te.entity.description,
    })),
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <TopicPageClient slug={slug} />
    </>
  );
}
