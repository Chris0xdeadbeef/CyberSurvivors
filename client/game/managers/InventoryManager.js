import FolderInventoryUI from '../ui/FolderInventoryUI.js';

export default class InventoryManager {
  constructor(scene) {
    this.scene = scene;
    this.inventoryUI = new FolderInventoryUI(scene);
    this.currentFolder = null;
  }

  toggleInventory(folder) {
    if (this.currentFolder === folder) {
      this.inventoryUI.close();
      this.currentFolder = null;
    } else {
      this.inventoryUI.open(folder);
      this.currentFolder = folder;
    }
  }

  close() {
    this.inventoryUI.close();
    this.currentFolder = null;
  }
}
