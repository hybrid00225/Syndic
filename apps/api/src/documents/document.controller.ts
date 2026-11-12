import {
  BadRequestException,
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
import {
  contentDisposition,
  LIBELLE_FORMATS,
  mimeDeService,
  TAILLE_MAX,
  typeDeclareAutorise,
} from './fichiers-autorises';

@Controller()
export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  // Téléversement multipart (champ « fichier »). Taille et type filtrés dès
  // Multer (avant mise en mémoire complète), puis signature vérifiée au service.
  @Roles(RoleType.GESTIONNAIRE)
  @Post('coproprietes/:coproprieteId/documents')
  @UseInterceptors(
    FileInterceptor('fichier', {
      limits: { fileSize: TAILLE_MAX, files: 1, fields: 5, parts: 6 },
      fileFilter: (_req, file, cb) => {
        if (typeDeclareAutorise(file.originalname, file.mimetype)) cb(null, true);
        else cb(new BadRequestException(`Format non autorisé : ${LIBELLE_FORMATS} uniquement`), false);
      },
    }),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @UploadedFile() fichier?: FichierUpload,
  ) {
    return this.service.upload(user.syndicId, coproprieteId, fichier);
  }

  @Get('documents/:id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const doc = await this.service.findOne(user.syndicId, id);
    return {
      id: doc.id,
      nomOriginal: doc.nomOriginal,
      mimeType: doc.mimeType,
      taille: doc.taille,
      createdAt: doc.createdAt,
    };
  }

  // Toujours en pièce jointe, type MIME dérivé de l'extension validée, nosniff.
  @Get('documents/:id/download')
  async download(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { doc, flux } = await this.service.pourTelechargement(user.syndicId, id);
    res.set({
      'Content-Type': mimeDeService(doc.nomOriginal),
      'Content-Disposition': contentDisposition(doc.nomOriginal),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    });
    return new StreamableFile(flux);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Delete('documents/:id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(user.syndicId, id);
  }
}
