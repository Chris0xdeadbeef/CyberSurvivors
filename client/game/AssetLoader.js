//client/game/AssetLoader.js

export function preloadAssets(scene) {
  scene.load.spritesheet('spyware', './sprites/virus/spyware_8_sprites.png', {
    frameWidth: 512,
    frameHeight: 512
  });

  scene.load.spritesheet('adware', './sprites/virus/virus2 (1)3.png', {
    frameWidth: 512,
    frameHeight: 512
  });

  scene.load.spritesheet('quantum_cash', './sprites/QuantumCash.png', {
    frameWidth: 512,
    frameHeight: 512
  });

  // Desktop UI
  scene.load.image('desktop_bg', './sprites/desktop/background.png');
  scene.load.image('taskbar', './sprites/desktop/taskbar.png');
  scene.load.image('quantum_billet', './sprites/desktop/billet_quantum.png');
  

  // Adware 
  scene.load.image('ad1', './sprites/ads/ad1.png');
  scene.load.image('ad2', './sprites/ads/ad2.png');

  // Dossier
  scene.load.image('dossier', './sprites/folder.png');

  // Armes
  scene.load.image('ballistic_cursor_sprite', './sprites/armes/souris_balistique.png');  

  //Backdoor Bazar Assets
  scene.load.image('backdoorbazar', './sprites/desktop/backdoorbazar.png');
  scene.load.image('backdoorbazar_bg', './sprites/desktop/backdoorbazar_bg.png');
  scene.load.image('chest_standard', './sprites/armes/souris_balistique.png');
  scene.load.image('chest_epic', './sprites/armes/souris_balistique.png');
  scene.load.image('chest_legendary', './sprites/armes/souris_balistique.png');
  scene.load.image('shop_shield', './sprites/armes/souris_balistique.png');
}
