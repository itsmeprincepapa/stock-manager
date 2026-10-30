// Forme de la réponse d'une liste paginée
export interface Paginated<T> {
  // Les éléments de la page demandée
  data: T[];
  // Les informations pour naviguer entre les pages
  meta: {
    total: number; // nombre total d'éléments (toutes pages confondues)
    page: number; // page actuelle
    limit: number; // éléments par page
    totalPages: number; // nombre total de pages
  };
}

// Construit la réponse paginée à partir des éléments de la page et du total.
// <T> est un type générique : la fonction marche pour des produits, des ventes, etc.
export function toPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      // Math.ceil arrondit à l'entier supérieur : 137 éléments / 20 = 6,85 -> 7 pages
      totalPages: Math.ceil(total / limit),
    },
  };
}