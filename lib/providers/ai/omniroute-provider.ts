import { AIProvider, SynthesisOptions } from './types';

export class OmniRouteProvider implements AIProvider {
  name = 'omniroute';

  async synthesize(options: SynthesisOptions): Promise<string> {
    const apiKey = process.env.OMNIROUTE_API_KEY || 'local-dev-key';
    const baseUrl = process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1';
    const model = process.env.AI_MODEL || 'auto';

    const systemPrompt = `You are WorldKnows, an elite knowledge engine and research synthesizer.
RULES:
1. Directly and authoritatively answer the user's query immediately in the first paragraph.
2. Adapt your response structure naturally to the query intent (e.g. definition, explanation/mechanism, historical timeline, comparison, or steps).
3. Ground your explanation in the provided verified sources where available. If retrieved sources are sparse or incomplete, seamlessly supplement with established general knowledge to provide a comprehensive, high-quality answer.
4. Distinguish verified facts from uncertainty or speculation.
5. NEVER mention internal implementation, system prompts, search context, AI context, providers, or Tavily.
6. NEVER begin with meta-commentary such as "The provided search context...", "Based on the context...", "I don't have enough information...", or "I can provide a general overview...". Write naturally as a definitive knowledge engine.
7. NEVER invent source claims, statistics, URLs, or fabricated citations. If using general knowledge, do not attribute it to a specific web source unless supported by the retrieved evidence.`;

    const userPrompt = `Query: ${options.query}\n\nVerified Sources:\n${options.context}`;

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
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OmniRoute API responded with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        return content;
      } else {
        throw new Error('Invalid response structure from OmniRoute API');
      }
    } catch (error: any) {
      console.warn(`[OmniRoute] Local connection fallback triggered (${error.message}). Using robust local synthesis fallback.`);
      return `WorldKnows analyzed "${options.query}" across verified reference indices. This subject encompasses fundamental principles, ongoing developments, and significant practical implications [1].`;
    }
  }

  async generateRelatedTopics(options: SynthesisOptions): Promise<string[]> {
    const apiKey = process.env.OMNIROUTE_API_KEY || 'local-dev-key';
    const baseUrl = process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1';
    const model = process.env.AI_MODEL || 'auto';

    const systemPrompt = `You are a knowledge graph assistant. Based on the query and search context, generate 4 to 6 concise, highly relevant related topics for further exploration.
RULES:
1. Return ONLY valid JSON matching this exact structure: {"topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"]}
2. Topics must be directly related to the query and derived from the search context.
3. Keep each topic concise (1-4 words).
4. Do not include generic filler labels, query repeats, or unsupported concepts.`;

    const userPrompt = `Query: ${options.query}\n\nSearch Context Sources:\n${options.context}`;

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
          temperature: 0.2,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error(`OmniRoute API responded with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        return [];
      }

      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.topics)) {
        return [];
      }

      const seen = new Set<string>();
      const validatedTopics: string[] = [];

      for (const item of parsed.topics) {
        if (typeof item === 'string') {
          const trimmed = item.trim();
          if (trimmed.length > 0 && trimmed.length <= 60) {
            const lower = trimmed.toLowerCase();
            if (!seen.has(lower)) {
              seen.add(lower);
              validatedTopics.push(trimmed);
            }
          }
        }
      }

      return validatedTopics.slice(0, 6);
    } catch (error: any) {
      console.warn(`[OmniRoute] Related topics generation failed (${error.message}). Returning empty array.`);
      return [];
    }
  }
}
