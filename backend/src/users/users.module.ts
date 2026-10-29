import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
  // Rend le repository de User disponible dans ce module
  imports: [TypeOrmModule.forFeature([User])],
})
export class UsersModule {}