import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.88.2/dist/phaser.esm.js';

export default class QuantumWallet extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'quantum_cash');
        this.setDisplaySize(48, 48)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        scene.add.existing(this);
        this.play('quantum_cash_anim');

        // Ajoute ce handler :
        this.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                if (scene.folderInventoryUI && scene.folderInventoryUI.showQuantumCashWindow) {
                    scene.folderInventoryUI.showQuantumCashWindow();
                }
            }
        });
    }

    destroy(fromScene) {
        super.destroy(fromScene);
    }
}
