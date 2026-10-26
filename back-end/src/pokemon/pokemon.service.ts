import { BadGatewayException, Injectable } from '@nestjs/common';
import axios from 'axios';

export interface PokemonSummary {
  name: string;
  url: string;
}

export interface PokemonPage {
  count: number;
  results: PokemonSummary[];
}

const POKEMON_API_URL = 'https://pokeapi.co/api/v2/pokemon';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const REQUEST_TIMEOUT_MS = 5000;

@Injectable()
export class PokemonService {
  /**
   * Loads one page of Pokémon from PokéAPI.
   * Raw query strings are normalized here so a request cannot ask for an unbounded page.
   */
  async list(limitParam?: string, offsetParam?: string): Promise<PokemonPage> {
    const limit = this.parseLimit(limitParam);
    const offset = this.parseOffset(offsetParam);

    try {
      const response = await axios.get<PokemonPage>(POKEMON_API_URL, {
        params: {
          limit,
          offset,
        },
        timeout: REQUEST_TIMEOUT_MS,
      });
      const { count, results } = response.data;

      if (typeof count !== 'number' || !Array.isArray(results)) {
        throw new BadGatewayException('Invalid Pokémon page response');
      }

      return {
        count,
        results: results.map(({ name, url }) => ({ name, url })),
      };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      throw new BadGatewayException('PokéAPI is unavailable', { cause: error });
    }
  }

  private parseLimit(value: string | undefined): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return DEFAULT_LIMIT;
    }
    return Math.min(parsed, MAX_LIMIT);
  }

  private parseOffset(value: string | undefined): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  }
}
