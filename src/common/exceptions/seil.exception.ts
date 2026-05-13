import { HttpException, HttpStatus } from '@nestjs/common';

type SeilErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, unknown>;
  };
};

export class SeilException extends HttpException {
  constructor(
    code: string,
    status: HttpStatus,
    message: string,
    fields?: Record<string, unknown>,
  ) {
    const body: SeilErrorBody = {
      success: false,
      error: {
        code,
        message,
        ...(fields !== undefined ? { fields } : {}),
      },
    };
    super(body, status);
  }
}
