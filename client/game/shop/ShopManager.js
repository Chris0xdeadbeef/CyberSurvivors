export default class ShopManager {
    constructor(player) {
        this.player = player; // référence au joueur ou à son inventaire
    }

    canAfford(price) {
        return this.player.quantum >= price;
    }

    buyItem(item) {
        if (!this.canAfford(item.price)) {
            // Affiche un message d'erreur ou feedback
            console.log("Pas assez de Quantum !");
            return false;
        }
        // Déduit le prix
        this.player.quantum -= item.price;
        // Ajoute l'item à l'inventaire (à adapter selon ta structure)
        this.player.inventory.push(item);
        // Feedback succès
        console.log(`Acheté : ${item.name}`);
        return true;
    }
}