import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PokemonModule } from './pokemon/pokemon.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PokemonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
