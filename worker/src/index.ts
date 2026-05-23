/**
 * AccessMate cloud AI proxy.
 *
 * - Single endpoint: POST /polish
 * - Validates payload with Zod
 * - Redacts staff names defensively (the canonical mask happens client-side)
 * - Calls Anthropic with a system prompt that forbids legal citations and
 *   constrains the model to the narrative region
 * - Validates the response (no rogue citations, length cap, JSON-clean)
 * - Rate-limits anonymous callers via KV
 *
 * Deploy: this is a Cloudflare Worker. Run `wrangler deploy` from the
 * worker/ directory. Required secrets: ANTHROPIC_API_KEY. Required
 * bindings: RATE_KV (KV namespace).
 */
import { Hono } from 'hono';
import { z } from 'zod';

const PolishRequest = z.object({
  scenarioId: z.string().min(1).max(64),
  narrativeText: z.string().min(1).max(4000),
  profileExcerpt: z.string().max(1000).optional(),
});

const ALLOWED_CITATIONS = /\b(equality act|atp|orr|caa|ehrc|tfl|psvar|eu 1107)\b/i;
const BANNED_CITATION_REGEX = /\b(article|section|s\.?\s*\d+|§|Civil Procedure Rules|HMCTS)\b/i;

interface Env {
  ANTHROPIC_API_KEY?: string;
  RATE_KV?: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.post('/polish', async (c) => {
  const raw = await c.req.json().catch(() => null);
  const parsed = PolishRequest.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'invalid_request', details: parsed.error.format() }, 400);
  }

  // Rate limit per IP (anonymous, generous-but-bounded).
  if (c.env.RATE_KV) {
    const ip = c.req.header('cf-connecting-ip') ?? 'unknown';
    const key = `rl:${ip}:${new Date().toISOString().slice(0, 13)}`;
    const count = parseInt((await c.env.RATE_KV.get(key)) ?? '0', 10);
    if (count > 20) return c.json({ error: 'rate_limited' }, 429);
    await c.env.RATE_KV.put(key, String(count + 1), { expirationTtl: 3700 });
  }

  if (!c.env.ANTHROPIC_API_KEY) {
    return c.json({ error: 'not_configured' }, 503);
  }

  const { scenarioId, narrativeText, profileExcerpt } = parsed.data;

  // Defensive redaction (client-side does the canonical mask).
  const safeNarrative = narrativeText.replace(
    /\b(conductor|driver|officer|attendant|agent|staff(?:\s+member)?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
    '$1 [name]',
  );

  const system = [
    `You polish a complaint narrative for clarity and tone.`,
    `Do NOT add legal citations beyond what is already in the user message.`,
    `Do NOT invent statute numbers or case law.`,
    `Stay within ${narrativeText.length + 300} characters of output.`,
    `Return only the polished narrative — no preamble, no Markdown headings.`,
  ].join(' ');

  const userMessage = [
    `Scenario: ${scenarioId}`,
    profileExcerpt ? `User context: ${profileExcerpt}` : '',
    `Narrative to polish: ${safeNarrative}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': c.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!resp.ok) {
    return c.json({ error: 'upstream_error', status: resp.status }, 502);
  }

  type AnthropicResponse = { content?: { type: string; text?: string }[] };
  const body = (await resp.json()) as AnthropicResponse;
  const polished = body?.content?.find((p) => p.type === 'text')?.text ?? '';

  if (polished.length > narrativeText.length + 800) {
    return c.json({ error: 'output_too_long' }, 502);
  }
  if (BANNED_CITATION_REGEX.test(polished) && !ALLOWED_CITATIONS.test(polished)) {
    return c.json({ error: 'output_has_rogue_citations' }, 502);
  }

  return c.json({ polished });
});

export default app;

// Local types so this file doesn't require @cloudflare/workers-types installed
// in the app's tsconfig project; the worker has its own tsconfig.
type KVNamespace = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};
