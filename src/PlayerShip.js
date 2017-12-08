import Weapon from './Weapon'
import HealthBar from './HealthBar'

export default class PlayerShip extends Phaser.Sprite {
  constructor(game) {
    super(game, 125 * game.scaleFactor, game.height / 2, 'player')
    this.animations.add('move')
    this.animations.play('move', 20, true)

    game.physics.enable(this, Phaser.Physics.ARCADE)
    this.anchor.setTo(0.5, 0.5)

    this.scale.set(this.game.scaleFactor, this.game.scaleFactor)

    // Set hitbox size
    this.body.setSize(165.4, 63.2, 25.8, 28.4)

    // Movement
    this.movementSpeed = 0
    this.body.collideWorldBounds = true
    this.propulsionLevel = 0

    // Shields
    this.shieldColors = []
    this.shield = game.add.sprite(this.x, this.y, 'shield_R')
    this.setShields(this.shieldColors)
    this.shield.anchor.setTo(0.5, 0.5)
    game.physics.enable(this.shield, Phaser.Physics.ARCADE)

    // Health
    this.maxHealth = 100
    this.health = 100

    // HP bar
    this.healthBar = new HealthBar(this)

    // Weapons
    this.weapons = []
    this.weaponDamage = 10
    this.currentWeapon = 0

    // Sound
    this.shootFx = this.game.add.audio('shoot')

    // Repairs
    this.repairPercentagePerSecond = 0
    this.repairIntervalMsec = 60
    setInterval(this.onRepair.bind(this), this.repairIntervalMsec)
  }

  onRepair() {
    this.heal((this.repairPercentagePerSecond * this.maxHealth) * (this.repairIntervalMsec / 1000))
  }

  setShields(colors) {
    colors.sort()
    this.shieldColors = colors
    if (colors.length === 0) {
      this.shield.exists = false
      return
    }
    this.shield.visible = true
    const colorToWeaponType = color => color[0].toUpperCase()
    const shieldKey = `shield_${colors.map(colorToWeaponType).join('')}`
    this.shield.loadTexture(shieldKey)
  }

  setWeapons(colors) {
    colors.sort()
    const colorToWeaponType = color => color[0].toUpperCase()
    const bulletSpread = 10 * this.game.scaleFactor
    const bulletAngle = 0
    const spreadRange = [
      [0],
      [bulletSpread / 2, -bulletSpread / 2],
      [0, bulletSpread, -bulletSpread],
    ]
    const angleRange = [
      [0],
      [bulletAngle / 2, -bulletAngle / 2],
      [0, bulletAngle, -bulletAngle],
    ]
    this.weapons = colors.map((color, i) => (
      new Weapon(
        this,
        this.weaponDamage,
        colorToWeaponType(color),
        spreadRange[colors.length - 1][i],
        angleRange[colors.length - 1][i],
      )
    ))
  }

  fire(strength) {
    console.log(`firing with strength: ${strength}`)
    let didFire = false
    this.weapons.forEach(weapon => {
      if (weapon.fire(this) && !didFire) {
        didFire = true
      }
    })
    if (didFire) {
      this.shootFx.play()
    }
  }

  moveDown() {
    this.body.velocity.y = this.movementSpeed
  }

  moveUp() {
    this.body.velocity.y = -this.movementSpeed
  }

  getHurtTint() {
    this.tint = 0xff0000
    setTimeout(() => this.tint = 0xffffff, 150)
    const h = setInterval(() => this.tint = 0xffffff, 100)
    setTimeout(() => clearInterval(h), 500)
  }

  setPropulsionLevel(level) {
    this.propulsionLevel = level
    const levelSpeedMap = [0, 25, 100]
    this.movementSpeed = levelSpeedMap[level]
  }

  setRepairLevel(level) {
    const repairSpeedMap = [0, 0.015, 0.025, 0.065]
    this.repairPercentagePerSecond = repairSpeedMap[level]
  }

  update() {
    if (this.health !== this.prevHealth) {
      this.game.onHullStrengthChanged(this.health)
      this.prevHealth = this.health
    }

    // this.sight.y = this.y

    this.body.velocity.set(0)

    // Shield
    this.shield.x = this.x
    this.shield.y = this.y
    if (this.shield.health === 0) {
      this.isShieldActive = false
      this.shield.visible = false
      // this.sight.visible = false
    }
  }
}
