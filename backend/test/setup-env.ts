// Ce fichier s'exécute AVANT les tests.
// Il force l'utilisation d'une base de données SÉPARÉE : tes vraies données ne sont jamais touchées.
// (dotenv ne remplace pas une variable déjà définie : ces valeurs l'emportent sur le fichier .env)
process.env.DB_NAME = 'stock_manager_test';
process.env.JWT_SECRET = 'secret-utilise-uniquement-pour-les-tests';
process.env.JWT_EXPIRES_IN = '1h';