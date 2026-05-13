import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MarketingFunnelResult,
  parseMarketingFunnelResult,
} from './types/marketing-funnel-result';

const SYSTEM_PROMPT = `You are an assistant for SEIL, a guided marketing strategy product for small businesses in Sub-Saharan Africa.
The product—not you—defines the funnel structure. You only output JSON with exactly four string fields:
"awareness", "engagement", "conversion", "retention".
Each value must be plain text (no nested JSON), 2–6 short sentences, practical and non-jargony, suitable for a non-technical owner on a 3G phone.
Do not invent facts not supported by the document; if the document is thin, say what is missing briefly inside the relevant field.
Reply with raw JSON only—no markdown, no code fences, no commentary before or after the JSON object.`;

/** Cap extracted text sent to the model (chars). */
const MAX_DOC_CHARS = 14_000;

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
/** API version header required by Anthropic; see https://docs.anthropic.com/en/api/versioning */
const ANTHROPIC_VERSION = '2023-06-01';

@Injectable()
export class FunnelAiService {
  private readonly logger = new Logger(FunnelAiService.name);

  constructor(private readonly config: ConfigService) {}

  async generateFromExtractedText(
    extractedText: string,
  ): Promise<MarketingFunnelResult> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY')?.trim();
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    const model =
      this.config.get<string>('ANTHROPIC_MODEL')?.trim() ||
      'claude-haiku-4-5';

    const userBlock =
      'Business document text (may be partial):\n\n' +
      extractedText.slice(0, MAX_DOC_CHARS);

    const body = {
      model,
      max_tokens: 4096,
      temperature: 0.35,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user' as const, content: userBlock }],
    };

    const res = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const rawJson = (await res.json()) as unknown;
    if (!res.ok) {
      this.logger.warn('Anthropic error response', rawJson);
      throw new Error(
        `Anthropic HTTP ${res.status}: ${safeAnthropicErrMessage(rawJson)}`,
      );
    }

    const text = extractAnthropicTextContent(rawJson);
    const jsonSlice = coerceJsonFromModelText(text);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonSlice) as unknown;
    } catch {
      throw new Error('Anthropic returned non-JSON message content');
    }

    return parseMarketingFunnelResult(parsed);
  }
}

function safeAnthropicErrMessage(raw: unknown): string {
  if (typeof raw !== 'object' || raw === null) {
    return 'unknown error';
  }
  const err = (raw as { error?: { message?: string } }).error?.message;
  return typeof err === 'string' ? err : 'unknown error';
}

function extractAnthropicTextContent(raw: unknown): string {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid Anthropic response shape');
  }
  const content = (raw as { content?: unknown }).content;
  if (!Array.isArray(content)) {
    throw new Error('Anthropic response missing content array');
  }
  const parts: string[] = [];
  for (const block of content) {
    if (
      typeof block === 'object' &&
      block !== null &&
      (block as { type?: string }).type === 'text' &&
      typeof (block as { text?: unknown }).text === 'string'
    ) {
      parts.push((block as { text: string }).text);
    }
  }
  const joined = parts.join('\n').trim();
  if (!joined) {
    throw new Error('Anthropic response had no text blocks');
  }
  return joined;
}

/** Strip optional ```json fences if the model adds them despite instructions. */
function coerceJsonFromModelText(s: string): string {
  const t = s.trim();
  if (t.startsWith('```')) {
    return t
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();
  }
  return t;
}
