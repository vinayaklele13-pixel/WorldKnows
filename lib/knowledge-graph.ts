import { prisma } from '@/lib/prisma';
import { SearchResultData } from '@/types/search';

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function cleanText(value: string, maxLength = 500): string {
  return value.trim().slice(0, maxLength);
}

/**
 * Builds a knowledge graph from an existing SearchResultData record.
 *
 * This first version is intentionally deterministic:
 * - The searched query becomes the primary CONCEPT entity.
 * - Related topics become TOPIC records and CONCEPT entities.
 * - The primary entity is connected to each related entity.
 * - Existing database sources are attached as evidence.
 *
 * It does NOT invent entities from arbitrary AI-generated text.
 */
export async function buildKnowledgeGraph(
  searchId: string,
  result: SearchResultData
): Promise<void> {
  const query = cleanText(result.query);

  if (!query) {
    return;
  }

  // Get the sources that were already persisted for this search.
  const sources = await prisma.source.findMany({
    where: {
      searchId,
    },
    select: {
      id: true,
      title: true,
      url: true,
    },
  });

  /*
   * 1. Create/find the main topic.
   */
  const mainTopic = await prisma.topic.upsert({
    where: {
      slug: createSlug(query),
    },
    update: {
      name: query,
      description: cleanText(result.quickAnswer, 1000),
      updatedAt: new Date(),
    },
    create: {
      slug: createSlug(query),
      name: query,
      description: cleanText(result.quickAnswer, 1000),
    },
  });

  /*
   * 2. Create/find the main entity.
   */
  const mainEntity = await prisma.entity.upsert({
    where: {
      name_type: {
        name: query,
        type: 'CONCEPT',
      },
    },
    update: {
      description: cleanText(result.quickAnswer, 1000),
      updatedAt: new Date(),
    },
    create: {
      name: query,
      type: 'CONCEPT',
      description: cleanText(result.quickAnswer, 1000),
    },
  });

  /*
   * 3. Connect the main topic and entity.
   */
  await prisma.topicEntity.upsert({
    where: {
      topicId_entityId: {
        topicId: mainTopic.id,
        entityId: mainEntity.id,
      },
    },
    update: {},
    create: {
      topicId: mainTopic.id,
      entityId: mainEntity.id,
    },
  });

  /*
   * 4. Attach the existing sources as evidence for the main entity.
   */
  if (sources.length > 0) {
    await prisma.entitySource.createMany({
      data: sources.map((source) => ({
        entityId: mainEntity.id,
        sourceId: source.id,
        evidence: source.title,
      })),
      skipDuplicates: true,
    });
  }

  /*
   * 5. Turn relatedTopics into graph nodes.
   */
  const relatedTopics = Array.from(
    new Set(
      (result.relatedTopics || [])
        .map((topic) => cleanText(topic, 200))
        .filter(Boolean)
        .filter((topic) => topic.toLowerCase() !== query.toLowerCase())
    )
  );

  for (const relatedName of relatedTopics) {
    const relatedTopic = await prisma.topic.upsert({
      where: {
        slug: createSlug(relatedName),
      },
      update: {
        name: relatedName,
        updatedAt: new Date(),
      },
      create: {
        slug: createSlug(relatedName),
        name: relatedName,
      },
    });

    const relatedEntity = await prisma.entity.upsert({
      where: {
        name_type: {
          name: relatedName,
          type: 'CONCEPT',
        },
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        name: relatedName,
        type: 'CONCEPT',
      },
    });

    /*
     * Connect related topic → related entity.
     */
    await prisma.topicEntity.upsert({
      where: {
        topicId_entityId: {
          topicId: relatedTopic.id,
          entityId: relatedEntity.id,
        },
      },
      update: {},
      create: {
        topicId: relatedTopic.id,
        entityId: relatedEntity.id,
      },
    });

    /*
     * Connect main topic → related topic.
     */
    await prisma.topicRelationship.upsert({
      where: {
        topicAId_topicBId_type: {
          topicAId: mainTopic.id,
          topicBId: relatedTopic.id,
          type: 'RELATED_TO',
        },
      },
      update: {},
      create: {
        topicAId: mainTopic.id,
        topicBId: relatedTopic.id,
        type: 'RELATED_TO',
        description: `${query} is related to ${relatedName}.`,
      },
    });

    /*
     * Connect main entity → related entity.
     */
    await prisma.entityRelationship.upsert({
      where: {
        entityAId_entityBId_type: {
          entityAId: mainEntity.id,
          entityBId: relatedEntity.id,
          type: 'RELATED_TO',
        },
      },
      update: {},
      create: {
        entityAId: mainEntity.id,
        entityBId: relatedEntity.id,
        type: 'RELATED_TO',
        description: `${query} is related to ${relatedName}.`,
        sourceId: sources[0]?.id ?? null,
      },
    });

    /*
     * Attach the same retrieved evidence to the related entity.
     */
    if (sources.length > 0) {
      await prisma.entitySource.createMany({
        data: sources.map((source) => ({
          entityId: relatedEntity.id,
          sourceId: source.id,
          evidence: source.title,
        })),
        skipDuplicates: true,
      });
    }
  }
}