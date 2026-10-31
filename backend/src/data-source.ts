import 'dotenv/config';
import { DataSource } from 'typeorm';

// Ce fichier n'est utilisé que par l'outil en ligne de commande de TypeORM
// (génération et exécution des migrations). L'application, elle, utilise la
// configuration de app.module.ts.
// "import 'dotenv/config'" charge le fichier .env avant de lire process.env.
export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Où trouver les entités : tous les fichiers "xxx.entity" à côté de ce fichier
  // (une fois compilé, ce sera dans dist/)
  entities: [__dirname + '/**/*.entity.{ts,js}'],
  // Où se trouvent (et où seront créées) les migrations
  migrations: [__dirname + '/migrations/*.{ts,js}'],
});