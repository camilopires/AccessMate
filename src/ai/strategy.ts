export interface AiPolishInput {
  scenarioId: string;
  narrativeText: string;
  profileExcerpt?: string;
}

export interface AiPolishDeps {
  tryAppleFm: (input: AiPolishInput) => Promise<string | null>;
  tryCloud: (input: AiPolishInput) => Promise<string | null>;
}

export type AiProviderId = 'apple-fm' | 'cloud' | 'none';

export interface AiPolishResult {
  provider: AiProviderId;
  polished: string | null;
}

const ORDER: { id: Exclude<AiProviderId, 'none'>; key: keyof AiPolishDeps }[] = [
  { id: 'apple-fm', key: 'tryAppleFm' },
  { id: 'cloud', key: 'tryCloud' },
];

export async function aiPolish(input: AiPolishInput, deps: AiPolishDeps): Promise<AiPolishResult> {
  for (const step of ORDER) {
    try {
      const text = await deps[step.key](input);
      if (text != null && text.length > 0) {
        return { provider: step.id, polished: text };
      }
    } catch {
      // Try the next adapter.
    }
  }
  return { provider: 'none', polished: null };
}
