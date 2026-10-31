import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

// describe : un groupe de tests. it : un test, avec ce qu'on attend d'un comportement.
describe('Stock manager (e2e)', () => {
  let app: INestApplication;

  // Données partagées entre les tests (remplies au fil des tests, dans l'ordre d'écriture)
  let managerToken: string;
  let categoryId: number;
  let productAId: number; // iPhone 15 : 650000, stock initial 10
  let productBId: number; // Chargeur USB-C : 15000, stock initial 20

  // Raccourci : une requête HTTP vers l'application
  const http = () => request(app.getHttpServer());

  // Raccourci : l'en-tête d'authentification du gérant
  const asManager = () => ({ Authorization: `Bearer ${managerToken}` });

  // Raccourci : lit un produit et renvoie son état actuel
  const getProduct = async (id: number): Promise<{ quantity: number }> => {
    const response = await http()
      .get(`/products/${id}`)
      .set(asManager())
      .expect(200);
    return response.body;
  };

  // beforeAll : s'exécute UNE FOIS avant tous les tests
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    // main.ts n'est pas exécuté dans les tests : on remet la validation globale nous-mêmes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // SÉCURITÉ : on refuse de continuer si ce n'est pas une base de test,
    // pour ne jamais vider tes vraies données par erreur.
    const dataSource = app.get(DataSource);
    const databaseName = String(dataSource.options.database);
    if (!databaseName.endsWith('_test')) {
      throw new Error(
        `Les tests doivent utiliser une base "_test" (base actuelle : ${databaseName}).`,
      );
    }

    // synchronize(true) supprime toutes les tables puis les recrée vides :
    // chaque exécution des tests repart d'une base propre.
    await dataSource.synchronize(true);
  });

  // afterAll : s'exécute UNE FOIS après tous les tests. On ferme proprement l'application.
  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  describe('Authentification', () => {
    it('crée le premier compte et le met gérant', async () => {
      const response = await http()
        .post('/auth/register')
        .send({
          name: 'Gérant Test',
          email: 'gerant@test.com',
          password: 'MotDePasse123',
        })
        .expect(201);

      expect(response.body.user.role).toBe('MANAGER');
      expect(response.body.accessToken).toBeDefined();
      // Le mot de passe ne doit JAMAIS apparaître dans une réponse
      expect(response.body.user.password).toBeUndefined();

      managerToken = response.body.accessToken;
    });

    it('refuse une deuxième inscription publique', async () => {
      await http()
        .post('/auth/register')
        .send({
          name: 'Intrus',
          email: 'intrus@test.com',
          password: 'MotDePasse123',
        })
        .expect(403);
    });

    it('refuse une route protégée sans token', async () => {
      await http().get('/products').expect(401);
    });

    it('accepte une route protégée avec un token valide', async () => {
      await http().get('/products').set(asManager()).expect(200);
    });

    it('refuse un token modifié', async () => {
      await http()
        .get('/products')
        .set('Authorization', `Bearer ${managerToken}x`)
        .expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  describe('Produits', () => {
    it('crée une catégorie', async () => {
      const response = await http()
        .post('/categories')
        .set(asManager())
        .send({ name: 'Téléphones' })
        .expect(201);

      categoryId = response.body.id;
    });

    it('crée un produit et enregistre son stock initial dans l’historique', async () => {
      const response = await http()
        .post('/products')
        .set(asManager())
        .send({
          name: 'iPhone 15',
          price: 650000,
          quantity: 10,
          alertThreshold: 3,
          categoryId,
        })
        .expect(201);

      productAId = response.body.id;
      expect(response.body.quantity).toBe(10);

      // Le stock de départ doit être expliqué par un mouvement IN "Stock initial"
      const movements = await http()
        .get(`/stock-movements?productId=${productAId}`)
        .set(asManager())
        .expect(200);

      expect(movements.body.data).toHaveLength(1);
      expect(movements.body.data[0].type).toBe('IN');
      expect(movements.body.data[0].quantity).toBe(10);
      expect(movements.body.data[0].reason).toBe('Stock initial');
    });

    it('crée un deuxième produit', async () => {
      const response = await http()
        .post('/products')
        .set(asManager())
        .send({
          name: 'Chargeur USB-C',
          price: 15000,
          quantity: 20,
          alertThreshold: 5,
          categoryId,
        })
        .expect(201);

      productBId = response.body.id;
    });

    it('refuse un prix négatif', async () => {
      await http()
        .post('/products')
        .set(asManager())
        .send({ name: 'Produit invalide', price: -5 })
        .expect(400);
    });

    it('refuse de modifier directement la quantité', async () => {
      await http()
        .patch(`/products/${productAId}`)
        .set(asManager())
        .send({ quantity: 999 })
        .expect(400);

      // Le stock n'a pas bougé
      expect((await getProduct(productAId)).quantity).toBe(10);
    });

    it('autorise la modification du prix', async () => {
      const response = await http()
        .patch(`/products/${productAId}`)
        .set(asManager())
        .send({ price: 650000 })
        .expect(200);

      expect(response.body.price).toBe(650000);
    });

    it('pagine la liste des produits', async () => {
      const response = await http()
        .get('/products?limit=1&page=1')
        .set(asManager())
        .expect(200);

      // Une seule ligne dans la page, mais le total compte les deux produits
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta).toEqual({
        total: 2,
        page: 1,
        limit: 1,
        totalPages: 2,
      });
    });

    it('refuse une limite trop grande', async () => {
      await http().get('/products?limit=1000').set(asManager()).expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  describe('Ventes', () => {
    it('enregistre une vente : bon total, stock réduit, historique écrit', async () => {
      const stockBeforeA = (await getProduct(productAId)).quantity;
      const stockBeforeB = (await getProduct(productBId)).quantity;

      const response = await http()
        .post('/sales')
        .set(asManager())
        .send({
          items: [
            { productId: productAId, quantity: 3 },
            { productId: productBId, quantity: 2 },
          ],
        })
        .expect(201);

      // 3 x 650000 + 2 x 15000 = 1 980 000
      expect(response.body.total).toBe(1980000);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.status).toBe('COMPLETED');

      // Le stock a baissé exactement des quantités vendues
      expect((await getProduct(productAId)).quantity).toBe(stockBeforeA - 3);
      expect((await getProduct(productBId)).quantity).toBe(stockBeforeB - 2);

      // L'historique contient un mouvement OUT lié à cette vente
      const movements = await http()
        .get(`/stock-movements?productId=${productAId}`)
        .set(asManager())
        .expect(200);

      const saleMovement = movements.body.data.find(
        (movement: { reason: string }) =>
          movement.reason === `Vente n°${response.body.id}`,
      );
      expect(saleMovement).toBeDefined();
      expect(saleMovement.type).toBe('OUT');
      expect(saleMovement.quantity).toBe(3);
    });

    it('refuse une vente quand le stock est insuffisant, et ANNULE tout', async () => {
      const stockBeforeA = (await getProduct(productAId)).quantity;
      const stockBeforeB = (await getProduct(productBId)).quantity;

      // Les produits sont traités dans l'ordre de leur id : le produit A est
      // débité d'abord (il y en a assez), puis le produit B échoue (stock insuffisant).
      // Si la transaction fonctionne, le débit du produit A doit être annulé.
      const response = await http()
        .post('/sales')
        .set(asManager())
        .send({
          items: [
            { productId: productAId, quantity: 1 },
            { productId: productBId, quantity: 1000 },
          ],
        })
        .expect(400);

      expect(response.body.message).toContain('Stock insuffisant');

      // Aucun stock n'a changé : c'est la preuve de l'atomicité
      expect((await getProduct(productAId)).quantity).toBe(stockBeforeA);
      expect((await getProduct(productBId)).quantity).toBe(stockBeforeB);
    });

    it('additionne les lignes du même produit', async () => {
      const stockBeforeB = (await getProduct(productBId)).quantity;

      const response = await http()
        .post('/sales')
        .set(asManager())
        .send({
          items: [
            { productId: productBId, quantity: 1 },
            { productId: productBId, quantity: 2 },
          ],
        })
        .expect(201);

      // Une seule ligne, avec la quantité totale
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].quantity).toBe(3);
      expect((await getProduct(productBId)).quantity).toBe(stockBeforeB - 3);
    });

    it('refuse un panier vide', async () => {
      await http()
        .post('/sales')
        .set(asManager())
        .send({ items: [] })
        .expect(400);
    });

    it('refuse un produit inexistant', async () => {
      await http()
        .post('/sales')
        .set(asManager())
        .send({ items: [{ productId: 99999, quantity: 1 }] })
        .expect(404);
    });

    it('refuse un prix envoyé par le client (le prix vient du serveur)', async () => {
      await http()
        .post('/sales')
        .set(asManager())
        .send({ items: [{ productId: productAId, quantity: 1, unitPrice: 1 }] })
        .expect(400);
    });
  });
});