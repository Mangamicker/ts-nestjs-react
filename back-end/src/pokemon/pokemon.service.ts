import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import axios from 'axios';

export interface PokemonSummary {
  name: string;
  url: string;
}

export interface PokemonPage {
  count: number;
  results: PokemonSummary[];
}

export interface PokemonDetail {
  id: number;
  name: string;
  types: string[];
  abilities: string[];
  imageUrl: string | null;
  cached?: boolean;
}

const POKEMON_API_URL = 'https://pokeapi.co/api/v2/pokemon';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const REQUEST_TIMEOUT_MS = 5000;
const POKEMON_NAME_PATTERN = /^[a-z0-9-]+$/;

@Injectable()
export class PokemonService {
  constructor(private readonly prisma: PrismaService) {}

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

  /**
   * Loads one Pokémon from PokéAPI.
   * The name is checked locally so an invalid value never becomes an upstream request.
   */
  async findByName(name: string): Promise<PokemonDetail> {
    const sanitizedName = name.trim().toLowerCase();
    if (!POKEMON_NAME_PATTERN.test(sanitizedName)) {
      throw new BadRequestException('Invalid Pokémon name');
    }

    const storedPokemon = await this.findStoredPokemon(sanitizedName);
    if (storedPokemon) {
      return storedPokemon;
    }

    let pokemonDetail: PokemonDetail;
    try {
      const response = await axios.get<unknown>(
        `${POKEMON_API_URL}/${sanitizedName}`,
        {
          timeout: REQUEST_TIMEOUT_MS,
        },
      );
      pokemonDetail = this.toPokemonDetail(response.data);
    } catch (error) {
      this.rethrowPokeApiError(
        error,
        `Pokémon "${sanitizedName}" was not found`,
      );
    }

    await this.savePokeApiDetail(pokemonDetail);
    return pokemonDetail;
  }
  /** Keeps the fields our app shows and rejects a payload that does not contain them. */
  private toPokemonDetail(payload: unknown): PokemonDetail {
    if (!isRecord(payload)) {
      throw new BadGatewayException(
        'PokéAPI returned an unexpected Pokémon payload',
      );
    }
    const types = readNamedValues(payload.types, 'type');
    const abilities = readNamedValues(payload.abilities, 'ability');
    if (
      typeof payload.id !== 'number' ||
      typeof payload.name !== 'string' ||
      types === null ||
      abilities === null ||
      !isRecord(payload.sprites)
    ) {
      throw new BadGatewayException(
        'PokéAPI returned an unexpected Pokémon payload',
      );
    }
    return {
      id: payload.id,
      name: payload.name,
      types,
      abilities,
      imageUrl: readImageUrl(payload.sprites),
    };
  }

  /**
   * Passes our own HTTP errors through.
   * A 404 from PokéAPI becomes a 404 only when the caller was looking up one Pokémon.
   */
  private rethrowPokeApiError(error: unknown, notFoundMessage?: string): never {
    if (error instanceof HttpException) {
      throw error;
    }
    if (
      notFoundMessage &&
      axios.isAxiosError(error) &&
      error.response?.status === 404
    ) {
      throw new NotFoundException(notFoundMessage);
    }
    throw new BadGatewayException('PokéAPI is unavailable', { cause: error });
  }

  /** A numeric segment is a PokéAPI id. Any other accepted value is a name. */
  private async findStoredPokemon(
    nameOrId: string,
  ): Promise<PokemonDetail | null> {
    const isPokeapiId = /^[0-9]+$/.test(nameOrId);
    const pokemon = await this.prisma.pokemon.findFirst({
      where: isPokeapiId ? { pokeapiId: Number(nameOrId) } : { name: nameOrId },
      include: {
        types: { orderBy: { name: 'asc' } },
        abilities: { orderBy: { name: 'asc' } },
      },
    });

    if (!pokemon) {
      return null;
    }

    return {
      id: pokemon.pokeapiId ?? pokemon.id,
      name: pokemon.name,
      types: pokemon.types.map((type) => type.name),
      abilities: pokemon.abilities.map((ability) => ability.name),
      imageUrl: pokemon.imageUrl,
      cached: pokemon.source !== 'CUSTOM',
    };
  }

  /**
   * Stores one PokéAPI Pokémon and its related rows.
   * A unique-name conflict means another request stored it first.
   */
  private async savePokeApiDetail(detail: PokemonDetail): Promise<void> {
    try {
      await this.prisma.pokemon.create({
        data: {
          name: detail.name,
          pokeapiId: detail.id,
          imageUrl: detail.imageUrl,
          source: 'POKEAPI',
          types: { create: detail.types.map((name) => ({ name })) },
          abilities: { create: detail.abilities.map((name) => ({ name })) },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return;
      }
      throw error;
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Reads nested `type.name` or `ability.name` values. Returns null when an entry is malformed. */
function readNamedValues(
  value: unknown,
  key: 'type' | 'ability',
): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const names: string[] = [];
  for (const entry of value) {
    const nested = isRecord(entry) ? entry[key] : undefined;
    if (!isRecord(nested) || typeof nested.name !== 'string') {
      return null;
    }
    names.push(nested.name);
  }
  return names;
}

function readImageUrl(sprites: Record<string, unknown>): string | null {
  const other = sprites.other;
  if (isRecord(other)) {
    const artwork = other['official-artwork'];
    if (isRecord(artwork) && typeof artwork.front_default === 'string') {
      return artwork.front_default;
    }
  }
  return typeof sprites.front_default === 'string'
    ? sprites.front_default
    : null;
}
