import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

// Cette classe représente la table "categories" dans MySQL
@Entity('categories')
export class Category {
  // Clé primaire : identifiant unique généré automatiquement (1, 2, 3...)
  @PrimaryGeneratedColumn()
  id: number;

  // Nom de la catégorie : 100 caractères maximum, pas de doublon possible
  @Column({ unique: true, length: 100 })
  name: string;

  // Date de création, remplie automatiquement par TypeORM
  @CreateDateColumn()
  createdAt: Date;
}