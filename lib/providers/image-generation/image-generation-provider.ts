import { ImageGenerationProvider, ImageGenerationOptions, ImageGenerationResult } from './types';

export abstract class BaseImageGenerationProvider implements ImageGenerationProvider {
  abstract name: string;
  abstract generate(options: ImageGenerationOptions): Promise<ImageGenerationResult[]>;

  protected validatePrompt(prompt: string): string {
    if (!prompt || prompt.trim().length < 3) {
      throw new Error('Prompt is too short. Please provide a more descriptive prompt.');
    }
    if (prompt.length > 1000) {
      throw new Error('Prompt is too long. Please shorten it.');
    }
    return prompt.trim();
  }
}
