import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Module({
  // Rend le repository de User disponible dans ce module
  imports: [TypeOrmModule.forFeature([User])],
  // La logique de ce module
  providers: [UsersService],
  // Le module d'authentification aura besoin de UsersService
  exports: [UsersService],
})
export class UsersModule {}