/* =====================================================
   Système de Power-ups
   ===================================================== */

class PowerUp {
  constructor(type, position, scene, physicsWorld) {
    this.type = type; // 'shield', 'speed', 'jump', 'health', 'invincible'
    this.position = position;
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.active = true;
    this.duration = 10; // secondes
    this.collected = false;

    // Propriétés du power-up
    this.properties = {
      shield: { color: 0x4499ff, icon: '🛡️', duration: 15 },
      speed: { color: 0xff6b6b, icon: '⚡', duration: 8 },
      jump: { color: 0xffd700, icon: '⬆️', duration: 12 },
      health: { color: 0x00ff00, icon: '❤️', duration: 0 },
      invincible: { color: 0xff00ff, icon: '✨', duration: 10 },
    };

    this.createMesh();
    this.createPhysics();
  }

  createMesh() {
    const props = this.properties[this.type];
    const geometry = new THREE.OctahedronGeometry(0.6, 2);
    const material = new THREE.MeshStandardMaterial({
      color: props.color,
      emissive: props.color,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Ajouter une lueur
    const glowGeometry = new THREE.OctahedronGeometry(0.7, 2);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: props.color,
      transparent: true,
      opacity: 0.3,
    });

    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.glow);

    this.scene.add(this.mesh);
    this.rotationSpeed = 0.05;
    this.floatAmplitude = 0.3;
    this.floatSpeed = 2;
  }

  createPhysics() {
    const shape = new CANNON.Sphere(0.6);
    this.body = new CANNON.Body({
      mass: 0, // Static
      shape,
    });

    this.body.position.set(
      this.position.x,
      this.position.y,
      this.position.z
    );
    this.physicsWorld.addBody(this.body);
  }

  update(deltaTime) {
    if (!this.active || this.collected) return;

    // Rotation
    this.mesh.rotation.x += this.rotationSpeed;
    this.mesh.rotation.y += this.rotationSpeed * 1.3;
    this.mesh.rotation.z += this.rotationSpeed * 0.7;

    // Animation flottante
    this.mesh.position.y +=
      Math.sin(Date.now() * 0.001 * this.floatSpeed) * 0.01;

    // Pulse de lueur
    const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
    this.glow.material.opacity = pulse * 0.3;
  }

  collect(character) {
    if (this.collected) return;

    this.collected = true;
    this.active = false;

    // Animation de collecte
    const startPos = this.mesh.position.clone();
    const startTime = Date.now();
    const duration = 0.5;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      this.mesh.position.y = startPos.y + progress * 2;
      this.mesh.scale.set(1 - progress, 1 - progress, 1 - progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(this.mesh);
      }
    };

    animate();

    // Appliquer l'effet
    character.applyPowerUp(this.type, this.properties[this.type].duration);
  }
}

/* =====================================================
   Système de Gestion des Power-ups
   ===================================================== */

class PowerUpManager {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.powerUps = [];
    this.activePowerUps = new Map(); // Character -> [{ type, endTime }]
  }

  spawnPowerUp(type, position) {
    const powerUp = new PowerUp(type, position, this.scene, this.physicsWorld);
    this.powerUps.push(powerUp);
    return powerUp;
  }

  spawnRandomPowerUp(position) {
    const types = ['shield', 'speed', 'jump', 'health', 'invincible'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return this.spawnPowerUp(randomType, position);
  }

  activatePowerUp(character, type, duration) {
    if (!this.activePowerUps.has(character)) {
      this.activePowerUps.set(character, []);
    }

    const endTime = Date.now() + duration * 1000;
    this.activePowerUps.get(character).push({ type, endTime });
  }

  updatePowerUps(characters, deltaTime) {
    // Mettre à jour les power-ups spawnés
    this.powerUps.forEach(powerUp => {
      powerUp.update(deltaTime);

      // Vérifier collision avec les personnages
      characters.forEach(character => {
        const distance = powerUp.mesh.position.distanceTo(
          character.mesh.position
        );

        if (distance < 1.5 && !powerUp.collected) {
          powerUp.collect(character);
          AudioManager.playSound('power-up');
        }
      });
    });

    // Nettoyer les power-ups collectés
    this.powerUps = this.powerUps.filter(p => !p.collected);

    // Mettre à jour les durées actives
    for (const [character, effects] of this.activePowerUps.entries()) {
      const now = Date.now();
      for (let i = effects.length - 1; i >= 0; i--) {
        if (effects[i].endTime < now) {
          effects.splice(i, 1);
        }
      }
    }
  }

  getActivePowerUps(character) {
    return this.activePowerUps.get(character) || [];
  }

  hasActivePowerUp(character, type) {
    const effects = this.getActivePowerUps(character);
    return effects.some(e => e.type === type);
  }

  getRemainingDuration(character, type) {
    const effects = this.getActivePowerUps(character);
    const effect = effects.find(e => e.type === type);
    if (!effect) return 0;

    return Math.max(0, (effect.endTime - Date.now()) / 1000);
  }
}

