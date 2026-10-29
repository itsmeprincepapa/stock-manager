import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../products/product.entity';
import { Sale } from './sale.entity';

// Cette classe représente la table "sale_items" : une ligne d'une vente
// (ex. "2 chargeurs à 5000"). Une vente peut avoir plusieurs lignes.
@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn()
  id: number;

  // Relation "plusieurs lignes -> une vente" (colonne "saleId").
  // C'est le côté inverse du @OneToMany de Sale.
  // onDelete CASCADE : si on supprime la vente, ses lignes sont supprimées avec elle.
  @ManyToOne(() => Sale, (sale) => sale.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  sale: Sale;

  // Relation "plusieurs lignes -> un produit" (colonne "productId").
  // onDelete RESTRICT : on ne peut pas supprimer un produit déjà vendu (protège l'historique).
  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  product: Product;

  // Quantité vendue sur cette ligne
  @Column()
  quantity: number;

  // Prix unitaire AU MOMENT de la vente : si le prix du produit change plus tard,
  // les anciennes ventes gardent leur prix d'origine.
  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  unitPrice: number;
}