import { Controller, Get, Query } from '@nestjs/common';
import { PokemonService } from './pokemon.service.js';

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
}
