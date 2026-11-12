import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { RoleType } from '@prisma/client';
import { DocumentService, FichierUpload } from './document.service';
import { CurrentUser, Roles } from '../auth/decorators';
import { AuthUser } from '../auth/auth-user.interface';

@Controller()
export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  // Téléversement multipart (champ « fichier »).
  @Roles(RoleType.GESTIONNAIRE)
  @Post('coproprietes/:coproprieteId/documents')
  @UseInterceptors(FileInterceptor('fichier'))
  upload(
    @CurrentUser() user: AuthUser,
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @UploadedFile() fichier?: FichierUpload,
  ) {
    return this.service.upload(user.syndicId, coproprieteId, fichier);
  }

  @Get('documents/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const doc = await this.service.findOne(id);
    return {
      id: doc.id,
      nomOriginal: doc.nomOriginal,
      mimeType: doc.mimeType,
      taille: doc.taille,
      createdAt: doc.createdAt,
    };
  }

  @Get('documents/:id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { doc, flux } = await this.service.pourTelechargement(id);
    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(doc.nomOriginal)}"`,
    });
    return new StreamableFile(flux);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Delete('documents/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
