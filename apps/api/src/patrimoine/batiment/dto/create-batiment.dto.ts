import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBatimentDto {
  @IsString()
  @IsNotEmpty()
  nom: string;
}
