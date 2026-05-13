import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FunnelAiService } from './funnel-ai.service';
import { parseMarketingFunnelResult } from './types/marketing-funnel-result';

describe('parseMarketingFunnelResult', () => {
  it('accepts valid four-field object', () => {
    const r = parseMarketingFunnelResult({
      awareness: ' A ',
      engagement: 'E',
      conversion: 'C',
      retention: 'R',
    });
    expect(r.awareness).toBe('A');
    expect(r.engagement).toBe('E');
  });

  it('rejects missing field', () => {
    expect(() =>
      parseMarketingFunnelResult({
        awareness: 'a',
        engagement: 'b',
        conversion: 'c',
      }),
    ).toThrow(/retention/);
  });
});

describe('FunnelAiService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('parses Anthropic Messages API response body', async () => {
    const jsonPayload = JSON.stringify({
      awareness: 'a1',
      engagement: 'e1',
      conversion: 'c1',
      retention: 'r1',
    });
    const anthropicBody = {
      id: 'msg_01_test',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: jsonPayload }],
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => anthropicBody,
    } as Response);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FunnelAiService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'ANTHROPIC_API_KEY' ? 'sk-ant-api03-placeholder' : undefined,
          },
        },
      ],
    }).compile();

    const svc = module.get(FunnelAiService);
    const out = await svc.generateFromExtractedText('some doc text');
    expect(out.retention).toBe('r1');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'sk-ant-api03-placeholder',
          'anthropic-version': '2023-06-01',
        }),
      }),
    );
  });
});
