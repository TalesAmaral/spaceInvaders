import Phaser from '../lib/phaser.js'

export default class Start extends Phaser.Scene {
    constructor() {
      super('start')
    }

    preload() {
        
    }

    create() {

    }

    update() {
      if(Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP))){
        this.scene.start('game')
      }
    }
}

