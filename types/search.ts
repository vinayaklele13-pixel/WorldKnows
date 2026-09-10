export interface Source {
  id: string;
  title: string;
  domain: string;
  url: string;
  publisher: string;
  sourceType: 'GOVERNMENT' | 'ACADEMIC' | 'JOURNALISM' | 'REFERENCE';
  reliabilityScore: number;
  excerpt: string;
}

export interface KeyFact {
  label: string;
  value: string;
}

export interface SearchResultData {
  query: string;
  normalizedQuery: string;
  intent: 'DEFINITION' | 'HISTORICAL' | 'SCIENTIFIC' | 'COMPARISON';
  quickAnswer: string;
  keyFacts: KeyFact[];
  detailedSections: {
    title: string;
    content: string;
  }[];
  sources: Source[];
  relatedTopics: string[];
  isMock: boolean;
}
