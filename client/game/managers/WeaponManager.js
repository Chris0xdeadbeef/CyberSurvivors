//client/game/managers/WeaponManager.js

import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.88.2/dist/phaser.esm.js';
import { WeaponsConfig } from '../config/WeaponConfig.js';
import BallisticCursor from '../entities/weapons/BallisticCursor.js';

export default class WeaponManager {
  constructor(scene, virusManager) {
    this.scene = scene;
    this.virusManager = virusManager;

    this.config = WeaponsConfig.ballisticCursor;
    this.lastShotTime = 0;
  }

  update(time) {
    
  }

  getClosestVirus(origin) {
    if (!origin || typeof origin.x !== 'number' || typeof origin.y !== 'number') {
      console.warn('🚨 Origine invalide pour getClosestVirus:', origin);
      return null;
    }

    const viruses = Array.from(this.virusManager.viruses?.values?.() || []).filter(
      (v) =>
        v &&
        v.active &&
        v.isEnemy &&
        typeof v.x === 'number' &&
        typeof v.y === 'number'
    );

    if (viruses.length === 0) return null;

    return viruses.reduce((closest, virus) => {
      const dist = Phaser.Math.Distance.Between(origin.x, origin.y, virus.x, virus.y);
      const closestDist = Phaser.Math.Distance.Between(origin.x, origin.y, closest.x, closest.y);
      return dist < closestDist ? virus : closest;
    }, viruses[0]);
  }


  fireProjectile(origin, target) {
    new BallisticCursor(this.scene, origin.x, origin.y, target, this.config);
  }
}
