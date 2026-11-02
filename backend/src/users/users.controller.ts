import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { type AuthUser , CurrentUser } from '../auth/decorator/current-user.decorator';

import { Roles } from '../auth/decorator/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

  // GET /users/:id : voir un compte
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  // PATCH /users/:id : modifier un compte (seulement les champs envoyés).
  // @CurrentUser() donne le gérant qui fait la demande.
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() current: AuthUser,
  ) {
    return this.usersService.update(id, dto, current.id);
  }

  // DELETE /users/:id : supprimer un compte (jamais le sien)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() current: AuthUser,
  ) {
    return this.usersService.remove(id, current.id);
  }
}