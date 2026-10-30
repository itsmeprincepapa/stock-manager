import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SaleItem } from './sale-item.entity';

// Les deux états possibles d'une vente.
// COMPLETED = vente valide, CANCELLED = vente annulée (stock remis).
export enum SaleStatus {
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Cette classe représente la table "sales" : une vente (le "ticket de caisse")
@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  // Montant total de la vente (decimal en base, converti en nombre dans le code)
  @Column('decimal', {
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  total: number;

  // État de la vente : valide par défaut.
  // Les ventes déjà enregistrées prendront automatiquement la valeur COMPLETED.
  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.COMPLETED })
  status: SaleStatus;

  // Date d'annulation : vide tant que la vente n'est pas annulée.
  // On précise type: 'datetime' car la valeur peut être null.
  @Column({ type: 'datetime', nullable: true })
  cancelledAt: Date | null;

  // Relation "une vente -> plusieurs lignes".
  // Cette propriété ne crée AUCUNE colonne dans "sales" : c'est la table "sale_items"
  // (colonne "saleId") qui porte le lien.
  // cascade true : quand on enregistre une vente, ses lignes sont enregistrées avec elle.
  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true })
  items: SaleItem[];

  // Date de la vente, remplie automatiquement
  @CreateDateColumn()
  createdAt: Date;
}