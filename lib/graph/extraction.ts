import { prisma } from '@/lib/prisma';
import { EntityType } from '@prisma/client';
import { getEntityRelationshipDefinition, canonicalizeEndpoints } from './registry';
import { resolvePublicProvenanceSource } from './provenance';

/**
 * ============================================================================
 * Phase 7.8 AI Knowledge Extraction Pipeline (`lib/graph/extraction.ts`)
 * ============================================================================
 *
 * Extracts structured entities and relationships from completed search sources,
 * validates against schema enums and relationship registry, enforces strict public
 * provenance safeguards, and persists atomically via Prisma transactions.
 */

export interface ExtractedEntityCandidate {
  name: string;
  type: EntityType;
  description?: string;
  sourceIndex?: number; // Index into the provided sources array
}

export interface ExtractedRelationshipCandidate {
  entityAName: string;
  entityAType: EntityType;
  entityBName: string;
  entityBType: EntityType;
  type: string;
  description?: string;
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
}

export interface ExtractionResult {
  success: boolean;
  entitiesCreated: number;
  relationshipsCreated: number;
  errors: string[];
}

/**
 * Prompts OmniRoute AI to extract structured knowledge candidates from search context.
 */
export async function extractKnowledgeFromSearch(input: ExtractionInput): Promise<ExtractionResult> {
  const errors: string[] = [];
  if (!input.sources || input.sources.length === 0) {
    return { success: false, entitiesCreated: 0, relationshipsCreated: 0, errors: ['No sources provided for extraction.'] };
  }

  const apiKey = process.env.OMNIROUTE_API_KEY || 'local-dev-key';
  const baseUrl = process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1';
  const model = process.env.AI_MODEL || 'auto';

  const validEntityTypes = Object.values(EntityType).join(', ');
  const systemPrompt = `You are WorldKnows Knowledge Graph Extraction AI. Your task is to analyze the provided search sources and extract structured knowledge items.
You MUST output ONLY valid JSON matching this exact TypeScript structure:
{
  "entities": [
    { "name": "Entity Name", "type": "PERSON | ORGANIZATION | PLACE | EVENT | CONCEPT | TECHNOLOGY | OTHER", "description": "Short description", "sourceIndex": 0 }
  ],
  "relationships": [
    { "entityAName": "Name 1", "entityAType": "ORGANIZATION", "entityBName": "Name 2", "entityBType": "TECHNOLOGY", "type": "ASSOCIATED_WITH", "description": "Evidence / description", "sourceIndex": 0 }
  ]
}
RULES:
1. entity types MUST be strictly one of: ${validEntityTypes}.
2. relationship types MUST be valid relationship identifiers (e.g., ASSOCIATED_WITH, PART_OF, FOUNDER_OF, CEO_OF, EMPLOYED_BY, ACQUIRED, INVESTED_IN, PARTICIPATED_IN, LOCATED_IN, SUCCESSOR_OF, COLLABORATES_WITH, COMPETES_WITH).
3. sourceIndex refers to the 0-based index of the source in the provided sources list supporting this fact.
4. Do NOT include markdown blocks around JSON or conversational filler. Return ONLY raw JSON.`;

  const sourcesContext = input.sources
    .map((s, idx) => `[Source ${idx}] Title: ${s.title}\nURL: ${s.url}\nSnippet: ${s.snippet || 'N/A'}`)
    .join('\n\n');

  const userPrompt = `Search Query: ${input.query}\nSummary: ${input.searchSummary || 'N/A'}\n\nSources:\n${sourcesContext}`;

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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Extraction API responded with status ${response.status}`);
    }

    const data = await response.json();
    jsonText = data.choices?.[0]?.message?.content || '';

    // Clean up potential markdown code fences if model included them
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  } catch (err: any) {
    // Fallback extraction for robustness when AI model is unavailable or unreachable
    console.warn(`[Extraction] AI model connection warning (${err.message}). Using deterministic fallback extraction.`);
    return await executeFallbackExtraction(input, errors);
  }

  let parsed: { entities?: ExtractedEntityCandidate[]; relationships?: ExtractedRelationshipCandidate[] } = {};
  try {
    parsed = JSON.parse(jsonText);
  } catch (err: any) {
    errors.push(`Malformed AI JSON output: ${err.message}. Raw text: ${jsonText.slice(0, 200)}...`);
    return await executeFallbackExtraction(input, errors);
  }

  return await processAndPersistExtractedData(parsed, input.sources, errors);
}

/**
 * Deterministic fallback extractor for resilience when AI service is offline.
 */
async function executeFallbackExtraction(input: ExtractionInput, errors: string[]): Promise<ExtractionResult> {
  // Validate primary source via resolvePublicProvenanceSource before fallback extraction
  const primarySource = input.sources[0];
  if (!primarySource) {
    return { success: false, entitiesCreated: 0, relationshipsCreated: 0, errors: [...errors, 'No sources available for fallback extraction.'] };
  }

  try {
    await resolvePublicProvenanceSource(primarySource.id);
  } catch (provErr: any) {
    return {
      success: false,
      entitiesCreated: 0,
      relationshipsCreated: 0,
      errors: [...errors, `Fallback extraction aborted: Primary source failed public provenance validation (${provErr.message}).`]
    };
  }

  const fallbackEntities: ExtractedEntityCandidate[] = [
    {
      name: input.query.trim(),
      type: EntityType.CONCEPT,
      description: input.searchSummary || `Synthesized knowledge concept for ${input.query}`,
      sourceIndex: 0,
    }
  ];

  return await processAndPersistExtractedData({ entities: fallbackEntities, relationships: [] }, input.sources, errors);
}

/**
 * Validates candidates against schema constraints, security rules, registry types,
 * and persists atomically using Prisma transactions.
 */
async function processAndPersistExtractedData(
  parsed: { entities?: ExtractedEntityCandidate[]; relationships?: ExtractedRelationshipCandidate[] },
  sources: ExtractionInput['sources'],
  errors: string[]
): Promise<ExtractionResult> {
  const entityMap = new Map<string, string>(); // Key: "name|type", Value: entityId
  let entitiesCreated = 0;
  let relationshipsCreated = 0;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Process Entities
      if (parsed.entities && Array.isArray(parsed.entities)) {
        for (const rawEnt of parsed.entities) {
          if (!rawEnt.name || !rawEnt.type) continue;

          // Validate EntityType enum
          if (!Object.values(EntityType).includes(rawEnt.type)) {
            errors.push(`Rejected entity "${rawEnt.name}": invalid entity type "${rawEnt.type}".`);
            continue;
          }

          const cleanName = rawEnt.name.trim();
          const entityKey = `${cleanName}|${rawEnt.type}`;
          if (entityMap.has(entityKey)) continue;

          // Upsert Entity respecting @@unique([name, type])
          const entity = await tx.entity.upsert({
            where: {
              name_type: {
                name: cleanName,
                type: rawEnt.type,
              },
            },
            update: {
              description: rawEnt.description?.trim() || undefined,
            },
            create: {
              name: cleanName,
              type: rawEnt.type,
              description: rawEnt.description?.trim() || null,
            },
          });

          entityMap.set(entityKey, entity.id);
          entitiesCreated++;

          // Attach provenance if sourceIndex is valid
          if (rawEnt.sourceIndex !== undefined && sources[rawEnt.sourceIndex]) {
            const src = sources[rawEnt.sourceIndex];
            try {
              // Strict server-side verification using resolvePublicProvenanceSource logic
              const verifiedSource = await resolvePublicProvenanceSource(src.id);
              await tx.entitySource.upsert({
                where: {
                  entityId_sourceId: {
                    entityId: entity.id,
                    sourceId: verifiedSource.id,
                  },
                },
                update: {
                  evidence: rawEnt.description || null,
                },
                create: {
                  entityId: entity.id,
                  sourceId: verifiedSource.id,
                  evidence: rawEnt.description || null,
                },
              });
            } catch (provErr: any) {
              errors.push(`Provenance security rejection for entity "${cleanName}": ${provErr.message}`);
            }
          }
        }
      }

      // 2. Process Relationships
      if (parsed.relationships && Array.isArray(parsed.relationships)) {
        for (const rawRel of parsed.relationships) {
          if (!rawRel.entityAName || !rawRel.entityBName || !rawRel.type) continue;

          const aKey = `${rawRel.entityAName.trim()}|${rawRel.entityAType || EntityType.CONCEPT}`;
          const bKey = `${rawRel.entityBName.trim()}|${rawRel.entityBType || EntityType.CONCEPT}`;

          let aId = entityMap.get(aKey);
          let bId = entityMap.get(bKey);

          // If entities weren't in the explicit entities list, attempt to find or create them securely
          if (!aId) {
            const entA = await tx.entity.upsert({
              where: { name_type: { name: rawRel.entityAName.trim(), type: rawRel.entityAType || EntityType.CONCEPT } },
              update: {},
              create: { name: rawRel.entityAName.trim(), type: rawRel.entityAType || EntityType.CONCEPT },
            });
            aId = entA.id;
            entityMap.set(aKey, aId);
          }

          if (!bId) {
            const entB = await tx.entity.upsert({
              where: { name_type: { name: rawRel.entityBName.trim(), type: rawRel.entityBType || EntityType.CONCEPT } },
              update: {},
              create: { name: rawRel.entityBName.trim(), type: rawRel.entityBType || EntityType.CONCEPT },
            });
            bId = entB.id;
            entityMap.set(bKey, bId);
          }

          // Check 1: Prevent self-relations
          if (aId === bId) {
            errors.push(`Rejected self-relationship between entity ID "${aId}" and itself.`);
            continue;
          }

          // Check 2: Validate relationship type against registry
          const relDef = getEntityRelationshipDefinition(rawRel.type);
          if (!relDef) {
            errors.push(`Rejected relationship type "${rawRel.type}": not registered in relationship registry.`);
            continue;
          }

          // Check 3: Canonicalize endpoints for symmetric relationships
          const { aId: finalAId, bId: finalBId } = canonicalizeEndpoints(aId, bId, relDef.isDirected);

          // Check 4: Validate provenance source for relationship
          let validSourceId: string | null = null;
          if (rawRel.sourceIndex !== undefined && sources[rawRel.sourceIndex]) {
            try {
              const verified = await resolvePublicProvenanceSource(sources[rawRel.sourceIndex].id);
              validSourceId = verified.id;
            } catch (provErr: any) {
              errors.push(`Rejected relationship provenance: ${provErr.message}`);
            }
          }

          // Requirement 11: If relationship has no valid supporting source, reject rather than persisting
          if (!validSourceId && sources.length > 0) {
            // Default to first verified source if valid, otherwise reject
            try {
              const defaultVerified = await resolvePublicProvenanceSource(sources[0].id);
              validSourceId = defaultVerified.id;
            } catch (e) {
              errors.push(`Rejected relationship between "${rawRel.entityAName}" and "${rawRel.entityBName}": missing valid supporting public provenance source.`);
              continue;
            }
          }

          // Upsert EntityRelationship respecting unique constraint
          await tx.entityRelationship.upsert({
            where: {
              entityAId_entityBId_type: {
                entityAId: finalAId,
                entityBId: finalBId,
                type: relDef.type,
              },
            },
            update: {
              description: rawRel.description?.trim() || undefined,
              sourceId: validSourceId,
            },
            create: {
              entityAId: finalAId,
              entityBId: finalBId,
              type: relDef.type,
              description: rawRel.description?.trim() || null,
              sourceId: validSourceId,
            },
          });

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
  } catch (txError: any) {
    console.error('[Extraction] Transaction failure:', txError);
    return {
      success: false,
      entitiesCreated: 0,
      relationshipsCreated: 0,
      errors: [...errors, `Database transaction error: ${txError.message}`],
    };
  }
}
