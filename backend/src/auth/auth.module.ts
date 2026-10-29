import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // Permet d'utiliser UsersService (exporté par UsersModule)
    UsersModule,
    // Active passport, la bibliothèque qui lit et vérifie les tokens
    PassportModule,
    // Configure la fabrication des tokens.
    // registerAsync : on attend que le fichier .env soit chargé pour lire les valeurs.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Clé secrète qui signe les tokens (le démarrage échoue si elle est absente)
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Durée de validité du token (1 jour par défaut si JWT_EXPIRES_IN est absent).
          // Le "as" aide TypeScript : la valeur vient du .env, donc c'est du texte.
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
            '1d') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  // Les routes /auth/register et /auth/login
  controllers: [AuthController],
  // La logique et la stratégie JWT
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}