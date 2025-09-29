//client/main.js
import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.88.2/dist/phaser.esm.js';
import { io } from 'https://cdn.socket.io/4.8.1/socket.io.esm.min.js';
import DesktopScene from './game/scenes/DesktopScene.js';
import { loadVirusTypes } from './game/entities/virus/CreateVirusEntity.js'; 

const startBtn = document.getElementById('startBtn');
const menuDiv = document.getElementById('menu');
const playerId = document.getElementById('playerId');
const playerCnt = document.getElementById('playerCount');
const coopCheck = document.getElementById('coopMode');

startBtn.disabled = true;
startBtn.textContent = '🔌 Connexion au serveur...';

let viruses = [];
const socket = io('/', {
  transports: ['websocket']
});

async function loadGameItems() {
  const res = await fetch('/config/game-items');
  return await res.json();
}

socket.on('connect', () => {
  playerId.textContent = socket.id;
  startBtn.disabled = false;
  startBtn.textContent = '🎮 Jouer';
});

socket.on('playerCount', (n) => {
  playerCnt.textContent = n;
});

socket.on('connect_error', () => {
  startBtn.disabled = true;
  startBtn.textContent = '❌ Serveur indisponible';
});

socket.on('disconnect', () => {
  startBtn.disabled = true;
  startBtn.textContent = '🔌 Déconnecté';
});

socket.on('init-viruses', (virusList) => {
  viruses = virusList;
  const scene = game?.scene?.getScene('DesktopScene');
  scene?.loadInitialViruses?.(viruses);
});

socket.on('spawn-virus', (virusData) => {
  const scene = game?.scene?.getScene('DesktopScene');
  scene?.spawnVirus?.(virusData);
});

socket.on('kill-viruses', (virusIds) => {
  const scene = game?.scene?.getScene('DesktopScene');
  scene?.removeViruses?.(virusIds);
});

let game = null;
let virusConfigs = {};
let entityConfigs = {};

async function createGame() {
  if (game) return;

  try {
    virusConfigs = await loadVirusTypes();
    entityConfigs = await loadGameItems();    

    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'gameContainer',
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#1d1d1d',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      physics: {
        default: 'matter',
        matter: {
          debug: false,
          gravity: { y: 0 }
        }
      },
      scene: []
    });

    game.scene.add('DesktopScene', DesktopScene, true, {
      socket,
      virusTypes: virusConfigs,
      entityConfigs: entityConfigs
    });

  } catch (err) {
    console.error("❌ Erreur lors du chargement des VirusTypes :", err);
    alert("Erreur de chargement des données du jeu. Veuillez réessayer.");
    startBtn.disabled = true;
    startBtn.textContent = '⚠️ Échec de chargement';
  }
}

startBtn.addEventListener('click', () => {
  socket.emit('startGame', {
    coopMode: coopCheck.checked,
    width: window.innerWidth,
    height: window.innerHeight
  });

  menuDiv.remove();
  createGame(); 
});

let resizeTimeout = null;
window.addEventListener('resize', () => {
  if (game && game.scale) {
    game.scale.resize(window.innerWidth, window.innerHeight);
  }

  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    socket.emit('resize', {
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, 200); // ⏱️ 200ms après dernier resize
});


