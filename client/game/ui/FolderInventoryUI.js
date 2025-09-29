import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.88.2/dist/phaser.esm.js';
import QuantumWallet from '../items/QuantumWallet.js';

export default class FolderInventoryUI {
    static openModals = [];

    constructor(scene, folder) {
        this.scene = scene;
        this.folder = folder;
        this.container = null;
        this.slots = [];
        this.dragging = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDraggingElement = false;
        this.isDraggingQuantumSlider = false;

        scene.folderInventoryUI = this;

        // Écoute la mise à jour d'argent
        this.scene.socket.on('money-update', ({ amount }) => {
            if (this.folder) {
                this.folder.money = amount;

                this.refreshQuantumCashModal();
            }
        });

        // Initialiser si pas encore présent
        this.scene.lastQuantumDistribution = this.scene.lastQuantumDistribution || {};
        // Ajoute l'instance à la liste lors de l'ouverture
        this.isQuantumModalOpen = false;
    }

    open(folder = null) {
        this.close();
        if (folder) this.folder = folder;
        const { width, height } = this.scene.scale;

        this.container = this.scene.add.container(width - 500, 0).setDepth(10);

        const background = this.scene.add.rectangle(0, 0, 220, 300, 0x222222, 0.95)
            .setOrigin(0)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive();

        // Affiche le nom du dossier dans le titre
        const folderName = this.folder?.name || '';
        const title = this.scene.add.text(185, 20, `Inventaire ${folderName}`, {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const closeButton = this.scene.add.text(350, 20, '✖', {
            fontSize: '16px',
            color: '#ff5555',
            backgroundColor: '#000000'
        }).setOrigin(0.5).setInteractive();

        closeButton.on('pointerdown', () => this.close());
        this.container.add([background, title, closeButton]);

        this.slots = [];

        // 🟢 Ajoute cette ligne pour définir inventory correctement
        const inventory = this.folder?.inventory || [];

        // Ajoute un slot pour chaque item, plus un slot vide SEULEMENT si tu veux permettre le drag dans un slot vide
        const totalSlots = Math.max(1, 1 + inventory.length); // Toujours au moins 1 slot pour le wallet
        this.slots = [];
        for (let i = 0; i < totalSlots; i++) {
            this.addSlot();
        }

        // Wallet toujours dans le slot 0
        this.addDefaultItem();

        // Ajoute les items de l'inventaire dans les slots (à partir du slot 1)
        for (let i = 0; i < inventory.length; i++) {
            const slot = this.slots[i + 1];
            const item = inventory[i];
            if (item && slot) {
                if (item.sprite) item.sprite.destroy();
                if (typeof item.createSprite === 'function') {
                    item.createSprite(slot.x + 30, slot.y + 30);
                } else {
                    item.sprite = this.scene.add.sprite(slot.x + 30, slot.y + 30, item.iconKey)
                        .setDisplaySize(48, 48)
                        .setOrigin(0.5)
                        .setInteractive({ useHandCursor: true, draggable: true });
                    this.scene.input.setDraggable(item.sprite);
                }
                item.sprite.x = slot.x + 30;
                item.sprite.y = slot.y + 30;
                item.slotIndex = i + 1;
                this.container.add(item.sprite);

                // Active le drag sur le sprite
                if (typeof item.makeDraggable === 'function') {
                    item.makeDraggable();
                } else {
                    this.scene.input.setDraggable(item.sprite);
                }

                // Ajoute le dragend/snap ici si besoin
                item.sprite.on('dragend', (pointer) => {
                    if (item.sprite) item.sprite.setAlpha(1);
                    this.isDraggingElement = false;
                    let dropped = false;
                    if (this.dropTargets) {
                        for (const { folder, plus } of this.dropTargets) {
                            const bounds = folder.getBounds();
                            if (Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y)) {
                                if (!folder.inventory) folder.inventory = [];
                                if (folder !== this.folder) {
                                    // Retire l'item du dossier courant AVANT de l'ajouter au nouveau
                                    const idx = this.folder.inventory.indexOf(item);
                                    if (idx !== -1) {
                                        this.folder.inventory.splice(idx, 1);
                                        // Ajoute à la fin du dossier cible SEULEMENT si pas déjà présent
                                        if (!folder.inventory.includes(item)) {
                                            folder.inventory.push(item);
                                            item.owner = folder;
                                        }
                                    }
                                }
                                // Rafraîchir l'inventaire du dossier cible si ouvert
                                if (this.scene.folderInventoryUI && this.scene.folderInventoryUI.folder === folder) {
                                    this.scene.folderInventoryUI.refresh();
                                }
                                // Rafraîchir l'inventaire du dossier source si ouvert
                                if (this.scene.folderInventoryUI && this.scene.folderInventoryUI.folder === this.folder) {
                                    this.scene.folderInventoryUI.refresh();
                                }
                                dropped = true;
                                break;
                            }
                        }
                    }
                    this.hideDropTargets();
                    if (!dropped) {
                        // Snap dans l'inventaire courant (logique existante)
                        let minDist = Infinity;
                        let closestSlot = null;
                        let closestIndex = -1;
                        for (let s = 1; s < this.slots.length; s++) {
                            const slotObj = this.slots[s];
                            const dx = item.sprite.x - (slotObj.x + 30);
                            const dy = item.sprite.y - (slotObj.y + 30);
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < minDist) {
                                minDist = dist;
                                closestSlot = slotObj;
                                closestIndex = s;
                            }
                        }
                        if (closestSlot && minDist < 40) {
                            item.sprite.x = closestSlot.x + 30;
                            item.sprite.y = closestSlot.y + 30;
                            if (item.slotIndex !== closestIndex) {
                                const tmp = inventory[closestIndex - 1];
                                inventory[closestIndex - 1] = inventory[item.slotIndex - 1];
                                inventory[item.slotIndex - 1] = tmp;
                                item.slotIndex = closestIndex;
                                this.refresh();
                            }
                        } else {
                            const origSlot = this.slots[item.slotIndex];
                            if (origSlot && item.sprite) {
                                item.sprite.x = origSlot.x + 30;
                                item.sprite.y = origSlot.y + 30;
                            }
                        }
                    }
                });
                item.sprite.on('drag', (pointer, dragX, dragY) => {
                    console.log('drag', dragX, dragY);
                    item.sprite.x = dragX;
                    item.sprite.y = dragY;
                });
                item.sprite.on('dragstart', () => {
                    this.showDropTargets(this.folder);
                    this.isDraggingElement = true;
                    item.sprite.setAlpha(0.5);
                });
            }
        }

        background.on('pointerdown', (pointer) => this.onDragStart(pointer));
        this.scene.input.on('pointermove', this.onDragMove, this);
        this.scene.input.on('pointerup', this.onDragEnd, this);
    }

