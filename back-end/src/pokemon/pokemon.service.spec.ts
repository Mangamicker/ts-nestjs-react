import { BadGatewayException } from '@nestjs/common';
import axios from 'axios';
import { PokemonService } from './pokemon.service.js';

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

    const page = await new PokemonService().list('2', '0');

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

    await expect(new PokemonService().list()).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
