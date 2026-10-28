import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../products/product.entity';
import { Sale } from './sale.entity';

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Sale, (sale) => sale.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  sale: Sale;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  product: Product;

  @Column()
  quantity: number;

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