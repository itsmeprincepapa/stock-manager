import {
  BadRequestException,
  ConflictException,
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
import { Sale, SaleStatus } from './sale.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Paginated, toPaginated } from '../common/paginated';

@Injectable()
export class SalesService {
  constructor(
    // Repository pour LIRE les ventes
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    // DataSource : permet d'ouvrir une transaction pour ENREGISTRER ou ANNULER une vente
    private readonly dataSource: DataSource,
  ) {}

  // ENREGISTRER une vente à partir d'un panier
  async create(dto: CreateSaleDto): Promise<Sale> {
    // Si le même produit apparaît plusieurs fois dans le panier,
    // on additionne ses quantités pour n'avoir qu'une ligne par produit.
    const quantities = new Map<number, number>();
    for (const item of dto.items) {
      const current = quantities.get(item.productId) ?? 0;
      quantities.set(item.productId, current + item.quantity);
    }

    // On traite les produits dans l'ordre croissant des id pour éviter
    // les blocages mutuels entre deux ventes simultanées.
    const productIds = [...quantities.keys()].sort((a, b) => a - b);

    // TRANSACTION : tout réussit ensemble, ou tout est annulé.
    return this.dataSource.transaction(async (manager) => {
      const saleItems: SaleItem[] = [];
      let total = 0;

      for (const productId of productIds) {
        const quantity = quantities.get(productId) as number;

        // On récupère le produit en le verrouillant
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

        // La ligne de vente : le prix vient de la base et est figé dans unitPrice
        saleItems.push(
          manager.create(SaleItem, {
            product,
            quantity,
            unitPrice: product.price,
          }),
        );

        total += product.price * quantity;
      }

      // On enregistre la vente avec ses lignes (cascade: true dans l'entité).
      // L'arrondi à 2 décimales évite les résultats du type 0.30000000000000004.
      const sale = await manager.save(
        manager.create(Sale, {
          total: Math.round(total * 100) / 100,
          items: saleItems,
        }),
      );

      // Un mouvement de stock OUT par ligne, pour garder l'historique complet
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

  // ANNULER une vente : remet le stock et garde la trace de l'annulation
  async cancel(id: number): Promise<Sale> {
    // TRANSACTION : le stock, les mouvements et le statut changent ensemble, ou pas du tout
    return this.dataSource.transaction(async (manager) => {
      // 1. On verrouille la vente. Si deux annulations arrivent en même temps,
      // la seconde attend la fin de la première puis voit le statut CANCELLED.
      // (On ne charge pas les lignes ici : on verrouille la vente seule.)
      const sale = await manager.findOne(Sale, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!sale) {
        throw new NotFoundException('Vente introuvable.');
      }

      // 2. On refuse d'annuler deux fois la même vente (sinon le stock serait remis deux fois)
      if (sale.status === SaleStatus.CANCELLED) {
        throw new ConflictException('Cette vente est déjà annulée.');
      }

      // 3. On charge les lignes de la vente avec leur produit
      const items = await manager.find(SaleItem, {
        where: { sale: { id } },
        relations: { product: true },
      });

      // Même précaution que pour la vente : on traite les produits dans l'ordre des id
      items.sort((a, b) => a.product.id - b.product.id);

      // 4. Pour chaque ligne : on rend la quantité au stock et on l'écrit dans l'historique
      for (const item of items) {
        const product = await manager.findOne(Product, {
          where: { id: item.product.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product) {
          throw new NotFoundException(
            `Produit n°${item.product.id} introuvable.`,
          );
        }

        // Le stock augmente de la quantité qui avait été vendue
        product.quantity += item.quantity;
        await manager.save(product);

        // Mouvement IN qui explique pourquoi le stock remonte
        await manager.save(
          manager.create(StockMovement, {
            product,
            type: MovementType.IN,
            quantity: item.quantity,
            reason: `Annulation vente n°${sale.id}`,
          }),
        );
      }

      // 5. On marque la vente comme annulée, avec la date
      sale.status = SaleStatus.CANCELLED;
      sale.cancelledAt = new Date();
      await manager.save(sale);

      // On renvoie la vente complète
      return manager.findOneOrFail(Sale, {
        where: { id },
        relations: { items: { product: true } },
      });
    });
  }

  // LISTER les ventes, une page à la fois, de la plus récente à la plus ancienne
  async findAll(query: PaginationQueryDto): Promise<Paginated<Sale>> {
    const { page, limit } = query;

    // findAndCount renvoie la page demandée ET le nombre total de ventes
    const [sales, total] = await this.salesRepository.findAndCount({
      relations: { items: { product: true } },
      // Tri stable : si deux ventes ont la même date, l'id les départage
      order: { createdAt: 'DESC', id: 'DESC' },
      // skip = combien de ventes sauter, take = combien en prendre
      skip: (page - 1) * limit,
      take: limit,
    });

    return toPaginated(sales, total, page, limit);
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