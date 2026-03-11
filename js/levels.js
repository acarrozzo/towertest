// Level and wave configuration
const LEVELS = [
  {
    level: 1,
    enemyType: 'basic',
    count: 20,
    spawnInterval: 1200,
    description: 'Level 1 — Basic Enemies'
  },
  {
    level: 2,
    enemyType: 'fast',
    count: 20,
    spawnInterval: 800,
    description: 'Level 2 — Fast Enemies'
  },
  {
    level: 3,
    enemyType: 'armored',
    count: 20,
    spawnInterval: 1400,
    description: 'Level 3 — Armored Enemies'
  },
  {
    level: 4,
    enemyType: 'elite',
    count: 20,
    spawnInterval: 1000,
    description: 'Level 4 — Elite Enemies'
  },
  {
    level: 5,
    enemyType: 'basic',
    count: 19,
    spawnInterval: 1000,
    boss: true,
    description: 'Level 5 — Final Wave + Boss'
  }
];

const ENEMY_STATS = {
  basic: {
    hp: 60, speed: 1.5, reward: 10,
    color: '#5cf', size: 10,
    armorResist: 0
  },
  fast: {
    hp: 40, speed: 2.8, reward: 8,
    color: '#ff8', size: 8,
    armorResist: 0
  },
  armored: {
    hp: 180, speed: 0.9, reward: 20,
    color: '#9a9', size: 12,
    armorResist: 0.5
  },
  elite: {
    hp: 150, speed: 1.8, reward: 15,
    color: '#f88', size: 11,
    armorResist: 0
  },
  boss: {
    hp: 1000, speed: 0.8, reward: 75,
    color: '#f4f', size: 20,
    armorResist: 0.2
  }
};

// HP scales per level
const HP_SCALE = [1, 1.4, 2.0, 2.8, 3.8];
