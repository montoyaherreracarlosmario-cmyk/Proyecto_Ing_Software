import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorFirma } from '../firmas/errores';
import { AuthService } from './auth.service';
import { ES_PUBLICA } from './public.decorator';

// Guard global: toda ruta exige una sesión válida salvo las marcadas con @Public().
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(ES_PUBLICA, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const req: any = ctx.switchToHttp().getRequest();
    const usuario = await this.auth.usuarioDe(req);

    // Si hay sesión, siempre se adjunta (así las rutas públicas también la ven).
    req.usuario = usuario;

    if (publica) return true;
    if (!usuario) throw new ErrorFirma(401, 'Debes iniciar sesión');
    return true;
  }
}
