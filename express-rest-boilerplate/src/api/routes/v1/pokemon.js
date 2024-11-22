const express = require("express");
const multer = require("multer");
const csvParser = require("csv-parser");
const fs = require("fs");
const Pokemon = require("../../models/pokemon.model");
const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth');

const router = express.Router();
const upload = multer({ dest: "uploads/" });
// Import Pokémon
router.post("/import", authorize(), upload.single("file"), async (req, res) => {
    const filePath = req.file.path;
    const pokemons = [];
  
    // Get the current highest 'id' in the database
    const highestIdDoc = await Pokemon.findOne().sort({ id: -1 }).select('id');
    let highestId = highestIdDoc ? highestIdDoc.id : 0;
  
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => {
        // If the 'id' is missing or a duplicate, generate a unique id
        if (!data.id || data.id <= highestId) {
          highestId++;  // Increment to the next available id
          data.id = highestId;  // Assign the new id
        }
  
        pokemons.push(data);
      })
      .on("end", async () => {
        try {
          // Insert the pokemons data into the database
          await Pokemon.insertMany(pokemons, { ordered: false });
          fs.unlinkSync(filePath); // Clean up the uploaded file
          res.status(201).json({ message: "Pokémon imported successfully" });
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: "Error importing Pokémon", error: error.message });
        }
      });
  });
  
  

router.get('/', authorize(), async (req, res) => {
  const { page = 1, limit = 20, type1, type2, legendary } = req.query;
  const query = {};
  if (type1) query.type1 = type1;
  if (type2) query.type2 = type2;
  if (legendary) query.legendary = legendary === 'true';
  const pokemons = await Pokemon.find(query)
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const userFavorites = req.user.favorites.map((fav) => fav.toString());
  const results = pokemons.map((pokemon) => {
    const pokemonObj = pokemon.toObject();
    pokemonObj.is_favorite = userFavorites.includes(pokemon._id.toString());
    return pokemonObj;
  });
  res.json(results);
});

router.get("/:id", authorize(), async (req, res) => {
    const pokemon = await Pokemon.findById(req.params.id);
    if (!pokemon) {
      return res.status(404).json({ message: "Pokémon not found" });
    }
    res.json(pokemon);
  });

  
  
module.exports = router;
