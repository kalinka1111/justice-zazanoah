/* =====================================================
   Système de Modèles 3D Personnalisés
   ===================================================== */

class ModelFactory {
  static createCharacterModel(name, color) {
    const group = new THREE.Group();

    // Corps - Capsule
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
      metalness: 0.2,
      map: this.createTextureForColor(color),
    });

    const body = new THREE.Mesh(bodyGeometry, material);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Tête - Sphère facettée
    const headGeometry = new THREE.IcosahedronGeometry(0.35, 4);
    const headMesh = new THREE.Mesh(headGeometry, material.clone());
    headMesh.position.y = 0.8;
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    group.add(headMesh);

    // Bras (cylindres)
    const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
    const leftArm = new THREE.Mesh(armGeometry, material.clone());
    leftArm.position.set(-0.45, 0.3, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, material.clone());
    rightArm.position.set(0.45, 0.3, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // Jambes (cônes)
    const legGeometry = new THREE.ConeGeometry(0.15, 0.8, 8);
    const leftLeg = new THREE.Mesh(legGeometry, material.clone());
    leftLeg.position.set(-0.25, -0.6, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, material.clone());
    rightLeg.position.set(0.25, -0.6, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // Yeux
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12, 1, 0.35);
    headMesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12, 1, 0.35);
    headMesh.add(rightEye);

    // Pupilles
    const pupilGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.z = 0.08;
    leftEye.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.z = 0.08;
    rightEye.add(rightPupil);

    group.customParts = {
      body,
      head: headMesh,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      leftEye,
      rightEye,
      leftPupil,
      rightPupil,
    };

    return group;
  }

  static createEnemyModel(type) {
    const group = new THREE.Group();

    if (type === 'lion') {
      // Corps
      const bodyGeometry = new THREE.SphereGeometry(0.8, 8, 8);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xcd7f32,
        roughness: 0.7,
        metalness: 0.1,
      });

      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      group.add(body);

      // Crinière
      const maneGeometry = new THREE.IcosahedronGeometry(1, 3);
      const maneMaterial = new THREE.MeshStandardMaterial({
        color: 0xb8860b,
        roughness: 0.9,
      });

      const mane = new THREE.Mesh(maneGeometry, maneMaterial);
      mane.scale.set(1.3, 0.9, 1.3);
      group.add(mane);

      // Yeux
      const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xff9900 });

      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.3, 0.3, 0.8);
      body.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.3, 0.3, 0.8);
      body.add(rightEye);
    } else if (type === 'tortue') {
      // Carapace
      const shellGeometry = new THREE.SphereGeometry(0.6, 8, 8);
      const shellMaterial = new THREE.MeshStandardMaterial({
        color: 0x228b22,
        roughness: 0.8,
      });

      const shell = new THREE.Mesh(shellGeometry, shellMaterial);
      shell.scale.set(1.2, 0.8, 1.2);
      shell.castShadow = true;
      group.add(shell);

      // Tête
      const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      const headMaterial = new THREE.MeshStandardMaterial({ color: 0x3a6b3b });

      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(0, -0.2, 0.6);
      group.add(head);

      // Pattes
      for (let i = 0; i < 4; i++) {
        const legGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x1a4d1a });

        const leg = new THREE.Mesh(legGeometry, legMaterial);

        if (i === 0) leg.position.set(-0.4, -0.5, 0.3);
        else if (i === 1) leg.position.set(0.4, -0.5, 0.3);
        else if (i === 2) leg.position.set(-0.4, -0.5, -0.3);
        else leg.position.set(0.4, -0.5, -0.3);

        group.add(leg);
      }
    } else if (type === 'serpent') {
      // Créer un serpent avec plusieurs segments
      const segments = 5;
      const segmentGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 8);
      const segmentMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b0000,
        roughness: 0.7,
      });

      for (let i = 0; i < segments; i++) {
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        segment.position.z = -i * 0.4;
        segment.castShadow = true;
        group.add(segment);
      }

      // Tête
      const headGeometry = new THREE.ConeGeometry(0.35, 0.5, 8);
      const headMaterial = new THREE.MeshStandardMaterial({ color: 0x990000 });

      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.z = 0.5;
      head.castShadow = true;
      group.add(head);

      // Yeux
      const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });

      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.15, 0.15, 0.7);
      head.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.15, 0.15, 0.7);
      head.add(rightEye);
    }

    return group;
  }

  static createBossModel() {
    const group = new THREE.Group();

    // Corps principal
    const bodyGeometry = new THREE.IcosahedronGeometry(2, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a0a0a,
      emissive: 0x660000,
      emissiveIntensity: 0.4,
      roughness: 0.8,
      metalness: 0.2,
    });

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    group.add(body);

    // Yeux lumineux
    const eyeGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      emissive: 0xff0000,
      emissiveIntensity: 1,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-1.5, 1.5, 2.5);
    body.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(1.5, 1.5, 2.5);
    body.add(rightEye);

    // Cornes acérées
    for (let i = 0; i < 4; i++) {
      const hornGeometry = new THREE.ConeGeometry(0.4, 2, 8);
      const hornMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.95,
        roughness: 0.1,
      });

      const horn = new THREE.Mesh(hornGeometry, hornMaterial);

      if (i === 0) {
        horn.position.set(-1.8, 2.8, -0.5);
        horn.rotation.z = Math.PI / 4;
      } else if (i === 1) {
        horn.position.set(1.8, 2.8, -0.5);
        horn.rotation.z = -Math.PI / 4;
      } else if (i === 2) {
        horn.position.set(-1.2, 2.8, 1.5);
        horn.rotation.z = Math.PI / 6;
      } else {
        horn.position.set(1.2, 2.8, 1.5);
        horn.rotation.z = -Math.PI / 6;
      }

      horn.castShadow = true;
      group.add(horn);
    }

    // Épines sur le dos
    for (let i = 0; i < 5; i++) {
      const spineGeometry = new THREE.ConeGeometry(0.2, 1.2, 6);
      const spineMaterial = new THREE.MeshStandardMaterial({
        color: 0x440000,
        metalness: 0.8,
      });

      const spine = new THREE.Mesh(spineGeometry, spineMaterial);
      spine.position.set(
        (i - 2) * 0.8,
        1.5 + i * 0.1,
        -0.5
      );
      spine.rotation.z = Math.PI / 3;
      group.add(spine);
    }

    group.customParts = {
      body,
      leftEye,
      rightEye,
    };

    return group;
  }

  static createStarModel() {
    const group = new THREE.Group();

    // Étoile dorée
    const starGeometry = new THREE.IcosahedronGeometry(0.5, 4);
    const starMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 0.7,
      metalness: 0.9,
      roughness: 0.1,
    });

    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.castShadow = true;
    group.add(star);

    // Halo lumineux
    const haloGeometry = new THREE.IcosahedronGeometry(0.6, 3);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.3,
    });

    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    group.add(halo);

    group.customParts = { star, halo };

    return group;
  }

  static createPowerUpModel(type) {
    const group = new THREE.Group();

    const properties = {
      shield: { color: 0x4499ff, icon: '🛡️' },
      speed: { color: 0xff6b6b, icon: '⚡' },
      jump: { color: 0xffd700, icon: '⬆️' },
      health: { color: 0x00ff00, icon: '❤️' },
      invincible: { color: 0xff00ff, icon: '✨' },
    };

    const props = properties[type];

    // Forme principale
    const geometry = new THREE.OctahedronGeometry(0.6, 2);
    const material = new THREE.MeshStandardMaterial({
      color: props.color,
      emissive: props.color,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    group.add(mesh);

    // Halo
    const haloGeometry = new THREE.OctahedronGeometry(0.8, 2);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: props.color,
      transparent: true,
      opacity: 0.2,
    });

    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    group.add(halo);

    group.customParts = { mesh, halo };

    return group;
  }

  static createTextureForColor(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;

    const ctx = canvas.getContext('2d');
    const rgb = new THREE.Color(color);

    // Créer un dégradé
    const gradient = ctx.createLinearGradient(0, 0, 64, 64);
    gradient.addColorStop(
      0,
      `rgb(${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)})`
    );
    gradient.addColorStop(
      1,
      `rgb(${Math.round(rgb.r * 255 * 0.7)}, ${Math.round(rgb.g * 255 * 0.7)}, ${Math.round(rgb.b * 255 * 0.7)})`
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    // Ajouter du bruit
    const imageData = ctx.getImageData(0, 0, 64, 64);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      data[i] += noise;
      data[i + 1] += noise;
      data[i + 2] += noise;
    }

    ctx.putImageData(imageData, 0, 0);

    return new THREE.CanvasTexture(canvas);
  }
}

window.ModelFactory = ModelFactory;
