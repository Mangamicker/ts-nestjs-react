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
const PAGE_SIZE = 20;

export default function PokemonList() {
  const [page, setPage] = useState<PokemonPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);

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
              <li key={pokemon.name}>{pokemon.name}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
