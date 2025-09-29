const wavesConfig = require('../config/WavesConfig.js');

class WaveSpawner {
  constructor(virusManager, width, height) {
    if (!virusManager || !width || !height) {
      throw new Error("Les paramètres de construction sont incomplets !");
    }

    this.virusManager = virusManager;
    this.width = width;
    this.height = height;

    this.activeTimeouts = new Set(); // Pour pouvoir les annuler
  }

  // Supprime tous les timeouts en cours (appelé par GameSession.stop)
  cancelAllSpawns() {
    for (const t of this.activeTimeouts) {
      clearTimeout(t);
    }
    this.activeTimeouts.clear();
  }

  spawnWave(wave, socket) {
    if (!socket || !socket.connected) {
      console.warn(`⛔ Annulation : socket ${socket?.id || 'null'} déconnectée`);
      return;
    }

    console.log(`🧬 Vague ${wave.waveNumber} envoyée à ${socket.id}`);

    const spawnList = [];

    for (const virusData of wave.viruses) {
      if (!virusData.type || !virusData.count) continue;
      for (let i = 0; i < virusData.count; ++i) {
        spawnList.push(virusData.type);
      }
    }

    let index = 0;

    const spawnNext = () => {
      if (!socket.connected) {
        console.warn(`❌ Socket ${socket.id} déconnectée en cours de vague.`);
        return;
      }

      if (index >= spawnList.length) {
        console.log(`✔️ Vague ${wave.waveNumber} terminée (${spawnList.length} virus)`);
        return;
      }

      const type = spawnList[index];

      if (this.virusManager?.stopped) {
        console.warn(`🚫 Spawn ignoré : session arrêtée`);
        return;
      }

      // Correction : on passe la largeur et la hauteur, pas des coordonnées
      const virus = this.virusManager.spawnVirus(type, this.width, this.height);
      socket.emit('spawn-virus', virus);

      ++index;
      const timeout = setTimeout(spawnNext, wave.delayBetweenSpawns * 1000);
      this.activeTimeouts.add(timeout);
    };

    spawnNext();
  }

  // Méthode alternative (non utilisée dans ton flux actuel)
  spawnVirusesOfType(virusData, socket) {
    for (let i = 0; i < virusData.count; i++) {
      // Correction : on passe la largeur et la hauteur, pas des coordonnées
      const virus = this.virusManager.spawnVirus(virusData.type, this.width, this.height);
      socket.emit('spawn-virus', virus);
    }
  }
}

module.exports = WaveSpawner;