    addSlot() {
        const slotSize = 60, padding = 10, slotsPerRow = 5, startX = 20, startY = 50;
        const index = this.slots.length;
        const x = startX + (index % slotsPerRow) * (slotSize + padding);
        const y = startY + Math.floor(index / slotsPerRow) * (slotSize + padding);

        const slot = this.scene.add.rectangle(x, y, slotSize, slotSize, 0x333333)
            .setOrigin(0)
            .setStrokeStyle(1, 0xffffff)
            .setInteractive();

        slot.on('pointerdown', (pointer, x, y, event) => event?.stopPropagation());
        slot.on('pointerup', (pointer, x, y, event) => {
            event?.stopPropagation();
            if (this.isDraggingElement) this.onDropElementInSlot(slot);
        });

        this.container.add(slot);
        this.slots.push(slot);

        const rows = Math.ceil(this.slots.length / slotsPerRow);
        const newHeight = startY + rows * slotSize + (rows - 1) * padding + 20;
        const newWidth = startX + slotsPerRow * slotSize + (slotsPerRow - 1) * padding + 20;
        const background = this.container.list[0];

        background.displayHeight = newHeight;
        background.displayWidth = newWidth;
        this.container.setSize(newWidth, newHeight);
        this.windowWidth = newWidth;
    }

    onDropElementInSlot(slot = null) {
        if (this.isSlotEmpty(slot)) this.addSlot();
    }

    isSlotEmpty() {
        return true;
    }

    onDragStart(pointer) {
        this.dragging = true;
        this.offsetX = pointer.x - this.container.x;
        this.offsetY = pointer.y - this.container.y;
    }

