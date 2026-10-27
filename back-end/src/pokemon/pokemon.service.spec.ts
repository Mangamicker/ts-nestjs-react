import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { PokemonService } from './pokemon.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

function createPrismaStub(
  findFirst: () => Promise<unknown> = async () => null,
) {
  return {
    pokemon: {
      findFirst: vi.fn(findFirst),
      create: vi.fn(async () => ({})),
    },
  } as unknown as PrismaService;
}

describe('PokemonService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a page of names from PokéAPI', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({
      data: {
        count: 2,
        results: [
          { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
          { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
        ],
      },
    } as Awaited<ReturnType<typeof axios.get>>);

    const page = await new PokemonService(createPrismaStub()).list('2', '0');

    expect(page).toEqual({
      count: 2,
      results: [
        { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
        { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
      ],
    });
    expect(axios.get).toHaveBeenCalledWith(
      'https://pokeapi.co/api/v2/pokemon',
      expect.objectContaining({
        params: { limit: 2, offset: 0 },
        timeout: 5000,
      }),
    );
  });

  it('reports a bad gateway when PokéAPI cannot be reached', async () => {
    vi.spyOn(axios, 'get').mockRejectedValue(new Error('network down'));

    await expect(
      new PokemonService(createPrismaStub()).list(),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('returns the fields needed for a detail view', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({
      data: {
        id: 1,
        name: 'bulbasaur',
        height: 7,
        types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
        abilities: [
          { ability: { name: 'overgrow' } },
          { ability: { name: 'chlorophyll' } },
        ],
        sprites: {
          front_default: 'https://example.test/front.png',
          other: {
            'official-artwork': {
              front_default: 'https://example.test/art.png',
            },
          },
        },
      },
    } as Awaited<ReturnType<typeof axios.get>>);
    const prisma = createPrismaStub();
    const detail = await new PokemonService(prisma).findByName('Bulbasaur');
    expect(detail).toEqual({
      id: 1,
      name: 'bulbasaur',
      types: ['grass', 'poison'],
      abilities: ['overgrow', 'chlorophyll'],
      imageUrl: 'https://example.test/art.png',
    });
    expect(axios.get).toHaveBeenCalledWith(
      'https://pokeapi.co/api/v2/pokemon/bulbasaur',
      expect.objectContaining({ timeout: 5000 }),
    );
    expect(prisma.pokemon.create).toHaveBeenCalledOnce();
  });

  it('rejects an invalid name before calling PokéAPI', async () => {
    const get = vi.spyOn(axios, 'get');
    const prisma = createPrismaStub();
    await expect(
      new PokemonService(prisma).findByName('bad name'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(get).not.toHaveBeenCalled();
    expect(prisma.pokemon.findFirst).not.toHaveBeenCalled();
  });

  it('returns not found when PokéAPI has no such Pokémon', async () => {
    const notFound = new AxiosError('not found');
    notFound.response = { status: 404 } as typeof notFound.response;
    vi.spyOn(axios, 'get').mockRejectedValue(notFound);
    await expect(
      new PokemonService(createPrismaStub()).findByName('missingno'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns a stored Pokémon without calling PokéAPI', async () => {
    const prisma = createPrismaStub(async () => ({
      id: 10,
      name: 'bulbasaur',
      pokeapiId: 1,
      imageUrl: 'https://example.test/art.png',
      source: 'POKEAPI',
      types: [{ name: 'grass' }, { name: 'poison' }],
      abilities: [{ name: 'overgrow' }, { name: 'chlorophyll' }],
    }));
    const get = vi.spyOn(axios, 'get');
    const detail = await new PokemonService(prisma).findByName('bulbasaur');
    expect(detail).toEqual({
      id: 1,
      name: 'bulbasaur',
      types: ['grass', 'poison'],
      abilities: ['overgrow', 'chlorophyll'],
      imageUrl: 'https://example.test/art.png',
      cached: true,
    });
    expect(get).not.toHaveBeenCalled();
    expect(prisma.pokemon.create).not.toHaveBeenCalled();
  });
});
