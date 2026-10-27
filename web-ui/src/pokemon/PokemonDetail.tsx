import { useEffect, useState } from "react";
import { API_BASE_URL } from "./api";
import axios from "axios";
import "./PokemonDetail.css";

interface PokemonDetailProps {
  name: string;
}

interface PokemonDetailData {
  id: number;
  name: string;
  types: string[];
  abilities: string[];
  imageUrl: string | null;
  cached?: boolean;
  source?: "POKEAPI" | "CUSTOM";
}

export default function PokemonDetail({ name }: PokemonDetailProps) {
  const [pokemonDetail, setPokemonDetail] = useState<PokemonDetailData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchPokemon = async () => {
      try {
        const response = await axios.get<PokemonDetailData>(
          `${API_BASE_URL}/pokemon/${name}`,
          {
            signal: controller.signal,
          },
        );
        setPokemonDetail(response.data);
        setError(null);
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }
        setPokemonDetail(null);
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setError(`No Pokémon named ${name} was found.`);
        } else {
          setError("The Pokémon details could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    fetchPokemon();
    return () => controller.abort();
  }, [name]);

  if (isLoading) {
    return <p className="pokemon-status">Loading {name}…</p>;
  }
  if (error || !pokemonDetail) {
    return (
      <p className="pokemon-status" role="alert">
        {error ?? "The Pokémon details could not be loaded."}
      </p>
    );
  }

  return (
    <article className="pokemon-detail">
      <h2>{pokemonDetail.name}</h2>
      {pokemonDetail.source === "CUSTOM" ? (
        <p className="pokemon-tag">Custom</p>
      ) : pokemonDetail.cached ? (
        <p className="pokemon-tag">Cached</p>
      ) : null}
      {pokemonDetail.imageUrl ? (
        <img src={pokemonDetail.imageUrl} alt="" width="160" height="160" />
      ) : (
        <p>No image is available.</p>
      )}
      <p>#{pokemonDetail.id}</p>
      <h3>Types</h3>
      <ul>
        {pokemonDetail.types.map((type) => (
          <li key={type}>{type}</li>
        ))}
      </ul>
      <h3>Abilities</h3>
      <ul>
        {pokemonDetail.abilities.map((ability) => (
          <li key={ability}>{ability}</li>
        ))}
      </ul>
    </article>
  );
}
