/* =====================================================
   Système de Score et Leaderboard
   ===================================================== */

class ScoreManager {
  constructor() {
    this.scores = {
      starsCollected: 0,
      enemiesDefeated: 0,
      powerUpsCollected: 0,
      bossDefeated: false,
      totalScore: 0,
      time: 0,
      difficulty: 'normal',
    };

    this.leaderboard = this.loadLeaderboard();
  }

  addStarScore(amount = 10) {
    this.scores.starsCollected += amount;
    this.updateTotalScore();
  }

  addEnemyScore(amount = 50) {
    this.scores.enemiesDefeated += amount;
    this.updateTotalScore();
  }

  addPowerUpScore(amount = 25) {
    this.scores.powerUpsCollected += amount;
    this.updateTotalScore();
  }

  defeatBoss(baseScore = 500) {
    this.scores.bossDefeated = true;
    const timeBonus = Math.max(0, 600 - this.scores.time) * 2;
    this.scores.totalScore += baseScore + timeBonus;
    this.updateTotalScore();
  }

  setTime(seconds) {
    this.scores.time = seconds;
  }

  updateTotalScore() {
    const difficultyMultiplier = {
      easy: 0.8,
      normal: 1.0,
      hard: 1.5,
      expert: 2.0,
    };

    const multiplier =
      difficultyMultiplier[this.scores.difficulty] || 1.0;

    this.scores.totalScore = Math.round(
      (this.scores.starsCollected * 10 +
        this.scores.enemiesDefeated * 50 +
        this.scores.powerUpsCollected * 25) *
        multiplier
    );

    if (this.scores.bossDefeated) {
      const timeBonus = Math.max(0, 600 - this.scores.time) * 2;
      this.scores.totalScore += 500 + timeBonus;
    }
  }

  getScoreBreakdown() {
    return {
      stars: this.scores.starsCollected * 10,
      enemies: this.scores.enemiesDefeated * 50,
      powerUps: this.scores.powerUpsCollected * 25,
      boss: this.scores.bossDefeated ? 500 : 0,
      timeBonus: Math.max(0, 600 - this.scores.time) * 2,
      total: this.scores.totalScore,
    };
  }

  submitScore(playerName) {
    const entry = {
      name: playerName,
      score: this.scores.totalScore,
      time: this.scores.time,
      starsCollected: this.scores.starsCollected,
      date: new Date().toISOString(),
      difficulty: this.scores.difficulty,
    };

    this.leaderboard.push(entry);
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, 100);

    this.saveLeaderboard();

    return this.leaderboard.findIndex(e => e === entry) + 1;
  }

  getLeaderboard(limit = 10) {
    return this.leaderboard.slice(0, limit);
  }

  getPlayerRank(playerName) {
    return (
      this.leaderboard.findIndex(e => e.name === playerName) + 1 ||
      null
    );
  }

  getTopScore() {
    return this.leaderboard[0]?.score || 0;
  }

  saveLeaderboard() {
    try {
      localStorage.setItem(
        'kayaAnji_leaderboard',
        JSON.stringify(this.leaderboard)
      );
    } catch (e) {
      console.warn('Impossible de sauvegarder le leaderboard:', e);
    }
  }

  loadLeaderboard() {
    try {
      const data = localStorage.getItem('kayaAnji_leaderboard');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Impossible de charger le leaderboard:', e);
      return [];
    }
  }

  clearLeaderboard() {
    this.leaderboard = [];
    localStorage.removeItem('kayaAnji_leaderboard');
  }
}

/* =====================================================
   Affichage du Leaderboard
   ===================================================== */

class LeaderboardUI {
  constructor(scoreManager) {
    this.scoreManager = scoreManager;
    this.container = null;
  }

