import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SaleItem } from './sale-item.entity';

// Cette classe représente la table "sales" : une vente (le "ticket de caisse")
@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  // Montant total de la vente (même principe que le prix d'un produit :
  // decimal en base, converti en nombre dans le code)
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

  // Relation "une vente -> plusieurs lignes".
  // Cette propriété ne crée AUCUNE colonne dans "sales" : c'est la table "sale_items"
  // (colonne "saleId") qui porte le lien. Elle sert à écrire "sale.items" dans le code.
  // cascade true : quand on enregistre une vente, ses lignes sont enregistrées avec elle.
  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true })
  items: SaleItem[];

  // Date de la vente, remplie automatiquement
  @CreateDateColumn()
  createdAt: Date;
}