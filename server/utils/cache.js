// utils/cache.js
const NodeCache = require('node-cache');
const cache = new NodeCache({
  stdTTL: 3600,      // Durée de vie par défaut : 1 heure (en secondes)
  checkperiod: 120,   // Vérifie les clés expirées toutes les 2 minutes
});

module.exports = cache;