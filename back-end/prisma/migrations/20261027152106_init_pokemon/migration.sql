-- CreateEnum
CREATE TYPE "PokemonSource" AS ENUM ('POKEAPI', 'CUSTOM');

-- CreateTable
CREATE TABLE "Pokemon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "pokeapiId" INTEGER,
    "imageUrl" TEXT,
    "source" "PokemonSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pokemon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "pokemonId" INTEGER NOT NULL,

    CONSTRAINT "PokemonType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonAbility" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "pokemonId" INTEGER NOT NULL,

    CONSTRAINT "PokemonAbility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pokemon_name_key" ON "Pokemon"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Pokemon_pokeapiId_key" ON "Pokemon"("pokeapiId");

-- CreateIndex
CREATE INDEX "PokemonType_name_idx" ON "PokemonType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonType_pokemonId_name_key" ON "PokemonType"("pokemonId", "name");

-- CreateIndex
CREATE INDEX "PokemonAbility_name_idx" ON "PokemonAbility"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonAbility_pokemonId_name_key" ON "PokemonAbility"("pokemonId", "name");

-- AddForeignKey
ALTER TABLE "PokemonType" ADD CONSTRAINT "PokemonType_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonAbility" ADD CONSTRAINT "PokemonAbility_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
