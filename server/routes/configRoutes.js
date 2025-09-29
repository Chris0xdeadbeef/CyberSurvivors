// server/routes/configRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// ✅ Route GET /config/virus-types
router.get('/virus-types', (req, res) => {
  const filePath = path.join(__dirname, '../../shared/config/VirusConfig.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error("❌ Erreur lecture VirusConfig:", err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  });
});

// ✅ Route GET /config/game-items
router.get('/game-items', (req, res) => {
  const filePath = path.join(__dirname, '../../shared/config/ItemsConfig.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error("❌ Erreur lecture ItemsConfig:", err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  });
});

// ✅ Route GET /config/shop
router.get('/shop', (req, res) => {
  const filePath = path.join(__dirname, '../../shared/config/ShopConfig.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error("❌ Erreur lecture ShopConfig:", err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  });
});

module.exports = router;
