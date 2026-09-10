import { AIProvider } from './types';
import { OmniRouteProvider } from './omniroute-provider';

export function getAIProvider(): AIProvider {
  const providerType = process.env.AI_PROVIDER || 'omniroute';

  switch (providerType.toLowerCase()) {
    case 'omniroute':
    default:
      return new OmniRouteProvider();
  }
}

export * from './types';
