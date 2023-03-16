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

  decreaseHealth(player, damage = 1) {
    player.health -= damage;

    if (this.playerIsLow(player)) {
      player.tint = 0xff0000;
    }

    this.updateHealthHud();
  }

  destroySelf() {
    this.sprite.destroy();
  }
}

class EntityShooter extends Entity {
  constructor(scene, x, y, sprite, health, bulletGroup) {
    super(scene, x, y, sprite, health);
    this.bulletGroup = bulletGroup;
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
  }

  playerIsLow() {
    return this.health < this.playerInitialHealth * 0.3;
  }

  increaseHealth(health = 1) {
    if (!this.playerIsLow()) {
      this.tint = 0xffffff;
    }
    if (this.health < this.playerInitialHealth) {
      this.health += health;
    }

    this.updateHealthHud();
  }

  decreaseHealth(player, damage = 1) {
    super.decreaseHealth(player, damage);

    this.updateHealthHud();
  }
}

export default class Game extends Phaser.Scene {
  constructor() {
    super('game');
  }

  preload() {
    this.musicName = ['music_winter', 'music_toccata', 'music_daybreak'][Math.floor(Math.random() * 3)];

    this.load.audio(this.musicName, [`./src/assets/audio/${this.musicName}.mp3`]);
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

    this.asteroidVelocity = 100;
    this.maximumAsteroidQuantity = 20;
    this.asteroidSpawnRateInMilliseconds = 1000;
    this.asteroidSpawnRateInterval;

    this.player;
    this.playerScoreText;

    this.enemyGroup;
    this.enemyGroupBullets;
    this.playerGroupBullets;
    this.asteroidGroup;

    this.cursors;

    this.enemyFireRate = 0;
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
    this.updateVelocity(this.player, 0);
    this.children.bringToTop(this.playerScoreText);
    this.children.bringToTop(this.healthBar);

    const leftIsPressed = this.cursors.left.isDown;
    const rightIsPressed = this.cursors.right.isDown;
    const upIsPressed = this.cursors.up.isDown;
    const downIsPressed = this.cursors.down.isDown;
    const spaceIsPressed = this.cursors.space.isDown;
    const spaceIsUp = this.cursors.space.isUp;

    if (leftIsPressed) {
      this.player.angle -= 5;
    } else if (rightIsPressed) {
      this.player.angle += 5;
    }

    if (upIsPressed) {
      this.player.updateVelocity(this.player.playerVelocity);
    } else if (downIsPressed) {
      this.player.updateVelocity(-this.player.playerVelocity);
    }

    if (spaceIsPressed && this.player.canFire == 1) {
      this.player.shoot();
      this.player.canFire = 0;
    }
    if (spaceIsUp && this.player.canFire == 0) {
      this.player.canFire = 1;
    }

    this.moveEnemy();
    this.moveAsteroid();

    const playerHasDied = this.player.health <= 0;
    if (playerHasDied) {
      this.onDeath();
    }
  }

  onDeath() {
    this.scene.pause();
    clearInterval(this.enemySpawnRateInterval);
    clearInterval(this.asteroidSpawnRateInterval);
    this.scene.launch('end');
  }

