const express = require("express");
const User = require('../../models/user.model');
const { authorize } = require("../../middlewares/auth");
const Pokemon = require("../../models/pokemon.model");

const router = express.Router();

// Mark/Unmark Favorite
router.post("/:id", authorize(), async (req, res) => {
  const { action } = req.body; // 'mark' or 'unmark'
  const pokemonId = req.params.id;

  if (!pokemonId || !["mark", "unmark"].includes(action)) {
    return res.status(400).json({ message: "Invalid request" });
  }

  const user = req.user;

  if (action === "mark" && !user.favorites.includes(pokemonId)) {
    user.favorites.push(pokemonId);
  } else if (action === "unmark") {
    user.favorites = user.favorites.filter((fav) => fav !== pokemonId);
  }

  await user.save();
  res.json({ message: `Pokemon ${action}ed as favorite` });
});

router.get("/", authorize(), async (req, res) => {
    try {
      // Populate danh sách các Pokémon yêu thích của người dùng
      await req.user.populate("favorites");
  
      // Lấy danh sách các Pokémon yêu thích từ user
      const favorites = req.user.favorites;
  
      // Nếu người dùng không có favorites, trả về một mảng rỗng
      if (!favorites || favorites.length === 0) {
        return res.json([]);
      }
  
      // Lấy thông tin chi tiết của tất cả các Pokémon yêu thích
      const pokemonIds = favorites.map((fav) => fav._id);  // Lấy danh sách ID của Pokémon yêu thích
  
      // Truy vấn thông tin chi tiết của tất cả các Pokémon yêu thích
      const pokemons = await Pokemon.find({ _id: { $in: pokemonIds } });
  
      // Map dữ liệu Pokémon để trả về đầy đủ thông tin
      const result = pokemons.map((pokemon) => {
        return pokemon.toObject(); // Chuyển đổi từ mongoose document sang plain object
      });
  
      // Trả về danh sách Pokémon yêu thích với đầy đủ thông tin
      res.json(result);
      
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi khi lấy danh sách Pokémon yêu thích", error: err.message });
    }
  });
  
  
module.exports = router;
