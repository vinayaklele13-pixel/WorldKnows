export interface ResearchOrchestrator {
  research(prompt: string): Promise<ResearchReport>;
}

export interface ResearchReport {
  title: string;
  report: string;
  sources: ResearchSource[];
}

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  domain: string;
  excerpt: string;
}
