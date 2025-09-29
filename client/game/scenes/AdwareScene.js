// client/game/scenes/AdwareScene.js

import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.88.2/dist/phaser.esm.js';
import { AdPopupConfig } from '../config/AdPopupConfig.js';

export default class AdwareScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AdwareScene', active: true });
  }

  create() {
    console.log("🧩 AdwareScene prête");
    this.adPopups = this.add.group();
    this.events.emit('ui-ready');
  }

  showAdPopup(popupType = null) {
    const popupTypes = Object.keys(AdPopupConfig);

    // Si aucun type fourni ou le type n'existe pas, on en prend un aléatoire
    if (!popupType || !AdPopupConfig[popupType]) {
      popupType = Phaser.Utils.Array.GetRandom(popupTypes);
    }

    const config = AdPopupConfig[popupType];
    if (!config) {
      console.warn(`🛑 Popup config introuvable pour le type : ${popupType}`);
      return;
    }

    // Crée et affiche l’image publicitaire
    const image = this.add.image(0, 0, config.imageKey).setOrigin(0);

    // Vérifie que la texture est chargée
    if (!this.textures.exists(config.imageKey)) {
      console.warn(`❌ Texture "${config.imageKey}" introuvable. Vérifie preloadAssets().`);
      return;
    }

    this._adjustPopup(image, config, popupType);
  }
  
  _adjustPopup(image, config, popupType) {
    const margin = 20;
    const screenW = this.scale.width;
    const screenH = this.scale.height;

    const imgW = image.width;
    const imgH = image.height;

    // Calcul du scale pour que ça rentre dans l'écran (max 80% de l'écran)
    const maxW = screenW * 0.8;
    const maxH = screenH * 0.8;

    const scale = Math.min(1, maxW / imgW, maxH / imgH);
    image.setScale(scale);

    const popupW = imgW * scale;
    const popupH = imgH * scale;

    const x = Phaser.Math.Between(margin, screenW - popupW - margin);
    const y = Phaser.Math.Between(margin, screenH - popupH - margin);

    const popup = this.add.container(x, y);
    popup.add(image);

    // Ajouter le bouton de fermeture (position relative à l’image)
    const closeBtn = this.add.text(
      config.closeButtonOffset.x * scale,
      config.closeButtonOffset.y * scale,
      '✖',
      {
        fontSize: `${16 * scale}px`,
        color: 'transparent',
        backgroundColor: 'transparent',
        padding: { x: 10, y: 10 }
      }
    ).setInteractive();

    closeBtn.on('pointerdown', () => popup.destroy());

    popup.add(closeBtn);
    this.adPopups.add(popup);

    this.time.delayedCall(10000, () => {
      if (popup.active) {
        popup.destroy();
        this.events.emit('adNotClosed', popupType);
      }
    });
  }
}