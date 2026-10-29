import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // Permet d'utiliser UsersService (exporté par UsersModule)
    UsersModule,
    // Active passport, la bibliothèque qui lit et vérifie les tokens
    PassportModule,
    // Configure la fabrication des tokens
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Clé secrète qui signe les tokens (le démarrage échoue si elle est absente)
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Durée de validité du token (1 jour par défaut)
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
            '1d') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  // Les routes /auth/register et /auth/login
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // APP_GUARD déclare un guard GLOBAL : il s'applique à toutes les routes
    // de l'application, pas seulement à celles de ce module.
    // Les guards s'exécutent dans l'ordre de cette liste :
    // d'abord "es-tu connecté ?", ensuite "as-tu le bon rôle ?".
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}