import { createVirusEntity } from '../entities/virus/CreateVirusEntity.js';

export default class VirusManager {
    constructor(scene) {
        this.scene = scene;
        this.viruses = new Map(); // Map id -> virus object
    }

    spawnVirusFromData(data) {
        if (!data.type) {
            console.warn("⚠️ Tentative de spawn avec un type de virus invalide :", data);
            return;
        }

        let virus;
        try {
            virus = createVirusEntity(data.type, this.scene);
        } catch (e) {
            console.warn(`⚠️ Échec de création du virus : ${e.message}`);
            return;
        }

        const x = data.x ?? 0;
        const y = data.y ?? 0;

        virus.setPosition(x, y);
        virus.id = data.id;

        if (typeof data.hp === 'number') {
            virus.hp = data.hp;
        }

        this.viruses.set(data.id, virus);
        console.log(`🧬 Client : virus ${data.type} spawné (${data.id}) à (${x}, ${y})`);
    }

    update() {
        for (const [id, virus] of this.viruses.entries()) {
            if (!virus.active || virus.hp <= 0) {
                virus.destroy();
                this.viruses.delete(id);
            } else {
                virus.preUpdate?.();
            }
        }
    }

    handleDamageFeedback(serverResponse) {
        const { id, hp, destroyed } = serverResponse;
        const virus = this.viruses.get(id);
        if (!virus) return;

        if (destroyed) {
            virus.takeDamage(virus.hp); // tue immédiatement
            console.log(`💀 Virus ${id} détruit`);
        } else {
            const damage = virus.hp - hp;
            if (damage > 0) {
                virus.takeDamage(damage);
                console.log(`💥 Virus ${id} subit ${damage} dégâts`);
            }
        }
    }

    clearAll() {
        this.viruses.forEach(v => v.destroy());
        this.viruses.clear();
        console.log("🧹 Tous les virus ont été supprimés");
    }

    removeVirusById(id) {
        const virus = this.viruses.get(id);
        if (virus) {
            virus.destroy();
            this.viruses.delete(id);
            console.log(`🧽 Suppression manuelle du virus ${id}`);
        } else {
            console.warn(`⚠️ Virus ${id} introuvable pour suppression`);
        }
    }
}
