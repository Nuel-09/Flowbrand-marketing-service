import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeilException } from '../common/exceptions/seil.exception';
import { FunnelGeneration } from './entities/funnel-generation.entity';
import { UploadedDocument } from './entities/uploaded-document.entity';
import { FunnelAiService } from './funnel-ai.service';

@Injectable()
export class FunnelsGenerateService {
  constructor(
    @InjectRepository(UploadedDocument)
    private readonly uploads: Repository<UploadedDocument>,
    @InjectRepository(FunnelGeneration)
    private readonly generations: Repository<FunnelGeneration>,
    private readonly funnelAi: FunnelAiService,
  ) {}

  async generateFromUpload(userId: string, uploadId: string) {
    const doc = await this.uploads.findOne({ where: { id: uploadId } });
    if (!doc || doc.userId !== userId) {
      throw new SeilException(
        'RESOURCE_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'Upload not found.',
      );
    }
    if (doc.status !== 'ready' || !doc.extractedText?.trim()) {
      throw new SeilException(
        'UPLOAD_NOT_READY',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Document must be uploaded and text extracted before generating a funnel.',
        {
          uploadId,
          status: doc.status,
        },
      );
    }

    try {
      const result = await this.funnelAi.generateFromExtractedText(
        doc.extractedText,
      );
      const row = this.generations.create({
        userId,
        uploadId: doc.id,
        result,
      });
      const saved = await this.generations.save(row);
      return {
        success: true as const,
        data: {
          generationId: saved.id,
          uploadId: doc.id,
          result: saved.result,
          createdAt: saved.createdAt.toISOString(),
        },
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'AI generation failed';
      if (message === 'ANTHROPIC_API_KEY is not set') {
        throw new SeilException(
          'AI_NOT_CONFIGURED',
          HttpStatus.SERVICE_UNAVAILABLE,
          'Anthropic Claude is not configured. Set ANTHROPIC_API_KEY on the server.',
        );
      }
      throw new SeilException(
        'AI_GENERATION_FAILED',
        HttpStatus.BAD_GATEWAY,
        message,
      );
    }
  }
}
