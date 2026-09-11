import { BaseImageGenerationProvider } from './image-generation-provider';
import { ImageGenerationOptions, ImageGenerationResult } from './types';

export class OpenAIImageGenerationProvider extends BaseImageGenerationProvider {
  name = 'openai-dall-e';

  async generate(options: ImageGenerationOptions): Promise<ImageGenerationResult[]> {
    const prompt = this.validatePrompt(options.prompt);
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.IMAGE_GENERATION_MODEL || 'dall-e-3';

    if (!apiKey) {
      throw new Error('OpenAI API key is not configured.');
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: options.n || 1,
        size: options.size || '1024x1024',
        quality: options.quality || 'standard',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();

    return data.data.map((item: any) => ({
      id: `ai-img-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      url: item.url,
      revisedPrompt: item.revised_prompt,
      isMock: false,
      provider: this.name,
      createdAt: new Date().toISOString(),
    }));
  }
}
