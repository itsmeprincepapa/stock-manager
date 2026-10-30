import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

// describe : un groupe de tests. it : un test, avec ce qu'on attend d'un comportement.
describe('Stock manager (e2e)', () => {
  let app: INestApplication;

  // Le token du gérant, récupéré à l'inscription et réutilisé par les autres tests
  let managerToken: string;

  // beforeAll : s'exécute UNE FOIS avant tous les tests
  beforeAll(async () => {
    // On construit l'application complète, comme au démarrage normal
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

  describe('Authentification', () => {
    it('crée le premier compte et le met gérant', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Gérant Test',
          email: 'gerant@test.com',
          password: 'MotDePasse123',
        })
        .expect(201);

      // expect(...).toBe(...) : on vérifie ce que l'API a renvoyé
      expect(response.body.user.role).toBe('MANAGER');
      expect(response.body.accessToken).toBeDefined();
      // Le mot de passe ne doit JAMAIS apparaître dans une réponse
      expect(response.body.user.password).toBeUndefined();

      managerToken = response.body.accessToken;
    });

    it("refuse une deuxième inscription publique", async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Intrus',
          email: 'intrus@test.com',
          password: 'MotDePasse123',
        })
        .expect(403);
    });

    it('refuse une route protégée sans token', async () => {
      await request(app.getHttpServer()).get('/products').expect(401);
    });

    it('accepte une route protégée avec un token valide', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });

    it('refuse un token modifié', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${managerToken}x`)
        .expect(401);
    });
  });
});