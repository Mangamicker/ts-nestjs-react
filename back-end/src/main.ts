import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
