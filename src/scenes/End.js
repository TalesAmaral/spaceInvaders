import Phaser from '../lib/phaser.js';

export default class Start extends Phaser.Scene {
  constructor() {
    super('end');
  }

  create() {
    const textStyle = {
      color: '#FF0000',
      fontSize: 50,
    };
    const text = this.add.text(325, 275, 'RESTART', textStyle).setInteractive();
    text.on('pointerdown', () => {
      this.scene.stop();
      this.scene.start('game');
      this.game.sound.stopAll();
    });

    // o menu ainda roda a logica do game, causando erros no log, tem q corrigir

      const text2 = this.add.text(325, 310, 'MENU', textStyle).setInteractive();
      text2.on('pointerdown', () => {
        this.scene.stop();
        this.scene.stop('game')
        this.scene.start('start');
        this.game.sound.stopAll();
      })

  }
}
