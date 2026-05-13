import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { MulterError } from 'multer';
import { MAX_UPLOAD_BYTES } from '../../funnels/upload.constants';

@Catch(MulterError)
export class MulterErrorExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception.code === 'LIMIT_FILE_SIZE') {
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        success: false,
        error: {
          code: 'UPLOAD_FILE_TOO_LARGE',
          message: `File exceeds maximum size of ${MAX_UPLOAD_BYTES} bytes.`,
          fields: {
            file: {
              maxBytes: MAX_UPLOAD_BYTES,
              note: 'Request rejected by multipart size limit before full buffer.',
            },
          },
        },
      });
      return;
    }
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        code: 'UPLOAD_PARSE_ERROR',
        message: exception.message,
      },
    });
  }
}
