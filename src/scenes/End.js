import Phaser from '../lib/phaser.js';

export default class Start extends Phaser.Scene {
  constructor() {
    super('end');
  }
  init(data){
    this.score = data.score;
  }

  create() {
    const textStyle = { color: '#00FF00', fontSize: 50 };
    const text = this.add.text(400, 300 -50, 'RESTART', textStyle).setInteractive().setOrigin(0.5);
    text.on('pointerdown', () => {
      this.scene.stop();
      this.scene.start('game');
      this.game.sound.stopAll();
    });
    text.setShadow(2, 2, "#000000", 2, true, true);

    // o menu ainda roda a logica do game, causando erros no log, tem q corrigir

      const text2 = this.add.text(400, 300, 'MENU', textStyle).setInteractive().setOrigin(0.5);
      text2.on('pointerdown', () => {
        this.scene.stop();
        this.scene.stop('game')
        this.scene.start('start');
        this.game.sound.stopAll();
      })
      text2.setShadow(2, 2, "#000000", 2, true, true);

      const text3 = this.add.text(400, 300+50, 'Your score: '+this.score, textStyle).setOrigin(0.5);
      text3.setShadow(2, 2, "#000000", 2, true, true);
      

  }
}
