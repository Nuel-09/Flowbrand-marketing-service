import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Repository } from 'typeorm';
import { SeilException } from '../common/exceptions/seil.exception';
import { UploadedDocument } from './entities/uploaded-document.entity';
import type {
  UploadDocumentFileType,
  UploadDocumentStatus,
} from './entities/uploaded-document.entity';
import { TextExtractionService } from './text-extraction.service';
import { MAX_UPLOAD_BYTES } from './upload.constants';

const ALLOWED: Record<
  UploadDocumentFileType,
  { mime: string[]; ext: string }
> = {
  pdf: { mime: ['application/pdf'], ext: '.pdf' },
  docx: {
    mime: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    ext: '.docx',
  },
};

@Injectable()
export class FunnelsUploadService {
  private readonly logger = new Logger(FunnelsUploadService.name);

  constructor(
    @InjectRepository(UploadedDocument)
    private readonly docs: Repository<UploadedDocument>,
    private readonly textExtraction: TextExtractionService,
    private readonly config: ConfigService,
  ) {}

  private resolveStorageRoot(): string {
    return this.config.get<string>(
      'UPLOAD_STORAGE_ROOT',
      path.join(process.cwd(), 'var', 'uploads'),
    );
  }

  private detectType(
    originalname: string,
    mimetype: string,
  ): UploadDocumentFileType {
    const ext = path.extname(originalname).toLowerCase();
    const keys: UploadDocumentFileType[] = ['pdf', 'docx'];
    for (const key of keys) {
      const rule = ALLOWED[key];
      if (ext === rule.ext && rule.mime.includes(mimetype)) {
        return key;
      }
    }
    throw new SeilException(
      'UPLOAD_INVALID_TYPE',
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Only PDF or DOCX uploads are allowed. The file extension and MIME type must match.',
      {
        file: {
          receivedMimeType: mimetype,
          receivedExtension: ext || '(none)',
          allowed: ['pdf', 'docx'],
        },
      },
    );
  }

  async handleUpload(
    userId: string,
    file: Express.Multer.File | undefined,
  ): Promise<{
    success: true;
    data: {
      uploadId: string;
      status: UploadDocumentStatus;
      percent: number;
      originalFilename: string;
      fileType: UploadDocumentFileType;
      fileSizeBytes: number;
    };
  }> {
    if (!file) {
      throw new SeilException(
        'VALIDATION_ERROR',
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Missing required multipart field 'file'.",
        { file: 'The file field is required.' },
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new SeilException(
        'UPLOAD_FILE_TOO_LARGE',
        HttpStatus.UNPROCESSABLE_ENTITY,
        `File exceeds maximum size of ${MAX_UPLOAD_BYTES} bytes.`,
        {
          file: {
            sizeBytes: file.size,
            maxBytes: MAX_UPLOAD_BYTES,
          },
        },
      );
    }

    const fileType = this.detectType(file.originalname, file.mimetype);
    const root = this.resolveStorageRoot();
    const relativeDir = path.join('uploads', userId);

    const row = this.docs.create({
      userId,
      originalFilename: file.originalname,
      fileType,
      fileSizeBytes: file.size,
      status: 'uploading',
      percent: 0,
      storagePath: null,
      extractedText: null,
      failureReason: null,
    });
    const saved = await this.docs.save(row);

    const ext = fileType === 'pdf' ? 'pdf' : 'docx';
    const relativePath = path.join(relativeDir, `${saved.id}.${ext}`);
    const absolutePath = path.join(root, relativePath);

    try {
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, file.buffer);
    } catch (err) {
      this.logger.error('Local storage write failed', err);
      saved.status = 'failed';
      saved.percent = 0;
      saved.failureReason = 'STORAGE_WRITE_FAILED';
      await this.docs.save(saved);
      throw new SeilException(
        'UPLOAD_FAILED',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Could not persist the uploaded file.',
      );
    }

    saved.storagePath = relativePath.replace(/\\/g, '/');
    saved.status = 'processing';
    saved.percent = 55;
    await this.docs.save(saved);

    try {
      const text = await this.textExtraction.extract(fileType, file.buffer);
      saved.extractedText = text;
      saved.status = 'ready';
      saved.percent = 100;
      saved.failureReason = null;
      await this.docs.save(saved);
    } catch (err) {
      this.logger.warn('Text extraction failed', err);
      saved.status = 'failed';
      saved.percent = 0;
      saved.failureReason =
        err instanceof Error ? err.message : 'EXTRACTION_FAILED';
      await this.docs.save(saved);
    }

    return {
      success: true,
      data: {
        uploadId: saved.id,
        status: saved.status,
        percent: saved.percent,
        originalFilename: saved.originalFilename,
        fileType: saved.fileType,
        fileSizeBytes: saved.fileSizeBytes,
      },
    };
  }

  async getProgress(
    userId: string,
    uploadId: string,
  ): Promise<{
    success: true;
    data: {
      uploadId: string;
      originalFilename: string;
      fileType: UploadDocumentFileType;
      fileSizeBytes: number;
      status: UploadDocumentStatus;
      percent: number;
      uploadedAt: string;
    };
  }> {
    const doc = await this.docs.findOne({ where: { id: uploadId } });
    if (!doc || doc.userId !== userId) {
      throw new SeilException(
        'RESOURCE_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'Upload not found.',
      );
    }
    return {
      success: true,
      data: {
        uploadId: doc.id,
        originalFilename: doc.originalFilename,
        fileType: doc.fileType,
        fileSizeBytes: doc.fileSizeBytes,
        status: doc.status,
        percent: doc.percent,
        uploadedAt: doc.uploadedAt.toISOString(),
      },
    };
  }
}
