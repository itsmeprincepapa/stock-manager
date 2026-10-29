import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, QueryFailedError, Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  // On reçoit deux outils :
  // - le repository des produits (pour lire/écrire dans la table "products")
  // - le service des catégories (pour retrouver une catégorie à partir de son id)
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly categoriesService: CategoriesService,
  ) {}

  // CRÉER un produit
  async create(dto: CreateProductDto): Promise<Product> {
    // On sépare categoryId du reste des champs
    const { categoryId, ...data } = dto;

    // Si un categoryId est envoyé, on retrouve la catégorie correspondante.
    // findOne lève une erreur 404 si elle n'existe pas.
    const category = categoryId
      ? await this.categoriesService.findOne(categoryId)
      : null;

    // create() prépare l'objet, save() l'enregistre en base (INSERT)
    const product = this.productsRepository.create({ ...data, category });
    return this.productsRepository.save(product);
  }

  // LISTER les produits, avec une recherche facultative par nom.
  // Exemple : GET /products?search=iphone
  findAll(search?: string): Promise<Product[]> {
    return this.productsRepository.find({
      // Like avec % : cherche les produits dont le nom CONTIENT le texte
      where: search ? { name: Like(`%${search}%`) } : {},
      // relations : charge aussi la catégorie de chaque produit
      relations: { category: true },
      order: { name: 'ASC' },
    });
  }

  // LISTER les produits dont le stock est faible : quantité <= seuil d'alerte
  findLowStock(): Promise<Product[]> {
    // Ici on compare deux colonnes entre elles, ce qui demande un QueryBuilder
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

  // MODIFIER un produit
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

    // On copie les autres champs reçus (nom, prix, quantité, seuil) puis on enregistre
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