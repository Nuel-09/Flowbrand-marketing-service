import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  if (process.env.SWAGGER_ENABLED === 'false') {
    return;
  }

  const port = Number(process.env.PORT) || 3000;
  const publicUrl = process.env.PUBLIC_URL?.replace(/\/$/, '');

  const builder = new DocumentBuilder()
    .setTitle('Flowbrand Marketing Service')
    .setDescription('HTTP API (NestJS, TypeORM, PostgreSQL).')
    .setVersion('1.0');

  if (publicUrl) {
    builder.addServer(publicUrl, 'Deployed');
  }
  builder.addServer(`http://localhost:${port}`, 'Local');

  const document = SwaggerModule.createDocument(app, builder.build());
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'docs/json',
  });
}
