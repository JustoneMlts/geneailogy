// server.js - Serveur Express pour géocodage
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // npm install node-fetch@2

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Permet les requêtes cross-origin
app.use(express.json());

// Endpoint pour le géocodage
app.get('/api/geocode', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Paramètre de recherche requis (minimum 2 caractères)' });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(q)}&` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=10&` +
      `accept-language=fr`,
      {
        headers: {
          'User-Agent': 'LocationSelectorApp/1.0 (your-email@domain.com)' // Recommandé par Nominatim
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur Nominatim: ${response.status}`);
    }

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error('Erreur géocodage:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche de lieux' });
  }
});

// Endpoint de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = app;