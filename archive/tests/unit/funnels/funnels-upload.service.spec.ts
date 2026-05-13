import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { FunnelsUploadService } from '../../../../src/funnels/funnels-upload.service';
import { UploadedDocument } from '../../../../src/funnels/entities/uploaded-document.entity';
import { TextExtractionService } from '../../../../src/funnels/text-extraction.service';

describe('FunnelsUploadService', () => {
  let service: FunnelsUploadService;
  const save = jest.fn();
  const create = jest.fn();
  const findOne = jest.fn();
  const mockRepo = {
    create,
    save,
    findOne,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    create.mockImplementation((v: object) => ({ ...v, id: 'new-id' }));
    save.mockImplementation(async (v: UploadedDocument) => v);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FunnelsUploadService,
        { provide: getRepositoryToken(UploadedDocument), useValue: mockRepo },
        {
          provide: TextExtractionService,
          useValue: { extract: jest.fn().mockResolvedValue('hello') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, def?: string) => {
              if (key === 'UPLOAD_STORAGE_ROOT') {
                return def;
              }
              return def;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(FunnelsUploadService);
  });

  it('rejects missing file with VALIDATION_ERROR', async () => {
    try {
      await service.handleUpload('user-1', undefined);
      throw new Error('expected HttpException');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect((e as HttpException).getResponse()).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
        }),
      );
    }
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects oversize file with UPLOAD_FILE_TOO_LARGE', async () => {
    const file = {
      originalname: 'a.pdf',
      mimetype: 'application/pdf',
      size: 6_000_000,
      buffer: Buffer.alloc(0),
    } as Express.Multer.File;

    try {
      await service.handleUpload('user-1', file);
      throw new Error('expected HttpException');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect((e as HttpException).getResponse()).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'UPLOAD_FILE_TOO_LARGE' }),
        }),
      );
    }
    expect(save).not.toHaveBeenCalled();
  });

  it('returns RESOURCE_NOT_FOUND for foreign upload on progress', async () => {
    findOne.mockResolvedValue({ id: 'a', userId: 'other' });
    try {
      await service.getProgress('me', 'a');
      throw new Error('expected HttpException');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect((e as HttpException).getResponse()).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'RESOURCE_NOT_FOUND' }),
        }),
      );
    }
  });
});
