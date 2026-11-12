import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { originesCors } from './config/env';
import { ToutesExceptionsFilter } from './common/filters/toutes-exceptions.filter';

// Les montants sont des BigInt (entiers). JSON ne sait pas les sérialiser nativement :
// on les rend sous forme de chaîne pour préserver l'exactitude (pas de perte de précision).
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

// Taille max des corps JSON / formulaires (les fichiers passent par multer, borné à part).
const LIMITE_CORPS = '1mb';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  // bodyParser désactivé : on installe le nôtre (limite + erreurs propres).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) {
    // Derrière un reverse proxy : nécessaire pour que la limitation de débit voie l'IP réelle.
    app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY);
  }

  // En-têtes de sécurité. API JSON pure : CSP stricte, pas de ressources servies.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  app.use(json({ limit: LIMITE_CORPS }));
  app.use(urlencoded({ extended: false, limit: LIMITE_CORPS }));
  // Erreurs du parseur (JSON invalide, corps trop gros) : réponse neutre, sans stack.
  app.use(
    (
      err: { status?: number; type?: string },
      _req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      if (!err) return next();
      const status = err.status && err.status < 500 ? err.status : 400;
      res.status(status).json({
        statusCode: status,
        error: status === 413 ? 'Payload Too Large' : 'Bad Request',
        message:
          status === 413 ? 'Corps de requête trop volumineux' : 'Corps de requête invalide',
      });
    },
  );

  // CORS : uniquement les origines déclarées (CORS_ORIGINS, séparées par des virgules).
  // Authentification par en-tête Bearer : pas de cookies, donc pas de credentials.
  const origines = originesCors(process.env.CORS_ORIGINS);
  app.enableCors({
    origin: origines,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    exposedHeaders: ['Content-Disposition'],
    credentials: false,
    maxAge: 600,
  });

  // Validation automatique des DTO : propriétés inconnues refusées (400).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ToutesExceptionsFilter());
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3013;
  await app.listen(port);
  logger.log(`API Syndic Alpha démarrée sur http://localhost:${port}`);
  logger.log(`CORS autorisé pour : ${origines.join(', ')}`);
}

bootstrap();
