/** SEIL-enforced funnel shape; AI only fills these four string slots. */
export type MarketingFunnelResult = {
  awareness: string;
  engagement: string;
  conversion: string;
  retention: string;
};

const KEYS = ['awareness', 'engagement', 'conversion', 'retention'] as const;

export function parseMarketingFunnelResult(raw: unknown): MarketingFunnelResult {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('AI JSON root must be an object');
  }
  const o = raw as Record<string, unknown>;
  const out: Partial<MarketingFunnelResult> = {};
  for (const k of KEYS) {
    const v = o[k];
    if (typeof v !== 'string' || !v.trim()) {
      throw new Error(`AI JSON missing or invalid string field: ${k}`);
    }
    out[k] = v.trim();
  }
  return out as MarketingFunnelResult;
}
