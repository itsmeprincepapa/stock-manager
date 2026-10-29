import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';

// Cette classe représente la table "products" dans MySQL
@Entity('products')
export class Product {
  // Clé primaire auto-incrémentée
  @PrimaryGeneratedColumn()
  id: number;

  // Nom du produit : 150 caractères maximum
  @Column({ length: 150 })
  name: string;

  // Prix : type "decimal" (précis, adapté à l'argent) avec 2 chiffres après la virgule.
  // MySQL renvoie les decimal sous forme de texte ("1500.00"),
  // le transformer les convertit en vrai nombre (1500) quand on lit la base.
  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value, // code -> base : on ne change rien
      from: (value: string) => parseFloat(value), // base -> code : texte -> nombre
    },
  })
  price: number;

  // Quantité actuellement en stock (0 par défaut)
  @Column({ default: 0 })
  quantity: number;

  // Seuil d'alerte : sous cette quantité, le produit est considéré comme presque en rupture
  @Column({ default: 5 })
  alertThreshold: number;

  // Relation "plusieurs produits -> une catégorie".
  // TypeORM crée la colonne "categoryId" (clé étrangère) dans la table products.
  // nullable : un produit peut ne pas avoir de catégorie.
  // onDelete SET NULL : si on supprime la catégorie, le produit est conservé
  // et sa catégorie devient vide.
  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  category: Category | null;

  // Date de création, remplie automatiquement
  @CreateDateColumn()
  createdAt: Date;

  // Date de dernière modification, mise à jour automatiquement à chaque changement
  @UpdateDateColumn()
  updatedAt: Date;
}