import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GenerateFromUploadDto {
  @ApiProperty({ format: 'uuid', description: 'uploadId of a ready document you own' })
  @IsUUID()
  uploadId!: string;
}
