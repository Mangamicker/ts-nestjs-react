import { Controller, Get, Param, Post, Query, Body } from '@nestjs/common';
import { PokemonService } from './pokemon.service.js';
import { CreatePokemonDto } from './dto/create-pokemon.dto.js';

@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}
  /**
   * Returns one page of Pokémon.
   * Query values stay strings at the HTTP boundary; the service decides which numbers are safe.
   */
  @Get()
  list(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.pokemonService.list(limit, offset);
  }

  @Get('custom')
  listCustom() {
    return this.pokemonService.listCustom();
  }

  @Get(':name')
  findOneByName(@Param('name') name: string) {
    return this.pokemonService.findByName(name);
  }

  @Post()
  create(@Body() body: CreatePokemonDto) {
    return this.pokemonService.create(body);
  }
}
