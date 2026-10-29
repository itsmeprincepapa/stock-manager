import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginDto } from '../users/dto/login.dto';
import { RegisterDto } from '../users/dto/register.dto';
import { AuthService } from './auth.service';

// Toutes les routes de ce contrôleur commencent par /auth
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register : créer le tout premier compte (gérant).
  // Refusé dès qu'un utilisateur existe déjà.
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /auth/login : se connecter et recevoir un token.
  // Par défaut, un POST répond 201 (créé). Ici on ne crée rien,
  // donc on répond 200 (OK) avec @HttpCode.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}