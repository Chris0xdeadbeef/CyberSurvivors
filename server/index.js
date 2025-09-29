// server/index.js
const express = require('express');
const path = require('path');
const { Server } = require('socket.io');
const VirusManager = require('./game/managers/VirusManager.js');
const GameSession = require('./game/GameSession.js');
const { Player } = require('./game/Player.js');

const app = express();

/* — Sécurité cache navigateur — */
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

/* — Serveur HTTP simple — */
const server = require('http').createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

/* — États serveur — */
let playerCount = 0;
const desktopSizes = {};
const virusManagers = {};
const playersInGame = new Set();
const gameSessions = {};
const players = {};

/* — Boucle principale (100 ms) — */
setInterval(() => {
    const now = Date.now();

    for (const socketId of [...playersInGame]) {
        const socketAlive = io.sockets.sockets.has(socketId);
        const manager = virusManagers[socketId];

        if (!manager || !socketAlive) {
            console.warn(`⚠️ Suppression socketId fantôme : ${socketId}`);
            playersInGame.delete(socketId);
            continue;
        }

        const size = desktopSizes[socketId] || { width: 1920, height: 1080 };
        const updates = manager.update(now, size.width, size.height);

        if (updates.newVirus) {
            console.log(`🧬 Virus spawné pour ${socketId} :`, updates.newVirus);
            io.to(socketId).emit('spawn-virus', updates.newVirus);
        }

        if (updates.killedViruses?.length > 0) {
            io.to(socketId).emit('kill-viruses', updates.killedViruses);
        }
    }
}, 100);

/* — Connexion client — */
io.on('connection', (socket) => {
    ++playerCount;
    const ipAddress = socket.handshake.address;
    console.log(`🟢 Connexion : ${socket.id} (IP : ${ipAddress}) (Total : ${playerCount})`);

    players[socket.id] = new Player(socket);

    io.emit('playerCount', playersInGame.size);
    socket.emit('init-viruses', []);

    socket.on('damage-virus', ({ virusId, amount }) => {
        const manager = virusManagers[socket.id];
        if (!manager) return;
        const result = manager.handleDamage(virusId, amount);
        if (result) socket.emit('virus-damage-result', result);
    });

    socket.on('startGame', ({ width, height }) => {
        if (!virusManagers[socket.id]) virusManagers[socket.id] = new VirusManager();

        if (!gameSessions[socket.id]) {
            const virusManager = virusManagers[socket.id];
            gameSessions[socket.id] = new GameSession(
                socket,
                600,
                (sid) => {
                    playersInGame.delete(sid);
                    delete gameSessions[sid];
                    delete virusManagers[sid];
                    delete desktopSizes[sid];
                },
                width,
                height,
                virusManager
            );
        }

        socket.on('resize', ({ width, height }) => {
            if (typeof width === 'number' && typeof height === 'number') {
                desktopSizes[socket.id] = { width, height };
                console.log(`📐 Resize : ${socket.id} -> ${width}x${height}`);
            }
        });

        playersInGame.add(socket.id);
        desktopSizes[socket.id] = { width, height };

        console.log(`🎮 ${socket.id} a démarré une session (${width}x${height})`);
        socket.emit('init-viruses', virusManagers[socket.id].getAllVirusData());
        io.emit('playerCount', playersInGame.size);
    });

    socket.on('pickup-cash', ({ amount, folderIndex }) => {
        if (typeof amount !== 'number' || amount <= 0) return;
        const player = players[socket.id];
        if (!player) return;
        player.addMoneyToFolder(amount, folderIndex);
        socket.emit('money-update', { amounts: player.getAllFoldersMoney() });
    });

    socket.on('distribute-cash', ({ amounts }) => {
        const player = players[socket.id];
        if (!player || !Array.isArray(amounts)) return;
        amounts.forEach((amount, i) => player.setMoney(amount, i));
        socket.emit('money-update', { amounts: player.getAllFoldersMoney() });
    });

    socket.on('disconnect', () => {
        playerCount--;
        const isInGame = playersInGame.delete(socket.id);
        const hadSession = !!gameSessions[socket.id];
        const hadManager = !!virusManagers[socket.id];

        if (hadSession) {
            gameSessions[socket.id].stop();
            delete gameSessions[socket.id];
        }

        delete virusManagers[socket.id];
        delete desktopSizes[socket.id];
        setImmediate(() => playersInGame.delete(socket.id));
        delete players[socket.id];

        console.log(`🔴 Déconnexion : ${socket.id} (IP : ${ipAddress}) (Total : ${playerCount})`);
        console.log(`🧹 Nettoyage – Session: ${hadSession}, VirusManager: ${hadManager}, InGame: ${isInGame}`);
        io.emit('playerCount', playersInGame.size);
    });
});

/* — Routes config d’abord — */
const configRoutes = require('./routes/configRoutes.js');
app.use('/config', configRoutes);

/* — Puis fichiers statiques — */
app.use(express.static(path.join(__dirname, '../client')));

/* — Lancement serveur — */
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur Socket.io en écoute sur le port ${PORT}`);
});

/* — Fermeture propre — */
function gracefulShutdown() {
    console.log('\n⏳ Arrêt en cours…');
    server.close(() => {
        console.log('✅ Serveur arrêté.');
        process.exit(0);
    });
}
process.once('SIGINT', gracefulShutdown);
process.once('SIGTERM', gracefulShutdown);
