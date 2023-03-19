import Phaser from "../lib/phaser.js";

class Entity extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, sprite, health) {
    super(scene, x, y, sprite);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.health = health;

  }


  updateVelocity(velocity) {
    this.scene.sys.arcadePhysics.velocityFromAngle(this.angle - 90, velocity, this.body.velocity);
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
  }

  decreaseHealth(damage = 1) {
    this.health -= damage;
  }

  healPlayer(){
    this.scene.player.increaseHealth();
    this.scene.addScore();
    this.destroySelf();
  }
  destroySelf(){
    this.destroy();
  }

}

class EntityShooter extends Entity {
  constructor(scene, x, y, sprite, health, bulletGroup) {
    super(scene, x, y, sprite, health);
    this.bulletGroup = bulletGroup;
    this.canFire = 5;
  }

  shoot() {
    const bulletVelocity = 800;
    const bullet = new Entity(this.scene, this.x, this.y, 'bullet');
    this.bulletGroup.add(bullet);
    bullet.angle = this.angle;
    bullet.setScale(2);

    this.scene.children.bringToTop(bullet);
    bullet.updateVelocity(bulletVelocity);

    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;

    const fire = this.scene.sound.add('fireSound', { volume: 0.2 });
    fire.loop = false;
    fire.play();
  }
}

class Player extends EntityShooter {
  constructor(scene, x, y, sprite, health, bulletGroup) {
    super(scene, x, y, sprite, health, bulletGroup);
    this.playerInitialHealth = 10;
    this.playerVelocity = 300;
    this.playerScore = 0;
    this.canFire = 1;
    this.frameBack = true; 
  }

  playerIsLow() {
    return this.health < this.playerInitialHealth * 0.3;
  }

  increaseHealth(health = 1) {
    if (this.health < this.playerInitialHealth) {
      this.health += health;
    }

    this.scene.updateHealthHud();
  }

  decreaseHealth(damage = 1) {
    this.health -= damage;

    this.scene.updateHealthHud();
  }
  movePlayer(){

    const leftIsPressed = this.scene.cursors.left.isDown;
    const rightIsPressed = this.scene.cursors.right.isDown;
    const upIsPressed = this.scene.cursors.up.isDown;
    const downIsPressed = this.scene.cursors.down.isDown;
    const spaceIsPressed = this.scene.cursors.space.isDown;
    const spaceIsUp = this.scene.cursors.space.isUp;
    const ctrlIsPressed = this.scene.cursors.down.ctrlKey;

    if (leftIsPressed) {
      this.angle -= 5;
    } else if (rightIsPressed) {
      this.angle += 5;
    }

    if (upIsPressed) {
      this.updateVelocity(this.playerVelocity);
    } else if (downIsPressed) {
      if (ctrlIsPressed && this.frameBack ){ 
        this.setRotation(this.rotation+Math.PI);;
        this.frameBack = false;
      }
      this.updateVelocity(-this.playerVelocity);
    }

    if (spaceIsPressed && this.canFire == 1) {
      this.shoot();
      this.canFire = 0;
    }
    if (spaceIsUp && this.canFire == 0) {
      this.canFire = 1;
    }

    if (this.scene.cursors.down.isUp){
      this.frameBack = true;
    }
  }
}

export default class Game extends Phaser.Scene {
  constructor() {
    super('game');
  }

  preload() {

   
  }

  init() {
    this.healthBarFullWidth = 150;

    this.cameraWidth = 800;
    this.cameraHeight = 600;
    this.mapWidth = 2048;
    this.mapHeight = 2048;

    this.enemyVelocity = 200;
    this.maximumEnemyQuantity = 10;
    this.enemySpawnRateInMilliseconds = 1000;
    this.enemySpawnRateInterval;


    this.enemyMeleeVelocity = 250;
    this.maximumEnemyMeleeQuantity = 5;
    this.enemyMeleeSpawnRateInMilliseconds = 1000;
    this.enemyMeleeSpawnRateInterval;


    this.asteroidVelocity = 150;
    this.maximumAsteroidQuantity = 20;
    this.asteroidSpawnRateInMilliseconds = 1000;
    this.asteroidSpawnRateInterval;
    this.buffAsteroidSpawnRateInterval;


    this.maximumBuffAsteroid = 5;
    this.player;
    this.playerScoreText;
    this.playerInitialHealth = 10;

    this.enemyShooterGroup;
    this.enemyShooterGroupBullets;
    this.playerGroupBullets;
    this.asteroidGroup;
    this.destroyEnemy = this.sound.add('deathEnemy', { volume: 0.2 });
    this.destroyEnemy.loop = false;
    this.cursors;

  }

