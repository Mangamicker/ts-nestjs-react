import { useEffect, useState } from "react";
import axios from "axios";
import "./PokemonList.css";

interface PokemonSummary {
  name: string;
  url: string;
}

interface PokemonPage {
  count: number;
  results: PokemonSummary[];
}

const API_BASE_URL = "http://localhost:3000";

export default function PokemonList() {
  const [page, setPage] = useState<PokemonPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, serIsLoading] = useState(true);

  /**
   * Load the first page after React has painted this component.
   * Aborting the request covers React StrictMode, which runs this effect twice in development.
   */
  useEffect(() => {
    const controller = new AbortController();
    const fetchPokemon = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/pokemon`, {
          params: {
            limit: 20,
            offset: 0,
          },
          signal: controller.signal, // abort the request if the component unmounts
        });
        setPage(response.data);
        setError(null);
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }
        if (axios.isCancel(error)) {
          return;
        }
        setPage(null);
        setError("The Pokémon list could not be loaded.");
      } finally {
        serIsLoading(false);
      }
    };
    fetchPokemon();
    return () => {
      controller.abort();
    };
  }, []);

  if (isLoading) {
    return <p className="pokemon-status">Loading Pokémon…</p>;
  }

  if (error) {
    return <p className="pokemon-status">Error: {error}</p>;
  }

  return (
    <section className="pokemon-page">
      <h1>Pokémon</h1>
      <p>{page?.count ?? 0} total</p>
      <ul>
        {page?.results.map((pokemon) => (
          <li key={pokemon.name}>{pokemon.name}</li>
        ))}
      </ul>
    </section>
  );
}
