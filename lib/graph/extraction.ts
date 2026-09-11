import { prisma } from '@/lib/prisma';
import { EntityType } from '@prisma/client';
import { getEntityRelationshipDefinition, canonicalizeEndpoints } from './registry';
import { resolvePublicProvenanceSource } from './provenance';
import { canonicalizeEntityName, getEntityDeduplicationKey } from './canonicalization';
import { GRAPH_LIMITS } from './config';

/**
 * ============================================================================
 * Knowledge Graph 2.0 AI Extraction & Grounding Pipeline (`lib/graph/extraction.ts`)
 * ============================================================================
 *
 * Extracts structured entities and relationships from search or deep research context,
 * applies canonicalization/deduplication, enforces strict evidence grounding
 * (no evidence = no relationship), preserves multiple supporting sources per relationship,
 * and enforces graph limits.
 */

export interface ExtractedEntityCandidate {
  name: string;
  type: EntityType;
  description?: string;
  sourceIndices?: number[]; // Supporting source indices
  sourceIndex?: number;    // Backward compatibility single index
}

export interface ExtractedRelationshipCandidate {
  entityAName: string;
  entityAType: EntityType;
  entityBName: string;
  entityBType: EntityType;
  type: string;
  description?: string;
  sourceIndices?: number[];
  sourceIndex?: number;
}

export interface ExtractionInput {
  query: string;
  searchSummary?: string;
  sources: Array<{
    id: string;
    title: string;
    url: string;
    domain: string;
    snippet?: string;
  }>;
  allowedSourceIds?: Set<string>; // For authorization/IDOR check
  maxNodes?: number;
}

export interface ExtractionResult {
  success: boolean;
  entitiesCreated: number;
  relationshipsCreated: number;
  errors: string[];
}

/**
 * Validates that a source ID is authorized (either a global public provenance source or present in allowedSourceIds).
 */
