import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { SaleItem } from '../sales/sale-item.entity';
import { Sale } from '../sales/sale.entity';

// Forme des résultats bruts renvoyés par la base (les nombres arrivent en texte)
interface TotalsRow {
  count: string;
  total: string;
}
interface TopProductRow {
  productId: number;
  name: string;
  quantitySold: string;
  revenue: string;
}
interface DailyRow {
  day: string;
  total: string;
}

@Injectable()
export class DashboardService {
  constructor(
    // Un repository par table qu'on interroge
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemsRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  // Renvoie toutes les statistiques du tableau de bord
  async getStats() {
    // Début du jour (00:00) et du mois (le 1er à 00:00)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(startOfToday);
    startOfMonth.setDate(1);

    // Il y a 30 jours, et il y a 6 jours (aujourd'hui + 6 jours précédents = 7 jours)
    const thirtyDaysAgo = new Date(startOfToday);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixDaysAgo = new Date(startOfToday);
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

    // Les requêtes sont INDÉPENDANTES : on les lance toutes en même temps
    // avec Promise.all, puis on récupère les résultats dans le même ordre.
    const [today, month, productCount, lowStockCount, topProducts, daily] =
      await Promise.all([
        this.getTotalsSince(startOfToday),
        this.getTotalsSince(startOfMonth),
        this.productsRepository.count(),
        // Stock faible : quantité <= seuil d'alerte (deux colonnes comparées entre elles)
        this.productsRepository
          .createQueryBuilder('product')
          .where('product.quantity <= product.alertThreshold')
          .getCount(),
        this.getTopProducts(thirtyDaysAgo),
        this.getDailyRevenue(sixDaysAgo),
      ]);

    return {
      salesToday: today,
      salesThisMonth: month,
      productCount,
      lowStockCount,
      topProducts,
      dailyRevenue: daily,
    };
  }

  // Nombre de ventes et chiffre d'affaires depuis une date donnée
  private async getTotalsSince(since: Date) {
    const row = await this.salesRepository
      .createQueryBuilder('sale')
      // COUNT : compte les ventes. COALESCE(SUM(...), 0) : le total, ou 0 s'il n'y a aucune vente
      .select('COUNT(sale.id)', 'count')
      .addSelect('COALESCE(SUM(sale.total), 0)', 'total')
      .where('sale.createdAt >= :since', { since })
      .getRawOne<TotalsRow>();

    // MySQL renvoie les sommes sous forme de texte : on les convertit en nombres
    return {
      count: Number(row?.count ?? 0),
      total: Number(row?.total ?? 0),
    };
  }

  // Les 5 produits les plus vendus depuis une date donnée
  private async getTopProducts(since: Date) {
    const rows = await this.saleItemsRepository
      .createQueryBuilder('item')
      // innerJoin : on relie chaque ligne de vente à son produit et à sa vente
      .innerJoin('item.product', 'product')
      .innerJoin('item.sale', 'sale')
      .select('product.id', 'productId')
      .addSelect('product.name', 'name')
      // SUM : additionne les quantités vendues de ce produit
      .addSelect('SUM(item.quantity)', 'quantitySold')
      // Chiffre d'affaires du produit : quantité x prix unitaire de chaque ligne
      .addSelect('SUM(item.quantity * item.unitPrice)', 'revenue')
      .where('sale.createdAt >= :since', { since })
      // groupBy : un résultat par produit, au lieu d'un par ligne de vente
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('quantitySold', 'DESC')
      .limit(5)
      .getRawMany<TopProductRow>();

    return rows.map((row) => ({
      productId: Number(row.productId),
      name: row.name,
      quantitySold: Number(row.quantitySold),
      revenue: Number(row.revenue),
    }));
  }

  // Chiffre d'affaires par jour depuis une date donnée
  private async getDailyRevenue(since: Date) {
    const rows = await this.salesRepository
      .createQueryBuilder('sale')
      // DATE_FORMAT transforme la date en texte "2026-10-29"
      .select("DATE_FORMAT(sale.createdAt, '%Y-%m-%d')", 'day')
      .addSelect('COALESCE(SUM(sale.total), 0)', 'total')
      .where('sale.createdAt >= :since', { since })
      .groupBy("DATE_FORMAT(sale.createdAt, '%Y-%m-%d')")
      .orderBy('day', 'ASC')
      .getRawMany<DailyRow>();

    return rows.map((row) => ({
      day: row.day,
      total: Number(row.total),
    }));
  }
}