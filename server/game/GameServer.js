// server/game/GameServer.js
const { Player } = require('./Player.js');

class GameServer {
  constructor() {
    this.players = [];
  }

  addPlayer(socket) {
    const player = new Player(socket.id);
    this.players.push(player);
    socket.emit('playerId', socket.id);
    socket.emit('gameStarted', { coop: true, money: player.money });
    this.updatePlayerCount();
  }

  updatePlayerCount() {
    this.players.forEach(player => {
      player.socket.emit('playerCount', this.players.length);
    });
  }

  startGame(data) {
    // Démarre le jeu et génère des virus
    console.log('Jeu démarré avec coopMode:', data.coopMode);
  }     
}

module.exports = { GameServer };
