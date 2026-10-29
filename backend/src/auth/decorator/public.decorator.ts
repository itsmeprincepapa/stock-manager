import { SetMetadata } from '@nestjs/common';

// Nom de la "métadonnée" (une étiquette invisible) qu'on colle sur les routes publiques
export const IS_PUBLIC_KEY = 'isPublic';

// @Public() : à placer sur une route (ou un contrôleur) pour la rendre accessible
// sans token. SetMetadata colle l'étiquette isPublic = true sur la route ;
// le guard la lira pour décider de laisser passer.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);