  show() {
    const leaderboard = this.scoreManager.getLeaderboard(10);

    const html = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.95);
        border: 2px solid #6366f1;
        border-radius: 12px;
        padding: 30px;
        max-width: 500px;
        max-height: 600px;
        overflow-y: auto;
        z-index: 1000;
        color: #fff;
        font-family: 'Courier New', monospace;
      ">
        <h2 style="text-align: center; color: #fbbf24; margin-bottom: 20px;">
          🏆 LEADERBOARD 🏆
        </h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #6366f1;">
              <th style="padding: 8px; text-align: left;">Rang</th>
              <th style="padding: 8px; text-align: left;">Joueur</th>
              <th style="padding: 8px; text-align: center;">Score</th>
              <th style="padding: 8px; text-align: center;">⭐</th>
            </tr>
          </thead>
          <tbody>
            ${leaderboard
              .map(
                (entry, index) => `
              <tr style="border-bottom: 1px solid rgba(99, 102, 241, 0.3); ${
                  index === 0 ? 'background: rgba(255, 215, 0, 0.1);' : ''
                }">
                <td style="padding: 8px; color: ${
                  index === 0
                    ? '#fbbf24'
                    : index === 1
                    ? '#c0c0c0'
                    : index === 2
                    ? '#cd7f32'
                    : '#fff'
                };">
                  ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1)}
                </td>
                <td style="padding: 8px;">${entry.name}</td>
                <td style="padding: 8px; text-align: center; color: #4ade80;">${entry.score}</td>
                <td style="padding: 8px; text-align: center;">${entry.starsCollected}/20</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div style="
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(99, 102, 241, 0.3);
          text-align: center;
        ">
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: #6366f1;
            color: #fff;
            border: none;
            padding: 10px 30px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">Fermer</button>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container.firstElementChild);
  }

  showGameOver(scoreManager) {
    const breakdown = scoreManager.getScoreBreakdown();

    const html = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.95);
        border: 3px solid #fbbf24;
        border-radius: 12px;
        padding: 40px;
        max-width: 600px;
        z-index: 1000;
        color: #fff;
        font-family: 'Courier New', monospace;
        text-align: center;
      ">
        <h1 style="color: #fbbf24; font-size: 48px; margin-bottom: 20px;">
          🎉 VICTOIRE! 🎉
        </h1>

        <div style="
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid #6366f1;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: left;
        ">
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span>⭐ Étoiles collectées:</span>
            <span style="color: #fbbf24;">${breakdown.stars} pts</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span>👹 Ennemis vaincus:</span>
            <span style="color: #ff6b6b;">${breakdown.enemies} pts</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span>⚡ Power-ups collectés:</span>
            <span style="color: #4ade80;">${breakdown.powerUps} pts</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span>🐲 Boss vaincu:</span>
            <span style="color: #ff00ff;">${breakdown.boss} pts</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span>⏱️ Bonus temps:</span>
            <span style="color: #60a5fa;">${breakdown.timeBonus} pts</span>
          </div>
          <hr style="border: none; border-top: 1px solid #6366f1; margin: 15px 0;">
          <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold;">
            <span>SCORE TOTAL:</span>
            <span style="color: #fbbf24;">${breakdown.total} PTS</span>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <input 
            id="playerName" 
            type="text" 
            placeholder="Votre nom" 
            maxlength="20"
            style="
              padding: 10px;
              border-radius: 6px;
              border: 1px solid #6366f1;
              background: rgba(99, 102, 241, 0.2);
              color: #fff;
              width: 100%;
              margin-bottom: 10px;
            "
          >
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button onclick="
            const name = document.getElementById('playerName').value || 'Anonyme';
            window.submitScore(name);
            this.parentElement.parentElement.remove();
          " style="
            flex: 1;
            background: #4ade80;
            color: #000;
            border: none;
            padding: 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
          ">Soumettre Score</button>
          
          <button onclick="location.reload()" style="
            flex: 1;
            background: #6366f1;
            color: #fff;
            border: none;
            padding: 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">Rejouer</button>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container.firstElementChild);
  }
}

window.submitScore = function(playerName) {
  if (window.scoreManager) {
    const rank = window.scoreManager.submitScore(playerName);
    UIManager.showMessage(
      `🏆 Classé ${rank}e sur le leaderboard!`
    );
  }
};

window.showLeaderboard = function() {
  if (window.scoreManager && window.leaderboardUI) {
    window.leaderboardUI.show();
  }
};
