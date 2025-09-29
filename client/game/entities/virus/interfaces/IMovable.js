// client/game/interfaces/IMovable.js

import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.88.2/dist/phaser.esm.js';

// Mixin fonctionnel : prend une classe de base, retourne une classe étendue
export const IMovable = Base => class extends Base {
  
  /**
   * Recherche le dossier (folder) le plus proche et le stocke comme cible.
   */
  findClosestFolder() {
    let closestFolder = null;
    let minDistance = Infinity;

    // Vérifie qu'on a bien une liste de dossiers dans la scène
    if (!this.scene.folders || this.scene.folders.length === 0) {
      this.target = null;
      return;
    }

    // Trouve le dossier actif le plus proche
    this.scene.folders.forEach(folder => {
      if (folder.body && !folder.body.isSleeping) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, folder.x, folder.y);
        if (distance < minDistance) {
          minDistance = distance;
          closestFolder = folder;
        }
      }
    });

    this.target = closestFolder;
  }

  /**
   * Applique une force vers la cible actuellement sélectionnée.
   */
  moveToTarget() {
    if (this.target && this.target.body && !this.target.body.isSleeping) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);

      const forceMagnitude = this.speed || 0.000005;
      const force = {
        x: Math.cos(angle) * forceMagnitude,
        y: Math.sin(angle) * forceMagnitude
      };

      // Applique une petite force continue vers la cible
      this.body.gameObject.applyForce(force);
    }
  }

  /**
   * Hook Phaser appelé automatiquement à chaque frame.
   * Gère la mise à jour de la cible et le déplacement.
   */
  preUpdate(time, delta) {
    if (super.preUpdate) super.preUpdate(time, delta);

    // Synchronise le sprite visuel (non-physique)
    if (this.visual) {
      this.visual.setPosition(this.x, this.y);
    }

    // Logique de déplacement vers un dossier
    this.findClosestFolder?.();
    this.moveToTarget?.();
  }

};
