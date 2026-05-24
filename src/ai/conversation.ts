import type { AiProvider } from '../settings/store';

export type ReportFlow = 'conversational' | 'template';

export interface ChooseFlowDeps {
  platform: 'ios' | 'android' | 'web' | 'macos' | 'windows';
  aiProvider: AiProvider;
  isAppleFmAvailable: () => Promise<boolean>;
}

/**
 * Decides whether the Report modal should run as a conversational AI
 * intake or fall back to the structured 4-step template form. Pure
 * function over injected deps so it tests cleanly and the UI doesn't
 * have to know about Platform or the native module shape.
 */
export async function chooseFlow(deps: ChooseFlowDeps): Promise<ReportFlow> {
  if (deps.platform !== 'ios') return 'template';
  if (deps.aiProvider === 'off') return 'template';
  try {
    if (!(await deps.isAppleFmAvailable())) return 'template';
  } catch {
    return 'template';
  }
  return 'conversational';
}
