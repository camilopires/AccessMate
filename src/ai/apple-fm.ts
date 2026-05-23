import type { AppleFmNativeModule } from '../../modules/apple-fm/src/AppleFm.types';

export interface PolishInput {
  scenarioId: string;
  narrativeText: string;
  profileExcerpt?: string;
}

export interface PolishDeps {
  module: AppleFmNativeModule;
}

export function buildSystemPrompt(input: PolishInput): string {
  return [
    'You polish a complaint narrative for clarity and tone.',
    'Do not add or invent legal citations beyond what is already in the user message.',
    'Do not invent statute numbers or case law.',
    `Keep the output within ${input.narrativeText.length + 300} characters.`,
    'Return only the polished narrative — no preamble, no Markdown headings.',
  ].join(' ');
}

function buildUserPrompt(input: PolishInput): string {
  const lines: string[] = [`Scenario: ${input.scenarioId}`];
  if (input.profileExcerpt) lines.push(`User context: ${input.profileExcerpt}`);
  lines.push(`Narrative to polish: ${input.narrativeText}`);
  return lines.join('\n\n');
}

export async function polishViaAppleFm(
  input: PolishInput,
  deps: PolishDeps,
): Promise<string | null> {
  try {
    const available = await deps.module.isAvailable();
    if (!available) return null;
    const sys = buildSystemPrompt(input);
    const prompt = buildUserPrompt(input);
    return await deps.module.polish(prompt, sys);
  } catch {
    return null;
  }
}
