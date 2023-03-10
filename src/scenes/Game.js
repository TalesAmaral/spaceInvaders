export default class Game extends Phaser.Scene {
    constructor() {
			super('game')
    }

    init() {
      this.cameraWidth = 800;
      this.cameraHeight = 600;
      this.mapWidth = 2048;
      this.mapHeight = 2048;
      this.playerVelocity = 300;

      this.enemyVelocity = 200;
      this.maximumEnemyQuantity = 10;
      this.enemySpawnRateInMilliseconds = 1000;
      
      this.asteroidVelocity = 100;
      this.maximumAsteroidQuantity = 20;
      this.asteroidSpawnRateInMilliseconds = 1000;
      
      this.player;
      this.playerHpText;
      
      this.enemyGroup;
      this.enemyGroupBullets;
      this.playerGroupBullets;
      this.asteroidGroup;
      
      this.cursors;
      
      this.canFire = 1;
      this.enemyFireRate = 0;
    }
	

		preload() {
			this.load.image('ship', './src/assets/img/ship_1.png');
      this.load.spritesheet('bullet', './src/assets/img/shot.png', {
				frameWidth: 48,
				frameHeigth: 48
			});
			this.load.image('asteroid', './src/assets/img/astr.png');
			this.load.image('enemy', './src/assets/img/ship_3.png');
			this.load.image('enemy2', './src/assets/img/ship_4.png');
			this.load.audio('musica', [ './src/assets/audio/BackOnTrack.mp3', './src/assets/audio/BackOnTrack.ogg']);
		}
		
		create() {
			const music = this.sound.add('musica');
			music.loop = true;
		
			music.play();
			this.addSprites()
			this.addTexts()
			this.createGroups()
			this.addInputs()
			this.addPhysics()
			this.setCamera()
			this.startGame()
		}
		
		update() {
			this.updateVelocity(this.player, 0, 0);
			this.playerHpText.text = this.player.getData('health');
			this.playerHpText.x = this.player.body.position.x;
			this.playerHpText.y = this.player.body.position.y;
			this.children.bringToTop(this.playerHpText);
		
			const leftIsPressed = this.cursors.left.isDown
			const rightIsPressed = this.cursors.right.isDown
			const upIsPressed = this.cursors.up.isDown
			const downIsPressed = this.cursors.down.isDown
			const spaceIsPressed = this.cursors.space.isDown
			const spaceIsUp = this.cursors.space.isUp
		
			if (leftIsPressed) {
				this.player.angle -= 5
			}
			else if (rightIsPressed) {
				this.player.angle += 5
			}
			const angle = this.player.rotation - Math.PI / 2;
		
			if (upIsPressed) {
				this.updateVelocity(this.player, this.playerVelocity, angle);
			} else if (downIsPressed) {
				this.updateVelocity(this.player, -this.playerVelocity, angle)
			}
		
			if (spaceIsPressed && this.canFire == 1) {
				this.shoot(this.player, this.playerGroupBullets);
				this.canFire = 0;
			}
			if(spaceIsUp && this.canFire == 0) {
				this.canFire = 1;
			}
		
			this.moveEnemy();
			this.moveAsteroid();

      if (this.player.getData("health") <= 0) {
        this.scene.pause();
        this.scene.launch('end');
      }
		}

    startGame() {
      setInterval(() => {
        if (this.enemyGroup.children.entries.length < this.maximumEnemyQuantity) {
          const { randomPosX, randomPosY } = this.generateRandomPosOutsideScreen();
          const enemy = this.enemyGroup.create(randomPosX, randomPosY, 'enemy');
          enemy.setCollideWorldBounds(true);
          this.physics.add.collider(enemy, this.enemyGroup)
        }
      }, this.enemySpawnRateInMilliseconds);
    
      setInterval(() => {
        const { randomPosX, randomPosY } = this.generateRandomPosOutsideScreen();
        if (this.asteroidGroup.children.entries.length < this.maximumAsteroidQuantity) {
          const asteroid = this.asteroidGroup.create(randomPosX, randomPosY, "asteroid");
          asteroid.setScale(Math.random() / 4);
          asteroid.angle = Math.floor(Math.random() * (181))
          asteroid.setCollideWorldBounds(true);
          asteroid.body.onWorldBounds = true;
        } else {
          const asteroid = this.asteroidGroup.getFirstDead();
          if (asteroid) {
            asteroid.x = randomPosX;
            asteroid.y = randomPosY;
            asteroid.setActive(true)
            asteroid.setVisible(true)
            asteroid.setScale(Math.random() / 4);
            asteroid.angle = Math.floor(Math.random() * (181))
          }
        }
      }, this.asteroidSpawnRateInMilliseconds)
    }
    
    addSprites() {
      this.anims.create({
        key: 'bullet',
        frames: this.anims.generateFrameNumbers('bullet'),
        frameRate: 12,
        repeat: -1
      });
      this.add.tileSprite(0, 0, this.mapWidth, this.mapHeight, 'space').setOrigin(0);
      this.player = this.physics.add.image(this.mapWidth / 2, this.mapHeight / 2, 'ship');
      this.player.setData('health', 100);
    }
    
    addTexts() {
      this.playerHpText = this.add.text(this.player.body.x, this.player.body.y, this.player.getData('health'));
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
        this.killEnemy,
        null,
        this,
      );
    
      this.physics.add.collider( 
        this.player,
        this.enemyGroup,
        (player, enemy) => this.decreaseHealth(player, enemy, 10),
        null,
        this,
      );

      this.physics.add.collider(
        this.player,
        this.asteroidGroup,
        (player, enemy) => this.decreaseHealth(player, enemy, 5),
        null,
        this,
      );
    
      this.physics.add.collider(
        this.player,
        this.enemyGroupBullets,
        this.decreaseHealth,
        null,
        this,
      );

    
      this.physics.world.on('worldbounds', body => {
        if (this.playerGroupBullets.contains(body.gameObject) || this.enemyGroupBullets.contains(body.gameObject)) {
          body.gameObject.destroy();
        } else if (this.asteroidGroup.contains(body.gameObject)) {
          body.gameObject.setActive(false)
          body.gameObject.setVisible(false)
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
      const randomPosX = Math.floor(Math.random() * this.mapWidth)
      const randomPosY = Math.abs(randomPosX - this.player.x) < this.cameraWidth / 2 ? (Math.random() * (this.mapHeight - this.cameraHeight) + this.player.y + this.cameraHeight / 2) % this.mapHeight : Math.random() * (this.mapHeight)
      return { randomPosX, randomPosY }
    }
    
    shoot(entity, bulletGroup) {
      const angle = entity.rotation - Math.PI / 2;
      const bulletVelocity = 800;
      const bullet = bulletGroup.create(entity.x, entity.y, 'bullet');
      bullet.angle = entity.angle;
      bullet.setScale(2);
    
      this.children.bringToTop(entity);
      this.updateVelocity(bullet, bulletVelocity, angle);
    
      bullet.setCollideWorldBounds(true);
      bullet.body.onWorldBounds = true;
    }
    
    killEnemy(bullet, enemy) {
      enemy.destroy();
      bullet.destroy();

      this.player.incData('health');
    }
    
    decreaseHealth(player, entity, damage = 1) {
      entity.destroy()
    
      player.incData('health', -damage)
    }
    
    updateVelocity(entity, velocity, angle) {
      entity.setVelocityY(velocity * Math.sin(angle));
      entity.setVelocityX(velocity * Math.cos(angle));
    }
    
    moveEnemy() {
      this.enemyFireRate++;
    
      if(this.enemyFireRate > 1) this.enemyFireRate = -100;
    
      this.enemyGroup.getChildren().forEach(enemy => {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        enemy.setRotation(angle);
        enemy.angle += 90;
    
        if(this.enemyFireRate > 0 && this.cameras.main.cull([enemy]).length > 0) {
          this.shoot(enemy, this.enemyGroupBullets);
        }
        
        this.updateVelocity(enemy, this.enemyVelocity, enemy.rotation - Math.PI / 2);
      });
    }
    
    moveAsteroid() {
      this.asteroidGroup.getChildren().forEach(asteroid => {
        this.updateVelocity(asteroid, this.asteroidVelocity, asteroid.angle)
      })
    }
    
}

