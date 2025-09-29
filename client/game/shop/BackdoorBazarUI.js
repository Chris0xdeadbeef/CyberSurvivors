import ShopManager from '../shop/ShopManager.js';

export default class BackdoorBazarUI {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.shopManager = new ShopManager(scene.player); // Gestionnaire d'achat pour les interactions
        this.config = null; // Contiendra la configuration du shop chargée depuis le serveur
    }

    //Affiche l'interface du shop (Backdoor Bazaar)    
    async open() {
        this.close(); // Ferme toute UI déjà ouverte

        const config = await this.loadShopConfig(); // Charge la config distante
        if (!config) return;

        this.config = config;

        const { width, height } = this.scene.scale;
        this.container = this.scene.add.container(width / 2, height / 2).setDepth(100); // Crée le conteneur principal centré

        this.createBackground(width, height);         // Image de fond générale
        this.createSectionBackgrounds(width, height); // Création des sections loot/shop + titres
        this.createCloseButton(width, height);        // Bouton de fermeture
        this.renderLootChests(width, height);         // Affichage des coffres loot
        this.renderShopItems(width, height);          // Affichage des objets du shop

        this.scene.children.bringToTop(this.container); // S'assure que l'UI soit au-dessus du reste
    }

    
    //Charge la configuration du shop depuis le serveur     
    async loadShopConfig() {
        try {
            const response = await fetch('/config/shop');
            if (!response.ok) throw new Error('Erreur chargement config boutique');
            return await response.json();
        } catch (err) {
            console.error('❌ Erreur de chargement de ShopConfig:', err);
            return null;
        }
    }

    
    //Crée l'image de fond du shop     
    createBackground(width, height) {
        const bg = this.scene.add.image(0, 0, this.config.backgroundImage)
            .setDisplaySize(width * 0.8, height * 0.8)
            .setOrigin(0.5);
        this.container.add(bg);
    }

    
    //Crée les deux panneaux de section (Loot & Shop) avec leurs titres    
    createSectionBackgrounds(width, height) {
        const lootX = -width * 0.2;
        const shopX = width * 0.2;
        const sectionWidth = width * 0.35;
        const sectionHeight = height * 0.7;

        // Fonds des sections
        const lootBg = this.scene.add.rectangle(lootX, 0, sectionWidth, sectionHeight, 0x222244, 0.92).setOrigin(0.5);
        const shopBg = this.scene.add.rectangle(shopX, 0, sectionWidth, sectionHeight, 0x224422, 0.92).setOrigin(0.5);
        this.container.add(lootBg);
        this.container.add(shopBg);

        // Titres
        const lootTitle = this.scene.add.text(lootX, -height * 0.3, 'Backdoor Bazaar', {
            fontSize: '28px',
            color: '#fff'
        }).setOrigin(0.5, 0);

        const shopTitle = this.scene.add.text(shopX, -height * 0.3, 'Backdoor Market', {
            fontSize: '28px',
            color: '#fff'
        }).setOrigin(0.5, 0);

        this.container.add([lootTitle, shopTitle]);
    }

    
    //Crée un bouton permettant de fermer l'interface    
    createCloseButton(width, height) {
        const closeBtn = this.scene.add.text(width * 0.8 / 2 - 40, -height * 0.8 / 2 + 40, '✖', {
            fontSize: '32px',
            color: '#ff5555',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

        closeBtn.on('pointerdown', () => this.close());
        this.container.add(closeBtn);
    }

    //Affiche les coffres à loot disponibles à l'achat
    renderLootChests(width, height) {
        const lootX = -width * 0.2;
        const itemSize = 80;
        const spacingX = 120;
        const spacingY = 140;
        const maxCols = Math.floor((width * 0.35) / spacingX);
        const startX = lootX - ((maxCols - 1) * spacingX) / 2;
        const startY = -height * 0.18;

        this.config.lootChests.forEach((chest, index) => {
            const col = index % maxCols;
            const row = Math.floor(index / maxCols);
            const x = startX + col * spacingX;
            const y = startY + row * spacingY;

            const img = this.scene.add.image(x, y, chest.imageKey)
                .setDisplaySize(itemSize, itemSize)
                .setOrigin(0.5);

            const label = this.scene.add.text(x, y + 50, chest.name, {
                fontSize: '20px',
                color: '#fff',
                wordWrap: { width: spacingX - 20, useAdvancedWrap: false },
                align: 'center'
            }).setOrigin(0.5, 0);

            const buyBtn = this.scene.add.text(x, y + 90, `${chest.price} Q`, {
                fontSize: '18px',
                color: '#222',
                backgroundColor: '#aaffaa',
                padding: { x: 18, y: 5 }
            }).setOrigin(0.5).setInteractive();

            buyBtn.on('pointerdown', () => {
                this.shopManager.buyItem(chest); // Achat du coffre
            });

            this.container.add([img, label, buyBtn]);
        });
    }
    
    //Affiche les objets disponibles dans le marché
    renderShopItems(width, height) {
        const shopX = width * 0.2;
        const itemSize = 80;
        const spacingX = 130;
        const spacingY = 160;
        const maxCols = Math.floor((width * 0.35) / spacingX);
        const startX = shopX - ((maxCols - 1) * spacingX) / 2;
        const startY = -height * 0.18;

        this.config.shopItems.forEach((item, index) => {
            const col = index % maxCols;
            const row = Math.floor(index / maxCols);
            const x = startX + col * spacingX;
            const y = startY + row * spacingY;

            const img = this.scene.add.image(x, y, item.imageKey)
                .setDisplaySize(itemSize, itemSize)
                .setOrigin(0.5);

            const label = this.scene.add.text(x, y + 60, item.name, {
                fontSize: '16px',
                color: '#fff',
                wordWrap: { width: spacingX - 20, useAdvancedWrap: true },
                align: 'center'
            }).setOrigin(0.5, 0);

            const buyBtn = this.scene.add.text(x, y + 110, `${item.price} Q`, {
                fontSize: '16px',
                color: '#222',
                backgroundColor: '#aaffaa',
                padding: { x: 18, y: 5 }
            }).setOrigin(0.5).setInteractive();

            buyBtn.on('pointerdown', () => {
                this.shopManager.buyItem(item); // Achat de l'objet du marché
            });

            this.container.add([img, label, buyBtn]);
        });
    }

    //Ferme et détruit l'interface du shop
    close() {
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
    }
}
