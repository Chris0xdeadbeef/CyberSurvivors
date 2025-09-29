import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.88.2/dist/phaser.esm.js';
import { IInventoryItem } from '../interfaces/IInventoryItem.js';

class BallisticCursorItem {
    constructor(scene, owner) {
        this.scene = scene;
        this.owner = owner; // le dossier qui possède l'item
        this.id = 'ballistic_cursor';
        this.name = 'Souris Balistique';
        this.type = 'weapon';
        this.iconKey = 'ballistic_cursor_sprite';
        this.description = "Un curseur balistique capable de cibler les virus.";
        this.isDraggable = true;
        this.sprite = null;
        this.lastShot = 0;
    }

    update(time, config) {
        if (!this.owner) return;
        if (!this.lastShot) this.lastShot = 0;
        if (time - this.lastShot > (config.cooldown * 1000)) {
            const target = this.scene.weaponManager.getClosestVirus(this.owner);
            if (target) {
                this.scene.weaponManager.fireProjectile(this.owner, target);
                this.lastShot = time;
            }
        }
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
    }

    dropOnDesktop(x, y) {
        // Crée un sprite sur le bureau à la position donnée
        if (this.sprite) this.sprite.destroy();
        this.sprite = this.scene.add.sprite(x, y, this.iconKey)
            .setDisplaySize(48, 48)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true, draggable: true });
        this.scene.input.setDraggable(this.sprite);

        // Permet de ramasser l'item dans un dossier vivant lors du dragend
        this.sprite.on('dragend', (pointer) => {
            // Vérifie tous les dossiers vivants
            const folders = this.scene.folders || [];
            for (const folder of folders) {
                // Ignore les dossiers morts (plus de body ou hp <= 0)
                if (!folder.body || folder.hp <= 0) continue;
                const bounds = folder.getBounds();
                if (Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y)) {
                    // Ajoute l'item à l'inventaire du dossier cible
                    if (!folder.inventory) folder.inventory = [];
                    folder.inventory.push(this);
                    this.owner = folder;
                    // Détruit le sprite sur le bureau
                    if (this.sprite) {
                        this.sprite.destroy();
                        this.sprite = null;
                    }
                    // Rafraîchit l'inventaire si ouvert
                    if (this.scene.folderInventoryUI && this.scene.folderInventoryUI.folder === folder) {
                        this.scene.folderInventoryUI.refresh();
                    }
                    break;
                }
            }
        });
        // L'item n'a plus d'owner
        this.owner = null;
    }
}

// Applique le mixin
export default IInventoryItem(BallisticCursorItem);