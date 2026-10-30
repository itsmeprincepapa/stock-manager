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
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    // Limitation de requêtes : par défaut, 100 requêtes par minute et par adresse IP.
    // ttl est en millisecondes (60000 = 1 minute).
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
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