import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import {
  MovementType,
  StockMovement,
} from '../stock-movements/stock-movement.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleItem } from './sale-item.entity';
import { Sale } from './sale.entity';

@Injectable()
export class SalesService {
  constructor(
    // Repository pour LIRE les ventes
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    // DataSource : permet d'ouvrir une transaction pour ENREGISTRER une vente
    private readonly dataSource: DataSource,
  ) {}

  // ENREGISTRER une vente à partir d'un panier
  async create(dto: CreateSaleDto): Promise<Sale> {
    // Si le même produit apparaît plusieurs fois dans le panier,
    // on additionne ses quantités pour n'avoir qu'une ligne par produit.
    // Map = un dictionnaire : clé = id du produit, valeur = quantité totale.
    const quantities = new Map<number, number>();
    for (const item of dto.items) {
      const current = quantities.get(item.productId) ?? 0;
      quantities.set(item.productId, current + item.quantity);
    }

    // On traite les produits dans l'ordre croissant des id.
    // Ça évite un blocage mutuel quand deux ventes se font en même temps
    // sur les mêmes produits (chacune attendrait l'autre).
    const productIds = [...quantities.keys()].sort((a, b) => a - b);

    // TRANSACTION : tout réussit ensemble, ou tout est annulé.
    return this.dataSource.transaction(async (manager) => {
      const saleItems: SaleItem[] = [];
      let total = 0;

      for (const productId of productIds) {
        const quantity = quantities.get(productId) as number;

        // On récupère le produit en le verrouillant, pour que personne
        // d'autre ne modifie son stock pendant qu'on fait la vente.
        const product = await manager.findOne(Product, {
          where: { id: productId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product) {
          throw new NotFoundException(`Produit n°${productId} introuvable.`);
        }

        // Le stock doit suffire
        if (quantity > product.quantity) {
          throw new BadRequestException(
            `Stock insuffisant pour « ${product.name} » : il reste ${product.quantity} unité(s).`,
          );
        }

        // On retire la quantité vendue du stock
        product.quantity -= quantity;
        await manager.save(product);

        // On prépare la ligne de vente.
        // Le prix vient de la base (pas du client) et on le fige dans unitPrice.
        saleItems.push(
          manager.create(SaleItem, {
            product,
            quantity,
            unitPrice: product.price,
          }),
        );

        // On ajoute au total de la vente
        total += product.price * quantity;
      }

      // On enregistre la vente avec toutes ses lignes (cascade: true dans l'entité).
      // Math.round(... * 100) / 100 arrondit à 2 décimales
      // et évite les résultats du type 0.30000000000000004.
      const sale = await manager.save(
        manager.create(Sale, {
          total: Math.round(total * 100) / 100,
          items: saleItems,
        }),
      );

      // On enregistre un mouvement de stock OUT pour chaque ligne,
      // pour que l'historique du stock reste complet.
      for (const item of saleItems) {
        await manager.save(
          manager.create(StockMovement, {
            product: item.product,
            type: MovementType.OUT,
            quantity: item.quantity,
            reason: `Vente n°${sale.id}`,
          }),
        );
      }

      // On renvoie la vente complète (lignes + produits)
      return manager.findOneOrFail(Sale, {
        where: { id: sale.id },
        relations: { items: { product: true } },
      });
    });
  }

  // LISTER les ventes, de la plus récente à la plus ancienne
  findAll(): Promise<Sale[]> {
    return this.salesRepository.find({
      relations: { items: { product: true } },
      order: { createdAt: 'DESC' },
    });
  }

  // RÉCUPÉRER une vente par son id
  async findOne(id: number): Promise<Sale> {
    const sale = await this.salesRepository.findOne({
      where: { id },
      relations: { items: { product: true } },
    });
    if (!sale) {
      throw new NotFoundException('Vente introuvable.');
    }
    return sale;
  }
}