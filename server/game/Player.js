// server/game/Player.js

class Player {
  constructor(socket) {
    this.socketId = socket.id;
    this.socket = socket;
    // Passe d'un seul montant à un tableau de montants pour chaque dossier
    this.money = [0, 0, 0, 0]; // ← 4 dossiers par défaut, adapte si besoin
  }

  addMoneyToFolder(amount, folderIndex) {
    if (typeof folderIndex === 'number' && this.money[folderIndex] !== undefined) {
      this.money[folderIndex] += amount;
    }
  }

  setMoney(amount, folderIndex = 0) {
    if (Array.isArray(this.money)) {
      if (typeof folderIndex === 'number' && this.money[folderIndex] !== undefined) {
        this.money[folderIndex] = amount;
      }
    } else {
      this.money = amount;
    }
  }

  getMoney(folderIndex = 0) {
    if (Array.isArray(this.money)) {
      return this.money[folderIndex] || 0;
    }
    return this.money;
  }

  getAllFoldersMoney() {
    return Array.isArray(this.money) ? this.money : [this.money];
  }

  setFolderDead(folderIndex) {
    if (Array.isArray(this.money) && typeof folderIndex === 'number' && this.money[folderIndex] !== undefined) {
        this.money[folderIndex] = 0;
    }
}
}

module.exports = { Player };
