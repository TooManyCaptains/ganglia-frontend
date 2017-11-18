class GameServer {

  constructor() {
    this.pollFrequency = 250 // ms
    this.pollTimeout = 1500 // ms
    this.baseURL = (() =>
      window.location.search.includes('local') ?
      'http://localhost:9000' :
      'https://ganglia-server.herokuapp.com'
    )()
    setInterval(this.onPollTimer.bind(this), this.pollFrequency)
  }

  onPollTimer() {
    this.fetch('state')
    .then(serverState => (typeof this.onNewGameState === 'function') && this.onNewGameState(serverState))
  }

  fetch(path) {
    function timeout(ms, promise) {
      return new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('timeout')), ms)
        promise.then(resolve, reject)
      })
    }
    return timeout(this.pollTimeout, fetch(`${this.baseURL}/${path}`))
    .then(response => response.json())
    .catch(error => {
      console.error(error)
    })
  }

}

const server = new GameServer()

class Bullet extends Phaser.Sprite {

  constructor(game, key) {
    super(game, 0, 0, key)

    this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST

    this.anchor.set(0.5)

    this.checkWorldBounds = true
    this.outOfBoundsKill = true
    this.exists = false

    this.tracking = false
    this.scaleSpeed = 0
  }

  fire(x, y, angle, speed, gx, gy) {
    gx = gx || 0
    gy = gy || 0
    this.reset(x, y)
    this.scale.set(1)
    this.game.physics.arcade.velocityFromAngle(angle, speed, this.body.velocity)
    this.angle = angle
    this.body.gravity.set(gx, gy)
  }

  update() {
    if (this.tracking) {
      this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x)
    }

    if (this.scaleSpeed > 0) {
      this.scale.x += this.scaleSpeed;
      this.scale.y += this.scaleSpeed;
    }
  }
}

// class Enemy extends Phaser.Sprite {
//
//   constructor(game, key, x, y, towardRight) {
//     super(game, x, y, 'player-red')
//     this.anchor.set(0.5,0.5)
//     //this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST
//     //this.collideWorldBounds = true
//     this.name = 'enemy'
//
//     // this.checkWorldBounds = true
//     // this.outOfBoundsKill = true
//     // this.exists = true
//
//     this.towardRight = towardRight
//     this.speed       = 10
//     console.log('making enemy at', x, y)
//     console.log(this)
//   }
//
//   update() {
//     if (this.tracking) {
//       this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x)
//     }
//
//     if (this.towardRight === true) {
//       this.scale.x += this.speed
//     }
//     else { this.scale.x -= this.speed }
//   }
// }

class SingleBulletWeapon extends Phaser.Group {

  constructor(game) {
    super(game, game.world, 'Single Bullet', false, true, Phaser.Physics.ARCADE)

    this.nextFire = 0
    this.bulletSpeed = 600
    this.fireRate = 500

    this.pattern = Phaser.ArrayUtils.numberArrayStep(-800, 800, 200)
    this.pattern = this.pattern.concat(Phaser.ArrayUtils.numberArrayStep(800, -800, -200))

    this.patternIndex = 0

    for (var i = 0; i < 64; i++) {
      this.add(new Bullet(game, 'bullet-white'), true)
    }
  }

  fire(source) {
    if (this.game.time.time < this.nextFire) return

    var y = source.y
    if (source.isRight === true) {
      var x = source.x + 70
      var angle = 315
    } else {
      var x = source.x - 70
      var angle = 225
    }

    this.getFirstExists(false).fire(x, y, angle, this.bulletSpeed, 0, 600)
    this.nextFire = this.game.time.time + this.fireRate
  }
}

class TripleBulletWeapon extends Phaser.Group {

  constructor(game) {
    super(game, game.world, 'Triple Bullet', false, true, Phaser.Physics.ARCADE)

    this.nextFire = 0
    this.bulletSpeed = 600
    this.fireRate = 1000

    for (var i = 0; i < 128; i++) {
      this.add(new Bullet(game, 'bullet-white'), true)
    }
  }

  fire(source) {
    if (this.game.time.time < this.nextFire) return

    const y = source.y
    const x = source.x + (source.isRight ? 70 : -70)
    const angle = source.isRight ? 315 : 225

    this.getFirstExists(false).fire(x, y, angle + 10, this.bulletSpeed, 0, 600)
    this.getFirstExists(false).fire(x, y, angle, this.bulletSpeed, 0, 600)
    this.getFirstExists(false).fire(x, y, angle - 10, this.bulletSpeed, 0, 600)

    this.nextFire = this.game.time.time + this.fireRate
  }
}

class BeamWeapon extends Phaser.Group {

  constructor(game) {
    super(game, game.world, 'BeamWeapon', false, true, Phaser.Physics.ARCADE)

    this.nextFire = 0
    this.bulletSpeed = 2000
    this.fireRate = 1

    for (var i = 0; i < 64; i++) {
      this.add(new Bullet(game, 'bullet11'), true)
    }
  }

