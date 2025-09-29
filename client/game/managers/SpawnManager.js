export default class SpawnManager {
  constructor(scene, virusManager) {
    this.scene = scene;
    this.virusManager = virusManager;
    this.spawnQueue = [];
    this.isSpawning = false;
  }

  // Ajoute une vague de virus dans la file d'attente
  enqueueWave(virusType, count = 5) {
    for (let i = 0; i < count; i++) {
      this.spawnQueue.push({ 
        type: virusType, 
        x: Math.random() * this.scene.game.config.width,  // Position X aléatoire
        y: Math.random() * this.scene.game.config.height // Position Y aléatoire
      });
    }

    // Si la fonction processQueue n'est pas déjà en cours d'exécution, démarre-la
    if (!this.isSpawning) {
      this.processQueue();
    }
  }

  // Traite la file d'attente pour spawn les virus
  processQueue() {
    if (this.spawnQueue.length === 0) {
      this.isSpawning = false; // Terminer le processus quand la file est vide
      return;
    }

    this.isSpawning = true;

    // Récupérer et spawn le premier virus dans la file
    const virusData = this.spawnQueue.shift();

    // Assurer qu'il y a bien un type de virus avant de continuer
    if (!virusData || !virusData.type) {
      console.warn("Tentative de spawn avec des données incorrectes : ", virusData);
      this.isSpawning = false;
      return;
    }

    // Spawn le virus en utilisant les données envoyées
    this.virusManager.spawnVirusFromData(virusData);

    // Traiter le suivant dans la file immédiatement
    this.processQueue();
  }
}
