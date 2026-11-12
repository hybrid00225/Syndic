import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

interface Reponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

// Traduit une erreur Prisma connue en réponse HTTP neutre (aucun détail interne).
export function depuisPrisma(e: unknown): Reponse | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2002':
        return { statusCode: 409, error: 'Conflict', message: 'Cette valeur est déjà utilisée (doublon)' };
      case 'P2025':
      case 'P2001':
        return { statusCode: 404, error: 'Not Found', message: 'Ressource introuvable' };
      case 'P2003':
      case 'P2014':
        return { statusCode: 409, error: 'Conflict', message: "Opération impossible : la ressource est liée à d'autres données" };
      case 'P2000':
      case 'P2006':
      case 'P2007':
      case 'P2020':
        return { statusCode: 400, error: 'Bad Request', message: 'Valeur invalide ou hors limites' };
      default:
        return null;
    }
  }
  if (e instanceof Prisma.PrismaClientValidationError) {
    return { statusCode: 400, error: 'Bad Request', message: 'Requête invalide' };
  }
  return null;
}

// Filtre global : les HttpException passent telles quelles ; les erreurs Prisma
// connues sont traduites ; tout le reste → 500 générique, détail journalisé
// côté serveur uniquement (pas de stack ni de message interne vers le client).
@Catch()
export class ToutesExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    if (res.headersSent) return;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= 500) {
        this.logger.error(`${req.method} ${req.originalUrl} → ${status}`, exception.stack);
      }
      const corps = exception.getResponse();
      res
        .status(status)
        .json(typeof corps === 'string' ? { statusCode: status, message: corps } : corps);
      return;
    }

    const prisma = depuisPrisma(exception);
    if (prisma) {
      if (prisma.statusCode >= 400) {
        this.logger.warn(
          `${req.method} ${req.originalUrl} → ${prisma.statusCode} (${(exception as { code?: string }).code ?? 'validation'})`,
        );
      }
      res.status(prisma.statusCode).json(prisma);
      return;
    }

    this.logger.error(
      `${req.method} ${req.originalUrl} → 500`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Erreur interne du serveur',
    });
  }
}
