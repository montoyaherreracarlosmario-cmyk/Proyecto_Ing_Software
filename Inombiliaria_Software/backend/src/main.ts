import { NestFactory } from '@nestjs/core';
import express from 'express';
import { AppModule } from './app.module';
import { UPLOAD_DIR } from './imagenes/storage';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origenes = process.env.FRONTEND_URL?.split(',').map((o) => o.trim());
  app.enableCors({ origin: origenes?.length ? origenes : true });
  // Las firmas viajan como base64 en JSON: límite generoso (antes 100 kb por defecto)
  app.use(express.json({ limit: '10mb' }));
  // Imágenes subidas por los inmuebles (servidas como archivos estáticos)
  app.use('/archivos', express.static(UPLOAD_DIR));
  await app.listen(process.env.PORT || 4000, '0.0.0.0');
}
bootstrap();
