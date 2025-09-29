// client/game/managers/MouseManager.js

import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.88.2/dist/phaser.esm.js';
import FolderInventoryUI from '../ui/FolderInventoryUI.js';

export function setupMouseEvents(scene, folders) {
  scene.game.canvas.oncontextmenu = (e) => e.preventDefault();

  scene.input.on('pointerdown', (pointer) => {
    console.log('[MouseManager] pointerdown', {right: pointer.rightButtonDown(), x: pointer.x, y: pointer.y});
    if (pointer.rightButtonDown()) { // clic droit
      let found = false;
      for (const folder of folders) {
        if (!folder.active || !folder.body) continue;
        const bounds = folder.getBounds();
        console.log('[MouseManager] Test folder', folder, 'bounds:', bounds);
        if (Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y)) {
          console.log('[MouseManager] Clic droit sur dossier détecté', folder);
          found = true;
          if (!scene.folderInventoryUI) {
            console.log('[MouseManager] Création FolderInventoryUI');
            scene.folderInventoryUI = new FolderInventoryUI(scene, folder);
          }
          scene.folderInventoryUI.open(folder);
          break;
        }
      }
      if (!found) {
        console.log('[MouseManager] Clic droit mais aucun dossier trouvé sous le curseur');
      }
    }
  });
}
