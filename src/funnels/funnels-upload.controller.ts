import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../common/decorators/current-user.decorator';
import { MAX_UPLOAD_BYTES } from './upload.constants';
import { FunnelsUploadService } from './funnels-upload.service';

const uploadInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES + 1 },
});

@ApiTags('funnels')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('funnels')
export class FunnelsUploadController {
  constructor(private readonly funnelsUploadService: FunnelsUploadService) {}

  @Post('upload')
  @ApiOperation({
    summary: 'Upload a business document (PDF or DOCX, max 5 MB)',
    description:
      'MVP: file is stored locally under UPLOAD_STORAGE_ROOT; text is extracted synchronously before the response.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(uploadInterceptor)
  upload(
    @CurrentUser() user: JwtUserPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.funnelsUploadService.handleUpload(user.userId, file);
  }

  @Get('upload/progress/:uploadId')
  @ApiOperation({
    summary: 'Poll upload / extraction progress for a document you own',
  })
  getProgress(
    @CurrentUser() user: JwtUserPayload,
    @Param('uploadId', ParseUUIDPipe) uploadId: string,
  ) {
    return this.funnelsUploadService.getProgress(user.userId, uploadId);
  }
}
