import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origenes = process.env.FRONTEND_URL?.split(',').map((o) => o.trim());
  app.enableCors({ origin: origenes?.length ? origenes : true });
  await app.listen(process.env.PORT || 4000, '0.0.0.0');
}
bootstrap();