  startGame() {
    this.enemySpawnRateInterval = setInterval(() => {
      const hasntSpawnedAllEnemies = this.enemyGroup.children.entries.length < this.maximumEnemyQuantity;
      if (hasntSpawnedAllEnemies) {
        const { randomPosX, randomPosY } = this.generateRandomPosOutsideScreen();
        const enemy = new EntityShooter(this, randomPosX, randomPosY, 'enemy', 2, this.enemyGroupBullets);
        this.enemyGroup.add(enemy);
        enemy.setCollideWorldBounds(true);
        this.physics.add.collider(enemy, this.enemyGroup);
      }
    }, this.enemySpawnRateInMilliseconds);

    this.asteroidSpawnRateInterval = setInterval(() => {
      const { randomPosX, randomPosY } = this.generateRandomPosOutsideScreen();
      const hasntSpawnedAllAsteroids = this.asteroidGroup.children.entries.length < this.maximumAsteroidQuantity;
      if (hasntSpawnedAllAsteroids) {
        const asteroid = this.asteroidGroup.create(randomPosX, randomPosY, 'asteroid');
        asteroid.setScale(Math.random() / 4);
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
          asteroid.setScale(Math.random() / 4);
          asteroid.angle = Math.floor(Math.random() * 181);
        }
      }
    }, this.asteroidSpawnRateInMilliseconds);
  }

  addSounds() {
    const music = this.sound.add(this.musicName, { volume: 0.2 });
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
    this.enemyGroup = this.physics.add.group();
    this.enemyGroupBullets = this.physics.add.group();
    this.playerGroupBullets = this.physics.add.group();
    this.asteroidGroup = this.physics.add.group();
  }

  addPhysics() {
    this.physics.add.existing(this.player);
    this.player.setCollideWorldBounds(true);

    this.physics.add.collider(
      this.playerGroupBullets,
      this.enemyGroup,
      (playerBullet, enemy) => {
        this.destroyEntities(playerBullet, enemy);
        this.increaseHealth(this.player);
        this.addScore();
        const destroyEnemy = this.sound.add('deathEnemy', { volume: 0.2 });
        destroyEnemy.loop = false;
        destroyEnemy.play();
      },
      null,
      this
    );

    this.physics.add.collider(
      this.player,
      this.enemyGroup,
      (player, enemy) => {
        this.destroyEntities(enemy);
        this.decreaseHealth(player);
      },
      null,
      this
    );

    this.physics.add.collider(
      this.player,
      this.asteroidGroup,
      (player, enemy) => {
        this.destroyEntities(enemy);
        this.decreaseHealth(player);
      },
      null,
      this
    );

    this.physics.add.collider(
      this.player,
      this.enemyGroupBullets,
      (player, enemyBullet) => {
        this.destroyEntities(enemyBullet);
        this.decreaseHealth(player);
      },
      null,
      this
    );

    this.physics.add.collider(
      this.playerGroupBullets,
      this.asteroidGroup,
      (playerBullet, asteroid) => {
        // TODO: trocar isso pra ser um damageAsteroid (asteroid vai ter vida)
        this.destroyEntities(playerBullet, asteroid);
        const destroyEnemy = this.sound.add('deathEnemy', { volume: 0.2 });
        destroyEnemy.loop = false;
        destroyEnemy.play();
      },
      null,
      this
    );

    this.physics.world.on('worldbounds', (body) => {
      const entity = body.gameObject;
      const isPlayerBullet = this.playerGroupBullets.contains(entity);
      const isEnemyBullet = this.enemyGroupBullets.contains(entity);
      const isAsteroid = this.asteroidGroup.contains(entity);

      if (isPlayerBullet || isEnemyBullet) {
        entity.destroy();
      } else if (isAsteroid) {
        entity.setActive(false);
        entity.setVisible(false);
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

  destroyEntities(entityA, entityB) {
    entityA?.destroy();
    entityB?.destroy();
  }

  addScore() {
    this.player.playerScore += 1;
    this.playerScoreText.destroy();
    this.playerScoreText = this.add.text(10, 40, `Score: ${this.player.playerScore}`).setScrollFactor(0, 0);
  }

  increaseHealth(player, health = 1) {
    const playerHealth = player.health;
    if (!this.playerIsLow(playerHealth)) {
      player.tint = 0xffffff;
    }
    if (playerHealth < this.playerInitialHealth) {
      player.health += health;
    }

    this.updateHealthHud();
  }

  decreaseHealth(player, damage = 1) {
    player.health -= damage;

    if (this.playerIsLow(player)) {
      player.tint = 0xff0000;
    }

    this.updateHealthHud();
  }

  playerIsLow(playerHealth) {
    return playerHealth < this.playerInitialHealth * 0.3;
  }

  updateVelocity(entity, velocity) {
    this.sys.arcadePhysics.velocityFromAngle(entity.angle - 90, velocity, entity.body.velocity);
    entity.x = Math.floor(entity.x);
    entity.y = Math.floor(entity.y);
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

    if (this.playerIsLow(this.player.health)) {
      this.leftCap = this.add.image(x, y, 'left-cap-red').setOrigin(0, 0.5);
      this.middle = this.add.image(this.leftCap.x + this.leftCap.width, y, 'middle-red').setOrigin(0, 0.5);
      this.rightCap = this.add.image(this.middle.x + this.middle.displayWidth, y, 'right-cap-red').setOrigin(0, 0.5);
    } else {
      this.leftCap = this.add.image(x, y, 'left-cap-green').setOrigin(0, 0.5);
      this.middle = this.add.image(this.leftCap.x + this.leftCap.width, y, 'middle-green').setOrigin(0, 0.5);
      this.rightCap = this.add.image(this.middle.x + this.middle.displayWidth, y, 'right-cap-green').setOrigin(0, 0.5);
    }

    this.setHudScrollFactor();

    this.setMeterPercentage(this.player.health / this.playerInitialHealth);
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

  moveEnemy() {
    this.enemyFireRate++;

    if (this.enemyFireRate > 1) this.enemyFireRate = -100;

    this.enemyGroup.getChildren().forEach((enemy) => {
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      enemy.setRotation(angle);
      enemy.angle += 90;

      const enemyWillShoot = this.enemyFireRate > 0;
      const enemyIsOnScreen = this.cameras.main.cull([enemy]).length > 0;

      if (enemyWillShoot && enemyIsOnScreen) {
        enemy.shoot();
      }

      enemy.updateVelocity(this.enemyVelocity);
    });
  }

  moveAsteroid() {
    this.asteroidGroup.getChildren().forEach((asteroid) => {
      this.updateVelocity(asteroid, this.asteroidVelocity);
    });
  }
}
