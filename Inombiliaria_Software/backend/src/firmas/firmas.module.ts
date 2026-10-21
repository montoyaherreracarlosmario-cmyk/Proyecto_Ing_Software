import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FirmasController } from './firmas.controller';
import { SaludController } from './salud.controller';
import { FirmasService } from './firmas.service';
import { AcuerdoSchema, NOMBRE_ACUERDO } from './model';

@Module({
  imports: [MongooseModule.forFeature([{ name: NOMBRE_ACUERDO, schema: AcuerdoSchema }])],
  controllers: [FirmasController, SaludController],
  providers: [FirmasService],
})
export class FirmasModule {}
