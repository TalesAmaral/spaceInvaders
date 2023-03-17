import Phaser from "../lib/phaser.js";

export default class Help extends Phaser.Scene {
  constructor() {
    super("help");
  }

  init() {}

  preload() {
   
  }

  create() {
    this.add.tileSprite(0, 0, 800, 600, 'space').setOrigin(0);
    const textStyle = { color: "#00FF00", fontSize: 25 };



    const voltar = this.add.text(70, 70, '<- VOLTAR', textStyle).setInteractive();
    voltar.on('pointerdown', () => {
      this.scene.stop();
      this.scene.start('start');
      this.game.sound.stopAll();
    });


    // adicionando as instruções básicas
    this.add.text(40, 160, "Ship control:", textStyle);
    this.add.text(50, 200, "<-         : Rotate left", textStyle);
    this.add.text(50, 240, "->         : Rotate right", textStyle);
    this.add.text(50, 280, "/\\         : Move up", textStyle);
    this.add.text(50, 320, "\\/         : Move down", textStyle);
    this.add.text(50, 360, "\\/ + CTRL  : Do a 180 turn", textStyle);
    this.add.text(50, 400, "SPACE       : Shoot", textStyle);

    this.add.text(40, 500, "# Kill enemies and asteroids to get points.", textStyle);
  }

  update() {}
}