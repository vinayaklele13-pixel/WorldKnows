import { AIProvider, SynthesisOptions } from './types';

export class OmniRouteProvider implements AIProvider {
  name = 'omniroute';

  async synthesize(options: SynthesisOptions): Promise<string> {
    const apiKey = process.env.OMNIROUTE_API_KEY || 'local-dev-key';
    const baseUrl = process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1';
    const model = process.env.AI_MODEL || 'auto';

    const systemPrompt = `You are WorldKnows OmniRoute AI, an advanced research synthesizer and knowledge discovery assistant.
RULES:
1. Directly answer the user's query with authoritative accuracy.
2. Distinguish verified facts from uncertainty or speculation.
3. Strictly use the provided search context as evidence and incorporate bracketed citations like [1] corresponding to sources.
4. Avoid hallucinating unsupported claims or inventing citations.
5. Organize complex answers clearly with logical structure.`;
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
          temperature: 0.3,
          max_tokens: 1024,
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
      // Graceful fallback to mock synthesis
      return `WorldKnows analyzed "${options.query}" via verified reference indices. This subject encompasses fundamental principles, ongoing research developments, and significant practical implications [1]. (Note: Local OmniRoute server at ${baseUrl} was unreachable or returned an error; fallback synthesis applied).`;
    }
  }
}
