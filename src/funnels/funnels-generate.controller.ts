import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../common/decorators/current-user.decorator';
import { GenerateFromUploadDto } from './dto/generate-from-upload.dto';
import { FunnelsGenerateService } from './funnels-generate.service';

@ApiTags('funnels')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('funnels')
export class FunnelsGenerateController {
  constructor(private readonly generate: FunnelsGenerateService) {}

  @Post('generate-from-upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Generate marketing funnel (Awareness → Retention) from a ready upload',
    description:
      'Uses ANTHROPIC_API_KEY (Claude). Requires upload status `ready` with extracted text. Persists one funnel_generations row.',
  })
  generateFromUpload(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: GenerateFromUploadDto,
  ) {
    return this.generate.generateFromUpload(user.userId, dto.uploadId);
  }
}
