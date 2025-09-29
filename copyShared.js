// copyShared.js
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'shared/config/VirusTypes.js');
const dest = path.join(__dirname, 'client/config/VirusTypes.js');

// Crée le dossier cible s'il n'existe pas
fs.mkdirSync(path.dirname(dest), { recursive: true });

fs.copyFile(src, dest, (err) => {
  if (err) {
    console.error('❌ Échec de la copie de VirusTypes.js', err);
  } else {
    console.log('✅ VirusTypes.js copié vers client/config');
  }
});