  fire(source) {
    if (this.game.time.time < this.nextFire) return

    const y = source.y
    const x = source.x + (source.isRight ? 90 : -90)
    const angle = source.isRight ? 0 : 180

    this.getFirstExists(false).fire(x, y, angle, this.bulletSpeed, 0, 0)

    this.nextFire = this.game.time.time + this.fireRate
  }
}

class Main extends Phaser.State {

  init () {
    this.game.renderer.renderSession.roundPixels = true
    this.physics.startSystem(Phaser.Physics.ARCADE)
  }

  preload () {
    this.load.image('background', 'assets/back2.png')
    this.load.image('player', 'assets/ship2.png')
    this.load.bitmapFont('shmupfont', 'assets/shmupfont.png', 'assets/shmupfont.xml')

    for (var i = 1; i <= 11; i++)  {
      this.load.image('bullet' + i, 'assets/bullet' + i + '.png')
    }

    this.load.image('bullet-white', 'assets/newBullet-white.png')
    this.load.image('bullet-red'  , 'assets/newBullet-red.png'  )
    this.load.image('bullet-blue' , 'assets/newBullet-blue.png' )
    this.load.image('bullet-green', 'assets/newBullet-green.png')

    this.load.image('player-red'  , 'assets/ship2-red.png'  )
    this.load.image('player-blue' , 'assets/ship2-blue.png' )
    this.load.image('player-green', 'assets/ship2-green.png')

    this.load.image('weaponLV0', 'assets/weaponLV0.png')
    this.load.image('weaponLV1', 'assets/weaponLV1.png')
    this.load.image('weaponLV2', 'assets/weaponLV2.png')
    this.load.image('weaponLV3', 'assets/weaponLV3.png')

    this.load.image('cursor0', 'assets/cursor1.png')
    this.load.image('cursor1', 'assets/cursor2.png')
    this.load.image('cursor2', 'assets/cursor3.png')

    this.load.image('enemy', 'assets/enemy.png')

    this.load.image('hpBar', 'assets/hpBar.png');
    this.load.image('hpBarOutline', 'assets/hpBarOutline.png');

    this.background = null
    this.foreground = null

    this.player = null
    this.cursors = null
    this.speed = 100

    this.weapons = []
    this.currentWeapon = 0
    this.weaponName = null
  }

