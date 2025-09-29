import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.88.2/dist/phaser.esm.js';

export const IInventoryItem = Base => class extends Base {
    makeDraggable() {
        if (!this.sprite) return;
        this.sprite.setInteractive({ useHandCursor: true, draggable: true });
        this.scene.input.setDraggable(this.sprite);       
    }

    createSprite(x, y) {
        if (this.sprite) this.sprite.destroy();
        this.sprite = this.scene.add.sprite(x, y, this.iconKey)
            .setDisplaySize(48, 48)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true, draggable: true });
        this.scene.input.setDraggable(this.sprite);
        return this.sprite;
    }

    dropOnDesktop(x, y) {
        if (this.sprite) this.sprite.destroy();
        this.sprite = this.scene.add.sprite(x, y, this.iconKey)
            .setDisplaySize(48, 48)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true, draggable: true });
        this.scene.input.setDraggable(this.sprite);
        this.owner = null;

        // Drag visuel sur le bureau
        this.sprite.on('drag', (pointer, dragX, dragY) => {
            this.sprite.x = dragX;
            this.sprite.y = dragY;
        });

        this.sprite.on('dragstart', () => {
            this.sprite.setAlpha(0.5);
            // Affiche les overlays de drop sur les dossiers
            if (this.scene.folderInventoryUI && typeof this.scene.folderInventoryUI.showDropTargets === 'function') {
                this.scene.folderInventoryUI.showDropTargets(null);
            }
        });

        this.sprite.on('dragend', (pointer) => {
            this.sprite.setAlpha(1);
            // Cache les overlays de drop
            if (this.scene.folderInventoryUI && typeof this.scene.folderInventoryUI.hideDropTargets === 'function') {
                this.scene.folderInventoryUI.hideDropTargets();
            }
            const folders = this.scene.folders || [];
            for (const folder of folders) {
                if (!folder.body || folder.hp <= 0) continue;
                const bounds = folder.getBounds();
                if (Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y)) {
                    if (!folder.inventory) folder.inventory = [];
                    if (!folder.inventory.includes(this)) {
                        folder.inventory.push(this);
                        this.owner = folder;
                    }
                    if (this.sprite) {
                        this.sprite.destroy();
                        this.sprite = null;
                    }
                    if (this.scene.folderInventoryUI && this.scene.folderInventoryUI.folder === folder) {
                        this.scene.folderInventoryUI.refresh();
                    }
                    break;
                }
            }
        });
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
    }
};