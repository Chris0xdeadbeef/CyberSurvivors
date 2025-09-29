//client/game/animations/Animations.js

export function registerAnimations(scene, config) {
  if (!config || typeof config !== 'object') {
    console.warn("⚠️ registerAnimations appelé avec une valeur invalide :", config);
    return;
  }

  for (const [name, data] of Object.entries(config)) {
    console.log(`🎞️ Enregistrement animation pour : ${name}`, data);

    if (!data.animation || !data.sprite) {
      console.warn(`⚠️ Animation ignorée pour ${name} (animation ou sprite manquant)`);
      continue;
    }

    scene.anims.create({
      key: data.animation,
      frames: scene.anims.generateFrameNumbers(data.sprite, {
        start: 0,
        end: data.framesEnd ?? 7
      }),
      frameRate: data.frameRate ?? 9,
      repeat: -1
    });
  }
}