    onDragMove(pointer) {
        if (this.dragging) {
            let newX = pointer.x - this.offsetX;
            let newY = pointer.y - this.offsetY;
            const containerWidth = this.windowWidth || 220;
            const containerHeight = this.container.height || this.container.displayHeight;
            newX = Phaser.Math.Clamp(newX, 0, this.scene.scale.width - containerWidth);
            newY = Phaser.Math.Clamp(newY, 0, this.scene.scale.height - containerHeight);
            this.container.setPosition(newX, newY);
        }
    }

    onDragEnd() {
        this.dragging = false;
    }

    close() {
        if (this.container) {
            this.container.destroy();
            this.container = null;
            this.slots = [];
        }
        // Retire l'instance de la liste si la fenêtre était ouverte
        if (this.isQuantumModalOpen) {
            FolderInventoryUI.openModals = FolderInventoryUI.openModals.filter(inst => inst !== this);
            this.isQuantumModalOpen = false;
        }
    }

    addDefaultItem() {
        if (!this.slots[0]) return;
        const slot = this.slots[0];
        // Si déjà un wallet, détruis-le
        if (this.defaultItemImage) this.defaultItemImage.destroy();
        const item = new QuantumWallet(this.scene, slot.x + 30, slot.y + 30);
        this.container.add(item);
        this.defaultItemImage = item;
    }

    showQuantumCashWindow() {
        if (this.quantumCashModal) this.quantumCashModal.destroy();

        // Filtre les dossiers vivants uniquement
        const allFolders = this.scene.folders || [];
        const folders = allFolders
            .map((f, idx) => ({
                folder: f,
                label: f.name || `Dossier ${idx + 1}`,
                index: idx,
                isDead: f.hp <= 0 || !f.body
            }))
            .filter(f => !f.isDead); // Pour l'affichage

        let totalCash = folders.reduce((sum, f) => sum + (f.folder.money || 0), 0);
        // Filtre les dossiers vivants uniquement
        const sliders = [];
        const modal = this.scene.add.container(this.scene.scale.width / 2, this.scene.scale.height / 2).setDepth(100);
        this.quantumCashModal = modal;

        const bgHeight = 200 + folders.length * 40;
        const bg = this.scene.add.rectangle(0, 0, 640, bgHeight, 0x222222, 0.98)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff);
        modal.add(bg);

