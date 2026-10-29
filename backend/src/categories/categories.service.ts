import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

// @Injectable : permet à NestJS de fournir ce service là où on en a besoin
// (par exemple dans le contrôleur)
@Injectable()
export class CategoriesService {
  // Le "repository" est l'outil de TypeORM pour lire et écrire dans la table "categories".
  // @InjectRepository(Category) demande à NestJS de nous le fournir automatiquement.
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  // CRÉER une catégorie
  async create(dto: CreateCategoryDto): Promise<Category> {
    // On vérifie d'abord qu'aucune catégorie n'a déjà ce nom
    const existing = await this.categoriesRepository.findOneBy({
      name: dto.name,
    });
    if (existing) {
      // Erreur 409 (conflit) avec un message en français
      throw new ConflictException('Cette catégorie existe déjà.');
    }
    // create() prépare l'objet, save() l'enregistre en base (INSERT)
    const category = this.categoriesRepository.create(dto);
    return this.categoriesRepository.save(category);
  }

  // LISTER toutes les catégories, triées par nom (SELECT ... ORDER BY name)
  findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({ order: { name: 'ASC' } });
  }

  // RÉCUPÉRER une catégorie par son id
  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOneBy({ id });
    if (!category) {
      // Erreur 404 si l'id n'existe pas
      throw new NotFoundException('Catégorie introuvable.');
    }
    return category;
  }

  // MODIFIER une catégorie
  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    // findOne lève déjà une erreur 404 si la catégorie n'existe pas
    const category = await this.findOne(id);

    // Si on change le nom, on vérifie qu'il n'est pas déjà pris par une autre catégorie
    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoriesRepository.findOneBy({
        name: dto.name,
      });
      if (existing) {
        throw new ConflictException('Cette catégorie existe déjà.');
      }
    }

    // Object.assign copie les champs reçus dans l'objet existant, puis save() met à jour la base
    Object.assign(category, dto);
    return this.categoriesRepository.save(category);
  }

  // SUPPRIMER une catégorie.
  // Ses produits sont conservés : leur catégorie devient vide (onDelete SET NULL).
  async remove(id: number): Promise<{ message: string }> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
    return { message: 'Catégorie supprimée.' };
  }
}