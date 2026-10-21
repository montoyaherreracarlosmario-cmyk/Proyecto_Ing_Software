import { Body, Controller, Get, HttpCode, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ErrorFirma } from '../firmas/errores';
import { listar, procesar, subirOpciones } from './storage';

@Controller('api/imagenes')
export class ImagenesController {
  // Subida genérica de imágenes (fotos de casas, hoteles, etc.)
  // multipart/form-data: campo "imagen" (obligatorio) + campo "tipo" (casa | hotel | otro, opcional)
  @Post('subir')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('imagen', subirOpciones as any))
  async subir(@UploadedFile() file: any, @Body() body: any) {
    if (!file) throw new ErrorFirma(400, 'Falta la imagen (campo "imagen")');
    try {
      const { nombre } = await procesar(file.buffer, body?.tipo);
      return { nombre, url: `/archivos/${nombre}`, tipo: String(body?.tipo || 'otro') };
    } catch (e: any) {
      throw new ErrorFirma(400, e.message || 'No se pudo procesar la imagen');
    }
  }

  // Listado (filtro opcional ?tipo=casa|hotel|otro)
  @Get()
  listar(@Query('tipo') tipo?: string) {
    return listar(tipo);
  }
}