        const title = this.scene.add.text(0, -bgHeight / 2 + 40, 'Répartition Quantum Cash', { fontSize: '20px', color: '#fff' }).setOrigin(0.5);
        const cashText = this.scene.add.text(0, -bgHeight / 2 + 80, `Total : ${totalCash} Quantum`, { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
        const myCashText = this.scene.add.text(
            0,
            -bgHeight / 2 + 110,
            `${this.folder?.name || 'Ce dossier'} : ${this.folder.money || 0} Q`,
            { fontSize: '16px', color: '#ff0' }
        ).setOrigin(0.5);
        modal.add([title, cashText, myCashText]);

        let percents = folders.map(f => {
            const sid = f.folder.socketId;
            const cached = this.scene.lastQuantumDistribution[sid];
            if (cached !== undefined && totalCash) {
                return Math.round(cached * 100 / totalCash);
            }
            return Math.round((f.folder.money || 0) * 100 / totalCash);
        });

        // Corriger si somme ≠ 100 à l’ouverture
        let totalPercent = percents.reduce((a, b) => a + b, 0);
        if (totalPercent !== 100 && percents.length > 0) {
            percents[percents.length - 1] += 100 - totalPercent;
        }

        // --- Fonction pour mettre à jour l'affichage SANS modifier les montants locaux ---
        const updateSliders = () => {
            let sum = 0;
            for (let i = 0; i < sliders.length - 1; i++) sum += sliders[i].percent;
            sliders[sliders.length - 1].percent = 100 - sum;
            sliders[sliders.length - 1].handle.x = -120 + 2.4 * sliders[sliders.length - 1].percent;
            sliders.forEach((slider, i) => {
                slider.percentText.setText(slider.percent + " %");
                slider.cashText.setText(Math.round(totalCash * slider.percent / 100) + " Q");
            });
            if (myCashText && this.folder) {
                const idx = folders.findIndex(f => f.folder === this.folder);
                const percent = sliders[idx]?.percent ?? 0;
                myCashText.setText(`Ce dossier : ${Math.round(totalCash * percent / 100)} Q`);
            }
            // Ajoute cette ligne pour forcer le rafraîchissement visuel immédiat
            this.refreshQuantumCashModal && this.refreshQuantumCashModal();
        };

        folders.forEach((f, i) => {
            const y = -bgHeight / 2 + 150 + i * 40;
            const label = this.scene.add.text(-230, y, f.label, { fontSize: '16px', color: f.isDead ? '#888' : '#fff' }).setOrigin(0, 0.5);
            const sliderBg = this.scene.add.rectangle(0, y, 240, 8, f.isDead ? 0x888888 : 0xffffff).setOrigin(0.5);
            const handle = this.scene.add.circle(-120 + 2.4 * percents[i], y, 12, f.isDead ? 0x444444 : 0x8888ff).setInteractive({ draggable: !f.isDead });
            const percentText = this.scene.add.text(130, y, percents[i] + " %", { fontSize: '16px', color: f.isDead ? '#888' : '#fff' }).setOrigin(0, 0.5);
            const cashText = this.scene.add.text(190, y, f.isDead ? "0 Q" : (Math.round(totalCash * percents[i] / 100) + " Q"), { fontSize: '16px', color: f.isDead ? '#888' : '#fff' }).setOrigin(0, 0.5);

            const slider = { handle, percent: f.isDead ? 0 : percents[i], percentText, cashText };
            sliders.push(slider);

            if (!f.isDead && i < folders.length - 1) {
                handle.on('drag', (pointer, dragX) => {
                    dragX = Phaser.Math.Clamp(dragX, -120, 120);
                    let proposed = Math.max(0, Math.round((dragX + 120) / 2.4));
                    let sumOthers = 0;
                    for (let j = 0; j < sliders.length - 1; j++) if (j !== i) sumOthers += sliders[j].percent;
                    proposed = Math.min(proposed, 100 - sumOthers);
                    handle.x = -120 + 2.4 * proposed;
                    slider.percent = proposed;
                    updateSliders();

                    // Calcul de la distribution à envoyer au serveur
                    const distribution = {};
                    folders.forEach((f2, idx) => {
                        const amount = Math.round(totalCash * sliders[idx].percent / 100);
                        distribution[f2.folder.socketId] = amount;
                    });

                    // Sauvegarde locale
                    this.scene.lastQuantumDistribution = distribution;

                    // Envoi au serveur
                    this.scene.socket.emit('distribute-cash', distribution);
                });
                handle.on('dragstart', () => this.isDraggingQuantumSlider = true);
                handle.on('dragend', () => {
                    this.isDraggingQuantumSlider = false;

                    // Calcule la distribution finale
                    const totalCash = (this.scene.folders || []).reduce((sum, f) => sum + (f.money || 0), 0);
                    const amounts = allFolders.map((f, idx) => {
                        // Cherche le slider correspondant à ce dossier
                        const sliderIdx = folders.findIndex(ff => ff.index === idx);
                        if (sliderIdx !== -1) {
                            // Dossier vivant : valeur du slider
                            return Math.round(totalCash * sliders[sliderIdx].percent / 100);
                        }
                        // Dossier mort : 0
                        return 0;
                    });
                    // Envoi la distribution au serveur
                    this.scene.socket.emit('distribute-cash', { amounts });

                    // Optionnel : rafraîchir après la réponse serveur
                    setTimeout(() => this.refreshQuantumCashModal(), 100);
                });
                this.scene.input.setDraggable(handle);
            } else {
                handle.disableInteractive();
                handle.setFillStyle(0x888888);
            }

            modal.add([label, sliderBg, handle, percentText, cashText]);
        });

        updateSliders();

        const closeBtn = this.scene.add.text(bg.width / 2 - 20, -bgHeight / 2 + 20, '✖', { fontSize: '18px', color: '#ff5555' })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => {
                modal.destroy();
                this.quantumCashModal = null;
            });
        modal.add(closeBtn);

        this.quantumCashModal.cashText = cashText;
        this.quantumCashModal.myCashText = myCashText;
        this.quantumCashModal.sliders = sliders;

        this.isQuantumModalOpen = true;
        if (!FolderInventoryUI.openModals.includes(this)) {
            FolderInventoryUI.openModals.push(this);
        }
        // Affiche les valeurs à jour dès l'ouverture
        this.refreshQuantumCashModal();
    }

