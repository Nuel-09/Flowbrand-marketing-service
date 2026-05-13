import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { FunnelGeneration } from './entities/funnel-generation.entity';
import { UploadedDocument } from './entities/uploaded-document.entity';
import { FunnelAiService } from './funnel-ai.service';
import { FunnelsGenerateController } from './funnels-generate.controller';
import { FunnelsGenerateService } from './funnels-generate.service';
import { FunnelsUploadController } from './funnels-upload.controller';
import { FunnelsUploadService } from './funnels-upload.service';
import { TextExtractionService } from './text-extraction.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UploadedDocument, FunnelGeneration]),
    AuthModule,
  ],
  controllers: [FunnelsUploadController, FunnelsGenerateController],
  providers: [
    FunnelsUploadService,
    TextExtractionService,
    FunnelAiService,
    FunnelsGenerateService,
  ],
})
export class FunnelsModule {}