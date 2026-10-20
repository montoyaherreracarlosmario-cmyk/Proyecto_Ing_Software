import { Controller, Get } from '@nestjs/common';

// Salud del servicio (misma respuesta que tenía la API Express)
@Controller('api')
export class SaludController {
  @Get('salud')
  salud() {
    return { ok: true, servicio: 'habitat-capital-api' };
  }
}
