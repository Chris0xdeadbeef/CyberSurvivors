const WaveSpawnManager = require('./managers/WaveSpawner.js');
const wavesConfig = require('./config/WavesConfig.js');

class GameSession {
  constructor(socket, duration = 600, onGameOver = null, width = 800, height = 600, virusManager) {
    this.socket = socket;
    this.elapsed = 0;
    this.duration = duration;
    this.interval = null;
    this.onGameOver = onGameOver;
    this.width = width;
    this.height = height;
    this.stopped = false;

    this.triggeredWaves = new Set();
    this.virusManager = virusManager;

    this.waveSpawnManager = new WaveSpawnManager(virusManager, this.width, this.height);

    this.start();
  }

  start() {
    this.interval = setInterval(() => {
      if (this.stopped) return;

      ++this.elapsed;
      if (this.socket.connected) {
        this.socket.emit('time-update', { elapsed: this.elapsed });
      }

      for (const wave of wavesConfig.waves) {
        if (this.elapsed >= wave.startTime && !this.triggeredWaves.has(wave.waveNumber)) {
          this.triggeredWaves.add(wave.waveNumber);
          this.waveSpawnManager.spawnWave(wave, this.socket);
        }
      }

      if (this.elapsed >= this.duration) {
        if (this.socket.connected) {
          this.socket.emit('game-over');
        }
        this.stop();
        if (typeof this.onGameOver === 'function') {
          this.onGameOver(this.socket.id);
        }
      }
    }, 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.stopped = true;

    if (this.waveSpawnManager?.cancelAllSpawns) {
      this.waveSpawnManager.cancelAllSpawns();
    }

    if (this.virusManager) {
      this.virusManager.stopped = true;
    }
  }
}

module.exports = GameSession;
