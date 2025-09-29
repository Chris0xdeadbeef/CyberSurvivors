//client/game/entities/Folder.js

import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.88.2/dist/phaser.esm.js';
import { Categories } from "./constants/CollisionCategories.js";


export default class Folder extends Phaser.Physics.Matter.Sprite {
  constructor(scene, x, y, name = "Dossier") {
    super(scene.matter.world, x, y, 'dossier', 0);
    scene.add.existing(this);

    this.name = name; // Ajoute le nom

    this.setScale(0.3);
    this.maxHP = 100;
    this.hp = this.maxHP;

    this.isDragging = false;

    this.createHPText(scene, x, y);

    // Ajoute le texte du nom sous la barre de vie
    this.nameText = scene.add.text(x, y + 30, this.name, {
      fontSize: '16px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(6);

    // Mets à jour la position du texte à chaque frame
    scene.events.on('update', () => {
      if (this.nameText) {
        this.nameText.setPosition(this.x, this.y + 30);
      }
    });

    const width = this.displayWidth;
    const height = this.displayHeight;
    const body = Phaser.Physics.Matter.Matter.Bodies.rectangle(0, 0, width, height, {
      friction: 0.3,
      frictionStatic: 0.5,
      frictionAir: 0.1,
      restitution: 0.2,
      inertia: Infinity,
      isStatic: false,
      label: 'Folder',
      collisionFilter: {
        category: Categories.FOLDER,
        mask: Categories.VIRUS | Categories.ANTIVIRUS | Categories.FOLDER | Categories.CASH
      }
    });

    this.setExistingBody(body);
    this.setFixedRotation(true);

    this.setPosition(x, y);
    this.updateHPPosition();

    this.setInteractive();
    this.enableDragging();

    this.scene.events.on('update', this.updateHPPosition, this);

    this.money = 0;
    this.lastBallisticShot = 0;

    this.setDepth(5);
  }
  
  addWeapon(weapon) {
  this.weapon = weapon;
}

  createHPText(scene, x, y) {
    this.hpText = scene.add.text(x, y +5, `🔋 ${this.hp}`, {
      fontSize: '16px',
      fill: 'rgba(47, 173, 36, 0.97)',
      backgroundColor: 'rgba(0,0,0,0.0)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(6);
  }

  updateHPPosition() {
    if (!this.body || !this.hpText) return;
    this.hpText.setPosition(this.body.position.x, this.body.position.y + 5).setDepth(6);
}

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
        this.hp = 0;
        // Détruit la barre de vie
        if (this.hpText) {
            this.hpText.destroy();
            this.hpText = null;
        }
        // Met à 0 l'argent du dossier mort
        this.money = 0;
        this.setVisible(false);
        this.disableInteractive();
        this.destroy();
        // NE PAS retirer de this.scene.folders !
    } else {
        if (this.hpText) this.hpText.setText(`🔋 ${this.hp}`);
    }
}
  
  enableDragging() {
    const matterBody = this.body;

    this.scene.input.setDraggable(this);

    this.on('dragstart', () => {
      this.isDragging = true;
      this.setTint(0xffff00);
      matterBody.isStatic = true;
    });

    this.on('drag', (pointer, dragX, dragY) => {
      const { width, height } = this.scene.scale;
      const halfWidth = this.displayWidth / 2;
      const halfHeight = this.displayHeight / 2;

      dragX = Phaser.Math.Clamp(dragX, halfWidth, width - halfWidth);
      dragY = Phaser.Math.Clamp(dragY, halfHeight, height - halfHeight);

      this.setPosition(dragX, dragY);
      matterBody.position.x = dragX;
      matterBody.position.y = dragY;

      matterBody.velocity.x = 0;
      matterBody.velocity.y = 0;

      this.updateHPPosition();
    });

    this.on('dragend', () => {
      this.isDragging = false;
      this.clearTint();
      matterBody.isStatic = false;

      matterBody.velocity.x = 0;
      matterBody.velocity.y = 0;
      matterBody.angularVelocity = 0;
    });

    this.scene.matter.world.on('beforeupdate', () => {
      if (!this.isDragging) {
        matterBody.velocity.x *= 0.8;
        matterBody.velocity.y *= 0.8;
      }
    });
  }

  getBounds() {
    if (!this.body || typeof this.x !== 'number' || typeof this.y !== 'number') {
        // Dossier détruit ou en cours de destruction
        return new Phaser.Geom.Rectangle(0, 0, 0, 0);
    }
    const width = this.displayWidth;
    const height = this.displayHeight;
    return new Phaser.Geom.Rectangle(
        this.x - width * this.originX,
        this.y - height * this.originY,
        width,
        height
    );
}

  // Pense à détruire le texte lors de la destruction du dossier
  destroy(fromScene) {
    if (this.nameText) {
      this.nameText.destroy();
      this.nameText = null;
    }
    if (this.inventory) {
        this.inventory.forEach(item => {
            if (item && typeof item.dropOnDesktop === 'function') {
                item.dropOnDesktop(this.x, this.y);
            }
        });
    }
    // Ferme l'inventaire si ouvert sur ce dossier
    if (this.scene && this.scene.folderInventoryUI && this.scene.folderInventoryUI.folder === this) {
        this.scene.folderInventoryUI.close();
    }
    // Ferme la fenêtre de répartition si ouverte
    if (this.scene.folderInventoryUI && this.scene.folderInventoryUI.quantumCashModal) {
        this.scene.folderInventoryUI.closeQuantumCashWindow();
    }
    // Détruit le QuantumWallet si présent
    if (this.wallet && typeof this.wallet.destroy === 'function') {
        this.wallet.destroy();
        this.wallet = null;
    }
    if (this.scene && this.updateHPPosition) {
        this.scene.events.off('update', this.updateHPPosition, this);
    }
    super.destroy(fromScene);
  }
  
  shootIfHasBallisticCursor() {
    // Vérifie si le dossier possède l'item
    const hasBallistic = this.inventory?.some(item => item.id === 'ballistic_cursor');
    if (hasBallistic && this.scene.weaponManager) {
        // Trouve la cible la plus proche
        const target = this.scene.weaponManager.getClosestVirus(this);
        if (target) {
            this.scene.weaponManager.fireProjectile(this, target);
        }
    }
  }
  
}


