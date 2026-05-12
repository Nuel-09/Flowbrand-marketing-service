import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyAppConfiguration } from './app.bootstrap';
import { setupSwagger } from './swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  applyAppConfiguration(app);
  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
