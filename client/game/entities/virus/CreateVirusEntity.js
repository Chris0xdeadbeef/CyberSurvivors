// client/game/entities/virus/CreateVirusEntity.js
import VirusBase from './VirusBase.js';
import { IMovable } from './interfaces/IMovable.js';
import { IDamageable } from './interfaces/IDamageable.js';
import { Categories } from '../constants/CollisionCategories.js';

const VirusClass = IMovable(IDamageable(VirusBase));

let VirusTypes = {}; // sera rempli dynamiquement

/**
 * Charge les types de virus depuis le serveur (fichier JSON partagé)
 */
export async function loadVirusTypes() {
  try {
    const res = await fetch('/config/virus-types');
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
    const data = await res.json();
    VirusTypes = data; // stockage local si nécessaire
    console.log('🧬 VirusConfig chargés :', Object.keys(VirusTypes));
    return data; // ✅ retour explicite des données
  } catch (err) {
    console.error('❌ Échec du chargement des VirusConfig :', err);
    throw err;
  }
}

/**
 * Crée une instance de virus avec les bons paramètres
 */
export function createVirusEntity(type, scene) {
  const config = VirusTypes[type];
  if (!config) throw new Error(`❌ Virus inconnu : ${type}`);

  const options = {
    sprite: config.sprite,
    speed: config.speed,
    scale: config.scale,
    maxHP: config.maxHP,
    collisionCategory: Categories.VIRUS,
    radius: config.radius,
    animation: config.animation,
    type, // ajout explicite
  };

  const virus = new VirusClass(scene, options);
  if (virus.visual && typeof virus.visual.play === 'function') {
    virus.visual.play(config.animation);
  } else {
    console.warn(`⚠️ Animation non jouée : 'visual' manquant ou invalide pour ${type}`);
  }

  console.log(`▶️ Création de virus ${type}, sprite = ${config.sprite}, animation = ${config.animation}`);
  console.log("🧪 Animations disponibles :", scene.anims.anims.entries);

  return virus;
}
