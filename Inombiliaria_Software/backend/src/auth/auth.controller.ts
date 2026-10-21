import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, UsuarioActual } from './public.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Público: el frontend envía el "credential" (ID token) que devuelve Google.
  @Public()
  @Post('google')
  @HttpCode(200)
  google(@Body() body: any) {
    return this.auth.loginConGoogle(body?.credential);
  }

  // Público a nivel de guard, pero responde el usuario solo si hay sesión válida.
  @Public()
  @Get('me')
  me(@UsuarioActual() usuario: any) {
    return { usuario: usuario || null };
  }

  @Post('salir')
  @HttpCode(200)
  salir(@Req() req: any) {
    return this.auth.salir(req);
  }
}
