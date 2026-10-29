import { ConflictException, Injectable } from '@nestjs/common';
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

    // On HACHE le mot de passe : bcrypt le transforme en une longue suite de caractères
    // impossible à inverser. Le 10 est le "coût" du calcul : plus il est grand,
    // plus c'est sûr mais lent. 10 est une valeur courante.
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = this.usersRepository.create({
      name: data.name,
      email,
      password: passwordHash,
      role: data.role,
    });
    const saved = await this.usersRepository.save(user);

    // On relit l'utilisateur pour le renvoyer SANS le mot de passe
    // (la colonne password a select: false, donc elle n'est pas relue)
    return this.findById(saved.id);
  }

  // RETROUVER un utilisateur par son id (sans le mot de passe)
  async findById(id: number): Promise<User> {
    return this.usersRepository.findOneByOrFail({ id });
  }

  // RETROUVER un utilisateur par son email, AVEC son mot de passe haché.
  // Utilisé uniquement à la connexion, pour comparer le mot de passe saisi.
  // Comme password a select: false, il faut le demander explicitement avec "select".
  // Chaque colonne qui vaut true est lue.
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
}