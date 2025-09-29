export default class DesktopSceneUI {
    constructor(scene) {
        this.scene = scene;

        this.moneyContainer = this.scene.add.container(
            this.scene.scale.width - 160,
            this.scene.scale.height - 30
        ).setScrollFactor(0).setDepth(2);

        // Texte aligné à gauche
        this.moneyValueText = this.scene.add.text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1,
            align: 'right'
        }).setOrigin(0, 0.5);

        // Icône billet quantum (hauteur adaptée au texte)
        this.moneyIcon = this.scene.add.image(0, 0, 'quantum_billet')
            .setScale(0.125) // 192px → ~24px
            .setOrigin(0, 0.5);

        this.moneyContainer.add([this.moneyValueText, this.moneyIcon]);

        // Timer à droite
        this.timerText = this.scene.add.text(
            this.scene.scale.width - 20,
            this.scene.scale.height - 30,
            '0:00',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 1,
                align: 'right'
            }
        ).setOrigin(1, 0.5).setScrollFactor(0).setDepth(2);

        this._setTimer('0:00');
        this._updateMoney();
    }

    _setTimer(formattedTime) {
        this.timerText.setText(formattedTime);
    }

    _updateMoney() {
    let quantum = 0;
    if (Array.isArray(this.scene.folders)) {
        quantum = this.scene.folders.reduce((sum, folder) => sum + (folder.money || 0), 0);
    }

    this.moneyValueText.setText(quantum.toString());

    const spacing = 6;
    const totalWidth = this.moneyValueText.width + spacing + this.moneyIcon.displayWidth;

    // Place le bloc à gauche du timer (timer = width - 20, on laisse aussi un peu d'espace, ex: 10px)
    const rightMargin = 20 + 100; // 20px du bord + 10px d'écart avec le timer
    this.moneyContainer.x = this.scene.scale.width - totalWidth - rightMargin;

    // Le texte commence à x = 0 dans le container
    this.moneyValueText.x = 0;

    // L’icône vient à droite du texte
    this.moneyIcon.x = this.moneyValueText.width + spacing;
}



    update() {
        this._updateMoney();

        if (this.scene.startTime !== undefined) {
            const elapsed = Math.floor((this.scene.time.now - this.scene.startTime) / 1000);
            const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const seconds = String(elapsed % 60).padStart(2, '0');
            this._setTimer(`${minutes}:${seconds}`);
        }
    }
}
