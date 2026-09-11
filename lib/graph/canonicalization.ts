/**
 * ============================================================================
 * Knowledge Graph 2.0 Entity Canonicalization & Deduplication (`lib/graph/canonicalization.ts`)
 * ============================================================================
 *
 * Normalizes entity names to handle variants like "OpenAI", "OpenAI Inc.", and "OpenAI, Inc."
 * while avoiding unsafe merges of genuinely different entities.
 */

import { EntityType } from '@prisma/client';

/**
 * Normalizes an entity name by trimming, lowercasing, stripping common corporate suffixes,
 * and removing extra punctuation.
 */
export function canonicalizeEntityName(name: string): string {
  if (!name || typeof name !== 'string') return '';

  let cleaned = name.trim().toLowerCase();

  // Strip common corporate / legal suffixes
  const suffixes = [
    ', inc.',
    ' inc.',
    ', inc',
    ' inc',
    ', llc',
    ' llc',
    ', corp.',
    ' corp.',
    ', corp',
    ' corp',
    ', corporation',
    ' corporation',
    ', co.',
    ' co.',
    ', co',
    ' co',
    ', ltd.',
    ' ltd.',
    ', ltd',
    ' ltd',
  ];

  for (const suffix of suffixes) {
    if (cleaned.endsWith(suffix)) {
      cleaned = cleaned.slice(0, cleaned.length - suffix.length).trim();
      break;
    }
  }

  // Strip punctuation and special characters except internal hyphens and alphanumeric characters
  cleaned = cleaned.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Generates a unique deduplication key for an entity based on its canonicalized name and type.
 * Genuinely different entities (e.g. Apple as Organization vs Apple as Place/Food)
 * remain distinct because their EntityType differs.
 */
export function getEntityDeduplicationKey(name: string, type: EntityType): string {
  const canonicalName = canonicalizeEntityName(name) || name.trim().toLowerCase();
  return `${canonicalName}:${type}`;
}
