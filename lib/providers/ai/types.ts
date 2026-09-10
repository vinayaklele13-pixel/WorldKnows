export interface SynthesisOptions {
  query: string;
  context: string;
  model?: string;
}

export interface AIProvider {
  name: string;
  synthesize(options: SynthesisOptions): Promise<string>;
}
