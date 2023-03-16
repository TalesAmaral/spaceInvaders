import Phaser from '../lib/phaser.js';

export default class Start extends Phaser.Scene {
  constructor() {
    super('start');
  }

  preload() {
    this.load.image('space', './src/assets/img/SpaceBackground.jpg');
    this.load.image('ship', './src/assets/img/ship_1.png');
    this.load.spritesheet('bullet', './src/assets/img/shot.png', {
      frameWidth: 48,
      frameHeigth: 48,
    });
    this.load.image('asteroid', './src/assets/img/astr.png');
    this.load.image('enemy', './src/assets/img/ship_3.png');
    this.load.image('enemy2', './src/assets/img/ship_4.png');

    this.load.audio('fireSound', './src/assets/audio/shotfire.wav');
    this.load.audio('deathEnemy', './src/assets/audio/enemyDeath.wav');

    this.load.image('left-cap-red', './src/assets/img/barHorizontal_red_left.png');
    this.load.image('middle-red', './src/assets/img/barHorizontal_red_mid.png');
    this.load.image('right-cap-red', './src/assets/img/barHorizontal_red_right.png');

    this.load.image('left-cap-green', './src/assets/img/barHorizontal_green_left.png');
    this.load.image('middle-green', './src/assets/img/barHorizontal_green_mid.png');
    this.load.image('right-cap-green', './src/assets/img/barHorizontal_green_right.png');

    this.load.image('left-cap-shadow', './src/assets/img/barHorizontal_shadow_left.png');
    this.load.image('middle-shadow', './src/assets/img/barHorizontal_shadow_mid.png');
    this.load.image('right-cap-shadow', './src/assets/img/barHorizontal_shadow_right.png');
  }

  create() {
    this.add.tileSprite(0, 0, 800, 600, 'space').setOrigin(0);
    const textStyle = { color: '#00FF00', fontSize: 50 };

    const text = this.add.text(325, 275, 'START', textStyle).setInteractive();
    text.on('pointerdown', () => {
      this.scene.start('game');
      this.game.sound.stopAll();
    });
  }
}