async function validateSourceAuthorization(sourceId: string, allowedSourceIds?: Set<string>): Promise<boolean> {
  if (!sourceId) return false;
  if (allowedSourceIds && allowedSourceIds.has(sourceId)) {
    return true;
  }
  try {
    await resolvePublicProvenanceSource(sourceId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prompts AI (via OmniRoute / AIProvider) to extract structured knowledge candidates.
 */
export async function extractKnowledgeFromContext(input: ExtractionInput): Promise<ExtractionResult> {
  const errors: string[] = [];
  if (!input.sources || input.sources.length === 0) {
    return { success: false, entitiesCreated: 0, relationshipsCreated: 0, errors: ['No sources provided for extraction.'] };
  }

  const apiKey = process.env.OMNIROUTE_API_KEY || 'local-dev-key';
  const baseUrl = process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1';
  const model = process.env.AI_MODEL || 'auto';

  const validEntityTypes = Object.values(EntityType).join(', ');
  const systemPrompt = `You are WorldKnows Knowledge Graph 2.0 Extraction AI. Analyze the provided search sources and extract structured knowledge items.
You MUST output ONLY valid JSON matching this exact structure:
{
  "entities": [
    { "name": "Entity Name", "type": "PERSON | ORGANIZATION | PLACE | EVENT | CONCEPT | TECHNOLOGY | OTHER", "description": "Short description", "sourceIndices": [0] }
  ],
  "relationships": [
    { "entityAName": "Name 1", "entityAType": "ORGANIZATION", "entityBName": "Name 2", "entityBType": "TECHNOLOGY", "type": "ASSOCIATED_WITH", "description": "Evidence description", "sourceIndices": [0, 1] }
  ]
}
RULES:
1. entity types MUST be strictly one of: ${validEntityTypes}.
2. relationship types MUST be valid relationship identifiers (e.g., ASSOCIATED_WITH, PART_OF, FOUNDER_OF, CEO_OF, EMPLOYED_BY, ACQUIRED, INVESTED_IN, PARTICIPATED_IN, LOCATED_IN, SUCCESSOR_OF, COLLABORATES_WITH, COMPETES_WITH).
3. sourceIndices refers to 0-based indices of sources supporting this fact. Every relationship MUST have at least one valid sourceIndex.
4. Do NOT invent facts or sources. Return ONLY raw JSON without markdown code fences.`;

  const sourcesContext = input.sources
    .slice(0, GRAPH_LIMITS.MAX_SOURCES_PER_EXTRACTION)
    .map((s, idx) => `[Source ${idx}] Title: ${s.title}\nURL: ${s.url}\nSnippet: ${s.snippet || 'N/A'}`)
    .join('\n\n');

  const userPrompt = `Query: ${input.query}\nSummary: ${input.searchSummary || 'N/A'}\n\nSources:\n${sourcesContext}`;

  let jsonText = '';
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Extraction API responded with status ${response.status}`);
    }

    const data = await response.json();
    jsonText = data.choices?.[0]?.message?.content || '';
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  } catch (err: any) {
    console.warn(`[Extraction] AI connection warning (${err.message}). Using deterministic fallback extraction.`);
    return await executeFallbackExtraction(input, errors);
  }

  let parsed: { entities?: ExtractedEntityCandidate[]; relationships?: ExtractedRelationshipCandidate[] } = {};
  try {
    parsed = JSON.parse(jsonText);
  } catch (err: any) {
    errors.push(`Malformed AI JSON output: ${err.message}. Raw text: ${jsonText.slice(0, 200)}...`);
    return await executeFallbackExtraction(input, errors);
  }

  return await processAndPersistExtractedData(parsed, input.sources, errors, input.allowedSourceIds, input.maxNodes);
}

/**
 * Deterministic fallback extractor for resilience when AI service is offline.
 */
async function executeFallbackExtraction(input: ExtractionInput, errors: string[]): Promise<ExtractionResult> {
  const primarySource = input.sources[0];
  if (!primarySource) {
    return { success: false, entitiesCreated: 0, relationshipsCreated: 0, errors: [...errors, 'No sources available for fallback extraction.'] };
  }

  const fallbackEntities: ExtractedEntityCandidate[] = [
    {
      name: input.query.trim(),
      type: EntityType.CONCEPT,
      description: input.searchSummary || `Synthesized knowledge concept for ${input.query}`,
      sourceIndices: [0],
    }
  ];

  return await processAndPersistExtractedData({ entities: fallbackEntities, relationships: [] }, input.sources, errors, input.allowedSourceIds, input.maxNodes);
}

/**
 * Validates candidates, applies canonicalization, enforces multi-source evidence and graph limits,
 * and persists atomically via Prisma transactions.
 */
async function processAndPersistExtractedData(
  parsed: { entities?: ExtractedEntityCandidate[]; relationships?: ExtractedRelationshipCandidate[] },
  sources: ExtractionInput['sources'],
  errors: string[],
  allowedSourceIds?: Set<string>,
  maxNodes = GRAPH_LIMITS.MAX_NODES
): Promise<ExtractionResult> {
  const entityMap = new Map<string, string>(); // Key: deduplicationKey, Value: entityId
  let entitiesCreated = 0;
  let relationshipsCreated = 0;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Process Entities
      if (parsed.entities && Array.isArray(parsed.entities)) {
        for (const rawEnt of parsed.entities) {
          if (!rawEnt.name || !rawEnt.type) continue;
          if (entitiesCreated >= maxNodes) break;

          if (!Object.values(EntityType).includes(rawEnt.type)) {
            errors.push(`Rejected entity "${rawEnt.name}": invalid entity type "${rawEnt.type}".`);
            continue;
          }

          const rawName = rawEnt.name.trim();
          const canonicalName = canonicalizeEntityName(rawName) || rawName.toLowerCase();
          const dedupKey = getEntityDeduplicationKey(rawName, rawEnt.type);

          if (entityMap.has(dedupKey)) continue;

          // Upsert Entity
          const entity = await tx.entity.upsert({
            where: {
              name_type: {
                name: canonicalName,
                type: rawEnt.type,
              },
            },
            update: {
              description: rawEnt.description?.trim() || undefined,
            },
            create: {
              name: canonicalName,
              type: rawEnt.type,
              description: rawEnt.description?.trim() || null,
            },
          });

          entityMap.set(dedupKey, entity.id);
          entitiesCreated++;

          // Attach provenance sources
          const indices = rawEnt.sourceIndices || (rawEnt.sourceIndex !== undefined ? [rawEnt.sourceIndex] : []);
          for (const idx of indices) {
            const src = sources[idx];
            if (src && (await validateSourceAuthorization(src.id, allowedSourceIds))) {
              await tx.entitySource.upsert({
                where: {
                  entityId_sourceId: {
                    entityId: entity.id,
                    sourceId: src.id,
                  },
                },
                update: { evidence: rawEnt.description || null },
                create: {
                  entityId: entity.id,
                  sourceId: src.id,
                  evidence: rawEnt.description || null,
                },
              });
            }
          }
        }
      }

      // 2. Process Relationships
      if (parsed.relationships && Array.isArray(parsed.relationships)) {
        for (const rawRel of parsed.relationships) {
          if (!rawRel.entityAName || !rawRel.entityBName || !rawRel.type) continue;
          if (relationshipsCreated >= GRAPH_LIMITS.MAX_EDGES) break;

          const typeA = rawRel.entityAType || EntityType.CONCEPT;
          const typeB = rawRel.entityBType || EntityType.CONCEPT;

          const keyA = getEntityDeduplicationKey(rawRel.entityAName, typeA);
          const keyB = getEntityDeduplicationKey(rawRel.entityBName, typeB);

          let aId = entityMap.get(keyA);
          let bId = entityMap.get(keyB);

          // Find or create entity A if missing
          if (!aId) {
            const canonA = canonicalizeEntityName(rawRel.entityAName) || rawRel.entityAName.trim().toLowerCase();
            const entA = await tx.entity.upsert({
              where: { name_type: { name: canonA, type: typeA } },
              update: {},
              create: { name: canonA, type: typeA },
            });
            aId = entA.id;
            entityMap.set(keyA, aId);
          }

          // Find or create entity B if missing
          if (!bId) {
            const canonB = canonicalizeEntityName(rawRel.entityBName) || rawRel.entityBName.trim().toLowerCase();
            const entB = await tx.entity.upsert({
              where: { name_type: { name: canonB, type: typeB } },
              update: {},
              create: { name: canonB, type: typeB },
            });
            bId = entB.id;
            entityMap.set(keyB, bId);
          }

          if (aId === bId) continue; // No self-relations

          const relDef = getEntityRelationshipDefinition(rawRel.type);
          if (!relDef) {
            errors.push(`Rejected relationship type "${rawRel.type}": not in registry.`);
            continue;
          }

          const { aId: finalAId, bId: finalBId } = canonicalizeEndpoints(aId, bId, relDef.isDirected);

          // Validate and collect supporting source IDs
          const indices = rawRel.sourceIndices || (rawRel.sourceIndex !== undefined ? [rawRel.sourceIndex] : []);
          const validSourceIds: string[] = [];

          for (const idx of indices) {
            const src = sources[idx];
            if (src && (await validateSourceAuthorization(src.id, allowedSourceIds))) {
              validSourceIds.push(src.id);
            }
          }

          // REQUIREMENT 6 & 11: EVIDENCE-GROUNDED. No evidence = no relationship.
          if (validSourceIds.length === 0) {
            errors.push(`Rejected relationship between "${rawRel.entityAName}" and "${rawRel.entityBName}": missing valid supporting provenance source (evidence-grounding required).`);
            continue;
          }

          // Upsert EntityRelationship (using first sourceId for legacy compatibility)
          const relationship = await tx.entityRelationship.upsert({
            where: {
              entityAId_entityBId_type: {
                entityAId: finalAId,
                entityBId: finalBId,
                type: relDef.type,
              },
            },
            update: {
              description: rawRel.description?.trim() || undefined,
              sourceId: validSourceIds[0],
            },
            create: {
              entityAId: finalAId,
              entityBId: finalBId,
              type: relDef.type,
              description: rawRel.description?.trim() || null,
              sourceId: validSourceIds[0],
            },
          });

          // REQUIREMENT 1: Preserve MULTIPLE supporting sources in EntityRelationshipSource
          for (const sId of validSourceIds) {
            await tx.entityRelationshipSource.upsert({
              where: {
                relationshipId_sourceId: {
                  relationshipId: relationship.id,
                  sourceId: sId,
                },
              },
              update: {},
              create: {
                relationshipId: relationship.id,
                sourceId: sId,
              },
            });
          }

          relationshipsCreated++;
        }
      }
    });

    return {
      success: true,
      entitiesCreated,
      relationshipsCreated,
      errors,
    };
  } catch (txErr: any) {
    console.error('[Extraction] Transaction error:', txErr);
    return {
      success: false,
      entitiesCreated: 0,
      relationshipsCreated: 0,
      errors: [...errors, `Database transaction error: ${txErr.message}`],
    };
  }
}
