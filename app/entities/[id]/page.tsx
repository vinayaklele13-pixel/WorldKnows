import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import EntityPageClient from './EntityPageClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const entity = await prisma.entity.findUnique({
    where: { id },
    select: { name: true, type: true, description: true },
  });

  if (!entity) {
    return {
      title: 'Entity Not Found — WorldKnows',
      description: 'The requested knowledge graph entity could not be found.',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://world-knows.vercel.app';
  const title = `${entity.name} (${entity.type}) — Knowledge Graph Entity | WorldKnows`;
  const description = entity.description || `Explore verified relationships, provenance sources, and connected topics for ${entity.name} on WorldKnows.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/entities/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/entities/${id}`,
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

export default async function EntityPage({ params }: Props) {
  const { id } = await params;

  // Fetch entity data for Schema.org JSON-LD structured data
  const entityData = await prisma.entity.findUnique({
    where: { id },
    include: {
      topicEntities: {
        include: {
          topic: {
            select: { slug: true, name: true },
          },
        },
      },
      entitySources: {
        include: {
          source: {
            select: { title: true, url: true, domain: true },
          },
        },
      },
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||  'https://world-knows.vercel.app';
  const canonicalUrl = `${baseUrl}/entities/${id}`;

  const jsonLd = entityData ? {
    '@context': 'https://schema.org',
    '@type': 'Thing',
    'name': entityData.name,
    'additionalType': entityData.type,
    'description': entityData.description || `Knowledge graph entity of type ${entityData.type}`,
    'url': canonicalUrl,
    'mainEntityOfPage': canonicalUrl,
    'sameAs': entityData.entitySources.map((es) => es.source.url),
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <EntityPageClient entityId={id} />
    </>
  );
}
