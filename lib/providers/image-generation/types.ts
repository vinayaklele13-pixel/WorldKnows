export interface ImageGenerationOptions {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024';
  quality?: 'standard' | 'hd';
  n?: number;
}

export interface ImageGenerationResult {
  id: string;
  url: string;
  revisedPrompt?: string;
  isMock: boolean;
  provider: string;
  createdAt: string;
}

export interface ImageGenerationProvider {
  name: string;
  generate(options: ImageGenerationOptions): Promise<ImageGenerationResult[]>;
}
