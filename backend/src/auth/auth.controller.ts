import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginDto } from '../users/dto/login.dto';
import { RegisterDto } from '../users/dto/register.dto';
import { AuthService } from './auth.service';
import { Public } from './decorator/public.decorator';

// Toutes les routes de ce contrôleur commencent par /auth
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register : créer le tout premier compte (gérant).
  // @Public() : accessible sans token (sinon personne ne pourrait créer le premier compte).
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /auth/login : se connecter et recevoir un token.
  // @Public() : accessible sans token (on n'en a pas encore, c'est le but de la connexion).
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}