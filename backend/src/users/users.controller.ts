import { Body, Controller, Get, Post } from '@nestjs/common';
import { Roles } from '../auth/decorator/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from './user.entity';
import { UsersService } from './users.service';

// Toutes les routes de ce contrôleur commencent par /users.
// @Roles placé sur la classe s'applique à TOUTES ses routes :
// il est donc impossible d'en oublier une, tout est réservé au gérant.
@Roles(Role.MANAGER)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // POST /users : créer le compte d'un employé
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      // Si aucun rôle n'est envoyé, on crée un vendeur (le rôle le moins puissant)
      role: dto.role ?? Role.SELLER,
    });
  }

  // GET /users : lister tous les comptes (sans les mots de passe)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}