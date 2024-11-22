const mongoose = require('mongoose');

const PokemonSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, // Unique Pokémon ID
  name: { type: String, required: true }, // Pokémon's name
  type1: { type: String, required: true }, // Primary type
  type2: { type: String }, // Secondary type (optional)
  total: { type: Number, required: true }, // Total of all base stats
  hp: { type: Number, required: true }, // Base HP stat
  attack: { type: Number, required: true }, // Base Attack stat
  defense: { type: Number, required: true }, // Base Defense stat
  spAttack: { type: Number, required: true }, // Base Special Attack stat
  spDefense: { type: Number, required: true }, // Base Special Defense stat
  speed: { type: Number, required: true }, // Base Speed stat
  generation: { type: Number, required: true }, // Pokémon's generation
  legendary: { type: Boolean, required: true }, // Whether the Pokémon is legendary
  image: { type: String, required: true }, // Pokémon's image URL
  ytbUrl: { type: String }, // Pokémon's YouTube video URL (optional)
});

module.exports = mongoose.model('Pokemon', PokemonSchema);