  create() {
    this.background = this.add.tileSprite(0, 0, this.game.width, this.game.height, 'background')
    this.background.autoScroll(0, -50)

    this.weapons.push(new SingleBulletWeapon(this.game))
    this.weapons.push(new TripleBulletWeapon(this.game))
    this.weapons.push(new BeamWeapon(this.game))

    this.currentWeapon = 0;

    this.enemies = []
    for (let i = 0; i < 4; i++) {
      let enemy = this.game.add.sprite(250, 250, 'enemy')
      enemy.name = 'enemy';
      enemy.scale.x = -0.5
      enemy.scale.y = 0.5
      this.game.physics.enable(enemy, Phaser.Physics.ARCADE)
      enemy.body.collideWorldBounds = true
      enemy.x = 0
      enemy.y = Math.floor((window.innerHeight-150)*Math.random()+150)
      enemy.update = () => {
        enemy.x += Math.random()*0.4
        enemy.y += Math.random()*0.2-0.1
      }
      this.enemies.push(enemy)
    }

    for (let i = 0; i < 4; i++) {
      let enemy = this.game.add.sprite(250, 250, 'enemy')
      enemy.name = 'enemy';
      enemy.scale.x = 0.5
      enemy.scale.y = 0.5
      this.game.physics.enable(enemy, Phaser.Physics.ARCADE)
      enemy.body.collideWorldBounds = true
      enemy.x = window.innerWidth
      enemy.y = Math.floor((window.innerHeight-150)*Math.random()+150)
      enemy.update = () => {
        enemy.x -= Math.random()*0.4
        enemy.y += Math.random()*0.2-0.1
      }
      this.enemies.push(enemy)
    }

    // this.enemies.update = () => {

    // this.enemies = []
    // for (let i = 0; i < 4; i++) {
    //   this.enemies.push(new Enemy(this.game, 'enemy', 100, Math.floor(window.innerHeight * Math.random()), true))
    //   this.enemies.push(new Enemy(this.game, 'enemy', window.innerWidth-100, Math.floor(window.innerHeight * Math.random()), false))
    // }

    for (var i = 1; i < this.weapons.length; i++) {
      this.weapons[i].visible = false;
    }

    this.player = this.add.sprite(window.innerWidth / 2, window.innerHeight / 2, 'player')
    this.player.currentColor = 0;
    this.player.anchor.setTo(.5,.5)
    this.physics.arcade.enable(this.player)
    this.player.isRight = true;
    this.player.body.collideWorldBounds = true;

    /////////////////////////
    // HitPoints Part
    /////////////////////////

    this.player.maxHealth = 100
    this.player.health = 100
    this.player.hitPointsBarOutline = this.add.sprite(this.player.x+3, this.player.y-119, 'hpBarOutline')
    this.player.hitPointsBarOutline.anchor.setTo(.5,.5)
    this.player.hitPointsBar = this.add.sprite(this.player.x-125, this.player.y-132, 'hpBar')
    this.player.hitPointsBar.anchor.setTo(0,0)
    this.player.hitPointsBar.update = () => {
        this.player.hitPointsBarOutline.x = this.player.x+3
        this.player.hitPointsBarOutline.y = this.player.y-119
        this.player.hitPointsBar.x        = this.player.x-125
        this.player.hitPointsBar.y        = this.player.y-132
        this.player.hitPointsBar.scale.x = this.player.health/this.player.maxHealth
    }

    // this.weaponName = this.add.bitmapText(8, 364, 'shmupfont', "ENTER = Next Weapon", 24)

    this.weaponLVactive = 3;
    this.weaponLV = this.add.sprite(0, 20, 'weaponLV3')
    this.weaponLV.scale.x = 0.5;
    this.weaponLV.scale.y = 0.5;

    this.weaponCursor = this.add.sprite(400, 20, 'cursor0')
    this.weaponCursor.scale.x = 0.5;
    this.weaponCursor.scale.y = 0.5;

    //  Cursor keys to fly + space to fire
    this.cursors = this.input.keyboard.createCursorKeys()

    this.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ])

    var changeKey = this.input.keyboard.addKey(Phaser.Keyboard.ENTER)
    changeKey.onDown.add(this.nextWeapon, this)

    server.onNewGameState = this.onNewGameState.bind(this)
  }

  onNewGameState (gameState) {
    this.weaponLVactive = 3 || gameState.weaponLevel || 0
    this.updateLV()
  }

  nextWeapon () {
    //  Tidy-up the current weapon
    if (this.currentWeapon > 2) {
      this.weapons[this.currentWeapon].reset()
    }
    else {
      this.weapons[this.currentWeapon].visible = false;
      this.weapons[this.currentWeapon].callAll('reset', null, 0, 0)
      this.weapons[this.currentWeapon].setAll('exists', false)
    }

    //  Activate the new one
    this.currentWeapon++;
    if (this.currentWeapon > 2) { this.currentWeapon = 0; }

    if (this.currentWeapon === 0) {
      this.weaponCursor.loadTexture('cursor0', 0)
    }
    else if (this.currentWeapon === 1) {
      this.weaponCursor.loadTexture('cursor1', 0)
    }
    else if (this.currentWeapon === 2) {
      this.weaponCursor.loadTexture('cursor2', 0)
    }

    this.weapons[this.currentWeapon].visible = true;
  }


  updateLV () {
    if (this.weaponLVactive === 0) {
      this.weaponLV.loadTexture('weaponLV0', 0)
    }
    else if (this.weaponLVactive === 1) {
      this.weaponLV.loadTexture('weaponLV1', 0)
    }
    else if (this.weaponLVactive === 2) {
      this.weaponLV.loadTexture('weaponLV2', 0)
    }
    else if (this.weaponLVactive === 3) {
      this.weaponLV.loadTexture('weaponLV3', 0)
    }
  }

  update () {
    for (let x = 0; x < this.game.world.children.length; x++) {
      if (this.game.world.children[x].destroy_in_next_tick)
        this.game.world.children[x].kill()
    }

    const markEnemyAndBulletForDeletion = (enemy, bullet) => {
      enemy.destroy_in_next_tick = true
      bullet.destroy()
    }

    this.enemies.map(enemy => {
      this.physics.arcade.overlap(enemy, this.weapons[this.currentWeapon], markEnemyAndBulletForDeletion, null, this)
    })

    this.player.body.velocity.set(0)

    if (this.cursors.left.isDown) {
      if (this.player.isRight === true) {
          this.player.isRight = false;
          this.player.scale.x = -1.0;
      }

    }
    else if (this.cursors.right.isDown) {
      if (this.player.isRight === false) {
          this.player.isRight = true;
          this.player.scale.x = 1.0;
      }
      this.player.isRight = true;
    }

    if (this.cursors.up.isDown) {
      this.player.body.velocity.y = -this.speed;
    }
    else if (this.cursors.down.isDown) {
      this.player.body.velocity.y = this.speed;
    }

    if (this.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
      if (this.weaponLVactive > this.currentWeapon) {
          this.weapons[this.currentWeapon].fire(this.player)
      }
    }
  }

}

class Game extends Phaser.Game {
  constructor() {
    super(window.innerWidth, window.innerHeight, Phaser.CANVAS)
    this.state.add('Main', Main, false)
    this.state.start('Main')
  }

}

new Game()
