/* =====================================================
   Mode Multiplayer Local - Écran Partagé
   ===================================================== */

class MultiplayerManager {
  constructor(game) {
    this.game = game;
    this.mode = 'single'; // single ou multiplayer
    this.players = [];
    this.isLocalMultiplayer = false;
    this.screenSplitType = 'vertical'; // vertical ou horizontal
  }

  initMultiplayer() {
    this.mode = 'multiplayer';
    this.isLocalMultiplayer = true;

    // Modifier la caméra pour l'écran partagé
    this.setupSplitScreen();

    // Configurer les contrôles pour joueur 2
    this.setupPlayer2Controls();

    // Mettre à jour les rendu
    this.game.renderer.setSize(window.innerWidth, window.innerHeight);

    UIManager.showMessage('🎮 Mode Multijoueur: ACTIVÉ');
  }

  setupSplitScreen() {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;

    if (this.screenSplitType === 'vertical') {
      this.camera1Viewport = {
        x: 0,
        y: 0,
        width: this.screenWidth / 2,
        height: this.screenHeight,
      };

      this.camera2Viewport = {
        x: this.screenWidth / 2,
        y: 0,
        width: this.screenWidth / 2,
        height: this.screenHeight,
      };
    } else {
      // horizontal
      this.camera1Viewport = {
        x: 0,
        y: 0,
        width: this.screenWidth,
        height: this.screenHeight / 2,
      };

      this.camera2Viewport = {
        x: 0,
        y: this.screenHeight / 2,
        width: this.screenWidth,
        height: this.screenHeight / 2,
      };
    }

    // Créer une deuxième caméra
    if (!this.camera2) {
      this.camera2 = new THREE.PerspectiveCamera(
        75,
        this.camera1Viewport.width / this.camera1Viewport.height,
        0.1,
        1000
      );
    }
  }

  setupPlayer2Controls() {
    // Joueur 1: ZQSD
    // Joueur 2: IJKL ou WASD

    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();

      // Contrôles Joueur 2 (IJKL)
      if (key === 'i') this.game.input2.forward = true;
      if (key === 'k') this.game.input2.backward = true;
      if (key === 'j') this.game.input2.left = true;
      if (key === 'l') this.game.input2.right = true;
      if (key === 'u') this.game.input2.jump = true;
      if (key === 'o') this.game.input2.run = true;
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();

      if (key === 'i') this.game.input2.forward = false;
      if (key === 'k') this.game.input2.backward = false;
      if (key === 'j') this.game.input2.left = false;
      if (key === 'l') this.game.input2.right = false;
      if (key === 'u') this.game.input2.jump = false;
      if (key === 'o') this.game.input2.run = false;
    });

    // Initialiser les inputs
    this.game.input2 = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      run: false,
    };
  }

  renderSplitScreen() {
    // Rendu écran 1 (Joueur 1)
    this.game.renderer.setViewport(
      this.camera1Viewport.x,
      this.camera1Viewport.y,
      this.camera1Viewport.width,
      this.camera1Viewport.height
    );

    this.game.renderer.setScissor(
      this.camera1Viewport.x,
      this.camera1Viewport.y,
      this.camera1Viewport.width,
      this.camera1Viewport.height
    );

    this.updateCamera(this.game.camera, this.game.characters.kaya);
    this.game.renderer.render(this.game.scene, this.game.camera);

    // Rendu écran 2 (Joueur 2)
    this.game.renderer.setViewport(
      this.camera2Viewport.x,
      this.camera2Viewport.y,
      this.camera2Viewport.width,
      this.camera2Viewport.height
    );

    this.game.renderer.setScissor(
      this.camera2Viewport.x,
      this.camera2Viewport.y,
      this.camera2Viewport.width,
      this.camera2Viewport.height
    );

    this.updateCamera(this.camera2, this.game.characters.anji);
    this.game.renderer.render(this.game.scene, this.camera2);

    // Réinitialiser
    this.game.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    this.game.renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
  }

  updateCamera(camera, character) {
    const characterPos = character.mesh.position;
    const targetPos = new THREE.Vector3(
      characterPos.x,
      characterPos.y + 2,
      characterPos.z + 8
    );

    camera.position.lerp(targetPos, 0.1);
    camera.lookAt(characterPos.x, characterPos.y + 1, characterPos.z);
  }

  updateMultiplayer(deltaTime) {
    if (!this.isLocalMultiplayer) return;

    // Mettre à jour Joueur 2 avec input2
    const anji = this.game.characters.anji;
    if (anji) {
      anji.update(this.game.input2, deltaTime);
    }
  }

  getGameMode() {
    return this.isLocalMultiplayer ? 'multiplayer' : 'single';
  }

  toggleMultiplayer() {
    if (this.isLocalMultiplayer) {
      this.mode = 'single';
      this.isLocalMultiplayer = false;
      UIManager.showMessage('🎮 Mode Monojoueur: ACTIVÉ');
    } else {
      this.initMultiplayer();
    }
  }

  toggleScreenSplit() {
    this.screenSplitType =
      this.screenSplitType === 'vertical' ? 'horizontal' : 'vertical';
    this.setupSplitScreen();
    UIManager.showMessage(
      `📺 Écran partagé: ${this.screenSplitType.toUpperCase()}`
    );
  }
}

/* =====================================================
   Système de Coopération Joueur
   ===================================================== */

class CooperationSystem {
  constructor(game) {
    this.game = game;
    this.sharedObjectives = [];
    this.teamScore = 0;
  }

  addSharedObjective(objective) {
    this.sharedObjectives.push({
      id: Math.random(),
      description: objective,
      completed: false,
    });
  }

  completeObjective(objectiveId) {
    const objective = this.sharedObjectives.find(o => o.id === objectiveId);
    if (objective && !objective.completed) {
      objective.completed = true;
      this.teamScore += 100;
      UIManager.showMessage(`✅ Objectif: ${objective.description}`);
    }
  }

  activateTeamPower(powerType) {
    // Pouvoir qui s'active quand les deux joueurs travaillent ensemble
    const character1 = this.game.characters.kaya;
    const character2 = this.game.characters.anji;

    const distance = character1.mesh.position.distanceTo(
      character2.mesh.position
    );

    if (distance < 10) {
      // Les joueurs sont assez proches
      if (powerType === 'unison-attack') {
        this.performUnisonAttack();
      } else if (powerType === 'heal') {
        character1.heal(50);
        character2.heal(50);
        UIManager.showMessage('💚 Soin d\'équipe!');
      }
    }
  }

  performUnisonAttack() {
    // Attaque combinée des deux personnages
    const character1 = this.game.characters.kaya;
    const character2 = this.game.characters.anji;

    const midpoint = character1.mesh.position
      .clone()
      .add(character2.mesh.position)
      .multiplyScalar(0.5);

    // Créer une explosion au point milieu
    if (this.game.boss) {
      const distance = this.game.boss.mesh.position.distanceTo(midpoint);
      if (distance < 20) {
        this.game.boss.takeDamage(150);
        UIManager.showMessage('💥 Attaque unifiée!');
      }
    }
  }

  getTeamStats() {
    const character1 = this.game.characters.kaya;
    const character2 = this.game.characters.anji;

    return {
      combinedHealth: character1.health + character2.health,
      combinedMaxHealth: character1.maxHealth + character2.maxHealth,
      teamScore: this.teamScore,
      objectivesCompleted: this.sharedObjectives.filter(o => o.completed).length,
      objectivesTotal: this.sharedObjectives.length,
    };
  }
}
