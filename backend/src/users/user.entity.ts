import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

// Les rôles possibles.
// MANAGER = gérant (peut tout faire), SELLER = vendeur (accès limité).
export enum Role {
  MANAGER = 'MANAGER',
  SELLER = 'SELLER',
}

// Cette classe représente la table "users"
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  // Nom affiché de l'utilisateur
  @Column({ length: 100 })
  name: string;

  // Email : sert d'identifiant de connexion, donc il doit être unique
  @Column({ unique: true, length: 150 })
  email: string;

  // Mot de passe HACHÉ (jamais en clair).
  // select: false : par défaut, TypeORM ne renvoie pas cette colonne
  // quand on lit un utilisateur. Ça évite de l'envoyer par erreur dans une réponse.
  @Column({ select: false })
  password: string;

  // Rôle de l'utilisateur (SELLER par défaut)
  @Column({ type: 'enum', enum: Role, default: Role.SELLER })
  role: Role;

  // Date de création, remplie automatiquement
  @CreateDateColumn()
  createdAt: Date;
}