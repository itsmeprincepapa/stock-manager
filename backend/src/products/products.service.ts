import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, QueryFailedError, Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { Paginated, toPaginated } from '../common/paginated';
import {
  MovementType,
  StockMovement,
} from '../stock-movements/stock-movement.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsQueryDto } from './dto/products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  // On reçoit trois outils :
  // - le repository des produits (lecture/écriture simple)
  // - le service des catégories (retrouver une catégorie à partir de son id)
  // - le DataSource (ouvrir une transaction)
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly categoriesService: CategoriesService,
    private readonly dataSource: DataSource,
  ) {}

  // CRÉER un produit
  async create(dto: CreateProductDto): Promise<Product> {
    // On sépare categoryId du reste des champs
    const { categoryId, ...data } = dto;

    // Si un categoryId est envoyé, on retrouve la catégorie correspondante.
    // findOne lève une erreur 404 si elle n'existe pas (avant de toucher au stock).
    const category = categoryId
      ? await this.categoriesService.findOne(categoryId)
      : null;

    // Quantité de départ (0 si le client n'en a pas envoyé)
    const initialQuantity = dto.quantity ?? 0;

    // TRANSACTION : la création du produit et son mouvement de stock initial
    // réussissent ensemble, ou sont annulés ensemble.
    return this.dataSource.transaction(async (manager) => {
      // On enregistre le produit
      const product = await manager.save(
        manager.create(Product, { ...data, category }),
      );

      // S'il y a du stock au départ, on l'écrit dans l'historique
      if (initialQuantity > 0) {
        await manager.save(
          manager.create(StockMovement, {
            product,
            type: MovementType.IN,
            quantity: initialQuantity,
            reason: 'Stock initial',
          }),
        );
      }

      return product;
    });
  }

  // LISTER les produits, une page à la fois, avec une recherche facultative par nom.
  // Exemple : GET /products?search=iphone&page=2&limit=10
  async findAll(query: ProductsQueryDto): Promise<Paginated<Product>> {
    const { page, limit, search } = query;

    // findAndCount fait DEUX choses : renvoie les éléments de la page ET le nombre total
    // (le total sert à calculer le nombre de pages).
    const [products, total] = await this.productsRepository.findAndCount({
      // Like avec % : cherche les produits dont le nom CONTIENT le texte
      where: search ? { name: Like(`%${search}%`) } : {},
      // relations : charge aussi la catégorie de chaque produit
      relations: { category: true },
      // Deux critères de tri : si deux produits ont le même nom, l'id les départage.
      // Sans ça, l'ordre pourrait varier d'une page à l'autre (un produit apparaîtrait deux fois, un autre jamais).
      order: { name: 'ASC', id: 'ASC' },
      // skip = combien de lignes sauter, take = combien en prendre.
      // Page 3 avec 20 par page : on saute 40 lignes, on en prend 20.
      skip: (page - 1) * limit,
      take: limit,
    });

    return toPaginated(products, total, page, limit);
  }

  // LISTER les produits dont le stock est faible : quantité <= seuil d'alerte
  // (pas paginée : la liste reste courte, c'est une liste d'alertes)
  findLowStock(): Promise<Product[]> {
    // On compare deux colonnes entre elles, ce qui demande un QueryBuilder
    return this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.quantity <= product.alertThreshold')
      .orderBy('product.quantity', 'ASC')
      .getMany();
  }

  // RÉCUPÉRER un produit par son id (avec sa catégorie)
  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException('Produit introuvable.');
    }
    return product;
  }

  // MODIFIER un produit (la quantité n'est plus modifiable ici : voir UpdateProductDto)
  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    // Erreur 404 automatique si le produit n'existe pas
    const product = await this.findOne(id);
    const { categoryId, ...data } = dto;

    // Si categoryId est présent dans la requête, on change la catégorie.
    // (un categoryId vide ou null retire la catégorie du produit)
    if (categoryId !== undefined) {
      product.category = categoryId
        ? await this.categoriesService.findOne(categoryId)
        : null;
    }

    // On copie les autres champs reçus (nom, prix, seuil) puis on enregistre
    Object.assign(product, data);
    return this.productsRepository.save(product);
  }

  // SUPPRIMER un produit
  async remove(id: number): Promise<{ message: string }> {
    const product = await this.findOne(id);
    try {
      await this.productsRepository.remove(product);
    } catch (error) {
      // Un produit déjà vendu ou déjà présent dans l'historique du stock
      // ne peut pas être supprimé (onDelete RESTRICT dans les entités).
      if (error instanceof QueryFailedError) {
        throw new ConflictException(
          'Ce produit a un historique de ventes ou de stock et ne peut pas être supprimé.',
        );
      }
      throw error;
    }
    return { message: 'Produit supprimé.' };
  }
}