
		const playerVelocity = 300;

		const enemyVelocity = 200;
		const maximumEnemyQuantity = 10;
		const enemySpawnRateInMilliseconds = 1000;

		const asteroidVelocity = 100;
		const maximumAsteroidQuantity = 20;
		const asteroidSpawnRateInMilliseconds = 1000;

		let player;

		let enemyGroup;
		let enemyGroupBullets;
		let playerGroupBullets;
		let asteroidGroup;

		let cursors;

		let canFire = 1;
		let enemyFireRate = 0;

		function preload() {
			this.load.image('ship', 'ship_1.png');
			this.load.image('space', 'SpaceBackground.jpg');
			this.load.spritesheet('bullet', 'shot.png', {
				frameWidth: 48,
				frameHeigth: 48
			});
			this.load.image('asteroid', 'astr.png');
			this.load.image('enemy', 'ship_3.png');
			this.load.image('enemy2', 'ship_4.png');
			this.load.audio('musica', [ 'BackOnTrack.mp3', 'BackOnTrack.ogg']);
		}

		function create() {
			music = this.sound.add('musica');
			music.loop = true;

			music.play();
			addSprites(this)
			addTexts(this)
			createGroups(this)
			addInputs(this)
			addPhysics(this)
			setCamera(this)
			startGame(this)
		}

		function update() {
			updateVelocity(player, 0, 0);
			playerHpText.text = player.getData('health');
			playerHpText.x = player.body.position.x;
			playerHpText.y = player.body.position.y;
			this.children.bringToTop(playerHpText);

			const leftIsPressed = cursors.left.isDown
			const rightIsPressed = cursors.right.isDown
			const upIsPressed = cursors.up.isDown
			const upIsUp = cursors.up.isUp
			const downIsPressed = cursors.down.isDown
			const spaceIsPressed = cursors.space.isDown
			const spaceIsUp = cursors.space.isUp

			if (leftIsPressed) {
				player.angle -= 5
			}
			else if (rightIsPressed) {
				player.angle += 5
			}

			const angle = player.rotation - Math.PI / 2;

			if (upIsPressed) {
				updateVelocity(player, playerVelocity, angle);
			} else if (downIsPressed) {
				updateVelocity(player, -playerVelocity, angle)
			}

			if (spaceIsPressed && canFire == 1) {
				shoot(this, player, playerGroupBullets);
				canFire = 0;
			}
			if(spaceIsUp && canFire == 0){
				canFire = 1;
			}

			moveEnemy(this);
			moveAsteroid(this);
		}

		function startGame(phaser) {
			setInterval(() => {
				if (enemyGroup.children.entries.length < maximumEnemyQuantity) {
					const { randomPosX, randomPosY } = generateRandomPosOutsideScreen();
					const enemy = enemyGroup.create(randomPosX, randomPosY, 'enemy');
					enemy.setCollideWorldBounds(true);
					phaser.physics.add.collider(enemy, enemyGroup)
				}
			}, enemySpawnRateInMilliseconds);

			setInterval(() => {
				const { randomPosX, randomPosY } = generateRandomPosOutsideScreen();
				if (asteroidGroup.children.entries.length < maximumAsteroidQuantity) {
					const asteroid = asteroidGroup.create(randomPosX, randomPosY, "asteroid");
					asteroid.setScale(Math.random() / 4);
					asteroid.angle = Math.floor(Math.random() * (181))
					asteroid.setCollideWorldBounds(true);
					asteroid.body.onWorldBounds = true;
				} else {
					const asteroid = asteroidGroup.getFirstDead();
					if (asteroid) {
						asteroid.x = randomPosX;
						asteroid.y = randomPosY;
						asteroid.setActive(true)
						asteroid.setVisible(true)
						asteroid.setScale(Math.random() / 4);
						asteroid.angle = Math.floor(Math.random() * (181))
					}
				}
			}, asteroidSpawnRateInMilliseconds)
		}

		function addSprites(phaser) {
			phaser.anims.create({
				key: 'bullet',
				frames: phaser.anims.generateFrameNumbers('bullet'),
				frameRate: 12,
				repeat: -1
			});
			phaser.add.tileSprite(0, 0, mapWidth, mapHeight, 'space').setOrigin(0);
			player = phaser.physics.add.image(mapWidth / 2, mapHeight / 2, 'ship');
			player.setData('health', 100);
		}

		function addTexts(phaser) {
			playerHpText = phaser.add.text(player.body.x, player.body.y, player.getData('health'));
		}

		function createGroups(phaser) {
			enemyGroup = phaser.physics.add.group();
			enemyGroupBullets = phaser.physics.add.group();
			playerGroupBullets = phaser.physics.add.group();
			asteroidGroup = phaser.physics.add.group();
		}

		function addPhysics(phaser) {
			phaser.physics.add.existing(player);
			player.setCollideWorldBounds(true);

			phaser.physics.add.collider(
				playerGroupBullets,
				enemyGroup,
				killEnemy
			);

			phaser.physics.add.collider(
				player,
				asteroidGroup,
				decreaseHealth
			);

			phaser.physics.add.collider(
				player,
				enemyGroupBullets,
		    decreaseHealth
			);

			phaser.physics.world.on('worldbounds', (body) => {
				if (playerGroupBullets.contains(body.gameObject) || enemyGroupBullets.contains(body.gameObject)) {
					body.gameObject.destroy();
				} else if (asteroidGroup.contains(body.gameObject)) {
					body.gameObject.setActive(false)
					body.gameObject.setVisible(false)
				}
			});
		}

		function addInputs(phaser) {
			cursors = phaser.input.keyboard.createCursorKeys();
		}

		function setCamera(phaser) {
			phaser.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
			phaser.physics.world.setBounds(0, 0, mapWidth, mapHeight);
			phaser.cameras.main.startFollow(player, true);
		}

		function generateRandomPosOutsideScreen() {
			const randomPosX = Math.floor(Math.random() * mapWidth)
			const randomPosY = Math.abs(randomPosX - player.x) < w / 2 ? (Math.random() * (mapHeight - h) + player.y + h / 2) % mapHeight : Math.random() * (mapHeight)
			return { randomPosX, randomPosY }
		}

		function shoot(phaser, entity, bulletGroup) {
			const angle = entity.rotation - Math.PI / 2;
			const bulletVelocity = 800;
			const bullet = bulletGroup.create(entity.x, entity.y, 'bullet');
			bullet.angle = entity.angle;
			bullet.setScale(2);

			phaser.children.bringToTop(entity);
			updateVelocity(bullet, bulletVelocity, angle);

			bullet.setCollideWorldBounds(true);
			bullet.body.onWorldBounds = true;
		}

		function killEnemy(bullet, enemy) {
			bullet.destroy();
			enemy.destroy();
			player.incData('health');
		}

		function decreaseHealth(player, entity) {
			entity.destroy()

			player.incData('health', -1)
		}

		function updateVelocity(entity, velocity, angle) {
			entity.setVelocityY(velocity * Math.sin(angle));
			entity.setVelocityX(velocity * Math.cos(angle));
		}

		function moveEnemy(phaser, bullets) {
			enemyFireRate++;

			if(enemyFireRate > 1) enemyFireRate = -100;

			enemyGroup.getChildren().forEach(enemy => {
				const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
				enemy.setRotation(angle);
				enemy.angle += 90;

				if(enemyFireRate > 0 && phaser.cameras.main.cull([enemy]).length > 0) {
					shoot(phaser, enemy, enemyGroupBullets);
				}
				
				updateVelocity(enemy, enemyVelocity, enemy.rotation - Math.PI / 2);
			});
		}

		function moveAsteroid(phaser) {
			asteroidGroup.getChildren().forEach(asteroid => {
				updateVelocity(asteroid, asteroidVelocity, asteroid.angle)
			})
		}
