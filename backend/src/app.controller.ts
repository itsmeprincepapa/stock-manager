import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorator/public.decorator';
@Controller()
export class AppController {
  // GET /health : répond « ok » sans demander de connexion.
  // Elle ne touche pas à la base : elle dit seulement que le serveur est en vie.
  @Public()
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}