  create() {
    this.addSounds();
    this.createGroups();
    this.addSprites();
    this.addTexts();
    this.addInputs();
    this.addPhysics();
    this.setCamera();
    this.updateHealthHud();
    this.startGame();
  }

  update() {
    this.player.updateVelocity( 0);
    this.children.bringToTop(this.playerScoreText);
    this.children.bringToTop(this.healthBar);

    this.player.movePlayer();

    this.moveEnemyShooter();
    this.moveAsteroid();
    this.moveEnemyMelee()
    const playerHasDied = this.player.health <= 0;
    if (playerHasDied) {
      this.onDeath();
    }
  }

  onDeath() {
    this.scene.pause();
    clearInterval(this.enemySpawnRateInterval);
    clearInterval(this.asteroidSpawnRateInterval);
    this.scene.launch('end', { score: this.player.playerScore});
  }

  startGame() {
    this.enemySpawnRateInterval = setInterval(() => {
      const hasntSpawnedAllEnemies = this.enemyShooterGroup.children.entries.length < this.maximumEnemyQuantity;
      if (hasntSpawnedAllEnemies) {
        const { randomPosX, randomPosY } = this.generateRandomPosOutsideScreen();
        const enemy = new EntityShooter(this, randomPosX, randomPosY, 'enemy', 1, this.enemyShooterGroupBullets);
        this.enemyShooterGroup.add(enemy);
        enemy.setCollideWorldBounds(true);
        this.physics.add.collider(enemy, this.enemyShooterGroup);
        this.physics.add.collider(enemy, this.enemyMeleeGroup);
      }
    }, this.enemySpawnRateInMilliseconds);

    this.enemyMeleeSpawnRateInterval = setInterval(() => {
      const hasntSpawnedAllEnemies = this.enemyMeleeGroup.children.entries.length < this.maximumEnemyMeleeQuantity;
      if (hasntSpawnedAllEnemies) {
        const { randomPosX, randomPosY } = this.generateRandomPosOutsideScreen();
        const enemy = new Entity(this, randomPosX, randomPosY, 'enemy2', 1);
        this.enemyMeleeGroup.add(enemy);
        enemy.setCollideWorldBounds(true);
        this.physics.add.collider(enemy, this.enemyShooterGroup);
        this.physics.add.collider(enemy, this.enemyMeleeGroup);
      }
    }, this.enemyMeleeSpawnRateInMilliseconds);
    this.buffAsteroidSpawnRateInterval = setInterval(() => {
      const { randomPosX, randomPosY } = this.generateRandomPosOutsideScreen();
      const hasntSpawnedAllAsteroids = this.asteroidGroup.children.entries.length < this.maximumAsteroidQuantity+this.maximumBuffAsteroid;
      if (hasntSpawnedAllAsteroids) {
        const asteroid = new Entity(this, randomPosX,randomPosY, "asteroid", 5);
        asteroid.tint = 0xF40000;
        this.asteroidGroup.add(asteroid);
        asteroid.setScale((Math.random() / 4) +0.35);
        asteroid.angle = Math.floor(Math.random() * 181);
        asteroid.setCollideWorldBounds(true);
        asteroid.body.onWorldBounds = true;
        
      } 
    }, this.asteroidSpawnRateInMilliseconds*5);

    this.asteroidSpawnRateInterval = setInterval(() => {
      const { randomPosX, randomPosY } = this.generateRandomPosOutsideScreen();
      const hasntSpawnedAllAsteroids = this.asteroidGroup.children.entries.length < this.maximumAsteroidQuantity;
      if (hasntSpawnedAllAsteroids) {
        const asteroid = new Entity(this, randomPosX,randomPosY, "asteroid", 2)
        this.asteroidGroup.add(asteroid);
        asteroid.setScale((Math.random() / 4) +0.2);
        asteroid.angle = Math.floor(Math.random() * 181);
        asteroid.setCollideWorldBounds(true);
        asteroid.body.onWorldBounds = true;
      } else {
        const asteroid = this.asteroidGroup.getFirstDead();
        if (asteroid) {
          asteroid.x = randomPosX;
          asteroid.y = randomPosY;
          asteroid.setActive(true);
          asteroid.setVisible(true);
          asteroid.tint = 0xFFFFFF;
          asteroid.setScale(Math.random() / 4);
          asteroid.angle = Math.floor(Math.random() * 181);
        }
      }
    }, this.asteroidSpawnRateInMilliseconds);
  }

