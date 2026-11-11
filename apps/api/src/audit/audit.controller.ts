import {
  Controller,
  ForbiddenException,
  Get,
  Query,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { CurrentUser } from '../auth/decorators';
import { AuthUser } from '../auth/auth-user.interface';

@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('entite') entite?: string,
    @Query('entiteId') entiteId?: string,
    @Query('coproprieteId') coproprieteId?: string,
  ) {
    if (!user.adminSyndic) {
      throw new ForbiddenException("Réservé à l'administrateur du syndic");
    }
    return this.service.query(user.syndicId, {
      entite,
      entiteId,
      coproprieteId,
    });
  }
}
