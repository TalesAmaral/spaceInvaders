class HealthBar {
  constructor(scene, x, y, value) {
    this.bar = new Phaser.GameObjects.Graphics(scene);

    this.x = x;
    this.y = y;
    this.value = value;
    this.p = 76 / value;

    this.draw();

    scene.add.existing(this.bar);
  }

  draw() {
    this.bar.clear();

    //  BG
    this.bar.fillStyle(0x000000);
    this.bar.fillRect(this.x, this.y, 80, 16);

    //  Health
    this.bar.fillStyle(0xffffff);
    this.bar.fillRect(this.x + 2, this.y + 2, 76, 12);

    if (this.value < 30) {
      this.bar.fillStyle(0xff0000);
    } else {
      this.bar.fillStyle(0x00ff00);
    }

    const d = Math.floor(this.p * this.value);

    this.bar.fillRect(this.x + 2, this.y + 2, d, 12);
  }
}

export default class Game extends Phaser.Scene {
  constructor() {
    super('game');
  }

  init() {
    this.cameraWidth = 800;
    this.cameraHeight = 600;
    this.mapWidth = 2048;
    this.mapHeight = 2048;
    this.playerVelocity = 300;
    this.playerScore = 0;

    this.enemyVelocity = 200;
    this.maximumEnemyQuantity = 10;
    this.enemySpawnRateInMilliseconds = 1000;
    this.enemySpawnRateInterval;

    this.asteroidVelocity = 100;
    this.maximumAsteroidQuantity = 20;
    this.asteroidSpawnRateInMilliseconds = 1000;
    this.asteroidSpawnRateInterval;

    this.playerInitialHealth = 100;
    this.player;
    this.playerHpText;
    this.playerScoreText;

    this.enemyGroup;
    this.enemyGroupBullets;
    this.playerGroupBullets;
    this.asteroidGroup;

    this.cursors;
    this.healthBar;

    this.canFire = 1;
    this.enemyFireRate = 0;
  }

  preload() {
    this.load.image('ship', './src/assets/img/ship_1.png');
    this.load.spritesheet('bullet', './src/assets/img/shot.png', {
      frameWidth: 48,
      frameHeigth: 48,
    });
    this.load.image('asteroid', './src/assets/img/astr.png');
    this.load.image('enemy', './src/assets/img/ship_3.png');
    this.load.image('enemy2', './src/assets/img/ship_4.png');
    this.load.audio('music', ['./src/assets/audio/BackOnTrack.mp3', './src/assets/audio/BackOnTrack.ogg']);
  }

  create() {
    this.addSounds();
    this.addSprites();
    this.addTexts();
    this.createGroups();
    this.addInputs();
    this.addPhysics();
    this.setCamera();
    this.setHealth();
    this.startGame();
  }

  update() {
    this.updateVelocity(this.player, 0);

    this.updateHud();

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
      this.updateVelocity(this.player, this.playerVelocity);
    } else if (downIsPressed) {
      this.updateVelocity(this.player, -this.playerVelocity);
    }

    if (spaceIsPressed && this.canFire == 1) {
      this.shoot(this.player, this.playerGroupBullets);
      this.canFire = 0;
    }
    if (spaceIsUp && this.canFire == 0) {
      this.canFire = 1;
    }

    this.moveEnemy();
    this.moveAsteroid();

    const playerHasDied = this.player.getData('health') <= 0;
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

  setHealth() {
    this.healthBar = new HealthBar(
      this,
      this.player.body.position.x + 50 - this.cameraWidth / 2,
      this.player.body.position.y + 50 - this.cameraHeight / 2,
      this.playerInitialHealth
    );
  }

  startGame() {
    this.enemySpawnRateInterval = setInterval(() => {
      const hasntSpawnedAllEnemies = this.enemyGroup.children.entries.length < this.maximumEnemyQuantity;
      if (hasntSpawnedAllEnemies) {
        const { randomPosX, randomPosY } = this.generateRandomPosOutsideScreen();
        const enemy = this.enemyGroup.create(randomPosX, randomPosY, 'enemy');
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
    const music = this.sound.add('music', { volume: 0.2 });
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

    this.player = this.physics.add.image(this.mapWidth / 2, this.mapHeight / 2, 'ship');
    this.player.setData('health', this.playerInitialHealth);
  }

  addTexts() {
    this.playerScoreText = this.add.text(
      this.player.body.x - this.cameraWidth / 2,
      this.player.body.y - this.cameraHeight / 2,
      this.playerScore
    );
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
      },
      null,
      this
    );

    this.physics.add.collider(
      this.player,
      this.enemyGroup,
      (player, enemy) => {
        this.destroyEntities(enemy);
        this.decreaseHealth(player, 10);
      },
      null,
      this
    );

    this.physics.add.collider(
      this.player,
      this.asteroidGroup,
      (player, enemy) => {
        this.destroyEntities(enemy);
        this.decreaseHealth(player, 5);
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

  shoot(entity, bulletGroup) {
    const bulletVelocity = 800;
    const bullet = bulletGroup.create(entity.x, entity.y, 'bullet');
    bullet.angle = entity.angle;
    bullet.setScale(2);

    this.children.bringToTop(entity);
    this.updateVelocity(bullet, bulletVelocity);

    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;
  }

  destroyEntities(entityA, entityB) {
    entityA?.destroy();
    entityB?.destroy();
  }

  addScore() {
    this.playerScore += 1;
  }

  increaseHealth(player, health = 1) {
    if (player.getData('health') > this.playerInitialHealth * 0.3) {
      player.tint = 0xffffff;
    }
    player.incData('health', health);
  }

  decreaseHealth(player, damage = 1) {
    player.incData('health', -damage);

    if (player.getData('health') < this.playerInitialHealth * 0.3) {
      player.tint = 0xff0000;
    }
  }

  updateVelocity(entity, velocity) {
    this.sys.arcadePhysics.velocityFromAngle(entity.angle - 90, velocity, entity.body.velocity);
  }

  updateHud() {
    const cantoX = this.cameras.main.scrollX;
    const cantoY = this.cameras.main.scrollY;
    this.healthBar.value = Math.max(this.player.getData('health'), 0);
    this.healthBar.x = cantoX + 10;
    this.healthBar.y = cantoY + 10;
    this.healthBar.draw();

    this.playerScoreText.x = cantoX + 10;
    this.playerScoreText.y = cantoY + 30;
    this.playerScoreText.text = `Score: ${Math.floor(this.playerScore)}`;
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
        this.shoot(enemy, this.enemyGroupBullets);
      }

      this.updateVelocity(enemy, this.enemyVelocity);
    });
  }

  moveAsteroid() {
    this.asteroidGroup.getChildren().forEach((asteroid) => {
      this.updateVelocity(asteroid, this.asteroidVelocity);
    });
  }
}