    closeQuantumCashWindow() {
        if (this.quantumCashModal) {
            this.quantumCashModal.destroy();
            this.quantumCashModal = null;
        }
        if (this.isQuantumModalOpen) {
            FolderInventoryUI.openModals = FolderInventoryUI.openModals.filter(inst => inst !== this);
            this.isQuantumModalOpen = false;
        }
    }

    refresh() {
        // Détruit tous les slots et sprites d'items
        if (this.container) {
            this.container.removeAll(true);
            this.slots = [];
        }
        // Rouvre l'inventaire pour tout réafficher proprement
        this.open(this.folder);
    }

    refreshQuantumCashModal() {
        if (!this.quantumCashModal || this.isDraggingQuantumSlider) return;

        // Filtre les dossiers vivants uniquement
        const allFolders = this.scene.folders || [];
        const folders = allFolders
            .map((f, idx) => ({
                folder: f,
                label: f.name || `Dossier ${idx + 1}`,
                index: idx,
                isDead: f.hp <= 0 || !f.body
            }))
            .filter(f => !f.isDead); // Pour l'affichage

        const totalCash = folders.reduce((sum, f) => sum + (f.folder.money || 0), 0);

        if (this.quantumCashModal.cashText) {
            this.quantumCashModal.cashText.setText(`Total : ${totalCash} Quantum`);
        }

        const percents = folders.map(f => {
            const sid = f.folder.socketId;
            const cached = this.scene.lastQuantumDistribution[sid];
            if (cached !== undefined && totalCash) {
                return Math.round(cached * 100 / totalCash);
            }
            return Math.round((f.folder.money || 0) * 100 / totalCash);
        });

        // Corriger si somme ≠ 100 à l’ouverture
        let totalPercent = percents.reduce((a, b) => a + b, 0);
        if (totalPercent !== 100 && percents.length > 0) {
            percents[percents.length - 1] += 100 - totalPercent;
        }

        if (this.quantumCashModal.sliders) {
            this.quantumCashModal.sliders.forEach((slider, i) => {
                const percent = totalCash ? Math.round((folders[i].folder.money || 0) * 100 / totalCash) : 0;
                slider.percent = percent;
                slider.handle.x = -120 + 2.4 * percent;
                slider.percentText.setText(percent + " %");
                slider.cashText.setText(Math.round(totalCash * percent / 100) + " Q");
            });
        }
        // MAJ du quantum cash affiché pour le dossier courant
        if (this.quantumCashModal.myCashText && this.folder) {
            const idx = folders.findIndex(f => f.folder === this.folder);
            const percent = totalCash ? Math.round((this.folder.money || 0) * 100 / totalCash) : 0;
            this.quantumCashModal.myCashText.setText(
                `${this.folder?.name || 'Ce dossier'} : ${Math.round(totalCash * percent / 100)} Q`
            );
        }
    }

    showDropTargets(exceptFolder) {
        this.hideDropTargets(); // Nettoie d'abord les anciens overlays
        this.dropTargets = [];
        (this.scene.folders || []).forEach(folder => {
            if (folder === exceptFolder) return;
            // Ignore les dossiers morts ou sans body
            if (!folder.body || folder.hp <= 0) return;
            const bounds = folder.getBounds();
            // Ignore les dossiers dont les bounds sont invalides
            if (!bounds.width || !bounds.height) return;
            const plus = this.scene.add.rectangle(bounds.centerX, bounds.centerY, bounds.width, bounds.height, 0x00ff00, 0.15)
                .setOrigin(0.5)
                .setDepth(1000);
            const plusText = this.scene.add.text(bounds.centerX, bounds.centerY, '+', {
                fontSize: '48px',
                color: '#00ff00',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(1001);
            this.dropTargets.push({ folder, plus, plusText });
        });
    }

    hideDropTargets() {
        if (this.dropTargets) {
            this.dropTargets.forEach(({ plus, plusText }) => {
                plus.destroy();
                plusText.destroy();
            });
            this.dropTargets = [];
        }
    }

    updateDropTargets() {
        if (!this.dropTargets) return;
        this.dropTargets.forEach(({ folder, plus, plusText }) => {
            const bounds = folder.getBounds();
            plus.setPosition(bounds.centerX, bounds.centerY);
            plus.displayWidth = bounds.width;
            plus.displayHeight = bounds.height;
            plusText.setPosition(bounds.centerX, bounds.centerY);
        });
    }
}
