import { getAIProvider } from '@/lib/providers/ai';
import { getSearchProvider } from '@/lib/providers/search';
import { ResearchReport, ResearchSource } from './types';

export class DeepResearchOrchestrator {
  private aiProvider = getAIProvider();
  private searchProvider = getSearchProvider();

  async research(prompt: string): Promise<ResearchReport> {
    // 1. Planning: Generate sub-questions
    const planPrompt = `Analyze the following research query: "${prompt}".
Break this down into 3-5 focused research sub-questions to cover all key aspects.
Return ONLY a JSON array of strings.`;

    const planRaw = await this.aiProvider.synthesize({
      query: planPrompt,
      context: 'Research planning phase.'
    });

    let subQuestions: string[] = [];
    try {
      subQuestions = JSON.parse(planRaw);
    } catch {
      subQuestions = [prompt];
    }

    // 2. Search: Execute concurrent searches
    const searchResults = await Promise.all(
      subQuestions.map(q => this.searchProvider.search({ query: q, limit: 3 }))
    );

    // 3. Synthesis: Generate report
    const sources: ResearchSource[] = searchResults.flatMap(r => r.sources).map((s: any, idx) => ({
        id: `s-${idx}`,
        title: s.title,
        url: s.url,
        domain: s.domain,
        excerpt: s.excerpt || ''
    }));

    // VALIDATION: Build validated context map for citation anchoring
    const sourceMap = new Map(sources.map(s => [s.id, s]));
    const context = sources.map(s => `[${s.id}] ${s.title} (${s.domain}): ${s.excerpt}`).join('\n\n');

    const report = await this.aiProvider.synthesize({
      query: `Synthesize a comprehensive research report for: "${prompt}".
Use the following sources to build the report. Incorporate bracketed citations like [s-0], [s-1] where appropriate.
RULES:
1. DO NOT invent facts or sources.
2. ONLY use the provided sources.
3. If a citation [s-x] is used, it MUST map to one of the provided IDs.
4. If synthesis relies on an invalid source or invented info, exclude that section.

Context:
${context}`,
      context: context
    });

    // Post-Synthesis Citation Validation
    // Remove citations that do not exist in the source map
    const validatedReport = report.replace(/\[s-(\d+)\]/g, (match, id) => {
        const sourceId = `s-${id}`;
        return sourceMap.has(sourceId) ? match : '';
    });

    return {
      title: `Research Report: ${prompt.substring(0, 50)}`,
      report: validatedReport,
      sources
    };
  }
}
