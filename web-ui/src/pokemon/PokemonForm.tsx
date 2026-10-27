import { useState, type FormEvent } from "react";
import axios from "axios";
import { API_BASE_URL } from "./api";
import "./PokemonForm.css";
interface PokemonFormProps {
  onCreated: (name: string) => void;
}
function splitNames(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
export default function PokemonForm({ onCreated }: PokemonFormProps) {
  const [name, setName] = useState("");
  const [types, setTypes] = useState("");
  const [abilities, setAbilities] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await axios.post<{ name: string }>(
        `${API_BASE_URL}/pokemon`,
        {
          name,
          types: splitNames(types),
          abilities: splitNames(abilities),
          imageUrl,
        },
      );
      setName("");
      setTypes("");
      setAbilities("");
      setImageUrl("");
      onCreated(response.data.name);
    } catch (requestError) {
      if (
        axios.isAxiosError(requestError) &&
        requestError.response?.status === 409
      ) {
        setError("A Pokémon with that name already exists.");
      } else if (
        axios.isAxiosError(requestError) &&
        requestError.response?.status === 400
      ) {
        setError(
          "Use letters, numbers, or hyphens, with one to three types and abilities.",
        );
      } else {
        setError("The Pokémon could not be created.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="pokemon-form" onSubmit={handleSubmit}>
      <h2>Create a Pokémon</h2>
      <label htmlFor="pokemon-name">Name</label>
      <input
        id="pokemon-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <label htmlFor="pokemon-types">Types</label>
      <input
        id="pokemon-types"
        value={types}
        onChange={(event) => setTypes(event.target.value)}
        placeholder="grass, poison"
      />
      <label htmlFor="pokemon-abilities">Abilities</label>
      <input
        id="pokemon-abilities"
        value={abilities}
        onChange={(event) => setAbilities(event.target.value)}
        placeholder="overgrow"
      />
      <label htmlFor="pokemon-image-url">Image URL</label>
      <input
        id="pokemon-image-url"
        value={imageUrl}
        onChange={(event) => setImageUrl(event.target.value)}
        placeholder="https://example.test/art.png"
      />
      {error ? (
        <p className="pokemon-status" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : "Create"}
      </button>
    </form>
  );
}
