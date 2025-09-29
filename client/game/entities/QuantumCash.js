//client/game/entities/QuantumCash.js

import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.88.2/dist/phaser.esm.js';
import { Categories } from './constants/CollisionCategories.js';


export default class QuantumCash extends Phaser.Physics.Matter.Sprite {
    constructor(scene, x, y, amount = 1) {
      super(scene.matter.world, x, y, 'quantum_cash');
  
      scene.add.existing(this);
  
      this.amount = amount; // Ajouté
      this.setScale(0.1); // Taille ajustable
      this.setCircle(this.displayWidth / 2);
      this.setFrictionAir(0.02);
      this.setBounce(0.6);
      this.setFixedRotation();
  
      this.setVelocity(
        Phaser.Math.FloatBetween(-1, 1),
        Phaser.Math.FloatBetween(-2, -1)
      );

      this.setCollisionCategory(Categories.CASH);
      // Collisionne avec les dossiers uniquement
      this.setCollidesWith(Categories.FOLDER);

      if (!scene.quantumCashList) {
        scene.quantumCashList = [];
      }
      scene.quantumCashList.push(this);
  
      // Animation si disponible
      this.play('quantum_cash_anim');
      this.body.label = 'quantum_cash';
      this.setDepth(5);
    }
  }