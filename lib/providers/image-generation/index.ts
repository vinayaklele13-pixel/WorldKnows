import { ImageGenerationProvider } from './types';
import { OpenAIImageGenerationProvider } from './openai-image-provider';
import { MockImageGenerationProvider } from './mock-image-provider';

export function getImageGenerationProvider(): ImageGenerationProvider {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIImageGenerationProvider();
  }
  return new MockImageGenerationProvider();
}
