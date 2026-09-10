import { prisma } from '@/lib/prisma';

/**
 * ============================================================================
 * Phase 7 Provenance & Source Security Safeguard (`lib/graph/provenance.ts`)
 * ============================================================================
 *
 * Enforces strict public/private separation. Private user search history
 * must NEVER be exposed in public knowledge graph provenance.
 */

interface PublicSourceInput {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  evidence?: string;
}

const GLOBAL_PUBLIC_SEARCH_QUERY = 'system:global-knowledge-repository';

/**
 * 1 & 2. Locates or creates a dedicated global public Search container whose
 * userId is guaranteed to be NULL and query matches the system repository.
 */
export async function getOrCreateGlobalPublicSearch() {
  const existing = await prisma.search.findFirst({
    where: {
      userId: null,
      query: GLOBAL_PUBLIC_SEARCH_QUERY,
    },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.search.create({
    data: {
      userId: null, // Guaranteed null -> public workspace isolation
      query: GLOBAL_PUBLIC_SEARCH_QUERY,
      intent: 'system-provenance',
      summary: 'Isolated container for public knowledge graph provenance sources.',
    },
    select: { id: true },
  });

  return created.id;
}

/**
 * 3. Security Enforcement:
 * - resolvePublicProvenanceSource() MUST reject a private or invalid sourceId.
 * - It MUST NOT silently fall back to a different public source.
 * - If sourceId is invalid, missing, not found, or belongs to a Search where userId IS NOT NULL,
 *   or does NOT belong to the designated global public search container, throw an explicit validation error and perform NO write.
 * - Only verified public Sources belonging to the global public Search (userId = null) may be used.
 */
export async function resolvePublicProvenanceSource(sourceId: string) {
  if (!sourceId || typeof sourceId !== 'string') {
    throw new Error('Security Validation Error: A valid sourceId is required for public knowledge graph provenance.');
  }

  // Server-side database check of parent Search ownership immediately before write
  const sourceRecord = await prisma.source.findUnique({
    where: { id: sourceId },
    include: {
      search: {
        select: { id: true, userId: true, query: true },
      },
    },
  });

  if (!sourceRecord) {
    throw new Error(`Security Validation Error: Source with ID "${sourceId}" was not found.`);
  }

  // If the source belongs to a private search (userId IS NOT NULL), reject it immediately.
  if (sourceRecord.search.userId !== null) {
    throw new Error(
      `Security Violation: Source ID "${sourceId}" belongs to a private user search (userId: ${sourceRecord.search.userId}). Private research cannot be used for public knowledge graph provenance.`
    );
  }

  // Tightened check: Ensure the source belongs specifically to the designated global public knowledge repository search container.
  if (sourceRecord.search.query !== GLOBAL_PUBLIC_SEARCH_QUERY) {
    throw new Error(
      `Security Violation: Source ID "${sourceId}" does not belong to the designated global public knowledge repository container.`
    );
  }

  return sourceRecord;
}

/**
 * Creates a verified public Source linked strictly to the global public Search container.
 */
export async function createPublicProvenanceSource(input: PublicSourceInput) {
  const publicSearchId = await getOrCreateGlobalPublicSearch();

  // Check if public source already exists under global public search
  let publicSource = await prisma.source.findFirst({
    where: {
      url: input.url,
      searchId: publicSearchId,
    },
  });

  if (!publicSource) {
    publicSource = await prisma.source.create({
      data: {
        searchId: publicSearchId,
        title: input.title,
        url: input.url,
        domain: input.domain,
        snippet: input.snippet || null,
      },
    });
  }

  return publicSource;
}

/**
 * 5 & 6. API Enforcement: EntitySource and EntityRelationship.sourceId can only reference
 * verified public Sources. Throws on any private or invalid source.
 */
export async function attachEntityProvenance(data: {
  entityId: string;
  sourceId: string;
  evidence?: string;
}) {
  // Server-side validation rejecting private/invalid sources without fallback
  const verifiedSource = await resolvePublicProvenanceSource(data.sourceId);

  return await prisma.entitySource.upsert({
    where: {
      entityId_sourceId: {
        entityId: data.entityId,
        sourceId: verifiedSource.id,
      },
    },
    update: {
      evidence: data.evidence || null,
    },
    create: {
      entityId: data.entityId,
      sourceId: verifiedSource.id,
      evidence: data.evidence || null,
    },
  });
}
