let width = 800;
let height = 600;
const mapWidth = 1024;
const mapHeight = 2048;


const config = {
    type: Phaser.AUTO,
    width: width,
    height: height,

    physics: {
        default: 'arcade',
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
        render: render,
    },
};

const game = new Phaser.Game(config);


//========================Global Vars========================//
let enemyGroup;
//========================Global Vars========================//


function preload() {

    this.load.image('ship', 'ship_1.png');
    this.load.image('space', 'blue.png');
    this.load.spritesheet('bala', 'shot.png', {
        frameWidth: 48,
        frameHeight: 48,
    });
    this.load.spritesheet('nitro', 'turbo_blue.png', {
        frameWidth: 48,
        frameHeight: 48
    });

};


function create() {

    cursors = this.input.keyboard.createCursorKeys();

    this.add.tileSprite(0, 0, mapWidth, mapHeight, 'space').setOrigin(0);
    player = this.add.image(400, 300, 'ship').setOrigin(0.5);
    /* this.anims.create({
        key: 'nitro',
        frames: this.anims.generateFrameNumbers('nitro'),
        frameRate: 12,
        repeat: -1
    });
    nitro = this.add.sprite(player.x + 26,player.y + 24, 'nitro')
    nitro.anims.play('nitro', true);
 */

};

function createGroups(phaser) {
    enemyGroup = phaser.physics.add.group();
    playerGroupBullets = phaser.physics.add.group();
};


function update() {

    const leftIsPressed = cursors.left.isDown
    const rightIsPressed = cursors.right.isDown
    const upIsPressed = cursors.up.isDown
    const downIsPressed = cursors.down.isDown
    const spaceIsPressed = cursors.space.isDown

    if (leftIsPressed) {
        player.angle -= 5
    }
    else if (rightIsPressed) {
        player.angle += 5
    }


    const angle = player.rotation - Math.PI/2;

    nitro.angle = player.angle;

};


function addPhysics(phaser) {
    phaser.physics.add.existing(player);
};

function setCamera(phaser) {
    phaser.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    phaser.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    player.setCollideWorldBounds(true);
    phaser.cameras.main.startFollow(player, true);
};

function generateRandomEnemyPos() {
    const enemyPosX = Math.floor(Math.random() * mapWidth)
    const enemyPosY = Math.abs(enemyPosX - player.x) < w / 2 ? (Math.random() * (mapHeight - h) + player.y + h / 2) % mapHeight : Math.random() * (mapHeight)
    return { enemyPosX, enemyPosY }
};

function shoot(phaser, entidade, bulletGroup) {
    const angle = entidade.rotation - Math.PI / 2;
    const velBala = 800;
    const bala = bulletGroup.create(entidade.x, entidade.y, "bala");
    bala.angle = entidade.angle;

    phaser.children.bringToTop(entidade);
    bulletGroup.add(bala);
    atualizarVelocidade(bala, velBala, angle);

    bala.setCollideWorldBounds(true);
    bala.body.onWorldBounds = true;
}


function render() {

};