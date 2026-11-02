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
  
  // ---------------------------------------------------------------------------
  describe('Annulation d’une vente', () => {
    let saleId: number;
    let stockAfterSale: number;

    it('prépare une vente à annuler', async () => {
      const response = await http()
        .post('/sales')
        .set(asManager())
        .send({ items: [{ productId: productBId, quantity: 2 }] })
        .expect(201);

      saleId = response.body.id;
      // Stock du chargeur APRÈS la vente et AVANT l'annulation
      stockAfterSale = (await getProduct(productBId)).quantity;
    });

    it('annule la vente, remet le stock et écrit un mouvement', async () => {
      const response = await http()
        .post(`/sales/${saleId}/cancel`)
        .set(asManager())
        .expect(200);

      expect(response.body.status).toBe('CANCELLED');
      expect(response.body.cancelledAt).not.toBeNull();

      // Le stock a retrouvé les 2 unités vendues
      expect((await getProduct(productBId)).quantity).toBe(stockAfterSale + 2);

      // Un mouvement IN explique pourquoi le stock est remonté
      const movements = await http()
        .get(`/stock-movements?productId=${productBId}&limit=100`)
        .set(asManager())
        .expect(200);

      const cancelMovement = movements.body.data.find(
        (movement: { reason: string }) =>
          movement.reason === `Annulation vente n°${saleId}`,
      );
      expect(cancelMovement).toBeDefined();
      expect(cancelMovement.type).toBe('IN');
      expect(cancelMovement.quantity).toBe(2);
    });

    it('refuse d’annuler deux fois la même vente, sans toucher au stock', async () => {
      await http()
        .post(`/sales/${saleId}/cancel`)
        .set(asManager())
        .expect(409);

      // Le stock n'a pas été remis une deuxième fois
      expect((await getProduct(productBId)).quantity).toBe(stockAfterSale + 2);
    });

    it('refuse d’annuler une vente inexistante', async () => {
      await http().post('/sales/99999/cancel').set(asManager()).expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  describe('Rôles et tableau de bord', () => {
    let sellerToken: string;
    const asSeller = () => ({ Authorization: `Bearer ${sellerToken}` });

    it('le gérant crée un compte vendeur', async () => {
      const response = await http()
        .post('/users')
        .set(asManager())
        .send({
          name: 'Awa Test',
          email: 'awa@test.com',
          password: 'MotDePasse456',
        })
        .expect(201);

      // Sans rôle précisé, le compte est un vendeur, et le mot de passe n'est jamais renvoyé
      expect(response.body.role).toBe('SELLER');
      expect(response.body.password).toBeUndefined();
    });

    it('le vendeur se connecte', async () => {
      const response = await http()
        .post('/auth/login')
        .send({ email: 'awa@test.com', password: 'MotDePasse456' })
        .expect(200);

      sellerToken = response.body.accessToken;
    });

    it('le vendeur peut consulter les produits et vendre', async () => {
      await http().get('/products').set(asSeller()).expect(200);

      await http()
        .post('/sales')
        .set(asSeller())
        .send({ items: [{ productId: productBId, quantity: 1 }] })
        .expect(201);
    });

    it('le vendeur ne peut pas modifier le catalogue', async () => {
      await http()
        .post('/categories')
        .set(asSeller())
        .send({ name: 'Interdit' })
        .expect(403);

      await http()
        .delete(`/products/${productBId}`)
        .set(asSeller())
        .expect(403);
    });

    it('le vendeur ne peut pas gérer les comptes, annuler une vente ni voir le tableau de bord', async () => {
      await http().get('/users').set(asSeller()).expect(403);
      await http().post('/sales/1/cancel').set(asSeller()).expect(403);
      await http().get('/dashboard').set(asSeller()).expect(403);
    });

    it('le tableau de bord ignore les ventes annulées', async () => {
      // On recalcule à la main depuis la liste des ventes
      const sales = await http()
        .get('/sales?limit=100')
        .set(asManager())
        .expect(200);

      const completed = sales.body.data.filter(
        (sale: { status: string }) => sale.status === 'COMPLETED',
      );
      const expectedTotal = completed.reduce(
        (sum: number, sale: { total: number }) => sum + sale.total,
        0,
      );

      const dashboard = await http()
        .get('/dashboard')
        .set(asManager())
        .expect(200);

      // La vente annulée plus haut ne doit être comptée ni dans le nombre, ni dans le total
      expect(dashboard.body.salesToday.count).toBe(completed.length);
      expect(dashboard.body.salesToday.total).toBeCloseTo(expectedTotal, 2);
    });
  });

  // ---------------------------------------------------------------------------
  describe('Concurrence', () => {
    it('quand 5 ventes visent le dernier exemplaire en même temps, une seule réussit', async () => {
      // Un produit avec UN SEUL exemplaire en stock
      const created = await http()
        .post('/products')
        .set(asManager())
        .send({ name: 'Pièce unique', price: 1000, quantity: 1 })
        .expect(201);
      const lastItemId: number = created.body.id;

      // 5 ventes envoyées exactement en même temps (Promise.all lance toutes les requêtes ensemble)
      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          http()
            .post('/sales')
            .set(asManager())
            .send({ items: [{ productId: lastItemId, quantity: 1 }] }),
        ),
      );

      const statuses = results.map((result) => result.status);
      const successes = statuses.filter((status) => status === 201);
      const refusals = statuses.filter((status) => status === 400);

      // Une seule vente réussit, les quatre autres sont refusées pour stock insuffisant
      expect(successes).toHaveLength(1);
      expect(refusals).toHaveLength(4);

      // Le stock est à 0, jamais négatif : sans verrou, on aurait pu vendre plusieurs fois
      expect((await getProduct(lastItemId)).quantity).toBe(0);
    });
  });
  // ---------------------------------------------------------------------------
  describe('Gestion des comptes', () => {
    let managerId: number
    let employeeId: number
    let employeeToken: string

    // Raccourci : l'en-tête d'authentification de l'employé créé dans ce groupe
    const asEmployee = () => ({ Authorization: `Bearer ${employeeToken}` })

    it('retrouve l’identifiant du gérant et crée un compte employé', async () => {
      // On retrouve l'id du gérant dans la liste des comptes
      const users = await http().get('/users').set(asManager()).expect(200)
      managerId = users.body.find(
        (account: { email: string }) => account.email === 'gerant@test.com',
      ).id

      // Puis on crée l'employé sur lequel portent les tests suivants
      const created = await http()
        .post('/users')
        .set(asManager())
        .send({
          name: 'Marie Test',
          email: 'marie@test.com',
          password: 'AncienMotDePasse1',
        })
        .expect(201)

      employeeId = created.body.id
      expect(created.body.role).toBe('SELLER')
    })

    it('modifie le nom d’un compte, sans jamais renvoyer le mot de passe', async () => {
      const response = await http()
        .patch(`/users/${employeeId}`)
        .set(asManager())
        .send({ name: 'Marie Diop' })
        .expect(200)

      expect(response.body.name).toBe('Marie Diop')
      expect(response.body.password).toBeUndefined()
    })

    it('refuse un email déjà utilisé par un autre compte', async () => {
      await http()
        .patch(`/users/${employeeId}`)
        .set(asManager())
        .send({ email: 'gerant@test.com' })
        .expect(409)
    })

    it('réinitialise un mot de passe : le nouveau marche, l’ancien est refusé', async () => {
      await http()
        .patch(`/users/${employeeId}`)
        .set(asManager())
        .send({ password: 'NouveauMotDePasse1' })
        .expect(200)

      // L'ancien mot de passe ne marche plus
      await http()
        .post('/auth/login')
        .send({ email: 'marie@test.com', password: 'AncienMotDePasse1' })
        .expect(401)

      // Le nouveau marche : on garde le token pour les tests suivants
      const login = await http()
        .post('/auth/login')
        .send({ email: 'marie@test.com', password: 'NouveauMotDePasse1' })
        .expect(200)

      employeeToken = login.body.accessToken
    })

    it('interdit au gérant de supprimer ou de rétrograder son propre compte', async () => {
      await http().delete(`/users/${managerId}`).set(asManager()).expect(400)

      await http()
        .patch(`/users/${managerId}`)
        .set(asManager())
        .send({ role: 'SELLER' })
        .expect(400)

      // Il est toujours gérant : rien n'a changé
      const me = await http()
        .get(`/users/${managerId}`)
        .set(asManager())
        .expect(200)
      expect(me.body.role).toBe('MANAGER')
    })

    it('prend un changement de rôle en compte immédiatement, avec le même token', async () => {
      // Vendeuse : la liste des comptes lui est interdite
      await http().get('/users').set(asEmployee()).expect(403)

      // Le gérant la promeut : le MÊME token donne tout de suite accès
      await http()
        .patch(`/users/${employeeId}`)
        .set(asManager())
        .send({ role: 'MANAGER' })
        .expect(200)
      await http().get('/users').set(asEmployee()).expect(200)

      // Le gérant la rétrograde : l'accès est retiré tout de suite
      await http()
        .patch(`/users/${employeeId}`)
        .set(asManager())
        .send({ role: 'SELLER' })
        .expect(200)
      await http().get('/users').set(asEmployee()).expect(403)
    })

    it('coupe l’accès d’un compte supprimé tout de suite, sans attendre l’expiration du token', async () => {
      // Avant la suppression : le token fonctionne
      await http().get('/products').set(asEmployee()).expect(200)

      await http()
        .delete(`/users/${employeeId}`)
        .set(asManager())
        .expect(200)

      // Après : le MÊME token, encore valide pour une heure, est refusé
      await http().get('/products').set(asEmployee()).expect(401)
    })

    it('renvoie 404 pour un compte inexistant', async () => {
      await http().delete('/users/99999').set(asManager()).expect(404)
    })
  })
  // ---------------------------------------------------------------------------
  describe('Sécurité', () => {
    it('bloque la connexion après trop de tentatives (429)', async () => {
      // La limite est de 5 par minute sur /auth/login, et une connexion a déjà eu lieu plus haut
      let lastStatus = 0;
      for (let attempt = 0; attempt < 6; attempt++) {
        const response = await http()
          .post('/auth/login')
          .send({ email: 'gerant@test.com', password: 'mauvais-mot-de-passe' });
        lastStatus = response.status;
      }

      expect(lastStatus).toBe(429);
    });
  });
});