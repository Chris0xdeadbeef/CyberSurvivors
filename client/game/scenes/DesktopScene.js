// Importation des modules nécessaires
import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.88.2/dist/phaser.esm.js';
import VirusManager from '../managers/VirusManager.js';
import Folder from '../entities/Folder.js';
import WeaponManager from '../managers/WeaponManager.js';
import BallisticCursor from '../entities/weapons/BallisticCursor.js';
import AdwareScene from './AdwareScene.js';
import InventoryManager from '../managers/InventoryManager.js';
import SpawnManager from '../managers/SpawnManager.js';
import { WeaponsConfig } from '../config/WeaponConfig.js';
import { registerAnimations } from '../animations/Animations.js';
import { preloadAssets } from '../AssetLoader.js';
import { setupCollisionHandlers } from '../managers/CollisionManager.js';
import { setupMouseEvents } from '../managers/MouseManager.js';
import { loadConfigs } from '../../config/LoadConfigs.js';
import BallisticCursorItem from '../items/weapons/BallisticCursorItem.js';
import BackdoorBazarUI from '../shop/BackdoorBazarUI.js';
import DesktopSceneUI from '../ui/DesktopSceneUI.js';

export default class DesktopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DesktopScene' }); // Identifiant de la scène
  }

  preload() {
    preloadAssets(this); // Préchargement des assets graphiques et sonores
  }

  create(data) {
    this.socket = data.socket;
    if (!this.socket) {
      console.error("❌ Socket non reçue !");
      return;
    }

    this.scale.on('resize', this.handleResize, this); // Gestion du redimensionnement

    // Chargement des configurations (types de virus, objets du jeu, etc.)
    loadConfigs(['virus-types', 'game-items']).then(configs => {
      const virusConfig = configs['virus-types'];
      const itemsConfig = configs['game-items'];

      // Enregistrement des animations à partir de la config
      if (virusConfig) {
        registerAnimations(this, virusConfig);
      }

      this.virusConfig = virusConfig || {};
      this.itemsConfig = itemsConfig;

      // Arrière-plan et éléments de l'interface
      this.add.image(this.scale.width / 2, this.scale.height / 2, 'desktop_bg')
        .setOrigin(0.5)
        .setDepth(-1); // Fond derrière tout

      this.taskbar = this.add.image(this.scale.width / 2, this.scale.height, 'taskbar')
        .setOrigin(0.5, 1)
        .setDepth(0)
        .setScrollFactor(0);

      this.backdoorbazar = this.add.image(this.scale.width / 2, this.scale.height, 'backdoorbazar')
        .setOrigin(0.5, 0.95)
        .setDepth(0)
        .setScrollFactor(0)
        .setScale(0.06);

      // Initialisation de l'UI du magasin si nécessaire
      if (!this.backdoorbazarUI) {
        this.backdoorbazarUI = new BackdoorBazarUI(this);
      }

      // Activation du clic sur l’icône du magasin
      this.backdoorbazar.setInteractive({ useHandCursor: true });
      this.backdoorbazar.on('pointerdown', () => {
        this.backdoorbazarUI.open();
      });

      this.folders = [];

      const width = this.scale.width;
      const height = this.scale.height;

      // Définition des limites du monde physique
      this.matter.world.setBounds(0, 0, width, height, 32, true, true, true, true);

      // Positionnement initial de dossiers sur le bureau
      const spots = [[220, 200], [360, 300], [422, 300], [220, 240]];
      const folderNames = ['Genesis', 'Beta', 'Gamma', 'Delta'];

      spots.forEach(([x, y], i) => {
        const folder = new Folder(this, x, y, folderNames[i] || `Dossier ${i + 1}`);
        this.folders.push(folder);
      });

      // Ajout d’un item spécifique dans le premier dossier
      const dossier1 = this.folders[0];
      if (dossier1) {
        if (!dossier1.inventory) dossier1.inventory = [];
        const item = new BallisticCursorItem(this, dossier1);
        dossier1.inventory.push(item);
        if (this.folderInventoryUI && this.folderInventoryUI.folder === dossier1) {
          this.folderInventoryUI.refresh();
        }
      }

      // Initialisation des gestionnaires du jeu
      this.virusManager = new VirusManager(this, this.folders);
      this.weaponManager = new WeaponManager(this, this.virusManager);
      this.spawnManager = new SpawnManager(this, this.virusManager, this.timerText);
      this.inventoryManager = new InventoryManager(this);

      // Ajout de la scène Adware (fenêtres pop-up)
      if (!this.scene.get('AdwareScene')) {
        this.scene.add('AdwareScene', AdwareScene);
      }
      this.scene.launch('AdwareScene');

      // Attente de la disponibilité de l’UI Adware
      const adwareScene = this.scene.get('AdwareScene');
      if (adwareScene) {
        adwareScene.events.once('ui-ready', () => {
          this.AdwareSceneReady = true;
        });
      }

      // Gestion des événements en provenance du serveur (socket)
      this.socket.on('spawn-virus', (data) => {
        this.virusManager.spawnVirusFromData(data);

        if (data.type === 'adware' && this.AdwareSceneReady) {
          const adwareScene = this.scene.get('AdwareScene');
          if (adwareScene) {
            if (data.popupType) {
              adwareScene.showAdPopup(data.popupType);
            } else {
              adwareScene.showAdPopup();
            }
          }
        }
      });

      this.socket.on('virus-damage-result', (data) => {
        this.virusManager.handleDamageFeedback(data);
      });

      this.socket.on('init-viruses', (list) => {
        for (const virus of list) {
          this.virusManager.spawnVirusFromData(virus);
        }
      });

      this.socket.on('kill-viruses', (ids) => {
        for (const id of ids) {
          this.virusManager.removeVirusById(id);
        }
      });

      // Mise à jour du timer depuis le serveur
      this.socket.on('time-update', ({ elapsed }) => {
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        if (this.timerText) {
          this.timerText.setText(formattedTime);
        }
      });

      // Lancement d’une nouvelle vague de virus
      this.socket.on('spawn-wave', ({ waveNumber, virusType }) => {
        this.spawnManager.enqueueWave(virusType, 5); // 5 virus par vague
      });

      // Mise à jour de l’argent dans chaque dossier
      this.socket.on('money-update', ({ amounts }) => {
        if (Array.isArray(amounts)) {
          amounts.forEach((amount, i) => {
            if (this.folders[i]) this.folders[i].money = amount;
          });
          if (window.FolderInventoryUI?.openModals) {
            FolderInventoryUI.openModals.forEach(ui => ui.refreshQuantumCashModal && ui.refreshQuantumCashModal());
          } else if (this.folderInventoryUI && this.folderInventoryUI.refreshQuantumCashModal) {
            this.folderInventoryUI.refreshQuantumCashModal();
          }
        }
      });

      // Configuration des collisions et de la gestion de la souris
      setupCollisionHandlers(this, this.virusManager, this.folders, this.socket);
      setupMouseEvents(this, this.folders);

      // Événement de mise à jour (chaque frame)
      this.events.on('update', () => {
        this.folders.forEach(folder => this.keepInsideBounds(folder));
        for (const virus of this.virusManager.viruses.values()) {
          this.keepInsideBounds(virus);
        }
        if (this.folderInventoryUI && this.folderInventoryUI.dropTargets?.length > 0) {
          this.folderInventoryUI.updateDropTargets();
        }
      });
    });

    // Désactivation du menu contextuel par clic droit
    this.game.canvas.oncontextmenu = (e) => { e.preventDefault(); };

    // Création de l’animation de quantum cash si elle n'existe pas
    if (!this.anims.exists('quantum_cash_anim')) {
      this.anims.create({
        key: 'quantum_cash_anim',
        frames: this.anims.generateFrameNumbers('quantum_cash', { start: 0, end: 15 }),
        frameRate: 12,
        repeat: -1
      });
    }

    this.initialized = true;
    this.startTime = this.time.now;

    // Création du joueur si pas encore défini
    if (!this.player) {
      this.player = { quantum: 0, inventory: [] };
    }

    // Initialisation de l’interface utilisateur
    this.ui = new DesktopSceneUI(this);
  }

  // Empêche les objets de sortir de l'écran
  keepInsideBounds(gameObject) {
    if (!gameObject || !gameObject.body || !gameObject.active) return;

    const { width, height } = this.scale;
    const halfWidth = gameObject.displayWidth / 2;
    const halfHeight = gameObject.displayHeight / 2;

    if (gameObject.x - halfWidth < 0) gameObject.setPosition(halfWidth, gameObject.y);
    if (gameObject.x + halfWidth > width) gameObject.setPosition(width - halfWidth, gameObject.y);
    if (gameObject.y - halfHeight < 0) gameObject.setPosition(gameObject.x, halfHeight);
    if (gameObject.y + halfHeight > height) gameObject.setPosition(gameObject.x, height - halfHeight);
  }

  // Boucle de mise à jour principale
  update(time) {
    if (!this.initialized) return;

    // Mise à jour des gestionnaires
    if (this.virusManager) this.virusManager.update(time);
    if (this.weaponManager) this.weaponManager.update(time);

    // Mise à jour des objets dans l’inventaire des dossiers
    const ballisticConfig = this.itemsConfig?.ballistic_cursor || this.weaponManager?.config;
    if (Array.isArray(this.folders)) {
      this.folders.forEach(folder => {
        if (folder.inventory) {
          folder.inventory.forEach(item => {
            if (item.id === 'ballistic_cursor' && typeof item.update === 'function') {
              item.update(time, ballisticConfig);
            }
          });
        }
      });
    }

    // Vérifie que l'argent reste visible à l'écran
    if (this.quantumCashList) {
      this.quantumCashList.forEach(cash => this.keepInsideBounds(cash));
    }

    // Mise à jour de l’UI
    this.ui.update();
  }

  // Gestion du redimensionnement de la fenêtre
  handleResize(gameSize) {
    const { width, height } = gameSize;

    this.cameras.main.setSize(width, height);

    if (this.taskbar) {
      this.taskbar.setPosition(width / 2, height);
    }
    if (this.backdoorbazar) {
      this.backdoorbazar.setPosition(width / 2, height * 0.95);
    }
    if (this.timerText) {
      this.timerText.setPosition(width - 20, height - 30);
    }

    this.matter.world.setBounds(0, 0, width, height, 32, true, true, true, true);
  }
}
