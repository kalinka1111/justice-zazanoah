/* =====================================================
   Système du Boss Final
   ===================================================== */

class BossFinal {
  constructor(position, scene, physicsWorld, playerCharacters) {
    this.name = 'Titan des Ombres';
    this.position = position;
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.playerCharacters = playerCharacters;

    this.health = 500;
    this.maxHealth = 500;
    this.speed = 3;
    this.attackCooldown = 0;
    this.attackInterval = 2;
    this.detectionRadius = 30;
    this.phase = 1; // 1, 2, 3

    this.state = 'patrol'; // patrol, chase, attack, stun
    this.direction = Math.random() * Math.PI * 2;
    this.targetCharacter = null;
    this.projectiles = [];
    this.particles = [];

    this.createMesh();
    this.createPhysics();
  }

  createMesh() {
    // Corps principal - Large sphère
    const bodyGeometry = new THREE.SphereGeometry(2, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a0a0a,
      emissive: 0x660000,
      emissiveIntensity: 0.3,
      roughness: 0.8,
      metalness: 0.2,
    });

    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.position.set(
      this.position.x,
      this.position.y,
      this.position.z
    );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.scale.set(1.5, 1.5, 1.5);

    // Yeux
    const eyeGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
    });

    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-1, 1.5, 2.5);

    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(1, 1.5, 2.5);

    this.mesh.add(this.leftEye);
    this.mesh.add(this.rightEye);

    // Cornes
    const hornGeometry = new THREE.ConeGeometry(0.3, 1.5, 8);
    const hornMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
    });

    const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    leftHorn.position.set(-1.5, 2.5, 0);
    leftHorn.rotation.z = Math.PI / 6;

    const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    rightHorn.position.set(1.5, 2.5, 0);
    rightHorn.rotation.z = -Math.PI / 6;

    this.mesh.add(leftHorn);
    this.mesh.add(rightHorn);

    this.scene.add(this.mesh);

    // Barre de santé du boss
    this.createHealthBar();
  }

  createHealthBar() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 32;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 256, 32);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 252, 28);

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(4, 4, 248, 24);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const geometry = new THREE.PlaneGeometry(10, 1);

    this.healthBar = new THREE.Mesh(geometry, material);
    this.healthBar.position.set(0, 5, 0);
    this.mesh.add(this.healthBar);
  }

  createPhysics() {
    const shape = new CANNON.Sphere(2);
    this.body = new CANNON.Body({
      mass: 2, // Lourd mais mobile
      shape,
      linearDamping: 0.5,
    });

    this.body.position.set(
      this.position.x,
      this.position.y,
      this.position.z
    );
    this.physicsWorld.addBody(this.body);
  }

  update(deltaTime) {
    this.updateTarget();
    this.updateState();
    this.updateMovement(deltaTime);
    this.updateAttacks(deltaTime);
    this.updatePhase();
    this.updateAnimation();
    this.updateHealthBar();
    this.updateParticles();
    this.updatePhysics();
  }

  updateTarget() {
    // Chercher le personnage le plus proche
    let closest = null;
    let closestDistance = this.detectionRadius;

    this.playerCharacters.forEach(character => {
      const distance = this.mesh.position.distanceTo(character.mesh.position);
      if (distance < closestDistance && character.health > 0) {
        closest = character;
        closestDistance = distance;
      }
    });

    this.targetCharacter = closest;
  }

  updateState() {
    if (this.targetCharacter) {
      const distance = this.mesh.position.distanceTo(
        this.targetCharacter.mesh.position
      );

      if (distance < 5) {
        this.state = 'attack';
      } else {
        this.state = 'chase';
      }
    } else {
      this.state = 'patrol';
    }
  }

  updateMovement(deltaTime) {
    const moveVector = new THREE.Vector3();

    if (this.state === 'patrol') {
      const moveX = Math.cos(this.direction) * this.speed * deltaTime;
      const moveZ = Math.sin(this.direction) * this.speed * deltaTime;

      this.body.velocity.x = moveX;
      this.body.velocity.z = moveZ;

      // Changer de direction aléatoirement
      if (Math.random() < 0.005) {
        this.direction += (Math.random() - 0.5) * Math.PI;
      }
    } else if (this.state === 'chase' && this.targetCharacter) {
      const direction = this.targetCharacter.mesh.position
        .clone()
        .sub(this.mesh.position)
        .normalize();

      const currentSpeed = this.phase === 3 ? this.speed * 1.5 : this.speed;

      this.body.velocity.x = direction.x * currentSpeed;
      this.body.velocity.z = direction.z * currentSpeed;
    }
  }

  updateAttacks(deltaTime) {
    this.attackCooldown -= deltaTime;

    if (this.state === 'attack' && this.attackCooldown <= 0) {
      this.performAttack();
      this.attackCooldown = this.attackInterval;
    }
  }

  performAttack() {
    if (!this.targetCharacter) return;

    const attackType = Math.floor(Math.random() * 3);

    switch (attackType) {
      case 0:
        this.attackMelee();
        break;
      case 1:
        this.attackRanged();
        break;
      case 2:
        this.attackAOE();
        break;
    }

    AudioManager.playSound('boss-attack');
  }

  attackMelee() {
    // Attaque de mêlée - expulsion de l'ennemi
    const direction = this.targetCharacter.mesh.position
      .clone()
      .sub(this.mesh.position)
      .normalize();

    const force = 100;
    this.targetCharacter.body.velocity.x += direction.x * force;
    this.targetCharacter.body.velocity.y += 30;
    this.targetCharacter.body.velocity.z += direction.z * force;

    if (!this.targetCharacter.isInvincible) {
      this.targetCharacter.takeDamage(25);
    }
  }

  attackRanged() {
    // Projets d'énergie
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 * i) / 3;
      const direction = new THREE.Vector3(
        Math.cos(angle),
        0,
        Math.sin(angle)
      );

      const projectile = {
        position: this.mesh.position.clone(),
        direction,
        speed: 15,
        damage: 15,
        lifetime: 5,
      };

      this.spawnProjectile(projectile);
    }
  }

  attackAOE() {
    // Attaque Zone de Dégâts
    this.playerCharacters.forEach(character => {
      const distance = this.mesh.position.distanceTo(character.mesh.position);

      if (distance < 15 && !character.isInvincible) {
        character.takeDamage(35);

        // Repousser le personnage
        const direction = character.mesh.position
          .clone()
          .sub(this.mesh.position)
          .normalize();

        character.body.velocity.x += direction.x * 80;
        character.body.velocity.y += 20;
        character.body.velocity.z += direction.z * 80;
      }
    });

    // Créer une onde de choc visuelle
    this.createExplosion();
  }

  spawnProjectile(projectile) {
    this.projectiles.push(projectile);
  }

  createExplosion() {
    // Particules d'explosion
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const particle = {
        position: this.mesh.position.clone(),
        velocity: new THREE.Vector3(
          Math.cos(angle) * 20,
          10 + Math.random() * 10,
          Math.sin(angle) * 20
        ),
        lifetime: 1,
        color: 0xff6600,
      };

      this.particles.push(particle);
    }
  }

  updatePhase() {
    const healthPercent = this.health / this.maxHealth;

    if (healthPercent > 0.66) {
      this.phase = 1;
      this.speed = 3;
      this.attackInterval = 2;
    } else if (healthPercent > 0.33) {
      this.phase = 2;
      this.speed = 4;
      this.attackInterval = 1.5;

      // Devenir rougeâtre
      this.mesh.material.emissiveIntensity = 0.5;
    } else {
      this.phase = 3;
      this.speed = 5;
      this.attackInterval = 1;

      // Devenir très rouge
      this.mesh.material.emissiveIntensity = 0.8;
      this.mesh.material.emissive.setHex(0xff0000);
    }
  }

  updateAnimation() {
    // Animation des yeux
    this.leftEye.rotation.z = Math.sin(Date.now() * 0.005) * 0.3;
    this.rightEye.rotation.z = Math.sin(Date.now() * 0.005) * 0.3;

    // Pulsation du corps
    const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 0.9;
    this.mesh.scale.set(1.5 * pulse, 1.5 * pulse, 1.5 * pulse);
  }

  updateHealthBar() {
    const healthPercent = Math.max(0, this.health / this.maxHealth);

    // Mettre à jour la barre de santé
    if (this.healthBar && this.healthBar.material.map) {
      const canvas = this.healthBar.material.map.image;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 256, 32);

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, 252, 28);

      // Couleur selon santé
      const hue = healthPercent * 120;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.fillRect(4, 4, 248 * healthPercent, 24);

      this.healthBar.material.map.needsUpdate = true;
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifetime -= 0.016;

      if (p.lifetime <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updatePhysics() {
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);

    // Flash blanc
    const originalColor = this.mesh.material.color.getHex();
    this.mesh.material.color.setHex(0xffffff);

    setTimeout(() => {
      this.mesh.material.color.setHex(originalColor);
    }, 50);

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    // Animation de mort
    AudioManager.playSound('boss-defeat');

    // Explosion finale
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50;
      const particle = {
        position: this.mesh.position.clone(),
        velocity: new THREE.Vector3(
          Math.cos(angle) * 30,
          20 + Math.random() * 20,
          Math.sin(angle) * 30
        ),
        lifetime: 2,
        color: 0xff3333,
      };

      this.particles.push(particle);
    }
  }
}
