// client/audio.js

const menuMusic = new Audio('./audio/mainmenu.mp3');
menuMusic.loop = true;
menuMusic.volume = 0.5;

// Tentative immédiate au chargement
menuMusic.play().catch(() => {
  console.warn("⚠️ Lecture auto bloquée. En attente d'une interaction utilisateur.");
});

// Dès que le DOM est prêt
window.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById("startBtn");
  const musicToggle = document.getElementById("musicToggle");

  // Si l'utilisateur interagit, relancer la lecture
  document.body.addEventListener("click", tryPlayMusicOnce, { once: true });

  function tryPlayMusicOnce() {
    if (musicToggle?.checked) {
      menuMusic.play().catch(() => console.warn("⚠️ Lecture échouée même après interaction."));
    }
  }

  // Stop musique au lancement du jeu
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      menuMusic.pause();
      menuMusic.currentTime = 0;
    });
  }

  // Toggle musique ON/OFF
  if (musicToggle) {
    musicToggle.addEventListener("change", () => {
      if (musicToggle.checked) {
        menuMusic.play().catch(() => {});
      } else {
        menuMusic.pause();
      }
    });
  }
});
