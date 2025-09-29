//client/game/managers/CollisionManager.js

export function setupCollisionHandlers(scene, virusManager, folders) {
  scene.matter.world.on('collisionstart', (event) => {
    event.pairs.forEach(({ bodyA, bodyB }) => {
      const labelA = (bodyA.label || '').toLowerCase();
      const labelB = (bodyB.label || '').toLowerCase();

      const gameObjectA = bodyA.gameObject;
      const gameObjectB = bodyB.gameObject;

      // Dossier
      const folder =
        labelA === 'folder' ? gameObjectA :
          labelB === 'folder' ? gameObjectB : null;

      // Virus (par isEnemy flag si présent)
      const virus = (gameObjectA?.isEnemy) ? gameObjectA :
        (gameObjectB?.isEnemy) ? gameObjectB : null;

      // Projectile joueur
      const playerProjectile =
        labelA === 'ballisticcursor' ? gameObjectA :
          labelB === 'ballisticcursor' ? gameObjectB : null;

      // QuantumCash
      const cash =
        labelA === 'quantum_cash' ? gameObjectA :
        labelB === 'quantum_cash' ? gameObjectB : null;

      // --- Cas : virus touche dossier ---
      if (folder && virus && folder.active && virus.active && typeof folder.takeDamage === 'function') {
        folder.takeDamage(1); // ou virus.damage si virus offensif
      }

      // --- Cas : projectile touche virus ---
      if (playerProjectile && virus && playerProjectile.active && virus.active && typeof virus.takeDamage === 'function') {
        virus.takeDamage(playerProjectile.damage);

        // Gestion du piercing
        --playerProjectile.piercing;
        if (playerProjectile.piercing <= 0) {
          playerProjectile.destroy();
        }
      }

      // --- Cas : dossier touche argent ---
      if (folder && cash && folder.active && cash.active) {
        if (typeof cash.amount === 'number') {
          // Trouve l'index du dossier qui ramasse
          const folderIndex = scene.folders.indexOf(folder);
          scene.socket.emit('pickup-cash', { amount: cash.amount, folderIndex });
        }
        cash.destroy();
      }
    });

    if (scene.folderInventoryUI && scene.folderInventoryUI.refreshQuantumCashModal) {
      scene.folderInventoryUI.refreshQuantumCashModal();
    }
  });
}
