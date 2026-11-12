// Validation de la configuration au démarrage (fail fast).
// Appelée par ConfigModule.forRoot({ validate }) : si une variable critique est
// absente ou faible, l'API refuse de démarrer plutôt que de tourner en mode dégradé.

const SECRETS_INTERDITS = ['change-me', 'changeme', 'secret', 'jwt-secret'];
export const LONGUEUR_MIN_SECRET = 32;

export function validerEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const erreurs: string[] = [];

  const secret = String(config.JWT_SECRET ?? '');
  if (!secret) {
    erreurs.push('JWT_SECRET est obligatoire');
  } else if (
    SECRETS_INTERDITS.includes(secret.toLowerCase()) ||
    /[<>]/.test(secret) // gabarit de .env.example non remplacé
  ) {
    erreurs.push('JWT_SECRET utilise une valeur par défaut connue : générez un secret aléatoire');
  } else if (secret.length < LONGUEUR_MIN_SECRET) {
    erreurs.push(`JWT_SECRET doit contenir au moins ${LONGUEUR_MIN_SECRET} caractères`);
  }

  if (!config.DATABASE_URL) {
    erreurs.push('DATABASE_URL est obligatoire');
  }

  const expiration = String(config.JWT_EXPIRES_IN ?? '');
  if (expiration && !/^\d+[smhd]?$/.test(expiration)) {
    erreurs.push('JWT_EXPIRES_IN invalide (ex. « 12h », « 7d », « 3600 »)');
  }

  if (erreurs.length) {
    throw new Error(
      `Configuration invalide :\n - ${erreurs.join('\n - ')}\n` +
        'Astuce : node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"',
    );
  }
  return config;
}

// Origines CORS autorisées (liste séparée par des virgules).
export function originesCors(valeur?: string): string[] {
  return (valeur ?? 'http://localhost:3012')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}