  addSounds() {
    const music = this.sound.add("winter", { volume: 0.2 });
    music.loop = true;

    music.play();
  }

  addSprites() {
    this.anims.create({
      key: 'bullet',
      frames: this.anims.generateFrameNumbers('bullet'),
      frameRate: 12,
      repeat: -1,
    });
    this.add.tileSprite(0, 0, this.mapWidth, this.mapHeight, 'space').setOrigin(0);

    this.player = new Player(this, this.mapWidth / 2, this.mapHeight / 2, 'ship', this.playerInitialHealth, this.playerGroupBullets);
    this.children.bringToTop(this.player);
  }

  addTexts() {
    this.playerScoreText = this.add.text(10, 40, `Score: ${this.player.playerScore}`).setScrollFactor(0, 0);
  }

  createGroups() {
    this.enemyShooterGroup = this.physics.add.group();
    this.enemyMeleeGroup = this.physics.add.group();
    this.enemyShooterGroupBullets = this.physics.add.group();
    this.playerGroupBullets = this.physics.add.group();
    this.asteroidGroup = this.physics.add.group();
  }

  addPhysics() {
    this.physics.add.existing(this.player);
    this.player.setCollideWorldBounds(true);

    this.physics.add.collider(
      this.playerGroupBullets,
      this.enemyShooterGroup,
      (playerBullet, enemy) => {
        playerBullet.destroySelf();
        enemy.decreaseHealth();
        if (enemy.health <=0){
          enemy.healPlayer();
          this.destroyEnemy.play();
        }

      },
      null,
      this
    );

    this.physics.add.collider(
      this.playerGroupBullets,
      this.enemyMeleeGroup,
      (playerBullet, enemy) => {
        playerBullet.destroySelf();
        enemy.decreaseHealth();
        if (enemy.health <=0){
          enemy.healPlayer();
          this.destroyEnemy.play();
        }

      },
      null,
      this
    );
    this.physics.add.collider(
      this.player,
      this.enemyShooterGroup,
      (player, enemy) => {
        enemy.destroySelf();
        player.decreaseHealth(3);
        this.destroyEnemy.play();
      },
      null,
      this
    );

    this.physics.add.collider(
      this.player,
      this.enemyMeleeGroup,
      (player, enemy) => {
        enemy.destroySelf();
        player.decreaseHealth(1);
        this.destroyEnemy.play();
      },
      null,
      this
    );
    this.physics.add.collider(
      this.player,
      this.asteroidGroup,
      (player, enemy) => {
        enemy.destroySelf();
        player.decreaseHealth(4);
        this.destroyEnemy.play();
      },
      null,
      this
    );

    this.physics.add.collider(
      this.player,
      this.enemyShooterGroupBullets,
      (player, enemyBullet) => {
        enemyBullet.destroySelf();
        player.decreaseHealth();
      },
      null,
      this
    );

    this.physics.add.collider(
      this.playerGroupBullets,
      this.asteroidGroup,
      (playerBullet, asteroid) => {
        asteroid.decreaseHealth();
        playerBullet.destroySelf();
        if (asteroid.health<=0){
          asteroid.destroySelf();
          this.addScore();
          this.destroyEnemy.play();
        }
        
      },
      null,
      this
    );

    this.physics.world.on('worldbounds', (body) => {
      const entity = body.gameObject;
      const isPlayerBullet = this.playerGroupBullets.contains(entity);
      const isEnemyBullet = this.enemyShooterGroupBullets.contains(entity);
      const isAsteroid = this.asteroidGroup.contains(entity);

      if (isPlayerBullet || isEnemyBullet || isAsteroid) {
        entity.destroy();
      } 
    });
  }

  addInputs() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  setCamera() {
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.startFollow(this.player, true);
  }

  generateRandomPosOutsideScreen() {
    const randomPosX = Math.floor(Math.random() * this.mapWidth);
    const randomPosY =
      Math.abs(randomPosX - this.player.x) < this.cameraWidth / 2
        ? (Math.random() * (this.mapHeight - this.cameraHeight) + this.player.y + this.cameraHeight / 2) % this.mapHeight
        : Math.random() * this.mapHeight;
    return { randomPosX, randomPosY };
  }

  

