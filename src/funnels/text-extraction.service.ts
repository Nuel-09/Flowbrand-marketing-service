import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
import type { UploadDocumentFileType } from './entities/uploaded-document.entity';

// pdf-parse is CommonJS; default import typing is unreliable under `moduleResolution: nodenext`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (
  data: Buffer,
) => Promise<{ text?: string }>;

@Injectable()
export class TextExtractionService {
  async extract(
    fileType: UploadDocumentFileType,
    buffer: Buffer,
  ): Promise<string> {
    if (fileType === 'pdf') {
      const result = await pdfParse(buffer);
      return (result.text ?? '').trim();
    }
    const result = await mammoth.extractRawText({ buffer });
    return (result.value ?? '').trim();
  }
}
