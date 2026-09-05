import NodeCache from 'node-cache';

const cache: NodeCache = new NodeCache({
  stdTTL: 3600,      // Durée de vie par défaut : 1 heure (en secondes)
  checkperiod: 120,   // Vérifie les clés expirées toutes les 2 minutes
});

export default cache;