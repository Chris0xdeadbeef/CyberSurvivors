//server/game/managers/VirusManager.js

const crypto = require('crypto');

class VirusManager {
    constructor(io) {
        this.io = io;  // Passer la référence du serveur socket.io
        this.viruses = [];
        this.maxViruses = 100;
    }

    update(time, width, height) {
        const killedViruses = [];

        // Nettoie les virus morts
        this.viruses = this.viruses.filter(v => {
            if (v.hp <= 0) {
                killedViruses.push(v.id);
                return false;
            }
            return true;
        });

        return { killedViruses };
    }

    spawnVirus(type, width, height) {
        const id = crypto.randomUUID();

        // Corrige les coins pour être à l'intérieur de l'écran
        const maxX = Math.max(0, width - 1);
        const maxY = Math.max(0, height - 1);
        const corners = [
            [0, 0],            // Haut gauche
            [maxX, 0],         // Haut droit
            [0, maxY],         // Bas gauche
            [maxX, maxY]       // Bas droit
        ];
        const [x, y] = corners[Math.floor(Math.random() * corners.length)];

        const virus = {
            id,
            type,
            x,
            y,
            hp: 100
        };

        this.viruses.push(virus);
        console.log(`🦠 Serveur : nouveau ${type} (${id}) à (${x}, ${y})`);

        return virus;
    }

    handleDamage(virusId, amount) {
        const virus = this.viruses.find(v => v.id === virusId);
        if (!virus) return null;

        virus.hp -= amount;

        if (virus.hp <= 0) {
            console.log(`💀 Virus détruit : ${virusId}`);
            return { destroyed: true, id: virusId };
        }

        return { destroyed: false, id: virusId, hp: virus.hp };
    }

    getAllVirusData() {
        return this.viruses.map(v => ({
            id: v.id,
            type: v.type,
            x: v.x,
            y: v.y,
            hp: v.hp
        }));
    }

    clearAll() {
        this.viruses = [];
    }
}

module.exports = VirusManager;
