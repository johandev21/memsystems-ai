import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CLIENT_URL || [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
    exposedHeaders: ['X-Request-Id', 'X-Generation-Request-Id'],
  });

  app.useGlobalFilters(new DomainExceptionFilter());

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`NestJS backend listening on http://127.0.0.1:${port}/api`);
}
bootstrap();
