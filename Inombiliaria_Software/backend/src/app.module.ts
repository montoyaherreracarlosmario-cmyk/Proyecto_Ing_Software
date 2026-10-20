import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InmueblesModule } from './inmuebles/inmuebles.module';
import { FirmasModule } from './firmas/firmas.module';
import { ImagenesModule } from './imagenes/imagenes.module';
import { FiltroApi } from './filtros';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Conexión a MongoDB Atlas: se configura con la variable MONGODB_URI (.env)
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI') || 'mongodb://127.0.0.1:27017/habitat-capital',
      }),
    }),
    InmueblesModule,
    FirmasModule,
    ImagenesModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: FiltroApi }],
})
export class AppModule {}
