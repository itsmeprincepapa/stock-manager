import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Module({
  // Rend le repository de User disponible dans ce module
  imports: [TypeOrmModule.forFeature([User])],
  // Les routes /users
  controllers: [UsersController],
  // La logique de ce module
  providers: [UsersService],
  // Le module d'authentification a besoin de UsersService
  exports: [UsersService],
})
export class UsersModule {}