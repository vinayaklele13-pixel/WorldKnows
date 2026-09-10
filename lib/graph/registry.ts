/**
 * ============================================================================
 * Phase 7 Relationship Registry (`lib/graph/registry.ts`)
 * ============================================================================
 *
 * Defines supported relationship types and whether they are directed or symmetric.
 */

export interface RelationshipTypeDefinition {
  type: string;
  isDirected: boolean;
  description: string;
}

export const ENTITY_RELATIONSHIP_TYPES: Record<string, RelationshipTypeDefinition> = {
  ASSOCIATED_WITH: { type: 'ASSOCIATED_WITH', isDirected: false, description: 'General association between entities' },
  PART_OF: { type: 'PART_OF', isDirected: true, description: 'Component or subset relationship' },
  FOUNDER_OF: { type: 'FOUNDER_OF', isDirected: true, description: 'Person founded organization' },
  CEO_OF: { type: 'CEO_OF', isDirected: true, description: 'Person is CEO of organization' },
  EMPLOYED_BY: { type: 'EMPLOYED_BY', isDirected: true, description: 'Person works for organization' },
  ACQUIRED: { type: 'ACQUIRED', isDirected: true, description: 'Organization acquired organization/technology' },
  INVESTED_IN: { type: 'INVESTED_IN', isDirected: true, description: 'Entity invested in organization' },
  PARTICIPATED_IN: { type: 'PARTICIPATED_IN', isDirected: true, description: 'Entity participated in an event' },
  LOCATED_IN: { type: 'LOCATED_IN', isDirected: true, description: 'Entity/Place located in place' },
  SUCCESSOR_OF: { type: 'SUCCESSOR_OF', isDirected: true, description: 'Entity succeeded another entity' },
  COLLABORATES_WITH: { type: 'COLLABORATES_WITH', isDirected: false, description: 'Collaborative partnership' },
  COMPETES_WITH: { type: 'COMPETES_WITH', isDirected: false, description: 'Market or domain competitors' },
};

export const TOPIC_RELATIONSHIP_TYPES: Record<string, RelationshipTypeDefinition> = {
  RELATED_TO: { type: 'RELATED_TO', isDirected: false, description: 'General relationship between topics' },
  SUBTOPIC_OF: { type: 'SUBTOPIC_OF', isDirected: true, description: 'Topic is a subtopic of another topic' },
  PREREQUISITE_OF: { type: 'PREREQUISITE_OF', isDirected: true, description: 'Topic is a prerequisite for another topic' },
  CONTRASTS_WITH: { type: 'CONTRASTS_WITH', isDirected: false, description: 'Contrasting or opposing topics' },
  EXTENDS: { type: 'EXTENDS', isDirected: true, description: 'Topic extends another topic' },
};

export function getEntityRelationshipDefinition(type: string): RelationshipTypeDefinition | null {
  return ENTITY_RELATIONSHIP_TYPES[type.toUpperCase()] || null;
}

export function getTopicRelationshipDefinition(type: string): RelationshipTypeDefinition | null {
  return TOPIC_RELATIONSHIP_TYPES[type.toUpperCase()] || null;
}

/**
 * Canonicalizes endpoint IDs for symmetric (undirected) relationships.
 * Ensures entityAId < entityBId lexically so (A, B) and (B, A) result in the exact same edge representation.
 */
export function canonicalizeEndpoints(id1: string, id2: string, isDirected: boolean): { aId: string; bId: string } {
  if (isDirected) {
    return { aId: id1, bId: id2 };
  }
  return id1 < id2 ? { aId: id1, bId: id2 } : { aId: id2, bId: id1 };
}
