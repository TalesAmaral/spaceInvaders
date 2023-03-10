import Phaser from '../lib/phaser.js'

export default class Start extends Phaser.Scene {
  constructor() {
    super('start')
  }

  preload() {
    this.load.image('space', './src/assets/img/SpaceBackground.jpg')
  }

  create() {
    this.add.tileSprite(0, 0, 800, 600, 'space').setOrigin(0);
    const textStyle = { 
      color: '#00FF00',
      fontSize: 50,
    };

    const text = this.add.text(325, 275, 'START', textStyle).setInteractive();
    text.on('pointerdown', () => {
      this.scene.start('game');
      this.game.sound.stopAll();
    })
  }

  update() {
    
  }
}

