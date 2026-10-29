import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';

// Les trois types de mouvement possibles.
// IN = entrée (réapprovisionnement), OUT = sortie (vente, casse...),
// ADJUSTMENT = correction du stock après un inventaire.
export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

// Cette classe représente la table "stock_movements" : l'historique de tous les mouvements de stock
@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  // Relation "plusieurs mouvements -> un produit" (colonne "productId" créée automatiquement).
  // nullable false : un mouvement doit toujours concerner un produit.
  // onDelete RESTRICT : on ne peut pas supprimer un produit qui a un historique de mouvements.
  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  product: Product;

  // Type du mouvement : MySQL n'accepte que les valeurs de l'enum (IN, OUT, ADJUSTMENT)
  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  // Quantité concernée par le mouvement
  @Column()
  quantity: number;

  // Motif facultatif (ex. "livraison fournisseur", "produit cassé").
  // On précise type varchar car la valeur peut être null.
  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  // Date du mouvement, remplie automatiquement
  @CreateDateColumn()
  createdAt: Date;
}