/* =====================================================
   Application des Effets de Power-ups
   ===================================================== */

class PowerUpEffect {
  static applyEffect(character, powerUpManager, type) {
    switch (type) {
      case 'shield':
        this.applyShield(character, powerUpManager);
        break;
      case 'speed':
        this.applySpeed(character, powerUpManager);
        break;
      case 'jump':
        this.applyJump(character, powerUpManager);
        break;
      case 'health':
        this.applyHealth(character, powerUpManager);
        break;
      case 'invincible':
        this.applyInvincible(character, powerUpManager);
        break;
    }
  }

  static applyShield(character, powerUpManager) {
    character.hasShield = true;

    // Créer une aura visuelle
    if (!character.shieldMesh) {
      const shieldGeometry = new THREE.IcosahedronGeometry(1, 4);
      const shieldMaterial = new THREE.MeshBasicMaterial({
        color: 0x4499ff,
        transparent: true,
        opacity: 0.2,
        wireframe: true,
      });

      character.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
      character.shieldMesh.scale.set(1.5, 1.5, 1.5);
      character.mesh.add(character.shieldMesh);
    } else {
      character.shieldMesh.visible = true;
    }

    // Le bouclier absorbe un hit
    character.shieldHitAbsorption = 1;
  }

  static applySpeed(character, powerUpManager) {
    character.baseSpeed = character.speed;
    character.speed *= 1.5; // 50% plus rapide
    character.isSpeedBoosted = true;
  }

  static applyJump(character, powerUpManager) {
    character.baseJumpForce = character.jumpForce;
    character.jumpForce *= 1.3; // 30% plus haut
    character.isJumpBoosted = true;
  }

  static applyHealth(character, powerUpManager) {
    character.heal(50); // Restaurer 50 HP
  }

  static applyInvincible(character, powerUpManager) {
    character.isInvincible = true;

    // Effet visuel
    const originalColor = character.mesh.material.color.getHex();
    character.mesh.material.color.setHex(0xff00ff);

    // Blinking effect
    character.invincibleBlinking = setInterval(() => {
      character.mesh.visible = !character.mesh.visible;
    }, 100);
  }

  static removeEffect(character, type) {
    switch (type) {
      case 'shield':
        character.hasShield = false;
        if (character.shieldMesh) {
          character.shieldMesh.visible = false;
        }
        break;
      case 'speed':
        character.speed = character.baseSpeed || character.speed / 1.5;
        character.isSpeedBoosted = false;
        break;
      case 'jump':
        character.jumpForce = character.baseJumpForce || character.jumpForce / 1.3;
        character.isJumpBoosted = false;
        break;
      case 'invincible':
        character.isInvincible = false;
        character.mesh.visible = true;
        if (character.invincibleBlinking) {
          clearInterval(character.invincibleBlinking);
          character.invincibleBlinking = null;
        }
        break;
    }
  }
}
