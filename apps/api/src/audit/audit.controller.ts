import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { CurrentUser, AdminSyndic } from '../auth/decorators';
import { AuthUser } from '../auth/auth-user.interface';

@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @AdminSyndic()
  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('entite') entite?: string,
    @Query('entiteId') entiteId?: string,
    @Query('coproprieteId') coproprieteId?: string,
  ) {
    return this.service.query(user.syndicId, {
      entite,
      entiteId,
      coproprieteId,
    });
  }
}
