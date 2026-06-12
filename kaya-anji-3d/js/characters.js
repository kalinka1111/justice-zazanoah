/* =====================================================
   Système de Personnages - Kaya & Anji
   ===================================================== */

class Character {
  constructor(name, color, position, world) {
    this.name = name;
    this.color = color;
    this.position = position;
    this.world = world;

    // Création du modèle 3D
    this.mesh = ModelFactory.createCharacterModel(name, color);
    this.mesh.position.copy(position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Stats
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 0.15;
    this.jumpForce = 0.3;
    this.isGrounded = false;
    this.isDead = false;

    // Mouvement
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.direction = new THREE.Vector3(0, 0, 0);
    this.isRunning = false;
    this.isFalling = false;

    // Animations
    this.animations = {
      armRotation: 0,
      legRotation: 0,
      headTilt: 0,
    };

    // État de combat
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.damageCooldown = 0;

    // Power-ups actifs
    this.activePowerUps = {
      shield: false,
      speed: false,
      jump: false,
      invincible: false,
    };

    this.powerUpTimers = {};

    // Création du corps physique
    this.createPhysicsBody();

    // Particules
    this.particleSystem = null;
  }

  createPhysicsBody() {
    const shape = new CANNON.Sphere(0.5);
    this.body = new CANNON.Body({
      mass: 1,
      shape: shape,
      linearDamping: 0.3,
      angularDamping: 0.3,
    });

    this.body.position.copy(this.position);
    this.world.addBody(this.body);
  }

  update(input, deltaTime) {
    if (this.isDead) return;

    // Mise à jour cooldowns
    this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
    this.damageCooldown = Math.max(0, this.damageCooldown - deltaTime);

    // Vérifier si au sol
    this.checkGrounded();

    // Traitement de l'input
    this.handleInput(input, deltaTime);

    // Appliquer la physique
    this.applyPhysics(deltaTime);

    // Mise à jour de la position mesh
    this.mesh.position.copy(this.body.position);

    // Animations
    this.updateAnimations(deltaTime);

    // Mettre à jour les power-ups
    this.updatePowerUps(deltaTime);

    // Vérifier si mort
    if (this.health <= 0 && !this.isDead) {
      this.die();
    }
  }

  handleInput(input, deltaTime) {
    this.direction.set(0, 0, 0);

    if (input.forward) this.direction.z -= 1;
    if (input.backward) this.direction.z += 1;
    if (input.left) this.direction.x -= 1;
    if (input.right) this.direction.x += 1;

    // Normaliser la direction
    if (this.direction.length() > 0) {
      this.direction.normalize();
    }

    // Appliquer la vitesse
    let moveSpeed = this.speed;
    this.isRunning = input.run || false;

    if (this.isRunning) {
      moveSpeed *= 1.5;
    }

    if (this.activePowerUps.speed) {
      moveSpeed *= 1.5;
    }

    // Appliquer la vélocité
    this.body.velocity.x = this.direction.x * moveSpeed * 10;
    this.body.velocity.z = this.direction.z * moveSpeed * 10;

    // Saut
    if (input.jump && this.isGrounded) {
      let jumpPower = this.jumpForce;
      if (this.activePowerUps.jump) {
        jumpPower *= 1.3;
      }
      this.body.velocity.y = jumpPower * 10;
      this.isGrounded = false;
      AudioManager.playJumpSound();
    }

    // Attaque
    if (input.attack && this.attackCooldown <= 0) {
      this.attack();
    }
  }

  attack() {
    this.isAttacking = true;
    this.attackCooldown = 0.5;

    // Créer une sphère d'attaque
    const attackRadius = 2;
    const attackPos = this.mesh.position.clone();
    attackPos.y += 0.5;

    // Émettre un événement d'attaque
    const attackEvent = new CustomEvent('characterAttack', {
      detail: {
        position: attackPos,
        radius: attackRadius,
        damage: 25,
        character: this,
      },
    });

    window.dispatchEvent(attackEvent);
    AudioManager.playAttackSound();
  }

  takeDamage(amount) {
    if (this.damageCooldown > 0 || this.activePowerUps.invincible) {
      return;
    }

    if (this.activePowerUps.shield) {
      this.activePowerUps.shield = false;
      AudioManager.playShieldSound();
      return;
    }

    this.health = Math.max(0, this.health - amount);
    this.damageCooldown = 0.3;

    // Flasher le personnage
    this.mesh.material.emissive.setHex(0xff0000);
    setTimeout(() => {
      this.mesh.material.emissive.setHex(0x000000);
    }, 100);

    AudioManager.playDamageSound();
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    AudioManager.playHealSound();
  }

  activatePowerUp(type, duration) {
    this.activePowerUps[type] = true;
    this.powerUpTimers[type] = duration;

    // Visual feedback
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.3,
      })
    );
    this.mesh.add(glow);

    AudioManager.playPowerUpSound();
  }

  updatePowerUps(deltaTime) {
    for (const [type, duration] of Object.entries(this.powerUpTimers)) {
      this.powerUpTimers[type] -= deltaTime;

      if (this.powerUpTimers[type] <= 0) {
        this.activePowerUps[type] = false;
        delete this.powerUpTimers[type];
      }
    }
  }

  checkGrounded() {
    const raycaster = new THREE.Raycaster(
      this.mesh.position,
      new THREE.Vector3(0, -1, 0),
      0,
      0.6
    );

    // Vérifier collision avec le sol
    this.isGrounded = this.body.velocity.y <= 0.1;
  }

  applyPhysics(deltaTime) {
    // Appliquer la gravité
    this.body.velocity.y = Math.max(
      this.body.velocity.y - 9.81 * deltaTime,
      -15
    );

    // Limiter la vitesse max horizontale
    const horizontalSpeed = Math.sqrt(
      this.body.velocity.x ** 2 + this.body.velocity.z ** 2
    );
    if (horizontalSpeed > 15) {
      const factor = 15 / horizontalSpeed;
      this.body.velocity.x *= factor;
      this.body.velocity.z *= factor;
    }
  }

  updateAnimations(deltaTime) {
    const parts = this.mesh.customParts;

    // Animation des bras
    if (this.direction.length() > 0 || this.isRunning) {
      this.animations.armRotation +=
        deltaTime * (this.isRunning ? 8 : 4);
    } else {
      this.animations.armRotation *= 0.95;
    }

    if (parts.leftArm) {
      parts.leftArm.rotation.z = Math.sin(
        this.animations.armRotation
      ) * 0.3;
    }
    if (parts.rightArm) {
      parts.rightArm.rotation.z = Math.sin(
        this.animations.armRotation + Math.PI
      ) * 0.3;
    }

    // Animation des jambes
    if (this.direction.length() > 0) {
      this.animations.legRotation += deltaTime * (this.isRunning ? 6 : 3);
    } else {
      this.animations.legRotation *= 0.95;
    }

    if (parts.leftLeg) {
      parts.leftLeg.rotation.z = Math.sin(
        this.animations.legRotation
      ) * 0.2;
    }
    if (parts.rightLeg) {
      parts.rightLeg.rotation.z = Math.sin(
        this.animations.legRotation + Math.PI
      ) * 0.2;
    }

    // Animation de flottement
    const float = Math.sin(Date.now() * 0.001) * 0.1;
    this.mesh.position.y += float * deltaTime;

    // Bobbing de la tête selon la direction
    if (parts.head) {
      parts.head.rotation.x = this.direction.z * 0.1;
      parts.head.rotation.y = this.direction.x * 0.1;
    }
  }

  die() {
    this.isDead = true;
    AudioManager.playDeathSound();

    // Animer la mort
    const startScale = this.mesh.scale.clone();
    let progress = 0;

    const deathAnimation = setInterval(() => {
      progress += 0.05;
      if (progress >= 1) {
        clearInterval(deathAnimation);
        this.mesh.visible = false;
      }

      this.mesh.scale.copy(startScale).multiplyScalar(1 - progress);
      this.mesh.rotation.z += 0.1;
    }, 30);
  }

  getStats() {
    return {
      name: this.name,
      health: this.health,
      maxHealth: this.maxHealth,
      isDead: this.isDead,
      activePowerUps: Object.keys(this.activePowerUps).filter(
        k => this.activePowerUps[k]
      ),
    };
  }
}

/* =====================================================
   Gestionnaire de Personnages
   ===================================================== */

class CharacterManager {
  constructor(world, scene) {
    this.world = world;
    this.scene = scene;

    this.kaya = new Character('Kaya', 0xff69b4, new THREE.Vector3(-5, 5, 0), world);
    this.anji = new Character('Anji', 0x4169e1, new THREE.Vector3(5, 5, 0), world);

    this.scene.add(this.kaya.mesh);
    this.scene.add(this.anji.mesh);

    this.currentPlayer = this.kaya;
  }

  update(input, input2, deltaTime) {
    this.kaya.update(input, deltaTime);
    this.anji.update(input2, deltaTime);
  }

  switchCharacter() {
    this.currentPlayer =
      this.currentPlayer === this.kaya ? this.anji : this.kaya;
  }

  getStats() {
    return {
      kaya: this.kaya.getStats(),
      anji: this.anji.getStats(),
    };
  }

  dispose() {
    this.scene.remove(this.kaya.mesh);
    this.scene.remove(this.anji.mesh);
    this.world.removeBody(this.kaya.body);
    this.world.removeBody(this.anji.body);
  }
}

window.Character = Character;
window.CharacterManager = CharacterManager;
