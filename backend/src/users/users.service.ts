import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role, User } from './user.entity';

// Les données nécessaires pour créer un utilisateur
interface NewUser {
  name: string;
  email: string;
  password: string; // mot de passe en clair : le service le hache avant de l'enregistrer
  role: Role;
}

// Les changements possibles sur un compte (tous facultatifs)
interface UserChanges {
  name?: string;
  email?: string;
  password?: string; // en clair : haché avant d'être enregistré
  role?: Role;
}

@Injectable()
export class UsersService {
  constructor(
    // Repository pour lire et écrire dans la table "users"
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // Compter les utilisateurs (sert à repérer le tout premier compte)
  count(): Promise<number> {
    return this.usersRepository.count();
  }

  // CRÉER un utilisateur
  async create(data: NewUser): Promise<User> {
    // On met l'email en minuscules pour éviter les doublons du type
    // "Moi@mail.com" et "moi@mail.com"
    const email = data.email.toLowerCase();

    // L'email doit être unique
    const existing = await this.usersRepository.findOneBy({ email });
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé.');
    }

    // On HACHE le mot de passe : bcrypt le transforme en une suite impossible à inverser
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = this.usersRepository.create({
      name: data.name,
      email,
      password: passwordHash,
      role: data.role,
    });
    const saved = await this.usersRepository.save(user);

    // On relit l'utilisateur pour le renvoyer SANS le mot de passe
    return this.findById(saved.id);
  }

  // RETROUVER un utilisateur par son id (sans le mot de passe).
  // Erreur 404 s'il n'existe pas.
  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return user;
  }

  // Comme findById, mais renvoie null au lieu de lancer une erreur.
  // Utilisé par JwtStrategy : un compte supprimé n'est pas une erreur du serveur,
  // c'est simplement quelqu'un qui n'a plus accès.
  findByIdOrNull(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  // RETROUVER un utilisateur par son email, AVEC son mot de passe haché.
  // Utilisé uniquement à la connexion, pour comparer le mot de passe saisi.
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
      },
    });
  }

  // LISTER tous les utilisateurs (sans les mots de passe)
  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { name: 'ASC' } });
  }

  // MODIFIER un compte.
  // currentUserId : le gérant qui fait la demande (pour lui interdire de toucher à son propre rôle).
  async update(
    id: number,
    changes: UserChanges,
    currentUserId: number,
  ): Promise<User> {
    const user = await this.findById(id);

    // Un gérant ne peut pas changer son PROPRE rôle : il pourrait se retirer ses droits
    // par erreur et il ne resterait peut-être plus personne pour gérer.
    if (
      changes.role !== undefined &&
      changes.role !== user.role &&
      id === currentUserId
    ) {
      throw new BadRequestException('Vous ne pouvez pas modifier votre propre rôle.');
    }

    // Si l'email change, il ne doit pas déjà appartenir à un AUTRE compte
    if (changes.email !== undefined) {
      const email = changes.email.toLowerCase();
      if (email !== user.email) {
        const existing = await this.usersRepository.findOneBy({ email });
        if (existing) {
          throw new ConflictException('Cet email est déjà utilisé.');
        }
        user.email = email;
      }
    }

    if (changes.name !== undefined) user.name = changes.name;
    if (changes.role !== undefined) user.role = changes.role;

    // Un nouveau mot de passe est haché avant d'être enregistré, comme à la création.
    // (Le mot de passe actuel n'a pas été chargé : la colonne a select: false.
    // TypeORM ne met à jour que les champs définis, donc il n'est pas touché sinon.)
    if (changes.password) {
      user.password = await bcrypt.hash(changes.password, 10);
    }

    await this.usersRepository.save(user);

    // On relit le compte pour le renvoyer SANS le mot de passe
    return this.findById(id);
  }

  // SUPPRIMER un compte (sauf le sien)
  async remove(id: number, currentUserId: number): Promise<{ message: string }> {
    if (id === currentUserId) {
      throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte.');
    }

    const user = await this.findById(id);
    await this.usersRepository.remove(user);
    return { message: 'Utilisateur supprimé.' };
  }
}