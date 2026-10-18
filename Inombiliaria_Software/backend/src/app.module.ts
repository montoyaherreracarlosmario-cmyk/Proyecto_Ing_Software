import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InmueblesModule } from './inmuebles/inmuebles.module';

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
  ],
})
export class AppModule {}
