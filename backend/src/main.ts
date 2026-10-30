import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // Crée l'application NestJS à partir du module principal
  const app = await NestFactory.create(AppModule);

  // helmet : ajoute des en-têtes HTTP de sécurité à toutes les réponses
  app.use(helmet());

  // Active la validation sur TOUTES les routes : c'est elle qui lit les règles des DTO
  app.useGlobalPipes(
    new ValidationPipe({
      // Retire les champs qui ne sont pas déclarés dans le DTO
      whitelist: true,
      // Renvoie une erreur si un champ inconnu est envoyé
      forbidNonWhitelisted: true,
      // Convertit les types automatiquement (ex. l'id de l'URL devient un nombre)
      transform: true,
    }),
  );

  // CORS : autorise le frontend à appeler cette API depuis le navigateur.
  // L'adresse autorisée vient de la variable FRONTEND_URL du .env.
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  });

  // Démarre le serveur sur le port 3000 (ou celui défini dans .env)
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();