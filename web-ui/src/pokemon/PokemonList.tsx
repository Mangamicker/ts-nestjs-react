import { useEffect, useState } from "react";
import axios from "axios";
import PokemonDetail from "./PokemonDetail";
import PokemonForm from "./PokemonForm";
import { API_BASE_URL } from "./api";

import "./PokemonList.css";

interface PokemonSummary {
  name: string;
  url: string;
}

interface PokemonPage {
  count: number;
  results: PokemonSummary[];
}

const PAGE_SIZE = 20;

export default function PokemonList() {
  const [page, setPage] = useState<PokemonPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [customNames, setCustomNames] = useState<string[]>([]);

  /**
   * Load the page for the current offset.
   * Aborting the previous request covers a fast page change and React StrictMode.
   */
  useEffect(() => {
    const controller = new AbortController();
    const fetchPokemon = async () => {
      try {
        const response = await axios.get<PokemonPage>(
          `${API_BASE_URL}/pokemon`,
          {
            params: {
              limit: PAGE_SIZE,
              offset,
            },
            signal: controller.signal, // abort the request if the component unmounts
          },
        );
        setPage(response.data);
        setError(null);
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }
        setPage(null);
        setError("The Pokémon list could not be loaded.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    fetchPokemon();
    return () => {
      controller.abort();
    };
  }, [offset]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCustomPokemon() {
      try {
        const response = await axios.get<{ name: string }[]>(
          `${API_BASE_URL}/pokemon/custom`,
          { signal: controller.signal },
        );
        setCustomNames(response.data.map((pokemon) => pokemon.name));
      } catch (requestError) {
        if (!axios.isCancel(requestError)) {
          setCustomNames([]);
        }
      }
    }
    void loadCustomPokemon();
    return () => controller.abort();
  }, []);

  function handleCreated(name: string) {
    setCustomNames((current) => {
      if (current.includes(name)) {
        return current;
      }
      return [...current, name].sort((left, right) =>
        left.localeCompare(right),
      );
    });
    setSelectedName(name);
  }

  const handlePrevious = () => {
    if (isLoading || isFirstPage) return;
    setIsLoading(true);
    setError(null);
    setPage(null);
    setOffset((current) => Math.max(0, current - PAGE_SIZE));
  };

  const handleNext = () => {
    if (isLoading || !hasNextPage) return;
    setIsLoading(true);
    setError(null);
    setPage(null);
    setOffset((current) => current + PAGE_SIZE);
  };

  const showingFrom = (page?.results.length ?? 0) > 0 ? offset + 1 : 0;
  const showingTo = offset + (page?.results.length ?? 0);
  const isFirstPage = offset === 0;
  const hasNextPage = page !== null && offset + PAGE_SIZE < page.count;

  return (
    <section className="pokemon-page">
      <h1>Pokémon</h1>
      <PokemonForm onCreated={handleCreated} />
      <h2>Your Pokémon</h2>
      {customNames.length === 0 ? (
        <p>No custom Pokémon yet.</p>
      ) : (
        <ul>
          {customNames.map((pokemonName) => (
            <li key={pokemonName}>
              <button
                type="button"
                className="pokemon-name"
                aria-pressed={pokemonName === selectedName}
                onClick={() => setSelectedName(pokemonName)}
              >
                {pokemonName}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="pokemon-pager">
        <button
          type="button"
          disabled={isLoading || isFirstPage}
          onClick={handlePrevious}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={isLoading || !hasNextPage}
          onClick={handleNext}
        >
          Next
        </button>
      </div>
      {selectedName ? (
        <PokemonDetail key={selectedName} name={selectedName} />
      ) : (
        <p className="pokemon-status">Select a Pokémon to see its details.</p>
      )}
      {isLoading ? (
        <p className="pokemon-status">Loading Pokémon…</p>
      ) : error ? (
        <p className="pokemon-status" role="alert">
          {error}
        </p>
      ) : (
        <>
          <p>
            Showing {showingFrom}–{showingTo} of {page?.count ?? 0}
          </p>
          <ul>
            {page?.results.map((pokemon) => (
              <li key={pokemon.name}>
                <button
                  type="button"
                  className="pokemon-name"
                  aria-pressed={pokemon.name === selectedName}
                  onClick={() => setSelectedName(pokemon.name)}
                >
                  {pokemon.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
