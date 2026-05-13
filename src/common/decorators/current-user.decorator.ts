import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type JwtUserPayload = { userId: string; email: string };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtUserPayload }>();
    return request.user as JwtUserPayload;
  },
);
