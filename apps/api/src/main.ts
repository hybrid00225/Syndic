import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

// Les montants sont des BigInt (entiers). JSON ne sait pas les sérialiser nativement :
// on les rend sous forme de chaîne pour préserver l'exactitude (pas de perte de précision).
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS : le front (Next.js) appelle l'API depuis un autre port.
  app.enableCors({ origin: true });

  // Validation automatique des DTO sur toutes les routes.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API Syndic Alpha démarrée sur http://localhost:${port}`);
}

bootstrap();
