const express = require('express');
const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const pokemonRoutes = require('./pokemon');
const favoritesRoutes = require('./favorites');

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

/**
 * GET v1/docs
 */
router.use('/docs', express.static('docs'));
router.use('/users', userRoutes);
router.use('/pokemons', pokemonRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/auth', authRoutes);

module.exports = router;
