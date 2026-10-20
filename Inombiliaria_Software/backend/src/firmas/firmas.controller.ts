import { Body, Controller, Get, HttpCode, Param, Post, Req, Res } from '@nestjs/common';
import { FirmasService } from './firmas.service';

@Controller('api/firmas')
export class FirmasController {
  constructor(private readonly svc: FirmasService) {}

  // Crear acuerdo (desde el formulario de contrato del frontend)
  @Post('acuerdos')
  @HttpCode(200)
  crear(@Body() body: any) {
    const { inmueble, tipo, datos, firmantes } = body || {};
    return this.svc.crearAcuerdo({ inmueble, tipo, datos, firmantes });
  }

  // Estado del acuerdo (panel administrativo)
  @Get('acuerdos/:id')
  obtener(@Param('id') id: string) {
    return this.svc.obtenerAcuerdo(id);
  }

  // Datos públicos para la pantalla de firma (contrato, turno, rol)
  @Get('t/:token')
  porToken(@Param('token') token: string) {
    return this.svc.obtenerPorToken(token);
  }

  // Registrar firma (valida el turno en el servidor)
  @Post('t/:token/firmar')
  @HttpCode(200)
  firmar(@Param('token') token: string, @Body() body: any, @Req() req: any) {
    return this.svc.firmar(token, { ...(body || {}), req });
  }

  // Rechazo del administrativo con observaciones
  @Post('t/:token/rechazar')
  @HttpCode(200)
  rechazar(@Param('token') token: string, @Body() body: any, @Req() req: any) {
    return this.svc.rechazar(token, { ...(body || {}), req });
  }

  // Verificación de integridad (recomputa hashes — validez Ley 527)
  @Get('acuerdos/:id/verificar')
  verificar(@Param('id') id: string) {
    return this.svc.verificar(id);
  }

  // PDF final (contrato + firmas + anexo de evidencia)
  @Get('acuerdos/:id/pdf')
  async pdf(@Param('id') id: string, @Res() res: any) {
    const buffer = await this.svc.pdfDe(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contrato-${id}.pdf"`);
    return res.send(buffer);
  }
}
