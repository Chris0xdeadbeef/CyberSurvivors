//server/game/config/WavesConfig.js
module.exports = {
  waves: [
    {
      waveNumber: 1,
      startTime: 0,              // Temps en secondes avant le début du spawn de la vague
      delayBetweenSpawns: 1,     // Délai entre chaque spawn en secondes
      viruses: [
        /*{ type: 'adware', count: 5 },*/
        { type: 'spyware', count: 200 }
      ]
    },
    {
      waveNumber: 2,
      startTime: 60,             // La vague commence à 60 secondes
      delayBetweenSpawns: 5,     // Délai entre chaque spawn
      viruses: [
        { type: 'adware', count: 5 }
      ]
    },
    {
      waveNumber: 3,
      startTime: 120,
      delayBetweenSpawns: 4,
      viruses: [
        { type: 'adware', count: 5 },
        { type: 'spyware', count: 5 },
       /* { type: 'ransomware', count: 3 }*/
      ]
    }
  ]
};
