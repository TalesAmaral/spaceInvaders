import Phaser from "./lib/phaser.js";

import Start from "./scenes/Start.js";
import Game from "./scenes/Game.js";
import End from "./scenes/End.js";

let config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
  },
  scene: [Start, Game, End],
};

export default new Phaser.Game(config);
