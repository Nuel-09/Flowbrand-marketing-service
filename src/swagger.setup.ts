import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  if (process.env.SWAGGER_ENABLED === 'false') {
    return;
  }

  const port = Number(process.env.PORT) || 3000;
  const publicUrl = process.env.PUBLIC_URL?.replace(/\/$/, '');

  const builder = new DocumentBuilder()
    .setTitle('SEIL API')
    .setDescription(
      'SEIL — guided marketing strategy API (NestJS, PostgreSQL). Base path /api/v1/',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'access-token',
    );

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
