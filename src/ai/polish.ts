export interface PolishViaCloudInput {
  endpoint: string;
  scenarioId: string;
  narrativeText: string;
  profileExcerpt?: string;
  signal?: AbortSignal;
}

export async function polishViaCloud(input: PolishViaCloudInput): Promise<string | null> {
  if (!input.endpoint) return null;
  try {
    const resp = await fetch(input.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        scenarioId: input.scenarioId,
        narrativeText: input.narrativeText,
        profileExcerpt: input.profileExcerpt,
      }),
      signal: input.signal,
    });
    if (!resp.ok) return null;
    const body = (await resp.json()) as { polished?: string };
    return body.polished ?? null;
  } catch {
    return null;
  }
}
