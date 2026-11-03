import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Certificat de la base (format PEM). Sur un hébergeur, on le colle dans une
        // variable d'environnement : les retours à la ligne y sont parfois écrits « \n »,
        // on les remet en vrais retours à la ligne.
        const sslCa = config.get<string>('DB_SSL_CA')?.replace(/\\n/g, '\n');

        return {
          type: 'mysql' as const,
          host: config.get<string>('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          username: config.get<string>('DB_USERNAME'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_NAME'),
          autoLoadEntities: true,
          // La structure de la base est gérée UNIQUEMENT par les migrations
          synchronize: false,
          // Où se trouvent les migrations une fois compilées (dossier dist/migrations)
          migrations: [__dirname + '/migrations/*.js'],
          // Si DB_MIGRATIONS_RUN vaut « true », les migrations en attente s'appliquent au démarrage
          migrationsRun: config.get<string>('DB_MIGRATIONS_RUN') === 'true',
          // Connexion chiffrée ET vérifiée avec le certificat de la base, si on le fournit.
          // En local (pas de DB_SSL_CA), la connexion reste telle qu'avant.
          ssl: sslCa ? { ca: sslCa, rejectUnauthorized: true } : undefined,
        };
      },
    }),
    // Limitation de requêtes : 100 par minute et par IP, sauf si THROTTLE_LIMIT est défini
    // (les tests relèvent cette limite pour ne pas être bloqués par erreur).
    ThrottlerModule.forRoot({
      throttlers: [
        { ttl: 60000, limit: Number(process.env.THROTTLE_LIMIT ?? 100) },
      ],
      errorMessage: 'Trop de requêtes. Réessayez dans une minute.',
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    StockMovementsModule,
    SalesModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Active la limitation sur TOUTES les routes de l'application
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}