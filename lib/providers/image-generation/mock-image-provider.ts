import { BaseImageGenerationProvider } from './image-generation-provider';
import { ImageGenerationOptions, ImageGenerationResult } from './types';

export class MockImageGenerationProvider extends BaseImageGenerationProvider {
  name = 'development-mock';

  async generate(options: ImageGenerationOptions): Promise<ImageGenerationResult[]> {
    this.validatePrompt(options.prompt);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return [
      {
        id: `mock-img-${Date.now()}`,
        url: 'https://placeholder.svg?text=DEVELOPMENT+MOCK+(AI)',
        isMock: true,
        provider: this.name,
        createdAt: new Date().toISOString(),
      },
    ];
  }
}
