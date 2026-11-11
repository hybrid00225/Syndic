import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

const METHODES_MUTANTES = ['POST', 'PATCH', 'PUT', 'DELETE'];

// Journalise automatiquement chaque opération mutante réussie (fire-and-forget,
// ne bloque ni ne fait échouer la requête).
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const mutante = METHODES_MUTANTES.includes(req.method);

    return next.handle().pipe(
      tap((resultat) => {
        if (!mutante || !req.user) return;
        void this.audit.enregistrer(req, resultat).catch(() => {
          /* l'audit ne doit jamais casser l'API */
        });
      }),
    );
  }
}
