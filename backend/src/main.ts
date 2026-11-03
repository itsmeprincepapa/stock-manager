import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // Crée l'application NestJS (NestExpressApplication donne accès aux réglages d'Express)
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Derrière un hébergeur, une couche intermédiaire (proxy) reçoit les requêtes puis nous les transmet.
  // Avec TRUST_PROXY=true, on lit la VRAIE adresse du visiteur dans l'en-tête que cette couche ajoute.
  // Le 1 veut dire : on fait confiance à UNE seule couche intermédiaire.
  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }

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
  // L'adresse autorisée vient de la variable FRONTEND_URL.
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  });

  // Démarre le serveur sur le port donné par l'hébergeur (PORT), ou 3000 en local
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();