  addScore() {
    this.player.playerScore += 1;
    this.playerScoreText.destroy();
    this.playerScoreText = this.add.text(10, 40, `Score: ${this.player.playerScore}`).setScrollFactor(0, 0);
  }



  updateHealthHud() {
    this.resetHealthHud();
    const x = 10;
    const y = 24;

    this.leftShadowCap = this.add.image(x, y, 'left-cap-shadow').setOrigin(0, 0.5);

    this.middleShadowCap = this.add.image(this.leftShadowCap.x + this.leftShadowCap.width, y, 'middle-shadow').setOrigin(0, 0.5);
    this.middleShadowCap.displayWidth = this.healthBarFullWidth;

    this.rightShadowCap = this.add
      .image(this.middleShadowCap.x + this.middleShadowCap.displayWidth, y, 'right-cap-shadow')
      .setOrigin(0, 0.5);

    if (this.player.playerIsLow()) {
      this.leftCap = this.add.image(x, y, 'left-cap-red').setOrigin(0, 0.5);
      this.middle = this.add.image(this.leftCap.x + this.leftCap.width, y, 'middle-red').setOrigin(0, 0.5);
      this.rightCap = this.add.image(this.middle.x + this.middle.displayWidth, y, 'right-cap-red').setOrigin(0, 0.5);
    } else {
      this.leftCap = this.add.image(x, y, 'left-cap-green').setOrigin(0, 0.5);
      this.middle = this.add.image(this.leftCap.x + this.leftCap.width, y, 'middle-green').setOrigin(0, 0.5);
      this.rightCap = this.add.image(this.middle.x + this.middle.displayWidth, y, 'right-cap-green').setOrigin(0, 0.5);
    }

    this.setHudScrollFactor();

    this.setMeterPercentage(Math.max(this.player.health,0) / this.player.playerInitialHealth);
  }

  setMeterPercentage(percent = 1) {
    const width = this.healthBarFullWidth * percent;

    this.middle.displayWidth = width;
    this.rightCap.x = this.middle.x + this.middle.displayWidth;
  }

  resetHealthHud() {
    this.leftShadowCap?.destroy();
    this.middleShadowCap?.destroy();
    this.rightShadowCap?.destroy();
    this.leftCap?.destroy();
    this.middle?.destroy();
    this.rightCap?.destroy();
  }

  setHudScrollFactor() {
    this.leftShadowCap?.setScrollFactor(0, 0);
    this.middleShadowCap?.setScrollFactor(0, 0);
    this.rightShadowCap?.setScrollFactor(0, 0);
    this.leftCap?.setScrollFactor(0, 0);
    this.middle?.setScrollFactor(0, 0);
    this.rightCap?.setScrollFactor(0, 0);
  }

  moveEnemyShooter() {
    
    const x = this.player.x;
    const y = this.player.y;
    this.enemyShooterGroup.getChildren().forEach((enemy) => {
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, x, y);
      enemy.setRotation(angle);
      enemy.angle += 90;

      const enemyWillShoot = enemy.canFire <= 0 ;
      const enemyIsOnScreen = this.cameras.main.cull([enemy]).length > 0;

      if (enemyWillShoot && enemyIsOnScreen) {
        enemy.shoot();
        enemy.canFire = 100;
      }
      enemy.canFire -= !enemyWillShoot;
      if ( Phaser.Math.Distance.Between(x , y , enemy.x , enemy.y) >= 250){
        enemy.updateVelocity(this.enemyVelocity);
     }else{
      enemy.setRotation(angle);
      enemy.updateVelocity(this.enemyVelocity);
      enemy.angle += 90;
     }
    });
  }
  moveEnemyMelee(){
    const x = this.player.x;
    const y = this.player.y;
    this.enemyMeleeGroup.getChildren().forEach((enemy) => {
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, x, y);
      enemy.setRotation(angle);
      enemy.angle += 90;

      enemy.updateVelocity(this.enemyMeleeVelocity);
    
    });

  }

  moveAsteroid() {
    this.asteroidGroup.getChildren().forEach((asteroid) => {
      asteroid.updateVelocity( this.asteroidVelocity);
    });
  }
}
