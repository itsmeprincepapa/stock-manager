import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { MovementType, StockMovement } from './stock-movement.entity';

@Injectable()
export class StockMovementsService {
  constructor(
    // Repository pour LIRE l'historique des mouvements
    @InjectRepository(StockMovement)
    private readonly movementsRepository: Repository<StockMovement>,
    // DataSource : permet d'ouvrir une transaction (voir la méthode create)
    private readonly dataSource: DataSource,
  ) {}

  // ENREGISTRER un mouvement et mettre à jour le stock du produit
  async create(dto: CreateStockMovementDto): Promise<StockMovement> {
    // Pour une entrée ou une sortie, la quantité doit être d'au moins 1.
    // (Pour un ajustement, 0 est permis : "il n'en reste plus du tout".)
    if (dto.type !== MovementType.ADJUSTMENT && dto.quantity < 1) {
      throw new BadRequestException('La quantité doit être d’au moins 1.');
    }

    // TRANSACTION : tout ce qui est dans cette fonction réussit ensemble,
    // ou est annulé ensemble si une erreur survient.
    // "manager" est l'outil à utiliser À L'INTÉRIEUR de la transaction.
    return this.dataSource.transaction(async (manager) => {
      // On récupère le produit en le VERROUILLANT : si deux mouvements arrivent
      // en même temps pour le même produit, le second attend que le premier soit fini.
      // Ça évite d'obtenir un stock faux.
      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        throw new NotFoundException('Produit introuvable.');
      }

      // On calcule le nouveau stock selon le type de mouvement
      let newQuantity: number;
      switch (dto.type) {
        case MovementType.IN:
          // Entrée : on ajoute
          newQuantity = product.quantity + dto.quantity;
          break;
        case MovementType.OUT:
          // Sortie : on retire, mais jamais plus que ce qu'on a en stock
          if (dto.quantity > product.quantity) {
            throw new BadRequestException(
              `Stock insuffisant : il reste ${product.quantity} unité(s).`,
            );
          }
          newQuantity = product.quantity - dto.quantity;
          break;
        default:
          // Ajustement : le stock devient exactement la quantité indiquée
          newQuantity = dto.quantity;
      }

      // On met à jour le stock du produit
      product.quantity = newQuantity;
      await manager.save(product);

      // On enregistre le mouvement dans l'historique
      const movement = manager.create(StockMovement, {
        product,
        type: dto.type,
        quantity: dto.quantity,
        reason: dto.reason ?? null,
      });
      return manager.save(movement);
    });
  }

  // LISTER l'historique, du plus récent au plus ancien.
  // Si productId est fourni, on ne garde que les mouvements de ce produit.
  findAll(productId?: number): Promise<StockMovement[]> {
    return this.movementsRepository.find({
      where: productId ? { product: { id: productId } } : {},
      relations: { product: true },
      order: { createdAt: 'DESC' },
    });
  }
}