import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Crée l'application NestJS à partir du module principal
  const app = await NestFactory.create(AppModule);

  // Active la validation sur TOUTES les routes : c'est elle qui lit les règles des DTO
  app.useGlobalPipes(
    new ValidationPipe({
      // Retire les champs qui ne sont pas déclarés dans le DTO
      whitelist: true,
      // Au lieu de les ignorer en silence, renvoie une erreur si un champ inconnu est envoyé
      forbidNonWhitelisted: true,
      // Convertit les types automatiquement (ex. l'id de l'URL, du texte, devient un nombre)
      transform: true,
    }),
  );

  // Démarre le serveur sur le port 3000 (ou celui défini dans .env)
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();