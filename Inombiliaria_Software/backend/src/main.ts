import { NestFactory } from '@nestjs/core';
import express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origenes = process.env.FRONTEND_URL?.split(',').map((o) => o.trim());
  app.enableCors({ origin: origenes?.length ? origenes : true });
  // Las firmas viajan como base64 en JSON: límite generoso (antes 100 kb por defecto)
  app.use(express.json({ limit: '10mb' }));
  // Las imágenes ahora se guardan en Mongo y las sirve ImagenesController (/archivos/:nombre),
  // así sobreviven a los reinicios del contenedor.
  await app.listen(process.env.PORT || 4000, '0.0.0.0');
}
bootstrap();
