// ========================================================
// PONG MOD - MAIN GAME ENGINE
// 100% Minimalist Pure Arcade Pong with 23 Unique Twists
// Zero Clutter, Clean 1-Bit Graphics, Simple Grid Menu
// ========================================================

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

class PongModGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Game States: 'MENU', 'PLAYING', 'PAUSED', 'RESULT'
    this.state = 'MENU';
    this.difficulty = 'normal'; // 'easy', 'normal', 'hard', 'impossible'
    this.currentPage = 1;
    this.currentLevel = null;
    this.unlockedLevel = 67; // Levels 1-67 unlocked

    // Saved Completed Levels with highest beaten difficulty tier:
    // 1: Easy, 2: Normal, 3: Hard, 4: Impossible
    this.completedLevels = {};
    try {
      const saved = localStorage.getItem('pong_completed_levels');
      if (saved) {
        this.completedLevels = JSON.parse(saved) || {};
      }
    } catch (e) {
      this.completedLevels = {};
    }

    // Input Tracking
    this.keys = {};
    this.mouseX = 480;
    this.mouseY = 270;
    this.lastTime = performance.now();

    // Base Entities
    this.player = { x: 30, y: 235, w: 12, h: 70, score: 0, vy: 0 };
    this.enemy = { x: 918, y: 235, w: 12, h: 70, score: 0, vy: 0, speed: 3.8 };
    this.ball = { x: 480, y: 270, vx: 6.5, vy: 0, size: 10, speed: 6.5 };

    // Mode-Specific States
    this.modeState = {};

    this.bindEvents();
    this.renderGrid();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  // Fair, comprehensive difficulty tuning across ALL levels
  getAiConfig() {
    switch (this.difficulty) {
      case 'easy':
        return {
          diff: 'easy',
          speed: 2.8,
          reactionDist: 240,
          jitter: 22,
          ballSpeed: 5.2,
          ballSpeedUp: 1.025,
          maxBallSpeed: 13.0,
          factor: 0.75,
          softbodyPaddleSpeed: 2.6,
          fpsOppSpeed: 2.4,
          fpsBallVz: 5.2,
          secondPersonOppSpeed: 2.6,
          secondPersonBallVz: 5.2,
          fourDOppSpeed: 2.2,
          fourDBallSpeed: 4.8,
          subwaySpeed: 230,
          subwaySpawnDist: 520,
          speedLaserAiSpeed: 380,
          pinballAiSpeed: 340,
          breakoutPaddleW: 90,
          breakoutBallSpeed: 4.8,
          breakoutLives: 5,
          racingBallSpeed: 3.4,
          dodgeballsCount: 3,
          dodgeSpeed: 3.5,
          dodgeballSpeedMult: 0.75,
          blasterCooldown: 2.6,
          orbitSpawnRate: 1.35,
          orbitBallSpeed: 2.8,
          orbitLives: 6,
          mazePatrolMult: 0.75,
          gdSpeed: 5.0,
          pacmanGhostMult: 0.75,
          giantBallSpeed: 4.2,
          giantEnemySpeed: 2.2,
          sentinelSpeed: 2.2,
          crossySpeedMult: 0.75,
          loopingAiSpeed: 3.6,
          loopingBallSpeed: 5.6,
          mathTimer: 8.0,
          pokeEnemyHp: 80,
          pokeDmgMult: 0.7,
          gravityPull: 400,
          gravitySwirl: 260,
          gravityBallSpeed: 5.2,
          fourPlayerAiSpeed: 2.8,
          drunkFactor: 0.6,
          drunkAiSpeed: 2.8,
          drunkBallSpeed: 5.0,
          dodgeRogueSpeed: 8.5,
          dodgeRogueCount: 1,
          cubeAiSpeed: 2.8,
          cubeBallSpeed: 5.2,
          bossPlayerHp: 5,
          bossBulletSpd: 4.8,
          bossSpawnRate: 1.3,
          flashingInterval: 0.50,
          flashingBallSpeed: 5.2,
          flashingAiSpeed: 2.8,
          holePaddleSpeed: 4.2,
          holeAiSpeed: 2.0,
          holeBallSpeed: 4.8,
          holeSize: 28,
          holeReactionDist: 300,
          holeJitter: 24,
          tallPaddleSpeed: 9.5,
          tallAiSpeed: 7.5,
          tallBallSpeed: 7.0,
          mazeLives: 3,
          mazePatrolSpeed: 2.4,
          mitosisTargetScore: 600
        };
      case 'hard':
        return {
          diff: 'hard',
          speed: 5.4,
          reactionDist: 540,
          jitter: 6,
          ballSpeed: 8.2,
          ballSpeedUp: 1.065,
          maxBallSpeed: 19.0,
          factor: 1.3,
          softbodyPaddleSpeed: 4.6,
          fpsOppSpeed: 4.6,
          fpsBallVz: 8.4,
          secondPersonOppSpeed: 4.8,
          secondPersonBallVz: 8.0,
          fourDOppSpeed: 4.2,
          fourDBallSpeed: 7.2,
          subwaySpeed: 330,
          subwaySpawnDist: 500,
          speedLaserAiSpeed: 520,
          pinballAiSpeed: 460,
          breakoutPaddleW: 52,
          breakoutBallSpeed: 7.6,
          breakoutLives: 2,
          racingBallSpeed: 5.6,
          dodgeballsCount: 6,
          dodgeSpeed: 6.8,
          dodgeballSpeedMult: 1.25,
          blasterCooldown: 1.1,
          orbitSpawnRate: 0.75,
          orbitBallSpeed: 4.8,
          orbitLives: 4,
          mazePatrolMult: 1.35,
          gdSpeed: 7.4,
          pacmanGhostMult: 1.3,
          giantBallSpeed: 6.5,
          giantEnemySpeed: 4.2,
          sentinelSpeed: 4.4,
          crossySpeedMult: 1.3,
          loopingAiSpeed: 5.8,
          loopingBallSpeed: 8.4,
          mathTimer: 4.0,
          pokeEnemyHp: 130,
          pokeDmgMult: 1.35,
          gravityPull: 900,
          gravitySwirl: 600,
          gravityBallSpeed: 8.4,
          fourPlayerAiSpeed: 5.5,
          drunkFactor: 1.5,
          drunkAiSpeed: 5.2,
          drunkBallSpeed: 8.2,
          dodgeRogueSpeed: 14.5,
          dodgeRogueCount: 1,
          cubeAiSpeed: 5.4,
          cubeBallSpeed: 8.2,
          bossPlayerHp: 2,
          bossBulletSpd: 8.5,
          bossSpawnRate: 0.75,
          flashingInterval: 0.24,
          flashingBallSpeed: 8.2,
          flashingAiSpeed: 5.4,
          holePaddleSpeed: 5.2,
          holeAiSpeed: 3.4,
          holeBallSpeed: 7.2,
          holeSize: 20,
          holeReactionDist: 520,
          holeJitter: 10,
          tallPaddleSpeed: 13.5,
          tallAiSpeed: 11.5,
          tallBallSpeed: 10.5,
          mazeLives: 1,
          mazePatrolSpeed: 4.4,
          mitosisTargetScore: 1500
        };
      case 'impossible':
        return {
          diff: 'impossible',
          speed: 7.8,
          reactionDist: 780,
          jitter: 1,
          ballSpeed: 10.2,
          ballSpeedUp: 1.09,
          maxBallSpeed: 22.5,
          factor: 1.68,
          softbodyPaddleSpeed: 6.0,
          fpsOppSpeed: 6.6,
          fpsBallVz: 10.5,
          secondPersonOppSpeed: 6.4,
          secondPersonBallVz: 10.0,
          fourDOppSpeed: 5.8,
          fourDBallSpeed: 9.0,
          subwaySpeed: 390,
          subwaySpawnDist: 480,
          speedLaserAiSpeed: 640,
          pinballAiSpeed: 560,
          breakoutPaddleW: 38,
          breakoutBallSpeed: 9.4,
          breakoutLives: 1,
          racingBallSpeed: 7.0,
          dodgeballsCount: 7,
          dodgeSpeed: 8.5,
          dodgeballSpeedMult: 1.5,
          blasterCooldown: 0.6,
          orbitSpawnRate: 0.45,
          orbitBallSpeed: 6.2,
          orbitLives: 3,
          mazePatrolMult: 1.7,
          gdSpeed: 9.0,
          pacmanGhostMult: 1.65,
          giantBallSpeed: 8.0,
          giantEnemySpeed: 5.2,
          sentinelSpeed: 5.8,
          crossySpeedMult: 2.35,
          loopingAiSpeed: 7.4,
          loopingBallSpeed: 10.2,
          mathTimer: 2.5,
          pokeEnemyHp: 160,
          pokeDmgMult: 1.75,
          gravityPull: 1300,
          gravitySwirl: 850,
          gravityBallSpeed: 10.2,
          fourPlayerAiSpeed: 7.2,
          drunkFactor: 2.2,
          drunkAiSpeed: 7.5,
          drunkBallSpeed: 10.0,
          dodgeRogueSpeed: 18.0,
          dodgeRogueCount: 2,
          cubeAiSpeed: 7.8,
          cubeBallSpeed: 10.2,
          bossPlayerHp: 1,
          bossBulletSpd: 11.0,
          bossSpawnRate: 0.55,
          flashingInterval: 0.16,
          flashingBallSpeed: 10.2,
          flashingAiSpeed: 7.8,
          holePaddleSpeed: 6.0,
          holeAiSpeed: 4.4,
          holeBallSpeed: 8.5,
          holeSize: 18,
          holeReactionDist: 660,
          holeJitter: 5,
          tallPaddleSpeed: 15.5,
          tallAiSpeed: 13.5,
          tallBallSpeed: 12.5,
          mazeLives: 1,
          mazePatrolSpeed: 5.6,
          mitosisTargetScore: 2000
        };
      case 'normal':
      default:
        return {
          diff: 'normal',
          speed: 3.8,
          reactionDist: 360,
          jitter: 14,
          ballSpeed: 6.5,
          ballSpeedUp: 1.04,
          maxBallSpeed: 16.0,
          factor: 1.0,
          softbodyPaddleSpeed: 3.5,
          fpsOppSpeed: 3.35,
          fpsBallVz: 6.5,
          secondPersonOppSpeed: 3.6,
          secondPersonBallVz: 6.5,
          fourDOppSpeed: 3.2,
          fourDBallSpeed: 5.8,
          subwaySpeed: 280,
          subwaySpawnDist: 520,
          speedLaserAiSpeed: 440,
          pinballAiSpeed: 400,
          breakoutPaddleW: 70,
          breakoutBallSpeed: 6.0,
          breakoutLives: 3,
          racingBallSpeed: 4.4,
          dodgeballsCount: 5,
          dodgeSpeed: 5.2,
          dodgeballSpeedMult: 1.0,
          blasterCooldown: 1.7,
          orbitSpawnRate: 1.05,
          orbitBallSpeed: 3.6,
          orbitLives: 5,
          mazePatrolMult: 1.0,
          gdSpeed: 6.2,
          pacmanGhostMult: 1.0,
          giantBallSpeed: 5.0,
          giantEnemySpeed: 3.0,
          sentinelSpeed: 3.2,
          crossySpeedMult: 1.0,
          loopingAiSpeed: 4.8,
          loopingBallSpeed: 6.8,
          mathTimer: 6.0,
          pokeEnemyHp: 100,
          pokeDmgMult: 1.0,
          gravityPull: 620,
          gravitySwirl: 400,
          gravityBallSpeed: 6.5,
          fourPlayerAiSpeed: 4.0,
          drunkFactor: 1.0,
          drunkAiSpeed: 3.8,
          drunkBallSpeed: 6.5,
          dodgeRogueSpeed: 11.5,
          dodgeRogueCount: 1,
          cubeAiSpeed: 3.8,
          cubeBallSpeed: 6.5,
          bossPlayerHp: 3,
          bossBulletSpd: 6.5,
          bossSpawnRate: 1.0,
          flashingInterval: 0.35,
          flashingBallSpeed: 6.5,
          flashingAiSpeed: 3.8,
          holePaddleSpeed: 4.5,
          holeAiSpeed: 2.6,
          holeBallSpeed: 5.5,
          holeSize: 24,
          holeReactionDist: 400,
          holeJitter: 16,
          tallPaddleSpeed: 11.5,
          tallAiSpeed: 9.5,
          tallBallSpeed: 8.8,
          mazeLives: 2,
          mazePatrolSpeed: 3.4,
          mitosisTargetScore: 1000
        };
    }
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;

      // ESC or P toggles Pause during gameplay
      if ((k === 'escape' || k === 'p') && (this.state === 'PLAYING' || this.state === 'PAUSED')) {
        this.togglePause();
        e.preventDefault();
        return;
      }

      // Flappy hop on keydown (W, ArrowUp, Space)
      if (this.state === 'PLAYING' && this.currentLevel && this.currentLevel.mode === 'flappy') {
        if (k === 'w' || k === 'arrowup' || k === ' ') {
          this.player.vy = -6.8;
          window.Sound?.play('flap');
        }
      }

      // Blaster shooting (Space)
      if (this.state === 'PLAYING' && this.currentLevel && this.currentLevel.mode === 'blaster') {
        if (k === ' ' && (!this.modeState.shootCooldown || this.modeState.shootCooldown <= 0)) {
          this.shootPlayerBullet();
        }
      }

      // Math Pong answer selection (1, 2, 3)
      if (this.state === 'PLAYING' && this.currentLevel && this.currentLevel.mode === 'math_pong') {
        if (k === '1' || k === '2' || k === '3') {
          this.answerMathQuestion(parseInt(k, 10));
        }
      }

      // Geometry Dash jump (Space, W, ArrowUp)
      if (this.state === 'PLAYING' && this.currentLevel && this.currentLevel.mode === 'geometry_dash') {
        if ((k === ' ' || k === 'w' || k === 'arrowup') && this.modeState.player?.onGround) {
          this.modeState.player.vy = -12.8;
          this.modeState.player.onGround = false;
          window.Sound?.play('flap');
        }
      }

      // Poke-Battle keypad selection
      if (this.state === 'PLAYING' && this.currentLevel && this.currentLevel.mode === 'pokebattle') {
        this.handlePokeBattleKey(k);
      }

      // Beach Volleyball jump on keydown (W, ArrowUp, Space)
      if (this.state === 'PLAYING' && this.currentLevel && this.currentLevel.mode === 'beach_ball') {
        if ((k === 'w' || k === 'arrowup' || k === ' ') && this.player.grounded) {
          this.player.vy = -10.5;
          this.player.grounded = false;
          window.Sound?.play('flap');
        }
      }

      // Subway Surf controls (A/Left: Left lane, D/Right: Right lane, W/Up/Space: Jump, S/Down: Slide)
      if (this.state === 'PLAYING' && this.currentLevel && this.currentLevel.mode === 'subway_surf') {
        if (k === 'a' || k === 'arrowleft') {
          this.subwayShiftLane(-1);
        } else if (k === 'd' || k === 'arrowright') {
          this.subwayShiftLane(1);
        } else if (k === 'w' || k === 'arrowup' || k === ' ') {
          this.subwayJump();
        } else if (k === 's' || k === 'arrowdown') {
          this.subwaySlide();
        }
      }

      // Draw Paddle controls (C: Clear, Space/Enter: Start, R: Redraw)
      if (this.state === 'PLAYING' && this.currentLevel && this.currentLevel.mode === 'draw_paddle') {
        if (k === 'c') this.clearDrawPaddle();
        if (k === ' ' || k === 'enter') this.startDrawPaddleMatch();
        if (k === 'r') this.redrawDrawPaddle();
      }

      // Roguelike upgrade selection (1, 2, 3)
      if (this.state === 'PLAYING' && this.currentLevel && this.currentLevel.mode === 'roguelike') {
        if (this.modeState && this.modeState.state === 'UPGRADE') {
          if (k === '1' || k === '2' || k === '3') {
            this.selectRoguelikeUpgrade(parseInt(k, 10) - 1);
          }
        }
      }

    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.state === 'PLAYING' && this.currentLevel && this.currentLevel.mode === 'draw_paddle') {
        this.handleDrawPaddleMouseDown(this.mouseX, this.mouseY);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.state === 'PLAYING' && this.currentLevel && this.currentLevel.mode === 'draw_paddle') {
        this.stopDrawingPaddle();
      }
    });

    this.canvas.addEventListener('click', () => {
      if (this.state === 'PLAYING' && this.currentLevel && this.currentLevel.mode === 'draw_paddle') {
        this.handleDrawPaddleClick(this.mouseX, this.mouseY);
      }
      if (this.state === 'PLAYING' && this.currentLevel && this.currentLevel.mode === 'roguelike') {
        this.handleRoguelikeClick(this.mouseX, this.mouseY);
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseActive = true;
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.mouseX = Math.max(0, Math.min(CANVAS_WIDTH, (e.clientX - rect.left) * scaleX));
        this.mouseY = Math.max(0, Math.min(CANVAS_HEIGHT, (e.clientY - rect.top) * scaleY));
      }
      if (this.state === 'PLAYING' && this.currentLevel) {
        if (this.currentLevel.mode === 'draw_paddle' && this.modeState?.isDrawing) {
          this.addDrawPaddlePoint(this.mouseX, this.mouseY);
        }
      }
    });

    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.difficulty = btn.dataset.diff;
        window.Sound?.play('wall');
      });
    });

    try {
      localStorage.removeItem('pong_mod_style');
      document.getElementById('game-container')?.removeAttribute('data-theme');
      document.body?.removeAttribute('data-theme');
    } catch (e) {}

    // Pause Modal Buttons
    document.getElementById('btn-resume').addEventListener('click', () => {
      this.togglePause();
    });
    document.getElementById('btn-pause-menu').addEventListener('click', () => {
      this.returnToMenu();
    });

    // Result Modal Buttons
    document.getElementById('btn-next-level').addEventListener('click', () => {
      if (this.currentLevel && this.currentLevel.id < this.unlockedLevel) {
        this.startLevel(this.currentLevel.id + 1);
      } else {
        this.returnToMenu();
      }
    });
    document.getElementById('btn-retry').addEventListener('click', () => {
      if (this.currentLevel) {
        this.startLevel(this.currentLevel.id);
      }
    });
    document.getElementById('btn-result-menu').addEventListener('click', () => {
      this.returnToMenu();
    });

    // Page Navigation
    document.getElementById('btn-prev-page').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderGrid();
        window.Sound?.play('wall');
      }
    });
    document.getElementById('btn-next-page').addEventListener('click', () => {
      const maxPage = Math.ceil(window.LEVELS.length / 30);
      if (this.currentPage < maxPage) {
        this.currentPage++;
        this.renderGrid();
        window.Sound?.play('wall');
      }
    });
  }

  renderGrid() {
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';
    const banner = document.getElementById('level-name-display');

    const startIndex = (this.currentPage - 1) * 30;
    const pageLevels = window.LEVELS.slice(startIndex, startIndex + 30);

    pageLevels.forEach(lvl => {
      const cell = document.createElement('button');
      cell.className = 'level-cell';
      cell.textContent = lvl.id;

      const isUnlocked = (lvl.id <= this.unlockedLevel && lvl.mode !== 'locked');

      if (isUnlocked) {
        const completedTier = this.completedLevels[lvl.id];
        if (completedTier && completedTier >= 1) {
          const badge = document.createElement('div');
          badge.className = 'level-diff-badge';
          for (let b = 0; b < Math.min(completedTier, 4); b++) {
            const box = document.createElement('span');
            box.className = 'diff-box';
            badge.appendChild(box);
          }
          cell.appendChild(badge);
        }

        cell.addEventListener('mouseenter', () => {
          banner.textContent = `${lvl.id}. ${lvl.name}`;
        });
        cell.addEventListener('mouseleave', () => {
          banner.textContent = 'SELECT A LEVEL';
        });
        cell.addEventListener('click', () => {
          window.Sound?.play('hit');
          this.startLevel(lvl.id);
        });
      } else {
        cell.classList.add('locked');
        cell.addEventListener('mouseenter', () => {
          banner.textContent = `${lvl.id}. LOCKED`;
        });
        cell.addEventListener('mouseleave', () => {
          banner.textContent = 'SELECT A LEVEL';
        });
      }

      grid.appendChild(cell);
    });

    const maxPage = Math.ceil(window.LEVELS.length / 30);
    document.getElementById('page-indicator').textContent = `PAGE ${this.currentPage} / ${maxPage}`;
    document.getElementById('btn-prev-page').disabled = (this.currentPage === 1);
    document.getElementById('btn-next-page').disabled = (this.currentPage === maxPage);
  }

  startLevel(levelId) {
    const lvl = (typeof levelId === 'object' && levelId !== null)
      ? levelId
      : ((window.LEVELS || LEVELS || []).find(l => l.id === levelId));
    if (!lvl) return;

    this.currentLevel = lvl;
    this.state = 'PLAYING';
    this.modeState = {};
    window.Sound?.playMusic();

    // Inverted theme check
    const container = document.getElementById('game-container');
    if (lvl.mode === 'inverted') {
      container.classList.add('inverted-theme');
    } else {
      container.classList.remove('inverted-theme');
    }

    document.querySelectorAll('.overlay').forEach(el => el.classList.remove('active'));

    // Reset base paddles and score
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - 70) / 2;
    this.player.w = 12;
    this.player.h = 70;
    this.player.vy = 0;

    const aiCfg = this.getAiConfig();
    if (lvl.mode === 'mitosis') {
      this.currentLevel = { ...lvl, targetScore: aiCfg.mitosisTargetScore || 1000 };
    }
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = (CANVAS_HEIGHT - 70) / 2;
    this.enemy.w = 12;
    this.enemy.h = 70;
    this.enemy.speed = aiCfg.speed;
    this.enemy.reactionDist = aiCfg.reactionDist;
    this.enemy.jitter = aiCfg.jitter;
    this.enemy.vy = 0;

    // Reset ball
    this.resetBall(true);

    // Initialize Special Mode States
    this.initMode(lvl.mode);
  }

  resetBall(serveToPlayer = true) {
    const aiCfg = this.getAiConfig();
    const mode = this.currentLevel ? this.currentLevel.mode : 'normal';
    this.ball.x = CANVAS_WIDTH / 2;
    this.ball.y = CANVAS_HEIGHT / 2;
    this.ball.size = (mode === 'small_big' ? 38 : 10);
    this.ball.speed = (mode === 'small_big' ? aiCfg.ballSpeed * 0.95 : aiCfg.ballSpeed);

    if (mode === 'small_big') {
      this.player.h = 24;
      this.enemy.h = 24;
    }

    const angle = (Math.random() - 0.5) * 0.45;
    const dir = serveToPlayer ? -1 : 1;
    this.ball.vx = Math.cos(angle) * this.ball.speed * dir;
    this.ball.vy = Math.sin(angle) * this.ball.speed;
  }

  initMode(mode) {
    const aiCfg = this.getAiConfig();

    if (mode === 'small_big') {
      this.player.h = 24;
      this.enemy.h = 24;
      this.ball.size = 38;
      this.ball.speed = aiCfg.ballSpeed * 0.88;
      this.ball.vx = Math.sign(this.ball.vx) * this.ball.speed;
    } else if (mode === 'sphere_paddle') {
      // Paddles are square ball-sized; ball is an elongated rotating paddle
      this.player.w = 12;
      this.player.h = 12;
      this.player.y = (CANVAS_HEIGHT - 12) / 2;
      this.enemy.w = 12;
      this.enemy.h = 12;
      this.enemy.y = (CANVAS_HEIGHT - 12) / 2;
      this.ball.w = 12;
      this.ball.h = 60;
      this.ball.angle = 0;
      this.ball.angularVelocity = 0.045 * aiCfg.factor;
    } else if (mode === 'be_the_ball') {
      this.player.x = CANVAS_WIDTH / 2;
      this.player.y = CANVAS_HEIGHT / 2;
      this.player.size = 14;
      this.player.vx = 0;
      this.player.vy = 0;
      const sentSpeed = aiCfg.sentinelSpeed;
      this.modeState.leftSentinel = { x: 30, y: (CANVAS_HEIGHT - 65) / 2, w: 12, h: 65, speed: sentSpeed, patrolDir: 1 };
      this.modeState.rightSentinel = { x: CANVAS_WIDTH - 42, y: (CANVAS_HEIGHT - 65) / 2, w: 12, h: 65, speed: sentSpeed, patrolDir: -1 };
    } else if (mode === 'crossy') {
      const mult = aiCfg.crossySpeedMult;
      const isImpos = (this.difficulty === 'impossible');
      this.modeState.ball = { x: CANVAS_WIDTH / 2, y: 490, size: 14 };
      this.modeState.score = 0;
      this.modeState.lanes = [
        { y: 410, speed: 3.2 * mult, paddles: isImpos ? [{ x: 50 }, { x: 280 }, { x: 510 }, { x: 740 }] : [{ x: 100 }, { x: 420 }, { x: 740 }], w: isImpos ? 60 : 45, h: 14 },
        { y: 330, speed: -4.5 * mult, paddles: isImpos ? [{ x: 80 }, { x: 320 }, { x: 560 }, { x: 800 }] : [{ x: 200 }, { x: 600 }], w: isImpos ? 68 : 55, h: 14 },
        { y: 250, speed: 3.8 * mult, paddles: isImpos ? [{ x: 40 }, { x: 260 }, { x: 480 }, { x: 700 }] : [{ x: 50 }, { x: 350 }, { x: 650 }], w: isImpos ? 60 : 45, h: 14 },
        { y: 170, speed: -4.0 * mult, paddles: isImpos ? [{ x: 100 }, { x: 340 }, { x: 580 }, { x: 820 }] : [{ x: 150 }, { x: 500 }, { x: 820 }], w: isImpos ? 65 : 50, h: 14 },
        { y: 90, speed: 5.2 * mult, paddles: isImpos ? [{ x: 120 }, { x: 420 }, { x: 720 }] : [{ x: 300 }, { x: 700 }], w: isImpos ? 75 : 60, h: 14 }
      ];
    } else if (mode === 'pokebattle') {
      this.modeState.pb = {
        turn: 'player',
        playerHp: 100,
        enemyHp: aiCfg.pokeEnemyHp,
        enemyMaxHp: aiCfg.pokeEnemyHp,
        dmgMult: aiCfg.pokeDmgMult,
        playerDefend: false,
        message: 'What will PADDLE do?',
        sub: 'Choose an attack [1 - 4]',
        selectedMove: 0,
        moves: [
          { name: 'POWER SMASH', dmg: 35 },
          { name: 'ENGLISH CURVE', dmg: 22 },
          { name: 'DEFENSIVE BLOCK', dmg: 0 },
          { name: 'HYPER RALLY', dmg: 32 }
        ],
        playerX: 0,
        playerY: 0,
        enemyX: 0,
        enemyY: 0,
        timer: 0
      };
    } else if (mode === 'soccer') {
      this.player.x = 220;
      this.player.y = CANVAS_HEIGHT / 2 - 25;
      this.player.w = 14;
      this.player.h = 50;
      this.player.angle = 0;
      this.enemy.x = 740;
      this.enemy.y = CANVAS_HEIGHT / 2 - 25;
      this.enemy.w = 14;
      this.enemy.h = 50;
      this.enemy.angle = Math.PI;
      this.enemy.speed = aiCfg.speed * 1.15; // Changes with difficulty!
      this.ball.x = CANVAS_WIDTH / 2;
      this.ball.y = CANVAS_HEIGHT / 2;
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.ball.size = 16;
      this.modeState = {
        goalTimer: 0,
        kickoffTimer: 0.5,
        scored: false,
        goalScorer: null
      };
    } else if (mode === 'three_fps') {
      this.modeState.lastRenderTime = 0;
      this.modeState.hasDrawnOnce = false;
    } else if (mode === 'breakout') {
      this.modeState.lives = aiCfg.breakoutLives;
      this.player.w = aiCfg.breakoutPaddleW;
      this.player.h = 12;
      this.player.x = (CANVAS_WIDTH - this.player.w) / 2;
      this.player.y = CANVAS_HEIGHT - 48;
      this.ball.x = CANVAS_WIDTH / 2;
      this.ball.y = CANVAS_HEIGHT - 80;
      this.ball.size = 10;
      this.ball.vx = 4.5 * (Math.random() < 0.5 ? 1 : -1);
      this.ball.vy = -aiCfg.breakoutBallSpeed;
      this.modeState.bricks = [];
      const cols = 10;
      const rows = 4;
      const brickW = 76;
      const brickH = 18;
      const startX = 66;
      const startY = 70;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          this.modeState.bricks.push({
            x: startX + c * (brickW + 8),
            y: startY + r * (brickH + 8),
            w: brickW,
            h: brickH,
            alive: true
          });
        }
      }
    } else if (mode === 'racing') {
      this.modeState.laps = 0;
      this.modeState.targetLaps = 3;
      this.modeState.checkpointPassed = false;
      this.modeState.player = {
        x: 480,
        y: 450,
        angle: 0,
        speed: 0,
        w: 14,
        h: 46
      };
      this.modeState.waypoints = [
        { x: 825, y: 430 },
        { x: 825, y: 110 },
        { x: 135, y: 110 },
        { x: 135, y: 430 },
        { x: 480, y: 430 }
      ];
      this.modeState.ballRacer = {
        x: 520,
        y: 430,
        angle: 0,
        speed: aiCfg.racingBallSpeed,
        waypointIndex: 0,
        laps: 0
      };
    } else if (mode === 'shatter') {
      this.player.h = 170;
      this.enemy.h = 170;
    } else if (mode === 'dodgeball') {
      this.modeState.playerLives = 3;
      this.modeState.enemyLives = 3;
      this.modeState.playerHitCooldown = 0;
      this.modeState.enemyHitCooldown = 0;
      this.modeState.dodgeSpeed = aiCfg.dodgeSpeed;
      const spdMult = aiCfg.dodgeballSpeedMult;
      const baseBalls = [
        { x: 260, y: 140, vx: 5.2 * spdMult, vy: 4.0 * spdMult, r: 12 },
        { x: 480, y: 320, vx: -4.8 * spdMult, vy: 5.4 * spdMult, r: 12 },
        { x: 700, y: 180, vx: 5.0 * spdMult, vy: -4.5 * spdMult, r: 12 },
        { x: 380, y: 420, vx: -5.4 * spdMult, vy: -3.8 * spdMult, r: 12 },
        { x: 580, y: 240, vx: 4.6 * spdMult, vy: 4.8 * spdMult, r: 12 },
        { x: 320, y: 260, vx: 5.8 * spdMult, vy: -3.2 * spdMult, r: 12 },
        { x: 620, y: 360, vx: -5.6 * spdMult, vy: 4.2 * spdMult, r: 12 }
      ];
      this.modeState.dodgeballs = baseBalls.slice(0, aiCfg.dodgeballsCount);
      this.enemy.h = 70;
      this.enemy.x = CANVAS_WIDTH - 42;
      this.enemy.y = (CANVAS_HEIGHT - 70) / 2;
    } else if (mode === 'mitosis') {
      this.player.h = 135;
      this.enemy.h = 135;
      this.modeState.balls = [
        { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: -aiCfg.ballSpeed, vy: 1.5, size: 10, speed: aiCfg.ballSpeed }
      ];
    } else if (mode === 'blaster') {
      this.modeState.bullets = [];
      this.modeState.shootCooldown = 0;
      this.modeState.enemyShootTimer = aiCfg.blasterCooldown;
      this.modeState.enemyBaseCooldown = aiCfg.blasterCooldown;
      this.player.stunTimer = 0;
      this.enemy.stunTimer = 0;
    } else if (mode === 'two_balls') {
      this.modeState.balls = [
        { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 - 60, vx: -aiCfg.ballSpeed, vy: 2.5, size: 10, speed: aiCfg.ballSpeed },
        { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 + 60, vx: aiCfg.ballSpeed, vy: -2.5, size: 10, speed: aiCfg.ballSpeed }
      ];
    } else if (mode === 'three_balls') {
      this.modeState.balls = [
        { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 - 90, vx: -aiCfg.ballSpeed, vy: 2.2, size: 10, speed: aiCfg.ballSpeed },
        { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: aiCfg.ballSpeed * 1.05, vy: -1.0, size: 10, speed: aiCfg.ballSpeed },
        { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 + 90, vx: -aiCfg.ballSpeed * 0.95, vy: -2.8, size: 10, speed: aiCfg.ballSpeed }
      ];
    } else if (mode === 'zoomed_cam') {
      this.modeState.zoom = 2.2;
    } else if (mode === 'math_pong') {
      this.modeState.questionActive = false;
      this.modeState.mathSolved = 0;
      this.modeState.mathTimer = aiCfg.mathTimer;
      this.modeState.curQuestion = null;
      // Make bot slightly easier for Math Pong
      this.enemy.speed *= 0.72;
      this.enemy.jitter = Math.max(this.enemy.jitter, 26);
      this.enemy.reactionDist *= 0.80;
    } else if (mode === 'circle_pong') {
      this.modeState.radius = 210;
      this.modeState.playerAngle = Math.PI; // 180 deg (left)
      this.modeState.enemyAngle = 0; // 0 deg (right)
      this.modeState.arcLen = 0.52; // smaller, agile paddle (was 0.85)
      this.modeState.lastHitter = null;
      this.ball.x = CANVAS_WIDTH / 2;
      this.ball.y = CANVAS_HEIGHT / 2;
      this.ball.vx = -aiCfg.ballSpeed * 0.85;
      this.ball.vy = (Math.random() - 0.5) * 3.0;
    } else if (mode === 'flashlight') {
      this.modeState.lightRadius = 115;
    } else if (mode === 'spinning') {
      this.modeState.arenaAngle = 0;
      this.modeState.paddleAngle = 0;
      this.modeState.ballAngle = 0;
    } else if (mode === 'looping') {
      this.player.w = 12;
      this.player.h = 60;
      this.player.x = 24;
      this.player.y = (CANVAS_HEIGHT - 60) / 2;
      this.player.speed = 6.5;

      this.enemy.w = 12;
      this.enemy.h = 60;
      this.enemy.x = CANVAS_WIDTH - 36;
      this.enemy.y = (CANVAS_HEIGHT - 60) / 2;
      this.enemy.speed = aiCfg.loopingAiSpeed;

      this.resetLoopingBall(true);
    } else if (mode === 'maze') {
      this.modeState = this.generateDfsMaze(this.difficulty);
    } else if (mode === 'geometry_dash') {
      this.modeState.player = { x: 140, y: 426, size: 16, vy: 0, onGround: true };
      this.modeState.distance = 0;
      this.modeState.targetLength = 6800; // 2x as long
      this.modeState.attempts = 1;
      this.modeState.obstacles = [
        { dist: 400, type: 'spike', w: 14, h: 44, y: 398 },
        { dist: 700, type: 'spike', w: 14, h: 44, y: 398 },
        { dist: 950, type: 'block', w: 40, h: 14, y: 428 },
        { dist: 1200, type: 'tall', w: 14, h: 56, y: 386 },
        { dist: 1450, type: 'double', w: 14, h: 44, y: 398 },
        { dist: 1510, type: 'double', w: 14, h: 44, y: 398 },
        { dist: 1800, type: 'hanging', w: 50, h: 14, y: 360 },
        { dist: 2100, type: 'tall', w: 14, h: 56, y: 386 },
        { dist: 2350, type: 'block', w: 44, h: 14, y: 428 },
        { dist: 2600, type: 'double', w: 14, h: 44, y: 398 },
        { dist: 2660, type: 'double', w: 14, h: 44, y: 398 },
        { dist: 2950, type: 'tall', w: 14, h: 56, y: 386 },
        { dist: 3150, type: 'spike', w: 14, h: 44, y: 398 },
        { dist: 3500, type: 'spike', w: 14, h: 44, y: 398 },
        { dist: 3800, type: 'block', w: 44, h: 14, y: 428 },
        { dist: 4050, type: 'double', w: 14, h: 44, y: 398 },
        { dist: 4110, type: 'double', w: 14, h: 44, y: 398 },
        { dist: 4400, type: 'tall', w: 14, h: 56, y: 386 },
        { dist: 4700, type: 'hanging', w: 50, h: 14, y: 360 },
        { dist: 5000, type: 'spike', w: 14, h: 44, y: 398 },
        { dist: 5300, type: 'block', w: 44, h: 14, y: 428 },
        { dist: 5550, type: 'double', w: 14, h: 44, y: 398 },
        { dist: 5610, type: 'double', w: 14, h: 44, y: 398 },
        { dist: 5900, type: 'tall', w: 14, h: 56, y: 386 },
        { dist: 6200, type: 'hanging', w: 50, h: 14, y: 360 },
        { dist: 6450, type: 'double', w: 14, h: 44, y: 398 },
        { dist: 6510, type: 'double', w: 14, h: 44, y: 398 },
        { dist: 6650, type: 'spike', w: 14, h: 44, y: 398 }
      ];
    } else if (mode === 'pacman') {
      this.modeState.player = { x: 480, y: 360, r: 7, speed: 3.6, dirX: 0, dirY: 0 };
      this.modeState.score = 0;
      this.modeState.lives = 3;
      this.modeState.powerTimer = 0;
      this.modeState.modeTimer = 0;
      this.modeState.ghostMode = 'chase';

      // Authentic Pac-Man maze walls
      this.modeState.walls = [
        // Outer boundaries (with warp tunnels gap at y=235..285)
        { x: 60, y: 35, w: 840, h: 6 },
        { x: 60, y: 499, w: 840, h: 6 },
        { x: 60, y: 35, w: 6, h: 200 },
        { x: 60, y: 285, w: 6, h: 220 },
        { x: 894, y: 35, w: 6, h: 200 },
        { x: 894, y: 285, w: 6, h: 220 },
        // Classic T-shapes and blocks
        { x: 120, y: 80, w: 100, h: 46 },
        { x: 740, y: 80, w: 100, h: 46 },
        { x: 270, y: 80, w: 120, h: 46 },
        { x: 570, y: 80, w: 120, h: 46 },
        { x: 460, y: 70, w: 40, h: 56 },
        // Middle shelves framing warp tunnels
        { x: 60, y: 175, w: 160, h: 28 },
        { x: 740, y: 175, w: 160, h: 28 },
        { x: 60, y: 315, w: 160, h: 28 },
        { x: 740, y: 315, w: 160, h: 28 },
        // Middle vertical dividers
        { x: 270, y: 175, w: 30, h: 168 },
        { x: 660, y: 175, w: 30, h: 168 },
        // Ghost House (Center)
        { x: 430, y: 220, w: 6, h: 56 },
        { x: 524, y: 220, w: 6, h: 56 },
        { x: 430, y: 270, w: 100, h: 6 },
        { x: 430, y: 220, w: 35, h: 6 },
        { x: 495, y: 220, w: 35, h: 6 },
        // Center horizontal bar below ghost house
        { x: 370, y: 315, w: 220, h: 28 },
        // Bottom blocks
        { x: 120, y: 395, w: 100, h: 46 },
        { x: 740, y: 395, w: 100, h: 46 },
        { x: 270, y: 395, w: 180, h: 28 },
        { x: 510, y: 395, w: 180, h: 28 }
      ];

      // Pellets placed along corridors
      this.modeState.pellets = [];
      const pelletLanesY = [58, 150, 260, 365, 465];
      const pelletLanesX = [90, 245, 410, 480, 550, 715, 870];

      pelletLanesY.forEach(y => {
        for (let x = 90; x <= 870; x += 36) {
          let insideWall = false;
          for (const w of this.modeState.walls) {
            if (x >= w.x - 4 && x <= w.x + w.w + 4 && y >= w.y - 4 && y <= w.y + w.h + 4) {
              insideWall = true;
              break;
            }
          }
          if (!insideWall && !(x >= 430 && x <= 530 && y >= 210 && y <= 285)) {
            this.modeState.pellets.push({ x, y, eaten: false });
          }
        }
      });

      pelletLanesX.forEach(x => {
        for (let y = 60; y <= 470; y += 36) {
          let insideWall = false;
          for (const w of this.modeState.walls) {
            if (x >= w.x - 4 && x <= w.x + w.w + 4 && y >= w.y - 4 && y <= w.y + w.h + 4) {
              insideWall = true;
              break;
            }
          }
          if (!insideWall && !(x >= 430 && x <= 530 && y >= 210 && y <= 285)) {
            if (!this.modeState.pellets.some(p => Math.hypot(p.x - x, p.y - y) < 18)) {
              this.modeState.pellets.push({ x, y, eaten: false });
            }
          }
        }
      });

      this.modeState.totalPellets = this.modeState.pellets.length;

      // 4 Classic Corner Power Pellets (Pulsing White Spheres)
      this.modeState.powerPellets = [
        { x: 90, y: 58, eaten: false },
        { x: 870, y: 58, eaten: false },
        { x: 90, y: 465, eaten: false },
        { x: 870, y: 465, eaten: false }
      ];

      // 4 Ghost Paddles with Authentic Pac-Man AI (NO FACES, NO COLORS!)
      const gMult = aiCfg.pacmanGhostMult;
      this.modeState.ghosts = [
        { name: 'Blinky', x: 480, y: 180, w: 10, h: 24, speed: 2.8 * gMult, vx: 2.8 * gMult, vy: 0, homeX: 870, homeY: 58, exited: true, exitDelay: 0 },
        { name: 'Pinky', x: 450, y: 250, w: 10, h: 24, speed: 2.6 * gMult, vx: 0, vy: 0, homeX: 90, homeY: 58, exited: false, exitDelay: 0.5 },
        { name: 'Inky', x: 480, y: 250, w: 10, h: 24, speed: 2.6 * gMult, vx: 0, vy: 0, homeX: 870, homeY: 465, exited: false, exitDelay: 2.0 },
        { name: 'Clyde', x: 510, y: 250, w: 10, h: 24, speed: 2.4 * gMult, vx: 0, vy: 0, homeX: 90, homeY: 465, exited: false, exitDelay: 4.0 }
      ];
    } else if (mode === 'blurry') {
      // Standard pong match with heavy blur
    } else if (mode === 'giant_arena') {
      this.modeState.arenaTop = 34;
      this.modeState.arenaBottom = CANVAS_HEIGHT - 34; // 506

      this.player.w = 5;
      this.player.h = 24;
      this.player.x = 10;
      this.player.y = (CANVAS_HEIGHT - 24) / 2;
      this.player.speed = 5.0;

      this.enemy.w = 5;
      this.enemy.h = 24;
      this.enemy.x = CANVAS_WIDTH - 15;
      this.enemy.y = (CANVAS_HEIGHT - 24) / 2;
      this.enemy.speed = aiCfg.giantEnemySpeed;
      this.enemy.reactionDist = aiCfg.reactionDist * 1.4;
      this.enemy.jitter = aiCfg.jitter;

      this.ball.x = CANVAS_WIDTH / 2;
      this.ball.y = CANVAS_HEIGHT / 2;
      this.ball.size = 5;
      this.ball.speed = aiCfg.giantBallSpeed;
      this.ball.vx = (Math.random() < 0.5 ? -1 : 1) * this.ball.speed;
      this.ball.vy = (Math.random() - 0.5) * (this.ball.speed * 0.45);
    } else if (mode === 'orbit_defense') {
      this.player.score = 0;
      this.enemy.score = 0;
      this.modeState = {
        centerX: CANVAS_WIDTH / 2,
        centerY: CANVAS_HEIGHT / 2,
        coreRadius: 22,
        orbitRadius: 82,
        paddleSpan: 0.65,
        paddleThickness: 12,
        paddleAngle: 0,
        lives: aiCfg.orbitLives,
        deflected: 0,
        spawnTimer: 0,
        spawnInterval: aiCfg.orbitSpawnRate,
        baseBallSpeed: aiCfg.orbitBallSpeed,
        balls: [],
        shake: 0
      };
    } else if (mode === 'top_down_3d') {
      this.player.score = 0;
      this.enemy.score = 0;
      this.modeState = {
        courtW: 340,
        courtH: 135,
        wallH: 22,
        playerX: -290,
        playerY: 0,
        playerW: 16,
        playerH: 64,
        playerH3D: 18,
        enemyX: 290,
        enemyY: 0,
        enemyW: 16,
        enemyH: 64,
        enemyH3D: 18,
        enemySpeed: aiCfg.speed * 0.9,
        ball: {
          x: 0,
          y: 0,
          z: 0,
          vx: (Math.random() < 0.5 ? -1 : 1) * (aiCfg.ballSpeed * 0.88),
          vy: (Math.random() - 0.5) * 2.8,
          vz: 5.2,
          radius: 8
        }
      };
    } else if (mode === 'softbody') {
      const sharedPaddleSpeed = aiCfg.softbodyPaddleSpeed;
      this.player.w = 16;
      this.player.h = 80;
      this.player.x = 50;
      this.player.y = (CANVAS_HEIGHT - 80) / 2;
      this.player.speed = sharedPaddleSpeed; // MATCHES ENEMY SPEED EXACTLY!

      this.enemy.w = 16;
      this.enemy.h = 80;
      this.enemy.x = CANVAS_WIDTH - 66;
      this.enemy.y = (CANVAS_HEIGHT - 80) / 2;
      this.enemy.speed = sharedPaddleSpeed; // EXACT SAME SPEED AS PLAYER!
      this.enemy.reactionDist = aiCfg.reactionDist;
      this.enemy.jitter = aiCfg.jitter;

      this.ball.x = CANVAS_WIDTH / 2;
      this.ball.y = CANVAS_HEIGHT / 2;
      this.ball.vx = (Math.random() < 0.5 ? -1 : 1) * (aiCfg.ballSpeed * 0.72);
      this.ball.vy = (Math.random() - 0.5) * 2.2;
      this.ball.size = 16;
      const verts = [];
      for (let i = 0; i < 16; i++) {
        verts.push({ r: 16, targetR: 16, vr: 0 });
      }
      const playerNodes = [];
      const enemyNodes = [];
      for (let i = 0; i < 9; i++) {
        playerNodes.push({ offset: 0, v: 0 });
        enemyNodes.push({ offset: 0, v: 0 });
      }
      this.modeState = {
        verts,
        numVerts: 16,
        playerNodes,
        enemyNodes,
        numNodes: 9,
        time: 0
      };
    } else if (mode === 'first_person_3d') {
      this.player.score = 0;
      this.enemy.score = 0;
      this.modeState = {
        courtW: 420,
        courtH: 210,
        oppZ: 640,
        playerZ: 40,
        playerX: 0,
        playerY: 0,
        playerW: 136, // Enhanced width for fair, responsive reach
        playerH: 88,  // Enhanced height for fair reach
        oppX: 0,
        oppY: 0,
        oppW: 80,
        oppH: 52,
        oppSpeed: aiCfg.fpsOppSpeed,
        ball: {
          x: 0,
          y: 0,
          z: 340,
          vx: (Math.random() - 0.5) * 2.8,
          vy: (Math.random() - 0.5) * 1.8,
          vz: (Math.random() < 0.5 ? -1 : 1) * aiCfg.fpsBallVz,
          radius: 14
        },
        paddleFlash: 0,
        shake: 0,
        time: 0
      };
    } else if (mode === 'gravity_well') {
      this.modeState = {
        wellX: CANVAS_WIDTH / 2,
        wellY: CANVAS_HEIGHT / 2,
        wellRadius: 24,
        pullStrength: aiCfg.gravityPull || 620,
        swirlStrength: aiCfg.gravitySwirl || 400
      };
      this.ball.speed = aiCfg.gravityBallSpeed;
      this.resetBall(true);
    } else if (mode === 'four_player') {
      // 4-Player Square Arena (420x420 centered)
      const left = 270, right = 690, top = 60, bottom = 480;
      this.modeState = {
        left, right, top, bottom,
        paddles: {
          bottom: { id: 'bottom', name: 'YOU (P1)', isPlayer: true, x: 445, y: bottom - 12, w: 70, h: 12, alive: true, speed: 6.5 },
          top: { id: 'top', name: 'AI (TOP)', isPlayer: false, x: 445, y: top, w: 70, h: 12, alive: true, speed: aiCfg.fourPlayerAiSpeed },
          left: { id: 'left', name: 'AI (LEFT)', isPlayer: false, x: left, y: 235, w: 12, h: 70, alive: true, speed: aiCfg.fourPlayerAiSpeed },
          right: { id: 'right', name: 'AI (RIGHT)', isPlayer: false, x: right - 12, y: 235, w: 12, h: 70, alive: true, speed: aiCfg.fourPlayerAiSpeed }
        },
        eliminatedCount: 0,
        lastHitter: null,
        ball: {
          x: 480,
          y: 270,
          vx: (Math.random() < 0.5 ? -1 : 1) * 4.8,
          vy: (Math.random() < 0.5 ? -1 : 1) * 3.8,
          size: 10
        }
      };
    } else if (mode === 'drunk_pong') {
      this.modeState = {
        wobbleTime: 0,
        drunkFactor: aiCfg.drunkFactor || 1.0,
        swayX: 0,
        swayY: 0
      };
      this.enemy.speed = aiCfg.drunkAiSpeed;
      this.ball.speed = aiCfg.drunkBallSpeed;
      this.resetBall(true);
    } else if (mode === 'paddle_dodge') {
      this.modeState = {
        player: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, r: 9, speed: 8.5 },
        rogues: [],
        timeLeft: 15.0,
        targetTime: 15.0,
        attempts: 1,
        shake: 0,
        secondPaddleSpawned: false,
        thirdPaddleSpawned: false
      };
      const rSpeed = aiCfg.dodgeRogueSpeed || 11.5;
      this.modeState.rogues.push({
        x: 180,
        y: 120,
        vx: rSpeed * 0.8,
        vy: rSpeed * 0.6,
        w: 16,
        h: 76,
        angle: 0,
        angVel: 0.11,
        trail: []
      });
    } else if (mode === 'cube_paddle') {
      this.player.score = 0;
      this.enemy.score = 0;
      this.enemy.speed = aiCfg.cubeAiSpeed;
      this.ball.speed = aiCfg.cubeBallSpeed;
      this.modeState = {
        playerCubes: [], // { rx, ry, w: 12, h: 12 }
        enemyCubes: [],  // { rx, ry, w: 12, h: 12 }
        lastHitCooldown: 0
      };
      this.resetBall(true);
    } else if (mode === 'megalovania') {
      const bW = 320, bH = 220;
      const bx = (CANVAS_WIDTH - bW) / 2; // 320
      const by = 250;
      this.modeState = {
        box: { x: bx, y: by, w: bW, h: bH },
        player: {
          x: bx + bW / 2,
          y: by + bH / 2,
          r: 7,
          speed: 4.8,
          hp: aiCfg.bossPlayerHp,
          maxHp: aiCfg.bossPlayerHp,
          invuln: 0
        },
        boss: {
          x: CANVAS_WIDTH / 2,
          y: 120,
          w: 130,
          h: 24,
          glowEye: 0,
          dialogue: "YOU'RE GONNA HAVE A PADDLE TIME.",
          diagTimer: 0
        },
        bullets: [],
        spawnTimer: 0,
        wavePattern: 0,
        patternTimer: 0,
        surviveTime: 0,
        targetSurviveTime: 25.0,
        bulletSpeed: aiCfg.bossBulletSpd,
        spawnInterval: aiCfg.bossSpawnRate,
        shake: 0
      };
    } else if (mode === 'flashing_bars') {
      this.modeState = {
        timer: 0,
        interval: aiCfg.flashingInterval || 0.35,
        activePhase: 0,
        barHeight: 80
      };
      this.enemy.speed = aiCfg.flashingAiSpeed;
      this.ball.speed = aiCfg.flashingBallSpeed;
      this.resetBall(true);
    } else if (mode === 'try_to_lose') {
      this.initTryToLose(aiCfg);
    } else if (mode === 'tall_court') {
      const courtW = 260;
      const courtLeft = (CANVAS_WIDTH - courtW) / 2;
      const courtRight = courtLeft + courtW;
      const courtTop = 24;
      const courtBot = CANVAS_HEIGHT - 24;

      this.modeState = {
        courtW,
        courtLeft,
        courtRight,
        courtTop,
        courtBot
      };

      this.player.w = 12;
      this.player.h = 56;
      this.player.x = courtLeft + 14;
      this.player.y = (CANVAS_HEIGHT - 56) / 2;
      this.player.speed = aiCfg.tallPaddleSpeed || 11.5;

      this.enemy.w = 12;
      this.enemy.h = 56;
      this.enemy.x = courtRight - 26;
      this.enemy.y = (CANVAS_HEIGHT - 56) / 2;
      this.enemy.speed = aiCfg.tallAiSpeed || 9.5;
      this.enemy.reactionDist = 240;
      this.enemy.jitter = 8;

      this.ball.x = CANVAS_WIDTH / 2;
      this.ball.y = CANVAS_HEIGHT / 2;
      this.ball.size = 10;
      this.ball.speed = aiCfg.tallBallSpeed || 8.8;
      this.ball.vx = (Math.random() < 0.5 ? -1 : 1) * this.ball.speed;
      this.ball.vy = (Math.random() - 0.5) * (this.ball.speed * 0.8);
    } else if (mode === 'beach_ball') {
      const sandY = 470;
      const netX = CANVAS_WIDTH / 2;
      const netTopY = 320;
      this.player.w = 14;
      this.player.h = 54;
      this.enemy.w = 14;
      this.enemy.h = 54;

      // Grounded on sand floor
      this.player.x = 180;
      this.player.y = sandY - this.player.h;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.grounded = true;

      this.enemy.x = 760;
      this.enemy.y = sandY - this.enemy.h;
      this.enemy.vx = 0;
      this.enemy.vy = 0;
      this.enemy.grounded = true;

      this.ball.size = 18;
      // Serve tossed up on player side towards net
      this.ball.x = 220;
      this.ball.y = 250;
      this.ball.vx = 3.8;
      this.ball.vy = -6.8;
      this.ball.spin = 2.5;
      this.ball.angle = 0;
      this.ball.squash = 1.0;

      this.modeState = {
        sandY: sandY,
        netX: netX,
        netTopY: netTopY,
        netW: 8,
        server: 'player',
        trail: [],
        callout: 'SERVE!',
        calloutTimer: 0.8,
        shake: 0,
        serveTimer: 0
      };
    } else if (mode === 'draw_paddle') {
      const defaultPoints = [
        { dx: 0, dy: -35 },
        { dx: 0, dy: 35 }
      ];
      this.mouseActive = true;
      this.modeState = {
        phase: 'DRAWING', // 'DRAWING' or 'PLAYING'
        drawingBox: { x: (CANVAS_WIDTH - 360) / 2, y: 130, w: 360, h: 280 },
        drawingPoints: [],
        isDrawing: false,
        maxLength: 220,
        currentLength: 0,
        thickness: 10,
        customPoints: defaultPoints,
        customBounds: { minX: 0, maxX: 0, minY: -35, maxY: 35, width: 0, height: 70 },
        shake: 0
      };
      this.player.score = 0;
      this.enemy.score = 0;
      this.ball.x = CANVAS_WIDTH / 2;
      this.ball.y = CANVAS_HEIGHT / 2;
    } else if (mode === 'four_d') {
      this.initFourD(aiCfg);
    } else if (mode === 'subway_surf') {
      this.initSubwaySurf(aiCfg);
    } else if (mode === 'speed_laser') {
      this.initSpeedLaser(aiCfg);
    } else if (mode === 'pinball') {
      this.initPinball(aiCfg);
    } else if (mode === 'shrinking_ball') {
      this.initShrinkingBall(aiCfg);
    } else if (mode === 'second_person') {
      this.initSecondPerson(aiCfg);
    } else if (mode === 'roguelike') {
      this.initRoguelike(aiCfg);
    } else if (mode === 'superhot') {
      this.initSuperhot(aiCfg);
    } else if (mode === 'portal') {
      this.initPortal(aiCfg);
    } else if (mode === 'tetris') {
      this.initTetris(aiCfg);
    } else if (mode === 'singularity') {
      this.initSingularity(aiCfg);
    } else if (mode === 'excavator') {
      this.initExcavator(aiCfg);
    } else if (mode === 'invaders') {
      this.initInvaders(aiCfg);
    } else if (mode === 'airhockey') {
      this.initAirHockey(aiCfg);
    } else if (mode === 'lightcycle') {
      this.initLightCycle(aiCfg);
    } else if (mode === 'gravity_flip') {
      this.initGravityFlip(aiCfg);
    } else if (mode === 'polarity') {
      this.initPolarity(aiCfg);
    } else if (mode === 'snake_pong') {
      this.initSnakePong(aiCfg);
    } else if (mode === 'prism' || mode === 'chrono') {
      this.initChrono(aiCfg);
    } else if (mode === 'asteroids_pong') {
      this.initAsteroidsPong(aiCfg);
    } else if (mode === 'tractor_beam' || mode === 'time_bomb') {
      this.initTimeBomb(aiCfg);
    } else if (mode === 'bullet_hell') {
      this.initBulletHell(aiCfg);
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      document.getElementById('pause-overlay').classList.add('active');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      document.getElementById('pause-overlay').classList.remove('active');
    }
  }

  returnToMenu() {
    this.state = 'MENU';
    document.getElementById('game-container').classList.remove('inverted-theme');
    document.querySelectorAll('.overlay').forEach(el => el.classList.remove('active'));
    document.getElementById('menu-overlay').classList.add('active');
    this.renderGrid();
  }

  showResult(won, message = '') {
    this.state = 'RESULT';
    if (won && this.currentLevel) {
      const diffMap = { easy: 1, normal: 2, hard: 3, impossible: 4 };
      const currentTier = diffMap[this.difficulty] || 2;
      const prevTier = this.completedLevels[this.currentLevel.id] || 0;
      if (currentTier > prevTier) {
        this.completedLevels[this.currentLevel.id] = currentTier;
        try {
          localStorage.setItem('pong_completed_levels', JSON.stringify(this.completedLevels));
        } catch (e) {}
      }
      this.renderGrid();
    }
    document.getElementById('result-title').textContent = won ? 'VICTORY' : 'GAME OVER';
    document.getElementById('result-sub').textContent = message || (won ? 'STAGE CLEARED!' : 'DEFEAT');
    document.getElementById('btn-next-level').style.display = won ? 'block' : 'none';
    document.getElementById('result-overlay').classList.add('active');
    window.Sound?.play(won ? 'win' : 'lose');
  }

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    if (this.state === 'PLAYING') {
      this.update(dt);
    }
    this.render();

    requestAnimationFrame(this.loop);
  }

  // ========================================================
  // UPDATE LOGIC
  // ========================================================
  update(dt) {
    if (this.state !== 'PLAYING' || !this.currentLevel) return;
    const mode = this.currentLevel.mode;

    if (mode === 'be_the_ball') {
      this.updateBeTheBall(dt);
    } else if (mode === 'crossy') {
      this.updateCrossy(dt);
    } else if (mode === 'pokebattle') {
      this.updatePokeBattle(dt);
    } else if (mode === 'soccer') {
      this.updateSoccer(dt);
    } else if (mode === 'breakout') {
      this.updateBreakout(dt);
    } else if (mode === 'racing') {
      this.updateRacing(dt);
    } else if (mode === 'dodgeball') {
      this.updateDodgeball(dt);
    } else if (mode === 'mitosis' || mode === 'two_balls' || mode === 'three_balls') {
      this.updateMultiBall(dt, mode === 'mitosis');
    } else if (mode === 'blaster') {
      this.updateBlaster(dt);
    } else if (mode === 'circle_pong') {
      this.updateCirclePong(dt);
    } else if (mode === 'spinning') {
      this.updateSpinning(dt);
    } else if (mode === 'looping') {
      this.updateLooping(dt);
    } else if (mode === 'maze') {
      this.updateMaze(dt);
    } else if (mode === 'geometry_dash') {
      this.updateGeometryDash(dt);
    } else if (mode === 'pacman') {
      this.updatePacman(dt);
    } else if (mode === 'giant_arena') {
      this.updateGiantArena(dt);
    } else if (mode === 'orbit_defense') {
      this.updateOrbitDefense(dt);
    } else if (mode === 'top_down_3d') {
      this.updateTopDown3D(dt);
    } else if (mode === 'softbody') {
      this.updateSoftbody(dt);
    } else if (mode === 'first_person_3d') {
      this.updateFirstPerson3D(dt);
    } else if (mode === 'gravity_well') {
      this.updateGravityWell(dt);
    } else if (mode === 'four_player') {
      this.updateFourPlayer(dt);
    } else if (mode === 'drunk_pong') {
      this.updateDrunkPong(dt);
    } else if (mode === 'paddle_dodge') {
      this.updatePaddleDodge(dt);
    } else if (mode === 'cube_paddle') {
      this.updateCubePaddle(dt);
    } else if (mode === 'megalovania') {
      this.updateMegalovania(dt);
    } else if (mode === 'flashing_bars') {
      this.updateFlashingBars(dt);
    } else if (mode === 'try_to_lose') {
      this.updateTryToLose(dt);
    } else if (mode === 'tall_court') {
      this.updateTallCourt(dt);
    } else if (mode === 'beach_ball') {
      this.updateBeachBall(dt);
    } else if (mode === 'draw_paddle') {
      this.updateDrawPaddle(dt);
    } else if (mode === 'four_d') {
      this.updateFourD(dt);
    } else if (mode === 'subway_surf') {
      this.updateSubwaySurf(dt);
    } else if (mode === 'speed_laser') {
      this.updateSpeedLaser(dt);
    } else if (mode === 'pinball') {
      this.updatePinball(dt);
    } else if (mode === 'shrinking_ball') {
      this.updateShrinkingBall(dt);
    } else if (mode === 'second_person') {
      this.updateSecondPerson(dt);
    } else if (mode === 'roguelike') {
      this.updateRoguelike(dt);
    } else if (mode === 'superhot') {
      this.updateSuperhot(dt);
    } else if (mode === 'portal') {
      this.updatePortal(dt);
    } else if (mode === 'tetris') {
      this.updateTetris(dt);
    } else if (mode === 'singularity') {
      this.updateSingularity(dt);
    } else if (mode === 'excavator') {
      this.updateExcavator(dt);
    } else if (mode === 'invaders') {
      this.updateInvaders(dt);
    } else if (mode === 'airhockey') {
      this.updateAirHockey(dt);
    } else if (mode === 'lightcycle') {
      this.updateLightCycle(dt);
    } else if (mode === 'gravity_flip') {
      this.updateGravityFlip(dt);
    } else if (mode === 'polarity') {
      this.updatePolarity(dt);
    } else if (mode === 'snake_pong') {
      this.updateSnakePong(dt);
    } else if (mode === 'prism' || mode === 'chrono') {
      this.updateChrono(dt);
    } else if (mode === 'asteroids_pong') {
      this.updateAsteroidsPong(dt);
    } else if (mode === 'tractor_beam' || mode === 'time_bomb') {
      this.updateTimeBomb(dt);
    } else if (mode === 'bullet_hell') {
      this.updateBulletHell(dt);
    } else {
      this.updateNormal(dt);
    }
  }

  updateNormal(dt) {
    const mode = this.currentLevel.mode;
    const isCurved = (mode === 'curved');
    const isSphere = (mode === 'sphere_paddle');
    const isInverted = (mode === 'inverted');
    const isFlappy = (mode === 'flappy');
    const isShatter = (mode === 'shatter');
    const isMath = (mode === 'math_pong');
    const isSmallBig = (mode === 'small_big');

    // Math Pong Pause
    if (isMath && this.modeState.questionActive) {
      this.modeState.mathTimer -= dt;
      if (this.modeState.mathTimer <= 0) {
        this.enemy.score++;
        window.Sound?.play('lose');
        this.modeState.questionActive = false;
        if (this.enemy.score >= this.currentLevel.targetScore) {
          this.showResult(false, 'TIME EXPIRED! YOU DIED.');
        } else {
          this.resetBall(true);
        }
      }
      return;
    }

    // 1. Player Paddle Movement
    const isPlayerStunned = (this.player.stunTimer && this.player.stunTimer > 0);
    const speed = isPlayerStunned ? 0 : 7.0;
    if (isFlappy) {
      this.player.vy += 0.32; // Gravity pull
      this.player.y += this.player.vy;
    } else if (!isPlayerStunned) {
      let dir = 0;
      if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
      if (isInverted) dir = -dir;

      this.player.y += dir * speed;
    }
    this.player.y = Math.max(34, Math.min(CANVAS_HEIGHT - 34 - this.player.h, this.player.y));

    // 2. Enemy AI Movement (In Flappy Pong, the AI is flappy too!)
    const isEnemyStunned = (this.enemy.stunTimer && this.enemy.stunTimer > 0);
    if (isFlappy) {
      this.enemy.vy = (this.enemy.vy || 0) + 0.32; // Gravity pull on AI too
      this.enemy.y += this.enemy.vy;

      // AI flaps when falling below the ball (if not stunned)
      if (!isEnemyStunned) {
        const targetY = this.ball.y - this.enemy.h / 2;
        const flapThreshold = this.difficulty === 'easy' ? 24 : (this.difficulty === 'hard' ? 8 : (this.difficulty === 'impossible' ? 4 : 14));
        if (this.enemy.y > targetY + flapThreshold && this.enemy.vy > 0.4) {
          this.enemy.vy = -6.8;
          window.Sound?.play('flap');
        }
      }
    } else if (!isEnemyStunned) {
      const targetY = this.ball.y - this.enemy.h / 2;
      if (this.ball.x > CANVAS_WIDTH - this.enemy.reactionDist) {
        const diff = targetY - this.enemy.y;
        if (Math.abs(diff) > this.enemy.jitter) {
          this.enemy.y += Math.sign(diff) * Math.min(Math.abs(diff), this.enemy.speed);
        }
      }
    }
    this.enemy.y = Math.max(34, Math.min(CANVAS_HEIGHT - 34 - this.enemy.h, this.enemy.y));

    // 3. Ball Movement
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;
    if (isSphere) {
      this.ball.angle = (this.ball.angle || 0) + (this.ball.angularVelocity || 0.05);
    }

    // Top / Bottom Wall Bounces
    const ballHalfH = isSphere ? (Math.abs(Math.sin(this.ball.angle)) * (this.ball.h / 2) + Math.abs(Math.cos(this.ball.angle)) * (this.ball.w / 2)) : (this.ball.size / 2);
    const topBound = 34 + ballHalfH;
    const bottomBound = CANVAS_HEIGHT - 34 - ballHalfH;

    if (this.ball.y <= topBound) {
      this.ball.y = topBound;
      this.ball.vy = Math.abs(this.ball.vy);
      if (isSphere) this.ball.angularVelocity = -this.ball.angularVelocity * 0.9;
      window.Sound?.play('wall');
    } else if (this.ball.y >= bottomBound) {
      this.ball.y = bottomBound;
      this.ball.vy = -Math.abs(this.ball.vy);
      if (isSphere) this.ball.angularVelocity = -this.ball.angularVelocity * 0.9;
      window.Sound?.play('wall');
    }

    // 4. Player Collision Check
    if (isSphere) {
      // Player paddle is a square (12x12) size of the ball; ball is an elongated rotating paddle
      const pcx = this.player.x + 6;
      const pcy = this.player.y + 6;
      const dx = pcx - this.ball.x;
      const dy = pcy - this.ball.y;
      const cos = Math.cos(-this.ball.angle);
      const sin = Math.sin(-this.ball.angle);
      const lx = cos * dx - sin * dy;
      const ly = sin * dx + cos * dy;
      const reachX = this.ball.w / 2 + 10;
      const reachY = this.ball.h / 2 + 10;

      if (Math.abs(lx) <= reachX && Math.abs(ly) <= reachY && this.ball.vx < 0) {
        const aiCfg = this.getAiConfig();
        const speedUp = isSmallBig ? 1.09 : (aiCfg.ballSpeedUp || 1.04);
        const maxSpd = isSmallBig ? 20.0 : (aiCfg.maxBallSpeed || 16.0);
        this.ball.vx = Math.min(maxSpd, Math.abs(this.ball.vx) * speedUp);
        this.ball.angularVelocity = (ly / (this.ball.h / 2)) * 0.12 + (Math.random() - 0.5) * 0.04;
        this.ball.vy += Math.sin(this.ball.angle) * 3.0;
        this.ball.x = this.player.x + 12 + Math.abs(cos) * (this.ball.w / 2) + Math.abs(sin) * (this.ball.h / 2) + 2;
        window.Sound?.play('hit');
      }
    } else {
      if (
        this.ball.vx < 0 &&
        this.ball.x - this.ball.size / 2 <= this.player.x + this.player.w &&
        this.ball.x + this.ball.size / 2 >= this.player.x &&
        this.ball.y + this.ball.size / 2 >= this.player.y &&
        this.ball.y - this.ball.size / 2 <= this.player.y + this.player.h
      ) {
        this.ball.x = this.player.x + this.player.w + this.ball.size / 2 + 1;
        const offset = (this.ball.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);

        let angle = offset * 0.75;
        if (isCurved) {
          // Concave parabola scoop: bent ends redirect the ball back inward toward the center
          angle = -offset * 0.55;
        }

        const aiCfg = this.getAiConfig();
        const speedUp = isSmallBig ? 1.09 : (aiCfg.ballSpeedUp || 1.04);
        const maxSpd = isSmallBig ? 20.0 : (aiCfg.maxBallSpeed || 16.0);
        this.ball.vx = Math.cos(angle) * this.ball.speed;
        this.ball.vy = Math.sin(angle) * this.ball.speed;
        this.ball.speed = Math.min(maxSpd, this.ball.speed * speedUp);
        window.Sound?.play('hit');

        // Shatter: cut off from where it hit the shorter direction like clipping the paddle
        if (isShatter) {
          const distFromTop = this.ball.y - this.player.y;
          const distFromBottom = (this.player.y + this.player.h) - this.ball.y;
          if (distFromTop < distFromBottom) {
            const newH = Math.max(16, (this.player.y + this.player.h) - this.ball.y);
            this.player.y = (this.player.y + this.player.h) - newH;
            this.player.h = newH;
          } else {
            this.player.h = Math.max(16, this.ball.y - this.player.y);
          }
          window.Sound?.play('brick');
        }

        // Math Pong Trigger
        if (isMath) {
          this.triggerMathQuestion();
        }
      }
    }

    // 5. Enemy Collision Check
    if (isSphere) {
      // Enemy paddle is a square (12x12) size of the ball; ball is an elongated rotating paddle
      const ecx = this.enemy.x + 6;
      const ecy = this.enemy.y + 6;
      const dx = ecx - this.ball.x;
      const dy = ecy - this.ball.y;
      const cos = Math.cos(-this.ball.angle);
      const sin = Math.sin(-this.ball.angle);
      const lx = cos * dx - sin * dy;
      const ly = sin * dx + cos * dy;
      const reachX = this.ball.w / 2 + 10;
      const reachY = this.ball.h / 2 + 10;

      if (Math.abs(lx) <= reachX && Math.abs(ly) <= reachY && this.ball.vx > 0) {
        const aiCfg = this.getAiConfig();
        const speedUp = isSmallBig ? 1.09 : (aiCfg.ballSpeedUp || 1.04);
        const maxSpd = isSmallBig ? 20.0 : (aiCfg.maxBallSpeed || 16.0);
        this.ball.vx = -Math.min(maxSpd, Math.abs(this.ball.vx) * speedUp);
        this.ball.angularVelocity = (ly / (this.ball.h / 2)) * 0.12 + (Math.random() - 0.5) * 0.04;
        this.ball.vy += Math.sin(this.ball.angle) * 3.0;
        this.ball.x = this.enemy.x - (Math.abs(cos) * (this.ball.w / 2) + Math.abs(sin) * (this.ball.h / 2) + 2);
        window.Sound?.play('hit');
      }
    } else {
      if (
        this.ball.vx > 0 &&
        this.ball.x + this.ball.size / 2 >= this.enemy.x &&
        this.ball.x - this.ball.size / 2 <= this.enemy.x + this.enemy.w &&
        this.ball.y + this.ball.size / 2 >= this.enemy.y &&
        this.ball.y - this.ball.size / 2 <= this.enemy.y + this.enemy.h
      ) {
        this.ball.x = this.enemy.x - this.ball.size / 2 - 1;
        const offset = (this.ball.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);

        let angle = offset * 0.75;
        if (isCurved) {
          // Concave parabola scoop: bent ends redirect the ball back inward toward the center
          angle = -offset * 0.55;
        }

        const aiCfg = this.getAiConfig();
        const speedUp = isSmallBig ? 1.09 : (aiCfg.ballSpeedUp || 1.04);
        const maxSpd = isSmallBig ? 20.0 : (aiCfg.maxBallSpeed || 16.0);
        this.ball.vx = -Math.cos(angle) * this.ball.speed;
        this.ball.vy = Math.sin(angle) * this.ball.speed;
        this.ball.speed = Math.min(maxSpd, this.ball.speed * speedUp);
        window.Sound?.play('hit');

        // Shatter: enemy paddle cut off in the shorter direction
        if (isShatter) {
          const distFromTop = this.ball.y - this.enemy.y;
          const distFromBottom = (this.enemy.y + this.enemy.h) - this.ball.y;
          if (distFromTop < distFromBottom) {
            const newH = Math.max(16, (this.enemy.y + this.enemy.h) - this.ball.y);
            this.enemy.y = (this.enemy.y + this.enemy.h) - newH;
            this.enemy.h = newH;
          } else {
            this.enemy.h = Math.max(16, this.ball.y - this.enemy.y);
          }
          window.Sound?.play('brick');
        }
      }
    }

    // 6. Scoring
    if (this.ball.x < 0) {
      this.enemy.score++;
      window.Sound?.play('score');
      if (isShatter) {
        this.player.h = 170;
        this.enemy.h = 170;
      }
      if (this.enemy.score >= this.currentLevel.targetScore) {
        this.showResult(false, 'AI WON THE MATCH');
      } else {
        this.resetBall(true);
      }
    } else if (this.ball.x > CANVAS_WIDTH) {
      this.player.score++;
      window.Sound?.play('score');
      if (isShatter) {
        this.player.h = 170;
        this.enemy.h = 170;
      }
      if (this.player.score >= this.currentLevel.targetScore) {
        this.showResult(true, `LEVEL ${this.currentLevel.id} CLEARED!`);
      } else {
        this.resetBall(false);
      }
    }
  }

  // --- DODGEBALL MODE ---
  updateDodgeball(dt) {
    const ds = this.modeState;
    if (ds.playerHitCooldown > 0) ds.playerHitCooldown -= dt;
    if (ds.enemyHitCooldown > 0) ds.enemyHitCooldown -= dt;

    // 1. Player Movement
    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * 7.5;
    this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));

    // 2. Enemy AI Dodging
    let threatBall = null;
    let minTimeToHit = 9999;
    const enemyCenterY = this.enemy.y + this.enemy.h / 2;

    for (const b of ds.dodgeballs) {
      if (b.vx > 0 && b.x > 380) {
        const timeToReach = (this.enemy.x - b.x) / b.vx;
        const predictedY = b.y + b.vy * timeToReach;
        if (timeToReach > 0 && timeToReach < minTimeToHit && predictedY >= this.enemy.y - 40 && predictedY <= this.enemy.y + this.enemy.h + 40) {
          minTimeToHit = timeToReach;
          threatBall = b;
        }
      }
    }

    if (threatBall) {
      const dodgeSpd = ds.dodgeSpeed || 5.2;
      if (threatBall.y < enemyCenterY) {
        this.enemy.y += dodgeSpd; // dodge down
      } else {
        this.enemy.y -= dodgeSpd; // dodge up
      }
    } else {
      const targetCenter = (CANVAS_HEIGHT - this.enemy.h) / 2;
      const diff = targetCenter - this.enemy.y;
      if (Math.abs(diff) > 10) {
        this.enemy.y += Math.sign(diff) * Math.min(Math.abs(diff), 2.5);
      }
    }
    this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));

    // 3. Dodgeball Movement & Collisions
    for (const b of ds.dodgeballs) {
      b.x += b.vx;
      b.y += b.vy;

      if (b.y <= 38 + b.r) { b.y = 38 + b.r; b.vy = Math.abs(b.vy); }
      if (b.y >= CANVAS_HEIGHT - 38 - b.r) { b.y = CANVAS_HEIGHT - 38 - b.r; b.vy = -Math.abs(b.vy); }
      if (b.x >= CANVAS_WIDTH - 20 - b.r) { b.x = CANVAS_WIDTH - 20 - b.r; b.vx = -Math.abs(b.vx); }
      if (b.x <= 20 + b.r) { b.x = 20 + b.r; b.vx = Math.abs(b.vx); }

      // Check collision with Player Paddle
      if (
        (!ds.playerHitCooldown || ds.playerHitCooldown <= 0) &&
        b.x - b.r <= this.player.x + this.player.w &&
        b.x + b.r >= this.player.x &&
        b.y + b.r >= this.player.y &&
        b.y - b.r <= this.player.y + this.player.h
      ) {
        ds.playerLives--;
        ds.playerHitCooldown = 0.8;
        b.x = this.player.x + this.player.w + b.r + 10;
        b.vx = Math.abs(b.vx) + 1.5;
        window.Sound?.play('lose');
        if (ds.playerLives <= 0) {
          this.showResult(false, 'YOU WERE HIT 3 TIMES! GAME OVER');
          return;
        }
      }

      // Check collision with Enemy Paddle
      if (
        (!ds.enemyHitCooldown || ds.enemyHitCooldown <= 0) &&
        b.x - b.r <= this.enemy.x + this.enemy.w &&
        b.x + b.r >= this.enemy.x &&
        b.y + b.r >= this.enemy.y &&
        b.y - b.r <= this.enemy.y + this.enemy.h
      ) {
        ds.enemyLives--;
        ds.enemyHitCooldown = 0.8;
        b.x = this.enemy.x - b.r - 10;
        b.vx = -Math.abs(b.vx) - 1.5;
        window.Sound?.play('hit');
        if (ds.enemyLives <= 0) {
          this.showResult(true, 'ENEMY HIT 3 TIMES! YOU WIN!');
          return;
        }
      }
    }
  }

  // --- MULTI-BALL MODES (Two Balls, Three Balls, Mitosis) ---
  updateMultiBall(dt, isMitosis) {
    const balls = this.modeState.balls;

    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * 7.2;
    this.player.y = Math.max(34, Math.min(CANVAS_HEIGHT - 34 - this.player.h, this.player.y));

    let nearestBall = null;
    let nearestDist = 9999;
    for (const b of balls) {
      if (b.vx > 0 && b.x > CANVAS_WIDTH - this.enemy.reactionDist) {
        const d = CANVAS_WIDTH - b.x;
        if (d < nearestDist) {
          nearestDist = d;
          nearestBall = b;
        }
      }
    }
    if (nearestBall) {
      const targetY = nearestBall.y - this.enemy.h / 2;
      const diff = targetY - this.enemy.y;
      if (Math.abs(diff) > this.enemy.jitter) {
        this.enemy.y += Math.sign(diff) * Math.min(Math.abs(diff), this.enemy.speed);
      }
    }
    this.enemy.y = Math.max(34, Math.min(CANVAS_HEIGHT - 34 - this.enemy.h, this.enemy.y));

    let wallSound = false;
    let hitSound = false;
    let scoreSound = false;
    const targetScore = isMitosis ? (this.getAiConfig().mitosisTargetScore || 1000) : (this.currentLevel.targetScore || 5);

    const toSpawn = [];
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      b.x += b.vx;
      b.y += b.vy;

      if (b.y <= 38) {
        b.y = 38;
        b.vy = Math.abs(b.vy);
        if (!wallSound) { window.Sound?.play('wall'); wallSound = true; }
        if (isMitosis && (balls.length + toSpawn.length < 2000)) {
          toSpawn.push({
            x: b.x,
            y: b.y + 4,
            vx: b.vx * (Math.random() < 0.2 ? -1 : 1) + (Math.random() - 0.5),
            vy: Math.abs(b.vy) * (0.85 + Math.random() * 0.3),
            size: 10,
            speed: b.speed
          });
        }
      }
      if (b.y >= CANVAS_HEIGHT - 38) {
        b.y = CANVAS_HEIGHT - 38;
        b.vy = -Math.abs(b.vy);
        if (!wallSound) { window.Sound?.play('wall'); wallSound = true; }
        if (isMitosis && (balls.length + toSpawn.length < 2000)) {
          toSpawn.push({
            x: b.x,
            y: b.y - 4,
            vx: b.vx * (Math.random() < 0.2 ? -1 : 1) + (Math.random() - 0.5),
            vy: -Math.abs(b.vy) * (0.85 + Math.random() * 0.3),
            size: 10,
            speed: b.speed
          });
        }
      }

      if (
        b.vx < 0 &&
        b.x - b.size / 2 <= this.player.x + this.player.w &&
        b.x + b.size / 2 >= this.player.x &&
        b.y + b.size / 2 >= this.player.y &&
        b.y - b.size / 2 <= this.player.y + this.player.h
      ) {
        b.x = this.player.x + this.player.w + b.size / 2 + 1;
        const offset = (b.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
        b.vx = Math.cos(offset * 0.75) * b.speed;
        b.vy = Math.sin(offset * 0.75) * b.speed;
        if (!hitSound) { window.Sound?.play('hit'); hitSound = true; }

        if (isMitosis && (balls.length + toSpawn.length < 2000)) {
          toSpawn.push({
            x: b.x,
            y: b.y,
            vx: b.vx * 1.05,
            vy: -b.vy + (Math.random() - 0.5) * 2,
            size: 10,
            speed: b.speed
          });
        }
      }

      if (
        b.vx > 0 &&
        b.x + b.size / 2 >= this.enemy.x &&
        b.x - b.size / 2 <= this.enemy.x + this.enemy.w &&
        b.y + b.size / 2 >= this.enemy.y &&
        b.y - b.size / 2 <= this.enemy.y + this.enemy.h
      ) {
        b.x = this.enemy.x - b.size / 2 - 1;
        const offset = (b.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
        b.vx = -Math.cos(offset * 0.75) * b.speed;
        b.vy = Math.sin(offset * 0.75) * b.speed;
        if (!hitSound) { window.Sound?.play('hit'); hitSound = true; }

        if (isMitosis && (balls.length + toSpawn.length < 2000)) {
          toSpawn.push({
            x: b.x,
            y: b.y,
            vx: b.vx * 1.05,
            vy: -b.vy + (Math.random() - 0.5) * 2,
            size: 10,
            speed: b.speed
          });
        }
      }

      if (b.x < 0) {
        this.enemy.score++;
        if (!scoreSound) { window.Sound?.play('score'); scoreSound = true; }
        balls.splice(i, 1);
        if (this.enemy.score >= targetScore) {
          this.showResult(false, 'AI WON THE MATCH');
          return;
        }
        if (!isMitosis) {
          toSpawn.push({
            x: CANVAS_WIDTH / 2,
            y: 80 + Math.random() * (CANVAS_HEIGHT - 160),
            vx: 6.2 * (Math.random() < 0.5 ? 1 : -1),
            vy: (Math.random() - 0.5) * 3.5,
            size: 10,
            speed: 6.5
          });
        }
      } else if (b.x > CANVAS_WIDTH) {
        this.player.score++;
        if (!scoreSound) { window.Sound?.play('score'); scoreSound = true; }
        balls.splice(i, 1);
        if (this.player.score >= targetScore) {
          this.showResult(true, `LEVEL ${this.currentLevel.id} CLEARED!`);
          return;
        }
        if (!isMitosis) {
          toSpawn.push({
            x: CANVAS_WIDTH / 2,
            y: 80 + Math.random() * (CANVAS_HEIGHT - 160),
            vx: 6.2 * (Math.random() < 0.5 ? 1 : -1),
            vy: (Math.random() - 0.5) * 3.5,
            size: 10,
            speed: 6.5
          });
        }
      }
    }

    toSpawn.forEach(nb => {
      if (balls.length < 2000) balls.push(nb);
    });

    if (!isMitosis) {
      const targetCount = (this.currentLevel.mode === 'two_balls') ? 2 : 3;
      while (balls.length < targetCount) {
        balls.push({
          x: CANVAS_WIDTH / 2,
          y: 80 + Math.random() * (CANVAS_HEIGHT - 160),
          vx: 6.2 * (Math.random() < 0.5 ? 1 : -1),
          vy: (Math.random() - 0.5) * 3.5,
          size: 10,
          speed: 6.5
        });
      }
    } else if (balls.length === 0) {
      balls.push({
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        vx: 6.0 * (Math.random() < 0.5 ? 1 : -1),
        vy: (Math.random() - 0.5) * 3,
        size: 10,
        speed: 6.0
      });
    }
  }

  // --- BLASTER MODE ---
  shootPlayerBullet() {
    this.modeState.bullets.push({
      x: this.player.x + this.player.w + 2,
      y: this.player.y + this.player.h / 2 - 2,
      vx: 14,
      w: 12,
      h: 4,
      isPlayer: true
    });
    this.modeState.shootCooldown = 0.35;
    window.Sound?.play('laser');
  }

  updateBlaster(dt) {
    const bs = this.modeState;
    if (bs.shootCooldown > 0) bs.shootCooldown -= dt;
    if (this.player.stunTimer > 0) this.player.stunTimer -= dt;
    if (this.enemy.stunTimer > 0) this.enemy.stunTimer -= dt;

    bs.enemyShootTimer -= dt;
    if (bs.enemyShootTimer <= 0 && this.enemy.stunTimer <= 0) {
      bs.bullets.push({
        x: this.enemy.x - 14,
        y: this.enemy.y + this.enemy.h / 2 - 2,
        vx: -12,
        w: 12,
        h: 4,
        isPlayer: false
      });
      bs.enemyShootTimer = (bs.enemyBaseCooldown || 1.7) * (0.8 + Math.random() * 0.4);
      window.Sound?.play('laser');
    }

    for (let i = bs.bullets.length - 1; i >= 0; i--) {
      const b = bs.bullets[i];
      b.x += b.vx;

      if (b.isPlayer && b.x + b.w >= this.enemy.x && b.x <= this.enemy.x + this.enemy.w && b.y >= this.enemy.y && b.y <= this.enemy.y + this.enemy.h) {
        bs.bullets.splice(i, 1);
        window.Sound?.play('win');
        this.showResult(true, 'OPPONENT WAS SHOT! YOU WIN!');
        return;
      }
      if (!b.isPlayer && b.x <= this.player.x + this.player.w && b.x + b.w >= this.player.x && b.y >= this.player.y && b.y <= this.player.y + this.player.h) {
        bs.bullets.splice(i, 1);
        window.Sound?.play('lose');
        this.showResult(false, 'YOU WERE SHOT! GAME OVER');
        return;
      }

      if (b.x < 0 || b.x > CANVAS_WIDTH) {
        bs.bullets.splice(i, 1);
      }
    }

    // Normal Pong ball continues
    this.updateNormal(dt);
  }

  // --- MATH PONG MODE ---
  triggerMathQuestion() {
    this.modeState.questionActive = true;
    this.modeState.mathTimer = this.getAiConfig().mathTimer;

    const ops = ['x', '+', '-', '/'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let qText = '', ans = 0;

    if (op === 'x') {
      const a = Math.floor(Math.random() * 7) + 3;
      const b = Math.floor(Math.random() * 7) + 3;
      qText = `${a} x ${b}`;
      ans = a * b;
    } else if (op === '/') {
      const b = Math.floor(Math.random() * 6) + 3;
      const a = b * (Math.floor(Math.random() * 6) + 2);
      qText = `${a} / ${b}`;
      ans = a / b;
    } else if (op === '+') {
      const a = Math.floor(Math.random() * 35) + 12;
      const b = Math.floor(Math.random() * 35) + 12;
      qText = `${a} + ${b}`;
      ans = a + b;
    } else {
      const a = Math.floor(Math.random() * 40) + 25;
      const b = Math.floor(Math.random() * 20) + 6;
      qText = `${a} - ${b}`;
      ans = a - b;
    }

    const wrong1 = ans + (Math.random() < 0.5 ? 2 : -2);
    const wrong2 = ans + (Math.random() < 0.5 ? 5 : -4);
    const choices = [ ans, wrong1, wrong2 ].sort(() => Math.random() - 0.5);

    this.modeState.curQuestion = { qText, ans, choices };
  }

  answerMathQuestion(choiceNum) {
    const q = this.modeState.curQuestion;
    if (!q || !this.modeState.questionActive) return;

    const chosen = q.choices[choiceNum - 1];
    if (chosen === q.ans) {
      this.modeState.mathSolved++;
      this.modeState.questionActive = false;
      window.Sound?.play('score');
      this.ball.speed *= 1.35;
      this.ball.vx = Math.abs(this.ball.vx) * 1.35;
      if (this.modeState.mathSolved >= 5) {
        this.showResult(true, 'SOLVED 5 MATH PROBLEMS!');
      }
    } else {
      this.enemy.score++;
      window.Sound?.play('lose');
      this.modeState.questionActive = false;
      if (this.enemy.score >= this.currentLevel.targetScore) {
        this.showResult(false, 'WRONG ANSWER! YOU DIED.');
      } else {
        this.resetBall(true);
      }
    }
  }

  // --- SPHERE ARENA MODE ---
  updateCirclePong(dt) {
    const cs = this.modeState;
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    const R = cs.radius;

    const angleDiff = (a, b) => {
      let d = (a - b) % (2 * Math.PI);
      if (d < -Math.PI) d += 2 * Math.PI;
      if (d > Math.PI) d -= 2 * Math.PI;
      return d;
    };

    // W/Up moves paddle UP (+angle in canvas space on the left), S/Down moves DOWN (-angle)
    if (this.keys['w'] || this.keys['arrowup']) cs.playerAngle += 3.5 * dt;
    if (this.keys['s'] || this.keys['arrowdown']) cs.playerAngle -= 3.5 * dt;
    cs.playerAngle = Math.max(Math.PI - 1.45, Math.min(Math.PI + 1.45, cs.playerAngle));

    const ballAngle = Math.atan2(this.ball.y - cy, this.ball.x - cx);
    if (this.ball.vx > 0) {
      const diff = angleDiff(ballAngle, cs.enemyAngle);
      cs.enemyAngle += Math.sign(diff) * Math.min(Math.abs(diff), this.enemy.speed * 0.45 * dt);
    }
    cs.enemyAngle = Math.max(-1.45, Math.min(1.45, cs.enemyAngle));

    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    const dist = Math.hypot(this.ball.x - cx, this.ball.y - cy);
    const bAngle = Math.atan2(this.ball.y - cy, this.ball.x - cx);

    if (dist >= R - 14 && dist <= R + 14) {
      const aiCfg = this.getAiConfig();
      const speedUp = aiCfg.ballSpeedUp || 1.04;
      const maxSpd = aiCfg.maxBallSpeed || 16.0;

      if (Math.abs(angleDiff(bAngle, cs.playerAngle)) < cs.arcLen / 2 && this.ball.vx < 0) {
        const hitOffset = angleDiff(bAngle, cs.playerAngle) / (cs.arcLen / 2);
        const reflectAngle = bAngle + Math.PI - hitOffset * 0.45;
        this.ball.speed = Math.min(maxSpd, this.ball.speed * speedUp);
        this.ball.vx = Math.cos(reflectAngle) * this.ball.speed;
        this.ball.vy = Math.sin(reflectAngle) * this.ball.speed;
        cs.lastHitter = 'player';
        window.Sound?.play('hit');
      } else if (Math.abs(angleDiff(bAngle, cs.enemyAngle)) < cs.arcLen / 2 && this.ball.vx > 0) {
        const hitOffset = angleDiff(bAngle, cs.enemyAngle) / (cs.arcLen / 2);
        const reflectAngle = bAngle + Math.PI - hitOffset * 0.45;
        this.ball.speed = Math.min(maxSpd, this.ball.speed * speedUp);
        this.ball.vx = Math.cos(reflectAngle) * this.ball.speed;
        this.ball.vy = Math.sin(reflectAngle) * this.ball.speed;
        cs.lastHitter = 'enemy';
        window.Sound?.play('hit');
      }
    }

    if (dist > R + 25) {
      if (cs.lastHitter === 'player') {
        this.player.score++;
        window.Sound?.play('score');
        if (this.player.score >= 5) {
          this.showResult(true, 'WON THE SPHERE ARENA!');
          return;
        }
      } else if (cs.lastHitter === 'enemy') {
        this.enemy.score++;
        window.Sound?.play('score');
        if (this.enemy.score >= 5) {
          this.showResult(false, 'AI WON THE SPHERE ARENA');
          return;
        }
      }
      this.ball.x = cx;
      this.ball.y = cy;
      this.ball.vx = (Math.random() < 0.5 ? 1 : -1) * 5.5;
      this.ball.vy = (Math.random() - 0.5) * 3;
      cs.lastHitter = null;
    }
  }

  // --- BE THE BALL / CROSSY / POKEBATTLE / SOCCER / BREAKOUT / RACING (Retained) ---
  updateBeTheBall(dt) {
    const p = this.player;
    const accel = 24.0;
    const friction = 0.92;

    if (this.keys['w'] || this.keys['arrowup']) p.vy -= accel * dt;
    if (this.keys['s'] || this.keys['arrowdown']) p.vy += accel * dt;
    if (this.keys['a'] || this.keys['arrowleft']) p.vx -= accel * dt;
    if (this.keys['d'] || this.keys['arrowright']) p.vx += accel * dt;

    p.vx *= friction;
    p.vy *= friction;
    p.x += p.vx;
    p.y += p.vy;

    p.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - p.size, p.y));

    const sL = this.modeState.leftSentinel;
    const sR = this.modeState.rightSentinel;

    // Left sentinel AI: reacts when player approaches left half
    if (p.x < CANVAS_WIDTH * 0.6) {
      const diffL = p.y - (sL.y + sL.h / 2);
      if (Math.abs(diffL) > 14) {
        sL.y += Math.sign(diffL) * Math.min(Math.abs(diffL), sL.speed);
      }
    } else {
      // Patrol near center
      sL.y += sL.patrolDir * 1.5;
      if (sL.y <= 130) { sL.y = 130; sL.patrolDir = 1; }
      if (sL.y >= CANVAS_HEIGHT - 130 - sL.h) { sL.y = CANVAS_HEIGHT - 130 - sL.h; sL.patrolDir = -1; }
    }
    sL.y = Math.max(34, Math.min(CANVAS_HEIGHT - 34 - sL.h, sL.y));

    // Right sentinel AI: reacts when player approaches right half
    if (p.x > CANVAS_WIDTH * 0.4) {
      const diffR = p.y - (sR.y + sR.h / 2);
      if (Math.abs(diffR) > 14) {
        sR.y += Math.sign(diffR) * Math.min(Math.abs(diffR), sR.speed);
      }
    } else {
      // Patrol near center
      sR.y += sR.patrolDir * 1.5;
      if (sR.y <= 130) { sR.y = 130; sR.patrolDir = 1; }
      if (sR.y >= CANVAS_HEIGHT - 130 - sR.h) { sR.y = CANVAS_HEIGHT - 130 - sR.h; sR.patrolDir = -1; }
    }
    sR.y = Math.max(34, Math.min(CANVAS_HEIGHT - 34 - sR.h, sR.y));

    if (p.x <= sL.x + sL.w && p.x + p.size >= sL.x && p.y + p.size >= sL.y && p.y <= sL.y + sL.h) {
      p.x = sL.x + sL.w + 4;
      p.vx = 8;
      window.Sound?.play('hit');
    }
    if (p.x + p.size >= sR.x && p.x <= sR.x + sR.w && p.y + p.size >= sR.y && p.y <= sR.y + sR.h) {
      p.x = sR.x - p.size - 4;
      p.vx = -8;
      window.Sound?.play('hit');
    }

    if (p.x < 10) {
      p.score++;
      p.x = CANVAS_WIDTH / 2;
      p.y = CANVAS_HEIGHT / 2;
      p.vx = 0; p.vy = 0;
      window.Sound?.play('score');
      if (p.score >= 5) this.showResult(true, 'SCORED 5 GOALS AS THE BALL!');
    } else if (p.x > CANVAS_WIDTH - 10) {
      p.score++;
      p.x = CANVAS_WIDTH / 2;
      p.y = CANVAS_HEIGHT / 2;
      p.vx = 0; p.vy = 0;
      window.Sound?.play('score');
      if (p.score >= 5) this.showResult(true, 'SCORED 5 GOALS AS THE BALL!');
    }
  }

  updateCrossy(dt) {
    const cs = this.modeState;
    const b = cs.ball;
    const speed = 4.2;

    if (this.keys['w'] || this.keys['arrowup']) b.y -= speed;
    if (this.keys['s'] || this.keys['arrowdown']) b.y += speed;
    if (this.keys['a'] || this.keys['arrowleft']) b.x -= speed;
    if (this.keys['d'] || this.keys['arrowright']) b.x += speed;

    b.x = Math.max(20, Math.min(CANVAS_WIDTH - 20 - b.size, b.x));
    b.y = Math.max(30, Math.min(500, b.y));

    for (const lane of cs.lanes) {
      for (const p of lane.paddles) {
        p.x += lane.speed;
        if (lane.speed > 0 && p.x > CANVAS_WIDTH) p.x = -lane.w;
        if (lane.speed < 0 && p.x + lane.w < 0) p.x = CANVAS_WIDTH;

        if (b.x < p.x + lane.w && b.x + b.size > p.x && b.y < lane.y + lane.h && b.y + b.size > lane.y) {
          this.initMode('crossy');
          window.Sound?.play('lose');
          return;
        }
      }
    }

    if (b.y <= 45) {
      cs.score++;
      b.x = CANVAS_WIDTH / 2;
      b.y = 490;
      window.Sound?.play('score');
      // Paddles get longer and faster each level
      for (const lane of cs.lanes) {
        lane.w += 22;
        lane.speed = Math.sign(lane.speed) * (Math.abs(lane.speed) + 0.45);
      }
      if (cs.score >= 5) {
        this.showResult(true, 'CLEARED ALL 5 CROSSY LEVELS!');
      }
    }
  }

  handlePokeBattleKey(k) {
    const pb = this.modeState.pb;
    if (!pb || pb.turn !== 'player') return;

    let moveIdx = -1;
    if (k === '1') moveIdx = 0;
    else if (k === '2') moveIdx = 1;
    else if (k === '3') moveIdx = 2;
    else if (k === '4') moveIdx = 3;

    if (moveIdx >= 0) {
      this.executePokeMove(moveIdx);
    }
  }

  executePokeMove(idx) {
    const pb = this.modeState.pb;
    pb.selectedMove = idx;
    pb.turn = 'player_anim';
    pb.timer = 0;

    const move = pb.moves[idx];
    pb.message = `PADDLE used ${move.name}!`;

    if (idx === 2) {
      pb.playerDefend = true;
      pb.sub = 'Raised a rigid barrier! Next hit -75% DMG.';
      window.Sound?.play('wall');
    } else {
      pb.sub = `Dealt -${move.dmg} HP to Wild Pong Ball!`;
      pb.enemyHp = Math.max(0, pb.enemyHp - move.dmg);
      window.Sound?.play('hit');
    }

    setTimeout(() => {
      if (pb.enemyHp <= 0) {
        this.showResult(true, 'WILD PONG BALL FAINTED!');
      } else {
        pb.turn = 'enemy_turn';
        this.executePokeEnemyAttack();
      }
    }, 1000);
  }

  executePokeEnemyAttack() {
    const pb = this.modeState.pb;
    const attacks = [
      { name: 'BALL RAM', msg: 'WILD PONG BALL attacked with... ITSELF!', dmg: 22 },
      { name: 'SPEED SERVE', msg: 'WILD PONG BALL hurled itself at high speed!', dmg: 26 },
      { name: 'KINETIC SLAM', msg: 'WILD PONG BALL slammed down hard!', dmg: 24 }
    ];
    const atk = attacks[Math.floor(Math.random() * attacks.length)];
    pb.message = atk.msg;

    let dmg = Math.round(atk.dmg * (pb.dmgMult || 1.0));
    if (pb.playerDefend) {
      dmg = Math.max(5, Math.floor(dmg * 0.25));
      pb.sub = `DEFENSIVE BLOCK absorbed the blow! (-${dmg} HP)`;
    } else {
      pb.sub = `Direct strike! (-${dmg} HP)`;
    }
    pb.playerDefend = false;
    pb.playerHp = Math.max(0, pb.playerHp - dmg);
    window.Sound?.play('hit');

    setTimeout(() => {
      if (pb.playerHp <= 0) {
        this.showResult(false, 'PADDLE WAS KNOCKED OUT!');
      } else {
        pb.turn = 'player';
        pb.message = 'What will PADDLE do?';
        pb.sub = 'Choose an attack [1 - 4]';
      }
    }, 1200);
  }

  updatePokeBattle(dt) {}

  checkPaddleBallCollision(paddle, ball, isPlayer, kickSpd, targetGoalY) {
    const cx = paddle.x + paddle.w / 2;
    const cy = paddle.y + paddle.h / 2;
    const dx = ball.x - cx;
    const dy = ball.y - cy;

    const cos = Math.cos(-paddle.angle);
    const sin = Math.sin(-paddle.angle);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;

    const hw = paddle.w / 2;
    const hh = paddle.h / 2;
    const clampedX = Math.max(-hw, Math.min(hw, lx));
    const clampedY = Math.max(-hh, Math.min(hh, ly));

    const distX = lx - clampedX;
    const distY = ly - clampedY;
    const distSq = distX * distX + distY * distY;
    const r = ball.size / 2;

    const isInside = (Math.abs(lx) <= hw && Math.abs(ly) <= hh);
    if (distSq > r * r && !isInside) {
      return false;
    }

    let normLX = 0;
    let normLY = 0;
    let overlap = 0;

    if (distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      normLX = distX / dist;
      normLY = distY / dist;
      overlap = r - dist;
    } else {
      const overlapX = hw - Math.abs(lx);
      const overlapY = hh - Math.abs(ly);
      if (overlapX < overlapY) {
        normLX = lx >= 0 ? 1 : -1;
        normLY = 0;
        overlap = overlapX + r;
      } else {
        normLX = 0;
        normLY = ly >= 0 ? 1 : -1;
        overlap = overlapY + r;
      }
    }

    // Convert local collision normal to world coordinates
    const worldNormX = normLX * Math.cos(paddle.angle) - normLY * Math.sin(paddle.angle);
    const worldNormY = normLX * Math.sin(paddle.angle) + normLY * Math.cos(paddle.angle);

    // Push ball cleanly outside paddle along world normal
    const pushOut = Math.max(0, overlap) + 1.5;
    ball.x += worldNormX * pushOut;
    ball.y += worldNormY * pushOut;

    if (isPlayer) {
      const aimDirX = Math.cos(paddle.angle);
      const aimDirY = Math.sin(paddle.angle);
      const dot = worldNormX * aimDirX + worldNormY * aimDirY;
      let kickX, kickY;
      if (dot >= -0.2) {
        // Front/side contact: kick ball in player aim direction
        kickX = aimDirX * 0.76 + worldNormX * 0.24;
        kickY = aimDirY * 0.76 + worldNormY * 0.24;
      } else {
        // Back contact: bounce off back of paddle
        kickX = worldNormX;
        kickY = worldNormY;
      }
      const kickLen = Math.hypot(kickX, kickY) || 1;
      ball.vx = (kickX / kickLen) * kickSpd;
      ball.vy = (kickY / kickLen) * kickSpd;
    } else {
      const goalAngle = Math.atan2(targetGoalY - cy, 20 - cx);
      const aimDirX = Math.cos(goalAngle);
      const aimDirY = Math.sin(goalAngle);
      const dot = worldNormX * aimDirX + worldNormY * aimDirY;
      let kickX, kickY;
      if (dot >= -0.2) {
        kickX = aimDirX * 0.76 + worldNormX * 0.24;
        kickY = aimDirY * 0.76 + worldNormY * 0.24;
      } else {
        kickX = worldNormX;
        kickY = worldNormY;
      }
      const kickLen = Math.hypot(kickX, kickY) || 1;
      ball.vx = (kickX / kickLen) * kickSpd;
      ball.vy = (kickY / kickLen) * kickSpd;
    }

    window.Sound?.play('hit');
    return true;
  }

  updateSoccer(dt) {
    const p = this.player;
    const e = this.enemy;
    const b = this.ball;
    const ms = this.modeState;

    // Handle goal celebration pause
    if (ms.goalTimer > 0) {
      ms.goalTimer -= dt;
      b.vx *= 0.85;
      b.vy *= 0.85;
      if (ms.goalTimer <= 0) {
        if (p.score >= 3) {
          this.showResult(true, 'SOCCER PONG CHAMPION!');
          return;
        }
        if (e.score >= 3) {
          this.showResult(false, 'OPPONENT WON 3 GOALS');
          return;
        }
        // Reset positions for kickoff
        p.x = 220;
        p.y = CANVAS_HEIGHT / 2 - 25;
        p.angle = 0;
        e.x = 740;
        e.y = CANVAS_HEIGHT / 2 - 25;
        e.angle = Math.PI;
        b.x = CANVAS_WIDTH / 2;
        b.y = CANVAS_HEIGHT / 2;
        b.vx = 0;
        b.vy = 0;
        ms.scored = false;
        ms.goalScorer = null;
        ms.kickoffTimer = 0.5;
      }
      return;
    }

    if (ms.kickoffTimer > 0) {
      ms.kickoffTimer -= dt;
    }

    // 1. Player Movement & Mouse-Facing
    const pSpeed = 5.8;
    let moveX = 0, moveY = 0;
    if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.7071;
      moveY *= 0.7071;
    }
    p.x += moveX * pSpeed;
    p.y += moveY * pSpeed;
    p.x = Math.max(26, Math.min(CANVAS_WIDTH - 55 - p.w, p.x));
    p.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - p.h, p.y));

    const pcx = p.x + p.w / 2;
    const pcy = p.y + p.h / 2;
    p.angle = Math.atan2(this.mouseY - pcy, this.mouseX - pcx);

    // 2. AI Difficulty Tuning
    let aiSpeed = 3.8;
    let aiKickSpd = 6.8;
    let aimJitter = 28;

    if (this.difficulty === 'easy') {
      aiSpeed = 2.9;
      aiKickSpd = 5.2;
      aimJitter = 55;
    } else if (this.difficulty === 'hard') {
      aiSpeed = 4.6;
      aiKickSpd = 7.8;
      aimJitter = 16;
    } else if (this.difficulty === 'impossible') {
      aiSpeed = 5.4;
      aiKickSpd = 8.8;
      aimJitter = 6;
    }
    e.speed = aiSpeed;

    // 3. Smart Positional AI Movement
    const ecx = e.x + e.w / 2;
    const ecy = e.y + e.h / 2;
    let targetX = 760;
    let targetY = 270;

    if (b.x > ecx && b.vx > 0.4) {
      // Emergency retreat: ball is behind AI heading towards AI goal
      targetX = Math.min(CANVAS_WIDTH - 70, b.x + 20);
      targetY = Math.max(180, Math.min(360, b.y));
    } else if (b.x >= CANVAS_WIDTH / 2 - 20) {
      // Ball is in AI's defensive/attacking zone: contest and clear
      const toGoalAngle = Math.atan2(270 - b.y, 20 - b.x);
      targetX = b.x - Math.cos(toGoalAngle) * 28;
      targetY = b.y - Math.sin(toGoalAngle) * 28;
    } else {
      // Ball is in player's half: AI plays disciplined goalkeeping
      targetX = 760;
      let projectedY = 270;
      if (b.vx > 1.0) {
        projectedY = b.y + b.vy * ((760 - b.x) / b.vx);
      } else {
        projectedY = b.y + (270 - b.y) * ((760 - b.x) / (940 - b.x));
      }
      targetY = Math.max(180, Math.min(360, projectedY));
    }

    const diffX = targetX - ecx;
    const diffY = targetY - ecy;
    const distToTarget = Math.hypot(diffX, diffY);
    if (distToTarget > 6) {
      e.x += (diffX / distToTarget) * Math.min(distToTarget, aiSpeed);
      e.y += (diffY / distToTarget) * Math.min(distToTarget, aiSpeed);
    }
    // Constrain AI to defending its own half and staying on pitch
    e.x = Math.max(CANVAS_WIDTH / 2 - 30, Math.min(CANVAS_WIDTH - 28 - e.w, e.x));
    e.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - e.h, e.y));

    // AI Facing Direction
    const distToBall = Math.hypot(b.x - ecx, b.y - ecy);
    if (distToBall < 110) {
      e.angle = Math.atan2(270 - ecy, 20 - ecx);
    } else {
      e.angle = Math.atan2(b.y - ecy, b.x - ecx);
    }

    // 4. Sub-Stepping Ball Physics & Collision (3 substeps per frame)
    const subSteps = 3;
    const dtSub = 1 / subSteps;
    const r = b.size / 2;
    const goalTop = 170;
    const goalBottom = 370;

    for (let step = 0; step < subSteps; step++) {
      b.x += b.vx * dtSub;
      b.y += b.vy * dtSub;

      // Top and Bottom walls
      if (b.y - r <= 34) {
        b.y = 34 + r;
        b.vy = Math.abs(b.vy);
        window.Sound?.play('wall');
      } else if (b.y + r >= CANVAS_HEIGHT - 34) {
        b.y = CANVAS_HEIGHT - 34 - r;
        b.vy = -Math.abs(b.vy);
        window.Sound?.play('wall');
      }

      // Goal posts collision (top & bottom posts for both goals)
      const posts = [
        { x: 20, y: goalTop },
        { x: 20, y: goalBottom },
        { x: CANVAS_WIDTH - 20, y: goalTop },
        { x: CANVAS_WIDTH - 20, y: goalBottom }
      ];
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const pdx = b.x - post.x;
        const pdy = b.y - post.y;
        const pdist = Math.hypot(pdx, pdy);
        if (pdist < r + 3.5) {
          const pnx = pdx / (pdist || 1);
          const pny = pdy / (pdist || 1);
          b.x = post.x + pnx * (r + 4);
          b.y = post.y + pny * (r + 4);
          const dotP = b.vx * pnx + b.vy * pny;
          if (dotP < 0) {
            b.vx -= 2 * dotP * pnx;
            b.vy -= 2 * dotP * pny;
            window.Sound?.play('hit');
          }
        }
      }

      // Left Pitch Line / Goal
      if (b.x - r <= 20) {
        if (b.y >= goalTop && b.y <= goalBottom) {
          // Inside Left Net
          if (b.x - r <= 4) {
            b.x = 4 + r;
            b.vx = 0;
            b.vy *= 0.5;
          }
          if (b.y - r <= goalTop) { b.y = goalTop + r; b.vy = Math.abs(b.vy) * 0.5; }
          if (b.y + r >= goalBottom) { b.y = goalBottom - r; b.vy = -Math.abs(b.vy) * 0.5; }
          if (!ms.scored) {
            ms.scored = true;
            ms.goalScorer = 'enemy';
            ms.goalTimer = 1.0;
            e.score++;
            window.Sound?.play('score');
          }
        } else {
          // Solid boundary wall
          b.x = 20 + r;
          b.vx = Math.abs(b.vx);
          window.Sound?.play('wall');
        }
      }

      // Right Pitch Line / Goal
      if (b.x + r >= CANVAS_WIDTH - 20) {
        if (b.y >= goalTop && b.y <= goalBottom) {
          // Inside Right Net
          if (b.x + r >= CANVAS_WIDTH - 4) {
            b.x = CANVAS_WIDTH - 4 - r;
            b.vx = 0;
            b.vy *= 0.5;
          }
          if (b.y - r <= goalTop) { b.y = goalTop + r; b.vy = Math.abs(b.vy) * 0.5; }
          if (b.y + r >= goalBottom) { b.y = goalBottom - r; b.vy = -Math.abs(b.vy) * 0.5; }
          if (!ms.scored) {
            ms.scored = true;
            ms.goalScorer = 'player';
            ms.goalTimer = 1.0;
            p.score++;
            window.Sound?.play('score');
          }
        } else {
          // Solid boundary wall
          b.x = CANVAS_WIDTH - 20 - r;
          b.vx = -Math.abs(b.vx);
          window.Sound?.play('wall');
        }
      }

      // Paddle Collisions (Oriented Bounding Box)
      if (!ms.scored && ms.kickoffTimer <= 0) {
        this.checkPaddleBallCollision(p, b, true, 9.4, 0);

        let targetGoalY = 270 + (Math.random() - 0.5) * aimJitter;
        if (this.difficulty === 'hard') {
          targetGoalY = (b.y < 270) ? 210 : 330;
        } else if (this.difficulty === 'impossible') {
          targetGoalY = (p.y < 270) ? 345 : 195;
        }
        this.checkPaddleBallCollision(e, b, false, aiKickSpd, targetGoalY);
      }
    }

    // 5. Natural Rolling Turf Friction
    b.vx *= 0.988;
    b.vy *= 0.988;
  }

  updateBreakout(dt) {
    const bs = this.modeState;
    const speed = 8.0;

    // Classic up and down breakout: player paddle at bottom moves LEFT/RIGHT
    let dir = 0;
    if (this.keys['a'] || this.keys['arrowleft']) dir -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dir += 1;
    this.player.x += dir * speed;
    this.player.x = Math.max(20, Math.min(CANVAS_WIDTH - 20 - this.player.w, this.player.x));

    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Side Walls
    if (this.ball.x <= 20 + this.ball.size / 2) {
      this.ball.x = 20 + this.ball.size / 2;
      this.ball.vx = Math.abs(this.ball.vx);
      window.Sound?.play('wall');
    } else if (this.ball.x >= CANVAS_WIDTH - 20 - this.ball.size / 2) {
      this.ball.x = CANVAS_WIDTH - 20 - this.ball.size / 2;
      this.ball.vx = -Math.abs(this.ball.vx);
      window.Sound?.play('wall');
    }

    // Top Ceiling
    if (this.ball.y <= 38 + this.ball.size / 2) {
      this.ball.y = 38 + this.ball.size / 2;
      this.ball.vy = Math.abs(this.ball.vy);
      window.Sound?.play('wall');
    }

    // Bottom Paddle Bounce
    if (
      this.ball.vy > 0 &&
      this.ball.x + this.ball.size / 2 >= this.player.x &&
      this.ball.x - this.ball.size / 2 <= this.player.x + this.player.w &&
      this.ball.y + this.ball.size / 2 >= this.player.y &&
      this.ball.y - this.ball.size / 2 <= this.player.y + this.player.h
    ) {
      this.ball.y = this.player.y - this.ball.size / 2 - 1;
      const offset = (this.ball.x - (this.player.x + this.player.w / 2)) / (this.player.w / 2);
      this.ball.vy = -Math.abs(this.ball.vy);
      this.ball.vx = offset * 6.8;
      window.Sound?.play('hit');
    }

    // Bricks Collision
    let aliveCount = 0;
    for (const br of bs.bricks) {
      if (!br.alive) continue;
      aliveCount++;

      if (
        this.ball.x + this.ball.size / 2 >= br.x &&
        this.ball.x - this.ball.size / 2 <= br.x + br.w &&
        this.ball.y + this.ball.size / 2 >= br.y &&
        this.ball.y - this.ball.size / 2 <= br.y + br.h
      ) {
        br.alive = false;
        this.ball.vy = -this.ball.vy;
        window.Sound?.play('brick');
        break;
      }
    }

    if (aliveCount === 0) {
      this.showResult(true, 'ALL BRICKS DESTROYED!');
      return;
    }

    // Ball fell off bottom
    if (this.ball.y > CANVAS_HEIGHT + 20) {
      bs.lives--;
      window.Sound?.play('lose');
      if (bs.lives <= 0) {
        this.showResult(false, 'OUT OF LIVES!');
      } else {
        this.ball.x = this.player.x + this.player.w / 2;
        this.ball.y = CANVAS_HEIGHT - 80;
        this.ball.vx = 4.5 * (Math.random() < 0.5 ? 1 : -1);
        this.ball.vy = -5.5;
      }
    }
  }

  updateRacing(dt) {
    const rs = this.modeState;
    const p = rs.player;

    if (this.keys['a'] || this.keys['arrowleft']) p.angle -= 3.2 * dt;
    if (this.keys['d'] || this.keys['arrowright']) p.angle += 3.2 * dt;

    if (this.keys['w'] || this.keys['arrowup']) p.speed = Math.min(5.5, p.speed + 8.0 * dt);
    else if (this.keys['s'] || this.keys['arrowdown']) p.speed = Math.max(-2.5, p.speed - 8.0 * dt);
    else p.speed *= 0.96;

    p.x += Math.cos(p.angle) * p.speed;
    p.y += Math.sin(p.angle) * p.speed;

    // Solid outer boundary walls (cannot drive off edge)
    if (p.x < 95) { p.x = 95; p.speed *= -0.4; window.Sound?.play('hit'); }
    if (p.x > 865) { p.x = 865; p.speed *= -0.4; window.Sound?.play('hit'); }
    if (p.y < 65) { p.y = 65; p.speed *= -0.4; window.Sound?.play('hit'); }
    if (p.y > 475) { p.y = 475; p.speed *= -0.4; window.Sound?.play('hit'); }

    // Solid inner island barrier walls (cannot drive into middle)
    if (p.x >= 245 && p.x <= 715 && p.y >= 155 && p.y <= 385) {
      const dLeft = Math.abs(p.x - 245);
      const dRight = Math.abs(p.x - 715);
      const dTop = Math.abs(p.y - 155);
      const dBottom = Math.abs(p.y - 385);
      const minD = Math.min(dLeft, dRight, dTop, dBottom);
      if (minD === dLeft) p.x = 244;
      else if (minD === dRight) p.x = 716;
      else if (minD === dTop) p.y = 154;
      else p.y = 386;
      p.speed *= -0.4;
      window.Sound?.play('hit');
    }

    // Ball Racer AI Navigation
    const b = rs.ballRacer;
    const target = rs.waypoints[b.waypointIndex];
    const targetAngle = Math.atan2(target.y - b.y, target.x - b.x);

    let angleDiff = (targetAngle - b.angle) % (2 * Math.PI);
    if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    b.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 5.5 * dt);

    b.x += Math.cos(b.angle) * b.speed;
    b.y += Math.sin(b.angle) * b.speed;

    // Ensure ball stays inside track and doesn't glitch
    if (b.x < 105) b.x = 105;
    if (b.x > 855) b.x = 855;
    if (b.y < 75) b.y = 75;
    if (b.y > 465) b.y = 465;

    if (b.x >= 250 && b.x <= 710 && b.y >= 160 && b.y <= 380) {
      const dLeft = Math.abs(b.x - 250);
      const dRight = Math.abs(b.x - 710);
      const dTop = Math.abs(b.y - 160);
      const dBottom = Math.abs(b.y - 380);
      const minD = Math.min(dLeft, dRight, dTop, dBottom);
      if (minD === dLeft) b.x = 248;
      else if (minD === dRight) b.x = 712;
      else if (minD === dTop) b.y = 158;
      else b.y = 382;
    }

    const distToWp = Math.hypot(target.x - b.x, target.y - b.y);
    if (distToWp < 40) {
      b.waypointIndex = (b.waypointIndex + 1) % rs.waypoints.length;
      if (b.waypointIndex === 0) {
        b.laps++;
        if (b.laps >= rs.targetLaps) {
          this.showResult(false, 'BALL RACER WON THE RACE!');
          return;
        }
      }
    }

    // Finish line & checkpoints for player
    if (p.x >= 470 && p.x <= 510 && p.y >= 370) {
      if (rs.checkpointPassed) {
        rs.laps++;
        rs.checkpointPassed = false;
        window.Sound?.play('score');
        if (rs.laps >= rs.targetLaps) {
          this.showResult(true, 'PADDLE WON THE RACE (3 LAPS)!');
          return;
        }
      }
    }
    if (p.x >= 460 && p.x <= 510 && p.y <= 170) {
      rs.checkpointPassed = true;
    }
  }

  // ========================================================
  // RENDER DISPATCHER
  // ========================================================
  render() {
    const ctx = this.ctx;
    const mode = this.currentLevel ? this.currentLevel.mode : 'normal';

    // 3 FPS mode: normal speed physics, but visual updates throttled to 3 FPS (333ms)
    if (this.state === 'PLAYING' && mode === 'three_fps') {
      const now = performance.now();
      if (!this.modeState.lastRenderTime) {
        this.modeState.lastRenderTime = now;
        this.modeState.hasDrawnOnce = false;
      }
      const fpsInterval = this.difficulty === 'easy' ? 200 : (this.difficulty === 'hard' ? 500 : (this.difficulty === 'impossible' ? 1000 : 333));
      if (now - this.modeState.lastRenderTime < fpsInterval && this.modeState.hasDrawnOnce) {
        return; // Retain frame
      }
      this.modeState.lastRenderTime = now;
      this.modeState.hasDrawnOnce = true;
    }

    const isInverted = (mode === 'inverted');
    const isZoomed = (mode === 'zoomed_cam');

    const colWhite = isInverted ? '#000000' : '#ffffff';
    const colBlack = isInverted ? '#ffffff' : '#000000';

    ctx.fillStyle = colBlack;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (this.state === 'MENU') {
      return;
    }

    // Camera Zoom mode
    if (isZoomed) {
      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.scale(2.2, 2.2);
      ctx.translate(-this.ball.x, -this.ball.y);
    }

    if (mode === 'crossy') {
      this.renderCrossy(ctx, colWhite, colBlack);
    } else if (mode === 'pokebattle') {
      this.renderPokeBattle(ctx);
    } else if (mode === 'soccer') {
      this.renderSoccer(ctx, colWhite, colBlack);
    } else if (mode === 'breakout') {
      this.renderBreakout(ctx, colWhite, colBlack);
    } else if (mode === 'racing') {
      this.renderRacing(ctx, colWhite, colBlack);
    } else if (mode === 'be_the_ball') {
      this.renderBeTheBall(ctx, colWhite, colBlack);
    } else if (mode === 'dodgeball') {
      this.renderDodgeball(ctx, colWhite, colBlack);
    } else if (mode === 'circle_pong') {
      this.renderCirclePong(ctx, colWhite, colBlack);
    } else if (mode === 'mitosis' || mode === 'two_balls' || mode === 'three_balls') {
      this.renderMultiBall(ctx, colWhite, colBlack);
    } else if (mode === 'spinning') {
      this.renderSpinning(ctx, colWhite, colBlack);
    } else if (mode === 'looping') {
      this.renderLooping(ctx, colWhite, colBlack);
    } else if (mode === 'maze') {
      this.renderMaze(ctx, colWhite, colBlack);
    } else if (mode === 'geometry_dash') {
      this.renderGeometryDash(ctx, colWhite, colBlack);
    } else if (mode === 'pacman') {
      this.renderPacman(ctx, colWhite, colBlack);
    } else if (mode === 'blurry') {
      this.renderBlurry(ctx, colWhite, colBlack);
    } else if (mode === 'giant_arena') {
      this.renderGiantArena(ctx, colWhite, colBlack);
    } else if (mode === 'orbit_defense') {
      this.renderOrbitDefense(ctx, colWhite, colBlack);
    } else if (mode === 'top_down_3d') {
      this.renderTopDown3D(ctx, colWhite, colBlack);
    } else if (mode === 'softbody') {
      this.renderSoftbody(ctx, colWhite, colBlack);
    } else if (mode === 'first_person_3d') {
      this.renderFirstPerson3D(ctx, colWhite, colBlack);
    } else if (mode === 'gravity_well') {
      this.renderGravityWell(ctx, colWhite, colBlack);
    } else if (mode === 'four_player') {
      this.renderFourPlayer(ctx, colWhite, colBlack);
    } else if (mode === 'drunk_pong') {
      this.renderDrunkPong(ctx, colWhite, colBlack);
    } else if (mode === 'paddle_dodge') {
      this.renderPaddleDodge(ctx, colWhite, colBlack);
    } else if (mode === 'cube_paddle') {
      this.renderCubePaddle(ctx, colWhite, colBlack);
    } else if (mode === 'megalovania') {
      this.renderMegalovania(ctx, colWhite, colBlack);
    } else if (mode === 'flashing_bars') {
      this.renderFlashingBars(ctx, colWhite, colBlack);
    } else if (mode === 'try_to_lose') {
      this.renderTryToLose(ctx, colWhite, colBlack);
    } else if (mode === 'tall_court') {
      this.renderTallCourt(ctx, colWhite, colBlack);
    } else if (mode === 'beach_ball') {
      this.renderBeachBall(ctx, colWhite, colBlack);
    } else if (mode === 'draw_paddle') {
      this.renderDrawPaddle(ctx, colWhite, colBlack);
    } else if (mode === 'four_d') {
      this.renderFourD(ctx, colWhite, colBlack);
    } else if (mode === 'subway_surf') {
      this.renderSubwaySurf(ctx, colWhite, colBlack);
    } else if (mode === 'speed_laser') {
      this.renderSpeedLaser(ctx, colWhite, colBlack);
    } else if (mode === 'pinball') {
      this.renderPinball(ctx, colWhite, colBlack);
    } else if (mode === 'shrinking_ball') {
      this.renderShrinkingBall(ctx, colWhite, colBlack);
    } else if (mode === 'second_person') {
      this.renderSecondPerson(ctx, colWhite, colBlack);
    } else if (mode === 'roguelike') {
      this.renderRoguelike(ctx, colWhite, colBlack);
    } else if (mode === 'superhot') {
      this.renderSuperhot(ctx, colWhite, colBlack);
    } else if (mode === 'portal') {
      this.renderPortal(ctx, colWhite, colBlack);
    } else if (mode === 'tetris') {
      this.renderTetris(ctx, colWhite, colBlack);
    } else if (mode === 'singularity') {
      this.renderSingularity(ctx, colWhite, colBlack);
    } else if (mode === 'excavator') {
      this.renderExcavator(ctx, colWhite, colBlack);
    } else if (mode === 'invaders') {
      this.renderInvaders(ctx, colWhite, colBlack);
    } else if (mode === 'airhockey') {
      this.renderAirHockey(ctx, colWhite, colBlack);
    } else if (mode === 'lightcycle') {
      this.renderLightCycle(ctx, colWhite, colBlack);
    } else if (mode === 'gravity_flip') {
      this.renderGravityFlip(ctx, colWhite, colBlack);
    } else if (mode === 'polarity') {
      this.renderPolarity(ctx, colWhite, colBlack);
    } else if (mode === 'snake_pong') {
      this.renderSnakePong(ctx, colWhite, colBlack);
    } else if (mode === 'prism' || mode === 'chrono') {
      this.renderChrono(ctx, colWhite, colBlack);
    } else if (mode === 'asteroids_pong') {
      this.renderAsteroidsPong(ctx, colWhite, colBlack);
    } else if (mode === 'tractor_beam' || mode === 'time_bomb') {
      this.renderTimeBomb(ctx, colWhite, colBlack);
    } else if (mode === 'bullet_hell') {
      this.renderBulletHell(ctx, colWhite, colBlack);
    } else {
      this.renderNormal(ctx, colWhite, colBlack);
    }

    if (isZoomed) {
      ctx.restore();
    }

    // Blaster laser overlay
    if (mode === 'blaster') {
      this.renderBlasterOverlay(ctx);
    }

    // Flashlight overlay
    if (mode === 'flashlight') {
      this.renderFlashlightOverlay(ctx);
    }

    // Ensure HUD / Score is cleanly visible on top for Zoom Cam and Flashlight
    if (isZoomed || mode === 'flashlight') {
      ctx.fillStyle = colWhite;
      ctx.font = '28px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.player.score}`, CANVAS_WIDTH / 2 - 80, 80);
      ctx.fillText(`${this.enemy.score}`, CANVAS_WIDTH / 2 + 80, 80);
    }

    // Math Pong question overlay
    if (mode === 'math_pong' && this.modeState.questionActive) {
      this.renderMathOverlay(ctx);
    }

    // Subtle top-right difficulty indicator across all levels
    if (mode !== 'roguelike') {
      ctx.save();
      ctx.font = '8px "Press Start 2P"';
      ctx.fillStyle = isInverted ? '#666666' : '#888888';
      ctx.textAlign = 'right';
      ctx.fillText(`DIFF: ${this.difficulty.toUpperCase()}`, CANVAS_WIDTH - 24, 22);
      ctx.restore();
    }
  }

  renderNormal(ctx, colWhite, colBlack) {
    const mode = this.currentLevel.mode;
    const isSphere = (mode === 'sphere_paddle');
    const isCurved = (mode === 'curved');

    // Walls
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // Center Net
    const dashW = 4;
    const dashH = 14;
    const gap = 12;
    for (let y = 44; y < CANVAS_HEIGHT - 38; y += dashH + gap) {
      ctx.fillRect(CANVAS_WIDTH / 2 - dashW / 2, y, dashW, dashH);
    }

    // Scoreboard (rendered outside zoom coordinate space for zoomed_cam)
    if (mode !== 'zoomed_cam') {
      ctx.font = '28px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.player.score}`, CANVAS_WIDTH / 2 - 80, 80);
      ctx.fillText(`${this.enemy.score}`, CANVAS_WIDTH / 2 + 80, 80);
    }

    // Paddles
    if (isSphere) {
      // Square paddles size of normal ball
      ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
      ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);

      // Rotating paddle-ball with rotational physics
      ctx.save();
      ctx.translate(this.ball.x, this.ball.y);
      ctx.rotate(this.ball.angle || 0);
      ctx.fillRect(-this.ball.w / 2, -this.ball.h / 2, this.ball.w, this.ball.h);
      ctx.restore();
    } else if (isCurved) {
      // Concave parabola scoops open towards court center
      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y);
      ctx.lineTo(this.player.x + 14, this.player.y);
      ctx.quadraticCurveTo(this.player.x + 1, this.player.y + this.player.h / 2, this.player.x + 14, this.player.y + this.player.h);
      ctx.lineTo(this.player.x, this.player.y + this.player.h);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(this.enemy.x + this.enemy.w, this.enemy.y);
      ctx.lineTo(this.enemy.x + this.enemy.w - 14, this.enemy.y);
      ctx.quadraticCurveTo(this.enemy.x + this.enemy.w - 1, this.enemy.y + this.enemy.h / 2, this.enemy.x + this.enemy.w - 14, this.enemy.y + this.enemy.h);
      ctx.lineTo(this.enemy.x + this.enemy.w, this.enemy.y + this.enemy.h);
      ctx.closePath();
      ctx.fill();

      ctx.fillRect(
        Math.round(this.ball.x - this.ball.size / 2),
        Math.round(this.ball.y - this.ball.size / 2),
        this.ball.size,
        this.ball.size
      );
    } else {
      ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
      ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);

      ctx.fillRect(
        Math.round(this.ball.x - this.ball.size / 2),
        Math.round(this.ball.y - this.ball.size / 2),
        this.ball.size,
        this.ball.size
      );
    }
  }

  renderDodgeball(ctx, colWhite, colBlack) {
    const ds = this.modeState;

    // Walls
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // Center divider line
    ctx.strokeStyle = '#282828';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 38);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 38);
    ctx.stroke();
    ctx.setLineDash([]);

    // HUD: Player Lives & AI Lives
    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'left';
    ctx.fillText(`PLAYER LIVES: ${ds.playerLives}`, 40, 25);
    ctx.textAlign = 'center';
    ctx.fillText('DODGEBALL', CANVAS_WIDTH / 2, 25);
    ctx.textAlign = 'right';
    ctx.fillText(`AI LIVES: ${ds.enemyLives}`, CANVAS_WIDTH - 40, 25);

    // Player Paddle (left, with invulnerability flicker)
    if (!ds.playerHitCooldown || ds.playerHitCooldown <= 0 || Math.floor(Date.now() / 90) % 2 === 0) {
      ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    }

    // Enemy Paddle (right, with invulnerability flicker)
    if (!ds.enemyHitCooldown || ds.enemyHitCooldown <= 0 || Math.floor(Date.now() / 90) % 2 === 0) {
      ctx.fillRect(this.enemy.x, this.enemy.y, this.enemy.w, this.enemy.h);
    }

    // 5 Red Dodgeballs
    for (const b of ds.dodgeballs) {
      ctx.fillStyle = '#ff3333';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  renderMultiBall(ctx, colWhite, colBlack) {
    // Walls
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // Center Net
    for (let y = 44; y < CANVAS_HEIGHT - 38; y += 26) {
      ctx.fillRect(CANVAS_WIDTH / 2 - 2, y, 4, 14);
    }

    // Scoreboard
    const isMitosis = (this.currentLevel && this.currentLevel.mode === 'mitosis');
    ctx.font = isMitosis ? '22px "Press Start 2P"' : '28px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, CANVAS_WIDTH / 2 - 80, 80);
    ctx.fillText(`${this.enemy.score}`, CANVAS_WIDTH / 2 + 80, 80);

    if (isMitosis) {
      const targetScore = this.getAiConfig().mitosisTargetScore || 1000;
      const ballCount = this.modeState.balls ? this.modeState.balls.length : 1;
      ctx.font = '8px "Press Start 2P"';
      ctx.fillStyle = '#888888';
      ctx.fillText(`FIRST TO ${targetScore} | BALLS: ${ballCount}/2000`, CANVAS_WIDTH / 2, 22);
      ctx.fillStyle = colWhite;
    }

    // Paddles
    ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    ctx.fillRect(this.enemy.x, this.enemy.y, this.enemy.w, this.enemy.h);

    // Balls
    for (const b of this.modeState.balls) {
      ctx.fillRect(
        Math.round(b.x - b.size / 2),
        Math.round(b.y - b.size / 2),
        b.size,
        b.size
      );
    }
  }

  renderBlasterOverlay(ctx) {
    const bs = this.modeState;
    ctx.fillStyle = '#ffffff';

    for (const b of bs.bullets) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    // Stun indicator
    if (this.player.stunTimer > 0) {
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('*STUNNED*', this.player.x + 6, this.player.y - 8);
    }
    if (this.enemy.stunTimer > 0) {
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('*STUNNED*', this.enemy.x + 6, this.enemy.y - 8);
    }
  }

  renderCirclePong(ctx, colWhite, colBlack) {
    const cs = this.modeState;
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    const R = cs.radius;

    // Score
    ctx.fillStyle = colWhite;
    ctx.font = '24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score} - ${this.enemy.score}`, cx, 40);

    // Center subtle reticle
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy); ctx.lineTo(cx + 16, cy);
    ctx.moveTo(cx, cy - 16); ctx.lineTo(cx, cy + 16);
    ctx.stroke();

    // Sphere Arena Ring: More than a full circle (> 360 deg overlapping coil)
    ctx.strokeStyle = '#383838';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2, false);
    ctx.stroke();

    // Overlapping spiral loop exceeding 360 deg (-0.25*PI to 2.35*PI = 468 deg)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, R, -0.25 * Math.PI, 2.35 * Math.PI, false);
    ctx.stroke();

    // Outer orbital concentric ring exceeding 360 deg
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 8, -0.15 * Math.PI, 2.25 * Math.PI, false);
    ctx.stroke();

    // Decorative retro node points at coil ends
    ctx.fillStyle = '#888888';
    ctx.fillRect(Math.round(cx + R * Math.cos(-0.25 * Math.PI) - 3), Math.round(cy + R * Math.sin(-0.25 * Math.PI) - 3), 6, 6);
    ctx.fillRect(Math.round(cx + R * Math.cos(2.35 * Math.PI) - 3), Math.round(cy + R * Math.sin(2.35 * Math.PI) - 3), 6, 6);

    // Curved Player Paddle (Left arc)
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, R, cs.playerAngle - cs.arcLen / 2, cs.playerAngle + cs.arcLen / 2);
    ctx.stroke();

    // Curved Enemy Paddle (Right arc)
    ctx.beginPath();
    ctx.arc(cx, cy, R, cs.enemyAngle - cs.arcLen / 2, cs.enemyAngle + cs.arcLen / 2);
    ctx.stroke();

    // Ball
    ctx.fillStyle = colWhite;
    ctx.fillRect(Math.round(this.ball.x - 5), Math.round(this.ball.y - 5), 10, 10);
  }

  renderFlashlightOverlay(ctx) {
    ctx.save();
    // 1. Black shroud with circular cutout hole centered on the ball
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.arc(this.ball.x, this.ball.y, 140, 0, Math.PI * 2, true);
    ctx.fill();

    // 2. Faint circle beam rim around the flashlight zone
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, 140, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  renderMathOverlay(ctx) {
    const q = this.modeState.curQuestion;
    if (!q) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.fillRect(CANVAS_WIDTH / 2 - 200, 180, 400, 180);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(CANVAS_WIDTH / 2 - 200, 180, 400, 180);

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('MATH POP QUIZ!', CANVAS_WIDTH / 2, 215);

    ctx.font = '18px "Press Start 2P"';
    ctx.fillText(`${q.qText} = ?`, CANVAS_WIDTH / 2, 255);

    ctx.font = '10px "Press Start 2P"';
    ctx.fillText(`[1] ${q.choices[0]}   [2] ${q.choices[1]}   [3] ${q.choices[2]}`, CANVAS_WIDTH / 2, 305);

    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#888888';
    ctx.fillText(`TIME LEFT: ${Math.max(0, this.modeState.mathTimer).toFixed(1)}s`, CANVAS_WIDTH / 2, 335);
  }

  // --- Retained custom renderers ---
  renderBeTheBall(ctx, colWhite, colBlack) {
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    ctx.fillRect(0, 34, 4, 140);
    ctx.fillRect(0, CANVAS_HEIGHT - 174, 4, 140);
    ctx.fillRect(CANVAS_WIDTH - 4, 34, 4, 140);
    ctx.fillRect(CANVAS_WIDTH - 4, CANVAS_HEIGHT - 174, 4, 140);

    ctx.font = '24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(`GOALS: ${this.player.score} / 5`, CANVAS_WIDTH / 2, 75);

    const sL = this.modeState.leftSentinel;
    const sR = this.modeState.rightSentinel;
    ctx.fillRect(sL.x, sL.y, sL.w, sL.h);
    ctx.fillRect(sR.x, sR.y, sR.w, sR.h);

    ctx.fillRect(this.player.x, this.player.y, this.player.size, this.player.size);
  }

  renderCrossy(ctx, colWhite, colBlack) {
    const cs = this.modeState;
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 45);
    ctx.fillStyle = colWhite;
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(`STAGE: ${Math.min(5, cs.score + 1)} / 5  (CROSSINGS: ${cs.score} / 5)`, CANVAS_WIDTH / 2, 28);

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    for (const lane of cs.lanes) {
      ctx.beginPath();
      ctx.moveTo(0, lane.y + 20);
      ctx.lineTo(CANVAS_WIDTH, lane.y + 20);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = colWhite;
    for (const lane of cs.lanes) {
      for (const p of lane.paddles) {
        ctx.fillRect(Math.round(p.x), lane.y, lane.w, lane.h);
      }
    }
    ctx.fillRect(Math.round(cs.ball.x), Math.round(cs.ball.y), cs.ball.size, cs.ball.size);
  }

  renderPokeBattle(ctx) {
    const pb = this.modeState.pb;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Enemy Platform (Wild Pong Ball)
    ctx.beginPath();
    ctx.ellipse(710, 155, 80, 18, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Player Platform (Paddle) - placed cleanly above dialogue box to prevent any overlap
    ctx.beginPath();
    ctx.ellipse(220, 320, 90, 20, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Wild Pong Ball sprite
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(695, 115, 30, 30);

    // Paddle sprite standing on platform
    ctx.fillRect(212, 235, 16, 75);
    if (pb.playerDefend) {
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(202, 225, 36, 95);
      ctx.setLineDash([]);
    }

    // Enemy HP Box (top left) - clean spacing with zero text/bar overlap
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(60, 45, 320, 72);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText('WILD PONG BALL', 75, 70);
    ctx.fillText('HP', 75, 96);
    ctx.strokeRect(105, 86, 140, 12);
    ctx.fillRect(107, 88, Math.floor(136 * (pb.enemyHp / 100)), 8);
    ctx.fillText(`${pb.enemyHp}/100`, 258, 96);

    // Player HP Box (mid right) - clean spacing with zero text/bar overlap
    ctx.strokeRect(580, 215, 320, 72);
    ctx.fillText('PADDLE', 595, 240);
    ctx.fillText('HP', 595, 266);
    ctx.strokeRect(625, 256, 140, 12);
    ctx.fillRect(627, 258, Math.floor(136 * (pb.playerHp / 100)), 8);
    ctx.fillText(`${pb.playerHp}/100`, 778, 266);

    // Battle Dialogue Box at bottom
    ctx.strokeRect(50, 370, 860, 145);
    ctx.beginPath();
    ctx.moveTo(500, 370);
    ctx.lineTo(500, 515);
    ctx.stroke();

    ctx.fillText(pb.message, 75, 420);
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#888888';
    ctx.fillText(pb.sub, 75, 460);

    const moves = [
      { name: '[1] POWER SMASH', x: 515, y: 382, w: 180, h: 54 },
      { name: '[2] ENGLISH CURVE', x: 710, y: 382, w: 180, h: 54 },
      { name: '[3] DEFENSIVE BLOCK', x: 515, y: 445, w: 180, h: 54 },
      { name: '[4] HYPER RALLY', x: 710, y: 445, w: 180, h: 54 }
    ];
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px "Press Start 2P"';
    moves.forEach(m => {
      ctx.strokeRect(m.x, m.y, m.w, m.h);
      ctx.fillText(m.name, m.x + 8, m.y + 32);
    });
  }

  renderSoccer(ctx, colWhite, colBlack) {
    const ms = this.modeState;
    const goalTop = 170;
    const goalBottom = 370;

    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;

    // 1. Pitch Boundary Lines
    // Top and Bottom touchlines
    ctx.beginPath();
    ctx.moveTo(20, 34);
    ctx.lineTo(CANVAS_WIDTH - 20, 34);
    ctx.moveTo(20, CANVAS_HEIGHT - 34);
    ctx.lineTo(CANVAS_WIDTH - 20, CANVAS_HEIGHT - 34);

    // Left Goal Line (broken at goal mouth)
    ctx.moveTo(20, 34);
    ctx.lineTo(20, goalTop);
    ctx.moveTo(20, goalBottom);
    ctx.lineTo(20, CANVAS_HEIGHT - 34);

    // Right Goal Line (broken at goal mouth)
    ctx.moveTo(CANVAS_WIDTH - 20, 34);
    ctx.lineTo(CANVAS_WIDTH - 20, goalTop);
    ctx.moveTo(CANVAS_WIDTH - 20, goalBottom);
    ctx.lineTo(CANVAS_WIDTH - 20, CANVAS_HEIGHT - 34);
    ctx.stroke();

    // Subtle dashed line across goal mouths
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, goalTop);
    ctx.lineTo(20, goalBottom);
    ctx.moveTo(CANVAS_WIDTH - 20, goalTop);
    ctx.lineTo(CANVAS_WIDTH - 20, goalBottom);
    ctx.stroke();
    ctx.restore();

    // 2. Goal Nets (Retro hatched netting behind goal lines)
    // Left Net
    ctx.strokeRect(4, goalTop, 16, goalBottom - goalTop);
    ctx.save();
    ctx.lineWidth = 1;
    for (let gy = goalTop + 15; gy < goalBottom; gy += 15) {
      ctx.beginPath();
      ctx.moveTo(4, gy);
      ctx.lineTo(20, gy);
      ctx.stroke();
    }
    for (let gx = 8; gx < 20; gx += 4) {
      ctx.beginPath();
      ctx.moveTo(gx, goalTop);
      ctx.lineTo(gx, goalBottom);
      ctx.stroke();
    }
    // Right Net
    ctx.strokeRect(CANVAS_WIDTH - 20, goalTop, 16, goalBottom - goalTop);
    for (let gy = goalTop + 15; gy < goalBottom; gy += 15) {
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH - 20, gy);
      ctx.lineTo(CANVAS_WIDTH - 4, gy);
      ctx.stroke();
    }
    for (let gx = CANVAS_WIDTH - 16; gx < CANVAS_WIDTH - 4; gx += 4) {
      ctx.beginPath();
      ctx.moveTo(gx, goalTop);
      ctx.lineTo(gx, goalBottom);
      ctx.stroke();
    }
    ctx.restore();

    // Goal Posts (Solid white post blocks)
    ctx.fillStyle = colWhite;
    ctx.fillRect(18, goalTop - 2, 4, 4);
    ctx.fillRect(18, goalBottom - 2, 4, 4);
    ctx.fillRect(CANVAS_WIDTH - 22, goalTop - 2, 4, 4);
    ctx.fillRect(CANVAS_WIDTH - 22, goalBottom - 2, 4, 4);

    // 3. Pitch Markings: Penalty Boxes & Goal Areas
    ctx.lineWidth = 2;
    // Left Penalty Box & 6-Yard Box
    ctx.strokeRect(20, 135, 110, 270);
    ctx.strokeRect(20, 195, 40, 150);
    // Right Penalty Box & 6-Yard Box
    ctx.strokeRect(CANVAS_WIDTH - 130, 135, 110, 270);
    ctx.strokeRect(CANVAS_WIDTH - 60, 195, 40, 150);

    // Penalty spots
    ctx.beginPath();
    ctx.arc(85, CANVAS_HEIGHT / 2, 3, 0, Math.PI * 2);
    ctx.arc(CANVAS_WIDTH - 85, CANVAS_HEIGHT / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Penalty Arcs
    ctx.beginPath();
    ctx.arc(85, CANVAS_HEIGHT / 2, 40, -Math.PI * 0.28, Math.PI * 0.28);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 85, CANVAS_HEIGHT / 2, 40, Math.PI * 0.72, Math.PI * 1.28);
    ctx.stroke();

    // Halfway Line & Center Circle
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 34);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 34);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Center Spot
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // 4. Top HUD Score Display
    ctx.font = '22px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score} - ${this.enemy.score}`, CANVAS_WIDTH / 2, 25);

    // 5. Player Paddle (Solid rotated paddle)
    const pcx = this.player.x + this.player.w / 2;
    const pcy = this.player.y + this.player.h / 2;
    ctx.save();
    ctx.translate(pcx, pcy);
    ctx.rotate(this.player.angle || 0);
    ctx.fillStyle = colWhite;
    ctx.fillRect(-this.player.w / 2, -this.player.h / 2, this.player.w, this.player.h);
    // Direction indicator notch on front
    ctx.fillStyle = colBlack;
    ctx.fillRect(this.player.w / 2 - 3, -4, 3, 8);
    ctx.restore();

    // 6. AI Paddle (Solid rotated paddle)
    const ecx = this.enemy.x + this.enemy.w / 2;
    const ecy = this.enemy.y + this.enemy.h / 2;
    ctx.save();
    ctx.translate(ecx, ecy);
    ctx.rotate(this.enemy.angle || Math.PI);
    ctx.fillStyle = colWhite;
    ctx.fillRect(-this.enemy.w / 2, -this.enemy.h / 2, this.enemy.w, this.enemy.h);
    ctx.fillStyle = colBlack;
    ctx.fillRect(this.enemy.w / 2 - 3, -4, 3, 8);
    ctx.restore();

    // 7. Soccer Ball (1-bit retro soccer texture)
    const br = this.ball.size / 2;
    ctx.fillStyle = colWhite;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, br, 0, Math.PI * 2);
    ctx.fill();
    // Inner pentagon seams in black
    ctx.strokeStyle = colBlack;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const px = this.ball.x + Math.cos(a) * (br * 0.45);
      const py = this.ball.y + Math.sin(a) * (br * 0.45);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(this.ball.x + Math.cos(a) * (br * 0.45), this.ball.y + Math.sin(a) * (br * 0.45));
      ctx.lineTo(this.ball.x + Math.cos(a) * br, this.ball.y + Math.sin(a) * br);
      ctx.stroke();
    }

    // 8. Goal Celebration Banner / Kickoff prompt
    if (ms && ms.goalTimer > 0) {
      ctx.save();
      const bannerW = 260;
      const bannerH = 74;
      const bx = (CANVAS_WIDTH - bannerW) / 2;
      const by = (CANVAS_HEIGHT - bannerH) / 2;

      ctx.fillStyle = colBlack;
      ctx.fillRect(bx, by, bannerW, bannerH);
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, by, bannerW, bannerH);
      ctx.strokeRect(bx + 4, by + 4, bannerW - 8, bannerH - 8);

      ctx.fillStyle = colWhite;
      ctx.font = '24px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('GOAL!', CANVAS_WIDTH / 2, by + 34);

      ctx.font = '9px "Press Start 2P"';
      const scorerText = ms.goalScorer === 'player' ? 'PLAYER SCORED!' : 'OPPONENT SCORED!';
      ctx.fillText(scorerText, CANVAS_WIDTH / 2, by + 56);
      ctx.restore();
    } else if (ms && ms.kickoffTimer > 0) {
      ctx.save();
      ctx.fillStyle = colWhite;
      ctx.font = '10px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('KICKOFF', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
      ctx.restore();
    }
  }

  renderBreakout(ctx, colWhite, colBlack) {
    const bs = this.modeState;
    ctx.fillStyle = colWhite;

    // Side walls and ceiling for classic vertical Breakout
    ctx.fillRect(0, 34, 20, CANVAS_HEIGHT - 34);
    ctx.fillRect(CANVAS_WIDTH - 20, 34, 20, CANVAS_HEIGHT - 34);
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);

    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(`LIVES: ${bs.lives}`, 40, 25);

    // Horizontal bottom paddle
    ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);

    // Ball
    ctx.fillRect(
      Math.round(this.ball.x - this.ball.size / 2),
      Math.round(this.ball.y - this.ball.size / 2),
      this.ball.size,
      this.ball.size
    );

    // Bricks across top
    for (const br of bs.bricks) {
      if (!br.alive) continue;
      ctx.fillStyle = colWhite;
      ctx.fillRect(br.x, br.y, br.w, br.h);
      ctx.strokeStyle = colBlack;
      ctx.lineWidth = 1;
      ctx.strokeRect(br.x, br.y, br.w, br.h);
    }
  }

  renderRacing(ctx, colWhite, colBlack) {
    const rs = this.modeState;

    // Solid outer barrier walls
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 4;
    ctx.strokeRect(80, 50, 800, 440);

    // Solid inner island barrier (cannot cut through)
    ctx.fillStyle = '#161616';
    ctx.fillRect(260, 170, 440, 200);
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 4;
    ctx.strokeRect(260, 170, 440, 200);

    ctx.fillStyle = '#444444';
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('BARRIER', 480, 275);

    // Start / finish line
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(480, 370);
    ctx.lineTo(480, 490);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = colWhite;
    ctx.font = '11px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(`PADDLE: LAP ${Math.min(3, rs.laps + 1)}/3  |  BALL: LAP ${Math.min(3, rs.ballRacer.laps + 1)}/3`, CANVAS_WIDTH / 2, 35);

    // Ball Racer (AI)
    const b = rs.ballRacer;
    ctx.fillStyle = colWhite;
    ctx.fillRect(Math.round(b.x - 7), Math.round(b.y - 7), 14, 14);

    // Player Paddle
    const p = rs.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }

  // --- SPINNING ARENA MODE ---
  updateSpinning(dt) {
    const factor = this.getAiConfig().factor || 1.0;
    this.modeState.arenaAngle += 0.35 * factor * dt;
    this.modeState.paddleAngle += 0.8 * factor * dt;
    this.modeState.ballAngle += 2.5 * factor * dt;
    this.updateNormal(dt);
  }

  renderSpinning(ctx, colWhite, colBlack) {
    const cs = this.modeState;
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;

    // Score
    ctx.fillStyle = colWhite;
    ctx.font = '24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score} - ${this.enemy.score}`, cx, 40);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(cs.arenaAngle);
    ctx.translate(-cx, -cy);

    // Court boundaries
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 34, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 68);

    // Center Net
    ctx.fillStyle = colWhite;
    for (let y = 44; y < CANVAS_HEIGHT - 38; y += 26) {
      ctx.fillRect(cx - 2, y, 4, 14);
    }

    // Rotating Player Paddle
    ctx.save();
    ctx.translate(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2);
    ctx.rotate(cs.paddleAngle);
    ctx.fillRect(-this.player.w / 2, -this.player.h / 2, this.player.w, this.player.h);
    ctx.restore();

    // Rotating Enemy Paddle
    ctx.save();
    ctx.translate(this.enemy.x + this.enemy.w / 2, this.enemy.y + this.enemy.h / 2);
    ctx.rotate(-cs.paddleAngle);
    ctx.fillRect(-this.enemy.w / 2, -this.enemy.h / 2, this.enemy.w, this.enemy.h);
    ctx.restore();

    // Spinning Ball (Solid White Pong Ball)
    ctx.save();
    ctx.translate(this.ball.x, this.ball.y);
    ctx.rotate(cs.ballAngle);
    ctx.fillStyle = colWhite;
    ctx.fillRect(-this.ball.size / 2, -this.ball.size / 2, this.ball.size, this.ball.size);
    ctx.restore();

    ctx.restore();
  }

  // --- LOOPING PONG MODE ---
  resetLoopingBall(serveToPlayer = true) {
    const aiCfg = this.getAiConfig();
    this.ball.x = CANVAS_WIDTH / 2;
    this.ball.y = CANVAS_HEIGHT / 2;
    this.ball.size = 12;
    this.ball.speed = aiCfg.loopingBallSpeed;
    const dirX = serveToPlayer ? -1 : 1;
    const signY = Math.random() < 0.5 ? -1 : 1;
    const angle = signY * (0.55 + Math.random() * 0.45);
    this.ball.vx = Math.cos(angle) * this.ball.speed * dirX;
    this.ball.vy = Math.sin(angle) * this.ball.speed;
  }

  updateLooping(dt) {
    // 1. Player movement with top/bottom toroidal wrap (W/S or Arrow keys)
    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * (this.player.speed || 6.5);
    while (this.player.y < 0) this.player.y += CANVAS_HEIGHT;
    while (this.player.y >= CANVAS_HEIGHT) this.player.y -= CANVAS_HEIGHT;

    // 2. Enemy AI with toroidal geodesic targeting
    let diff = this.ball.y - (this.enemy.y + this.enemy.h / 2);
    if (diff > CANVAS_HEIGHT / 2) diff -= CANVAS_HEIGHT;
    else if (diff < -CANVAS_HEIGHT / 2) diff += CANVAS_HEIGHT;

    const aiSpeed = this.getAiConfig().loopingAiSpeed;

    if (Math.abs(diff) > 6) {
      this.enemy.y += Math.sign(diff) * Math.min(Math.abs(diff), aiSpeed);
    }
    while (this.enemy.y < 0) this.enemy.y += CANVAS_HEIGHT;
    while (this.enemy.y >= CANVAS_HEIGHT) this.enemy.y -= CANVAS_HEIGHT;

    // 3. Ball movement & toroidal wrapping
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    while (this.ball.y < 0) this.ball.y += CANVAS_HEIGHT;
    while (this.ball.y >= CANVAS_HEIGHT) this.ball.y -= CANVAS_HEIGHT;

    // 4. Paddle Collisions (Accounting for wrapped rectangles)
    const checkPaddleCollision = (paddle, isPlayer) => {
      const halfSize = this.ball.size / 2;

      const paddleBoxes = [
        { x: paddle.x, y: paddle.y, w: paddle.w, h: paddle.h }
      ];
      if (paddle.y + paddle.h > CANVAS_HEIGHT) {
        paddleBoxes.push({ x: paddle.x, y: paddle.y - CANVAS_HEIGHT, w: paddle.w, h: paddle.h });
      }

      const ballPositions = [{ x: this.ball.x, y: this.ball.y }];
      if (this.ball.y < this.ball.size) {
        ballPositions.push({ x: this.ball.x, y: this.ball.y + CANVAS_HEIGHT });
      } else if (this.ball.y > CANVAS_HEIGHT - this.ball.size) {
        ballPositions.push({ x: this.ball.x, y: this.ball.y - CANVAS_HEIGHT });
      }

      for (const bp of ballPositions) {
        for (const pb of paddleBoxes) {
          if (
            bp.x + halfSize >= pb.x &&
            bp.x - halfSize <= pb.x + pb.w &&
            bp.y + halfSize >= pb.y &&
            bp.y - halfSize <= pb.y + pb.h
          ) {
            const hitOffset = (bp.y - (pb.y + pb.h / 2)) / (pb.h / 2);
            const clampedOffset = Math.max(-1, Math.min(1, hitOffset));
            const bounceAngle = clampedOffset * (Math.PI / 3);

            const aiCfg = this.getAiConfig();
            const speedUp = aiCfg.ballSpeedUp || 1.05;
            const maxSpd = aiCfg.maxBallSpeed || 16.0;
            const curSpeed = Math.min(maxSpd, Math.hypot(this.ball.vx, this.ball.vy) * speedUp + 0.25);
            const dirX = isPlayer ? 1 : -1;

            this.ball.vx = Math.cos(bounceAngle) * curSpeed * dirX;
            this.ball.vy = Math.sin(bounceAngle) * curSpeed;

            if (isPlayer) {
              this.ball.x = pb.x + pb.w + halfSize;
            } else {
              this.ball.x = pb.x - halfSize;
            }

            window.Sound?.play('paddle');
            return true;
          }
        }
      }
      return false;
    };

    if (this.ball.vx < 0) {
      checkPaddleCollision(this.player, true);
    } else {
      checkPaddleCollision(this.enemy, false);
    }

    // 5. Scoring
    const targetScore = (this.currentLevel && this.currentLevel.targetScore) || 5;
    if (this.ball.x < 0) {
      this.enemy.score++;
      window.Sound?.play('lose');
      if (this.enemy.score >= targetScore) {
        this.showResult(false, `ENEMY SCORED ${targetScore}! DEFEAT!`);
        return;
      }
      this.resetLoopingBall(true);
    } else if (this.ball.x > CANVAS_WIDTH) {
      this.player.score++;
      window.Sound?.play('score');
      if (this.player.score >= targetScore) {
        this.showResult(true, `VICTORY! ${targetScore} POINTS SCORED!`);
        return;
      }
      this.resetLoopingBall(false);
    }
  }

  renderLooping(ctx, colWhite, colBlack) {
    const cx = CANVAS_WIDTH / 2;

    // Center Net
    ctx.fillStyle = colWhite;
    for (let y = 8; y < CANVAS_HEIGHT; y += 24) {
      ctx.fillRect(cx - 2, y, 4, 14);
    }

    // Warp Edge Portals (Top and Bottom dashed markers)
    for (let x = 8; x < CANVAS_WIDTH - 8; x += 32) {
      ctx.fillRect(x, 2, 16, 2);
      ctx.fillRect(x + 4, 6, 8, 2);
      ctx.fillRect(x, CANVAS_HEIGHT - 4, 16, 2);
      ctx.fillRect(x + 4, CANVAS_HEIGHT - 8, 8, 2);
    }

    // Score HUD
    ctx.fillStyle = colWhite;
    ctx.font = '28px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}   ${this.enemy.score}`, cx, 52);

    // Wrapped Paddle Renderer
    const drawWrappedPaddle = (paddle) => {
      ctx.fillStyle = colWhite;
      ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
      if (paddle.y + paddle.h > CANVAS_HEIGHT) {
        ctx.fillRect(paddle.x, paddle.y - CANVAS_HEIGHT, paddle.w, paddle.h);
      }
    };

    drawWrappedPaddle(this.player);
    drawWrappedPaddle(this.enemy);

    // Ball + Seam Wrap Clone
    const halfSize = this.ball.size / 2;
    ctx.fillStyle = colWhite;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, halfSize, 0, Math.PI * 2);
    ctx.fill();

    if (this.ball.y < halfSize * 2) {
      ctx.beginPath();
      ctx.arc(this.ball.x, this.ball.y + CANVAS_HEIGHT, halfSize, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.ball.y > CANVAS_HEIGHT - halfSize * 2) {
      ctx.beginPath();
      ctx.arc(this.ball.x, this.ball.y - CANVAS_HEIGHT, halfSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- MAZE RUNNER MODE ---
  generateDfsMaze(diff) {
    let cols, rows, lives, pSpeed, pRadius, patrolCount;
    if (diff === 'easy') {
      cols = 14; rows = 7; lives = 3; pSpeed = 2.4; pRadius = 7.0; patrolCount = 3;
    } else if (diff === 'hard') {
      cols = 24; rows = 12; lives = 1; pSpeed = 4.0; pRadius = 5.0; patrolCount = 7;
    } else if (diff === 'impossible') {
      cols = 28; rows = 14; lives = 1; pSpeed = 5.2; pRadius = 4.2; patrolCount = 10;
    } else {
      // normal
      cols = 18; rows = 9; lives = 2; pSpeed = 3.2; pRadius = 6.0; patrolCount = 5;
    }

    const minX = 40;
    const minY = 35;
    const totalW = 880;
    const totalH = 470;
    const cellW = totalW / cols;
    const cellH = totalH / rows;
    const wallThick = 4;

    const hWalls = Array.from({ length: rows + 1 }, () => Array(cols).fill(true));
    const vWalls = Array.from({ length: rows }, () => Array(cols + 1).fill(true));
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

    const stack = [{ c: 0, r: 0 }];
    visited[0][0] = true;

    while (stack.length > 0) {
      const cur = stack[stack.length - 1];
      const neighbors = [];
      if (cur.r > 0 && !visited[cur.r - 1][cur.c]) neighbors.push({ c: cur.c, r: cur.r - 1, dir: 'up' });
      if (cur.r < rows - 1 && !visited[cur.r + 1][cur.c]) neighbors.push({ c: cur.c, r: cur.r + 1, dir: 'down' });
      if (cur.c > 0 && !visited[cur.r][cur.c - 1]) neighbors.push({ c: cur.c - 1, r: cur.r, dir: 'left' });
      if (cur.c < cols - 1 && !visited[cur.r][cur.c + 1]) neighbors.push({ c: cur.c + 1, r: cur.r, dir: 'right' });

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        if (next.dir === 'up') hWalls[cur.r][cur.c] = false;
        else if (next.dir === 'down') hWalls[cur.r + 1][cur.c] = false;
        else if (next.dir === 'left') vWalls[cur.r][cur.c] = false;
        else if (next.dir === 'right') vWalls[cur.r][cur.c + 1] = false;
        visited[next.r][next.c] = true;
        stack.push(next);
      } else {
        stack.pop();
      }
    }

    // Knock out ~8% of internal walls to create loops and alternative pathways
    for (let r = 1; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (hWalls[r][c] && Math.random() < 0.08) hWalls[r][c] = false;
      }
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        if (vWalls[r][c] && Math.random() < 0.08) vWalls[r][c] = false;
      }
    }

    const walls = [];
    // Outer perimeter
    walls.push({ x: minX, y: minY, w: totalW, h: wallThick });
    walls.push({ x: minX, y: minY + totalH - wallThick, w: totalW, h: wallThick });
    walls.push({ x: minX, y: minY, w: wallThick, h: totalH });
    walls.push({ x: minX + totalW - wallThick, y: minY, w: wallThick, h: totalH });

    // Merged horizontal segments
    for (let r = 1; r < rows; r++) {
      const y = minY + Math.round(r * cellH) - Math.floor(wallThick / 2);
      let runStart = -1;
      for (let c = 0; c < cols; c++) {
        if (hWalls[r][c]) {
          if (runStart === -1) runStart = c;
        } else {
          if (runStart !== -1) {
            walls.push({ x: minX + Math.round(runStart * cellW), y, w: Math.round((c - runStart) * cellW) + wallThick, h: wallThick });
            runStart = -1;
          }
        }
      }
      if (runStart !== -1) {
        walls.push({ x: minX + Math.round(runStart * cellW), y, w: Math.round((cols - runStart) * cellW), h: wallThick });
      }
    }

    // Merged vertical segments
    for (let c = 1; c < cols; c++) {
      const x = minX + Math.round(c * cellW) - Math.floor(wallThick / 2);
      let runStart = -1;
      for (let r = 0; r < rows; r++) {
        if (vWalls[r][c]) {
          if (runStart === -1) runStart = r;
        } else {
          if (runStart !== -1) {
            walls.push({ x, y: minY + Math.round(runStart * cellH), w: wallThick, h: Math.round((r - runStart) * cellH) + wallThick });
            runStart = -1;
          }
        }
      }
      if (runStart !== -1) {
        walls.push({ x, y: minY + Math.round(runStart * cellH), w: wallThick, h: Math.round((rows - runStart) * cellH) });
      }
    }

    // Patrols in corridors
    const patrols = [];
    for (let k = 0; k < patrolCount; k++) {
      const pr = 1 + Math.floor(Math.random() * (rows - 2));
      const pc = 2 + Math.floor(Math.random() * (cols - 4));
      patrols.push({
        x: minX + Math.round((pc + 0.5) * cellW),
        y: minY + Math.round((pr + 0.5) * cellH),
        w: Math.max(12, Math.round(cellW * 0.45)),
        h: Math.max(6, Math.round(cellH * 0.2)),
        vx: (k % 2 === 0 ? 1 : -1) * pSpeed,
        minX: minX + Math.round(Math.max(1, pc - 2) * cellW),
        maxX: minX + Math.round(Math.min(cols - 1, pc + 3) * cellW)
      });
    }

    const startX = minX + Math.round(cellW / 2);
    const startY = minY + Math.round(cellH / 2);

    return {
      player: {
        x: startX,
        y: startY,
        startX: startX,
        startY: startY,
        r: pRadius,
        speed: 3.5
      },
      lives: lives,
      goal: {
        x: minX + Math.round((cols - 1) * cellW) + 4,
        y: minY + Math.round((rows - 1) * cellH) + 4,
        w: Math.round(cellW) - 8,
        h: Math.round(cellH) - 8
      },
      walls: walls,
      patrols: patrols,
      cols: cols,
      rows: rows,
      cellW: cellW,
      cellH: cellH
    };
  }

  updateMaze(dt) {
    const ms = this.modeState;
    const p = ms.player;
    const speed = p.speed;

    let mx = 0, my = 0;
    if (this.keys['w'] || this.keys['arrowup']) my -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) my += 1;
    if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) mx += 1;

    if (mx !== 0 && my !== 0) {
      mx *= 0.7071;
      my *= 0.7071;
    }

    const nextX = p.x + mx * speed;
    const nextY = p.y + my * speed;

    let collideX = false;
    for (const w of ms.walls) {
      if (nextX + p.r > w.x && nextX - p.r < w.x + w.w && p.y + p.r > w.y && p.y - p.r < w.y + w.h) {
        collideX = true;
        break;
      }
    }
    if (!collideX) p.x = nextX;

    let collideY = false;
    for (const w of ms.walls) {
      if (p.x + p.r > w.x && p.x - p.r < w.x + w.w && nextY + p.r > w.y && nextY - p.r < w.y + w.h) {
        collideY = true;
        break;
      }
    }
    if (!collideY) p.y = nextY;

    // Update patrol paddles (Pure white, small fair hitbox)
    for (const pt of ms.patrols) {
      if (pt.vx) {
        pt.x += pt.vx;
        if (pt.x <= pt.minX || pt.x >= pt.maxX) pt.vx *= -1;
      }
      if (pt.vy) {
        pt.y += pt.vy;
        if (pt.y <= pt.minY || pt.y >= pt.maxY) pt.vy *= -1;
      }

      // Small fair hitbox (4px inset)
      const inset = 4;
      if (
        p.x + p.r - inset > pt.x &&
        p.x - p.r + inset < pt.x + pt.w &&
        p.y + p.r - inset > pt.y &&
        p.y - p.r + inset < pt.y + pt.h
      ) {
        ms.lives--;
        window.Sound?.play('lose');
        p.x = p.startX;
        p.y = p.startY;
        if (ms.lives <= 0) {
          this.showResult(false, 'OUT OF LIVES IN THE MAZE!');
          return;
        }
      }
    }

    // Check goal
    const g = ms.goal;
    if (p.x >= g.x && p.x <= g.x + g.w && p.y >= g.y && p.y <= g.y + g.h) {
      window.Sound?.play('win');
      this.showResult(true, 'ESCAPED THE MAZE! VICTORY!');
    }
  }

  renderMaze(ctx, colWhite, colBlack) {
    const ms = this.modeState;

    // HUD
    ctx.fillStyle = colWhite;
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(`LIVES: ${ms.lives}`, 40, 22);
    ctx.textAlign = 'center';
    ctx.fillText('NAVIGATE TO THE GOAL', CANVAS_WIDTH / 2, 22);

    // Walls (Pure White)
    ctx.fillStyle = '#ffffff';
    for (const w of ms.walls) {
      ctx.fillRect(w.x, w.y, w.w, w.h);
    }

    // Goal Zone (Pure 1-Bit Inverted Frame)
    const g = ms.goal;
    const strobe = (Math.floor(Date.now() / 200) % 2 === 0);
    ctx.fillStyle = strobe ? '#ffffff' : '#222222';
    ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(g.x, g.y, g.w, g.h);
    ctx.fillStyle = strobe ? '#000000' : '#ffffff';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', g.x + g.w / 2, g.y + g.h / 2 + 3);

    // Patrol Paddles (Pure White Solid Rectangles - NO COLORS!)
    ctx.fillStyle = '#ffffff';
    for (const pt of ms.patrols) {
      ctx.fillRect(pt.x, pt.y, pt.w, pt.h);
    }

    // Player Ball (Pure White Sphere - NO COLORS!)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ms.player.x, ms.player.y, ms.player.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- GEOMETRY DASH PONG MODE ---
  updateGeometryDash(dt) {
    const gs = this.modeState;
    const p = gs.player;

    const speed = this.getAiConfig().gdSpeed;
    gs.distance += speed;

    p.vy += 38.0 * dt;
    p.y += p.vy;

    if (p.y >= 426) {
      p.y = 426;
      p.vy = 0;
      p.onGround = true;
    }

    const px1 = p.x - p.size / 2 + 2;
    const px2 = p.x + p.size / 2 - 2;
    const py1 = p.y - p.size / 2 + 2;
    const py2 = p.y + p.size / 2 - 2;

    for (const ob of gs.obstacles) {
      const screenX = ob.dist - gs.distance + p.x;
      if (screenX + ob.w > 0 && screenX < CANVAS_WIDTH) {
        if (px2 > screenX && px1 < screenX + ob.w && py2 > ob.y && py1 < ob.y + ob.h) {
          window.Sound?.play('lose');
          gs.distance = 0;
          p.y = 426;
          p.vy = 0;
          p.onGround = true;
          gs.attempts++;
          return;
        }
      }
    }

    if (gs.distance >= gs.targetLength) {
      window.Sound?.play('win');
      this.showResult(true, '100% COMPLETE! GEOMETRY PONG CLEARED!');
    }
  }

  renderGeometryDash(ctx, colWhite, colBlack) {
    const gs = this.modeState;
    const p = gs.player;
    const progress = Math.min(100, Math.floor((gs.distance / gs.targetLength) * 100));

    // Floor line
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 442, CANVAS_WIDTH, 4);

    // Floor grid markings
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    const gridOffset = (gs.distance % 40);
    for (let x = -gridOffset; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 446);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Top Progress Bar (Pure 1-Bit Monochrome)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(240, 20, 480, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(242, 22, (476) * (progress / 100), 10);

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(`${progress}%`, CANVAS_WIDTH / 2, 48);

    ctx.textAlign = 'left';
    ctx.fillText(`ATTEMPT: ${gs.attempts}`, 40, 32);

    // Obstacle Paddles (Pure White)
    ctx.fillStyle = '#ffffff';
    for (const ob of gs.obstacles) {
      const screenX = ob.dist - gs.distance + p.x;
      if (screenX + ob.w >= -20 && screenX <= CANVAS_WIDTH + 20) {
        ctx.fillRect(Math.round(screenX), ob.y, ob.w, ob.h);
      }
    }

    // Player Ball: Pure White Sphere
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- PAC-PONG MODE ---
  updatePacman(dt) {
    const ps = this.modeState;
    const p = ps.player;

    if (ps.powerTimer > 0) {
      ps.powerTimer -= dt;
      if (ps.powerTimer <= 0) ps.ghostMode = 'chase';
    } else {
      ps.modeTimer = (ps.modeTimer || 0) + dt;
      const cycle = ps.modeTimer % 25;
      ps.ghostMode = (cycle > 20) ? 'scatter' : 'chase';
    }

    // Player movement
    let mx = 0, my = 0;
    if (this.keys['w'] || this.keys['arrowup']) my -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) my += 1;
    if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) mx += 1;

    if (mx !== 0 || my !== 0) {
      p.dirX = mx;
      p.dirY = my;
    }

    const nextX = p.x + mx * p.speed;
    const nextY = p.y + my * p.speed;

    // Warp tunnels on sides
    if (p.x < 55 && p.y >= 230 && p.y <= 290) {
      p.x = 885;
    } else if (p.x > 885 && p.y >= 230 && p.y <= 290) {
      p.x = 55;
    } else {
      let collideX = false;
      for (const w of ps.walls) {
        if (nextX + p.r > w.x && nextX - p.r < w.x + w.w && p.y + p.r > w.y && p.y - p.r < w.y + w.h) {
          collideX = true;
          break;
        }
      }
      if (!collideX) p.x = nextX;

      let collideY = false;
      for (const w of ps.walls) {
        if (p.x + p.r > w.x && p.x - p.r < w.x + w.w && nextY + p.r > w.y && nextY - p.r < w.y + w.h) {
          collideY = true;
          break;
        }
      }
      if (
        p.x + p.r > 460 &&
        p.x - p.r < 500 &&
        nextY + p.r > 216 &&
        nextY - p.r < 232
      ) {
        collideY = true;
      }
      if (!collideY) p.y = nextY;
    }

    // Eat pellets
    for (const pl of ps.pellets) {
      if (!pl.eaten && Math.hypot(p.x - pl.x, p.y - pl.y) < p.r + 6) {
        pl.eaten = true;
        ps.score++;
        window.Sound?.play('hit');
      }
    }

    // Eat power pellets
    for (const pw of ps.powerPellets) {
      if (!pw.eaten && Math.hypot(p.x - pw.x, p.y - pw.y) < p.r + 10) {
        pw.eaten = true;
        ps.powerTimer = 7.0;
        ps.ghostMode = 'frightened';
        window.Sound?.play('score');
      }
    }

    // Ghost AI updates (Authentic Pac-Man targeting)
    const blinky = ps.ghosts[0];
    const isFrightened = (ps.powerTimer > 0);

    for (const g of ps.ghosts) {
      // Ghost House Escape Routine
      if (!g.exited) {
        if (g.exitDelay > 0) {
          g.exitDelay -= dt;
          g.y = 250 + Math.sin(Date.now() * 0.006 + (g.name === 'Pinky' ? 0 : 2)) * 3;
          continue;
        }
        // Horizontally center with door (x = 480)
        if (Math.abs(g.x - 480) > 1.5) {
          g.x += Math.sign(480 - g.x) * 2.4;
        } else {
          g.x = 480;
          // Rise straight UP through door opening
          g.y -= 2.6;
          if (g.y <= 178) {
            g.y = 178;
            g.exited = true;
            g.vx = (g.name === 'Pinky' ? -1 : 1) * g.speed;
            g.vy = 0;
          }
        }
        continue;
      }

      const gSpeed = isFrightened ? 1.6 : g.speed;

      let targetX = p.x;
      let targetY = p.y;

      if (isFrightened) {
        targetX = CANVAS_WIDTH - p.x;
        targetY = CANVAS_HEIGHT - p.y;
      } else if (ps.ghostMode === 'scatter') {
        targetX = g.homeX;
        targetY = g.homeY;
      } else {
        if (g.name === 'Blinky') {
          targetX = p.x;
          targetY = p.y;
        } else if (g.name === 'Pinky') {
          targetX = p.x + (p.dirX || 1) * 60;
          targetY = p.y + (p.dirY || 0) * 60;
        } else if (g.name === 'Inky') {
          const pivotX = p.x + (p.dirX || 1) * 30;
          const pivotY = p.y + (p.dirY || 0) * 30;
          targetX = 2 * pivotX - blinky.x;
          targetY = 2 * pivotY - blinky.y;
        } else if (g.name === 'Clyde') {
          const distToPlayer = Math.hypot(g.x - p.x, g.y - p.y);
          if (distToPlayer > 140) {
            targetX = p.x;
            targetY = p.y;
          } else {
            targetX = g.homeX;
            targetY = g.homeY;
          }
        }
      }

      const dirs = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
      ];

      const curDir = { dx: Math.sign(g.vx || 0), dy: Math.sign(g.vy || 0) };
      const validDirs = [];

      for (const d of dirs) {
        if (d.dx === -curDir.dx && d.dy === -curDir.dy && (curDir.dx !== 0 || curDir.dy !== 0)) {
          continue;
        }
        const testX = g.x + d.dx * (gSpeed + 4);
        const testY = g.y + d.dy * (gSpeed + 4);

        let hit = false;
        if ((testX < 55 || testX > 885) && testY >= 230 && testY <= 290) {
          // Tunnel opening
        } else {
          for (const w of ps.walls) {
            if (
              testX + g.w / 2 > w.x &&
              testX - g.w / 2 < w.x + w.w &&
              testY + g.h / 2 > w.y &&
              testY - g.h / 2 < w.y + w.h
            ) {
              hit = true;
              break;
            }
          }
          // Prevent exited ghosts from re-entering the ghost house
          if (!hit && g.exited) {
            if (
              testX + g.w / 2 > 460 &&
              testX - g.w / 2 < 500 &&
              testY + g.h / 2 > 214 &&
              testY - g.h / 2 < 234
            ) {
              hit = true;
            }
          }
        }
        if (!hit) validDirs.push(d);
      }

      if (validDirs.length === 0) {
        validDirs.push({ dx: -curDir.dx, dy: -curDir.dy });
      }

      let bestDir = validDirs[0];
      let bestDist = isFrightened ? -1 : 999999;

      for (const d of validDirs) {
        const nx = g.x + d.dx * 16;
        const ny = g.y + d.dy * 16;
        const dist = Math.hypot(nx - targetX, ny - targetY);
        if (isFrightened) {
          if (dist > bestDist) {
            bestDist = dist;
            bestDir = d;
          }
        } else {
          if (dist < bestDist) {
            bestDist = dist;
            bestDir = d;
          }
        }
      }

      if (bestDir) {
        g.vx = bestDir.dx * gSpeed;
        g.vy = bestDir.dy * gSpeed;
      }

      g.x += g.vx;
      g.y += g.vy;

      if (g.x < 55 && g.y >= 230 && g.y <= 290) g.x = 885;
      else if (g.x > 885 && g.y >= 230 && g.y <= 290) g.x = 55;

      // Player collision
      if (g.exited && Math.hypot(p.x - g.x, p.y - g.y) < p.r + 10) {
        if (isFrightened) {
          g.x = 480;
          g.y = 250;
          g.vx = 0;
          g.vy = 0;
          g.exited = false;
          g.exitDelay = 1.8;
          ps.score += 10;
          window.Sound?.play('win');
        } else {
          ps.lives--;
          window.Sound?.play('lose');
          p.x = 480;
          p.y = 360;
          p.dirX = 0;
          p.dirY = 0;
          if (ps.lives <= 0) {
            this.showResult(false, 'OUT OF LIVES! GAME OVER');
            return;
          }
          // Reset ghosts on life loss
          ps.ghosts[0].x = 480; ps.ghosts[0].y = 180; ps.ghosts[0].vx = 2.8; ps.ghosts[0].vy = 0; ps.ghosts[0].exited = true; ps.ghosts[0].exitDelay = 0;
          ps.ghosts[1].x = 450; ps.ghosts[1].y = 250; ps.ghosts[1].vx = 0; ps.ghosts[1].vy = 0; ps.ghosts[1].exited = false; ps.ghosts[1].exitDelay = 0.5;
          ps.ghosts[2].x = 480; ps.ghosts[2].y = 250; ps.ghosts[2].vx = 0; ps.ghosts[2].vy = 0; ps.ghosts[2].exited = false; ps.ghosts[2].exitDelay = 2.0;
          ps.ghosts[3].x = 510; ps.ghosts[3].y = 250; ps.ghosts[3].vx = 0; ps.ghosts[3].vy = 0; ps.ghosts[3].exited = false; ps.ghosts[3].exitDelay = 4.0;
        }
      }
    }

    if (ps.score >= ps.totalPellets) {
      window.Sound?.play('win');
      this.showResult(true, 'ALL PELLETS EATEN! PAC-PONG CLEARED!');
    }
  }

  renderPacman(ctx, colWhite, colBlack) {
    const ps = this.modeState;

    // HUD (Pure 1-Bit Monochrome)
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(`PELLETS: ${ps.score} / ${ps.totalPellets}`, 60, 24);
    ctx.textAlign = 'center';
    if (ps.powerTimer > 0) {
      ctx.fillText(`POWER: ${ps.powerTimer.toFixed(1)}s`, CANVAS_WIDTH / 2, 24);
    }
    ctx.textAlign = 'right';
    ctx.fillText(`LIVES: ${ps.lives}`, CANVAS_WIDTH - 60, 24);

    // Maze Walls (Pure White Solid Lines)
    ctx.fillStyle = '#ffffff';
    for (const w of ps.walls) {
      ctx.fillRect(w.x, w.y, w.w, w.h);
    }

    // Ghost House Door (Dashed White Line)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(465, 220);
    ctx.lineTo(495, 220);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pellets (Pure White 3x3 Squares)
    ctx.fillStyle = '#ffffff';
    for (const pl of ps.pellets) {
      if (!pl.eaten) {
        ctx.fillRect(pl.x - 1.5, pl.y - 1.5, 3, 3);
      }
    }

    // Power Pellets (Pure White Pulsing Spheres)
    const pulse = Math.sin(Date.now() / 100) > 0;
    if (pulse) {
      ctx.fillStyle = '#ffffff';
      for (const pw of ps.powerPellets) {
        if (!pw.eaten) {
          ctx.beginPath();
          ctx.arc(pw.x, pw.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Ghost Paddles: Pure White Solid Pong Paddles (NO FACES, NO COLORS!)
    const isFrightened = (ps.powerTimer > 0);
    for (const g of ps.ghosts) {
      if (isFrightened) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(Math.round(g.x - g.w / 2), Math.round(g.y - g.h / 2), g.w, g.h);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(g.x - g.w / 2), Math.round(g.y - g.h / 2), g.w, g.h);
      }
    }

    // Player Ball (Pure White Sphere - NO COLORS!)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ps.player.x, ps.player.y, ps.player.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- SUPER BLURRY MODE ---
  renderBlurry(ctx, colWhite, colBlack) {
    ctx.save();
    ctx.filter = 'blur(12px)';
    this.renderNormal(ctx, colWhite, colBlack);
    ctx.restore();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '9px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('SUPER BLURRY PONG', CANVAS_WIDTH / 2, 20);
  }

  // --- GIANT ARENA MODE ---
  updateGiantArena(dt) {
    const gs = this.modeState;
    const p = this.player;
    const e = this.enemy;
    const b = this.ball;

    const top = gs.arenaTop || 34;
    const bot = gs.arenaBottom || (CANVAS_HEIGHT - 34);

    // Player input (W/S or Arrow keys)
    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    p.y += dir * (p.speed || 6.5);
    p.y = Math.max(top + 4, Math.min(bot - p.h, p.y));

    // Enemy AI
    const targetY = b.y - e.h / 2;
    if (b.vx > 0 && b.x > CANVAS_WIDTH - (e.reactionDist || 480)) {
      const diff = targetY - e.y;
      if (Math.abs(diff) > (e.jitter || 16)) {
        e.y += Math.sign(diff) * Math.min(Math.abs(diff), e.speed);
      }
    }
    e.y = Math.max(top + 4, Math.min(bot - e.h, e.y));

    // Ball movement
    b.x += b.vx;
    b.y += b.vy;

    const halfSize = b.size / 2;
    // Top wall bounce
    if (b.y - halfSize <= top + 4) {
      b.y = top + 4 + halfSize;
      b.vy = Math.abs(b.vy);
      window.Sound?.play('wall');
    }
    // Bottom wall bounce
    if (b.y + halfSize >= bot) {
      b.y = bot - halfSize;
      b.vy = -Math.abs(b.vy);
      window.Sound?.play('wall');
    }

    // Player paddle collision
    if (
      b.vx < 0 &&
      b.x - halfSize <= p.x + p.w &&
      b.x + halfSize >= p.x &&
      b.y + halfSize >= p.y &&
      b.y - halfSize <= p.y + p.h
    ) {
      b.x = p.x + p.w + halfSize + 1;
      const offset = (b.y - (p.y + p.h / 2)) / (p.h / 2);
      const angle = offset * 0.75;
      b.speed = Math.min(8.5, b.speed * 1.02);
      b.vx = Math.cos(angle) * b.speed;
      b.vy = Math.sin(angle) * b.speed;
      window.Sound?.play('hit');
    }

    // Enemy paddle collision
    if (
      b.vx > 0 &&
      b.x + halfSize >= e.x &&
      b.x - halfSize <= e.x + e.w &&
      b.y + halfSize >= e.y &&
      b.y - halfSize <= e.y + e.h
    ) {
      b.x = e.x - halfSize - 1;
      const offset = (b.y - (e.y + e.h / 2)) / (e.h / 2);
      const angle = offset * 0.75;
      b.speed = Math.min(8.5, b.speed * 1.02);
      b.vx = -Math.cos(angle) * b.speed;
      b.vy = Math.sin(angle) * b.speed;
      window.Sound?.play('hit');
    }

    // Score handling
    if (b.x < 0) {
      e.score++;
      window.Sound?.play('score');
      if (e.score >= this.currentLevel.targetScore) {
        this.showResult(false, 'AI WON THE GIANT ARENA MATCH');
      } else {
        const aiCfg = this.getAiConfig();
        const baseSpd = aiCfg.giantBallSpeed || 5.0;
        b.x = CANVAS_WIDTH / 2;
        b.y = CANVAS_HEIGHT / 2;
        b.speed = baseSpd;
        b.vx = baseSpd;
        b.vy = (Math.random() - 0.5) * (baseSpd * 0.5);
      }
    } else if (b.x > CANVAS_WIDTH) {
      p.score++;
      window.Sound?.play('score');
      if (p.score >= this.currentLevel.targetScore) {
        this.showResult(true, 'WON THE GIANT ARENA MATCH!');
      } else {
        const aiCfg = this.getAiConfig();
        const baseSpd = aiCfg.giantBallSpeed || 5.0;
        b.x = CANVAS_WIDTH / 2;
        b.y = CANVAS_HEIGHT / 2;
        b.speed = baseSpd;
        b.vx = -baseSpd;
        b.vy = (Math.random() - 0.5) * (baseSpd * 0.5);
      }
    }
  }

  renderGiantArena(ctx, colWhite, colBlack) {
    const gs = this.modeState;
    const top = gs.arenaTop || 34;
    const bot = gs.arenaBottom || (CANVAS_HEIGHT - 34);

    // Top and Bottom Solid Boundary Walls
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, top, CANVAS_WIDTH, 2);
    ctx.fillRect(0, bot, CANVAS_WIDTH, 2);

    // Center Net Line - Tiny dashes emphasizing colossal arena scale
    const dashH = 3;
    const gap = 3;
    for (let y = top + 4; y < bot - 2; y += dashH + gap) {
      ctx.fillRect(CANVAS_WIDTH / 2 - 1, y, 2, dashH);
    }

    // Scoreboard - Clean, spacious, positioned inside arena below top boundary
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, CANVAS_WIDTH / 2 - 90, 80);
    ctx.fillText(`${this.enemy.score}`, CANVAS_WIDTH / 2 + 90, 80);

    // Paddles
    ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
    ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);

    // Ball
    ctx.fillRect(
      Math.round(this.ball.x - this.ball.size / 2),
      Math.round(this.ball.y - this.ball.size / 2),
      this.ball.size,
      this.ball.size
    );
  }

  // --- ORBIT DEFENDER MODE ---
  updateOrbitDefense(dt) {
    const os = this.modeState;
    if (os.shake > 0) os.shake = Math.max(0, os.shake - dt * 22);

    // Orbital Paddle Steering via WASD or Arrow Keys
    let rotateDir = 0;
    if (this.keys['a'] || this.keys['w'] || this.keys['arrowleft'] || this.keys['arrowup']) rotateDir -= 1;
    if (this.keys['d'] || this.keys['s'] || this.keys['arrowright'] || this.keys['arrowdown']) rotateDir += 1;
    if (rotateDir !== 0) {
      os.paddleAngle += rotateDir * 5.0 * dt;
    }

    // Spawn Incoming Swarm Balls
    os.spawnTimer -= dt;
    if (os.spawnTimer <= 0) {
      const baseInterval = this.getAiConfig().orbitSpawnRate;
      os.spawnInterval = Math.max(0.32, baseInterval - (os.deflected * 0.02));
      os.spawnTimer = os.spawnInterval;

      let sx, sy;
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) { sx = 40 + Math.random() * (CANVAS_WIDTH - 80); sy = 25; }
      else if (edge === 1) { sx = 40 + Math.random() * (CANVAS_WIDTH - 80); sy = CANVAS_HEIGHT - 25; }
      else if (edge === 2) { sx = 25; sy = 40 + Math.random() * (CANVAS_HEIGHT - 80); }
      else { sx = CANVAS_WIDTH - 25; sy = 40 + Math.random() * (CANVAS_HEIGHT - 80); }

      const baseAngle = Math.atan2(os.centerY - sy, os.centerX - sx);
      const angle = baseAngle + (Math.random() - 0.5) * 0.24;
      const baseSpd = os.baseBallSpeed || this.getAiConfig().orbitBallSpeed;
      const spd = baseSpd + Math.min(3.2, os.deflected * 0.08);

      os.balls.push({
        x: sx,
        y: sy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 7,
        deflected: false,
        alive: true
      });
    }

    // Update Incoming Balls
    for (let i = 0; i < os.balls.length; i++) {
      const b = os.balls[i];
      b.x += b.vx;
      b.y += b.vy;

      const dist = Math.hypot(b.x - os.centerX, b.y - os.centerY);
      const bAngle = Math.atan2(b.y - os.centerY, b.x - os.centerX);

      // Paddle Collision & Deflection
      if (!b.deflected && Math.abs(dist - os.orbitRadius) <= (os.paddleThickness / 2 + b.size / 2 + 3)) {
        let angleDiff = (bAngle - os.paddleAngle) % (Math.PI * 2);
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

        if (Math.abs(angleDiff) <= (os.paddleSpan / 2 + 0.1)) {
          // Deflect outward away from core
          const outAngle = bAngle + (Math.random() - 0.5) * 0.35;
          const bounceSpd = Math.max(8.0, Math.hypot(b.vx, b.vy) * 1.35);
          b.vx = Math.cos(outAngle) * bounceSpd;
          b.vy = Math.sin(outAngle) * bounceSpd;
          b.deflected = true;
          os.deflected++;
          this.player.score = os.deflected;
          window.Sound?.play('hit');

          if (os.deflected >= 30) {
            this.showResult(true, 'CORE DEFENDED! 30 DEFLECTED');
            return;
          }
        }
      }

      // Core Collision
      if (!b.deflected && dist <= (os.coreRadius + b.size / 2)) {
        b.alive = false;
        os.lives--;
        os.shake = 14;
        this.enemy.score = 5 - os.lives;
        window.Sound?.play('lose');

        if (os.lives <= 0) {
          this.showResult(false, 'CORE SHIELDS BREACHED!');
          return;
        }
      }

      // Clean up deflected balls off screen
      if (b.deflected && (b.x < -30 || b.x > CANVAS_WIDTH + 30 || b.y < -30 || b.y > CANVAS_HEIGHT + 30)) {
        b.alive = false;
      }
    }

    os.balls = os.balls.filter(b => b.alive);
  }

  renderOrbitDefense(ctx, colWhite, colBlack) {
    const os = this.modeState;

    if (os.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * os.shake, (Math.random() - 0.5) * os.shake);
    }

    // Top HUD
    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'left';
    ctx.fillText('SHIELDS: ', 30, 25);
    for (let i = 0; i < 5; i++) {
      if (i < os.lives) {
        ctx.fillRect(115 + i * 16, 16, 10, 10);
      } else {
        ctx.strokeRect(115 + i * 16, 16, 10, 10);
      }
    }

    ctx.textAlign = 'center';
    ctx.fillText(`DEFLECTED: ${os.deflected} / 30`, CANVAS_WIDTH / 2, 25);
    ctx.textAlign = 'right';
    ctx.fillText('ORBIT DEFENDER', CANVAS_WIDTH - 30, 25);

    // Orbit Radar Track (Dashed white circle)
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(os.centerX, os.centerY, os.orbitRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Central Core Ball
    ctx.fillStyle = colWhite;
    ctx.beginPath();
    ctx.arc(os.centerX, os.centerY, os.coreRadius, 0, Math.PI * 2);
    ctx.fill();
    // Inner Core Pattern (1-bit retro concentric styling)
    ctx.fillStyle = colBlack;
    ctx.beginPath();
    ctx.arc(os.centerX, os.centerY, os.coreRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colWhite;
    ctx.beginPath();
    ctx.arc(os.centerX, os.centerY, os.coreRadius * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Orbital Shield / Paddle
    ctx.beginPath();
    ctx.arc(
      os.centerX,
      os.centerY,
      os.orbitRadius,
      os.paddleAngle - os.paddleSpan / 2,
      os.paddleAngle + os.paddleSpan / 2
    );
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = os.paddleThickness;
    ctx.stroke();

    // Aim Line Indicator pointing to mouse
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(os.centerX + Math.cos(os.paddleAngle) * (os.orbitRadius + 8), os.centerY + Math.sin(os.paddleAngle) * (os.orbitRadius + 8));
    ctx.lineTo(os.centerX + Math.cos(os.paddleAngle) * (os.orbitRadius + 24), os.centerY + Math.sin(os.paddleAngle) * (os.orbitRadius + 24));
    ctx.stroke();

    // Incoming & Deflected Swarm Balls
    for (const b of os.balls) {
      ctx.fillStyle = colWhite;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2);
      ctx.fill();

      if (b.deflected) {
        ctx.strokeStyle = colWhite;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size / 2 + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (os.shake > 0) {
      ctx.restore();
    }
  }

  // --- 3D TOP-DOWN MODE ---
  updateTopDown3D(dt) {
    const ts = this.modeState;
    const b = ts.ball;

    // 1. Player Paddle Movement along 3D Depth Y (-courtH to +courtH) via W/S or Arrow keys
    let pDir = 0;
    if (this.keys['w'] || this.keys['arrowup']) pDir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) pDir += 1;
    ts.playerY += pDir * 6.5;
    ts.playerY = Math.max(-ts.courtH + 34, Math.min(ts.courtH - 34, ts.playerY));

    // 2. AI Paddle Movement along 3D Depth Y
    const diffY = (b.y - ts.enemyY);
    if (Math.abs(diffY) > 8) {
      ts.enemyY += Math.sign(diffY) * Math.min(Math.abs(diffY), ts.enemySpeed);
    }
    ts.enemyY = Math.max(-ts.courtH + 34, Math.min(ts.courtH - 34, ts.enemyY));

    // 3. 3D Ball Physics
    b.x += b.vx;
    b.y += b.vy;

    b.vz -= 0.52; // 3D gravity
    b.z += b.vz;
    if (b.z <= 0) {
      b.z = 0;
      b.vz = 5.4; // Table bounce
      window.Sound?.play('wall');
    }

    // Top (Back) & Bottom (Front) Rim Bounces
    if (b.y <= -ts.courtH + 10) {
      b.y = -ts.courtH + 10;
      b.vy = Math.abs(b.vy);
      window.Sound?.play('wall');
    } else if (b.y >= ts.courtH - 10) {
      b.y = ts.courtH - 10;
      b.vy = -Math.abs(b.vy);
      window.Sound?.play('wall');
    }

    const aiCfg = this.getAiConfig();
    const speedUp = aiCfg.ballSpeedUp || 1.04;
    const maxSpd = aiCfg.maxBallSpeed || 16.0;

    // Player Paddle Collision (Left 3D Prism)
    const pReachX = ts.playerW / 2 + b.radius + 3;
    const pReachY = ts.playerH / 2 + b.radius + 3;
    if (
      b.vx < 0 &&
      Math.abs(b.x - ts.playerX) <= pReachX &&
      Math.abs(b.y - ts.playerY) <= pReachY
    ) {
      b.vx = Math.min(maxSpd, Math.abs(b.vx) * speedUp);
      const hitOffset = (b.y - ts.playerY) / (ts.playerH / 2);
      b.vy = hitOffset * 4.6;
      b.vz = 6.4;
      window.Sound?.play('hit');
    }

    // Enemy Paddle Collision (Right 3D Prism)
    const eReachX = ts.enemyW / 2 + b.radius + 3;
    const eReachY = ts.enemyH / 2 + b.radius + 3;
    if (
      b.vx > 0 &&
      Math.abs(b.x - ts.enemyX) <= eReachX &&
      Math.abs(b.y - ts.enemyY) <= eReachY
    ) {
      b.vx = -Math.min(maxSpd, Math.abs(b.vx) * speedUp);
      const hitOffset = (b.y - ts.enemyY) / (ts.enemyH / 2);
      b.vy = hitOffset * 4.6;
      b.vz = 6.4;
      window.Sound?.play('hit');
    }

    // Scoring & Reset
    if (b.x < -ts.courtW - 15) {
      this.enemy.score++;
      window.Sound?.play('lose');
      if (this.enemy.score >= 5) {
        this.showResult(false, 'OPPONENT WON 5 POINTS');
      } else {
        b.x = 0;
        b.y = 0;
        b.z = 24;
        b.vz = 4.8;
        b.vx = 5.8;
        b.vy = (Math.random() - 0.5) * 2.8;
      }
    } else if (b.x > ts.courtW + 15) {
      this.player.score++;
      window.Sound?.play('score');
      if (this.player.score >= 5) {
        this.showResult(true, '3D TOP-DOWN CHAMPION!');
      } else {
        b.x = 0;
        b.y = 0;
        b.z = 24;
        b.vz = 4.8;
        b.vx = -5.8;
        b.vy = (Math.random() - 0.5) * 2.8;
      }
    }
  }

  renderTopDown3D(ctx, colWhite, colBlack) {
    const ts = this.modeState;
    const cW = ts.courtW;
    const cH = ts.courtH;
    const wallH = ts.wallH;

    // Header & Scoreboard
    ctx.fillStyle = '#666666';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('3D TOP-DOWN PONG', CANVAS_WIDTH / 2, 22);

    ctx.font = '24px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.fillText(`${this.player.score}   ${this.enemy.score}`, CANVAS_WIDTH / 2, 54);

    // 3D Perspective Projection Function
    const project = (x, y, z) => {
      const scale = 1 + (y / 620);
      return {
        x: CANVAS_WIDTH / 2 + x * scale,
        y: 280 + y * 0.70 - z * 0.85,
        s: scale
      };
    };

    // Court Floor & Wall Vertices
    const fTL = project(-cW, -cH, 0);
    const fTR = project(cW, -cH, 0);
    const fBR = project(cW, cH, 0);
    const fBL = project(-cW, cH, 0);

    const wTL = project(-cW, -cH, wallH);
    const wTR = project(cW, -cH, wallH);
    const wBR = project(cW, cH, wallH);
    const wBL = project(-cW, cH, wallH);

    // Table Under-Shadow
    ctx.fillStyle = '#080808';
    ctx.beginPath();
    ctx.moveTo(fBL.x - 10, fBL.y + 16);
    ctx.lineTo(fBR.x + 10, fBR.y + 16);
    ctx.lineTo(fBR.x, fBR.y);
    ctx.lineTo(fBL.x, fBL.y);
    ctx.fill();

    // Table Floor Plane (Solid dark court)
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.moveTo(fTL.x, fTL.y);
    ctx.lineTo(fTR.x, fTR.y);
    ctx.lineTo(fBR.x, fBR.y);
    ctx.lineTo(fBL.x, fBL.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Back Wall Face (Solid 3D back rim)
    ctx.fillStyle = '#181818';
    ctx.beginPath();
    ctx.moveTo(fTL.x, fTL.y);
    ctx.lineTo(fTR.x, fTR.y);
    ctx.lineTo(wTR.x, wTR.y);
    ctx.lineTo(wTL.x, wTL.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Back Wall Top Rim
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(wTL.x, wTL.y);
    ctx.lineTo(wTR.x, wTR.y);
    ctx.stroke();

    // Front Wall Face (Looking down at it)
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.moveTo(fBL.x, fBL.y);
    ctx.lineTo(fBR.x, fBR.y);
    ctx.lineTo(wBR.x, wBR.y);
    ctx.lineTo(wBL.x, wBL.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center Net (Standing upright in 3D)
    const netB = project(0, cH, 0);
    const netT = project(0, -cH, 0);
    const netH = project(0, cH, 18);
    const netTH = project(0, -cH, 18);

    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(netT.x, netT.y); ctx.lineTo(netTH.x, netTH.y);
    ctx.moveTo(netB.x, netB.y); ctx.lineTo(netH.x, netH.y);
    ctx.stroke();

    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(netT.x, netT.y); ctx.lineTo(netB.x, netB.y);
    ctx.moveTo(netTH.x, netTH.y); ctx.lineTo(netH.x, netH.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Solid Polygonal 3D Paddle Drawing
    const drawSolid3DPaddle = (px, py, pw, ph, pH) => {
      const halfW = pw / 2;
      const halfH = ph / 2;

      const b0 = project(px - halfW, py - halfH, 0);
      const b1 = project(px + halfW, py - halfH, 0);
      const b2 = project(px + halfW, py + halfH, 0);
      const b3 = project(px - halfW, py + halfH, 0);

      const t0 = project(px - halfW, py - halfH, pH);
      const t1 = project(px + halfW, py - halfH, pH);
      const t2 = project(px + halfW, py + halfH, pH);
      const t3 = project(px - halfW, py + halfH, pH);

      // Floor Shadow
      ctx.fillStyle = '#1c1c1c';
      ctx.beginPath();
      ctx.moveTo(b0.x, b0.y); ctx.lineTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.lineTo(b3.x, b3.y);
      ctx.fill();

      // Front Face
      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.moveTo(b3.x, b3.y); ctx.lineTo(b2.x, b2.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t3.x, t3.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Side Face
      const isPlayer = px < 0;
      if (isPlayer) {
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t1.x, t1.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = colWhite;
        ctx.stroke();
      } else {
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(b0.x, b0.y); ctx.lineTo(b3.x, b3.y); ctx.lineTo(t3.x, t3.y); ctx.lineTo(t0.x, t0.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = colWhite;
        ctx.stroke();
      }

      // Top Raised Face
      ctx.fillStyle = colWhite;
      ctx.beginPath();
      ctx.moveTo(t0.x, t0.y); ctx.lineTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t3.x, t3.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = colBlack;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    drawSolid3DPaddle(ts.playerX, ts.playerY, ts.playerW, ts.playerH, ts.playerH3D);
    drawSolid3DPaddle(ts.enemyX, ts.enemyY, ts.enemyW, ts.enemyH, ts.enemyH3D);

    // 3D Ball
    const b = ts.ball;
    const bShadow = project(b.x, b.y, 0);
    const bPos = project(b.x, b.y, b.z);
    const bRadius = b.radius * bPos.s;

    // Floor Shadow
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.ellipse(bShadow.x, bShadow.y, bRadius * 1.3, bRadius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball Sphere
    ctx.fillStyle = colWhite;
    ctx.beginPath();
    ctx.arc(bPos.x, bPos.y, bRadius, 0, Math.PI * 2);
    ctx.fill();

    // Equator wireframe
    ctx.strokeStyle = colBlack;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(bPos.x, bPos.y, bRadius, bRadius * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- SOFTBODY PONG MODE ---
  updateSoftbody(dt) {
    const sb = this.modeState;
    sb.time += dt;
    const p = this.player;
    const e = this.enemy;
    const b = this.ball;

    // 1. Player Paddle Movement (W/S or Arrow keys)
    const pSpeed = p.speed || 3.5;
    let pDir = 0;
    if (this.keys['w'] || this.keys['arrowup']) pDir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) pDir += 1;
    p.y += pDir * pSpeed;
    p.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - p.h, p.y));

    // Player Softbody Inertia / Drag (Strong rubber flex)
    for (let i = 0; i < sb.numNodes; i++) {
      sb.playerNodes[i].v += pDir * 2.8;
    }

    // 2. Enemy Paddle Movement (EXACT SAME SPEED AS PLAYER!)
    const eSpeed = e.speed || pSpeed;
    const eCenter = e.y + e.h / 2;
    const eDiff = (b.y - eCenter);
    let eDir = 0;
    const reactionZone = CANVAS_WIDTH - (e.reactionDist || 360);
    const jitter = e.jitter || 14;
    if (b.x >= reactionZone && Math.abs(eDiff) > jitter) {
      eDir = Math.sign(eDiff);
      e.y += eDir * Math.min(Math.abs(eDiff), eSpeed);
    }
    e.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - e.h, e.y));

    for (let i = 0; i < sb.numNodes; i++) {
      sb.enemyNodes[i].v += eDir * 2.8;
    }

    // 3. Paddle Node Softbody Springs & Intense Gelatin Jiggle
    const updatePaddleSoftbody = (nodes) => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const fRest = -26.0 * node.offset - 2.6 * node.v;
        const prevOffset = nodes[Math.max(0, i - 1)].offset;
        const nextOffset = nodes[Math.min(nodes.length - 1, i + 1)].offset;
        const fCouple = 32.0 * (prevOffset + nextOffset - 2 * node.offset);
        node.v += (fRest + fCouple) * dt;
        node.offset += node.v * dt;
        node.offset = Math.max(-48, Math.min(48, node.offset)); // Enhanced flex amplitude
      }
    };
    updatePaddleSoftbody(sb.playerNodes);
    updatePaddleSoftbody(sb.enemyNodes);

    // 4. Ball Softbody Vertex Spring Physics (Stronger deformation)
    for (let i = 0; i < sb.numVerts; i++) {
      const v = sb.verts[i];
      const fRest = -26.0 * (v.r - 16) - 2.8 * v.vr;
      const prevR = sb.verts[(i - 1 + sb.numVerts) % sb.numVerts].r;
      const nextR = sb.verts[(i + 1) % sb.numVerts].r;
      const fTension = 34.0 * (prevR + nextR - 2 * v.r);
      const fJiggle = Math.sin(sb.time * 6.0 + i * 1.5) * 3.2; // Ambient gelatin wobble

      v.vr += (fRest + fTension + fJiggle) * dt;
      v.r += v.vr * dt;
      v.r = Math.max(5, Math.min(38, v.r)); // Massive squash range
    }

    // 5. Ball Trajectory (Balanced speed)
    b.x += b.vx;
    b.y += b.vy;

    // Top / Bottom Wall Collisions + Strong Squash & Stretch
    if (b.y - 16 <= 34) {
      b.y = 34 + 16;
      b.vy = Math.abs(b.vy);
      sb.verts[4].vr -= 64;
      sb.verts[3].vr -= 42;
      sb.verts[5].vr -= 42;
      sb.verts[0].vr += 36;
      sb.verts[8].vr += 36;
      window.Sound?.play('wall');
    } else if (b.y + 16 >= CANVAS_HEIGHT - 34) {
      b.y = CANVAS_HEIGHT - 34 - 16;
      b.vy = -Math.abs(b.vy);
      sb.verts[12].vr -= 64;
      sb.verts[11].vr -= 42;
      sb.verts[13].vr -= 42;
      sb.verts[0].vr += 36;
      sb.verts[8].vr += 36;
      window.Sound?.play('wall');
    }

    // Player Softbody Paddle Collision
    if (b.x - 16 <= p.x + p.w && b.x + 16 >= p.x && b.y >= p.y - 8 && b.y <= p.y + p.h + 8 && b.vx < 0) {
      b.vx = Math.min(5.8, Math.abs(b.vx) * 1.02);
      const hitOffset = (b.y - (p.y + p.h / 2)) / (p.h / 2);
      b.vy = hitOffset * 4.2;

      // Squash left side of softbody ball
      sb.verts[8].vr -= 75;
      sb.verts[7].vr -= 45;
      sb.verts[9].vr -= 45;
      sb.verts[4].vr += 40;
      sb.verts[12].vr += 40;

      // Paddle Dent / Jiggle Wave
      const hitNodeIdx = Math.max(0, Math.min(8, Math.round(((b.y - p.y) / p.h) * 8)));
      sb.playerNodes[hitNodeIdx].v -= 72;
      if (hitNodeIdx > 0) sb.playerNodes[hitNodeIdx - 1].v -= 46;
      if (hitNodeIdx < 8) sb.playerNodes[hitNodeIdx + 1].v -= 46;

      window.Sound?.play('hit');
    }

    // Enemy Softbody Paddle Collision
    if (b.x + 16 >= e.x && b.x - 16 <= e.x + e.w && b.y >= e.y - 8 && b.y <= e.y + e.h + 8 && b.vx > 0) {
      b.vx = -Math.min(5.8, Math.abs(b.vx) * 1.02);
      const hitOffset = (b.y - (e.y + e.h / 2)) / (e.h / 2);
      b.vy = hitOffset * 4.2;

      // Squash right side of softbody ball
      sb.verts[0].vr -= 75;
      sb.verts[1].vr -= 45;
      sb.verts[15].vr -= 45;
      sb.verts[4].vr += 40;
      sb.verts[12].vr += 40;

      // Paddle Dent / Jiggle Wave
      const hitNodeIdx = Math.max(0, Math.min(8, Math.round(((b.y - e.y) / e.h) * 8)));
      sb.enemyNodes[hitNodeIdx].v += 72;
      if (hitNodeIdx > 0) sb.enemyNodes[hitNodeIdx - 1].v += 46;
      if (hitNodeIdx < 8) sb.enemyNodes[hitNodeIdx + 1].v += 46;

      window.Sound?.play('hit');
    }

    // Scoring & Reset
    if (b.x < 10) {
      e.score++;
      window.Sound?.play('lose');
      if (e.score >= 5) {
        this.showResult(false, 'OPPONENT WON 5 POINTS');
      } else {
        b.x = CANVAS_WIDTH / 2;
        b.y = CANVAS_HEIGHT / 2;
        b.vx = 4.6;
        b.vy = (Math.random() - 0.5) * 2.2;
        for (const v of sb.verts) { v.r = 16; v.vr = 0; }
      }
    } else if (b.x > CANVAS_WIDTH - 10) {
      p.score++;
      window.Sound?.play('score');
      if (p.score >= 5) {
        this.showResult(true, 'SOFTBODY PONG CHAMPION!');
      } else {
        b.x = CANVAS_WIDTH / 2;
        b.y = CANVAS_HEIGHT / 2;
        b.vx = -4.6;
        b.vy = (Math.random() - 0.5) * 2.2;
        for (const v of sb.verts) { v.r = 16; v.vr = 0; }
      }
    }
  }

  renderSoftbody(ctx, colWhite, colBlack) {
    const sb = this.modeState;
    const p = this.player;
    const e = this.enemy;
    const b = this.ball;

    // Header & Scoreboard
    ctx.fillStyle = '#666666';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('SOFTBODY PONG', CANVAS_WIDTH / 2, 22);

    ctx.font = '28px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.fillText(`${p.score}`, CANVAS_WIDTH / 2 - 80, 80);
    ctx.fillText(`${e.score}`, CANVAS_WIDTH / 2 + 80, 80);

    // Walls
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // Center Net
    for (let y = 44; y < CANVAS_HEIGHT - 34; y += 20) {
      ctx.fillRect(CANVAS_WIDTH / 2 - 2, y, 4, 10);
    }

    // Helper: Draw Deformable Softbody Paddle as a Whole, Smooth Organic Entity
    const drawSoftbodyPaddle = (baseX, baseY, w, h, nodes) => {
      const stepY = h / (nodes.length - 1);
      ctx.fillStyle = colWhite;
      ctx.beginPath();

      // Top-left starting point with rounded top
      const topX = baseX + nodes[0].offset;
      const topY = baseY;
      ctx.moveTo(topX, topY + 4);

      // Curve down the left edge through node midpoints
      for (let i = 0; i < nodes.length - 1; i++) {
        const x0 = baseX + nodes[i].offset;
        const y0 = baseY + i * stepY;
        const x1 = baseX + nodes[i + 1].offset;
        const y1 = baseY + (i + 1) * stepY;
        const mx = (x0 + x1) / 2;
        const my = (y0 + y1) / 2;
        ctx.quadraticCurveTo(x0, y0, mx, my);
      }
      const botLX = baseX + nodes[nodes.length - 1].offset;
      const botLY = baseY + h;
      const botRX = baseX + w + nodes[nodes.length - 1].offset;
      const botRY = baseY + h;

      // Bottom rounded cap
      ctx.quadraticCurveTo(botLX, botLY, (botLX + botRX) / 2, botLY);
      ctx.quadraticCurveTo(botRX, botRY, botRX, botRY - 4);

      // Curve up the right edge through node midpoints
      for (let i = nodes.length - 1; i > 0; i--) {
        const x0 = baseX + w + nodes[i].offset;
        const y0 = baseY + i * stepY;
        const x1 = baseX + w + nodes[i - 1].offset;
        const y1 = baseY + (i - 1) * stepY;
        const mx = (x0 + x1) / 2;
        const my = (y0 + y1) / 2;
        ctx.quadraticCurveTo(x0, y0, mx, my);
      }
      const topRX = baseX + w + nodes[0].offset;
      const topRY = baseY;

      // Top rounded cap
      ctx.quadraticCurveTo(topRX, topRY, (topX + topRX) / 2, topRY);
      ctx.quadraticCurveTo(topX, topRY, topX, topRY + 4);

      ctx.closePath();
      // Render as ONE solid whole entity!
      ctx.fill();
    };

    drawSoftbodyPaddle(p.x, p.y, p.w, p.h, sb.playerNodes);
    drawSoftbodyPaddle(e.x, e.y, e.w, e.h, sb.enemyNodes);

    // Draw Deformable Softbody Ball as a Whole Smooth Organic Droplet
    const ballPts = [];
    for (let i = 0; i < sb.numVerts; i++) {
      const a = (i / sb.numVerts) * 2 * Math.PI;
      ballPts.push({
        x: b.x + Math.cos(a) * sb.verts[i].r,
        y: b.y + Math.sin(a) * sb.verts[i].r
      });
    }

    ctx.fillStyle = colWhite;
    ctx.beginPath();
    const len = ballPts.length;
    const startMidX = (ballPts[0].x + ballPts[len - 1].x) / 2;
    const startMidY = (ballPts[0].y + ballPts[len - 1].y) / 2;
    ctx.moveTo(startMidX, startMidY);

    for (let i = 0; i < len; i++) {
      const curr = ballPts[i];
      const next = ballPts[(i + 1) % len];
      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;
      ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
    }
    ctx.closePath();
    // Render ball as a completely solid whole entity!
    ctx.fill();
  }

  // --- FIRST-PERSON 3D PONG MODE ---
  updateFirstPerson3D(dt) {
    const fps = this.modeState;
    fps.time += dt;
    if (fps.shake > 0) fps.shake = Math.max(0, fps.shake - dt * 22);
    if (fps.paddleFlash > 0) fps.paddleFlash = Math.max(0, fps.paddleFlash - dt * 4.0);

    // 1. Player Paddle Movement via WASD / Arrow Keys
    const focal = 320;
    const playerScale = focal / (fps.playerZ + focal);

    let kx = 0, ky = 0;
    if (this.keys['a'] || this.keys['arrowleft']) kx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) kx += 1;
    if (this.keys['w'] || this.keys['arrowup']) ky -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) ky += 1;
    if (kx !== 0 && ky !== 0) { kx *= 0.7071; ky *= 0.7071; }

    fps.playerX += kx * (14.0 / playerScale);
    fps.playerY += ky * (14.0 / playerScale);

    const maxPX = fps.courtW - fps.playerW / 2;
    const maxPY = fps.courtH - fps.playerH / 2;
    fps.playerX = Math.max(-maxPX, Math.min(maxPX, fps.playerX));
    fps.playerY = Math.max(-maxPY, Math.min(maxPY, fps.playerY));

    // 2. Opponent AI Movement Down the Tunnel (Slightly Slower & Beatable)
    const b = fps.ball;
    if (b.vz > 0) {
      const diffX = b.x - fps.oppX;
      const diffY = b.y - fps.oppY;
      if (Math.abs(diffX) > 12) {
        fps.oppX += Math.sign(diffX) * Math.min(Math.abs(diffX), fps.oppSpeed);
      }
      if (Math.abs(diffY) > 12) {
        fps.oppY += Math.sign(diffY) * Math.min(Math.abs(diffY), fps.oppSpeed * 0.75);
      }
    }
    fps.oppX = Math.max(-fps.courtW + 40, Math.min(fps.courtW - 40, fps.oppX));
    fps.oppY = Math.max(-fps.courtH + 26, Math.min(fps.courtH - 26, fps.oppY));

    // 3. 3D Ball Physics
    const prevX = b.x;
    const prevY = b.y;
    const prevZ = b.z;

    b.x += b.vx;
    b.y += b.vy;
    b.z += b.vz;

    // Tunnel Walls
    if (b.x <= -fps.courtW + 12) {
      b.x = -fps.courtW + 12;
      b.vx = Math.abs(b.vx);
      window.Sound?.play('wall');
    } else if (b.x >= fps.courtW - 12) {
      b.x = fps.courtW - 12;
      b.vx = -Math.abs(b.vx);
      window.Sound?.play('wall');
    }

    if (b.y <= -fps.courtH + 12) {
      b.y = -fps.courtH + 12;
      b.vy = Math.abs(b.vy);
      window.Sound?.play('wall');
    } else if (b.y >= fps.courtH - 12) {
      b.y = fps.courtH - 12;
      b.vy = -Math.abs(b.vy);
      window.Sound?.play('wall');
    }

    // Opponent Hit at Far End (z >= oppZ)
    if (b.z >= fps.oppZ) {
      if (Math.abs(b.x - fps.oppX) <= fps.oppW / 2 + 14 && Math.abs(b.y - fps.oppY) <= fps.oppH / 2 + 14) {
        b.z = fps.oppZ;
        b.vz = -Math.abs(b.vz) * 1.02;
        b.vx = ((b.x - fps.oppX) / (fps.oppW / 2)) * 3.4 + (Math.random() - 0.5) * 1.0;
        b.vy = ((b.y - fps.oppY) / (fps.oppH / 2)) * 2.4 + (Math.random() - 0.5) * 1.0;
        window.Sound?.play('hit');
      } else if (b.z > fps.oppZ + 50) {
        // Player Scores!
        this.player.score++;
        window.Sound?.play('score');
        if (this.player.score >= 5) {
          this.showResult(true, 'FIRST-PERSON 3D CHAMPION!');
          return;
        }
        b.x = fps.oppX;
        b.y = fps.oppY;
        b.z = fps.oppZ - 30;
        b.vz = -6.5;
        b.vx = (Math.random() - 0.5) * 2.8;
        b.vy = (Math.random() - 0.5) * 1.8;
      }
    }

    // Player Hit at Near Plane (z = playerZ):
    if (b.vz < 0 && b.z <= fps.playerZ + b.radius + 6) {
      const reachX = fps.playerW / 2 + b.radius + 6;
      const reachY = fps.playerH / 2 + b.radius + 6;

      const tCrossing = prevZ !== b.z ? Math.max(0, Math.min(1, (fps.playerZ - prevZ) / (b.z - prevZ))) : 1;
      const crossX = prevX + (b.x - prevX) * tCrossing;
      const crossY = prevY + (b.y - prevY) * tCrossing;

      const hitCurrent = Math.abs(b.x - fps.playerX) <= reachX && Math.abs(b.y - fps.playerY) <= reachY;
      const hitCrossing = Math.abs(crossX - fps.playerX) <= reachX && Math.abs(crossY - fps.playerY) <= reachY;

      if (hitCurrent || hitCrossing) {
        b.z = fps.playerZ + b.radius + 4;
        b.vz = Math.abs(b.vz) * 1.02;
        b.vx = ((crossX - fps.playerX) / (fps.playerW / 2)) * 4.4 + (Math.random() - 0.5) * 0.6;
        b.vy = ((crossY - fps.playerY) / (fps.playerH / 2)) * 3.4 + (Math.random() - 0.5) * 0.6;
        fps.paddleFlash = 0.35;
        fps.shake = 10;
        window.Sound?.play('paddle');
      } else if (b.z <= fps.playerZ) {
        // Immediate miss resolution right at the paddle plane - no ghost hovering behind paddle!
        this.enemy.score++;
        fps.shake = 18;
        window.Sound?.play('lose');
        if (this.enemy.score >= 5) {
          this.showResult(false, 'DEFEATED IN FIRST-PERSON 3D!');
          return;
        }
        b.x = fps.playerX;
        b.y = fps.playerY;
        b.z = fps.playerZ + 40;
        b.vz = 6.5;
        b.vx = (Math.random() - 0.5) * 2.8;
        b.vy = (Math.random() - 0.5) * 1.8;
      }
    }
  }

  renderFirstPerson3D(ctx, colWhite, colBlack) {
    const fps = this.modeState;

    if (fps.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * fps.shake, (Math.random() - 0.5) * fps.shake);
    }

    // 3D Perspective Projection Function
    const project = (x, y, z) => {
      const focal = 320;
      const scale = focal / (z + focal);
      return {
        x: CANVAS_WIDTH / 2 + x * scale,
        y: CANVAS_HEIGHT / 2 + y * scale,
        s: scale
      };
    };

    // Header & Scoreboard
    ctx.fillStyle = '#666666';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('FIRST-PERSON 3D PONG', CANVAS_WIDTH / 2, 22);

    ctx.font = '22px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.fillText(`YOU: ${this.player.score}   OPPONENT: ${this.enemy.score}`, CANVAS_WIDTH / 2, 54);

    // 3D Tunnel Wireframe
    const pFarTL = project(-fps.courtW, -fps.courtH, fps.oppZ);
    const pFarTR = project(fps.courtW, -fps.courtH, fps.oppZ);
    const pFarBR = project(fps.courtW, fps.courtH, fps.oppZ);
    const pFarBL = project(-fps.courtW, fps.courtH, fps.oppZ);

    const nearL = 60, nearR = CANVAS_WIDTH - 60;
    const nearT = 60, nearB = CANVAS_HEIGHT - 60;

    // Near Court Rim
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.strokeRect(nearL, nearT, nearR - nearL, nearB - nearT);

    // Far Back Wall Frame
    ctx.beginPath();
    ctx.moveTo(pFarTL.x, pFarTL.y);
    ctx.lineTo(pFarTR.x, pFarTR.y);
    ctx.lineTo(pFarBR.x, pFarBR.y);
    ctx.lineTo(pFarBL.x, pFarBL.y);
    ctx.closePath();
    ctx.stroke();

    // 4 Diagonal Tunnel Edges Connecting Near Rim to Far Frame
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(nearL, nearT); ctx.lineTo(pFarTL.x, pFarTL.y);
    ctx.moveTo(nearR, nearT); ctx.lineTo(pFarTR.x, pFarTR.y);
    ctx.moveTo(nearR, nearB); ctx.lineTo(pFarBR.x, pFarBR.y);
    ctx.moveTo(nearL, nearB); ctx.lineTo(pFarBL.x, pFarBL.y);
    ctx.stroke();

    // Floor Longitudinal Lines
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    for (let lx = -fps.courtW + 105; lx < fps.courtW; lx += 105) {
      const pStart = project(lx, fps.courtH, 0);
      const pEnd = project(lx, fps.courtH, fps.oppZ);
      ctx.beginPath();
      ctx.moveTo(pStart.x, nearB);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
    }

    // Floor Transverse Depth Lines
    for (let lz = 100; lz < fps.oppZ; lz += 100) {
      const p1 = project(-fps.courtW, fps.courtH, lz);
      const p2 = project(fps.courtW, fps.courtH, lz);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Opponent Silhouette at Far End (z = oppZ)
    const oppProj = project(fps.oppX, fps.oppY, fps.oppZ);
    const oppWP = fps.oppW * oppProj.s;
    const oppHP = fps.oppH * oppProj.s;

    // Retro 1-bit Opponent Figure
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 1.5;
    // Head
    ctx.beginPath();
    ctx.arc(oppProj.x, oppProj.y - oppHP * 0.9, 6 * oppProj.s, 0, Math.PI * 2);
    ctx.stroke();
    // Torso & Arms
    ctx.beginPath();
    ctx.moveTo(oppProj.x, oppProj.y - oppHP * 0.7);
    ctx.lineTo(oppProj.x, oppProj.y);
    ctx.moveTo(oppProj.x - 12 * oppProj.s, oppProj.y - oppHP * 0.4);
    ctx.lineTo(oppProj.x + 12 * oppProj.s, oppProj.y - oppHP * 0.4);
    ctx.stroke();

    // Opponent Paddle
    ctx.fillStyle = colWhite;
    ctx.fillRect(oppProj.x - oppWP / 2, oppProj.y - oppHP / 2, oppWP, oppHP);
    ctx.strokeStyle = colBlack;
    ctx.lineWidth = 1;
    ctx.strokeRect(oppProj.x - oppWP / 2, oppProj.y - oppHP / 2, oppWP, oppHP);

    // 3D Ball
    const b = fps.ball;
    const bProj = project(b.x, b.y, b.z);
    const bShadow = project(b.x, fps.courtH, b.z);
    const ballR = Math.max(3, 14 * bProj.s);

    // Floor Shadow
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.ellipse(bShadow.x, bShadow.y, ballR * 1.4, ballR * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball Sphere
    ctx.fillStyle = colWhite;
    ctx.beginPath();
    ctx.arc(bProj.x, bProj.y, ballR, 0, Math.PI * 2);
    ctx.fill();

    // 3D Wireframe Equator Lines on Ball
    ctx.strokeStyle = colBlack;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(bProj.x, bProj.y, ballR, ballR * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bProj.x, bProj.y - ballR);
    ctx.lineTo(bProj.x, bProj.y + ballR);
    ctx.stroke();

    // Ball Arrival Impact Predictor (Reticle on Paddle Plane) - Only show on Easy and Normal
    const showStrikeZone = (this.difficulty === 'easy' || this.difficulty === 'normal');
    if (showStrikeZone && b.vz < 0 && b.z > fps.playerZ) {
      const tToArrival = (b.z - fps.playerZ) / -b.vz;
      const predX = b.x + b.vx * tToArrival;
      const predY = b.y + b.vy * tToArrival;
      const predProj = project(predX, predY, fps.playerZ);

      const willHit = Math.abs(predX - fps.playerX) <= (fps.playerW / 2 + b.radius + 6) &&
                      Math.abs(predY - fps.playerY) <= (fps.playerH / 2 + b.radius + 6);

      ctx.save();
      ctx.strokeStyle = willHit ? '#ffffff' : '#777777';
      ctx.lineWidth = willHit ? 2 : 1;
      if (!willHit) ctx.setLineDash([3, 3]);

      const markerR = Math.max(5, 14 * Math.min(1, tToArrival / 35));
      ctx.beginPath();
      ctx.arc(predProj.x, predProj.y, markerR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(predProj.x - markerR - 3, predProj.y); ctx.lineTo(predProj.x + markerR + 3, predProj.y);
      ctx.moveTo(predProj.x, predProj.y - markerR - 3); ctx.lineTo(predProj.x, predProj.y + markerR + 3);
      ctx.stroke();
      ctx.restore();
    }

    // Near Player Paddle (Translucent net racket in front of camera)
    const pProj = project(fps.playerX, fps.playerY, fps.playerZ);
    const pWP = fps.playerW * pProj.s;
    const pHP = fps.playerH * pProj.s;

    // Paddle Surface Fill
    ctx.fillStyle = fps.paddleFlash > 0 ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.10)';
    ctx.fillRect(pProj.x - pWP / 2, pProj.y - pHP / 2, pWP, pHP);

    // Racket Mesh Grid Strings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i <= 3; i++) {
      const gx = pProj.x - pWP / 2 + (pWP * i) / 4;
      ctx.moveTo(gx, pProj.y - pHP / 2); ctx.lineTo(gx, pProj.y + pHP / 2);
    }
    for (let j = 1; j <= 2; j++) {
      const gy = pProj.y - pHP / 2 + (pHP * j) / 3;
      ctx.moveTo(pProj.x - pWP / 2, gy); ctx.lineTo(pProj.x + pWP / 2, gy);
    }
    ctx.stroke();

    // Paddle Outer Frame
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = fps.paddleFlash > 0 ? 3 : 2;
    ctx.strokeRect(pProj.x - pWP / 2, pProj.y - pHP / 2, pWP, pHP);

    // Crosshair Reticle & Corner Brackets on Player Paddle
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pProj.x - 10, pProj.y); ctx.lineTo(pProj.x + 10, pProj.y);
    ctx.moveTo(pProj.x, pProj.y - 10); ctx.lineTo(pProj.x, pProj.y + 10);

    const csz = 8;
    const pl = pProj.x - pWP / 2, pr = pProj.x + pWP / 2;
    const pt = pProj.y - pHP / 2, pb = pProj.y + pHP / 2;
    // Top-left corner
    ctx.moveTo(pl, pt + csz); ctx.lineTo(pl, pt); ctx.lineTo(pl + csz, pt);
    // Top-right corner
    ctx.moveTo(pr - csz, pt); ctx.lineTo(pr, pt); ctx.lineTo(pr, pt + csz);
    // Bottom-left corner
    ctx.moveTo(pl, pb - csz); ctx.lineTo(pl, pb); ctx.lineTo(pl + csz, pb);
    // Bottom-right corner
    ctx.moveTo(pr - csz, pb); ctx.lineTo(pr, pb); ctx.lineTo(pr, pb - csz);
    ctx.stroke();

    if (fps.shake > 0) {
      ctx.restore();
    }
  }

  // --- LEVEL 35: GRAVITY WELL MODE ---
  updateGravityWell(dt) {
    const gw = this.modeState;
    const b = this.ball;
    const p = this.player;
    const e = this.enemy;

    // 1. Paddle Controls (W/S or Arrow keys)
    let pDir = 0;
    if (this.keys['w'] || this.keys['arrowup']) pDir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) pDir += 1;
    p.y += pDir * (p.speed || 6.5);
    p.y = Math.max(34, Math.min(CANVAS_HEIGHT - 34 - p.h, p.y));

    // Enemy AI Tracking
    const eTargetY = b.y - e.h / 2;
    if (b.x > CANVAS_WIDTH - e.reactionDist) {
      const eDiff = eTargetY - e.y;
      if (Math.abs(eDiff) > e.jitter) {
        e.y += Math.sign(eDiff) * Math.min(Math.abs(eDiff), e.speed);
      }
    }
    e.y = Math.max(34, Math.min(CANVAS_HEIGHT - 34 - e.h, e.y));

    // 2. Gravitational Well Attraction & Soft Swirl
    const dx = gw.wellX - b.x;
    const dy = gw.wellY - b.y;
    const dist = Math.max(45, Math.hypot(dx, dy));

    // Gentle inverse-distance acceleration
    const pullAccel = (gw.pullStrength / dist) * dt * 0.42;
    const swirlAccel = (gw.swirlStrength / dist) * dt * 0.32;

    const normX = dx / dist;
    const normY = dy / dist;
    const tanX = -normY;
    const tanY = normX;

    b.vx += normX * pullAccel + tanX * swirlAccel;
    b.vy += normY * pullAccel + tanY * swirlAccel;

    // Cap velocity
    const currSpeed = Math.hypot(b.vx, b.vy);
    const aiCfg = this.getAiConfig();
    const maxSpd = aiCfg.maxBallSpeed || 14.0;
    if (currSpeed > maxSpd) {
      b.vx = (b.vx / currSpeed) * maxSpd;
      b.vy = (b.vy / currSpeed) * maxSpd;
    }

    // Move ball
    b.x += b.vx;
    b.y += b.vy;

    // Top / Bottom Wall Bounces
    if (b.y - b.size / 2 <= 34) {
      b.y = 34 + b.size / 2;
      b.vy = Math.abs(b.vy);
      window.Sound?.play('wall');
    } else if (b.y + b.size / 2 >= CANVAS_HEIGHT - 34) {
      b.y = CANVAS_HEIGHT - 34 - b.size / 2;
      b.vy = -Math.abs(b.vy);
      window.Sound?.play('wall');
    }

    const speedUp = aiCfg.ballSpeedUp || 1.05;

    // Player Paddle Bounce
    if (b.vx < 0 && b.x - b.size / 2 <= p.x + p.w && b.x + b.size / 2 >= p.x && b.y >= p.y - 6 && b.y <= p.y + p.h + 6) {
      b.x = p.x + p.w + b.size / 2;
      const offset = (b.y - (p.y + p.h / 2)) / (p.h / 2);
      b.vx = Math.min(maxSpd, Math.abs(b.vx) * speedUp);
      b.vy += offset * 3.2;
      window.Sound?.play('paddle');
    }

    // Enemy Paddle Bounce
    if (b.vx > 0 && b.x + b.size / 2 >= e.x && b.x - b.size / 2 <= e.x + e.w && b.y >= e.y - 6 && b.y <= e.y + e.h + 6) {
      b.x = e.x - b.size / 2;
      const offset = (b.y - (e.y + e.h / 2)) / (e.h / 2);
      b.vx = -Math.min(maxSpd, Math.abs(b.vx) * speedUp);
      b.vy += offset * 3.2;
      window.Sound?.play('hit');
    }

    // Score checks
    if (b.x < 10) {
      e.score++;
      window.Sound?.play('lose');
      if (e.score >= 5) this.showResult(false, 'GRAVITY DEFEAT!');
      else this.resetBall(true);
    } else if (b.x > CANVAS_WIDTH - 10) {
      p.score++;
      window.Sound?.play('score');
      if (p.score >= 5) this.showResult(true, 'GRAVITY MASTER CHAMPION!');
      else this.resetBall(false);
    }
  }

  renderGravityWell(ctx, colWhite, colBlack) {
    const gw = this.modeState;
    const cx = gw.wellX, cy = gw.wellY;

    // Header & Score
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, CANVAS_WIDTH / 2 - 80, 80);
    ctx.fillText(`${this.enemy.score}`, CANVAS_WIDTH / 2 + 80, 80);

    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#666666';
    ctx.fillText('GRAVITY WELL PONG', CANVAS_WIDTH / 2, 22);

    // Walls
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // Central Clean Gravity Well (Simple Retro Minimalism)
    ctx.fillStyle = colBlack;
    ctx.beginPath();
    ctx.arc(cx, cy, gw.wellRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, gw.wellRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Paddles
    ctx.fillStyle = colWhite;
    ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    ctx.fillRect(this.enemy.x, this.enemy.y, this.enemy.w, this.enemy.h);

    // Ball
    ctx.fillRect(this.ball.x - this.ball.size / 2, this.ball.y - this.ball.size / 2, this.ball.size, this.ball.size);
  }

  // --- LEVEL 36: 4-PLAYER KNOCKOUT MODE ---
  updateFourPlayer(dt) {
    const fs = this.modeState;
    const b = fs.ball;
    const pads = fs.paddles;

    // 1. Bottom (Player) Paddle Movement (A/D or Arrow keys)
    const bot = pads.bottom;
    if (bot.alive) {
      if (this.keys['a'] || this.keys['arrowleft']) bot.x -= (bot.speed || 5.0);
      if (this.keys['d'] || this.keys['arrowright']) bot.x += (bot.speed || 5.0);
      bot.x = Math.max(fs.left, Math.min(fs.right - bot.w, bot.x));
    }

    // 2. Top AI Paddle
    const top = pads.top;
    if (top.alive && b.vy < 0 && b.y < 340) {
      const tCenter = top.x + top.w / 2;
      const tDiff = b.x - tCenter;
      if (Math.abs(tDiff) > 8) top.x += Math.sign(tDiff) * Math.min(Math.abs(tDiff), top.speed);
      top.x = Math.max(fs.left, Math.min(fs.right - top.w, top.x));
    }

    // 3. Left AI Paddle
    const left = pads.left;
    if (left.alive && b.vx < 0 && b.x < 480) {
      const lCenter = left.y + left.h / 2;
      const lDiff = b.y - lCenter;
      if (Math.abs(lDiff) > 8) left.y += Math.sign(lDiff) * Math.min(Math.abs(lDiff), left.speed);
      left.y = Math.max(fs.top, Math.min(fs.bottom - left.h, left.y));
    }

    // 4. Right AI Paddle
    const right = pads.right;
    if (right.alive && b.vx > 0 && b.x > 480) {
      const rCenter = right.y + right.h / 2;
      const rDiff = b.y - rCenter;
      if (Math.abs(rDiff) > 8) right.y += Math.sign(rDiff) * Math.min(Math.abs(rDiff), right.speed);
      right.y = Math.max(fs.top, Math.min(fs.bottom - right.h, right.y));
    }

    // 5. Ball Physics
    b.x += b.vx;
    b.y += b.vy;
    const r = b.size / 2;

    const aiCfg = this.getAiConfig();
    const speedUp = aiCfg.ballSpeedUp || 1.025;
    const maxSpd = aiCfg.maxBallSpeed || 15.0;

    // Check Alive Paddle Collisions
    // Bottom Paddle
    if (bot.alive && b.vy > 0 && b.y + r >= bot.y && b.y - r <= bot.y + bot.h && b.x >= bot.x - 4 && b.x <= bot.x + bot.w + 4) {
      b.y = bot.y - r;
      b.vy = -Math.min(maxSpd, Math.abs(b.vy) * speedUp);
      b.vx += ((b.x - (bot.x + bot.w / 2)) / (bot.w / 2)) * 3.2;
      fs.lastHitter = 'bottom';
      window.Sound?.play('paddle');
    }
    // Top Paddle
    if (top.alive && b.vy < 0 && b.y - r <= top.y + top.h && b.y + r >= top.y && b.x >= top.x - 4 && b.x <= top.x + top.w + 4) {
      b.y = top.y + top.h + r;
      b.vy = Math.min(maxSpd, Math.abs(b.vy) * speedUp);
      b.vx += ((b.x - (top.x + top.w / 2)) / (top.w / 2)) * 3.2;
      fs.lastHitter = 'top';
      window.Sound?.play('hit');
    }
    // Left Paddle
    if (left.alive && b.vx < 0 && b.x - r <= left.x + left.w && b.x + r >= left.x && b.y >= left.y - 4 && b.y <= left.y + left.h + 4) {
      b.x = left.x + left.w + r;
      b.vx = Math.min(maxSpd, Math.abs(b.vx) * speedUp);
      b.vy += ((b.y - (left.y + left.h / 2)) / (left.h / 2)) * 3.2;
      fs.lastHitter = 'left';
      window.Sound?.play('hit');
    }
    // Right Paddle
    if (right.alive && b.vx > 0 && b.x + r >= right.x && b.x - r <= right.x + right.w && b.y >= right.y - 4 && b.y <= right.y + right.h + 4) {
      b.x = right.x - r;
      b.vx = -Math.min(maxSpd, Math.abs(b.vx) * speedUp);
      b.vy += ((b.y - (right.y + right.h / 2)) / (right.h / 2)) * 3.2;
      fs.lastHitter = 'right';
      window.Sound?.play('hit');
    }

    // Check Wall Collisions (for Knocked-out edges)
    if (!bot.alive && b.y + r >= fs.bottom) {
      b.y = fs.bottom - r;
      b.vy = -Math.abs(b.vy);
      window.Sound?.play('wall');
    }
    if (!top.alive && b.y - r <= fs.top) {
      b.y = fs.top + r;
      b.vy = Math.abs(b.vy);
      window.Sound?.play('wall');
    }
    if (!left.alive && b.x - r <= fs.left) {
      b.x = fs.left + r;
      b.vx = Math.abs(b.vx);
      window.Sound?.play('wall');
    }
    if (!right.alive && b.x + r >= fs.right) {
      b.x = fs.right - r;
      b.vx = -Math.abs(b.vx);
      window.Sound?.play('wall');
    }

    // Elimination Triggers (passing an ALIVE paddle boundary)
    const resetCenterBall = () => {
      b.x = 480;
      b.y = 270;
      const alivePads = Object.values(pads).filter(p => p.alive);
      if (alivePads.length > 0) {
        const targetPad = alivePads[Math.floor(Math.random() * alivePads.length)];
        if (targetPad.id === 'bottom') { b.vx = (Math.random() - 0.5) * 4; b.vy = 4.8; }
        else if (targetPad.id === 'top') { b.vx = (Math.random() - 0.5) * 4; b.vy = -4.8; }
        else if (targetPad.id === 'left') { b.vx = -4.8; b.vy = (Math.random() - 0.5) * 4; }
        else { b.vx = 4.8; b.vy = (Math.random() - 0.5) * 4; }
      }
    };

    if (bot.alive && b.y > fs.bottom + 8) {
      bot.alive = false;
      window.Sound?.play('lose');
      this.showResult(false, 'YOU WERE KNOCKED OUT!');
      return;
    }
    if (top.alive && b.y < fs.top - 8) {
      top.alive = false;
      fs.eliminatedCount++;
      window.Sound?.play('score');
      resetCenterBall();
    }
    if (left.alive && b.x < fs.left - 8) {
      left.alive = false;
      fs.eliminatedCount++;
      window.Sound?.play('score');
      resetCenterBall();
    }
    if (right.alive && b.x > fs.right + 8) {
      right.alive = false;
      fs.eliminatedCount++;
      window.Sound?.play('score');
      resetCenterBall();
    }

    if (fs.eliminatedCount >= 3) {
      window.Sound?.play('win');
      this.showResult(true, 'LAST PADDLE STANDING! KNOCKOUT CHAMPION!');
    }
  }

  renderFourPlayer(ctx, colWhite, colBlack) {
    const fs = this.modeState;
    const pads = fs.paddles;

    // Header
    ctx.fillStyle = '#666666';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('4-PLAYER KNOCKOUT SQUARE ARENA', CANVAS_WIDTH / 2, 16);

    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    const aliveCount = Object.values(pads).filter(p => p.alive).length;
    ctx.fillText(`PADDLES REMAINING: ${aliveCount} / 4`, CANVAS_WIDTH / 2, 32);

    // Draw 4 Borders: Solid 6px hatched wall if dead, thin 1px line if alive
    const drawSideWall = (x1, y1, x2, y2, isDead, isHoriz) => {
      if (isDead) {
        ctx.fillStyle = colWhite;
        if (isHoriz) {
          ctx.fillRect(Math.min(x1, x2), y1 - 3, Math.abs(x2 - x1), 6);
        } else {
          ctx.fillRect(x1 - 3, Math.min(y1, y2), 6, Math.abs(y2 - y1));
        }
      } else {
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    drawSideWall(fs.left, fs.top, fs.right, fs.top, !pads.top.alive, true);
    drawSideWall(fs.left, fs.bottom, fs.right, fs.bottom, !pads.bottom.alive, true);
    drawSideWall(fs.left, fs.top, fs.left, fs.bottom, !pads.left.alive, false);
    drawSideWall(fs.right, fs.top, fs.right, fs.bottom, !pads.right.alive, false);

    // Draw Center Net Cross
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(fs.left, 270); ctx.lineTo(fs.right, 270);
    ctx.moveTo(480, fs.top); ctx.lineTo(480, fs.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Alive Paddles
    ctx.fillStyle = colWhite;
    if (pads.bottom.alive) ctx.fillRect(pads.bottom.x, pads.bottom.y, pads.bottom.w, pads.bottom.h);
    if (pads.top.alive) ctx.fillRect(pads.top.x, pads.top.y, pads.top.w, pads.top.h);
    if (pads.left.alive) ctx.fillRect(pads.left.x, pads.left.y, pads.left.w, pads.left.h);
    if (pads.right.alive) ctx.fillRect(pads.right.x, pads.right.y, pads.right.w, pads.right.h);

    // Labels
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = pads.bottom.alive ? colWhite : '#555555';
    ctx.fillText(pads.bottom.alive ? 'YOU (P1)' : '[WALL]', 480, fs.bottom + 22);

    ctx.fillStyle = pads.top.alive ? colWhite : '#555555';
    ctx.fillText(pads.top.alive ? 'AI 1' : '[WALL]', 480, fs.top - 14);

    ctx.fillStyle = pads.left.alive ? colWhite : '#555555';
    ctx.fillText(pads.left.alive ? 'AI 2' : '[WALL]', fs.left - 30, 274);

    ctx.fillStyle = pads.right.alive ? colWhite : '#555555';
    ctx.fillText(pads.right.alive ? 'AI 3' : '[WALL]', fs.right + 30, 274);

    // Ball
    ctx.fillStyle = colWhite;
    ctx.fillRect(fs.ball.x - fs.ball.size / 2, fs.ball.y - fs.ball.size / 2, fs.ball.size, fs.ball.size);
  }

  // --- LEVEL 37: DRUNK PONG MODE ---
  updateDrunkPong(dt) {
    const dp = this.modeState;
    dp.wobbleTime += dt;
    const p = this.player;
    const e = this.enemy;
    const b = this.ball;

    // Drunken Sway on player controls (W/S or Arrow keys)
    const sway = Math.sin(dp.wobbleTime * 3.0) * 8 * dp.drunkFactor;
    let targetY = p.y;
    if (this.keys['w'] || this.keys['arrowup']) targetY -= 7.5;
    if (this.keys['s'] || this.keys['arrowdown']) targetY += 7.5;

    p.y += ((targetY + sway) - p.y) * 0.45;
    p.y = Math.max(34, Math.min(CANVAS_HEIGHT - 34 - p.h, p.y));

    // Enemy AI with drunken hiccups
    const eSway = Math.cos(dp.wobbleTime * 4.2) * 24 * dp.drunkFactor;
    const eTargetY = b.y - e.h / 2 + eSway;
    if (b.x > CANVAS_WIDTH - e.reactionDist) {
      const eDiff = eTargetY - e.y;
      if (Math.abs(eDiff) > e.jitter) {
        e.y += Math.sign(eDiff) * Math.min(Math.abs(eDiff), e.speed);
      }
    }
    e.y = Math.max(34, Math.min(CANVAS_HEIGHT - 34 - e.h, e.y));

    // Ball motion with slight drunken snake ripple
    b.x += b.vx;
    b.y += b.vy + Math.sin(dp.wobbleTime * 5.5 + b.x * 0.02) * (1.8 * dp.drunkFactor);

    // Wall bounces
    if (b.y - b.size / 2 <= 34) {
      b.y = 34 + b.size / 2;
      b.vy = Math.abs(b.vy);
      window.Sound?.play('wall');
    } else if (b.y + b.size / 2 >= CANVAS_HEIGHT - 34) {
      b.y = CANVAS_HEIGHT - 34 - b.size / 2;
      b.vy = -Math.abs(b.vy);
      window.Sound?.play('wall');
    }

    const aiCfg = this.getAiConfig();
    const speedUp = aiCfg.ballSpeedUp || 1.05;
    const maxSpd = aiCfg.maxBallSpeed || 16.0;

    // Paddle Collisions
    if (b.vx < 0 && b.x - b.size / 2 <= p.x + p.w && b.x + b.size / 2 >= p.x && b.y >= p.y - 6 && b.y <= p.y + p.h + 6) {
      b.x = p.x + p.w + b.size / 2;
      const offset = (b.y - (p.y + p.h / 2)) / (p.h / 2);
      b.vx = Math.min(maxSpd, Math.abs(b.vx) * speedUp);
      b.vy = offset * 4.2;
      window.Sound?.play('paddle');
    }
    if (b.vx > 0 && b.x + b.size / 2 >= e.x && b.x - b.size / 2 <= e.x + e.w && b.y >= e.y - 6 && b.y <= e.y + e.h + 6) {
      b.x = e.x - b.size / 2;
      const offset = (b.y - (e.y + e.h / 2)) / (e.h / 2);
      b.vx = -Math.min(maxSpd, Math.abs(b.vx) * speedUp);
      b.vy = offset * 4.2;
      window.Sound?.play('hit');
    }

    // Scoring
    if (b.x < 10) {
      e.score++;
      window.Sound?.play('lose');
      if (e.score >= 5) this.showResult(false, 'OUT-DRUNK BY THE BOT!');
      else this.resetBall(true);
    } else if (b.x > CANVAS_WIDTH - 10) {
      p.score++;
      window.Sound?.play('score');
      if (p.score >= 5) this.showResult(true, 'DRUNK PONG MASTER!');
      else this.resetBall(false);
    }
  }

  renderDrunkPong(ctx, colWhite, colBlack) {
    const dp = this.modeState;
    const t = dp.wobbleTime;
    const fac = dp.drunkFactor;

    ctx.save();

    // Drunk Wobbly Oscillating Court Boundaries
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
      const wy = 34 + Math.sin(x * 0.03 + t * 4.5) * (7 * fac);
      if (x === 0) ctx.moveTo(x, wy); else ctx.lineTo(x, wy);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
      const wy = (CANVAS_HEIGHT - 34) + Math.cos(x * 0.03 + t * 4.0) * (7 * fac);
      if (x === 0) ctx.moveTo(x, wy); else ctx.lineTo(x, wy);
    }
    ctx.stroke();

    // Snake Wiggling Center Net
    for (let y = 44; y < CANVAS_HEIGHT - 38; y += 22) {
      const netX = CANVAS_WIDTH / 2 + Math.sin(y * 0.04 + t * 4.2) * (18 * fac);
      ctx.fillRect(netX - 2, y, 4, 12);
    }

    // Scoreboard (Wobbly letters)
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    const sSway = Math.sin(t * 3.5) * 6;
    ctx.fillText(`${this.player.score}`, CANVAS_WIDTH / 2 - 80 + sSway, 80 - sSway);
    ctx.fillText(`${this.enemy.score}`, CANVAS_WIDTH / 2 + 80 - sSway, 80 + sSway);

    // Double Vision Echo Paddles (Ghost effect)
    const echoOffX = Math.cos(t * 4.2) * 12 * fac;
    const echoOffY = Math.sin(t * 3.5) * 10 * fac;

    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.player.x + echoOffX, this.player.y + echoOffY, this.player.w, this.player.h);
    ctx.strokeRect(this.enemy.x - echoOffX, this.enemy.y - echoOffY, this.enemy.w, this.enemy.h);

    // Solid Main Paddles
    ctx.fillStyle = colWhite;
    ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    ctx.fillRect(this.enemy.x, this.enemy.y, this.enemy.w, this.enemy.h);

    // Ball with Ghost Echo
    ctx.strokeRect(this.ball.x - this.ball.size / 2 + echoOffX, this.ball.y - this.ball.size / 2 + echoOffY, this.ball.size, this.ball.size);
    ctx.fillRect(this.ball.x - this.ball.size / 2, this.ball.y - this.ball.size / 2, this.ball.size, this.ball.size);

    ctx.restore();
  }

  // --- LEVEL 38: PADDLE DODGE (SURVIVE 10 SECONDS) ---
  updatePaddleDodge(dt) {
    const pd = this.modeState;
    if (pd.shake > 0) pd.shake = Math.max(0, pd.shake - dt * 25);
    pd.timeLeft = Math.max(0, pd.timeLeft - dt);

    const p = pd.player;

    // 1. Player Ball Movement
    // 1. Player Paddle Movement via WASD or Arrow Keys
    let mx = 0, my = 0;
    if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) mx += 1;
    if (this.keys['w'] || this.keys['arrowup']) my -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) my += 1;

    if (mx !== 0 && my !== 0) { mx *= 0.7071; my *= 0.7071; }
    p.x += mx * (p.speed || 7.0);
    p.y += my * (p.speed || 7.0);

    const minX = 40, maxX = CANVAS_WIDTH - 40;
    const minY = 50, maxY = CANVAS_HEIGHT - 50;
    p.x = Math.max(minX, Math.min(maxX, p.x));
    p.y = Math.max(minY, Math.min(maxY, p.y));

    // 2. Spawn second paddle after 5 seconds (timeLeft <= 10.0)
    if (pd.timeLeft <= 10.0 && !pd.secondPaddleSpawned) {
      pd.secondPaddleSpawned = true;
      const aiCfg = this.getAiConfig();
      const rSpeed = aiCfg.dodgeRogueSpeed || 11.5;
      pd.rogues.push({
        x: CANVAS_WIDTH - 180,
        y: CANVAS_HEIGHT - 120,
        vx: -rSpeed * 0.75,
        vy: -rSpeed * 0.65,
        w: 16,
        h: 76,
        angle: Math.PI / 4,
        angVel: -0.12,
        trail: []
      });
      window.Sound?.play('wall');
    }

    // 3. Spawn third paddle after another 5 seconds (timeLeft <= 5.0)
    if (pd.timeLeft <= 5.0 && !pd.thirdPaddleSpawned) {
      pd.thirdPaddleSpawned = true;
      const aiCfg = this.getAiConfig();
      const rSpeed = aiCfg.dodgeRogueSpeed || 11.5;
      pd.rogues.push({
        x: CANVAS_WIDTH / 2,
        y: 100,
        vx: rSpeed * 0.7,
        vy: -rSpeed * 0.7,
        w: 16,
        h: 76,
        angle: Math.PI / 2,
        angVel: 0.14,
        trail: []
      });
      window.Sound?.play('wall');
    }

    // 4. Update Bouncing Rogue Paddles
    for (const rogue of pd.rogues) {
      rogue.x += rogue.vx;
      rogue.y += rogue.vy;
      rogue.angle += rogue.angVel;

      // Trail
      rogue.trail.push({ x: rogue.x, y: rogue.y, angle: rogue.angle });
      if (rogue.trail.length > 5) rogue.trail.shift();

      // Bounces off room bounds
      if (rogue.x - rogue.h / 2 <= minX) {
        rogue.x = minX + rogue.h / 2;
        rogue.vx = Math.abs(rogue.vx);
        window.Sound?.play('wall');
      } else if (rogue.x + rogue.h / 2 >= maxX) {
        rogue.x = maxX - rogue.h / 2;
        rogue.vx = -Math.abs(rogue.vx);
        window.Sound?.play('wall');
      }

      if (rogue.y - rogue.h / 2 <= minY) {
        rogue.y = minY + rogue.h / 2;
        rogue.vy = Math.abs(rogue.vy);
        window.Sound?.play('wall');
      } else if (rogue.y + rogue.h / 2 >= maxY) {
        rogue.y = maxY - rogue.h / 2;
        rogue.vy = -Math.abs(rogue.vy);
        window.Sound?.play('wall');
      }

      // Check collision with player sphere (Rotated rectangle vs circle)
      const cosA = Math.cos(-rogue.angle);
      const sinA = Math.sin(-rogue.angle);
      const relX = p.x - rogue.x;
      const relY = p.y - rogue.y;
      const localX = cosA * relX - sinA * relY;
      const localY = sinA * relX + cosA * relY;

      const closestX = Math.max(-rogue.w / 2, Math.min(rogue.w / 2, localX));
      const closestY = Math.max(-rogue.h / 2, Math.min(rogue.h / 2, localY));
      const distSq = (localX - closestX) * (localX - closestX) + (localY - closestY) * (localY - closestY);

      if (distSq <= p.r * p.r) {
        // Player got struck by rogue paddle!
        window.Sound?.play('lose');
        pd.shake = 16;
        pd.timeLeft = pd.targetTime; // Reset timer
        pd.secondPaddleSpawned = false;
        pd.thirdPaddleSpawned = false;
        if (pd.rogues.length > 1) {
          pd.rogues.length = 1;
        }
        p.x = CANVAS_WIDTH / 2;
        p.y = CANVAS_HEIGHT / 2;
        pd.attempts++;
        return;
      }
    }

    // 5. Victory Condition
    if (pd.timeLeft <= 0) {
      window.Sound?.play('win');
      this.showResult(true, `SURVIVED 15 SECONDS! (ATTEMPTS: ${pd.attempts})`);
    }
  }

  renderPaddleDodge(ctx, colWhite, colBlack) {
    const pd = this.modeState;
    if (pd.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * pd.shake, (Math.random() - 0.5) * pd.shake);
    }

    // Arena Walls
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 40, CANVAS_WIDTH - 60, CANVAS_HEIGHT - 80);

    // Countdown Timer (No extra text)
    ctx.font = '24px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, pd.timeLeft).toFixed(1)}s`, CANVAS_WIDTH / 2, 85);

    // Progress Bar
    const progW = 320;
    const progress = (pd.targetTime - pd.timeLeft) / pd.targetTime;
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 1;
    ctx.strokeRect((CANVAS_WIDTH - progW) / 2, 98, progW, 8);
    ctx.fillRect((CANVAS_WIDTH - progW) / 2, 98, progW * progress, 8);

    // Render Rogue Paddle Trail Echoes
    for (const rogue of pd.rogues) {
      for (let i = 0; i < rogue.trail.length; i++) {
        const pt = rogue.trail[i];
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.angle);
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.strokeRect(-rogue.w / 2, -rogue.h / 2, rogue.w, rogue.h);
        ctx.restore();
      }

      // Main Rogue Paddle
      ctx.save();
      ctx.translate(rogue.x, rogue.y);
      ctx.rotate(rogue.angle);
      ctx.fillStyle = colWhite;
      ctx.fillRect(-rogue.w / 2, -rogue.h / 2, rogue.w, rogue.h);
      // Sharp inner hazard cross
      ctx.strokeStyle = colBlack;
      ctx.lineWidth = 1;
      ctx.strokeRect(-rogue.w / 2 + 2, -rogue.h / 2 + 2, rogue.w - 4, rogue.h - 4);
      ctx.restore();
    }

    // Render Player Ball
    const p = pd.player;
    ctx.fillStyle = colWhite;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();

    // Pulse Ring around Player
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 6, 0, Math.PI * 2);
    ctx.stroke();

    if (pd.shake > 0) ctx.restore();
  }

  // --- LEVEL 39: CUBE PADDLE MODE ---
  updateCubePaddle(dt) {
    const cs = this.modeState;
    if (cs.lastHitCooldown > 0) cs.lastHitCooldown -= dt;
    const p = this.player;
    const e = this.enemy;
    const b = this.ball;

    // Player Paddle Movement (W/S or Arrow keys)
    let pDir = 0;
    if (this.keys['w'] || this.keys['arrowup']) pDir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) pDir += 1;
    p.y += pDir * (p.speed || 6.5);
    p.y = Math.max(34, Math.min(CANVAS_HEIGHT - 34 - p.h, p.y));

    // Enemy AI Movement
    const eTargetY = b.y - e.h / 2;
    if (b.x > CANVAS_WIDTH - e.reactionDist) {
      const eDiff = eTargetY - e.y;
      if (Math.abs(eDiff) > e.jitter) {
        e.y += Math.sign(eDiff) * Math.min(Math.abs(eDiff), e.speed);
      }
    }
    e.y = Math.max(34, Math.min(CANVAS_HEIGHT - 34 - e.h, e.y));

    // Ball Movement
    b.x += b.vx;
    b.y += b.vy;

    // Wall Bounces
    if (b.y - b.size / 2 <= 34) {
      b.y = 34 + b.size / 2;
      b.vy = Math.abs(b.vy);
      window.Sound?.play('wall');
    } else if (b.y + b.size / 2 >= CANVAS_HEIGHT - 34) {
      b.y = CANVAS_HEIGHT - 34 - b.size / 2;
      b.vy = -Math.abs(b.vy);
      window.Sound?.play('wall');
    }

    // Helper: Test rect collision
    const testHitRect = (rx, ry, rw, rh) => {
      return (
        b.x + b.size / 2 >= rx &&
        b.x - b.size / 2 <= rx + rw &&
        b.y + b.size / 2 >= ry &&
        b.y - b.size / 2 <= ry + rh
      );
    };

    // 1. Player Paddle Collisions (Main body + Attached Cubes)
    if (b.vx < 0 && cs.lastHitCooldown <= 0) {
      let hit = false;
      let contactX = b.x - b.size / 2;
      let contactY = b.y;

      if (testHitRect(p.x, p.y, p.w, p.h)) {
        hit = true;
      } else {
        // Test attached cubes
        for (const cube of cs.playerCubes) {
          const cx = p.x + p.w / 2 + cube.rx - cube.w / 2;
          const cy = p.y + p.h / 2 + cube.ry - cube.h / 2;
          if (testHitRect(cx, cy, cube.w, cube.h)) {
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        cs.lastHitCooldown = 0.12;
        b.vx = Math.abs(b.vx) * 1.03;
        const offset = (b.y - (p.y + p.h / 2)) / (p.h / 2);
        b.vy = offset * 4.4 + (Math.random() - 0.5);

        // Add a new cube permanently attached ONTO the player paddle (no overlap)
        const cubeSize = 12;
        if (contactY < p.y - 2) {
          // Attaches onto top edge
          const topCubes = cs.playerCubes.filter(c => c.rx === 0);
          const minRy = topCubes.length > 0 ? Math.min(...topCubes.map(c => c.ry)) : -(p.h / 2);
          const newRy = Math.min(minRy, -(p.h / 2)) - cubeSize;
          cs.playerCubes.push({ rx: 0, ry: newRy, w: cubeSize, h: cubeSize });
        } else if (contactY > p.y + p.h + 2) {
          // Attaches onto bottom edge
          const botCubes = cs.playerCubes.filter(c => c.rx === 0);
          const maxRy = botCubes.length > 0 ? Math.max(...botCubes.map(c => c.ry)) : (p.h / 2);
          const newRy = Math.max(maxRy, (p.h / 2)) + cubeSize;
          cs.playerCubes.push({ rx: 0, ry: newRy, w: cubeSize, h: cubeSize });
        } else {
          // Attaches onto front face extending outward towards the right (+X)
          const rowY = Math.round((contactY - (p.y + p.h / 2)) / cubeSize) * cubeSize;
          const rowCubes = cs.playerCubes.filter(c => Math.abs(c.ry - rowY) < cubeSize / 2);
          let newRx = p.w / 2 + cubeSize / 2; // 6 + 6 = 12
          if (rowCubes.length > 0) {
            newRx = Math.max(...rowCubes.map(c => c.rx)) + cubeSize;
          }
          cs.playerCubes.push({ rx: newRx, ry: rowY, w: cubeSize, h: cubeSize });
          b.x = Math.max(b.x, p.x + p.w / 2 + newRx + cubeSize / 2 + b.size / 2);
        }
        window.Sound?.play('paddle');
      }
    }

    // 2. Enemy Paddle Collisions (Main body + Attached Cubes)
    if (b.vx > 0 && cs.lastHitCooldown <= 0) {
      let hit = false;
      let contactX = b.x + b.size / 2;
      let contactY = b.y;

      if (testHitRect(e.x, e.y, e.w, e.h)) {
        hit = true;
      } else {
        for (const cube of cs.enemyCubes) {
          const cx = e.x + e.w / 2 + cube.rx - cube.w / 2;
          const cy = e.y + e.h / 2 + cube.ry - cube.h / 2;
          if (testHitRect(cx, cy, cube.w, cube.h)) {
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        cs.lastHitCooldown = 0.12;
        b.vx = -Math.abs(b.vx) * 1.03;
        const offset = (b.y - (e.y + e.h / 2)) / (e.h / 2);
        b.vy = offset * 4.4 + (Math.random() - 0.5);

        // Add a new cube permanently attached ONTO the enemy paddle (no overlap)
        const cubeSize = 12;
        if (contactY < e.y - 2) {
          // Attaches onto top edge
          const topCubes = cs.enemyCubes.filter(c => c.rx === 0);
          const minRy = topCubes.length > 0 ? Math.min(...topCubes.map(c => c.ry)) : -(e.h / 2);
          const newRy = Math.min(minRy, -(e.h / 2)) - cubeSize;
          cs.enemyCubes.push({ rx: 0, ry: newRy, w: cubeSize, h: cubeSize });
        } else if (contactY > e.y + e.h + 2) {
          // Attaches onto bottom edge
          const botCubes = cs.enemyCubes.filter(c => c.rx === 0);
          const maxRy = botCubes.length > 0 ? Math.max(...botCubes.map(c => c.ry)) : (e.h / 2);
          const newRy = Math.max(maxRy, (e.h / 2)) + cubeSize;
          cs.enemyCubes.push({ rx: 0, ry: newRy, w: cubeSize, h: cubeSize });
        } else {
          // Attaches onto front face extending outward towards the left (-X)
          const rowY = Math.round((contactY - (e.y + e.h / 2)) / cubeSize) * cubeSize;
          const rowCubes = cs.enemyCubes.filter(c => Math.abs(c.ry - rowY) < cubeSize / 2);
          let newRx = -(e.w / 2 + cubeSize / 2); // -12
          if (rowCubes.length > 0) {
            newRx = Math.min(...rowCubes.map(c => c.rx)) - cubeSize;
          }
          cs.enemyCubes.push({ rx: newRx, ry: rowY, w: cubeSize, h: cubeSize });
          b.x = Math.min(b.x, e.x + e.w / 2 + newRx - cubeSize / 2 - b.size / 2);
        }
        window.Sound?.play('hit');
      }
    }

    // Scoring & Reset
    if (b.x < 10) {
      e.score++;
      window.Sound?.play('lose');
      if (e.score >= 5) this.showResult(false, 'CUBE OPPONENT WON!');
      else this.resetBall(true);
    } else if (b.x > CANVAS_WIDTH - 10) {
      p.score++;
      window.Sound?.play('score');
      if (p.score >= 5) this.showResult(true, 'CUBE PADDLE CHAMPION!');
      else this.resetBall(false);
    }
  }

  renderCubePaddle(ctx, colWhite, colBlack) {
    const cs = this.modeState;
    const p = this.player;
    const e = this.enemy;

    // Header & Score
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${p.score}`, CANVAS_WIDTH / 2 - 80, 80);
    ctx.fillText(`${e.score}`, CANVAS_WIDTH / 2 + 80, 80);

    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#666666';
    ctx.fillText('ACCRETION CUBE PADDLE', CANVAS_WIDTH / 2, 20);
    ctx.fillText(`CUBES: ${cs.playerCubes.length}   VS   ${cs.enemyCubes.length}`, CANVAS_WIDTH / 2, 110);

    // Walls & Net
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    for (let y = 44; y < CANVAS_HEIGHT - 38; y += 26) {
      ctx.fillRect(CANVAS_WIDTH / 2 - 2, y, 4, 14);
    }

    // Player Paddle Body & Attached Cubes - Solid seamless white shape (no borders)
    ctx.fillStyle = colWhite;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    for (const cube of cs.playerCubes) {
      const cx = p.x + p.w / 2 + cube.rx - cube.w / 2;
      const cy = p.y + p.h / 2 + cube.ry - cube.h / 2;
      ctx.fillStyle = colWhite;
      ctx.fillRect(cx, cy, cube.w, cube.h);
    }

    // Enemy Paddle Body & Attached Cubes - Solid seamless white shape (no borders)
    ctx.fillStyle = colWhite;
    ctx.fillRect(e.x, e.y, e.w, e.h);

    for (const cube of cs.enemyCubes) {
      const cx = e.x + e.w / 2 + cube.rx - cube.w / 2;
      const cy = e.y + e.h / 2 + cube.ry - cube.h / 2;
      ctx.fillStyle = colWhite;
      ctx.fillRect(cx, cy, cube.w, cube.h);
    }

    // Ball
    ctx.fillStyle = colWhite;
    ctx.fillRect(this.ball.x - this.ball.size / 2, this.ball.y - this.ball.size / 2, this.ball.size, this.ball.size);
  }

  // --- LEVEL 40: MEGALOVANIA SANS PADDLE BOSS FIGHT ---
  updateMegalovania(dt) {
    const ms = this.modeState;
    if (ms.shake > 0) ms.shake = Math.max(0, ms.shake - dt * 25);
    ms.surviveTime += dt;
    ms.patternTimer += dt;
    ms.spawnTimer -= dt;

    const p = ms.player;
    if (p.invuln > 0) p.invuln -= dt;

    // 1. Player Ball Movement inside Undertale Bounding Box (WASD / Arrows)
    let mx = 0, my = 0;
    if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) mx += 1;
    if (this.keys['w'] || this.keys['arrowup']) my -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) my += 1;

    if (mx !== 0 && my !== 0) { mx *= 0.7071; my *= 0.7071; }
    p.x += mx * (p.speed || 5.5);
    p.y += my * (p.speed || 5.5);

    const box = ms.box;
    p.x = Math.max(box.x + p.r + 2, Math.min(box.x + box.w - p.r - 2, p.x));
    p.y = Math.max(box.y + p.r + 2, Math.min(box.y + box.h - p.r - 2, p.y));

    // Boss Floating & Glowing Eye
    ms.boss.x = CANVAS_WIDTH / 2 + Math.sin(ms.surviveTime * 2.8) * 35;
    ms.boss.glowEye = Math.sin(ms.surviveTime * 8) > 0 ? 1 : 0;

    // Boss Dialogue Rotation
    ms.boss.diagTimer += dt;
    if (ms.boss.diagTimer > 4.5) {
      ms.boss.diagTimer = 0;
      const lines = [
        "YOU'RE GONNA HAVE A PADDLE TIME.",
        "CAN YOU DODGE THE SPINNING SERVE?",
        "SURVIVING IS AGAINST THE RULES.",
        "LORD PADDLE REIGNS SUPREME."
      ];
      ms.boss.dialogue = lines[Math.floor(Math.random() * lines.length)];
    }

    // 2. Flying Paddle Bullet Patterns Generator
    if (ms.spawnTimer <= 0) {
      ms.spawnTimer = ms.spawnInterval;
      const pat = Math.floor(ms.surviveTime / 6) % 3;

      if (pat === 0) {
        // Pattern 1: Horizontal Sweeping Paddles (Bone-style gaps)
        const fromLeft = Math.random() < 0.5;
        const gapY = box.y + 30 + Math.random() * (box.h - 60);
        // Top block paddle
        ms.bullets.push({
          x: fromLeft ? box.x - 40 : box.x + box.w + 40,
          y: (box.y + gapY - 26) / 2,
          w: 12,
          h: Math.max(16, (gapY - 26) - box.y),
          vx: (fromLeft ? 1 : -1) * ms.bulletSpeed,
          vy: 0
        });
        // Bottom block paddle
        ms.bullets.push({
          x: fromLeft ? box.x - 40 : box.x + box.w + 40,
          y: (gapY + 26 + box.y + box.h) / 2,
          w: 12,
          h: Math.max(16, (box.y + box.h) - (gapY + 26)),
          vx: (fromLeft ? 1 : -1) * ms.bulletSpeed,
          vy: 0
        });
      } else if (pat === 1) {
        // Pattern 2: Vertical Guillotine Drop Paddles
        const dropX = box.x + 25 + Math.random() * (box.w - 50);
        const fromTop = Math.random() < 0.5;
        ms.bullets.push({
          x: dropX,
          y: fromTop ? box.y - 35 : box.y + box.h + 35,
          w: 14,
          h: 46,
          vx: 0,
          vy: (fromTop ? 1 : -1) * ms.bulletSpeed * 1.15
        });
      } else {
        // Pattern 3: Aimed Flying Paddle Spear
        const ang = Math.atan2(p.y - ms.boss.y, p.x - ms.boss.x);
        ms.bullets.push({
          x: ms.boss.x,
          y: ms.boss.y + 20,
          w: 14,
          h: 38,
          angle: ang + Math.PI / 2,
          vx: Math.cos(ang) * ms.bulletSpeed * 1.25,
          vy: Math.sin(ang) * ms.bulletSpeed * 1.25
        });
      }
    }

    // 3. Update Flying Paddle Bullets & Hit Detection
    for (let i = ms.bullets.length - 1; i >= 0; i--) {
      const b = ms.bullets[i];
      b.x += b.vx;
      b.y += b.vy;

      // Hit detection with player heart/ball
      if (p.invuln <= 0) {
        if (
          p.x + p.r >= b.x - b.w / 2 &&
          p.x - p.r <= b.x + b.w / 2 &&
          p.y + p.r >= b.y - b.h / 2 &&
          p.y - p.r <= b.y + b.h / 2
        ) {
          p.hp--;
          p.invuln = 1.2;
          ms.shake = 14;
          window.Sound?.play('lose');
          if (p.hp <= 0) {
            this.showResult(false, 'DEFEATED BY LORD PADDLE!');
            return;
          }
        }
      }

      // Remove out of screen bullets
      if (b.x < 100 || b.x > CANVAS_WIDTH - 100 || b.y < 40 || b.y > CANVAS_HEIGHT - 20) {
        ms.bullets.splice(i, 1);
      }
    }

    // 4. Survival Victory Check
    if (ms.surviveTime >= ms.targetSurviveTime) {
      window.Sound?.play('win');
      this.showResult(true, 'YOU SURVIVED LORD PADDLE! TRUE DETERMINATION!');
    }
  }

  renderMegalovania(ctx, colWhite, colBlack) {
    const ms = this.modeState;
    if (ms.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * ms.shake, (Math.random() - 0.5) * ms.shake);
    }

    // 1. Lord Paddle (The Boss)
    const boss = ms.boss;
    ctx.save();
    ctx.translate(boss.x, boss.y);

    // Crown on Lord Paddle
    ctx.fillStyle = colWhite;
    ctx.beginPath();
    ctx.moveTo(-22, -boss.h / 2);
    ctx.lineTo(-22, -boss.h / 2 - 14);
    ctx.lineTo(-11, -boss.h / 2 - 7);
    ctx.lineTo(0, -boss.h / 2 - 16);
    ctx.lineTo(11, -boss.h / 2 - 7);
    ctx.lineTo(22, -boss.h / 2 - 14);
    ctx.lineTo(22, -boss.h / 2);
    ctx.fill();

    // Paddle Body
    ctx.fillRect(-boss.w / 2, -boss.h / 2, boss.w, boss.h);

    // Sans Glowing Eye
    if (boss.glowEye) {
      ctx.fillStyle = colBlack;
      ctx.beginPath();
      ctx.arc(-24, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colWhite;
      ctx.beginPath();
      ctx.arc(-24, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = colBlack;
      ctx.fillRect(-26, -2, 5, 4);
    }
    // Normal Right Eye
    ctx.fillStyle = colBlack;
    ctx.fillRect(21, -2, 5, 4);

    ctx.restore();

    // 2. Boss Dialogue Bubble
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.strokeRect(CANVAS_WIDTH / 2 - 210, 160, 420, 32);
    ctx.fillStyle = colWhite;
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(boss.dialogue, CANVAS_WIDTH / 2, 180);

    // 3. Undertale Bullet Board (Center Bounding Box)
    const box = ms.box;
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 4;
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    // Clip rendering inside or near box
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x - 2, box.y - 2, box.w + 4, box.h + 4);
    ctx.clip();

    // 4. Flying Paddle Bullets
    for (const b of ms.bullets) {
      ctx.save();
      ctx.translate(b.x, b.y);
      if (b.angle) ctx.rotate(b.angle);
      ctx.fillStyle = colWhite;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.strokeStyle = colBlack;
      ctx.lineWidth = 1;
      ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    }

    ctx.restore();

    // 5. Player Heart / Ball
    const p = ms.player;
    if (p.invuln <= 0 || Math.floor(performance.now() / 80) % 2 === 0) {
      ctx.fillStyle = colWhite;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      // Inner crosshair / heart dot
      ctx.fillStyle = colBlack;
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    }

    // 6. HUD: Player HP Bar & Survival Countdown
    const hudY = box.y + box.h + 26;
    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'left';
    ctx.fillText('HP', box.x, hudY);

    // HP Bar
    const hpBarW = 90;
    ctx.fillStyle = '#333333';
    ctx.fillRect(box.x + 30, hudY - 10, hpBarW, 12);
    ctx.fillStyle = colWhite;
    ctx.fillRect(box.x + 30, hudY - 10, hpBarW * (p.hp / p.maxHp), 12);

    ctx.fillText(`${p.hp}/${p.maxHp}`, box.x + 130, hudY);

    const remaining = Math.max(0, ms.targetSurviveTime - ms.surviveTime);
    ctx.textAlign = 'right';
    ctx.fillText(`TIME: ${remaining.toFixed(1)}s`, box.x + box.w, hudY);

    if (ms.shake > 0) ctx.restore();
  }

  // --- LEVEL 41: FLASHING BARS MODE ---
  updateFlashingBars(dt) {
    const fb = this.modeState;
    fb.timer += dt;
    if (fb.timer >= fb.interval) {
      fb.timer -= fb.interval;
      fb.activePhase = (fb.activePhase === 0) ? 1 : 0;
    }
    this.updateNormal(dt);
  }

  renderFlashingBars(ctx, colWhite, colBlack) {
    const fb = this.modeState;

    // Court Boundaries
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // Center Net
    for (let y = 44; y < CANVAS_HEIGHT - 38; y += 26) {
      ctx.fillRect(CANVAS_WIDTH / 2 - 2, y, 4, 14);
    }

    // Scoreboard (clean, no extra text)
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, CANVAS_WIDTH / 2 - 80, 80);
    ctx.fillText(`${this.enemy.score}`, CANVAS_WIDTH / 2 + 80, 80);

    // Paddles
    ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    ctx.fillRect(this.enemy.x, this.enemy.y, this.enemy.w, this.enemy.h);

    // Ball
    ctx.fillRect(
      this.ball.x - this.ball.size / 2,
      this.ball.y - this.ball.size / 2,
      this.ball.size,
      this.ball.size
    );

    // Alternating Solid White Horizontal Strobe Bars overlapping court, ball, and paddles
    const top = 34;
    const courtH = CANVAS_HEIGHT - 68;
    const barH = fb.barHeight || 80;
    const numBars = Math.ceil(courtH / barH);
    ctx.fillStyle = colWhite;
    for (let i = 0; i < numBars; i++) {
      if ((i % 2) === fb.activePhase) {
        const y = top + i * barH;
        const h = Math.min(barH, (CANVAS_HEIGHT - 34) - y);
        if (h > 0) {
          ctx.fillRect(0, y, CANVAS_WIDTH, h);
        }
      }
    }
  }

  // --- LEVEL 42: HOLE IN THE WALL MODE ---
  // ========================================================
  // LEVEL 42: TRY TO LOSE (SUPER HUGE PADDLES)
  // ========================================================
  initTryToLose(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.h = 440;
    this.player.height = 440; // Super huge paddle leaves 80px opening in 520px court
    this.enemy.h = 440;
    this.enemy.height = 440;
    this.player.y = 50;
    this.enemy.y = 50;

    this.modeState = {
      shake: 0,
      scoredTimer: 0,
      aiSpeed: 280
    };

    this.resetTryToLoseBall(1);
  }

  resetTryToLoseBall(dir) {
    this.ball.x = CANVAS_WIDTH / 2;
    this.ball.y = CANVAS_HEIGHT / 2;
    this.ball.radius = 5;
    const spd = 380;
    const angle = (Math.random() - 0.5) * 0.7;
    this.ball.vx = dir * spd * Math.cos(angle);
    this.ball.vy = spd * Math.sin(angle);
  }

  updateTryToLose(dt) {
    const ms = this.modeState;
    if (!ms) return;

    if (ms.shake > 0) ms.shake = Math.max(0, ms.shake - dt * 25);
    if (ms.scoredTimer > 0) {
      ms.scoredTimer -= dt;
      if (ms.scoredTimer <= 0) {
        if (this.player.score >= 5) {
          this.showResult(true, 'CONGRATS! YOU LOST!');
          return;
        } else if (this.enemy.score >= 5) {
          this.showResult(false, 'AI OUT-LOST YOU!');
          return;
        }
      }
      return;
    }

    // 1. Player Paddle Movement (moves the 440px paddle between y = 10 and 90)
    const padSpeed = 360;
    if (this.keys['w'] || this.keys['arrowup']) {
      this.player.y = Math.max(10, this.player.y - padSpeed * dt);
      this.mouseActive = false;
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      this.player.y = Math.min(90, this.player.y + padSpeed * dt);
      this.mouseActive = false;
    }
    if (this.mouseActive) {
      // Map mouse across the 10..90 range
      const normY = (this.mouseY - 50) / 440;
      const targetY = 10 + Math.max(0, Math.min(1, normY)) * 80;
      this.player.y += (targetY - this.player.y) * Math.min(1, 24 * dt);
      this.player.y = Math.max(10, Math.min(90, this.player.y));
    }

    // 2. AI Movement (AI also wants to lose, so it steers its gap toward the ball!)
    // If ball is in lower half (y > 270), gap at bottom (y = 10) lets it through.
    // If ball is in upper half (y < 270), gap at top (y = 90) lets it through.
    const aiTargetY = (this.ball.y > 270) ? 10 : 90;
    const aiDiff = aiTargetY - this.enemy.y;
    this.enemy.y += Math.sign(aiDiff) * Math.min(Math.abs(aiDiff), ms.aiSpeed * dt);
    this.enemy.y = Math.max(10, Math.min(90, this.enemy.y));

    // 3. Move Ball
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    // Walls
    if (this.ball.y <= 10 + this.ball.radius) {
      this.ball.y = 10 + this.ball.radius;
      this.ball.vy = Math.abs(this.ball.vy);
      window.Sound?.play('wall');
    } else if (this.ball.y >= CANVAS_HEIGHT - 10 - this.ball.radius) {
      this.ball.y = CANVAS_HEIGHT - 10 - this.ball.radius;
      this.ball.vy = -Math.abs(this.ball.vy);
      window.Sound?.play('wall');
    }

    // 4. Giant Paddle Bounces (Hitting paddle blocks the ball = PREVENTS scoring!)
    const pX = 36;
    const eX = CANVAS_WIDTH - 36 - 14;

    // Player Paddle Block
    if (this.ball.vx < 0 && this.ball.x - this.ball.radius <= pX + 14 && this.ball.x + this.ball.radius >= pX) {
      if (this.ball.y >= this.player.y && this.ball.y <= this.player.y + 440) {
        this.ball.vx = Math.abs(this.ball.vx);
        this.ball.x = pX + 14 + this.ball.radius;
        window.Sound?.play('paddle');
      }
    }

    // Enemy Paddle Block
    if (this.ball.vx > 0 && this.ball.x + this.ball.radius >= eX && this.ball.x - this.ball.radius <= eX + 14) {
      if (this.ball.y >= this.enemy.y && this.ball.y <= this.enemy.y + 440) {
        this.ball.vx = -Math.abs(this.ball.vx);
        this.ball.x = eX - this.ball.radius;
        window.Sound?.play('paddle');
      }
    }

    // 5. Scoring: YOU WANT TO LOSE!
    // Ball passed your goal = YOU SCORE!
    if (this.ball.x < 15) {
      this.player.score++;
      window.Sound?.play('score');
      ms.scoredTimer = 0.8;
      this.resetTryToLoseBall(1);
    }
    // Ball passed AI goal = AI SCORES!
    else if (this.ball.x > CANVAS_WIDTH - 15) {
      this.enemy.score++;
      window.Sound?.play('score');
      ms.scoredTimer = 0.8;
      this.resetTryToLoseBall(-1);
    }
  }

  renderTryToLose(ctx, colWhite, colBlack) {
    const ms = this.modeState;
    if (!ms) return;

    // Boundary walls
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 10);
    ctx.fillRect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10);

    // Dashed net
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 12);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12);
    ctx.stroke();
    ctx.setLineDash([]);

    // Classic Scores
    ctx.font = '32px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}   ${this.enemy.score}`, CANVAS_WIDTH / 2, 60);

    // Super Huge Paddles (leave 80px opening)
    ctx.fillStyle = colWhite;
    ctx.fillRect(36, this.player.y, 14, 440);
    ctx.fillRect(CANVAS_WIDTH - 36 - 14, this.enemy.y, 14, 440);

    // Ball
    ctx.fillRect(this.ball.x - 5, this.ball.y - 5, 10, 10);
  }

  updateTallCourt(dt) {
    const ts = this.modeState;
    if (!ts) return;

    // 1. Player paddle vertical movement
    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * (this.player.speed || 11.5);
    this.player.y = Math.max(ts.courtTop + 4, Math.min(ts.courtBot - 4 - this.player.h, this.player.y));

    // 2. Enemy AI paddle vertical movement
    const targetY = this.ball.y - this.enemy.h / 2;
    if (this.ball.vx > 0) {
      const diff = targetY - this.enemy.y;
      if (Math.abs(diff) > (this.enemy.jitter || 6)) {
        this.enemy.y += Math.sign(diff) * Math.min(Math.abs(diff), this.enemy.speed || 9.5);
      }
    }
    this.enemy.y = Math.max(ts.courtTop + 4, Math.min(ts.courtBot - 4 - this.enemy.h, this.enemy.y));

    // 3. Ball movement
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Top / bottom boundary reflections
    const halfSize = (this.ball.size || 10) / 2;
    if (this.ball.y - halfSize <= ts.courtTop + 3) {
      this.ball.y = ts.courtTop + 3 + halfSize;
      this.ball.vy = Math.abs(this.ball.vy);
      window.Sound?.play('wall');
    } else if (this.ball.y + halfSize >= ts.courtBot - 3) {
      this.ball.y = ts.courtBot - 3 - halfSize;
      this.ball.vy = -Math.abs(this.ball.vy);
      window.Sound?.play('wall');
    }

    // Paddle Collisions
    // Player Paddle (left side of narrow court)
    if (this.ball.vx < 0 &&
        this.ball.x - halfSize <= this.player.x + this.player.w &&
        this.ball.x + halfSize >= this.player.x) {
      if (this.ball.y + halfSize >= this.player.y && this.ball.y - halfSize <= this.player.y + this.player.h) {
        const rel = (this.ball.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
        const spd = this.ball.speed || 8.8;
        this.ball.vx = Math.abs(spd * Math.cos(rel * 0.75));
        this.ball.vy = spd * Math.sin(rel * 0.75);
        this.ball.x = this.player.x + this.player.w + halfSize;
        window.Sound?.play('paddle');
      }
    }

    // Enemy Paddle (right side of narrow court)
    if (this.ball.vx > 0 &&
        this.ball.x + halfSize >= this.enemy.x &&
        this.ball.x - halfSize <= this.enemy.x + this.enemy.w) {
      if (this.ball.y + halfSize >= this.enemy.y && this.ball.y - halfSize <= this.enemy.y + this.enemy.h) {
        const rel = (this.ball.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
        const spd = this.ball.speed || 8.8;
        this.ball.vx = -Math.abs(spd * Math.cos(rel * 0.75));
        this.ball.vy = spd * Math.sin(rel * 0.75);
        this.ball.x = this.enemy.x - halfSize;
        window.Sound?.play('paddle');
      }
    }

    // Goal scoring (left or right of narrow court)
    if (this.ball.x < ts.courtLeft - 8) {
      this.enemy.score++;
      window.Sound?.play('score');
      if (this.enemy.score >= this.currentLevel.targetScore) {
        this.showResult(false, 'OUTPLAYED ON TALL COURT!');
      } else {
        this.resetTallCourtBall(1);
      }
    } else if (this.ball.x > ts.courtRight + 8) {
      this.player.score++;
      window.Sound?.play('score');
      if (this.player.score >= this.currentLevel.targetScore) {
        this.showResult(true, 'TALL COURT CHAMPION!');
      } else {
        this.resetTallCourtBall(-1);
      }
    }
  }

  resetTallCourtBall(dir = 1) {
    const ts = this.modeState;
    if (!ts) return;
    this.ball.x = CANVAS_WIDTH / 2;
    this.ball.y = (ts.courtTop + ts.courtBot) / 2;
    const spd = this.ball.speed || 8.8;
    this.ball.vx = dir * spd;
    this.ball.vy = (Math.random() - 0.5) * (spd * 0.8);
  }

  renderTallCourt(ctx, colWhite, colBlack) {
    const ts = this.modeState;
    const top = ts.courtTop;
    const bot = ts.courtBot;
    const cl = ts.courtLeft;

    // Top & Bottom Boundary Lines (spanning narrow court)
    ctx.fillStyle = colWhite;
    ctx.fillRect(cl, top, ts.courtW, 3);
    ctx.fillRect(cl, bot - 3, ts.courtW, 3);

    // Center Vertical Net Line (tall dashed column down the middle)
    for (let y = top + 8; y < bot - 8; y += 22) {
      ctx.fillRect(CANVAS_WIDTH / 2 - 1, y, 2, 12);
    }

    // Scoreboard (clean, situated inside arena)
    ctx.font = '22px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, CANVAS_WIDTH / 2 - 50, 65);
    ctx.fillText(`${this.enemy.score}`, CANVAS_WIDTH / 2 + 50, 65);

    // Paddles
    ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    ctx.fillRect(this.enemy.x, this.enemy.y, this.enemy.w, this.enemy.h);

    // Ball
    ctx.fillRect(
      this.ball.x - this.ball.size / 2,
      this.ball.y - this.ball.size / 2,
      this.ball.size,
      this.ball.size
    );
  }

  // --- LEVEL 44: BEACH VOLLEYBALL OVER THE NET ---
  resetBeachBall(servingSide = 'player') {
    const ms = this.modeState;
    if (!ms) return;
    const sandY = ms.sandY || 470;
    const netX = ms.netX || CANVAS_WIDTH / 2;

    this.player.x = 180;
    this.player.y = sandY - this.player.h;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.grounded = true;

    this.enemy.x = 760;
    this.enemy.y = sandY - this.enemy.h;
    this.enemy.vx = 0;
    this.enemy.vy = 0;
    this.enemy.grounded = true;

    this.ball.size = 18;
    this.ball.spin = (servingSide === 'player') ? 2.5 : -2.5;
    this.ball.angle = 0;
    this.ball.squash = 1.0;
    ms.trail = [];
    ms.server = servingSide;
    ms.serveTimer = 0.6;

    if (servingSide === 'player') {
      this.ball.x = 220;
      this.ball.y = 260;
      this.ball.vx = 3.6;
      this.ball.vy = -7.0;
      ms.callout = 'PLAYER SERVE!';
    } else {
      this.ball.x = 740;
      this.ball.y = 260;
      this.ball.vx = -3.6;
      this.ball.vy = -7.0;
      ms.callout = 'OPPONENT SERVE!';
    }
    ms.calloutTimer = 0.8;
  }

  updateBeachBall(dt) {
    const aiCfg = this.getAiConfig();
    const ms = this.modeState;
    if (!ms) return;
    const sandY = ms.sandY || 470;
    const netX = ms.netX || CANVAS_WIDTH / 2;
    const netTopY = ms.netTopY || 320;
    const netW = ms.netW || 8;
    const ball = this.ball;
    const r = ball.size || 18;

    if (ms.shake > 0) ms.shake = Math.max(0, ms.shake - dt * 25);
    if (ms.calloutTimer > 0) ms.calloutTimer = Math.max(0, ms.calloutTimer - dt);

    // Serve delay countdown
    if (ms.serveTimer > 0) {
      ms.serveTimer -= dt;
      return;
    }

    // 1. Player Movement & Jump Physics (Left Court: x in [25, netX - player.w - 8])
    let moveX = 0;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;
    const pSpeed = 6.8;
    this.player.x += moveX * pSpeed;
    this.player.x = Math.max(25, Math.min(netX - this.player.w - 8, this.player.x));
    this.player.vx = moveX * pSpeed;

    // Jump handling
    if ((this.keys['w'] || this.keys['arrowup'] || this.keys[' ']) && this.player.grounded) {
      this.player.vy = -10.8;
      this.player.grounded = false;
      window.Sound?.play('flap');
    }
    // Fast fall
    if ((this.keys['s'] || this.keys['arrowdown']) && !this.player.grounded) {
      this.player.vy += 0.9;
    }

    // Player Gravity
    this.player.vy += 0.44;
    this.player.y += this.player.vy;
    if (this.player.y >= sandY - this.player.h) {
      this.player.y = sandY - this.player.h;
      this.player.vy = 0;
      this.player.grounded = true;
    }

    // 2. Opponent AI Movement & Jump Physics (Right Court: x in [netX + 8, CANVAS_WIDTH - 25 - enemy.w])
    const aiSpeed = Math.min(6.2, aiCfg.speed * 1.05 + 1.2);
    if (ball.x > netX - 40) {
      // Ball is heading to or in enemy court
      const targetX = ball.x - this.enemy.w / 2;
      const diffX = targetX - this.enemy.x;
      if (Math.abs(diffX) > 6) {
        this.enemy.x += Math.sign(diffX) * Math.min(aiSpeed, Math.abs(diffX));
      }
      // AI Jumps to block or spike
      if (ball.x > netX && ball.y > 250 && ball.vy > -1 && Math.abs(this.enemy.x + this.enemy.w / 2 - ball.x) < 32) {
        if (this.enemy.grounded) {
          this.enemy.vy = -10.2;
          this.enemy.grounded = false;
        }
      }
    } else {
      // Ball is on player side; enemy retreats to defense center
      const homeX = 720;
      const diffX = homeX - this.enemy.x;
      if (Math.abs(diffX) > 6) {
        this.enemy.x += Math.sign(diffX) * Math.min(aiSpeed * 0.7, Math.abs(diffX));
      }
    }
    this.enemy.x = Math.max(netX + 8, Math.min(CANVAS_WIDTH - 25 - this.enemy.w, this.enemy.x));

    // Enemy Gravity
    this.enemy.vy += 0.44;
    this.enemy.y += this.enemy.vy;
    if (this.enemy.y >= sandY - this.enemy.h) {
      this.enemy.y = sandY - this.enemy.h;
      this.enemy.vy = 0;
      this.enemy.grounded = true;
    }

    // 3. Floaty Beach Ball Physics & Aerodynamics
    ball.vy += 0.22; // Floaty gravity
    ball.vx *= Math.pow(0.994, dt * 60);
    ball.vy *= Math.pow(0.994, dt * 60);

    // Magnus Effect Curve
    const spd = Math.hypot(ball.vx, ball.vy);
    if (spd > 0.1 && Math.abs(ball.spin) > 0.05) {
      const magnusCoeff = 0.0038;
      const magnusAcc = ball.spin * spd * magnusCoeff;
      ball.vx += (-ball.vy / spd) * magnusAcc * (dt * 60);
      ball.vy += (ball.vx / spd) * magnusAcc * (dt * 60);
    }
    ball.spin *= Math.pow(0.985, dt * 60);
    ball.angle = (ball.angle || 0) + ball.spin * dt;
    if (ball.squash !== undefined && ball.squash < 1.0) {
      ball.squash = Math.min(1.0, ball.squash + dt * 4.2);
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Trail
    if (!ms.trail) ms.trail = [];
    ms.trail.push({ x: ball.x, y: ball.y });
    if (ms.trail.length > 12) ms.trail.shift();

    // 4. Net Collisions
    if (ball.y + r >= netTopY) {
      // Top cord/tape grazing bounce
      if (ball.y <= netTopY + 8 && ball.x >= netX - 10 && ball.x <= netX + 10) {
        ball.vy = -Math.abs(ball.vy) * 0.45;
        ball.vx = ball.vx * 0.85 + (Math.random() - 0.5) * 1.5;
        ball.squash = 0.72;
        ms.shake = 3;
        window.Sound?.play('wall');
      } else if (ball.y > netTopY + 8) {
        // Net mesh bounce
        if (ball.vx > 0 && ball.x + r >= netX - netW / 2 && ball.x < netX) {
          ball.x = netX - netW / 2 - r;
          ball.vx = -Math.abs(ball.vx) * 0.50;
          ball.spin *= -0.5;
          ball.squash = 0.75;
          window.Sound?.play('wall');
        } else if (ball.vx < 0 && ball.x - r <= netX + netW / 2 && ball.x > netX) {
          ball.x = netX + netW / 2 + r;
          ball.vx = Math.abs(ball.vx) * 0.50;
          ball.spin *= -0.5;
          ball.squash = 0.75;
          window.Sound?.play('wall');
        }
      }
    }

    // 5. Ceiling & Sidewall Collisions
    if (ball.y - r <= 15) {
      ball.y = 15 + r;
      ball.vy = Math.abs(ball.vy) * 0.80;
      window.Sound?.play('wall');
    }
    if (ball.x - r <= 20) {
      ball.x = 20 + r;
      ball.vx = Math.abs(ball.vx) * 0.75;
      window.Sound?.play('wall');
    }
    if (ball.x + r >= CANVAS_WIDTH - 20) {
      ball.x = CANVAS_WIDTH - 20 - r;
      ball.vx = -Math.abs(ball.vx) * 0.75;
      window.Sound?.play('wall');
    }

    // 6. Paddle Collisions (Volleyball Bumps, Sets & Spikes)
    // Player Paddle (Left side)
    const pcx = Math.max(this.player.x, Math.min(this.player.x + this.player.w, ball.x));
    const pcy = Math.max(this.player.y, Math.min(this.player.y + this.player.h, ball.y));
    const pDist = Math.hypot(ball.x - pcx, ball.y - pcy);

    if (pDist <= r && ball.x <= netX) {
      const isHighJump = (this.player.y < netTopY + 35);
      const isAboveBall = (this.player.y + this.player.h / 2 < ball.y);

      if (isHighJump && isAboveBall && ball.vx > 0) {
        // SPIKE!
        ball.vx = 9.2;
        ball.vy = 5.4;
        ball.spin = 22.0;
        ms.callout = 'SPIKE!';
        ms.calloutTimer = 0.8;
        ms.shake = 6;
        window.Sound?.play('hit');
      } else {
        // BUMP / SET over the net
        const targetDist = Math.max(200, (netX + 180) - ball.x);
        const forwardSpd = Math.max(5.0, Math.min(8.5, targetDist * 0.022 + 3.8));
        ball.vx = forwardSpd;
        ball.vy = -Math.max(8.5, Math.abs(ball.vy) * 0.6 + 6.8);
        ball.spin = -8.0 + this.player.vx * 1.5;
        ms.callout = 'BUMP!';
        ms.calloutTimer = 0.5;
        window.Sound?.play('paddle');
      }
      ball.squash = 0.65;
      ball.x = this.player.x + this.player.w + r;
    }

    // Opponent Paddle (Right side)
    const ecx = Math.max(this.enemy.x, Math.min(this.enemy.x + this.enemy.w, ball.x));
    const ecy = Math.max(this.enemy.y, Math.min(this.enemy.y + this.enemy.h, ball.y));
    const eDist = Math.hypot(ball.x - ecx, ball.y - ecy);

    if (eDist <= r && ball.x >= netX) {
      const isHighJump = (this.enemy.y < netTopY + 35);
      const isAboveBall = (this.enemy.y + this.enemy.h / 2 < ball.y);

      if (isHighJump && isAboveBall && ball.vx < 0) {
        // OPPONENT SPIKE!
        ball.vx = -9.2;
        ball.vy = 5.4;
        ball.spin = -22.0;
        ms.callout = 'OPPONENT SPIKE!';
        ms.calloutTimer = 0.8;
        ms.shake = 6;
        window.Sound?.play('hit');
      } else {
        // OPPONENT BUMP
        const targetDist = Math.max(200, ball.x - (netX - 180));
        const forwardSpd = Math.max(5.0, Math.min(8.5, targetDist * 0.022 + 3.8));
        ball.vx = -forwardSpd;
        ball.vy = -Math.max(8.5, Math.abs(ball.vy) * 0.6 + 6.8);
        ball.spin = 8.0;
        ms.callout = 'BUMP!';
        ms.calloutTimer = 0.5;
        window.Sound?.play('paddle');
      }
      ball.squash = 0.65;
      ball.x = this.enemy.x - r;
    }

    // 7. Sand Floor Collision & Scoring (Volleyball Rules!)
    if (ball.y + r >= sandY) {
      const targetScore = (this.currentLevel && this.currentLevel.targetScore) || 5;
      if (ball.x < netX) {
        // Hit sand on player court -> Opponent scores!
        this.enemy.score++;
        window.Sound?.play('lose');
        if (this.enemy.score >= targetScore) {
          this.showResult(false, `OPPONENT WON ${targetScore} POINTS!`);
          return;
        }
        this.resetBeachBall('enemy');
      } else {
        // Hit sand on opponent court -> Player scores!
        this.player.score++;
        window.Sound?.play('score');
        if (this.player.score >= targetScore) {
          this.showResult(true, `VICTORY! ${targetScore} POINTS SCORED!`);
          return;
        }
        this.resetBeachBall('player');
      }
    }
  }

  renderBeachBall(ctx, colWhite, colBlack) {
    const ball = this.ball;
    const r = ball.size || 18;
    const ms = this.modeState;
    if (!ms) return;
    const sandY = ms.sandY || 470;
    const netX = ms.netX || CANVAS_WIDTH / 2;
    const netTopY = ms.netTopY || 320;

    if (ms.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * ms.shake, (Math.random() - 0.5) * ms.shake);
    }

    // 1. Sand Floor & Texture
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, sandY, CANVAS_WIDTH, 4);

    // Dotted sand grain texture
    ctx.fillStyle = '#666666';
    for (let x = 12; x < CANVAS_WIDTH; x += 32) {
      ctx.fillRect(x, sandY + 10, 2, 2);
      ctx.fillRect(x + 16, sandY + 22, 2, 2);
    }

    // Court sideline markers
    ctx.fillStyle = '#444444';
    ctx.fillRect(25, sandY - 6, 2, 6);
    ctx.fillRect(CANVAS_WIDTH - 25, sandY - 6, 2, 6);

    // 2. Volleyball Net
    // Top PVC white tape band
    ctx.fillStyle = colWhite;
    ctx.fillRect(netX - 8, netTopY, 16, 6);

    // Net post center pole
    ctx.fillStyle = colWhite;
    ctx.fillRect(netX - 2, netTopY + 6, 4, sandY - netTopY - 6);

    // Net mesh lines (1-bit crosshatch)
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = netTopY + 12; y < sandY; y += 12) {
      ctx.moveTo(netX - 14, y);
      ctx.lineTo(netX + 14, y);
    }
    ctx.moveTo(netX - 10, netTopY + 6); ctx.lineTo(netX - 10, sandY);
    ctx.moveTo(netX + 10, netTopY + 6); ctx.lineTo(netX + 10, sandY);
    ctx.stroke();

    // 3. Ground Shadows
    ctx.fillStyle = '#444444';
    // Player Shadow
    ctx.fillRect(this.player.x, sandY - 2, this.player.w, 3);
    // Enemy Shadow
    ctx.fillRect(this.enemy.x, sandY - 2, this.enemy.w, 3);
    // Ball Shadow (scales with altitude above sand)
    const alt = Math.max(0, sandY - ball.y);
    const shadowR = Math.max(4, r * (1.0 - Math.min(0.7, alt / 450)));
    ctx.beginPath();
    ctx.ellipse(ball.x, sandY - 2, shadowR, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Trajectory Trail
    if (ms.trail && ms.trail.length > 1) {
      for (let i = 0; i < ms.trail.length - 1; i++) {
        const pt = ms.trail[i];
        const alpha = (i + 1) / ms.trail.length;
        const dotR = Math.max(1, 3 * alpha);
        ctx.fillStyle = (i % 2 === 0) ? '#888888' : colWhite;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Paddles - Just solid paddles, no extra lines
    ctx.fillStyle = colWhite;
    ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    ctx.fillRect(this.enemy.x, this.enemy.y, this.enemy.w, this.enemy.h);

    // 6. Rotating 1-Bit Beach Ball
    ctx.save();
    ctx.translate(ball.x, ball.y);
    const sq = ball.squash || 1.0;
    ctx.scale(1.0 / sq, sq);
    ctx.rotate(ball.angle || 0);

    // Base White Circle
    ctx.fillStyle = colWhite;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // 6 Rotating Beach Ball Panels
    const sectors = 6;
    for (let i = 0; i < sectors; i++) {
      if (i % 2 === 1) {
        ctx.fillStyle = colBlack;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, (i * Math.PI * 2) / sectors, ((i + 1) * Math.PI * 2) / sectors);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Outer Circle Ring
    ctx.strokeStyle = colBlack;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Center Air Valve
    ctx.fillStyle = colWhite;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colBlack;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // 7. HUD: Scores, Mode Title, Floating Callouts
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, CANVAS_WIDTH / 2 - 90, 60);
    ctx.fillText(`${this.enemy.score}`, CANVAS_WIDTH / 2 + 90, 60);

    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = '#888888';
    ctx.fillText('BEACH VOLLEYBALL', CANVAS_WIDTH / 2, 28);

    // Floating Action Callout ("SPIKE!", "BUMP!", "POINT!")
    if (ms.calloutTimer > 0 && ms.callout) {
      ctx.font = '14px "Press Start 2P"';
      ctx.fillStyle = colWhite;
      ctx.fillText(ms.callout, CANVAS_WIDTH / 2, 95);
    }

    if (ms.shake > 0) {
      ctx.restore();
    }
  }

  // --- LEVEL 45: DRAW PADDLE (DRAW CUSTOM SHAPE USED BY BOTH PLAYERS) ---
  handleDrawPaddleMouseDown(mouseX, mouseY) {
    const ds = this.modeState;
    if (!ds || ds.phase !== 'DRAWING') return;

    // Check if clicked inside drawing box
    const b = ds.drawingBox;
    if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) {
      ds.isDrawing = true;
      if (ds.currentLength >= ds.maxLength) {
        ds.drawingPoints = [];
        ds.currentLength = 0;
      }
      ds.drawingPoints.push({ x: mouseX, y: mouseY });
    }
  }

  addDrawPaddlePoint(mouseX, mouseY) {
    const ds = this.modeState;
    if (!ds || ds.phase !== 'DRAWING' || !ds.isDrawing) return;

    const b = ds.drawingBox;
    const clampedX = Math.max(b.x + 4, Math.min(b.x + b.w - 4, mouseX));
    const clampedY = Math.max(b.y + 4, Math.min(b.y + b.h - 4, mouseY));

    const pts = ds.drawingPoints;
    if (pts.length === 0) {
      pts.push({ x: clampedX, y: clampedY });
      return;
    }

    const last = pts[pts.length - 1];
    const segDist = Math.hypot(clampedX - last.x, clampedY - last.y);
    if (segDist >= 5) {
      if (ds.currentLength + segDist <= ds.maxLength) {
        pts.push({ x: clampedX, y: clampedY });
        ds.currentLength += segDist;
      } else {
        // Clamp to remaining length
        const remain = ds.maxLength - ds.currentLength;
        if (remain > 1) {
          const ratio = remain / segDist;
          pts.push({
            x: last.x + (clampedX - last.x) * ratio,
            y: last.y + (clampedY - last.y) * ratio
          });
          ds.currentLength = ds.maxLength;
        }
        ds.isDrawing = false;
      }
    }
  }

  stopDrawingPaddle() {
    const ds = this.modeState;
    if (!ds || ds.phase !== 'DRAWING') return;
    ds.isDrawing = false;
  }

  clearDrawPaddle() {
    const ds = this.modeState;
    if (!ds) return;
    ds.drawingPoints = [];
    ds.currentLength = 0;
    ds.isDrawing = false;
    window.Sound?.play('wall');
  }

  startDrawPaddleMatch() {
    const ds = this.modeState;
    if (!ds || ds.phase !== 'DRAWING') return;

    if (ds.drawingPoints.length < 2) {
      // Default paddle if player didn't draw
      ds.customPoints = [
        { dx: 0, dy: -35 },
        { dx: 0, dy: 35 }
      ];
      ds.customBounds = { minX: 0, maxX: 0, minY: -35, maxY: 35, width: 0, height: 70 };
    } else {
      // Normalize drawn points around bounding center
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of ds.drawingPoints) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      ds.customPoints = ds.drawingPoints.map(p => ({ dx: p.x - cx, dy: p.y - cy }));
      ds.customBounds = {
        minX: minX - cx,
        maxX: maxX - cx,
        minY: minY - cy,
        maxY: maxY - cy,
        width: maxX - minX,
        height: Math.max(30, maxY - minY)
      };
    }

    ds.phase = 'PLAYING';
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.x = 42;
    this.player.y = CANVAS_HEIGHT / 2;
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = CANVAS_HEIGHT / 2;
    this.resetBall(true);
    window.Sound?.play('win');
  }

  redrawDrawPaddle() {
    const ds = this.modeState;
    if (!ds) return;
    ds.phase = 'DRAWING';
    ds.drawingPoints = [];
    ds.currentLength = 0;
    ds.isDrawing = false;
    window.Sound?.play('wall');
  }

  handleDrawPaddleClick(mouseX, mouseY) {
    const ds = this.modeState;
    if (!ds) return;

    if (ds.phase === 'DRAWING') {
      // [CLEAR] Button (x: 310..430, y: 425..457)
      if (mouseX >= 310 && mouseX <= 430 && mouseY >= 425 && mouseY <= 457) {
        this.clearDrawPaddle();
        return;
      }
      // [START MATCH] Button (x: 450..650, y: 425..457)
      if (mouseX >= 450 && mouseX <= 650 && mouseY >= 425 && mouseY <= 457) {
        this.startDrawPaddleMatch();
        return;
      }
    } else if (ds.phase === 'PLAYING') {
      // [R] REDRAW PADDLE pill at bottom center
      if (mouseX >= 370 && mouseX <= 590 && mouseY >= 505 && mouseY <= 535) {
        this.redrawDrawPaddle();
      }
    }
  }

  updateDrawPaddle(dt) {
    const ds = this.modeState;
    if (!ds || ds.phase !== 'PLAYING') return;

    if (ds.shake > 0) ds.shake = Math.max(0, ds.shake - dt * 25);

    // 1. Player Paddle Movement via W/S or Arrow keys
    const b = ds.customBounds;
    const prevPy = this.player.y;
    const minY = 30 - b.minY;
    const maxY = CANVAS_HEIGHT - 30 - b.maxY;

    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * (this.player.speed || 7.0);
    this.player.y = Math.max(minY, Math.min(maxY, this.player.y));
    this.player.x = 42;
    const effectiveDt = Math.max(0.001, dt);
    this.player.vy = (this.player.y - prevPy) / effectiveDt;

    // 2. Enemy AI follows Ball Y using identical custom shape
    const targetY = this.ball.y;
    const aiDiff = this.getAiConfig();
    const aiSpeed = (aiDiff.speed || 3.8) * 60 * dt;
    const dy = targetY - this.enemy.y;
    this.enemy.y += Math.max(-aiSpeed, Math.min(aiSpeed, dy));
    this.enemy.y = Math.max(minY, Math.min(maxY, this.enemy.y));
    this.enemy.x = CANVAS_WIDTH - 42;

    // 3. Ball Kinematics
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Top & Bottom boundary bounce
    if (this.ball.y - this.ball.size / 2 <= 0) {
      this.ball.y = this.ball.size / 2;
      this.ball.vy = Math.abs(this.ball.vy);
      window.Sound?.play('wall');
    }
    if (this.ball.y + this.ball.size / 2 >= CANVAS_HEIGHT) {
      this.ball.y = CANVAS_HEIGHT - this.ball.size / 2;
      this.ball.vy = -Math.abs(this.ball.vy);
      window.Sound?.play('wall');
    }

    // 4. Custom Paddle Polyline Collisions
    const pts = ds.customPoints;
    const ballR = this.ball.size / 2;
    const halfThick = ds.thickness / 2;
    const hitRadius = ballR + halfThick;

    // Helper: point to segment distance and closest point
    function distToSeg(bx, by, ax, ay, bx2, by2) {
      const segVx = bx2 - ax;
      const segVy = by2 - ay;
      const segLenSq = segVx * segVx + segVy * segVy;
      if (segLenSq === 0) {
        return { dist: Math.hypot(bx - ax, by - ay), qx: ax, qy: ay };
      }
      const t = Math.max(0, Math.min(1, ((bx - ax) * segVx + (by - ay) * segVy) / segLenSq));
      const qx = ax + t * segVx;
      const qy = ay + t * segVy;
      return { dist: Math.hypot(bx - qx, by - qy), qx, qy };
    }

    // A) Player Collision (facing right, points offset from player.x, player.y)
    if (this.ball.vx < 0 && pts.length >= 2) {
      for (let i = 0; i < pts.length - 1; i++) {
        const ax = this.player.x + pts[i].dx;
        const ay = this.player.y + pts[i].dy;
        const bx2 = this.player.x + pts[i + 1].dx;
        const by2 = this.player.y + pts[i + 1].dy;

        const res = distToSeg(this.ball.x, this.ball.y, ax, ay, bx2, by2);
        if (res.dist <= hitRadius) {
          let nx = (this.ball.x - res.qx) / (res.dist || 1);
          let ny = (this.ball.y - res.qy) / (res.dist || 1);
          if (res.dist === 0 || nx <= 0) { nx = 1; ny = 0; }

          const dot = this.ball.vx * nx + this.ball.vy * ny;
          this.ball.vx -= 2 * dot * nx;
          this.ball.vy -= 2 * dot * ny;
          this.ball.vy += Math.max(-3, Math.min(3, this.player.vy * 0.25));

          if (this.ball.vx < 3.5) this.ball.vx = Math.abs(this.ball.vx) + 2.5;
          const currentSpd = Math.hypot(this.ball.vx, this.ball.vy);
          const maxSpd = (aiDiff.ballSpeed || 6.5) * 1.35;
          if (currentSpd > maxSpd) {
            this.ball.vx = (this.ball.vx / currentSpd) * maxSpd;
            this.ball.vy = (this.ball.vy / currentSpd) * maxSpd;
          }

          this.ball.x = res.qx + nx * (hitRadius + 2);
          this.ball.y = res.qy + ny * (hitRadius + 2);
          ds.shake = 4;
          window.Sound?.play('paddle');
          break;
        }
      }
    }

    // B) Enemy Collision (mirrored horizontally: -dx, +dy from enemy.x, enemy.y)
    if (this.ball.vx > 0 && pts.length >= 2) {
      for (let i = 0; i < pts.length - 1; i++) {
        const ax = this.enemy.x - pts[i].dx;
        const ay = this.enemy.y + pts[i].dy;
        const bx2 = this.enemy.x - pts[i + 1].dx;
        const by2 = this.enemy.y + pts[i + 1].dy;

        const res = distToSeg(this.ball.x, this.ball.y, ax, ay, bx2, by2);
        if (res.dist <= hitRadius) {
          let nx = (this.ball.x - res.qx) / (res.dist || 1);
          let ny = (this.ball.y - res.qy) / (res.dist || 1);
          if (res.dist === 0 || nx >= 0) { nx = -1; ny = 0; }

          const dot = this.ball.vx * nx + this.ball.vy * ny;
          this.ball.vx -= 2 * dot * nx;
          this.ball.vy -= 2 * dot * ny;

          if (this.ball.vx > -3.5) this.ball.vx = -Math.abs(this.ball.vx) - 2.5;
          const currentSpd = Math.hypot(this.ball.vx, this.ball.vy);
          const maxSpd = (aiDiff.ballSpeed || 6.5) * 1.35;
          if (currentSpd > maxSpd) {
            this.ball.vx = (this.ball.vx / currentSpd) * maxSpd;
            this.ball.vy = (this.ball.vy / currentSpd) * maxSpd;
          }

          this.ball.x = res.qx + nx * (hitRadius + 2);
          this.ball.y = res.qy + ny * (hitRadius + 2);
          ds.shake = 4;
          window.Sound?.play('paddle');
          break;
        }
      }
    }

    // 5. Goals & Scoring
    if (this.ball.x < -20) {
      this.enemy.score++;
      window.Sound?.play('lose');
      if (this.enemy.score >= this.currentLevel.targetScore) {
        this.showResult(false, `OPPONENT WON! (${this.player.score} - ${this.enemy.score})`);
      } else {
        this.resetBall(true);
      }
    } else if (this.ball.x > CANVAS_WIDTH + 20) {
      this.player.score++;
      window.Sound?.play('win');
      if (this.player.score >= this.currentLevel.targetScore) {
        this.showResult(true, `CUSTOM PADDLE VICTORY! (${this.player.score} - ${this.enemy.score})`);
      } else {
        this.resetBall(false);
      }
    }
  }

  renderDrawPaddle(ctx, colWhite, colBlack) {
    const ds = this.modeState;
    if (!ds) return;

    if (ds.phase === 'DRAWING') {
      // Title
      ctx.font = '16px "Press Start 2P"';
      ctx.fillStyle = colWhite;
      ctx.textAlign = 'center';
      ctx.fillText('DRAW YOUR PADDLE', CANVAS_WIDTH / 2, 55);

      ctx.font = '10px "Press Start 2P"';
      ctx.fillStyle = '#888888';
      ctx.fillText('CLICK & DRAG INSIDE BOX TO SHAPE YOUR PADDLE', CANVAS_WIDTH / 2, 85);
      ctx.fillText('BOTH YOU AND YOUR OPPONENT WILL PLAY WITH THIS EXACT PADDLE', CANVAS_WIDTH / 2, 105);

      // Drawing Box Canvas
      const b = ds.drawingBox;
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      // Subtle Center Guides
      ctx.save();
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, b.y);
      ctx.lineTo(CANVAS_WIDTH / 2, b.y + b.h);
      ctx.moveTo(b.x, b.y + b.h / 2);
      ctx.lineTo(b.x + b.w, b.y + b.h / 2);
      ctx.stroke();
      ctx.restore();

      // Render Current Drawn Stroke
      if (ds.drawingPoints.length > 0) {
        ctx.strokeStyle = colWhite;
        ctx.lineWidth = ds.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(ds.drawingPoints[0].x, ds.drawingPoints[0].y);
        for (let i = 1; i < ds.drawingPoints.length; i++) {
          ctx.lineTo(ds.drawingPoints[i].x, ds.drawingPoints[i].y);
        }
        ctx.stroke();
      } else {
        // Ghost hint of default vertical paddle
        ctx.save();
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = ds.thickness;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2, b.y + b.h / 2 - 35);
        ctx.lineTo(CANVAS_WIDTH / 2, b.y + b.h / 2 + 35);
        ctx.stroke();
        ctx.restore();
      }

      // Ink / Length Progress Bar
      const meterW = 360;
      const meterH = 10;
      const meterX = (CANVAS_WIDTH - meterW) / 2;
      const meterY = 416;
      ctx.font = '10px "Press Start 2P"';
      ctx.fillStyle = colWhite;
      ctx.textAlign = 'left';
      ctx.fillText(`STROKE: ${Math.round(ds.currentLength)} / ${ds.maxLength} PX`, meterX, meterY - 6);

      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 1;
      ctx.strokeRect(meterX, meterY, meterW, meterH);
      const pct = Math.min(1.0, ds.currentLength / ds.maxLength);
      ctx.fillRect(meterX, meterY, meterW * pct, meterH);

      // Action Buttons
      // [CLEAR (C)]
      ctx.strokeRect(310, 435, 120, 32);
      ctx.font = '10px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('CLEAR [C]', 370, 455);

      // [START MATCH (ENTER)]
      ctx.strokeRect(450, 435, 200, 32);
      ctx.fillText('START MATCH [SPACE]', 550, 455);
      return;
    }

    // PLAYING PHASE
    if (ds.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * ds.shake, (Math.random() - 0.5) * ds.shake);
    }

    // Center Dashed Net
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Scoreboard
    ctx.font = '32px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, CANVAS_WIDTH / 2 - 70, 55);
    ctx.fillText(`${this.enemy.score}`, CANVAS_WIDTH / 2 + 70, 55);

    // Ball
    ctx.fillRect(
      this.ball.x - this.ball.size / 2,
      this.ball.y - this.ball.size / 2,
      this.ball.size,
      this.ball.size
    );

    // Render Player Custom Paddle
    const pts = ds.customPoints;
    if (pts.length >= 2) {
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = ds.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Player Paddle
      ctx.beginPath();
      ctx.moveTo(this.player.x + pts[0].dx, this.player.y + pts[0].dy);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(this.player.x + pts[i].dx, this.player.y + pts[i].dy);
      }
      ctx.stroke();

      // Enemy Paddle (Mirrored across net)
      ctx.beginPath();
      ctx.moveTo(this.enemy.x - pts[0].dx, this.enemy.y + pts[0].dy);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(this.enemy.x - pts[i].dx, this.enemy.y + pts[i].dy);
      }
      ctx.stroke();
    }

    // Redraw Pill at bottom
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888888';
    ctx.strokeRect(370, 505, 220, 24);
    ctx.fillText('REDRAW PADDLE [R]', CANVAS_WIDTH / 2, 521);

    if (ds.shake > 0) {
      ctx.restore();
    }
  }

  // --- 4D TESSERACT PONG MODE ---
  initFourD(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.modeState = {
      courtX: 120, // Length from -120 to +120
      courtY: 55,  // Height bounds from -55 to +55
      courtZ: 75,  // Width bounds from -75 to +75
      courtW: 50,  // 4D Ana/Kata bounds from -50 to +50
      playerX: -105,
      playerY: 0,
      playerZ: 0,
      playerW: 0,
      playerH: 48,  // Height extent (Y)
      playerWd: 64, // Width extent (Z)
      playerDW: 44, // 4D hyper-depth extent (W)
      oppX: 105,
      oppY: 0,
      oppZ: 0,
      oppW: 0,
      oppH: 44,
      oppWd: 58,
      oppDW: 40,
      oppSpeedY: aiCfg.fourDOppSpeed || 3.2,
      oppSpeedZ: aiCfg.fourDOppSpeed || 3.2,
      oppSpeedW: (aiCfg.fourDOppSpeed || 3.2) * 0.9,
      ball: {
        x: 0,
        y: 0,
        z: 0,
        w: 0,
        vx: (Math.random() < 0.5 ? -1 : 1) * (aiCfg.fourDBallSpeed || 5.8),
        vy: (Math.random() - 0.5) * 2.2,
        vz: (Math.random() - 0.5) * 2.5,
        vw: (Math.random() - 0.5) * 2.0,
        radius: 7
      },
      shake: 0,
      hitFlash: 0,
      hyperFlash: 0,
      time: 0,
      trail: []
    };
  }

  resetFourDBall(server = 1) {
    const fd = this.modeState;
    if (!fd) return;
    const aiCfg = this.getAiConfig();
    const speed = aiCfg.fourDBallSpeed || 5.8;
    fd.ball.x = 0;
    fd.ball.y = (Math.random() - 0.5) * 24;
    fd.ball.z = (Math.random() - 0.5) * 24;
    fd.ball.w = (Math.random() - 0.5) * 24;
    fd.ball.vx = server * speed;
    fd.ball.vy = (Math.random() - 0.5) * 2.2;
    fd.ball.vz = (Math.random() - 0.5) * 2.6;
    fd.ball.vw = (Math.random() - 0.5) * 2.2;
    fd.trail = [];
  }

  project4D(x, y, z, w, angleZW = 0.16, angleYW = 0.08) {
    // 4D Rotation in ZW and YW hyperplanes for isometric visibility
    const cosZ = Math.cos(angleZW), sinZ = Math.sin(angleZW);
    const z1 = z * cosZ - w * sinZ;
    const w1 = z * sinZ + w * cosZ;

    const cosY = Math.cos(angleYW), sinY = Math.sin(angleYW);
    const y2 = y * cosY - w1 * sinY;
    const w2 = y * sinY + w1 * cosY;

    // 4D to 3D perspective projection (Ana is smaller/inner, Kata is larger/outer)
    const D4 = 230;
    const f4 = D4 / (D4 + w2);
    const x3 = x * f4;
    const y3 = y2 * f4;
    const z3 = z1 * f4;

    // 3D to 2D perspective projection
    const D3 = 270 + x3;
    const f3 = 235 / D3;
    const screenX = 410 + z3 * f3;
    const screenY = 270 + y3 * f3;
    return { x: screenX, y: screenY, scale: f4 * f3 };
  }

  updateFourD(dt) {
    const fd = this.modeState;
    if (!fd) return;
    fd.time += dt;

    if (fd.shake > 0) fd.shake = Math.max(0, fd.shake - dt * 26);
    if (fd.hitFlash > 0) fd.hitFlash = Math.max(0, fd.hitFlash - dt * 4.0);
    if (fd.hyperFlash > 0) fd.hyperFlash = Math.max(0, fd.hyperFlash - dt * 3.5);

    // 1. Player Movement:
    // Y: Up / Down (W/S or ArrowUp/ArrowDown)
    let my = 0;
    if (this.keys['w'] || this.keys['arrowup']) my -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) my += 1;

    // Z: Left / Right (A/D or ArrowLeft/ArrowRight)
    let mz = 0;
    if (this.keys['a'] || this.keys['arrowleft']) mz -= 1;
    if (this.keys['d'] || this.keys['arrowright']) mz += 1;

    // W: Kata (-W) / Ana (+W) (Q / E)
    let mw = 0;
    if (this.keys['q']) mw -= 1;
    if (this.keys['e']) mw += 1;

    const speedY = 220 * dt;
    const speedZ = 250 * dt;
    const speedW = 260 * dt;

    fd.playerY += my * speedY;
    fd.playerZ += mz * speedZ;
    fd.playerW += mw * speedW;

    const maxY = fd.courtY - fd.playerH / 2;
    const maxZ = fd.courtZ - fd.playerWd / 2;
    const maxW = fd.courtW - fd.playerDW / 2;

    fd.playerY = Math.max(-maxY, Math.min(maxY, fd.playerY));
    fd.playerZ = Math.max(-maxZ, Math.min(maxZ, fd.playerZ));
    fd.playerW = Math.max(-maxW, Math.min(maxW, fd.playerW));

    // 2. Opponent AI:
    const b = fd.ball;
    if (b.vx > 0) {
      const diffY = b.y - fd.oppY;
      const diffZ = b.z - fd.oppZ;
      const diffW = b.w - fd.oppW;

      if (Math.abs(diffY) > 3) {
        fd.oppY += Math.sign(diffY) * Math.min(Math.abs(diffY), fd.oppSpeedY * (dt * 60));
      }
      if (Math.abs(diffZ) > 3) {
        fd.oppZ += Math.sign(diffZ) * Math.min(Math.abs(diffZ), fd.oppSpeedZ * (dt * 60));
      }
      if (Math.abs(diffW) > 4) {
        fd.oppW += Math.sign(diffW) * Math.min(Math.abs(diffW), fd.oppSpeedW * (dt * 60));
      }
    } else {
      // Gentle return to center when ball is traveling away
      fd.oppY += (0 - fd.oppY) * 0.03;
      fd.oppZ += (0 - fd.oppZ) * 0.03;
      fd.oppW += (0 - fd.oppW) * 0.03;
    }

    const maxOppY = fd.courtY - fd.oppH / 2;
    const maxOppZ = fd.courtZ - fd.oppWd / 2;
    const maxOppW = fd.courtW - fd.oppDW / 2;
    fd.oppY = Math.max(-maxOppY, Math.min(maxOppY, fd.oppY));
    fd.oppZ = Math.max(-maxOppZ, Math.min(maxOppZ, fd.oppZ));
    fd.oppW = Math.max(-maxOppW, Math.min(maxOppW, fd.oppW));

    // 3. Ball Physics & Trail
    fd.trail.unshift({ x: b.x, y: b.y, z: b.z, w: b.w });
    if (fd.trail.length > 7) fd.trail.pop();

    b.x += b.vx * (dt * 60);
    b.y += b.vy * (dt * 60);
    b.z += b.vz * (dt * 60);
    b.w += b.vw * (dt * 60);

    // Wall bounces:
    // Y (Floor/Ceiling)
    if (b.y <= -fd.courtY) {
      b.y = -fd.courtY;
      b.vy = Math.abs(b.vy);
      window.Sound?.play('wall');
    } else if (b.y >= fd.courtY) {
      b.y = fd.courtY;
      b.vy = -Math.abs(b.vy);
      window.Sound?.play('wall');
    }

    // Z (Left/Right Walls)
    if (b.z <= -fd.courtZ) {
      b.z = -fd.courtZ;
      b.vz = Math.abs(b.vz);
      window.Sound?.play('wall');
    } else if (b.z >= fd.courtZ) {
      b.z = fd.courtZ;
      b.vz = -Math.abs(b.vz);
      window.Sound?.play('wall');
    }

    // W (Kata/Ana Hyper-walls)
    if (b.w <= -fd.courtW) {
      b.w = -fd.courtW;
      b.vw = Math.abs(b.vw);
      fd.hyperFlash = 0.35;
      window.Sound?.play('wall');
    } else if (b.w >= fd.courtW) {
      b.w = fd.courtW;
      b.vw = -Math.abs(b.vw);
      fd.hyperFlash = 0.35;
      window.Sound?.play('wall');
    }

    // Opponent Hit at X >= oppX:
    if (b.vx > 0 && b.x >= fd.oppX) {
      const reachY = fd.oppH / 2 + b.radius + 6;
      const reachZ = fd.oppWd / 2 + b.radius + 6;
      const reachW = fd.oppDW / 2 + b.radius + 8;

      const hitOpp = Math.abs(b.y - fd.oppY) <= reachY &&
                     Math.abs(b.z - fd.oppZ) <= reachZ &&
                     Math.abs(b.w - fd.oppW) <= reachW;

      if (hitOpp) {
        b.x = fd.oppX - 2;
        b.vx = -Math.abs(b.vx) * 1.025;
        b.vy = ((b.y - fd.oppY) / (fd.oppH / 2)) * 2.8 + (Math.random() - 0.5) * 0.8;
        b.vz = ((b.z - fd.oppZ) / (fd.oppWd / 2)) * 3.2 + (Math.random() - 0.5) * 0.8;
        b.vw = ((b.w - fd.oppW) / (fd.oppDW / 2)) * 2.6 + (Math.random() - 0.5) * 0.8;
        window.Sound?.play('hit');
      } else {
        // Immediate miss resolution at paddle plane - no zombie lingering behind paddle
        this.player.score++;
        window.Sound?.play('score');
        if (this.player.score >= 5) {
          this.showResult(true, '4D TESSERACT CHAMPION!');
          return;
        }
        this.resetFourDBall(-1);
        return;
      }
    }

    // Player Hit at X <= playerX:
    if (b.vx < 0 && b.x <= fd.playerX) {
      const reachY = fd.playerH / 2 + b.radius + 8;
      const reachZ = fd.playerWd / 2 + b.radius + 8;
      const reachW = fd.playerDW / 2 + b.radius + 12;

      const hitPlayer = Math.abs(b.y - fd.playerY) <= reachY &&
                        Math.abs(b.z - fd.playerZ) <= reachZ &&
                        Math.abs(b.w - fd.playerW) <= reachW;

      if (hitPlayer) {
        b.x = fd.playerX + 2;
        b.vx = Math.abs(b.vx) * 1.03;
        b.vy = ((b.y - fd.playerY) / (fd.playerH / 2)) * 3.2;
        b.vz = ((b.z - fd.playerZ) / (fd.playerWd / 2)) * 3.6;
        b.vw = ((b.w - fd.playerW) / (fd.playerDW / 2)) * 3.0;
        fd.shake = 8;
        fd.hitFlash = 0.4;
        window.Sound?.play('paddle');
      } else {
        // Immediate miss resolution at paddle plane - no zombie lingering behind paddle
        this.enemy.score++;
        fd.shake = 16;
        window.Sound?.play('lose');
        if (this.enemy.score >= 5) {
          this.showResult(false, 'LOST IN 4D SPACE!');
          return;
        }
        this.resetFourDBall(1);
        return;
      }
    }
  }

  renderFourD(ctx, colWhite, colBlack) {
    const fd = this.modeState;
    if (!fd) return;

    if (fd.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * fd.shake, (Math.random() - 0.5) * fd.shake);
    }

    // Background 1-bit hyper-flash when bouncing off 4D hyperwalls
    if (fd.hyperFlash > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (fd.hyperFlash * 0.15).toFixed(2) + ')';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Scoreboard & Header
    ctx.fillStyle = '#666666';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL 46 - 4D PONG: TESSERACT ARENA', 410, 22);

    ctx.font = '20px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.fillText(`YOU: ${this.player.score}   OPPONENT: ${this.enemy.score}`, 410, 52);

    // Projection shortcut
    const proj = (x, y, z, w) => this.project4D(x, y, z, w);

    // --- 1. RENDER 4D TESSERACT CORRIDOR ---
    const xFrames = [-fd.courtX, -fd.courtX / 2, 0, fd.courtX / 2, fd.courtX];
    const cY = fd.courtY;
    const cZ = fd.courtZ;
    const cW = fd.courtW;

    // Corner definitions: [y, z]
    const cornerOffsets = [
      [-cY, -cZ],
      [-cY,  cZ],
      [ cY,  cZ],
      [ cY, -cZ]
    ];

    // Draw transverse hyper-frames
    for (let i = 0; i < xFrames.length; i++) {
      const x = xFrames[i];
      const isMid = (x === 0);
      const isEnd = (i === 0 || i === xFrames.length - 1);

      // Outer Frame (Kata: W = -cW)
      const outerPts = cornerOffsets.map(([y, z]) => proj(x, y, z, -cW));
      ctx.beginPath();
      ctx.moveTo(outerPts[0].x, outerPts[0].y);
      for (let j = 1; j < 4; j++) ctx.lineTo(outerPts[j].x, outerPts[j].y);
      ctx.closePath();
      ctx.strokeStyle = isMid ? '#888888' : (isEnd ? colWhite : '#555555');
      ctx.lineWidth = isEnd ? 1.5 : 1.0;
      ctx.setLineDash(isMid ? [4, 4] : []);
      ctx.stroke();

      // Inner Frame (Ana: W = +cW)
      const innerPts = cornerOffsets.map(([y, z]) => proj(x, y, z, cW));
      ctx.beginPath();
      ctx.moveTo(innerPts[0].x, innerPts[0].y);
      for (let j = 1; j < 4; j++) ctx.lineTo(innerPts[j].x, innerPts[j].y);
      ctx.closePath();
      ctx.strokeStyle = isMid ? '#666666' : (isEnd ? '#aaaaaa' : '#444444');
      ctx.lineWidth = 1.0;
      ctx.setLineDash([3, 3]);
      ctx.stroke();

      // Hyper-struts connecting Outer Corner to Inner Corner at this frame
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = isEnd ? '#777777' : '#333333';
      for (let j = 0; j < 4; j++) {
        ctx.beginPath();
        ctx.moveTo(outerPts[j].x, outerPts[j].y);
        ctx.lineTo(innerPts[j].x, innerPts[j].y);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // Longitudinal lines connecting the 4 outer corners across X
    for (let j = 0; j < 4; j++) {
      const [y, z] = cornerOffsets[j];
      ctx.beginPath();
      const p0 = proj(xFrames[0], y, z, -cW);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < xFrames.length; i++) {
        const pi = proj(xFrames[i], y, z, -cW);
        ctx.lineTo(pi.x, pi.y);
      }
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    // Longitudinal lines connecting the 4 inner corners across X
    for (let j = 0; j < 4; j++) {
      const [y, z] = cornerOffsets[j];
      ctx.beginPath();
      const p0 = proj(xFrames[0], y, z, cW);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < xFrames.length; i++) {
        const pi = proj(xFrames[i], y, z, cW);
        ctx.lineTo(pi.x, pi.y);
      }
      ctx.strokeStyle = '#444444';
      ctx.setLineDash([3, 4]);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // --- 2. RENDER OPPONENT PADDLE (FAR 3D/4D PRISM) ---
    const oppDy = fd.oppH / 2;
    const oppDz = fd.oppWd / 2;
    const oppDw = fd.oppDW / 2;

    const oppCornerOffsets = [
      [-oppDy, -oppDz],
      [-oppDy,  oppDz],
      [ oppDy,  oppDz],
      [ oppDy, -oppDz]
    ];

    const oppOuter = oppCornerOffsets.map(([y, z]) => proj(fd.oppX, fd.oppY + y, fd.oppZ + z, fd.oppW - oppDw));
    const oppInner = oppCornerOffsets.map(([y, z]) => proj(fd.oppX, fd.oppY + y, fd.oppZ + z, fd.oppW + oppDw));

    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1.0;
    ctx.setLineDash([3, 3]);

    // Front box
    ctx.beginPath();
    ctx.moveTo(oppOuter[0].x, oppOuter[0].y);
    for (let j = 1; j < 4; j++) ctx.lineTo(oppOuter[j].x, oppOuter[j].y);
    ctx.closePath();
    ctx.stroke();

    // Back box
    ctx.beginPath();
    ctx.moveTo(oppInner[0].x, oppInner[0].y);
    for (let j = 1; j < 4; j++) ctx.lineTo(oppInner[j].x, oppInner[j].y);
    ctx.closePath();
    ctx.stroke();

    // Struts
    for (let j = 0; j < 4; j++) {
      ctx.beginPath();
      ctx.moveTo(oppOuter[j].x, oppOuter[j].y);
      ctx.lineTo(oppInner[j].x, oppInner[j].y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // --- 3. RENDER 4D BALL & HYPER-TRAIL ---
    const b = fd.ball;

    // Ball Trail
    for (let i = 0; i < fd.trail.length; i++) {
      const tp = fd.trail[i];
      const tProj = proj(tp.x, tp.y, tp.z, tp.w);
      const alpha = (1 - (i + 1) / (fd.trail.length + 1)) * 0.45;
      const tr = Math.max(2, b.radius * tProj.scale * 1.5 * (1 - i * 0.1));
      ctx.beginPath();
      ctx.arc(tProj.x, tProj.y, tr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha.toFixed(2) + ')';
      ctx.fill();
    }

    // Ball Projected Position
    const bp = proj(b.x, b.y, b.z, b.w);
    const br = Math.max(4, Math.min(18, b.radius * bp.scale * 2.2));

    // Ball Glow & Solid Body
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, br, 0, Math.PI * 2);
    ctx.fillStyle = colWhite;
    ctx.fill();

    // In-World 4D Hyper-Indicator around Ball
    const wDiff = Math.abs(b.w - fd.playerW);
    const isWAligned = wDiff <= (fd.playerDW / 2) + 8;

    if (isWAligned) {
      // 4D Reticle Target Locked around Ball
      const rSize = br + 7;
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 1.5;
      // 4 corner reticle brackets
      ctx.beginPath();
      ctx.moveTo(bp.x - rSize, bp.y - rSize + 4);
      ctx.lineTo(bp.x - rSize, bp.y - rSize);
      ctx.lineTo(bp.x - rSize + 4, bp.y - rSize);

      ctx.moveTo(bp.x + rSize - 4, bp.y - rSize);
      ctx.lineTo(bp.x + rSize, bp.y - rSize);
      ctx.lineTo(bp.x + rSize, bp.y - rSize + 4);

      ctx.moveTo(bp.x + rSize, bp.y + rSize - 4);
      ctx.lineTo(bp.x + rSize, bp.y + rSize);
      ctx.lineTo(bp.x + rSize - 4, bp.y + rSize);

      ctx.moveTo(bp.x - rSize + 4, bp.y + rSize);
      ctx.lineTo(bp.x - rSize, bp.y + rSize);
      ctx.lineTo(bp.x - rSize, bp.y + rSize - 4);
      ctx.stroke();
    } else {
      // Directional 4D Prompt near Ball
      ctx.font = '7px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#aaaaaa';
      if (b.w > fd.playerW) {
        ctx.fillText('^ ANA [E]', bp.x, bp.y - br - 8);
      } else {
        ctx.fillText('v KATA [Q]', bp.x, bp.y + br + 14);
      }
    }

    // --- 4. RENDER PLAYER PADDLE (NEAR 3D/4D HYPER-FACE PRISM) ---
    const pDy = fd.playerH / 2;
    const pDz = fd.playerWd / 2;
    const pDw = fd.playerDW / 2;

    const pCornerOffsets = [
      [-pDy, -pDz],
      [-pDy,  pDz],
      [ pDy,  pDz],
      [ pDy, -pDz]
    ];

    const pOuter = pCornerOffsets.map(([y, z]) => proj(fd.playerX, fd.playerY + y, fd.playerZ + z, fd.playerW - pDw));
    const pInner = pCornerOffsets.map(([y, z]) => proj(fd.playerX, fd.playerY + y, fd.playerZ + z, fd.playerW + pDw));

    // Solid flash on hit
    if (fd.hitFlash > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (fd.hitFlash * 0.4).toFixed(2) + ')';
      ctx.beginPath();
      ctx.moveTo(pOuter[0].x, pOuter[0].y);
      for (let j = 1; j < 4; j++) ctx.lineTo(pOuter[j].x, pOuter[j].y);
      ctx.closePath();
      ctx.fill();
    }

    // Outer face (Kata edge of paddle)
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = fd.hitFlash > 0 ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(pOuter[0].x, pOuter[0].y);
    for (let j = 1; j < 4; j++) ctx.lineTo(pOuter[j].x, pOuter[j].y);
    ctx.closePath();
    ctx.stroke();

    // Cross-hair on interceptor face
    ctx.beginPath();
    ctx.moveTo(pOuter[0].x, pOuter[0].y);
    ctx.lineTo(pOuter[2].x, pOuter[2].y);
    ctx.moveTo(pOuter[1].x, pOuter[1].y);
    ctx.lineTo(pOuter[3].x, pOuter[3].y);
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Inner face (Ana edge of paddle)
    ctx.beginPath();
    ctx.moveTo(pInner[0].x, pInner[0].y);
    for (let j = 1; j < 4; j++) ctx.lineTo(pInner[j].x, pInner[j].y);
    ctx.closePath();
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Connecting 4D struts of player paddle
    ctx.strokeStyle = '#777777';
    for (let j = 0; j < 4; j++) {
      ctx.beginPath();
      ctx.moveTo(pOuter[j].x, pOuter[j].y);
      ctx.lineTo(pInner[j].x, pInner[j].y);
      ctx.stroke();
    }

    // --- 5. RIGHT HUD: 4D HYPER-SLICER & TELEMETRY ---
    const panelX = 720;
    const panelY = 60;
    const panelW = 224;
    const panelH = 422;

    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Inner decorative frame
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(panelX + 4, panelY + 4, panelW - 8, panelH - 8);

    // Header
    ctx.font = '9px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillStyle = colWhite;
    ctx.fillText('4D HYPER-SLICER', panelX + panelW / 2, panelY + 24);

    ctx.font = '7px "Press Start 2P"';
    ctx.fillStyle = '#888888';
    ctx.fillText('W-AXIS HYPERPLANE', panelX + panelW / 2, panelY + 38);

    // Vertical W-axis Gauge
    const gaugeX = panelX + 96;
    const gaugeTopY = panelY + 65;
    const gaugeBotY = panelY + 225;
    const gaugeMidY = (gaugeTopY + gaugeBotY) / 2;
    const gaugeHalfH = (gaugeBotY - gaugeTopY) / 2;

    // Track line
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(gaugeX, gaugeTopY);
    ctx.lineTo(gaugeX, gaugeBotY);
    ctx.stroke();

    // Ticks & Labels
    const ticks = [
      { w: 50, label: '+50 ANA' },
      { w: 25, label: '+25' },
      { w: 0, label: '0 MID' },
      { w: -25, label: '-25' },
      { w: -50, label: '-50 KATA' }
    ];

    ctx.font = '6px "Press Start 2P"';
    ctx.fillStyle = '#777777';
    ctx.textAlign = 'right';
    for (const t of ticks) {
      const ty = gaugeMidY - (t.w / 50) * gaugeHalfH;
      ctx.beginPath();
      ctx.moveTo(gaugeX - 4, ty);
      ctx.lineTo(gaugeX + 4, ty);
      ctx.strokeStyle = (t.w === 0 ? colWhite : '#666666');
      ctx.stroke();
      ctx.fillText(t.label, gaugeX - 8, ty + 2);
    }

    // Player W coverage bracket
    const pWCenterY = gaugeMidY - (fd.playerW / 50) * gaugeHalfH;
    const pWHalfH = (pDw / 50) * gaugeHalfH;
    const pTopY = pWCenterY - pWHalfH;
    const pBotY = pWCenterY + pWHalfH;

    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    // Bracket on right side of track
    ctx.moveTo(gaugeX + 10, pTopY);
    ctx.lineTo(gaugeX + 16, pTopY);
    ctx.lineTo(gaugeX + 16, pBotY);
    ctx.lineTo(gaugeX + 10, pBotY);
    ctx.stroke();

    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillStyle = colWhite;
    ctx.fillText('YOU', gaugeX + 22, pWCenterY + 3);

    // Ball W pip
    const bWY = gaugeMidY - (b.w / 50) * gaugeHalfH;
    ctx.beginPath();
    ctx.arc(gaugeX, bWY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = colWhite;
    ctx.fill();

    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('BALL', gaugeX + 18, bWY + (bWY < pWCenterY ? -8 : 12));

    // 4D Alignment Status Box
    const statusBoxY = panelY + 242;
    if (isWAligned) {
      // Solid white locked badge
      ctx.fillStyle = colWhite;
      ctx.fillRect(panelX + 12, statusBoxY, panelW - 24, 24);
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillStyle = colBlack;
      ctx.fillText('[ 4D LOCKED ]', panelX + panelW / 2, statusBoxY + 16);
    } else {
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 1.0;
      ctx.strokeRect(panelX + 12, statusBoxY, panelW - 24, 24);
      ctx.font = '7px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillStyle = colWhite;
      ctx.fillText(b.w > fd.playerW ? 'SHIFT [E] ANA' : 'SHIFT [Q] KATA', panelX + panelW / 2, statusBoxY + 16);
    }

    // Telemetry Text
    const teleY = panelY + 290;
    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#888888';

    ctx.fillText(`BALL W : ${b.w >= 0 ? '+' : ''}${b.w.toFixed(1)}`, panelX + 16, teleY);
    ctx.fillText(`YOU  W : ${fd.playerW >= 0 ? '+' : ''}${fd.playerW.toFixed(1)}`, panelX + 16, teleY + 16);
    ctx.fillText(`ALIGN  : ${wDiff.toFixed(1)} ${isWAligned ? 'OK' : 'MISMATCH'}`, panelX + 16, teleY + 32);

    ctx.fillText(`BALL X : ${b.x.toFixed(0)}`, panelX + 16, teleY + 54);
    ctx.fillText(`BALL Y : ${b.y.toFixed(0)}`, panelX + 16, teleY + 70);
    ctx.fillText(`BALL Z : ${b.z.toFixed(0)}`, panelX + 16, teleY + 86);
    ctx.fillText(`SPEED  : ${Math.hypot(b.vx, b.vy, b.vz, b.vw).toFixed(1)}`, panelX + 16, teleY + 102);

    // --- 6. BOTTOM CONTROL INSTRUCTIONS ---
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888888';
    ctx.fillText('MOVE: WASD / ARROWS (Y/Z)   |   4D SHIFT: Q (KATA -W) / E (ANA +W)', CANVAS_WIDTH / 2, 524);

    if (fd.shake > 0) {
      ctx.restore();
    }
  }

  // --- SUBWAY SURF MODE (3RD PERSON PADDLE RUNNER) ---
  subwayShiftLane(dir) {
    const sb = this.modeState;
    if (!sb) return;
    const oldLane = sb.lane;
    sb.lane = Math.max(0, Math.min(2, sb.lane + dir));
    if (sb.lane !== oldLane) {
      window.Sound?.play('paddle');
    }
  }

  subwayJump() {
    const sb = this.modeState;
    if (!sb) return;
    if (sb.grounded) {
      sb.vy = 8.6; // Controlled arcade hop
      sb.grounded = false;
      sb.onTrain = false;
      sb.sliding = false;
      sb.slideTimer = 0;
      window.Sound?.play('flap');
    }
  }

  subwaySlide() {
    const sb = this.modeState;
    if (!sb) return;
    if (sb.grounded) {
      sb.sliding = true;
      sb.slideTimer = 0.55;
      window.Sound?.play('hit');
    } else {
      sb.vy = -16.0;
      sb.sliding = true;
      sb.slideTimer = 0.50;
    }
  }

  initSubwaySurf(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    const laneX = [-140, 0, 140];
    this.modeState = {
      laneX: laneX,
      lane: 1,
      x: 0,
      y: 0,
      vy: 0,
      grounded: true,
      onTrain: false,
      sliding: false,
      slideTimer: 0,
      radius: 12,
      lives: 3,
      invulnerableTimer: 0,
      distance: 0,
      targetDistance: 1500, // Survive longer (1500m)
      coins: 0,
      speed: aiCfg.subwaySpeed || 280,
      nextSpawnZ: 600,
      obstacles: [],
      coinsList: [],
      particles: [],
      trackScroll: 0,
      shake: 0,
      ballRollAngle: 0
    };

    this.spawnSubwayPattern(600);
    this.spawnSubwayPattern(1150);
    this.spawnSubwayPattern(1700);
  }

  spawnSubwayPattern(spawnZ) {
    const sb = this.modeState;
    if (!sb) return;
    const pat = Math.floor(Math.random() * 5);

    if (pat === 0) {
      sb.obstacles.push({ type: 'train', lane: 0, z: spawnZ, length: 220, height: 36, width: 56, hit: false });
      sb.obstacles.push({ type: 'hurdle', lane: 1, z: spawnZ + 50, height: 16, width: 54, hit: false });
      for (let i = 0; i < 4; i++) {
        sb.coinsList.push({ lane: 2, z: spawnZ + i * 45, y: 10 });
      }
    } else if (pat === 1) {
      for (let i = 0; i < 4; i++) {
        sb.coinsList.push({ lane: 0, z: spawnZ + i * 45, y: 10 });
      }
      sb.obstacles.push({ type: 'barrier', lane: 1, z: spawnZ, bottomY: 18, topY: 34, width: 54, hit: false });
      sb.obstacles.push({ type: 'train', lane: 2, z: spawnZ, length: 220, height: 36, width: 56, hit: false });
    } else if (pat === 2) {
      sb.obstacles.push({ type: 'hurdle', lane: 0, z: spawnZ + 40, height: 16, width: 54, hit: false });
      sb.obstacles.push({ type: 'train', lane: 1, z: spawnZ, length: 240, height: 36, width: 56, hit: false });
      for (let i = 0; i < 4; i++) {
        sb.coinsList.push({ lane: 1, z: spawnZ + 30 + i * 50, y: 46 });
        sb.coinsList.push({ lane: 2, z: spawnZ + i * 45, y: 10 });
      }
    } else if (pat === 3) {
      for (let i = 0; i < 4; i++) {
        sb.coinsList.push({ lane: 0, z: spawnZ + i * 45, y: 10 });
      }
      sb.obstacles.push({ type: 'hurdle', lane: 1, z: spawnZ + 40, height: 16, width: 54, hit: false });
      sb.obstacles.push({ type: 'barrier', lane: 2, z: spawnZ, bottomY: 18, topY: 34, width: 54, hit: false });
    } else {
      sb.obstacles.push({ type: 'train', lane: 0, z: spawnZ, length: 240, height: 36, width: 56, hit: false });
      sb.obstacles.push({ type: 'train', lane: 2, z: spawnZ, length: 240, height: 36, width: 56, hit: false });
      for (let i = 0; i < 5; i++) {
        sb.coinsList.push({ lane: 1, z: spawnZ + i * 45, y: 10 });
      }
    }
  }

  updateSubwaySurf(dt) {
    const sb = this.modeState;
    if (!sb) return;

    if (sb.shake > 0) sb.shake = Math.max(0, sb.shake - dt * 26);
    if (sb.invulnerableTimer > 0) sb.invulnerableTimer = Math.max(0, sb.invulnerableTimer - dt);

    const frameMove = sb.speed * dt;
    sb.distance += frameMove * 0.12;
    this.player.score = Math.min(5, Math.floor(sb.distance / 300));

    const aiCfg = this.getAiConfig();
    const baseSpeed = aiCfg.subwaySpeed || 280;
    sb.speed = Math.min(420, baseSpeed + sb.distance * 0.12);
    sb.trackScroll = (sb.trackScroll + frameMove) % 60;
    sb.ballRollAngle += frameMove * 0.08;

    const targetX = sb.laneX[sb.lane];
    sb.x += (targetX - sb.x) * Math.min(1, 20 * dt);

    if (sb.slideTimer > 0) {
      sb.slideTimer -= dt;
      if (sb.slideTimer <= 0) sb.sliding = false;
    }

    if (!sb.grounded) {
      sb.vy -= 44 * dt;
      sb.y += sb.vy * (dt * 60);
    }

    const pZ = 60;
    let onRoofNow = false;

    for (let i = 0; i < sb.obstacles.length; i++) {
      sb.obstacles[i].z -= frameMove;
    }
    for (let i = 0; i < sb.coinsList.length; i++) {
      sb.coinsList[i].z -= frameMove;
    }

    // Train Roof Collision & Frontal Crash
    for (let i = 0; i < sb.obstacles.length; i++) {
      const ob = sb.obstacles[i];
      if (ob.type === 'train' && ob.lane === sb.lane) {
        const trainFront = ob.z;
        const trainBack = ob.z + ob.length;
        if (pZ >= trainFront - 12 && pZ <= trainBack + 12) {
          if (sb.y >= 30) {
            onRoofNow = true;
            if (sb.vy <= 0) {
              sb.y = 36;
              sb.vy = 0;
              sb.grounded = true;
              sb.onTrain = true;
            }
          } else if (!ob.hit && sb.invulnerableTimer <= 0 && pZ >= trainFront - 12 && pZ <= trainFront + 16) {
            ob.hit = true;
            this.subwayCrash(ob);
          }
        }
      }
    }

    if (!onRoofNow) {
      if (sb.onTrain) {
        sb.onTrain = false;
        sb.grounded = false;
      }
      if (sb.y <= 0) {
        sb.y = 0;
        sb.vy = 0;
        sb.grounded = true;
      }
    }

    // Hurdle and Barrier Collisions (Processed cleanly once)
    for (let i = 0; i < sb.obstacles.length; i++) {
      const ob = sb.obstacles[i];
      if (ob.lane === sb.lane && !ob.hit && sb.invulnerableTimer <= 0) {
        if (ob.type === 'hurdle') {
          if (Math.abs(ob.z - pZ) <= 15) {
            if (sb.y < 16) {
              ob.hit = true;
              this.subwayCrash(ob);
            }
          }
        } else if (ob.type === 'barrier') {
          if (Math.abs(ob.z - pZ) <= 15) {
            if (!sb.sliding) {
              ob.hit = true;
              this.subwayCrash(ob);
            }
          }
        }
      }
    }

    sb.obstacles = sb.obstacles.filter(ob => (ob.type === 'train' ? (ob.z + ob.length > -80) : ob.z > -80));

    for (let i = 0; i < sb.coinsList.length; i++) {
      const c = sb.coinsList[i];
      if (!c.collected && c.lane === sb.lane) {
        if (Math.abs(c.z - pZ) <= 24 && Math.abs(c.y - sb.y) <= 24) {
          c.collected = true;
          sb.coins++;
          window.Sound?.play('paddle');
          for (let p = 0; p < 5; p++) {
            sb.particles.push({
              x: sb.x + (Math.random() - 0.5) * 16,
              y: sb.y + (Math.random() - 0.5) * 16,
              z: pZ,
              vx: (Math.random() - 0.5) * 60,
              vy: (Math.random() + 0.5) * 60,
              life: 0.4
            });
          }
        }
      }
    }
    sb.coinsList = sb.coinsList.filter(c => !c.collected && c.z > -80);

    let maxZ = 0;
    for (const ob of sb.obstacles) {
      const endZ = (ob.type === 'train') ? (ob.z + ob.length) : ob.z;
      if (endZ > maxZ) maxZ = endZ;
    }
    if (maxZ < 1150) {
      this.spawnSubwayPattern(Math.max(1400, maxZ + 550));
    }

    for (let i = sb.particles.length - 1; i >= 0; i--) {
      const p = sb.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) sb.particles.splice(i, 1);
    }

    if (sb.distance >= sb.targetDistance) {
      this.player.score = 5;
      this.showResult(true, 'SUBWAY SURFER CHAMPION!');
    }
  }

  subwayCrash(ob) {
    const sb = this.modeState;
    if (!sb || sb.invulnerableTimer > 0) return;
    sb.lives--;
    sb.invulnerableTimer = 1.8;
    sb.shake = 16;
    window.Sound?.play('wall');

    for (let i = 0; i < 16; i++) {
      sb.particles.push({
        x: sb.x + (Math.random() - 0.5) * 30,
        y: sb.y + Math.random() * 25,
        z: 60,
        vx: (Math.random() - 0.5) * 120,
        vy: (Math.random() + 0.2) * 90,
        life: 0.6
      });
    }

    if (sb.lives <= 0) {
      this.showResult(false, 'CRASHED INTO PADDLE!');
    }
  }

  renderSubwaySurf(ctx, colWhite, colBlack) {
    const sb = this.modeState;
    if (!sb) return;

    if (sb.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * sb.shake, (Math.random() - 0.5) * sb.shake);
    }

    const project3D = (x, y, z) => {
      const f = 280 / (z + 180);
      const camH = 105;
      const horizonY = 175;
      return {
        x: 480 + x * f,
        y: horizonY + (camH - y) * f * 2.2,
        scale: f
      };
    };

    const horizonY = 175;
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(CANVAS_WIDTH, horizonY);
    ctx.stroke();

    const lanes = sb.laneX;
    const railHalfW = 28;
    for (let l = 0; l < 3; l++) {
      const cx = lanes[l];
      const leftRailNear = project3D(cx - railHalfW, 0, 30);
      const leftRailFar = project3D(cx - railHalfW, 0, 1500);
      const rightRailNear = project3D(cx + railHalfW, 0, 30);
      const rightRailFar = project3D(cx + railHalfW, 0, 1500);

      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(leftRailNear.x, leftRailNear.y);
      ctx.lineTo(leftRailFar.x, leftRailFar.y);
      ctx.moveTo(rightRailNear.x, rightRailNear.y);
      ctx.lineTo(rightRailFar.x, rightRailFar.y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    for (let z = 40 + (sb.trackScroll % 50); z < 1200; z += 50) {
      for (let l = 0; l < 3; l++) {
        const cx = lanes[l];
        const p1 = project3D(cx - railHalfW - 5, 0, z);
        const p2 = project3D(cx + railHalfW + 5, 0, z);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    const drawList = [];
    for (const ob of sb.obstacles) {
      const sortZ = (ob.type === 'train') ? (ob.z + ob.length) : ob.z;
      drawList.push({ kind: 'ob', item: ob, sortZ: sortZ });
    }
    for (const c of sb.coinsList) {
      drawList.push({ kind: 'coin', item: c, sortZ: c.z });
    }
    drawList.sort((a, b) => b.sortZ - a.sortZ);

    for (const entry of drawList) {
      if (entry.kind === 'coin') {
        const c = entry.item;
        const cp = project3D(sb.laneX[c.lane], c.y, c.z);
        const cR = Math.max(3, 7 * cp.scale);

        ctx.fillStyle = colWhite;
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, cR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = colBlack;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, cR * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const ob = entry.item;
        const cx = sb.laneX[ob.lane];

        if (ob.type === 'hurdle') {
          const pBottomL = project3D(cx - ob.width / 2, 0, ob.z);
          const pBottomR = project3D(cx + ob.width / 2, 0, ob.z);
          const pTopL = project3D(cx - ob.width / 2, ob.height, ob.z);
          const pTopR = project3D(cx + ob.width / 2, ob.height, ob.z);

          ctx.strokeStyle = '#888888';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pBottomL.x, pBottomL.y); ctx.lineTo(pTopL.x, pTopL.y);
          ctx.moveTo(pBottomR.x, pBottomR.y); ctx.lineTo(pTopR.x, pTopR.y);
          ctx.stroke();

          const padThick = Math.max(3, 8 * pTopL.scale);
          ctx.fillStyle = colWhite;
          ctx.fillRect(pTopL.x, pTopL.y, pTopR.x - pTopL.x, padThick);
          ctx.strokeStyle = colBlack;
          ctx.lineWidth = 1;
          ctx.strokeRect(pTopL.x, pTopL.y, pTopR.x - pTopL.x, padThick);
        } else if (ob.type === 'barrier') {
          const pBottomL = project3D(cx - ob.width / 2, 0, ob.z);
          const pBottomR = project3D(cx + ob.width / 2, 0, ob.z);
          const pMidL = project3D(cx - ob.width / 2, ob.bottomY, ob.z);
          const pMidR = project3D(cx + ob.width / 2, ob.bottomY, ob.z);
          const pTopL = project3D(cx - ob.width / 2, ob.topY, ob.z);
          const pTopR = project3D(cx + ob.width / 2, ob.topY, ob.z);

          ctx.strokeStyle = '#888888';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pBottomL.x, pBottomL.y); ctx.lineTo(pTopL.x, pTopL.y);
          ctx.moveTo(pBottomR.x, pBottomR.y); ctx.lineTo(pTopR.x, pTopR.y);
          ctx.stroke();

          ctx.fillStyle = colWhite;
          ctx.beginPath();
          ctx.moveTo(pMidL.x, pMidL.y);
          ctx.lineTo(pMidR.x, pMidR.y);
          ctx.lineTo(pTopR.x, pTopR.y);
          ctx.lineTo(pTopL.x, pTopL.y);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = colBlack;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(pMidL.x + 8, pMidL.y); ctx.lineTo(pTopL.x + 18, pTopL.y);
          ctx.moveTo(pMidR.x - 18, pMidR.y); ctx.lineTo(pTopR.x - 8, pTopR.y);
          ctx.stroke();
        } else if (ob.type === 'train') {
          const zNear = ob.z;
          const zFar = ob.z + ob.length;
          const tW = ob.width;
          const tH = ob.height;

          const fBL = project3D(cx - tW / 2, 0, zNear);
          const fBR = project3D(cx + tW / 2, 0, zNear);
          const fTR = project3D(cx + tW / 2, tH, zNear);
          const fTL = project3D(cx - tW / 2, tH, zNear);

          const bBL = project3D(cx - tW / 2, 0, zFar);
          const bBR = project3D(cx + tW / 2, 0, zFar);
          const bTR = project3D(cx + tW / 2, tH, zFar);
          const bTL = project3D(cx - tW / 2, tH, zFar);

          // 1. Black occlusion mask
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.moveTo(fBL.x, fBL.y);
          ctx.lineTo(bBL.x, bBL.y);
          ctx.lineTo(bTL.x, bTL.y);
          ctx.lineTo(bTR.x, bTR.y);
          ctx.lineTo(bBR.x, bBR.y);
          ctx.lineTo(fBR.x, fBR.y);
          ctx.lineTo(fTR.x, fTR.y);
          ctx.lineTo(fTL.x, fTL.y);
          ctx.closePath();
          ctx.fill();

          // 2. Solid White Roof with tread ribs
          ctx.fillStyle = colWhite;
          ctx.beginPath();
          ctx.moveTo(fTL.x, fTL.y);
          ctx.lineTo(fTR.x, fTR.y);
          ctx.lineTo(bTR.x, bTR.y);
          ctx.lineTo(bTL.x, bTL.y);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = colBlack;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          for (let frac = 0.2; frac <= 0.8; frac += 0.2) {
            const rx1 = fTL.x + (bTL.x - fTL.x) * frac;
            const ry1 = fTL.y + (bTL.y - fTL.y) * frac;
            const rx2 = fTR.x + (bTR.x - fTR.x) * frac;
            const ry2 = fTR.y + (bTR.y - fTR.y) * frac;
            ctx.beginPath();
            ctx.moveTo(rx1, ry1);
            ctx.lineTo(rx2, ry2);
            ctx.stroke();
          }

          // 3. Solid White Side Panels
          if (cx >= 0) {
            ctx.fillStyle = colWhite;
            ctx.beginPath();
            ctx.moveTo(fBL.x, fBL.y);
            ctx.lineTo(fTL.x, fTL.y);
            ctx.lineTo(bTL.x, bTL.y);
            ctx.lineTo(bBL.x, bBL.y);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = colBlack;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            for (let f = 0.25; f <= 0.75; f += 0.25) {
              const wx = fTL.x + (bTL.x - fTL.x) * f;
              const wyTop = fTL.y + (bTL.y - fTL.y) * f + 4 * fTL.scale;
              const wyBot = fBL.y + (bBL.y - fBL.y) * f - 6 * fBL.scale;
              ctx.fillStyle = colBlack;
              ctx.fillRect(wx - 3 * fTL.scale, wyTop, 6 * fTL.scale, Math.max(4, wyBot - wyTop));
            }
          }
          if (cx <= 0) {
            ctx.fillStyle = colWhite;
            ctx.beginPath();
            ctx.moveTo(fBR.x, fBR.y);
            ctx.lineTo(fTR.x, fTR.y);
            ctx.lineTo(bTR.x, bTR.y);
            ctx.lineTo(bBR.x, bBR.y);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = colBlack;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            for (let f = 0.25; f <= 0.75; f += 0.25) {
              const wx = fTR.x + (bTR.x - fTR.x) * f;
              const wyTop = fTR.y + (bTR.y - fTR.y) * f + 4 * fTR.scale;
              const wyBot = fBR.y + (bBR.y - fBR.y) * f - 6 * fBR.scale;
              ctx.fillStyle = colBlack;
              ctx.fillRect(wx - 3 * fTR.scale, wyTop, 6 * fTR.scale, Math.max(4, wyBot - wyTop));
            }
          }

          // 4. FRONT FACE: Solid White Pong Paddle facing player
          ctx.fillStyle = colWhite;
          ctx.beginPath();
          ctx.moveTo(fTL.x, fTL.y);
          ctx.lineTo(fTR.x, fTR.y);
          ctx.lineTo(fBR.x, fBR.y);
          ctx.lineTo(fBL.x, fBL.y);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = colBlack;
          ctx.lineWidth = 2;
          ctx.stroke();

          const frontW = fTR.x - fTL.x;
          const frontH = fBL.y - fTL.y;
          ctx.fillStyle = colBlack;
          ctx.fillRect(fTL.x + 4 * fTL.scale, fTL.y + 4 * fTL.scale, frontW - 8 * fTL.scale, frontH * 0.28);

          const hlR = Math.max(2, 4 * fTL.scale);
          ctx.beginPath();
          ctx.arc(fTL.x + 8 * fTL.scale, fBL.y - 8 * fTL.scale, hlR, 0, Math.PI * 2);
          ctx.arc(fTR.x - 8 * fTR.scale, fBL.y - 8 * fTR.scale, hlR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.fillStyle = colWhite;
    for (const p of sb.particles) {
      const projP = project3D(p.x, p.y, p.z);
      ctx.fillRect(projP.x, projP.y, 2, 2);
    }

    const pZ = 60;
    const pProj = project3D(sb.x, sb.y, pZ);
    const shadowProj = project3D(sb.x, sb.onTrain ? 36 : 0, pZ);

    const shadowAlt = Math.max(0, sb.y - (sb.onTrain ? 36 : 0));
    const shadowR = Math.max(4, (sb.radius * pProj.scale * 1.6) * (1 - Math.min(0.6, shadowAlt / 60)));
    ctx.fillStyle = '#444444';
    ctx.beginPath();
    ctx.ellipse(shadowProj.x, shadowProj.y, shadowR, shadowR * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    const isVisible = (sb.invulnerableTimer <= 0) || (Math.floor(Date.now() / 80) % 2 === 0);
    if (isVisible) {
      ctx.save();
      ctx.translate(pProj.x, pProj.y);

      if (sb.sliding) {
        const puckW = sb.radius * pProj.scale * 2.2;
        const puckH = sb.radius * pProj.scale * 0.6;
        ctx.fillStyle = colWhite;
        ctx.beginPath();
        ctx.ellipse(0, 0, puckW, puckH, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = colBlack;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        const ballR = sb.radius * pProj.scale * 1.4;
        ctx.fillStyle = colWhite;
        ctx.beginPath();
        ctx.arc(0, 0, ballR, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(sb.ballRollAngle);
        ctx.strokeStyle = colBlack;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, ballR, -0.6, 0.6);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Clean HUD only (NO unneeded text or bottom banners)
    ctx.font = '14px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'left';
    ctx.fillText(`DIST: ${Math.floor(sb.distance)}m / ${sb.targetDistance}m`, 28, 48);

    ctx.textAlign = 'right';
    let lifePaddles = '';
    for (let i = 0; i < sb.lives; i++) lifePaddles += '| ';
    ctx.fillText(`LIVES: [ ${lifePaddles}]  COINS: ${sb.coins}`, CANVAS_WIDTH - 28, 48);

    if (sb.shake > 0) {
      ctx.restore();
    }
  }

  // ========================================================
  // LEVEL 48: SPEED PONG (LOOKS 100% LIKE NORMAL PONG)
  // ========================================================
  initSpeedLaser(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.y = CANVAS_HEIGHT / 2 - 40;
    this.player.height = 80;
    this.enemy.y = CANVAS_HEIGHT / 2 - 40;
    this.enemy.height = 80;

    this.modeState = {
      baseSpeed: 360,
      currentSpeed: 360,
      maxRallySpeed: 1750,
      shake: 0,
      scoredTimer: 0,
      aiSpeed: aiCfg.speedLaserAiSpeed || 520
    };

    this.resetSpeedLaserBall(1);
  }

  resetSpeedLaserBall(dir) {
    const sl = this.modeState;
    if (!sl) return;
    this.ball.x = CANVAS_WIDTH / 2;
    this.ball.y = CANVAS_HEIGHT / 2;
    this.ball.radius = 5;
    sl.currentSpeed = sl.baseSpeed;

    const angle = (Math.random() - 0.5) * 0.65;
    this.ball.vx = dir * sl.currentSpeed * Math.cos(angle);
    this.ball.vy = sl.currentSpeed * Math.sin(angle);
  }

  updateSpeedLaser(dt) {
    const sl = this.modeState;
    if (!sl) return;

    if (sl.shake > 0) sl.shake = Math.max(0, sl.shake - dt * 25);
    if (sl.scoredTimer > 0) {
      sl.scoredTimer -= dt;
      if (sl.scoredTimer <= 0) {
        if (this.player.score >= 5) {
          this.showResult(true, 'SPEED PONG CHAMPION!');
          return;
        } else if (this.enemy.score >= 5) {
          this.showResult(false, 'OUTPACED BY SPEED PONG!');
          return;
        }
      }
      return;
    }

    const padSpeed = 520;
    if (this.keys['w'] || this.keys['arrowup']) {
      this.player.y = Math.max(12, this.player.y - padSpeed * dt);
      this.mouseActive = false;
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      this.player.y = Math.min(CANVAS_HEIGHT - 12 - this.player.height, this.player.y + padSpeed * dt);
      this.mouseActive = false;
    }
    if (this.mouseActive) {
      const targetY = this.mouseY - this.player.height / 2;
      this.player.y += (targetY - this.player.y) * Math.min(1, 24 * dt);
      this.player.y = Math.max(12, Math.min(CANVAS_HEIGHT - 12 - this.player.height, this.player.y));
    }

    const playerX = 36;
    const enemyX = CANVAS_WIDTH - 36 - 12;

    // Hardened Bot: Trajectory prediction with wall reflections + dynamic speed scaling
    let aiTargetY = CANVAS_HEIGHT / 2 - this.enemy.height / 2;
    if (this.ball.vx > 0) {
      const topBound = 12 + this.ball.radius;
      const botBound = CANVAS_HEIGHT - 12 - this.ball.radius;
      const courtH = botBound - topBound;
      const timeToIntercept = (enemyX - this.ball.x) / this.ball.vx;
      let predictedY = this.ball.y + this.ball.vy * timeToIntercept;

      if (courtH > 0) {
        let relY = predictedY - topBound;
        let period = courtH * 2;
        relY = ((relY % period) + period) % period;
        if (relY > courtH) {
          relY = period - relY;
        }
        predictedY = topBound + relY;
      }
      aiTargetY = predictedY - this.enemy.height / 2;
    } else {
      aiTargetY = (CANVAS_HEIGHT / 2 * 0.35 + this.ball.y * 0.65) - this.enemy.height / 2;
    }

    // Balanced Speed AI: Responsive rallies, but capped so high-angle shots can beat the bot!
    const baseCap = this.difficulty === 'impossible' ? 510 : (this.difficulty === 'hard' ? 465 : (this.difficulty === 'easy' ? 360 : 420));
    const effectiveAiSpeed = Math.min(baseCap, Math.max(sl.aiSpeed * 0.9, sl.currentSpeed * 0.65));
    const aiMaxMove = effectiveAiSpeed * dt;
    const aiDiff = aiTargetY - this.enemy.y;
    if (Math.abs(aiDiff) > 6) {
      this.enemy.y += Math.sign(aiDiff) * Math.min(Math.abs(aiDiff), aiMaxMove);
    }
    this.enemy.y = Math.max(12, Math.min(CANVAS_HEIGHT - 12 - this.enemy.height, this.enemy.y));

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    if (this.ball.y <= 12 + this.ball.radius) {
      this.ball.y = 12 + this.ball.radius;
      this.ball.vy = Math.abs(this.ball.vy);
      window.Sound?.play('wall');
    } else if (this.ball.y >= CANVAS_HEIGHT - 12 - this.ball.radius) {
      this.ball.y = CANVAS_HEIGHT - 12 - this.ball.radius;
      this.ball.vy = -Math.abs(this.ball.vy);
      window.Sound?.play('wall');
    }

    // Paddle Hit (Accelerates ball by +12%)
    if (this.ball.vx < 0 && this.ball.x - this.ball.radius <= playerX + 12 && this.ball.x + this.ball.radius >= playerX) {
      if (this.ball.y >= this.player.y - 6 && this.ball.y <= this.player.y + this.player.height + 6) {
        sl.currentSpeed = Math.min(sl.maxRallySpeed, sl.currentSpeed * 1.12);
        const rel = (this.ball.y - (this.player.y + this.player.height / 2)) / (this.player.height / 2);
        const angle = rel * 0.85;
        this.ball.vx = Math.abs(sl.currentSpeed * Math.cos(angle));
        this.ball.vy = sl.currentSpeed * Math.sin(angle);
        this.ball.x = playerX + 12 + this.ball.radius;
        sl.shake = Math.min(10, (sl.currentSpeed - 400) / 90);
        window.Sound?.play('paddle');
      }
    }

    if (this.ball.vx > 0 && this.ball.x + this.ball.radius >= enemyX && this.ball.x - this.ball.radius <= enemyX + 12) {
      if (this.ball.y >= this.enemy.y - 6 && this.ball.y <= this.enemy.y + this.enemy.height + 6) {
        sl.currentSpeed = Math.min(sl.maxRallySpeed, sl.currentSpeed * 1.12);
        const rel = (this.ball.y - (this.enemy.y + this.enemy.height / 2)) / (this.enemy.height / 2);
        const angle = rel * 0.85;
        this.ball.vx = -Math.abs(sl.currentSpeed * Math.cos(angle));
        this.ball.vy = sl.currentSpeed * Math.sin(angle);
        this.ball.x = enemyX - this.ball.radius;
        sl.shake = Math.min(10, (sl.currentSpeed - 400) / 90);
        window.Sound?.play('paddle');
      }
    }

    if (this.ball.x < -10) {
      this.enemy.score++;
      window.Sound?.play('score');
      sl.scoredTimer = 0.8;
      this.resetSpeedLaserBall(1);
    } else if (this.ball.x > CANVAS_WIDTH + 10) {
      this.player.score++;
      window.Sound?.play('score');
      sl.scoredTimer = 0.8;
      this.resetSpeedLaserBall(-1);
    }
  }

  renderSpeedLaser(ctx, colWhite, colBlack) {
    const sl = this.modeState;
    if (!sl) return;

    if (sl.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * sl.shake, (Math.random() - 0.5) * sl.shake);
    }

    // Boundary walls (Clean normal Pong look)
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 10);
    ctx.fillRect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10);

    // Dashed net
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 12);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12);
    ctx.stroke();
    ctx.setLineDash([]);

    // Classic Scores (NO unneeded text or speedometers)
    ctx.font = '32px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}   ${this.enemy.score}`, CANVAS_WIDTH / 2, 60);

    // Normal Paddles
    ctx.fillStyle = colWhite;
    ctx.fillRect(36, this.player.y, 12, this.player.height);
    ctx.fillRect(CANVAS_WIDTH - 36 - 12, this.enemy.y, 12, this.enemy.height);

    // Normal Square Ball
    ctx.fillRect(this.ball.x - 5, this.ball.y - 5, 10, 10);

    if (sl.shake > 0) {
      ctx.restore();
    }
  }

  // ========================================================
  // LEVEL 49: PONG PINBALL (CLEAN RETRO LOOK)
  // ========================================================
  initPinball(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.y = CANVAS_HEIGHT / 2 - 45;
    this.player.height = 90;
    this.enemy.y = CANVAS_HEIGHT / 2 - 45;
    this.enemy.height = 90;

    this.modeState = {
      playerBonus: 0,
      enemyBonus: 0,
      lastHitter: 'PLAYER',
      bumpers: [
        { type: 'diamond', x: 370, y: 270, size: 36, flash: 0, pts: 100 },
        { type: 'diamond', x: 590, y: 270, size: 36, flash: 0, pts: 100 },
        { type: 'pop', x: 480, y: 150, r: 26, flash: 0, pts: 150 },
        { type: 'pop', x: 480, y: 390, r: 26, flash: 0, pts: 150 }
      ],
      slingshots: [
        { x: 120, y: 40, w: 46, h: 46, dirX: 1, dirY: 1, flash: 0 },
        { x: 120, y: 454, w: 46, h: 46, dirX: 1, dirY: -1, flash: 0 },
        { x: 794, y: 40, w: 46, h: 46, dirX: -1, dirY: 1, flash: 0 },
        { x: 794, y: 454, w: 46, h: 46, dirX: -1, dirY: -1, flash: 0 }
      ],
      rings: [],
      popups: [],
      particles: [],
      shake: 0,
      scoredTimer: 0,
      aiSpeed: aiCfg.pinballAiSpeed || 400
    };

    this.resetPinballBall(1);
  }

  resetPinballBall(dir) {
    const pb = this.modeState;
    if (!pb) return;
    this.ball.x = CANVAS_WIDTH / 2;
    this.ball.y = CANVAS_HEIGHT / 2;
    this.ball.radius = 7;
    const spd = 420;
    const angle = (Math.random() - 0.5) * 0.7;
    this.ball.vx = dir * spd * Math.cos(angle);
    this.ball.vy = spd * Math.sin(angle);
    pb.lastHitter = (dir > 0) ? 'PLAYER' : 'AI';
  }

  updatePinball(dt) {
    const pb = this.modeState;
    if (!pb) return;

    if (pb.shake > 0) pb.shake = Math.max(0, pb.shake - dt * 25);
    if (pb.scoredTimer > 0) {
      pb.scoredTimer -= dt;
      if (pb.scoredTimer <= 0) {
        if (this.player.score >= 5) {
          this.showResult(true, 'PONG PINBALL WIZARD!');
          return;
        } else if (this.enemy.score >= 5) {
          this.showResult(false, 'DEFEATED ON PINBALL TABLE!');
          return;
        }
      }
      return;
    }

    const padSpeed = 500;
    if (this.keys['w'] || this.keys['arrowup']) {
      this.player.y = Math.max(12, this.player.y - padSpeed * dt);
      this.mouseActive = false;
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      this.player.y = Math.min(CANVAS_HEIGHT - 12 - this.player.height, this.player.y + padSpeed * dt);
      this.mouseActive = false;
    }
    if (this.mouseActive) {
      const targetY = this.mouseY - this.player.height / 2;
      this.player.y += (targetY - this.player.y) * Math.min(1, 24 * dt);
      this.player.y = Math.max(12, Math.min(CANVAS_HEIGHT - 12 - this.player.height, this.player.y));
    }

    const aiTargetY = this.ball.y - this.enemy.height / 2;
    const aiMaxMove = pb.aiSpeed * dt;
    const aiDiff = aiTargetY - this.enemy.y;
    this.enemy.y += Math.sign(aiDiff) * Math.min(Math.abs(aiDiff), aiMaxMove);
    this.enemy.y = Math.max(12, Math.min(CANVAS_HEIGHT - 12 - this.enemy.height, this.enemy.y));

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    if (this.ball.y <= 12 + this.ball.radius) {
      this.ball.y = 12 + this.ball.radius;
      this.ball.vy = Math.abs(this.ball.vy);
      window.Sound?.play('wall');
    } else if (this.ball.y >= CANVAS_HEIGHT - 12 - this.ball.radius) {
      this.ball.y = CANVAS_HEIGHT - 12 - this.ball.radius;
      this.ball.vy = -Math.abs(this.ball.vy);
      window.Sound?.play('wall');
    }

    const playerX = 36;
    const enemyX = CANVAS_WIDTH - 36 - 12;

    if (this.ball.vx < 0 && this.ball.x - this.ball.radius <= playerX + 12 && this.ball.x + this.ball.radius >= playerX) {
      if (this.ball.y >= this.player.y - 4 && this.ball.y <= this.player.y + this.player.height + 4) {
        pb.lastHitter = 'PLAYER';
        const curSpd = Math.max(420, Math.hypot(this.ball.vx, this.ball.vy));
        const rel = (this.ball.y - (this.player.y + this.player.height / 2)) / (this.player.height / 2);
        const angle = rel * 0.85;
        this.ball.vx = Math.abs(curSpd * Math.cos(angle));
        this.ball.vy = curSpd * Math.sin(angle);
        this.ball.x = playerX + 12 + this.ball.radius;
        window.Sound?.play('paddle');
      }
    }

    if (this.ball.vx > 0 && this.ball.x + this.ball.radius >= enemyX && this.ball.x - this.ball.radius <= enemyX + 12) {
      if (this.ball.y >= this.enemy.y - 4 && this.ball.y <= this.enemy.y + this.enemy.height + 4) {
        pb.lastHitter = 'AI';
        const curSpd = Math.max(420, Math.hypot(this.ball.vx, this.ball.vy));
        const rel = (this.ball.y - (this.enemy.y + this.enemy.height / 2)) / (this.enemy.height / 2);
        const angle = rel * 0.85;
        this.ball.vx = -Math.abs(curSpd * Math.cos(angle));
        this.ball.vy = curSpd * Math.sin(angle);
        this.ball.x = enemyX - this.ball.radius;
        window.Sound?.play('paddle');
      }
    }

    for (const b of pb.bumpers) {
      if (b.flash > 0) b.flash = Math.max(0, b.flash - dt);

      const dx = this.ball.x - b.x;
      const dy = this.ball.y - b.y;
      const dist = Math.hypot(dx, dy);
      const hitRadius = (b.type === 'pop') ? (b.r + this.ball.radius) : (b.size * 0.65 + this.ball.radius);

      if (dist <= hitRadius) {
        const angle = Math.atan2(dy, dx);
        const kickSpeed = Math.min(850, Math.max(480, Math.hypot(this.ball.vx, this.ball.vy) * 1.15));
        this.ball.vx = Math.cos(angle) * kickSpeed;
        this.ball.vy = Math.sin(angle) * kickSpeed;
        this.ball.x = b.x + Math.cos(angle) * (hitRadius + 3);
        this.ball.y = b.y + Math.sin(angle) * (hitRadius + 3);

        b.flash = 0.25;
        pb.shake = 8;
        window.Sound?.play('wall');

        pb.rings.push({ x: b.x, y: b.y, r: hitRadius, maxR: hitRadius + 28, life: 0.35 });
        pb.popups.push({ text: `+${b.pts}`, x: b.x, y: b.y - 12, life: 0.8 });

        if (pb.lastHitter === 'PLAYER') pb.playerBonus += b.pts;
        else pb.enemyBonus += b.pts;

        for (let i = 0; i < 8; i++) {
          pb.particles.push({
            x: b.x + Math.cos(angle) * hitRadius,
            y: b.y + Math.sin(angle) * hitRadius,
            vx: Math.cos(angle + (Math.random() - 0.5)) * 140,
            vy: Math.sin(angle + (Math.random() - 0.5)) * 140,
            life: 0.3
          });
        }
      }
    }

    for (const s of pb.slingshots) {
      if (s.flash > 0) s.flash = Math.max(0, s.flash - dt);

      if (this.ball.x >= s.x && this.ball.x <= s.x + s.w && this.ball.y >= s.y && this.ball.y <= s.y + s.h) {
        s.flash = 0.25;
        const kickSpeed = 520;
        this.ball.vx = s.dirX * kickSpeed * (0.8 + Math.random() * 0.4);
        this.ball.vy = s.dirY * kickSpeed * (0.8 + Math.random() * 0.4);
        this.ball.x += s.dirX * 12;
        this.ball.y += s.dirY * 12;
        pb.shake = 6;
        window.Sound?.play('wall');
        pb.popups.push({ text: '+50', x: s.x + s.w / 2, y: s.y + s.h / 2, life: 0.6 });
        if (pb.lastHitter === 'PLAYER') pb.playerBonus += 50;
        else pb.enemyBonus += 50;
      }
    }

    for (let i = pb.rings.length - 1; i >= 0; i--) {
      const r = pb.rings[i];
      r.life -= dt;
      r.r += (r.maxR - r.r) * Math.min(1, 14 * dt);
      if (r.life <= 0) pb.rings.splice(i, 1);
    }
    for (let i = pb.popups.length - 1; i >= 0; i--) {
      const pop = pb.popups[i];
      pop.life -= dt;
      pop.y -= 35 * dt;
      if (pop.life <= 0) pb.popups.splice(i, 1);
    }
    for (let i = pb.particles.length - 1; i >= 0; i--) {
      const p = pb.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) pb.particles.splice(i, 1);
    }

    if (this.ball.x < -10) {
      this.enemy.score++;
      window.Sound?.play('score');
      pb.scoredTimer = 0.8;
      this.resetPinballBall(1);
    } else if (this.ball.x > CANVAS_WIDTH + 10) {
      this.player.score++;
      window.Sound?.play('score');
      pb.scoredTimer = 0.8;
      this.resetPinballBall(-1);
    }
  }

  renderPinball(ctx, colWhite, colBlack) {
    const pb = this.modeState;
    if (!pb) return;

    if (pb.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * pb.shake, (Math.random() - 0.5) * pb.shake);
    }

    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 10);
    ctx.fillRect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10);

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 12);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const s of pb.slingshots) {
      ctx.fillStyle = (s.flash > 0) ? colWhite : '#222222';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(s.x, s.y, s.w, s.h);

      ctx.strokeStyle = (s.flash > 0) ? colBlack : colWhite;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (s.dirX > 0 && s.dirY > 0) {
        ctx.moveTo(s.x, s.y + s.h); ctx.lineTo(s.x + s.w, s.y);
      } else if (s.dirX > 0 && s.dirY < 0) {
        ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + s.w, s.y + s.h);
      } else if (s.dirX < 0 && s.dirY > 0) {
        ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + s.w, s.y + s.h);
      } else {
        ctx.moveTo(s.x, s.y + s.h); ctx.lineTo(s.x + s.w, s.y);
      }
      ctx.stroke();
    }

    for (const b of pb.bumpers) {
      if (b.type === 'pop') {
        ctx.fillStyle = (b.flash > 0) ? colWhite : colBlack;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = (b.flash > 0) ? colBlack : colWhite;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.strokeStyle = (b.flash > 0) ? colBlack : colWhite;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 0.55, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = (b.flash > 0) ? colBlack : colWhite;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.type === 'diamond') {
        const hs = b.size / 2;
        ctx.fillStyle = (b.flash > 0) ? colWhite : colBlack;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y - hs);
        ctx.lineTo(b.x + hs, b.y);
        ctx.lineTo(b.x, b.y + hs);
        ctx.lineTo(b.x - hs, b.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = (b.flash > 0) ? colBlack : colWhite;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        const ihs = hs * 0.55;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y - ihs);
        ctx.lineTo(b.x + ihs, b.y);
        ctx.lineTo(b.x, b.y + ihs);
        ctx.lineTo(b.x - ihs, b.y);
        ctx.closePath();
        ctx.stroke();
      }
    }

    ctx.strokeStyle = colWhite;
    for (const r of pb.rings) {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = colWhite;
    ctx.fillRect(36, this.player.y, 12, this.player.height);
    ctx.fillRect(CANVAS_WIDTH - 36 - 12, this.enemy.y, 12, this.enemy.height);

    ctx.fillStyle = colWhite;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();

    for (const p of pb.particles) {
      ctx.fillRect(p.x, p.y, 2, 2);
    }

    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    for (const pop of pb.popups) {
      ctx.fillText(pop.text, pop.x, pop.y);
    }

    // Clean score numbers (NO unneeded text or bottom banners)
    ctx.font = '32px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.fillText(`${this.player.score}   ${this.enemy.score}`, CANVAS_WIDTH / 2, 60);

    if (pb.shake > 0) {
      ctx.restore();
    }
  }

  // ========================================================
  // LEVEL 50: SHRINKING BALL (NORMAL PONG WITH SHRINKING BALL)
  // ========================================================
  initShrinkingBall(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.h = 80;
    this.player.height = 80;
    this.enemy.h = 80;
    this.enemy.height = 80;
    this.player.y = CANVAS_HEIGHT / 2 - 40;
    this.enemy.y = CANVAS_HEIGHT / 2 - 40;

    this.modeState = {
      startRadius: 44, // Starts off HUGE
      currentRadius: 44,
      particles: [],
      shake: 0,
      scoredTimer: 0,
      aiSpeed: 440
    };

    this.resetShrinkingBall(1);
  }

  resetShrinkingBall(dir) {
    const sb = this.modeState;
    if (!sb) return;
    sb.currentRadius = sb.startRadius;
    this.ball.x = CANVAS_WIDTH / 2;
    this.ball.y = CANVAS_HEIGHT / 2;
    this.ball.radius = sb.currentRadius;

    const spd = 360;
    const angle = (Math.random() - 0.5) * 0.6;
    this.ball.vx = dir * spd * Math.cos(angle);
    this.ball.vy = spd * Math.sin(angle);
  }

  updateShrinkingBall(dt) {
    const sb = this.modeState;
    if (!sb) return;

    if (sb.shake > 0) sb.shake = Math.max(0, sb.shake - dt * 25);
    if (sb.scoredTimer > 0) {
      sb.scoredTimer -= dt;
      if (sb.scoredTimer <= 0) {
        if (this.player.score >= 5) {
          this.showResult(true, 'SHRINKING BALL CHAMPION!');
          return;
        } else if (this.enemy.score >= 5) {
          this.showResult(false, 'OUTPLAYED BY SHRINKING BALL!');
          return;
        }
      }
      return;
    }

    const padSpeed = 480;
    if (this.keys['w'] || this.keys['arrowup']) {
      this.player.y = Math.max(12, this.player.y - padSpeed * dt);
      this.mouseActive = false;
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      this.player.y = Math.min(CANVAS_HEIGHT - 12 - this.player.height, this.player.y + padSpeed * dt);
      this.mouseActive = false;
    }
    if (this.mouseActive) {
      const targetY = this.mouseY - this.player.height / 2;
      this.player.y += (targetY - this.player.y) * Math.min(1, 24 * dt);
      this.player.y = Math.max(12, Math.min(CANVAS_HEIGHT - 12 - this.player.height, this.player.y));
    }

    const aiTargetY = this.ball.y - this.enemy.height / 2;
    const aiMaxMove = sb.aiSpeed * dt;
    const aiDiff = aiTargetY - this.enemy.y;
    this.enemy.y += Math.sign(aiDiff) * Math.min(Math.abs(aiDiff), aiMaxMove);
    this.enemy.y = Math.max(12, Math.min(CANVAS_HEIGHT - 12 - this.enemy.height, this.enemy.y));

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    // Walls
    if (this.ball.y <= 12 + sb.currentRadius) {
      this.ball.y = 12 + sb.currentRadius;
      this.ball.vy = Math.abs(this.ball.vy);
      window.Sound?.play('wall');
    } else if (this.ball.y >= CANVAS_HEIGHT - 12 - sb.currentRadius) {
      this.ball.y = CANVAS_HEIGHT - 12 - sb.currentRadius;
      this.ball.vy = -Math.abs(this.ball.vy);
      window.Sound?.play('wall');
    }

    const playerX = 36;
    const enemyX = CANVAS_WIDTH - 36 - 12;

    // Player Paddle Deflection (shrinks ball down towards a tiny microscopic dot!)
    const effectiveHitR = Math.max(8, sb.currentRadius);
    if (this.ball.vx < 0 && this.ball.x - sb.currentRadius <= playerX + 12 && this.ball.x + effectiveHitR >= playerX) {
      if (this.ball.y >= this.player.y - effectiveHitR * 0.5 && this.ball.y <= this.player.y + this.player.height + effectiveHitR * 0.5) {
        sb.currentRadius = Math.max(1.5, sb.currentRadius - 6);
        this.ball.radius = sb.currentRadius;
        const curSpd = Math.min(680, Math.hypot(this.ball.vx, this.ball.vy) + 20);
        const rel = (this.ball.y - (this.player.y + this.player.height / 2)) / (this.player.height / 2);
        const angle = rel * 0.85;
        this.ball.vx = Math.abs(curSpd * Math.cos(angle));
        this.ball.vy = curSpd * Math.sin(angle);
        this.ball.x = playerX + 12 + sb.currentRadius;
        window.Sound?.play('paddle');

        for (let i = 0; i < 8; i++) {
          sb.particles.push({
            x: this.ball.x,
            y: this.ball.y,
            vx: (Math.random() + 0.2) * 120,
            vy: (Math.random() - 0.5) * 120,
            life: 0.3
          });
        }
      }
    }

    // Enemy Paddle Deflection (shrinks ball down towards a tiny microscopic dot!)
    if (this.ball.vx > 0 && this.ball.x + sb.currentRadius >= enemyX && this.ball.x - effectiveHitR <= enemyX + 12) {
      if (this.ball.y >= this.enemy.y - effectiveHitR * 0.5 && this.ball.y <= this.enemy.y + this.enemy.height + effectiveHitR * 0.5) {
        sb.currentRadius = Math.max(1.5, sb.currentRadius - 6);
        this.ball.radius = sb.currentRadius;
        const curSpd = Math.min(680, Math.hypot(this.ball.vx, this.ball.vy) + 20);
        const rel = (this.ball.y - (this.enemy.y + this.enemy.height / 2)) / (this.enemy.height / 2);
        const angle = rel * 0.85;
        this.ball.vx = -Math.abs(curSpd * Math.cos(angle));
        this.ball.vy = curSpd * Math.sin(angle);
        this.ball.x = enemyX - sb.currentRadius;
        window.Sound?.play('paddle');

        for (let i = 0; i < 8; i++) {
          sb.particles.push({
            x: this.ball.x,
            y: this.ball.y,
            vx: -(Math.random() + 0.2) * 120,
            vy: (Math.random() - 0.5) * 120,
            life: 0.3
          });
        }
      }
    }

    for (let i = sb.particles.length - 1; i >= 0; i--) {
      const p = sb.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) sb.particles.splice(i, 1);
    }

    if (this.ball.x < -20) {
      this.enemy.score++;
      window.Sound?.play('score');
      sb.scoredTimer = 0.8;
      this.resetShrinkingBall(1);
    } else if (this.ball.x > CANVAS_WIDTH + 20) {
      this.player.score++;
      window.Sound?.play('score');
      sb.scoredTimer = 0.8;
      this.resetShrinkingBall(-1);
    }
  }

  renderShrinkingBall(ctx, colWhite, colBlack) {
    const sb = this.modeState;
    if (!sb) return;

    if (sb.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * sb.shake, (Math.random() - 0.5) * sb.shake);
    }

    // Normal boundary walls
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 10);
    ctx.fillRect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10);

    // Dashed net
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 12);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12);
    ctx.stroke();
    ctx.setLineDash([]);

    // Classic Scores (Clean normal look)
    ctx.font = '32px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}   ${this.enemy.score}`, CANVAS_WIDTH / 2, 60);

    // Paddles
    ctx.fillRect(36, this.player.y, 12, this.player.height);
    ctx.fillRect(CANVAS_WIDTH - 36 - 12, this.enemy.y, 12, this.enemy.height);

    // Shrinking Ball (rendered as solid white circle)
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, Math.max(1.5, sb.currentRadius), 0, Math.PI * 2);
    ctx.fill();

    for (const p of sb.particles) {
      ctx.fillRect(p.x, p.y, 2, 2);
    }

    if (sb.shake > 0) {
      ctx.restore();
    }
  }

  // ========================================================
  // LEVEL 51: SECOND-PERSON PONG
  // You control your paddle in the distance through the eyes of the AI!
  // ========================================================
  initSecondPerson(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;

    this.modeState = {
      courtW: 420,
      courtH: 210,
      oppZ: 40,        // Opponent is in the foreground right in front of the camera
      playerZ: 640,    // Player is at the far back wall
      playerX: 0,
      playerY: 0,
      playerW: 120,    // Back paddle
      playerH: 75,
      oppX: 0,
      oppY: 0,
      oppW: 130,       // Front paddle
      oppH: 85,
      oppSpeed: aiCfg.secondPersonOppSpeed || 3.6,
      ball: {
        x: 0,
        y: 0,
        z: 340,
        vx: (Math.random() - 0.5) * 2.4,
        vy: (Math.random() - 0.5) * 1.6,
        vz: (Math.random() < 0.5 ? -1 : 1) * (aiCfg.secondPersonBallVz || 6.5),
        radius: 14
      },
      time: 0,
      shake: 0,
      playerFlash: 0,
      oppFlash: 0
    };
  }

  resetSecondPersonBall(dirToPlayer = 1) {
    const sp = this.modeState;
    if (!sp) return;
    const aiCfg = this.getAiConfig();
    const vzSpeed = aiCfg.secondPersonBallVz || 6.5;

    sp.ball.x = 0;
    sp.ball.y = 0;
    sp.ball.z = 340;
    sp.ball.vx = (Math.random() - 0.5) * 2.4;
    sp.ball.vy = (Math.random() - 0.5) * 1.6;
    sp.ball.vz = dirToPlayer * vzSpeed;
  }

  updateSecondPerson(dt) {
    const sp = this.modeState;
    if (!sp) return;

    sp.time += dt;
    if (sp.shake > 0) sp.shake = Math.max(0, sp.shake - dt * 22);
    if (sp.playerFlash > 0) sp.playerFlash = Math.max(0, sp.playerFlash - dt * 4.0);
    if (sp.oppFlash > 0) sp.oppFlash = Math.max(0, sp.oppFlash - dt * 4.0);

    const focal = 320;
    const playerScale = focal / (sp.playerZ + focal);

    // 1. Player Controls Far Paddle (through opponent's eyes!)
    let kx = 0, ky = 0;
    if (this.keys['a'] || this.keys['arrowleft']) { kx -= 1; this.mouseActive = false; }
    if (this.keys['d'] || this.keys['arrowright']) { kx += 1; this.mouseActive = false; }
    if (this.keys['w'] || this.keys['arrowup']) { ky -= 1; this.mouseActive = false; }
    if (this.keys['s'] || this.keys['arrowdown']) { ky += 1; this.mouseActive = false; }
    if (kx !== 0 && ky !== 0) { kx *= 0.7071; ky *= 0.7071; }

    if (kx !== 0 || ky !== 0) {
      sp.playerX += kx * (14.0 / playerScale);
      sp.playerY += ky * (14.0 / playerScale);
    } else if (this.mouseActive) {
      const targetX = (this.mouseX - CANVAS_WIDTH / 2) / playerScale;
      const targetY = (this.mouseY - CANVAS_HEIGHT / 2) / playerScale;
      sp.playerX += (targetX - sp.playerX) * Math.min(1, 22 * dt);
      sp.playerY += (targetY - sp.playerY) * Math.min(1, 22 * dt);
    }

    const maxPX = sp.courtW - sp.playerW / 2;
    const maxPY = sp.courtH - sp.playerH / 2;
    sp.playerX = Math.max(-maxPX, Math.min(maxPX, sp.playerX));
    sp.playerY = Math.max(-maxPY, Math.min(maxPY, sp.playerY));

    // 2. Opponent AI (Foreground Paddle tracking incoming ball)
    const b = sp.ball;
    if (b.vz < 0) { // Ball heading towards opponent in foreground
      const diffX = b.x - sp.oppX;
      const diffY = b.y - sp.oppY;
      if (Math.abs(diffX) > 10) {
        sp.oppX += Math.sign(diffX) * Math.min(Math.abs(diffX), sp.oppSpeed);
      }
      if (Math.abs(diffY) > 10) {
        sp.oppY += Math.sign(diffY) * Math.min(Math.abs(diffY), sp.oppSpeed * 0.85);
      }
    } else {
      sp.oppX += (0 - sp.oppX) * Math.min(1, 1.5 * dt);
      sp.oppY += (0 - sp.oppY) * Math.min(1, 1.5 * dt);
    }
    const maxOX = sp.courtW - sp.oppW / 2;
    const maxOY = sp.courtH - sp.oppH / 2;
    sp.oppX = Math.max(-maxOX, Math.min(maxOX, sp.oppX));
    sp.oppY = Math.max(-maxOY, Math.min(maxOY, sp.oppY));

    // 3. Ball Kinematics & Tunnel Walls
    b.x += b.vx;
    b.y += b.vy;
    b.z += b.vz;

    if (b.x <= -sp.courtW + 12) {
      b.x = -sp.courtW + 12;
      b.vx = Math.abs(b.vx);
      window.Sound?.play('wall');
    } else if (b.x >= sp.courtW - 12) {
      b.x = sp.courtW - 12;
      b.vx = -Math.abs(b.vx);
      window.Sound?.play('wall');
    }

    if (b.y <= -sp.courtH + 12) {
      b.y = -sp.courtH + 12;
      b.vy = Math.abs(b.vy);
      window.Sound?.play('wall');
    } else if (b.y >= sp.courtH - 12) {
      b.y = sp.courtH - 12;
      b.vy = -Math.abs(b.vy);
      window.Sound?.play('wall');
    }

    // 4. Hit at Far End: Player Paddle (z = playerZ = 640)
    if (b.vz > 0 && b.z >= sp.playerZ - 12) {
      const reachX = sp.playerW / 2 + b.radius + 10;
      const reachY = sp.playerH / 2 + b.radius + 10;
      const hit = Math.abs(b.x - sp.playerX) <= reachX && Math.abs(b.y - sp.playerY) <= reachY;

      if (hit) {
        b.z = sp.playerZ;
        b.vz = -Math.abs(b.vz) * 1.02;
        b.vx = ((b.x - sp.playerX) / (sp.playerW / 2)) * 4.2 + (Math.random() - 0.5) * 0.8;
        b.vy = ((b.y - sp.playerY) / (sp.playerH / 2)) * 3.0 + (Math.random() - 0.5) * 0.8;
        sp.playerFlash = 0.35;
        sp.shake = 8;
        window.Sound?.play('paddle');
      } else if (b.z > sp.playerZ + 40) {
        this.enemy.score++;
        window.Sound?.play('lose');
        if (this.enemy.score >= 5) {
          this.showResult(false, 'OUTPLAYED IN SECOND-PERSON!');
          return;
        }
        this.resetSecondPersonBall(-1);
      }
    }

    // 5. Hit at Near Plane: Opponent Paddle in Foreground (z = oppZ = 40)
    if (b.vz < 0 && b.z <= sp.oppZ + b.radius + 6) {
      const reachX = sp.oppW / 2 + b.radius + 6;
      const reachY = sp.oppH / 2 + b.radius + 6;
      const hit = Math.abs(b.x - sp.oppX) <= reachX && Math.abs(b.y - sp.oppY) <= reachY;

      if (hit) {
        b.z = sp.oppZ + b.radius + 4;
        b.vz = Math.abs(b.vz) * 1.02;
        b.vx = ((b.x - sp.oppX) / (sp.oppW / 2)) * 3.8 + (Math.random() - 0.5) * 0.6;
        b.vy = ((b.y - sp.oppY) / (sp.oppH / 2)) * 2.8 + (Math.random() - 0.5) * 0.6;
        sp.oppFlash = 0.35;
        sp.shake = 10;
        window.Sound?.play('paddle');
      } else if (b.z <= sp.oppZ) {
        this.player.score++;
        window.Sound?.play('score');
        if (this.player.score >= 5) {
          this.showResult(true, 'SECOND-PERSON CHAMPION!');
          return;
        }
        this.resetSecondPersonBall(1);
      }
    }
  }

  renderSecondPerson(ctx, colWhite, colBlack) {
    const sp = this.modeState;
    if (!sp) return;

    if (sp.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * sp.shake, (Math.random() - 0.5) * sp.shake);
    }

    // 3D Perspective Projection Function (Opponent's view)
    const project = (x, y, z) => {
      const focal = 320;
      const scale = focal / (z + focal);
      return {
        x: CANVAS_WIDTH / 2 + x * scale,
        y: CANVAS_HEIGHT / 2 + y * scale,
        s: scale
      };
    };

    // Clean HUD (Classic Scores & Subtitle)
    ctx.font = '28px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}   ${this.enemy.score}`, CANVAS_WIDTH / 2, 54);

    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#666666';
    ctx.fillText("VIEW FROM OPPONENT'S EYES", CANVAS_WIDTH / 2, 22);

    // 3D Tunnel Wireframe
    const pFarTL = project(-sp.courtW, -sp.courtH, sp.playerZ);
    const pFarTR = project(sp.courtW, -sp.courtH, sp.playerZ);
    const pFarBR = project(sp.courtW, sp.courtH, sp.playerZ);
    const pFarBL = project(-sp.courtW, sp.courtH, sp.playerZ);

    const nearL = 60, nearR = CANVAS_WIDTH - 60;
    const nearT = 60, nearB = CANVAS_HEIGHT - 60;

    // Near Court Rim (Opponent's end)
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.strokeRect(nearL, nearT, nearR - nearL, nearB - nearT);

    // Far Back Wall Frame (Player's end)
    ctx.beginPath();
    ctx.moveTo(pFarTL.x, pFarTL.y);
    ctx.lineTo(pFarTR.x, pFarTR.y);
    ctx.lineTo(pFarBR.x, pFarBR.y);
    ctx.lineTo(pFarBL.x, pFarBL.y);
    ctx.closePath();
    ctx.stroke();

    // 4 Diagonal Edges
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(nearL, nearT); ctx.lineTo(pFarTL.x, pFarTL.y);
    ctx.moveTo(nearR, nearT); ctx.lineTo(pFarTR.x, pFarTR.y);
    ctx.moveTo(nearR, nearB); ctx.lineTo(pFarBR.x, pFarBR.y);
    ctx.moveTo(nearL, nearB); ctx.lineTo(pFarBL.x, pFarBL.y);
    ctx.stroke();

    // Floor Longitudinal Lines
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    for (let lx = -sp.courtW + 105; lx < sp.courtW; lx += 105) {
      const pStart = project(lx, sp.courtH, 0);
      const pEnd = project(lx, sp.courtH, sp.playerZ);
      ctx.beginPath();
      ctx.moveTo(pStart.x, nearB);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
    }

    // Floor Transverse Depth Lines
    for (let lz = 100; lz < sp.playerZ; lz += 100) {
      const p1 = project(-sp.courtW, sp.courtH, lz);
      const p2 = project(sp.courtW, sp.courtH, lz);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Far Wall: Reticle for incoming ball
    const b = sp.ball;
    if (b.vz > 0) {
      const timeToArrival = (sp.playerZ - b.z) / b.vz;
      const predX = b.x + b.vx * timeToArrival;
      const predY = b.y + b.vy * timeToArrival;
      const predProj = project(predX, predY, sp.playerZ);

      const willHit = Math.abs(predX - sp.playerX) <= (sp.playerW / 2 + b.radius + 8) &&
                      Math.abs(predY - sp.playerY) <= (sp.playerH / 2 + b.radius + 8);

      ctx.save();
      ctx.strokeStyle = willHit ? '#ffffff' : '#555555';
      ctx.lineWidth = willHit ? 2 : 1;
      if (!willHit) ctx.setLineDash([3, 3]);

      const markerR = Math.max(5, 12 * Math.min(1, timeToArrival / 35));
      ctx.beginPath();
      ctx.arc(predProj.x, predProj.y, markerR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Far Back Wall: YOUR Paddle (Controlled by Player!)
    const pProj = project(sp.playerX, sp.playerY, sp.playerZ);
    const pWP = sp.playerW * pProj.s;
    const pHP = sp.playerH * pProj.s;

    // Solid Player Paddle at far wall
    ctx.fillStyle = sp.playerFlash > 0 ? '#ffffff' : '#dddddd';
    ctx.fillRect(pProj.x - pWP / 2, pProj.y - pHP / 2, pWP, pHP);
    ctx.strokeStyle = colBlack;
    ctx.lineWidth = 1;
    ctx.strokeRect(pProj.x - pWP / 2, pProj.y - pHP / 2, pWP, pHP);

    // Indicator label above your far paddle: [YOU]
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText('YOU', pProj.x, pProj.y - pHP / 2 - 6);

    // 3D Ball
    const bProj = project(b.x, b.y, b.z);
    const bShadow = project(b.x, sp.courtH, b.z);
    const ballR = Math.max(3, 14 * bProj.s);

    // Floor Shadow
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.ellipse(bShadow.x, bShadow.y, ballR * 1.4, ballR * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball Sphere
    ctx.fillStyle = colWhite;
    ctx.beginPath();
    ctx.arc(bProj.x, bProj.y, ballR, 0, Math.PI * 2);
    ctx.fill();

    // Near Plane: Opponent Paddle (In foreground, looking out from camera)
    const oppProj = project(sp.oppX, sp.oppY, sp.oppZ);
    const oppWP = sp.oppW * oppProj.s;
    const oppHP = sp.oppH * oppProj.s;

    ctx.fillStyle = sp.oppFlash > 0 ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(oppProj.x - oppWP / 2, oppProj.y - oppHP / 2, oppWP, oppHP);

    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.strokeRect(oppProj.x - oppWP / 2, oppProj.y - oppHP / 2, oppWP, oppHP);

    // Opponent Racket Strings Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i <= 3; i++) {
      const gx = oppProj.x - oppWP / 2 + (oppWP * i) / 4;
      ctx.moveTo(gx, oppProj.y - oppHP / 2); ctx.lineTo(gx, oppProj.y + oppHP / 2);
    }
    for (let j = 1; j <= 2; j++) {
      const gy = oppProj.y - oppHP / 2 + (oppHP * j) / 3;
      ctx.moveTo(oppProj.x - oppWP / 2, gy); ctx.lineTo(oppProj.x + oppWP / 2, gy);
    }
    ctx.stroke();

    if (sp.shake > 0) {
      ctx.restore();
    }
  }

  // ========================================================
  // ROGUELIKE PONG (Level 52)
  // Procedural 5-floor run with scaling bosses and 3-card upgrades
  // ========================================================
  initRoguelike(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;

    this.modeState = {
      floor: 1,
      maxFloors: 5,
      playerHp: 4,
      playerMaxHp: 4,
      enemyHp: 2,
      enemyMaxHp: 2,
      state: 'PLAYING',
      pauseTimer: 0,
      playerW: 12,
      playerH: 72,
      playerSpeed: 8.5,
      enemyW: 12,
      enemyH: 50,
      enemySpeed: 2.8,
      floorTitle: 'SPEEDSTER',
      upgrades: [],
      offeredUpgrades: [],
      hasShieldPerk: false,
      playerShieldActive: false,
      hasMultiball: false,
      hasLaserStrike: false,
      hasCrit: false,
      hasChrono: false,
      balls: [],
      lasers: [],
      particles: [],
      shake: 0,
      twinY1: 80,
      twinY2: 410,
      twinH: 32,
      shieldHp: 0,
      shieldX: 840,
      shieldY: 205,
      shieldH: 110,
      shadowGlitchTimer: 0,
      shadowGlitchY: 0
    };

    this.startRoguelikeFloor(1);
  }

  startRoguelikeFloor(floorNum) {
    const s = this.modeState;
    s.floor = floorNum;
    s.state = 'PLAYING';
    s.pauseTimer = 0;
    s.lasers = [];
    s.particles = [];

    if (s.hasShieldPerk) {
      s.playerShieldActive = true;
    }

    const diff = this.difficulty;
    let speedMult = 0.72; // normal
    if (diff === 'easy') speedMult = 0.58;
    else if (diff === 'hard') speedMult = 0.88;
    else if (diff === 'impossible') speedMult = 1.05;

    if (floorNum === 1) {
      s.floorTitle = 'SPEEDSTER';
      s.enemyHp = 2;
      s.enemyMaxHp = 2;
      s.enemyH = 48;
      s.enemyW = 12;
      s.enemySpeed = 3.4 * speedMult;
    } else if (floorNum === 2) {
      s.floorTitle = 'TWIN BLADES';
      s.enemyHp = 3;
      s.enemyMaxHp = 3;
      s.twinH = 40;
      s.enemyW = 12;
      s.enemySpeed = 3.6 * speedMult;
      s.twinY1 = 120;
      s.twinY2 = 360;
    } else if (floorNum === 3) {
      s.floorTitle = 'ENERGY SHIELD';
      s.enemyHp = 4;
      s.enemyMaxHp = 4;
      s.enemyH = 62;
      s.enemyW = 12;
      s.enemySpeed = 3.8 * speedMult;
      s.shieldHp = 2; // 2 solid hits to shatter
      s.shieldX = 840;
      s.shieldY = 190;
      s.shieldH = 160;
    } else if (floorNum === 4) {
      s.floorTitle = 'SHADOW WARP';
      s.enemyHp = 4;
      s.enemyMaxHp = 4;
      s.enemyH = 56;
      s.enemyW = 12;
      s.enemySpeed = 4.1 * speedMult;
      s.shadowGlitchTimer = 0;
      s.shadowGlitchY = 0;
      s.shadowWarpTimer = 0;
    } else {
      s.floorTitle = 'MECHA CORE';
      s.enemyHp = 5;
      s.enemyMaxHp = 5;
      s.enemyH = 75;
      s.enemyW = 16;
      s.enemySpeed = 4.4 * speedMult;
    }

    this.player.w = s.playerW;
    this.player.h = s.playerH;
    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - s.playerH) / 2;

    this.enemy.w = s.enemyW;
    this.enemy.h = s.enemyH;
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = (CANVAS_HEIGHT - s.enemyH) / 2;

    this.serveRoguelikeBall(true);
  }

  serveRoguelikeBall(serveToPlayer = true) {
    const s = this.modeState;
    const angle = (Math.random() - 0.5) * 0.65;
    const speed = 5.6;
    const dir = serveToPlayer ? -1 : 1;
    s.balls = [{
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: dir * Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 10
    }];
  }

  rollRoguelikeUpgrades() {
    const s = this.modeState;
    const allPool = [
      { id: 'big_paddle', name: 'BIG PADDLE', desc: '+25PX LENGTH' },
      { id: 'speed_boost', name: 'OVERDRIVE', desc: '+30% SPEED' },
      { id: 'shield_barrier', name: 'SAFETY SHIELD', desc: 'ABSORBS 1 MISS' },
      { id: 'multiball', name: 'TWIN BALL', desc: 'EXTRA BALL ON HIT' },
      { id: 'repair_kit', name: 'REPAIR KIT', desc: '+1 MAX HP & +2 HEAL' },
      { id: 'laser_strike', name: 'LASER BEAM', desc: 'STUNS FOE ON HIT' },
      { id: 'crit_return', name: 'TURBO CRIT', desc: '+40% SPEED ON CORNERS' },
      { id: 'slow_field', name: 'CHRONO FIELD', desc: 'SLOWS BALL ON YOUR SIDE' }
    ];
    const filtered = allPool.filter(u => {
      if (u.id === 'shield_barrier' && s.hasShieldPerk) return false;
      if (u.id === 'multiball' && s.hasMultiball) return false;
      if (u.id === 'laser_strike' && s.hasLaserStrike) return false;
      if (u.id === 'crit_return' && s.hasCrit) return false;
      if (u.id === 'slow_field' && s.hasChrono) return false;
      return true;
    });
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  selectRoguelikeUpgrade(index) {
    const s = this.modeState;
    if (s.state !== 'UPGRADE') return;
    if (!s.offeredUpgrades || !s.offeredUpgrades[index]) return;

    const up = s.offeredUpgrades[index];
    s.upgrades.push(up.id);

    if (up.id === 'big_paddle') {
      s.playerH += 25;
      this.player.h = s.playerH;
    } else if (up.id === 'speed_boost') {
      s.playerSpeed *= 1.3;
    } else if (up.id === 'shield_barrier') {
      s.hasShieldPerk = true;
      s.playerShieldActive = true;
    } else if (up.id === 'multiball') {
      s.hasMultiball = true;
    } else if (up.id === 'repair_kit') {
      s.playerMaxHp++;
      s.playerHp = Math.min(s.playerMaxHp, s.playerHp + 2);
    } else if (up.id === 'laser_strike') {
      s.hasLaserStrike = true;
    } else if (up.id === 'crit_return') {
      s.hasCrit = true;
    } else if (up.id === 'slow_field') {
      s.hasChrono = true;
    }

    window.Sound?.play('score');
    this.startRoguelikeFloor(s.floor + 1);
  }

  handleRoguelikeClick(mx, my) {
    const s = this.modeState;
    if (s.state !== 'UPGRADE' || !s.offeredUpgrades || s.offeredUpgrades.length === 0) return;

    const cardW = 240;
    const cardH = 130;
    const gap = 20;
    const startX = (CANVAS_WIDTH - (3 * cardW + 2 * gap)) / 2;
    const cardY = (CANVAS_HEIGHT - 260) / 2 + 75;

    for (let i = 0; i < 3; i++) {
      const cx = startX + i * (cardW + gap);
      if (mx >= cx && mx <= cx + cardW && my >= cardY && my <= cardY + cardH) {
        this.selectRoguelikeUpgrade(i);
        return;
      }
    }
  }

  updateRoguelike(dt) {
    const s = this.modeState;

    if (s.shake > 0) {
      s.shake = Math.max(0, s.shake - dt * 25);
    }

    // Particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) s.particles.splice(i, 1);
    }

    if (s.state === 'UPGRADE') {
      return;
    }

    if (s.state === 'GOAL_PAUSE') {
      s.pauseTimer -= dt;
      if (s.pauseTimer <= 0) {
        if (s.enemyHp <= 0) {
          if (s.floor >= s.maxFloors) {
            this.showResult(true, 'ROGUELIKE RUN COMPLETE!');
            return;
          }
          // Heal 1 HP on clearing a floor!
          s.playerHp = Math.min(s.playerMaxHp, s.playerHp + 1);
          s.state = 'UPGRADE';
          s.offeredUpgrades = this.rollRoguelikeUpgrades();
          return;
        }
        if (s.playerHp <= 0) {
          this.showResult(false, `RUN FAILED ON FLOOR ${s.floor}`);
          return;
        }
        s.state = 'PLAYING';
        this.serveRoguelikeBall(true);
      }
      return;
    }

    // 1. Player Paddle Movement: KEYBOARD ONLY (W/S or Up/Down arrows)
    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * s.playerSpeed;
    this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));

    // 2. Opponent AI Movement with Fair Reaction Range & Deadzone
    const diffSetting = this.difficulty;
    const deadzone = diffSetting === 'easy' ? 22 : (diffSetting === 'hard' ? 7 : (diffSetting === 'impossible' ? 2 : 14));

    let activeBall = null;
    let closestDist = Infinity;
    for (const b of s.balls) {
      const d = b.vx > 0 ? (CANVAS_WIDTH - b.x) : (CANVAS_WIDTH + b.x);
      if (d < closestDist) {
        closestDist = d;
        activeBall = b;
      }
    }
    if (!activeBall && s.balls.length > 0) activeBall = s.balls[0];

    // Bot only tracks when ball is on opponent half (x >= 380) and approaching!
    const isBallApproaching = activeBall && activeBall.vx > 0 && activeBall.x >= 380;

    if (s.floor === 2) {
      // Twin Blades with fair center gap
      if (isBallApproaching) {
        const t1 = activeBall.y - s.twinH / 2;
        const diff1 = t1 - s.twinY1;
        if (Math.abs(diff1) > deadzone) {
          s.twinY1 += Math.sign(diff1) * Math.min(Math.abs(diff1), s.enemySpeed);
        }
        s.twinY1 = Math.max(38, Math.min(230, s.twinY1));

        const t2 = activeBall.y - s.twinH / 2;
        const diff2 = t2 - s.twinY2;
        if (Math.abs(diff2) > deadzone) {
          s.twinY2 += Math.sign(diff2) * Math.min(Math.abs(diff2), s.enemySpeed);
        }
        s.twinY2 = Math.max(270, Math.min(CANVAS_HEIGHT - 38 - s.twinH, s.twinY2));
      } else {
        // Return toward resting positions
        s.twinY1 += Math.sign(120 - s.twinY1) * Math.min(Math.abs(120 - s.twinY1), 1.5);
        s.twinY2 += Math.sign(360 - s.twinY2) * Math.min(Math.abs(360 - s.twinY2), 1.5);
      }
    } else {
      if (this.enemy.stunTimer && this.enemy.stunTimer > 0) {
        this.enemy.stunTimer -= dt;
      } else if (isBallApproaching) {
        let targetY = activeBall.y - this.enemy.h / 2;
        if (s.floor === 4) {
          s.shadowWarpTimer = (s.shadowWarpTimer || 0) + dt;
          if (s.shadowWarpTimer > 1.6 && activeBall.x > 450 && activeBall.x < 700) {
            s.shadowWarpTimer = 0;
            const warpDiff = targetY - this.enemy.y;
            this.enemy.y += Math.sign(warpDiff) * Math.min(Math.abs(warpDiff), 42);
            for (let k = 0; k < 6; k++) {
              s.particles.push({
                x: this.enemy.x + 6, y: this.enemy.y + this.enemy.h / 2,
                vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
                life: 0.25, maxLife: 0.25
              });
            }
          }
        }
        const diff = targetY - this.enemy.y;
        if (Math.abs(diff) > deadzone) {
          this.enemy.y += Math.sign(diff) * Math.min(Math.abs(diff), s.enemySpeed);
        }
        this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));
      } else {
        // Idle drift toward center
        const centerY = (CANVAS_HEIGHT - this.enemy.h) / 2;
        const diffCenter = centerY - this.enemy.y;
        if (Math.abs(diffCenter) > 10) {
          this.enemy.y += Math.sign(diffCenter) * Math.min(Math.abs(diffCenter), 1.2);
        }
      }
    }

    // 3. Player Laser Beams
    for (let i = s.lasers.length - 1; i >= 0; i--) {
      const laser = s.lasers[i];
      laser.x += 16;
      if (laser.x >= this.enemy.x && laser.x <= this.enemy.x + this.enemy.w &&
          laser.y >= this.enemy.y && laser.y <= this.enemy.y + this.enemy.h) {
        this.enemy.stunTimer = 0.6;
        window.Sound?.play('hit');
        for (let k = 0; k < 6; k++) {
          s.particles.push({
            x: laser.x, y: laser.y,
            vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
            life: 0.25, maxLife: 0.25
          });
        }
        s.lasers.splice(i, 1);
      } else if (laser.x > CANVAS_WIDTH) {
        s.lasers.splice(i, 1);
      }
    }

    // 4. Ball Physics & Sub-stepping
    const subSteps = 2;
    const dtSub = 1 / subSteps;
    for (let step = 0; step < subSteps; step++) {
      for (let i = s.balls.length - 1; i >= 0; i--) {
        const b = s.balls[i];
        const r = b.size / 2;
        const spdMult = (s.hasChrono && b.x < CANVAS_WIDTH / 2) ? 0.72 : 1.0;

        b.x += b.vx * dtSub * spdMult;
        b.y += b.vy * dtSub * spdMult;

        // Top / Bottom Rails
        if (b.y - r <= 38) {
          b.y = 38 + r;
          b.vy = Math.abs(b.vy);
          window.Sound?.play('wall');
        } else if (b.y + r >= CANVAS_HEIGHT - 38) {
          b.y = CANVAS_HEIGHT - 38 - r;
          b.vy = -Math.abs(b.vy);
          window.Sound?.play('wall');
        }

        // Floor 3 Energy Shield
        if (s.floor === 3 && s.shieldHp > 0) {
          if (b.x + r >= s.shieldX && b.x - r <= s.shieldX + 10 &&
              b.y + r >= s.shieldY && b.y - r <= s.shieldY + s.shieldH) {
            b.vx = -Math.abs(b.vx);
            s.shieldHp--;
            window.Sound?.play('wall');
            s.shake = 4;
            for (let k = 0; k < 8; k++) {
              s.particles.push({
                x: s.shieldX, y: b.y,
                vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                life: 0.3, maxLife: 0.3
              });
            }
          }
        }

        // Player Paddle Collision
        if (b.vx < 0 && b.x - r <= this.player.x + this.player.w &&
            b.x + r >= this.player.x &&
            b.y + r >= this.player.y && b.y - r <= this.player.y + this.player.h) {
          b.x = this.player.x + this.player.w + r;
          const offset = (b.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
          const angle = offset * 0.98;
          let curSpd = Math.hypot(b.vx, b.vy);
          if (s.hasCrit && Math.abs(offset) > 0.6) {
            curSpd = Math.min(14.5, curSpd * 1.38 + 0.5);
            s.shake = 4;
          } else {
            curSpd = Math.min(13.0, curSpd * 1.08 + 0.4);
          }
          b.vx = Math.abs(Math.cos(angle) * curSpd);
          b.vy = Math.sin(angle) * curSpd;
          window.Sound?.play('hit');

          if (s.hasMultiball && s.balls.length < 3) {
            s.balls.push({
              x: b.x, y: b.y,
              vx: b.vx, vy: -b.vy * 0.85,
              size: 10
            });
          }
          if (s.hasLaserStrike) {
            s.lasers.push({
              x: this.player.x + this.player.w + 6,
              y: this.player.y + this.player.h / 2
            });
          }
        }

        // Enemy Paddle Collision
        let enemyHit = false;
        if (s.floor === 2) {
          const ex = this.enemy.x;
          const ew = this.enemy.w;
          const eh = s.twinH;
          if (b.vx > 0 && b.x + r >= ex && b.x - r <= ex + ew &&
              b.y + r >= s.twinY1 && b.y - r <= s.twinY1 + eh) {
            b.x = ex - r;
            const offset = (b.y - (s.twinY1 + eh / 2)) / (eh / 2);
            const angle = offset * 0.92;
            const curSpd = Math.hypot(b.vx, b.vy) * 1.04;
            b.vx = -Math.abs(Math.cos(angle) * curSpd);
            b.vy = Math.sin(angle) * curSpd;
            enemyHit = true;
          } else if (b.vx > 0 && b.x + r >= ex && b.x - r <= ex + ew &&
                     b.y + r >= s.twinY2 && b.y - r <= s.twinY2 + eh) {
            b.x = ex - r;
            const offset = (b.y - (s.twinY2 + eh / 2)) / (eh / 2);
            const angle = offset * 0.92;
            const curSpd = Math.hypot(b.vx, b.vy) * 1.04;
            b.vx = -Math.abs(Math.cos(angle) * curSpd);
            b.vy = Math.sin(angle) * curSpd;
            enemyHit = true;
          }
        } else {
          if (b.vx > 0 && b.x + r >= this.enemy.x && b.x - r <= this.enemy.x + this.enemy.w &&
              b.y + r >= this.enemy.y && b.y - r <= this.enemy.y + this.enemy.h) {
            b.x = this.enemy.x - r;
            const offset = (b.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
            const angle = offset * 0.92;
            const curSpd = Math.hypot(b.vx, b.vy) * (s.floor === 5 ? 1.12 : 1.04);
            b.vx = -Math.abs(Math.cos(angle) * curSpd);
            b.vy = Math.sin(angle) * curSpd;
            enemyHit = true;
          }
        }
        if (enemyHit) {
          window.Sound?.play('hit');
        }

        // Goal Past Opponent (Score for Player - every ball scored damages enemy!)
        if (b.x - r >= CANVAS_WIDTH) {
          s.balls.splice(i, 1);
          s.enemyHp--;
          window.Sound?.play('score');
          s.shake = 6;
          for (let k = 0; k < 8; k++) {
            s.particles.push({
              x: CANVAS_WIDTH - 12, y: b.y,
              vx: -(Math.random() * 4 + 1), vy: (Math.random() - 0.5) * 6,
              life: 0.35, maxLife: 0.35
            });
          }
          if (s.enemyHp <= 0 || s.balls.length === 0) {
            s.state = 'GOAL_PAUSE';
            s.pauseTimer = 0.6;
            break;
          }
        }
        // Goal Past Player (Loss for Player)
        else if (b.x + r <= 0) {
          if (s.playerShieldActive) {
            s.playerShieldActive = false;
            b.x = 22;
            b.vx = Math.abs(b.vx);
            window.Sound?.play('wall');
            s.shake = 5;
            for (let k = 0; k < 10; k++) {
              s.particles.push({
                x: 16, y: b.y,
                vx: (Math.random() * 4) + 1, vy: (Math.random() - 0.5) * 6,
                life: 0.35, maxLife: 0.35
              });
            }
          } else {
            s.balls.splice(i, 1);
            s.playerHp--;
            window.Sound?.play('wall');
            s.shake = 8;
            for (let k = 0; k < 10; k++) {
              s.particles.push({
                x: 16, y: b.y,
                vx: (Math.random() * 4) + 1, vy: (Math.random() - 0.5) * 6,
                life: 0.35, maxLife: 0.35
              });
            }
            if (s.playerHp <= 0 || s.balls.length === 0) {
              s.state = 'GOAL_PAUSE';
              s.pauseTimer = 0.6;
              break;
            }
          }
        }
      }
    }
  }

  renderRoguelike(ctx, colWhite, colBlack) {
    const s = this.modeState;

    if (s.shake > 0) {
      ctx.save();
      const ox = (Math.random() - 0.5) * s.shake;
      const oy = (Math.random() - 0.5) * s.shake;
      ctx.translate(ox, oy);
    }

    // 1. Top & Bottom Rails
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // 2. Center Net
    for (let y = 44; y < CANVAS_HEIGHT - 38; y += 26) {
      ctx.fillRect(CANVAS_WIDTH / 2 - 2, y, 4, 14);
    }

    // 3. Chrono Field Zone (if active)
    if (s.hasChrono) {
      ctx.save();
      ctx.strokeStyle = '#333333';
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2 - 1, 38);
      ctx.lineTo(CANVAS_WIDTH / 2 - 1, CANVAS_HEIGHT - 38);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Safety Shield Barrier (if active)
    if (s.playerShieldActive) {
      ctx.save();
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(18, 38);
      ctx.lineTo(18, CANVAS_HEIGHT - 38);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Floor 3 Energy Shield Barrier
    if (s.floor === 3 && s.shieldHp > 0) {
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 2;
      ctx.strokeRect(s.shieldX, s.shieldY, 10, s.shieldH);
      if (s.shieldHp === 1) {
        ctx.beginPath();
        ctx.moveTo(s.shieldX, s.shieldY);
        ctx.lineTo(s.shieldX + 10, s.shieldY + s.shieldH);
        ctx.stroke();
      }
    }

    // 6. HUD Bar (Clean 1-Bit Retro Text)
    ctx.font = '12px "Press Start 2P"';
    ctx.fillStyle = colWhite;

    // Player HP Blocks
    let hpStr = 'HP: ';
    for (let i = 0; i < s.playerMaxHp; i++) {
      hpStr += (i < s.playerHp) ? '[#] ' : '[ ] ';
    }
    ctx.textAlign = 'left';
    ctx.fillText(hpStr, 30, 24);

    // Center Floor
    ctx.textAlign = 'center';
    ctx.fillText(`FLOOR ${s.floor}/5 - ${s.floorTitle}`, CANVAS_WIDTH / 2, 24);

    // Opponent HP Blocks
    let foeStr = 'FOE: ';
    for (let i = 0; i < s.enemyMaxHp; i++) {
      foeStr += (i < s.enemyHp) ? '[#] ' : '[ ] ';
    }
    ctx.textAlign = 'right';
    ctx.fillText(foeStr, CANVAS_WIDTH - 30, 24);

    // 7. Player Paddle
    ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);

    // 8. Opponent Paddle(s)
    if (s.floor === 2) {
      ctx.fillRect(Math.round(this.enemy.x), Math.round(s.twinY1), this.enemy.w, s.twinH);
      ctx.fillRect(Math.round(this.enemy.x), Math.round(s.twinY2), this.enemy.w, s.twinH);
    } else {
      ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);
      if (this.enemy.stunTimer && this.enemy.stunTimer > 0) {
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('*STUN*', this.enemy.x + this.enemy.w / 2, this.enemy.y - 6);
      }
    }

    // 9. Ball(s)
    for (const b of s.balls) {
      ctx.fillRect(Math.round(b.x - b.size / 2), Math.round(b.y - b.size / 2), b.size, b.size);
    }

    // 10. Lasers
    ctx.lineWidth = 3;
    ctx.strokeStyle = colWhite;
    for (const laser of s.lasers) {
      ctx.beginPath();
      ctx.moveTo(laser.x, laser.y);
      ctx.lineTo(laser.x + 14, laser.y);
      ctx.stroke();
    }

    // 11. Particles
    for (const p of s.particles) {
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }

    // 12. Upgrade Choice Overlay
    if (s.state === 'UPGRADE' && s.offeredUpgrades && s.offeredUpgrades.length === 3) {
      ctx.save();
      const modalW = 820;
      const modalH = 260;
      const mx = (CANVAS_WIDTH - modalW) / 2;
      const my = (CANVAS_HEIGHT - modalH) / 2;

      ctx.fillStyle = colBlack;
      ctx.fillRect(mx, my, modalW, modalH);
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 3;
      ctx.strokeRect(mx, my, modalW, modalH);
      ctx.strokeRect(mx + 4, my + 4, modalW - 8, modalH - 8);

      ctx.font = '16px "Press Start 2P"';
      ctx.fillStyle = colWhite;
      ctx.textAlign = 'center';
      ctx.fillText(`FLOOR ${s.floor} CLEARED! CHOOSE AN UPGRADE`, CANVAS_WIDTH / 2, my + 42);

      const cardW = 240;
      const cardH = 130;
      const gap = 20;
      const startX = (CANVAS_WIDTH - (3 * cardW + 2 * gap)) / 2;
      const cardY = my + 75;

      for (let i = 0; i < 3; i++) {
        const up = s.offeredUpgrades[i];
        const cx = startX + i * (cardW + gap);
        const isHovered = (this.mouseX >= cx && this.mouseX <= cx + cardW &&
                           this.mouseY >= cardY && this.mouseY <= cardY + cardH);

        ctx.fillStyle = isHovered ? '#1a1a1a' : colBlack;
        ctx.fillRect(cx, cardY, cardW, cardH);
        ctx.strokeStyle = colWhite;
        ctx.lineWidth = isHovered ? 3 : 1.5;
        ctx.strokeRect(cx, cardY, cardW, cardH);

        ctx.font = '12px "Press Start 2P"';
        ctx.fillStyle = colWhite;
        ctx.textAlign = 'center';
        ctx.fillText(`[${i + 1}] ${up.name}`, cx + cardW / 2, cardY + 38);

        ctx.font = '8px "Press Start 2P"';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(up.desc, cx + cardW / 2, cardY + 80);
      }
      ctx.restore();
    }

    if (s.shake > 0) {
      ctx.restore();
    }
  }


  // ========================================================
  // SUPERHOT PONG (Level 53)
  // "Time moves only when you move!"
  // ========================================================
  initSuperhot(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.w = 12;
    this.player.h = 70;
    this.enemy.w = 12;
    this.enemy.h = 70;

    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - this.player.h) / 2;
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = (CANVAS_HEIGHT - this.enemy.h) / 2;

    this.modeState = {
      timeScale: 1.0,
      targetTimeScale: 1.0,
      prevPlayerY: this.player.y,
      playerMoveDist: 0,
      smashCooldown: 0,
      afterImages: [],
      particles: [],
      shake: 0,
      serveTimer: 0.5
    };

    this.resetSuperhotBall(true);
  }

  resetSuperhotBall(serveToPlayer = true) {
    this.ball.x = CANVAS_WIDTH / 2;
    this.ball.y = CANVAS_HEIGHT / 2;
    this.ball.size = 10;
    const angle = (Math.random() - 0.5) * 0.7;
    const speed = 12.0; // Faster high-speed ball
    const dir = serveToPlayer ? -1 : 1;
    this.ball.vx = dir * Math.cos(angle) * speed;
    this.ball.vy = Math.sin(angle) * speed;
    if (this.modeState) {
      this.modeState.serveTimer = 0.4;
    }
  }

  updateSuperhot(dt) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 25);
    if (s.smashCooldown > 0) s.smashCooldown -= dt;

    // Particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) s.particles.splice(i, 1);
    }

    // 1. Player Paddle Movement: KEYBOARD ONLY (W/S or Up/Down arrows)
    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;

    if (dir !== 0) {
      this.player.y += dir * 10.5;
      s.targetTimeScale = 1.0;
    } else {
      s.targetTimeScale = 0.04;
    }
    this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));

    // Smooth exponential time dilation
    s.timeScale += (s.targetTimeScale - s.timeScale) * Math.min(1, 28 * dt);

    if (s.serveTimer > 0) {
      s.serveTimer -= dt * s.timeScale;
      return;
    }

    // Record motion blur after-images when moving fast
    if (s.timeScale > 0.65) {
      s.afterImages.push({
        px: this.player.x, py: this.player.y, pw: this.player.w, ph: this.player.h,
        bx: b.x, by: b.y, bsize: b.size,
        life: 0.18, maxLife: 0.18
      });
      if (s.afterImages.length > 8) s.afterImages.shift();
    }
    for (let i = s.afterImages.length - 1; i >= 0; i--) {
      s.afterImages[i].life -= dt;
      if (s.afterImages[i].life <= 0) s.afterImages.splice(i, 1);
    }

    // 2. Opponent AI Movement (Scaled strictly by timeScale!)
    const diffSetting = this.difficulty;
    let aiSpeed = 4.8;
    let deadzone = 8;
    if (diffSetting === 'easy') { aiSpeed = 3.5; deadzone = 16; }
    else if (diffSetting === 'hard') { aiSpeed = 5.8; deadzone = 5; }
    else if (diffSetting === 'impossible') { aiSpeed = 7.2; deadzone = 2; }

    const targetEnemyY = b.y - this.enemy.h / 2;
    const enemyDiff = targetEnemyY - this.enemy.y;
    if (Math.abs(enemyDiff) > deadzone && b.vx > 0) {
      this.enemy.y += Math.sign(enemyDiff) * Math.min(Math.abs(enemyDiff), aiSpeed * s.timeScale);
      this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));
    }

    // 3. Sub-stepping Ball Physics (Scaled strictly by timeScale!)
    const subSteps = 2;
    const dtSub = 1 / subSteps;
    const r = b.size / 2;

    for (let step = 0; step < subSteps; step++) {
      b.x += b.vx * dtSub * s.timeScale;
      b.y += b.vy * dtSub * s.timeScale;

      // Top / Bottom wall bounce
      if (b.y - r <= 38) {
        b.y = 38 + r;
        b.vy = Math.abs(b.vy);
        window.Sound?.play('wall');
      } else if (b.y + r >= CANVAS_HEIGHT - 38) {
        b.y = CANVAS_HEIGHT - 38 - r;
        b.vy = -Math.abs(b.vy);
        window.Sound?.play('wall');
      }

      // Player Paddle Collision
      if (b.vx < 0 && b.x - r <= this.player.x + this.player.w &&
          b.x + r >= this.player.x &&
          b.y + r >= this.player.y && b.y - r <= this.player.y + this.player.h) {
        b.x = this.player.x + this.player.w + r;
        const offset = (b.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
        const angle = offset * 0.95;

        let curSpd = Math.hypot(b.vx, b.vy);
        // Kinetic smash boost if player struck while moving
        if (dir !== 0) {
          curSpd = Math.min(22.0, curSpd * 1.35 + 2.0);
          s.shake = 6;
          for (let k = 0; k < 12; k++) {
            s.particles.push({
              x: b.x, y: b.y,
              vx: (Math.random() * 8) + 3, vy: (Math.random() - 0.5) * 8,
              life: 0.35, maxLife: 0.35
            });
          }
        } else {
          curSpd = Math.min(16.0, curSpd * 1.08 + 0.8);
        }

        b.vx = Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      // Enemy Paddle Collision
      if (b.vx > 0 && b.x + r >= this.enemy.x && b.x - r <= this.enemy.x + this.enemy.w &&
          b.y + r >= this.enemy.y && b.y - r <= this.enemy.y + this.enemy.h) {
        b.x = this.enemy.x - r;
        const offset = (b.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
        const angle = offset * 0.95;
        const curSpd = Math.min(18.0, Math.hypot(b.vx, b.vy) * 1.05);
        b.vx = -Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      // Goal detection
      if (b.x >= CANVAS_WIDTH) {
        this.player.score++;
        window.Sound?.play('score');
        if (this.player.score >= 5) {
          this.showResult(true, 'SUPERHOT MASTER!');
          return;
        }
        this.resetSuperhotBall(false);
        break;
      } else if (b.x <= 0) {
        this.enemy.score++;
        window.Sound?.play('wall');
        if (this.enemy.score >= 5) {
          this.showResult(false, 'SUPERHOT DEFEAT');
          return;
        }
        this.resetSuperhotBall(true);
        break;
      }
    }
  }

  renderSuperhot(ctx, colWhite, colBlack) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) {
      ctx.save();
      const ox = (Math.random() - 0.5) * s.shake;
      const oy = (Math.random() - 0.5) * s.shake;
      ctx.translate(ox, oy);
    }

    // 1. Court Rails
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // 2. Dashed Net
    for (let y = 44; y < CANVAS_HEIGHT - 38; y += 26) {
      ctx.fillRect(CANVAS_WIDTH / 2 - 2, y, 4, 14);
    }

    // 3. Scoreboard (Clean retro top display)
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, CANVAS_WIDTH / 2 - 80, 80);
    ctx.fillText(`${this.enemy.score}`, CANVAS_WIDTH / 2 + 80, 80);

    // 4. Trajectory Echo Pips when Time is Frozen
    if (s.timeScale < 0.22 && s.serveTimer <= 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let step = 1; step <= 5; step++) {
        const predX = b.x + b.vx * step * 4;
        let predY = b.y + b.vy * step * 4;
        if (predY < 42 || predY > CANVAS_HEIGHT - 42) {
          predY = (predY < 42) ? 84 - predY : 2 * (CANVAS_HEIGHT - 42) - predY;
        }
        ctx.fillRect(Math.round(predX - 2), Math.round(predY - 2), 4, 4);
      }
      ctx.restore();
    }

    // 5. High-speed Motion Blur After-Images
    for (const img of s.afterImages) {
      const alpha = (img.life / img.maxLife) * 0.35;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(Math.round(img.px), Math.round(img.py), img.pw, img.ph);
      ctx.fillRect(Math.round(img.bx - img.bsize / 2), Math.round(img.by - img.bsize / 2), img.bsize, img.bsize);
    }

    // 6. Particles
    ctx.fillStyle = colWhite;
    for (const p of s.particles) {
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }

    // 7. Paddles
    ctx.fillStyle = colWhite;
    ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
    ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);

    // 8. Ball
    ctx.fillRect(Math.round(b.x - b.size / 2), Math.round(b.y - b.size / 2), b.size, b.size);

    if (s.shake > 0) {
      ctx.restore();
    }
  }


  // ========================================================
  // PORTAL PONG (Level 54)
  // "Quantum wormholes bridge the court!"
  // ========================================================
  initPortal(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.w = 12;
    this.player.h = 72;
    this.enemy.w = 12;
    this.enemy.h = 72;

    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - this.player.h) / 2;
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = (CANVAS_HEIGHT - this.enemy.h) / 2;

    this.modeState = {
      time: 0,
      portalA: { x: 290, y: 270, w: 20, h: 64, cooldown: 0 },
      portalB: { x: 670, y: 270, w: 20, h: 64, cooldown: 0 },
      warpRipples: [],
      particles: [],
      shake: 0,
      serveTimer: 0.5
    };

    this.resetPortalBall(true);
  }

  resetPortalBall(serveToPlayer = true) {
    this.ball.x = CANVAS_WIDTH / 2;
    this.ball.y = CANVAS_HEIGHT / 2;
    this.ball.size = 10;
    const angle = (Math.random() - 0.5) * 0.65;
    const speed = 7.5;
    const dir = serveToPlayer ? -1 : 1;
    this.ball.vx = dir * Math.cos(angle) * speed;
    this.ball.vy = Math.sin(angle) * speed;
    if (this.modeState) {
      this.modeState.serveTimer = 0.5;
      this.modeState.portalA.cooldown = 0;
      this.modeState.portalB.cooldown = 0;
    }
  }

  updatePortal(dt) {
    const s = this.modeState;
    const b = this.ball;

    s.time += dt;
    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 25);
    if (s.portalA.cooldown > 0) s.portalA.cooldown -= dt;
    if (s.portalB.cooldown > 0) s.portalB.cooldown -= dt;

    // Drifting portal positions
    s.portalA.y = 270 + Math.sin(s.time * 1.3) * 125;
    s.portalB.y = 270 - Math.cos(s.time * 1.3) * 125;

    // Warp ripple animations
    for (let i = s.warpRipples.length - 1; i >= 0; i--) {
      const rip = s.warpRipples[i];
      rip.radius += dt * 70;
      rip.life -= dt;
      if (rip.life <= 0) s.warpRipples.splice(i, 1);
    }

    // Particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) s.particles.splice(i, 1);
    }

    // 1. Player Paddle Movement: KEYBOARD ONLY (W/S or Up/Down arrows)
    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * 8.5;
    this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));

    if (s.serveTimer > 0) {
      s.serveTimer -= dt;
      return;
    }

    // 2. Enemy AI Movement
    const diff = this.difficulty;
    let aiSpeed = 4.2;
    let deadzone = 12;
    if (diff === 'easy') { aiSpeed = 3.2; deadzone = 18; }
    else if (diff === 'hard') { aiSpeed = 5.2; deadzone = 6; }
    else if (diff === 'impossible') { aiSpeed = 6.6; deadzone = 2; }

    const isBallHeadingToEnemy = b.vx > 0;
    if (isBallHeadingToEnemy) {
      const targetEnemyY = b.y - this.enemy.h / 2;
      const enemyDiff = targetEnemyY - this.enemy.y;
      if (Math.abs(enemyDiff) > deadzone) {
        this.enemy.y += Math.sign(enemyDiff) * Math.min(Math.abs(enemyDiff), aiSpeed);
      }
    } else {
      // Idle toward center
      const centerDiff = (CANVAS_HEIGHT - this.enemy.h) / 2 - this.enemy.y;
      if (Math.abs(centerDiff) > 10) {
        this.enemy.y += Math.sign(centerDiff) * Math.min(Math.abs(centerDiff), 1.2);
      }
    }
    this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));

    // 3. Sub-stepping Ball Physics & Portal Teleportation
    const subSteps = 2;
    const dtSub = 1 / subSteps;
    const r = b.size / 2;

    for (let step = 0; step < subSteps; step++) {
      b.x += b.vx * dtSub;
      b.y += b.vy * dtSub;

      // Top / Bottom rail bounce
      if (b.y - r <= 38) {
        b.y = 38 + r;
        b.vy = Math.abs(b.vy);
        window.Sound?.play('wall');
      } else if (b.y + r >= CANVAS_HEIGHT - 38) {
        b.y = CANVAS_HEIGHT - 38 - r;
        b.vy = -Math.abs(b.vy);
        window.Sound?.play('wall');
      }

      // Portal A Teleportation Check (Inbound -> Outbound to Portal B)
      const pa = s.portalA;
      const pb = s.portalB;
      if (s.portalA.cooldown <= 0 &&
          b.x + r >= pa.x - pa.w / 2 && b.x - r <= pa.x + pa.w / 2 &&
          b.y + r >= pa.y - pa.h / 2 && b.y - r <= pa.y + pa.h / 2) {
        // Warp from A to B!
        b.x = (b.vx >= 0) ? (pb.x + pb.w / 2 + r + 4) : (pb.x - pb.w / 2 - r - 4);
        b.y = pb.y + (b.y - pa.y);
        b.y = Math.max(45, Math.min(CANVAS_HEIGHT - 45, b.y));

        s.portalA.cooldown = 0.35;
        s.portalB.cooldown = 0.35;
        s.shake = 4;
        window.Sound?.play('portal');

        s.warpRipples.push({ x: pa.x, y: pa.y, radius: 10, life: 0.3 });
        s.warpRipples.push({ x: pb.x, y: pb.y, radius: 10, life: 0.3 });

        for (let k = 0; k < 10; k++) {
          s.particles.push({
            x: pb.x, y: pb.y,
            vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
            life: 0.3, maxLife: 0.3
          });
        }
      }
      // Portal B Teleportation Check (Inbound -> Outbound to Portal A)
      else if (s.portalB.cooldown <= 0 &&
               b.x + r >= pb.x - pb.w / 2 && b.x - r <= pb.x + pb.w / 2 &&
               b.y + r >= pb.y - pb.h / 2 && b.y - r <= pb.y + pb.h / 2) {
        // Warp from B to A!
        b.x = (b.vx >= 0) ? (pa.x + pa.w / 2 + r + 4) : (pa.x - pa.w / 2 - r - 4);
        b.y = pa.y + (b.y - pb.y);
        b.y = Math.max(45, Math.min(CANVAS_HEIGHT - 45, b.y));

        s.portalA.cooldown = 0.35;
        s.portalB.cooldown = 0.35;
        s.shake = 4;
        window.Sound?.play('portal');

        s.warpRipples.push({ x: pb.x, y: pb.y, radius: 10, life: 0.3 });
        s.warpRipples.push({ x: pa.x, y: pa.y, radius: 10, life: 0.3 });

        for (let k = 0; k < 10; k++) {
          s.particles.push({
            x: pa.x, y: pa.y,
            vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
            life: 0.3, maxLife: 0.3
          });
        }
      }

      // Player Paddle Collision
      if (b.vx < 0 && b.x - r <= this.player.x + this.player.w &&
          b.x + r >= this.player.x &&
          b.y + r >= this.player.y && b.y - r <= this.player.y + this.player.h) {
        b.x = this.player.x + this.player.w + r;
        const offset = (b.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
        const angle = offset * 0.92;
        let curSpd = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      // Enemy Paddle Collision
      if (b.vx > 0 && b.x + r >= this.enemy.x && b.x - r <= this.enemy.x + this.enemy.w &&
          b.y + r >= this.enemy.y && b.y - r <= this.enemy.y + this.enemy.h) {
        b.x = this.enemy.x - r;
        const offset = (b.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
        const angle = offset * 0.92;
        let curSpd = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = -Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      // Goal Past Opponent
      if (b.x >= CANVAS_WIDTH) {
        this.player.score++;
        window.Sound?.play('score');
        if (this.player.score >= 5) {
          this.showResult(true, 'PORTAL MASTER!');
          return;
        }
        this.resetPortalBall(false);
        break;
      } else if (b.x <= 0) {
        this.enemy.score++;
        window.Sound?.play('wall');
        if (this.enemy.score >= 5) {
          this.showResult(false, 'PORTAL DEFEAT');
          return;
        }
        this.resetPortalBall(true);
        break;
      }
    }
  }

  renderPortal(ctx, colWhite, colBlack) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) {
      ctx.save();
      const ox = (Math.random() - 0.5) * s.shake;
      const oy = (Math.random() - 0.5) * s.shake;
      ctx.translate(ox, oy);
    }

    // 1. Rails
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // 2. Center Net
    for (let y = 44; y < CANVAS_HEIGHT - 38; y += 26) {
      ctx.fillRect(CANVAS_WIDTH / 2 - 2, y, 4, 14);
    }

    // 3. Scoreboard
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, 240, 80);
    ctx.fillText(`${this.enemy.score}`, 720, 80);

    // 4. Warp Ripples
    ctx.save();
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 1.5;
    for (const rip of s.warpRipples) {
      ctx.beginPath();
      ctx.ellipse(rip.x, rip.y, rip.radius * 0.45, rip.radius, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 5. Portals (Clean 1-Bit Geometric Wormholes)
    const pa = s.portalA;
    ctx.save();
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(pa.x, pa.y, pa.w / 2, pa.h / 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.ellipse(pa.x, pa.y, (pa.w / 2) - 4, (pa.h / 2) - 8, 0, 0, Math.PI * 2);
    ctx.stroke();

    const pb = s.portalB;
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(pb.x, pb.y, pb.w / 2, pb.h / 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.ellipse(pb.x, pb.y, (pb.w / 2) - 4, (pb.h / 2) - 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 6. Particles
    ctx.fillStyle = colWhite;
    for (const p of s.particles) {
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }

    // 7. Paddles
    ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
    ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);

    // 8. Ball
    ctx.fillRect(Math.round(b.x - b.size / 2), Math.round(b.y - b.size / 2), b.size, b.size);

    if (s.shake > 0) {
      ctx.restore();
    }
  }


  // ========================================================
  // TETRIS PONG (Level 55)
  // "Tetrominoes drop down the center net in real-time!"
  // ========================================================
  initTetris(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.w = 12;
    this.player.h = 72;
    this.enemy.w = 12;
    this.enemy.h = 72;

    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - this.player.h) / 2;
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = (CANVAS_HEIGHT - this.enemy.h) / 2;

    const grid = [];
    for (let r = 0; r < 24; r++) {
      grid.push(new Array(6).fill(0));
    }

    this.modeState = {
      grid: grid,
      dropTimer: 1.0,
      dropInterval: 2.8,
      fallingPiece: null,
      particles: [],
      shake: 0,
      serveTimer: 0.5
    };

    this.spawnTetromino();
    this.resetTetrisBall(true);
  }

  resetTetrisBall(serveToPlayer = true) {
    this.ball.x = CANVAS_WIDTH / 2;
    this.ball.y = CANVAS_HEIGHT / 2;
    this.ball.size = 10;
    const angle = (Math.random() - 0.5) * 0.65;
    const speed = 7.5;
    const dir = serveToPlayer ? -1 : 1;
    this.ball.vx = dir * Math.cos(angle) * speed;
    this.ball.vy = Math.sin(angle) * speed;
    if (this.modeState) {
      this.modeState.serveTimer = 0.5;
    }
  }

  spawnTetromino() {
    const s = this.modeState;
    const shapes = [
      [[0,0], [1,0], [0,1], [1,1]],
      [[0,0], [1,0], [2,0], [3,0]],
      [[1,0], [0,1], [1,1], [2,1]],
      [[0,0], [0,1], [1,1], [2,1]],
      [[2,0], [0,1], [1,1], [2,1]],
      [[1,0], [2,0], [0,1], [1,1]],
      [[0,0], [1,0], [1,1], [2,1]]
    ];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    s.fallingPiece = {
      shape: shape,
      col: Math.floor(Math.random() * 3),
      rowFloat: 0
    };
  }

  updateTetris(dt) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 25);

    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) s.particles.splice(i, 1);
    }

    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * 8.5;
    this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));

    const diff = this.difficulty;
    let aiSpeed = 4.2;
    let deadzone = 12;
    if (diff === 'easy') { aiSpeed = 3.2; deadzone = 18; }
    else if (diff === 'hard') { aiSpeed = 5.2; deadzone = 6; }
    else if (diff === 'impossible') { aiSpeed = 6.6; deadzone = 2; }

    const isHeadingToEnemy = b.vx > 0;
    if (isHeadingToEnemy) {
      const targetEnemyY = b.y - this.enemy.h / 2;
      const enemyDiff = targetEnemyY - this.enemy.y;
      if (Math.abs(enemyDiff) > deadzone) {
        this.enemy.y += Math.sign(enemyDiff) * Math.min(Math.abs(enemyDiff), aiSpeed);
      }
    } else {
      const centerDiff = (CANVAS_HEIGHT - this.enemy.h) / 2 - this.enemy.y;
      if (Math.abs(centerDiff) > 10) {
        this.enemy.y += Math.sign(centerDiff) * Math.min(Math.abs(centerDiff), 1.2);
      }
    }
    this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));

    if (s.fallingPiece) {
      s.fallingPiece.rowFloat += dt * 2.8;
      const currentRow = Math.floor(s.fallingPiece.rowFloat);

      let shouldLock = false;
      for (const [dc, dr] of s.fallingPiece.shape) {
        const c = s.fallingPiece.col + dc;
        const r = currentRow + dr;
        if (r >= 23 || (r + 1 < 24 && s.grid[r + 1][c] === 1)) {
          shouldLock = true;
          break;
        }
      }

      if (shouldLock) {
        for (const [dc, dr] of s.fallingPiece.shape) {
          const c = s.fallingPiece.col + dc;
          const r = Math.min(23, currentRow + dr);
          if (r >= 0 && r < 24 && c >= 0 && c < 6) {
            s.grid[r][c] = 1;
          }
        }
        s.fallingPiece = null;
        window.Sound?.play('wall');

        for (let r = 23; r >= 0; r--) {
          if (s.grid[r].every(val => val === 1)) {
            s.grid.splice(r, 1);
            s.grid.unshift(new Array(6).fill(0));
            s.shake = 6;
            window.Sound?.play('score');
            r++;
          }
        }
      }
    } else {
      s.dropTimer -= dt;
      if (s.dropTimer <= 0) {
        s.dropTimer = s.dropInterval;
        this.spawnTetromino();
      }
    }

    if (s.serveTimer > 0) {
      s.serveTimer -= dt;
      return;
    }

    const subSteps = 2;
    const dtSub = 1 / subSteps;
    const r = b.size / 2;

    for (let step = 0; step < subSteps; step++) {
      b.x += b.vx * dtSub;
      b.y += b.vy * dtSub;

      if (b.y - r <= 38) {
        b.y = 38 + r;
        b.vy = Math.abs(b.vy);
        window.Sound?.play('wall');
      } else if (b.y + r >= CANVAS_HEIGHT - 38) {
        b.y = CANVAS_HEIGHT - 38 - r;
        b.vy = -Math.abs(b.vy);
        window.Sound?.play('wall');
      }

      if (b.x + r >= 426 && b.x - r <= 534 && b.y + r >= 38 && b.y - r <= 470) {
        const col = Math.floor((b.x - 426) / 18);
        const row = Math.floor((b.y - 38) / 18);

        if (row >= 0 && row < 24 && col >= 0 && col < 6 && s.grid[row][col] === 1) {
          s.grid[row][col] = 0;
          b.vx = -b.vx;
          window.Sound?.play('brick');
          s.shake = 3;

          for (let k = 0; k < 6; k++) {
            s.particles.push({
              x: 426 + col * 18 + 9,
              y: 38 + row * 18 + 9,
              vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
              life: 0.25, maxLife: 0.25
            });
          }
        }
      }

      if (b.vx < 0 && b.x - r <= this.player.x + this.player.w &&
          b.x + r >= this.player.x &&
          b.y + r >= this.player.y && b.y - r <= this.player.y + this.player.h) {
        b.x = this.player.x + this.player.w + r;
        const offset = (b.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
        const angle = offset * 0.92;
        let curSpd = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      if (b.vx > 0 && b.x + r >= this.enemy.x && b.x - r <= this.enemy.x + this.enemy.w &&
          b.y + r >= this.enemy.y && b.y - r <= this.enemy.y + this.enemy.h) {
        b.x = this.enemy.x - r;
        const offset = (b.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
        const angle = offset * 0.92;
        let curSpd = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = -Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      if (b.x >= CANVAS_WIDTH) {
        this.player.score++;
        window.Sound?.play('score');
        if (this.player.score >= 5) {
          this.showResult(true, 'TETRIS MASTER!');
          return;
        }
        this.resetTetrisBall(false);
        break;
      } else if (b.x <= 0) {
        this.enemy.score++;
        window.Sound?.play('wall');
        if (this.enemy.score >= 5) {
          this.showResult(false, 'BLOCK OUT!');
          return;
        }
        this.resetTetrisBall(true);
        break;
      }
    }
  }

  renderTetris(ctx, colWhite, colBlack) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) {
      ctx.save();
      const ox = (Math.random() - 0.5) * s.shake;
      const oy = (Math.random() - 0.5) * s.shake;
      ctx.translate(ox, oy);
    }

    // 1. Rails
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // 2. Center Net Boundary
    ctx.save();
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    ctx.strokeRect(426, 38, 108, 432);
    ctx.restore();

    // 3. Scoreboard
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, 240, 80);
    ctx.fillText(`${this.enemy.score}`, 720, 80);

    // 4. Grid Blocks
    ctx.fillStyle = colWhite;
    for (let r = 0; r < 24; r++) {
      for (let c = 0; c < 6; c++) {
        if (s.grid[r][c] === 1) {
          const bx = 426 + c * 18;
          const by = 38 + r * 18;
          ctx.fillRect(bx + 1, by + 1, 16, 16);
          ctx.fillStyle = colBlack;
          ctx.fillRect(bx + 4, by + 4, 10, 10);
          ctx.fillStyle = colWhite;
          ctx.fillRect(bx + 7, by + 7, 4, 4);
        }
      }
    }

    // 5. Active Falling Piece
    if (s.fallingPiece) {
      const currentRow = Math.floor(s.fallingPiece.rowFloat);
      for (const [dc, dr] of s.fallingPiece.shape) {
        const c = s.fallingPiece.col + dc;
        const r = currentRow + dr;
        if (r >= 0 && r < 24 && c >= 0 && c < 6) {
          const bx = 426 + c * 18;
          const by = 38 + r * 18;
          ctx.fillRect(bx + 1, by + 1, 16, 16);
          ctx.fillStyle = colBlack;
          ctx.fillRect(bx + 4, by + 4, 10, 10);
          ctx.fillStyle = colWhite;
          ctx.fillRect(bx + 7, by + 7, 4, 4);
        }
      }
    }

    // 6. Particles
    ctx.fillStyle = colWhite;
    for (const p of s.particles) {
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }

    // 7. Paddles
    ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
    ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);

    // 8. Ball
    ctx.fillRect(Math.round(b.x - b.size / 2), Math.round(b.y - b.size / 2), b.size, b.size);

    if (s.shake > 0) {
      ctx.restore();
    }
  }


  // ========================================================
  // SINGULARITY PONG (Level 56)
  // "A gravitational black hole warps the center court!"
  // ========================================================
  initSingularity(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.w = 12;
    this.player.h = 72;
    this.enemy.w = 12;
    this.enemy.h = 72;

    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - this.player.h) / 2;
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = (CANVAS_HEIGHT - this.enemy.h) / 2;

    const dust = [];
    for (let i = 0; i < 16; i++) {
      dust.push({
        radius: 28 + Math.random() * 42,
        angle: Math.random() * Math.PI * 2,
        speed: 1.2 + Math.random() * 2.0
      });
    }

    this.modeState = {
      dust: dust,
      trail: [],
      ripples: [],
      particles: [],
      slingshotCooldown: 0,
      shake: 0,
      serveTimer: 0.5
    };

    this.resetSingularityBall(true);
  }

  resetSingularityBall(serveToPlayer = true) {
    this.ball.x = CANVAS_WIDTH / 2 + (serveToPlayer ? 40 : -40);
    this.ball.y = CANVAS_HEIGHT / 2 - 80;
    this.ball.size = 10;
    const angle = (Math.random() - 0.5) * 0.5;
    const speed = 7.5;
    const dir = serveToPlayer ? -1 : 1;
    this.ball.vx = dir * Math.cos(angle) * speed;
    this.ball.vy = Math.sin(angle) * speed;
    if (this.modeState) {
      this.modeState.serveTimer = 0.5;
      this.modeState.slingshotCooldown = 0;
      this.modeState.trail = [];
    }
  }

  updateSingularity(dt) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 25);
    if (s.slingshotCooldown > 0) s.slingshotCooldown -= dt;

    for (const d of s.dust) {
      d.angle += d.speed * dt;
    }

    for (let i = s.ripples.length - 1; i >= 0; i--) {
      const rip = s.ripples[i];
      rip.radius += dt * 80;
      rip.life -= dt;
      if (rip.life <= 0) s.ripples.splice(i, 1);
    }

    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) s.particles.splice(i, 1);
    }

    s.trail.push({ x: b.x, y: b.y, life: 0.16 });
    for (let i = s.trail.length - 1; i >= 0; i--) {
      s.trail[i].life -= dt;
      if (s.trail[i].life <= 0) s.trail.splice(i, 1);
    }

    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * 8.5;
    this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));

    if (s.serveTimer > 0) {
      s.serveTimer -= dt;
      return;
    }

    const diff = this.difficulty;
    let aiSpeed = 4.4;
    let deadzone = 12;
    if (diff === 'easy') { aiSpeed = 3.2; deadzone = 18; }
    else if (diff === 'hard') { aiSpeed = 5.5; deadzone = 6; }
    else if (diff === 'impossible') { aiSpeed = 7.0; deadzone = 2; }

    const isHeadingToEnemy = b.vx > 0;
    if (isHeadingToEnemy) {
      const targetEnemyY = b.y - this.enemy.h / 2;
      const enemyDiff = targetEnemyY - this.enemy.y;
      if (Math.abs(enemyDiff) > deadzone) {
        this.enemy.y += Math.sign(enemyDiff) * Math.min(Math.abs(enemyDiff), aiSpeed);
      }
    } else {
      const centerDiff = (CANVAS_HEIGHT - this.enemy.h) / 2 - this.enemy.y;
      if (Math.abs(centerDiff) > 10) {
        this.enemy.y += Math.sign(centerDiff) * Math.min(Math.abs(centerDiff), 1.2);
      }
    }
    this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));

    const subSteps = 2;
    const dtSub = 1 / subSteps;
    const r = b.size / 2;

    for (let step = 0; step < subSteps; step++) {
      const dx = 480 - b.x;
      const dy = 270 - b.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      if (dist > 22) {
        const force = 16000 / Math.max(distSq, 1000);
        b.vx += (dx / dist) * force * dtSub;
        b.vy += (dy / dist) * force * dtSub;
      } else if (s.slingshotCooldown <= 0) {
        s.slingshotCooldown = 0.4;
        window.Sound?.play('portal');
        s.shake = 5;
        s.ripples.push({ radius: 10, life: 0.35 });

        const escapeAngle = Math.atan2(b.vy, b.vx) + (Math.random() - 0.5) * 0.4;
        const speed = Math.max(9.5, Math.hypot(b.vx, b.vy) * 1.05);
        b.vx = Math.cos(escapeAngle) * speed;
        b.vy = Math.sin(escapeAngle) * speed;
        b.x = 480 + (b.vx > 0 ? 26 : -26);
        b.y = 270 + Math.sin(escapeAngle) * 26;

        for (let k = 0; k < 12; k++) {
          s.particles.push({
            x: 480, y: 270,
            vx: (Math.random() - 0.5) * 7, vy: (Math.random() - 0.5) * 7,
            life: 0.35, maxLife: 0.35
          });
        }
      }

      b.x += b.vx * dtSub;
      b.y += b.vy * dtSub;

      if (b.y - r <= 38) {
        b.y = 38 + r;
        b.vy = Math.abs(b.vy);
        window.Sound?.play('wall');
      } else if (b.y + r >= CANVAS_HEIGHT - 38) {
        b.y = CANVAS_HEIGHT - 38 - r;
        b.vy = -Math.abs(b.vy);
        window.Sound?.play('wall');
      }

      if (b.vx < 0 && b.x - r <= this.player.x + this.player.w &&
          b.x + r >= this.player.x &&
          b.y + r >= this.player.y && b.y - r <= this.player.y + this.player.h) {
        b.x = this.player.x + this.player.w + r;
        const offset = (b.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
        const angle = offset * 0.92;
        let curSpd = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      if (b.vx > 0 && b.x + r >= this.enemy.x && b.x - r <= this.enemy.x + this.enemy.w &&
          b.y + r >= this.enemy.y && b.y - r <= this.enemy.y + this.enemy.h) {
        b.x = this.enemy.x - r;
        const offset = (b.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
        const angle = offset * 0.92;
        let curSpd = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = -Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      if (b.x >= CANVAS_WIDTH) {
        this.player.score++;
        window.Sound?.play('score');
        if (this.player.score >= 5) {
          this.showResult(true, 'SINGULARITY MASTER!');
          return;
        }
        this.resetSingularityBall(false);
        break;
      } else if (b.x <= 0) {
        this.enemy.score++;
        window.Sound?.play('wall');
        if (this.enemy.score >= 5) {
          this.showResult(false, 'GRAVITY COLLAPSE');
          return;
        }
        this.resetSingularityBall(true);
        break;
      }
    }
  }

  renderSingularity(ctx, colWhite, colBlack) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) {
      ctx.save();
      const ox = (Math.random() - 0.5) * s.shake;
      const oy = (Math.random() - 0.5) * s.shake;
      ctx.translate(ox, oy);
    }

    // 1. Rails
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // 2. Center Net
    for (let y = 44; y < CANVAS_HEIGHT - 38; y += 26) {
      ctx.fillRect(CANVAS_WIDTH / 2 - 2, y, 4, 14);
    }

    // 3. Scoreboard
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, 240, 80);
    ctx.fillText(`${this.enemy.score}`, 720, 80);

    // 4. Slingshot Shockwave Ripples
    ctx.save();
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 1.5;
    for (const rip of s.ripples) {
      ctx.beginPath();
      ctx.arc(480, 270, rip.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 5. Singularity Vortex
    ctx.save();
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(480, 270, 22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = colBlack;
    ctx.fill();

    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(480, 270, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = colWhite;
    for (const d of s.dust) {
      const px = 480 + Math.cos(d.angle) * d.radius;
      const py = 270 + Math.sin(d.angle) * d.radius;
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
    ctx.restore();

    // 6. Orbital Trajectory Trail
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (const t of s.trail) {
      ctx.fillRect(Math.round(t.x - 2), Math.round(t.y - 2), 4, 4);
    }

    // 7. Particles
    ctx.fillStyle = colWhite;
    for (const p of s.particles) {
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }

    // 8. Paddles
    ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
    ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);

    // 9. Ball
    ctx.fillRect(Math.round(b.x - b.size / 2), Math.round(b.y - b.size / 2), b.size, b.size);

    if (s.shake > 0) {
      ctx.restore();
    }
  }


  // ========================================================
  // EXCAVATOR PONG (Level 57)
  // "Both sides launch drill balls to burrow through earth!"
  // ========================================================
  initExcavator(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.w = 12;
    this.player.h = 80;
    this.enemy.w = 12;
    this.enemy.h = 80;

    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - this.player.h) / 2;
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = (CANVAS_HEIGHT - this.enemy.h) / 2;

    // 4 layers thinner: 20 columns instead of 24 (each layer 10px wide, total 200px)
    const cols = 20;
    const rows = 46;
    const tiles = new Uint8Array(cols * rows);
    tiles.fill(1);

    const balls = [
      {
        id: 'player',
        x: 210,
        y: CANVAS_HEIGHT / 2 - 25,
        vx: 7.5,
        vy: 1.2,
        size: 10
      },
      {
        id: 'enemy',
        x: 750,
        y: CANVAS_HEIGHT / 2 + 25,
        vx: -7.5,
        vy: -1.2,
        size: 10
      }
    ];

    this.modeState = {
      cols,
      rows,
      startX: 380, // Centered at 480: 480 - (20 * 10) / 2 = 380
      startY: 38,
      tiles,
      balls,
      debris: [],
      shake: 0,
      drillTimer: 0,
      serveTimer: 0.6
    };
  }

  resetExcavatorBalls() {
    const s = this.modeState;
    if (!s) return;
    s.balls[0].x = 210;
    s.balls[0].y = CANVAS_HEIGHT / 2 - 25;
    s.balls[0].vx = 7.5;
    s.balls[0].vy = (Math.random() - 0.5) * 2.2;

    s.balls[1].x = 750;
    s.balls[1].y = CANVAS_HEIGHT / 2 + 25;
    s.balls[1].vx = -7.5;
    s.balls[1].vy = (Math.random() - 0.5) * 2.2;

    s.serveTimer = 0.6;
  }

  updateExcavator(dt) {
    const s = this.modeState;
    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 25);
    if (s.drillTimer > 0) s.drillTimer -= dt;

    for (let i = s.debris.length - 1; i >= 0; i--) {
      const p = s.debris[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) s.debris.splice(i, 1);
    }

    // Player keyboard controls
    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * 8.5;
    this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));

    if (s.serveTimer > 0) {
      s.serveTimer -= dt;
      return;
    }

    // AI tracking
    const diff = this.difficulty;
    let aiSpeed = 4.2;
    let deadzone = 12;
    if (diff === 'easy') { aiSpeed = 3.2; deadzone = 18; }
    else if (diff === 'hard') { aiSpeed = 5.2; deadzone = 6; }
    else if (diff === 'impossible') { aiSpeed = 6.6; deadzone = 2; }

    let targetBall = null;
    let closestX = -Infinity;
    for (const b of s.balls) {
      if (b.vx > 0 && b.x > closestX) {
        closestX = b.x;
        targetBall = b;
      }
    }
    if (!targetBall) {
      for (const b of s.balls) {
        if (b.vx > 0) targetBall = b;
      }
    }

    if (targetBall) {
      const targetEnemyY = targetBall.y - this.enemy.h / 2;
      const enemyDiff = targetEnemyY - this.enemy.y;
      if (Math.abs(enemyDiff) > deadzone) {
        this.enemy.y += Math.sign(enemyDiff) * Math.min(Math.abs(enemyDiff), aiSpeed);
      }
    } else {
      const centerDiff = (CANVAS_HEIGHT - this.enemy.h) / 2 - this.enemy.y;
      if (Math.abs(centerDiff) > 10) {
        this.enemy.y += Math.sign(centerDiff) * Math.min(Math.abs(centerDiff), 1.5);
      }
    }
    this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));

    // Physics sub-steps for both balls
    const subSteps = 2;
    const dtSub = 1 / subSteps;

    for (const b of s.balls) {
      const r = b.size / 2;
      for (let step = 0; step < subSteps; step++) {
        b.x += b.vx * dtSub;
        b.y += b.vy * dtSub;

        // Rails bounce
        if (b.y - r <= 38) {
          b.y = 38 + r;
          b.vy = Math.abs(b.vy);
          window.Sound?.play('wall');
        } else if (b.y + r >= CANVAS_HEIGHT - 38) {
          b.y = CANVAS_HEIGHT - 38 - r;
          b.vy = -Math.abs(b.vy);
          window.Sound?.play('wall');
        }

        // Earth mountain collision & 2-layer digging
        const startX = s.startX;
        const startY = s.startY;
        const endX = startX + s.cols * 10;
        const endY = startY + s.rows * 10;

        if (b.x + r >= startX && b.x - r <= endX && b.y + r >= startY && b.y - r <= endY) {
          const minCol = Math.max(0, Math.floor((b.x - r - startX) / 10));
          const maxCol = Math.min(s.cols - 1, Math.floor((b.x + r - startX) / 10));
          const minRow = Math.max(0, Math.floor((b.y - r - startY) / 10));
          const maxRow = Math.min(s.rows - 1, Math.floor((b.y + r - startY) / 10));

          let hitSolid = false;
          let solidMinCol = 999;
          let solidMaxCol = -1;

          for (let c = minCol; c <= maxCol; c++) {
            for (let row = minRow; row <= maxRow; row++) {
              const idx = row * s.cols + c;
              if (s.tiles[idx] === 1) {
                hitSolid = true;
                if (c < solidMinCol) solidMinCol = c;
                if (c > solidMaxCol) solidMaxCol = c;
              }
            }
          }

          if (hitSolid) {
            // Break 2 layers thick
            let breakColStart = 0;
            let breakColEnd = 0;

            if (b.vx >= 0) {
              // Heading east: break first solid layer hit and the layer behind it
              breakColStart = solidMinCol;
              breakColEnd = Math.min(s.cols - 1, solidMinCol + 1);
            } else {
              // Heading west: break rightmost solid layer hit and the layer behind it
              breakColEnd = solidMaxCol;
              breakColStart = Math.max(0, solidMaxCol - 1);
            }

            // Vertical tunnel height matching ball diameter with slight clearance
            const breakRowStart = Math.max(0, Math.floor((b.y - r - 2 - startY) / 10));
            const breakRowEnd = Math.min(s.rows - 1, Math.floor((b.y + r + 2 - startY) / 10));

            for (let c = breakColStart; c <= breakColEnd; c++) {
              for (let row = breakRowStart; row <= breakRowEnd; row++) {
                const idx = row * s.cols + c;
                if (s.tiles[idx] === 1) {
                  s.tiles[idx] = 0;
                  if (Math.random() < 0.5) {
                    s.debris.push({
                      x: startX + c * 10 + 5,
                      y: startY + row * 10 + 5,
                      vx: -Math.sign(b.vx) * (2.5 + Math.random() * 4.0),
                      vy: (Math.random() - 0.5) * 5.0,
                      life: 0.28,
                      maxLife: 0.28
                    });
                  }
                }
              }
            }

            // Ricochet ball back so player/opponent can volley again
            b.vx = -b.vx;
            b.vy += (Math.random() - 0.5) * 1.5;
            b.x += Math.sign(b.vx) * 4;

            window.Sound?.play('brick');
            s.shake = 3;
          }
        }

        // Paddle collisions
        if (b.vx < 0 && b.x - r <= this.player.x + this.player.w &&
            b.x + r >= this.player.x &&
            b.y + r >= this.player.y && b.y - r <= this.player.y + this.player.h) {
          b.x = this.player.x + this.player.w + r;
          const offset = (b.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
          const angle = offset * 0.92;
          let curSpd = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
          b.vx = Math.abs(Math.cos(angle) * curSpd);
          b.vy = Math.sin(angle) * curSpd;
          window.Sound?.play('hit');
        }

        if (b.vx > 0 && b.x + r >= this.enemy.x && b.x - r <= this.enemy.x + this.enemy.w &&
            b.y + r >= this.enemy.y && b.y - r <= this.enemy.y + this.enemy.h) {
          b.x = this.enemy.x - r;
          const offset = (b.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
          const angle = offset * 0.92;
          let curSpd = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
          b.vx = -Math.abs(Math.cos(angle) * curSpd);
          b.vy = Math.sin(angle) * curSpd;
          window.Sound?.play('hit');
        }

        // Goal detection
        if (b.x >= CANVAS_WIDTH) {
          this.player.score++;
          window.Sound?.play('score');
          s.shake = 6;
          if (this.player.score >= 5) {
            this.showResult(true, 'MINING VICTORY!');
            return;
          }
          this.resetExcavatorBalls();
          return;
        } else if (b.x <= 0) {
          this.enemy.score++;
          window.Sound?.play('wall');
          s.shake = 6;
          if (this.enemy.score >= 5) {
            this.showResult(false, 'CAVE-IN DEFEAT');
            return;
          }
          this.resetExcavatorBalls();
          return;
        }
      }
    }
  }

  renderExcavator(ctx, colWhite, colBlack) {
    const s = this.modeState;

    if (s.shake > 0) {
      ctx.save();
      const ox = (Math.random() - 0.5) * s.shake;
      const oy = (Math.random() - 0.5) * s.shake;
      ctx.translate(ox, oy);
    }

    // 1. Rails
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // 2. Scoreboard
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, 240, 80);
    ctx.fillText(`${this.enemy.score}`, 720, 80);

    // 3. Destructible Earth Mountain (20 columns x 46 rows)
    ctx.fillStyle = colWhite;
    const startX = s.startX;
    const startY = s.startY;
    for (let row = 0; row < s.rows; row++) {
      for (let c = 0; c < s.cols; c++) {
        const idx = row * s.cols + c;
        if (s.tiles[idx] === 1) {
          const tx = startX + c * 10;
          const ty = startY + row * 10;
          ctx.fillRect(tx + 1, ty + 1, 8, 8);
          if ((c + row) % 2 === 0) {
            ctx.fillStyle = colBlack;
            ctx.fillRect(tx + 3, ty + 3, 4, 4);
            ctx.fillStyle = colWhite;
          }
        }
      }
    }

    // 4. Debris particles
    ctx.fillStyle = colWhite;
    for (const p of s.debris) {
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }

    // 5. Paddles
    ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
    ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);

    // 6. Both Drill Balls
    for (const b of s.balls) {
      ctx.fillStyle = colWhite;
      ctx.fillRect(Math.round(b.x - b.size / 2), Math.round(b.y - b.size / 2), b.size, b.size);
      if (b.id === 'enemy') {
        ctx.fillStyle = colBlack;
        ctx.fillRect(Math.round(b.x - 2), Math.round(b.y - 2), 4, 4);
      }
    }

    if (s.shake > 0) {
      ctx.restore();
    }
  }


  // ========================================================
  // SPACE INVADERS PONG (Level 58)
  // "Classic alien invaders march across the midfield!"
  // ========================================================
  initInvaders(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.w = 12;
    this.player.h = 72;
    this.enemy.w = 12;
    this.enemy.h = 72;

    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - this.player.h) / 2;
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = (CANVAS_HEIGHT - this.enemy.h) / 2;

    const invaders = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        invaders.push({
          row: r,
          col: c,
          x: 350 + c * 34,
          y: 90 + r * 32,
          w: 22,
          h: 18,
          alive: true
        });
      }
    }

    this.modeState = {
      invaders,
      fleetDir: 1,
      stepTimer: 0.35,
      stepInterval: 0.35,
      bombs: [],
      bombTimer: 2.2,
      particles: [],
      shake: 0,
      serveTimer: 0.5
    };

    this.resetBall(true);
  }

  updateInvaders(dt) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 25);

    // Particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) s.particles.splice(i, 1);
    }

    // Bombs
    for (let i = s.bombs.length - 1; i >= 0; i--) {
      const bm = s.bombs[i];
      bm.y += bm.vy;
      if (bm.y > CANVAS_HEIGHT - 38) {
        s.bombs.splice(i, 1);
        continue;
      }
      // Check collision with ball
      if (Math.hypot(b.x - bm.x, b.y - bm.y) < b.size / 2 + 5) {
        s.bombs.splice(i, 1);
        b.vy = (b.vy > 0 ? -1 : 1) * Math.min(12, Math.abs(b.vy) + 2.5);
        window.Sound?.play('laser');
        s.shake = 4;
      }
    }

    // Keyboard paddle control
    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * 8.5;
    this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));

    // Enemy AI
    const diff = this.difficulty;
    let aiSpeed = 4.2;
    let deadzone = 12;
    if (diff === 'easy') { aiSpeed = 3.2; deadzone = 18; }
    else if (diff === 'hard') { aiSpeed = 5.2; deadzone = 6; }
    else if (diff === 'impossible') { aiSpeed = 6.6; deadzone = 2; }

    const isHeadingToEnemy = b.vx > 0;
    if (isHeadingToEnemy) {
      const targetEnemyY = b.y - this.enemy.h / 2;
      const enemyDiff = targetEnemyY - this.enemy.y;
      if (Math.abs(enemyDiff) > deadzone) {
        this.enemy.y += Math.sign(enemyDiff) * Math.min(Math.abs(enemyDiff), aiSpeed);
      }
    } else {
      const centerDiff = (CANVAS_HEIGHT - this.enemy.h) / 2 - this.enemy.y;
      if (Math.abs(centerDiff) > 10) {
        this.enemy.y += Math.sign(centerDiff) * Math.min(Math.abs(centerDiff), 1.2);
      }
    }
    this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));

    // Fleet stepping
    s.stepTimer -= dt;
    if (s.stepTimer <= 0) {
      s.stepTimer = s.stepInterval;
      let hitEdge = false;
      for (const inv of s.invaders) {
        if (!inv.alive) continue;
        const nextX = inv.x + s.fleetDir * 10;
        if (nextX < 260 || nextX + inv.w > 700) {
          hitEdge = true;
          break;
        }
      }
      if (hitEdge) {
        s.fleetDir = -s.fleetDir;
        for (const inv of s.invaders) {
          inv.y += 12;
        }
        s.stepInterval = Math.max(0.18, s.stepInterval * 0.96);
      } else {
        for (const inv of s.invaders) {
          inv.x += s.fleetDir * 10;
        }
      }
    }

    // Bomb dropping
    s.bombTimer -= dt;
    if (s.bombTimer <= 0) {
      s.bombTimer = 2.0;
      const aliveList = s.invaders.filter(inv => inv.alive);
      if (aliveList.length > 0) {
        const shooter = aliveList[Math.floor(Math.random() * aliveList.length)];
        s.bombs.push({
          x: shooter.x + shooter.w / 2,
          y: shooter.y + shooter.h,
          vy: 2.6
        });
      }
    }

    if (s.serveTimer > 0) {
      s.serveTimer -= dt;
      return;
    }

    // Ball physics
    const subSteps = 2;
    const dtSub = 1 / subSteps;
    const r = b.size / 2;

    for (let step = 0; step < subSteps; step++) {
      b.x += b.vx * dtSub;
      b.y += b.vy * dtSub;

      if (b.y - r <= 38) {
        b.y = 38 + r;
        b.vy = Math.abs(b.vy);
        window.Sound?.play('wall');
      } else if (b.y + r >= CANVAS_HEIGHT - 38) {
        b.y = CANVAS_HEIGHT - 38 - r;
        b.vy = -Math.abs(b.vy);
        window.Sound?.play('wall');
      }

      // Invader collisions
      for (const inv of s.invaders) {
        if (!inv.alive) continue;
        if (b.x + r >= inv.x && b.x - r <= inv.x + inv.w &&
            b.y + r >= inv.y && b.y - r <= inv.y + inv.h) {
          inv.alive = false;
          b.vx = -b.vx;
          window.Sound?.play('brick');
          s.shake = 3;

          for (let k = 0; k < 7; k++) {
            s.particles.push({
              x: inv.x + inv.w / 2,
              y: inv.y + inv.h / 2,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 0.25, maxLife: 0.25
            });
          }

          // Check if fleet cleared
          if (s.invaders.every(i => !i.alive)) {
            this.showResult(true, 'FLEET CLEARED!');
            return;
          }
          break;
        }
      }

      // Paddle collisions
      if (b.vx < 0 && b.x - r <= this.player.x + this.player.w &&
          b.x + r >= this.player.x &&
          b.y + r >= this.player.y && b.y - r <= this.player.y + this.player.h) {
        b.x = this.player.x + this.player.w + r;
        const offset = (b.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
        const angle = offset * 0.92;
        let curSpd = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      if (b.vx > 0 && b.x + r >= this.enemy.x && b.x - r <= this.enemy.x + this.enemy.w &&
          b.y + r >= this.enemy.y && b.y - r <= this.enemy.y + this.enemy.h) {
        b.x = this.enemy.x - r;
        const offset = (b.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
        const angle = offset * 0.92;
        let curSpd = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = -Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      // Goal lines
      if (b.x >= CANVAS_WIDTH) {
        this.player.score++;
        window.Sound?.play('score');
        if (this.player.score >= 5) {
          this.showResult(true, 'INVADER DEFEATED!');
          return;
        }
        this.resetBall(false);
        break;
      } else if (b.x <= 0) {
        this.enemy.score++;
        window.Sound?.play('wall');
        if (this.enemy.score >= 5) {
          this.showResult(false, 'INVASION LOST');
          return;
        }
        this.resetBall(true);
        break;
      }
    }
  }

  renderInvaders(ctx, colWhite, colBlack) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) {
      ctx.save();
      const ox = (Math.random() - 0.5) * s.shake;
      const oy = (Math.random() - 0.5) * s.shake;
      ctx.translate(ox, oy);
    }

    // 1. Rails
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // 2. Scoreboard
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, 240, 80);
    ctx.fillText(`${this.enemy.score}`, 720, 80);

    // 3. Invader Fleet
    ctx.fillStyle = colWhite;
    for (const inv of s.invaders) {
      if (!inv.alive) continue;
      const ix = Math.round(inv.x);
      const iy = Math.round(inv.y);

      if (inv.row === 0) {
        // Squid
        ctx.fillRect(ix + 6, iy, 10, 3);
        ctx.fillRect(ix + 3, iy + 3, 16, 6);
        ctx.fillRect(ix + 1, iy + 9, 20, 4);
        ctx.fillRect(ix + 4, iy + 13, 4, 5);
        ctx.fillRect(ix + 14, iy + 13, 4, 5);
        ctx.fillStyle = colBlack;
        ctx.fillRect(ix + 5, iy + 5, 3, 3);
        ctx.fillRect(ix + 14, iy + 5, 3, 3);
        ctx.fillStyle = colWhite;
      } else if (inv.row === 1) {
        // Crab
        ctx.fillRect(ix + 4, iy, 14, 3);
        ctx.fillRect(ix + 1, iy + 3, 20, 6);
        ctx.fillRect(ix, iy + 9, 22, 4);
        ctx.fillRect(ix + 2, iy + 13, 5, 5);
        ctx.fillRect(ix + 15, iy + 13, 5, 5);
        ctx.fillStyle = colBlack;
        ctx.fillRect(ix + 5, iy + 5, 3, 3);
        ctx.fillRect(ix + 14, iy + 5, 3, 3);
        ctx.fillStyle = colWhite;
      } else {
        // Octopus
        ctx.fillRect(ix + 3, iy, 16, 4);
        ctx.fillRect(ix, iy + 4, 22, 6);
        ctx.fillRect(ix + 2, iy + 10, 18, 4);
        ctx.fillRect(ix + 1, iy + 14, 4, 4);
        ctx.fillRect(ix + 9, iy + 14, 4, 4);
        ctx.fillRect(ix + 17, iy + 14, 4, 4);
        ctx.fillStyle = colBlack;
        ctx.fillRect(ix + 4, iy + 6, 3, 3);
        ctx.fillRect(ix + 15, iy + 6, 3, 3);
        ctx.fillStyle = colWhite;
      }
    }

    // 4. Kinetic EMP spark bombs
    ctx.fillStyle = colWhite;
    for (const bm of s.bombs) {
      const bx = Math.round(bm.x);
      const by = Math.round(bm.y);
      ctx.fillRect(bx - 1, by, 3, 2);
      ctx.fillRect(bx, by + 2, 3, 2);
      ctx.fillRect(bx - 1, by + 4, 3, 2);
    }

    // 5. Particles
    for (const p of s.particles) {
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }

    // 6. Paddles & Ball
    ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
    ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);
    ctx.fillRect(Math.round(b.x - b.size / 2), Math.round(b.y - b.size / 2), b.size, b.size);

    if (s.shake > 0) {
      ctx.restore();
    }
  }


  // ========================================================
  // AIR HOCKEY PONG (Level 59)
  // "Free 2D half-court mallet movement & anti-softlock glide!"
  // ========================================================
  initAirHockey(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;

    this.player = {
      x: 120,
      y: CANVAS_HEIGHT / 2,
      vx: 0,
      vy: 0,
      r: 22,
      score: 0
    };

    this.enemy = {
      x: CANVAS_WIDTH - 120,
      y: CANVAS_HEIGHT / 2,
      vx: 0,
      vy: 0,
      r: 22,
      score: 0
    };

    this.ball = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: (Math.random() > 0.5 ? 1 : -1) * 6.5,
      vy: (Math.random() - 0.5) * 4.0,
      r: 12,
      trail: []
    };

    this.modeState = {
      shake: 0,
      serveTimer: 0.5
    };
  }

  resetAirHockeyPuck(serveToPlayer = true) {
    this.ball.x = CANVAS_WIDTH / 2;
    this.ball.y = CANVAS_HEIGHT / 2;
    const dir = serveToPlayer ? -1 : 1;
    this.ball.vx = dir * 6.5;
    this.ball.vy = (Math.random() - 0.5) * 4.0;
    this.ball.trail = [];
    if (this.modeState) {
      this.modeState.serveTimer = 0.5;
    }
  }

  updateAirHockey(dt) {
    const s = this.modeState;
    const b = this.ball;
    const p = this.player;
    const e = this.enemy;

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 25);

    // 2D Player Mallet Movement
    let dirX = 0, dirY = 0;
    if (this.keys['w'] || this.keys['arrowup']) dirY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dirY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dirX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dirX += 1;

    const moveSpd = 8.5;
    if (dirX !== 0 && dirY !== 0) {
      dirX *= 0.7071;
      dirY *= 0.7071;
    }
    p.vx = dirX * moveSpd;
    p.vy = dirY * moveSpd;
    p.x += p.vx;
    p.y += p.vy;

    // Clamped within player's half-court
    p.x = Math.max(34, Math.min(450, p.x));
    p.y = Math.max(60, Math.min(CANVAS_HEIGHT - 60, p.y));

    // 2D Enemy Mallet AI (Smart striking - never wedges puck into corners)
    const diff = this.difficulty;
    let aiSpeed = 4.6;
    if (diff === 'easy') aiSpeed = 3.4;
    else if (diff === 'hard') aiSpeed = 5.8;
    else if (diff === 'impossible') aiSpeed = 7.4;

    let targetX = CANVAS_WIDTH - 120;
    let targetY = CANVAS_HEIGHT / 2;

    if (b.x > 480) {
      // Puck is in enemy half.
      // Position BEHIND the puck (to its right) to drive it toward player's goal (to the left)
      targetX = Math.min(CANVAS_WIDTH - 55, b.x + 32);

      // Corner escape assistance: if puck is deep in the corner, approach from above/below to swipe it out
      if (b.x > CANVAS_WIDTH - 110) {
        if (b.y < 140) {
          targetY = b.y + 32;
          targetX = Math.min(CANVAS_WIDTH - 55, b.x + 20);
        } else if (b.y > CANVAS_HEIGHT - 140) {
          targetY = b.y - 32;
          targetX = Math.min(CANVAS_WIDTH - 55, b.x + 20);
        } else {
          targetY = b.y;
        }
      } else {
        targetY = b.y;
      }
    } else {
      // Puck is in player half: guard goal slot
      targetX = CANVAS_WIDTH - 100;
      targetY = (CANVAS_HEIGHT / 2) * 0.4 + b.y * 0.6;
    }

    const aiDx = targetX - e.x;
    const aiDy = targetY - e.y;
    const aiDist = Math.hypot(aiDx, aiDy);
    if (aiDist > 5) {
      e.vx = (aiDx / aiDist) * Math.min(aiDist, aiSpeed);
      e.vy = (aiDy / aiDist) * Math.min(aiDist, aiSpeed);
    } else {
      e.vx = 0;
      e.vy = 0;
    }
    e.x += e.vx;
    e.y += e.vy;
    e.x = Math.max(510, Math.min(CANVAS_WIDTH - 34, e.x));
    e.y = Math.max(60, Math.min(CANVAS_HEIGHT - 60, e.y));

    if (s.serveTimer > 0) {
      s.serveTimer -= dt;
      return;
    }

    // Puck Physics
    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 6) b.trail.shift();

    b.vx *= 0.996;
    b.vy *= 0.996;

    const subSteps = 3;
    const dtSub = 1 / subSteps;

    for (let step = 0; step < subSteps; step++) {
      b.x += b.vx * dtSub;
      b.y += b.vy * dtSub;

      // Top/bottom rail bounce
      if (b.y - b.r <= 38) {
        b.y = 38 + b.r;
        b.vy = Math.abs(b.vy);
        window.Sound?.play('wall');
      } else if (b.y + b.r >= CANVAS_HEIGHT - 38) {
        b.y = CANVAS_HEIGHT - 38 - b.r;
        b.vy = -Math.abs(b.vy);
        window.Sound?.play('wall');
      }

      // Goal slot opening: y in [170, 370]
      const inGoalSlot = (b.y >= 170 && b.y <= 370);

      // Left perimeter cushion (outside goal slot)
      if (!inGoalSlot && b.x - b.r <= 20) {
        b.x = 20 + b.r;
        b.vx = Math.abs(b.vx);
        window.Sound?.play('wall');
      }
      // Right perimeter cushion (outside goal slot)
      if (!inGoalSlot && b.x + b.r >= CANVAS_WIDTH - 20) {
        b.x = CANVAS_WIDTH - 20 - b.r;
        b.vx = -Math.abs(b.vx);
        window.Sound?.play('wall');
      }

      // 45-degree Angled Corner Cushions (Rebound diagonally out)
      // Top-Right Corner Chamfer: (CANVAS_WIDTH - 70, 38) to (CANVAS_WIDTH - 20, 88)
      if (b.x + b.y >= (CANVAS_WIDTH - 20 + 88) - b.r * 1.414 && b.x > CANVAS_WIDTH - 90 && b.y < 110) {
        b.vx = -Math.abs(b.vx || 6.0) - 2.0;
        b.vy = Math.abs(b.vy || 4.0) + 2.0;
        b.x -= 3;
        b.y += 3;
        window.Sound?.play('wall');
      }
      // Bottom-Right Corner Chamfer: (CANVAS_WIDTH - 20, CANVAS_HEIGHT - 88) to (CANVAS_WIDTH - 70, CANVAS_HEIGHT - 38)
      if (b.x - b.y >= (CANVAS_WIDTH - 20 - (CANVAS_HEIGHT - 88)) - b.r * 1.414 && b.x > CANVAS_WIDTH - 90 && b.y > CANVAS_HEIGHT - 110) {
        b.vx = -Math.abs(b.vx || 6.0) - 2.0;
        b.vy = -Math.abs(b.vy || 4.0) - 2.0;
        b.x -= 3;
        b.y -= 3;
        window.Sound?.play('wall');
      }
      // Top-Left Corner Chamfer: (20, 88) to (70, 38)
      if (b.y - b.x >= (88 - 20) - b.r * 1.414 && b.x < 90 && b.y < 110) {
        b.vx = Math.abs(b.vx || 6.0) + 2.0;
        b.vy = Math.abs(b.vy || 4.0) + 2.0;
        b.x += 3;
        b.y += 3;
        window.Sound?.play('wall');
      }
      // Bottom-Left Corner Chamfer: (20, CANVAS_HEIGHT - 88) to (70, CANVAS_HEIGHT - 38)
      if (b.x + b.y <= (20 + (CANVAS_HEIGHT - 88)) + b.r * 1.414 && b.x < 90 && b.y > CANVAS_HEIGHT - 110) {
        b.vx = Math.abs(b.vx || 6.0) + 2.0;
        b.vy = -Math.abs(b.vy || 4.0) - 2.0;
        b.x += 3;
        b.y -= 3;
        window.Sound?.play('wall');
      }

      // Corner Anti-Stuck Ejection Watchdog
      const nearCornerX = (b.x < 100 || b.x > CANVAS_WIDTH - 100);
      const nearCornerY = (b.y < 120 || b.y > CANVAS_HEIGHT - 120);
      if (nearCornerX && nearCornerY && Math.hypot(b.vx, b.vy) < 2.5) {
        b.vx = (b.x > 480 ? -7.5 : 7.5);
        b.vy = (b.y > CANVAS_HEIGHT / 2 ? -5.0 : 5.0);
        window.Sound?.play('wall');
      }

      // Mallet collisions (Circle-to-Circle with Pin Prevention)
      for (const m of [p, e]) {
        const dx = b.x - m.x;
        const dy = b.y - m.y;
        const dist = Math.hypot(dx, dy);
        const minDist = m.r + b.r;

        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;

          // If puck is against right cushion (outside goal slot) and mallet is pressing it into the wall:
          if (!inGoalSlot && b.x + b.r >= CANVAS_WIDTH - 26 && nx > 0) {
            // Push mallet back away from wall and eject puck leftward
            m.x = b.x - minDist;
            b.vx = -Math.abs(b.vx || 7.0) - 2.5;
            b.vy += (Math.random() - 0.5) * 4.0;
            window.Sound?.play('hit');
            continue;
          }
          // If puck is against left cushion (outside goal slot) and mallet is pressing it into the wall:
          if (!inGoalSlot && b.x - b.r <= 26 && nx < 0) {
            m.x = b.x + minDist;
            b.vx = Math.abs(b.vx || 7.0) + 2.5;
            b.vy += (Math.random() - 0.5) * 4.0;
            window.Sound?.play('hit');
            continue;
          }

          // Push puck out
          b.x = m.x + nx * minDist;
          b.y = m.y + ny * minDist;

          // Impulse transfer
          const mSpd = Math.hypot(m.vx, m.vy);
          const currentSpd = Math.hypot(b.vx, b.vy);
          const strikeSpd = Math.min(14.5, Math.max(8.0, currentSpd * 1.05 + mSpd * 0.65));

          b.vx = nx * strikeSpd;
          b.vy = ny * strikeSpd;

          window.Sound?.play('hit');
          s.shake = (strikeSpd > 11) ? 3 : 1;
        }
      }

      // Goals
      if (b.x >= CANVAS_WIDTH) {
        p.score++;
        window.Sound?.play('score');
        s.shake = 6;
        if (p.score >= 5) {
          this.showResult(true, 'AIR HOCKEY CHAMPION!');
          return;
        }
        this.resetAirHockeyPuck(false);
        break;
      } else if (b.x <= 0) {
        e.score++;
        window.Sound?.play('wall');
        s.shake = 6;
        if (e.score >= 5) {
          this.showResult(false, 'AIR HOCKEY DEFEAT');
          return;
        }
        this.resetAirHockeyPuck(true);
        break;
      }
    }
  }

  renderAirHockey(ctx, colWhite, colBlack) {
    const s = this.modeState;
    const b = this.ball;
    const p = this.player;
    const e = this.enemy;

    if (s.shake > 0) {
      ctx.save();
      const ox = (Math.random() - 0.5) * s.shake;
      const oy = (Math.random() - 0.5) * s.shake;
      ctx.translate(ox, oy);
    }

    // 1. Table Borders & Goal Cushions
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // Left cushions
    ctx.fillRect(16, 38, 4, 132);
    ctx.fillRect(16, 370, 4, 132);
    // Right cushions
    ctx.fillRect(CANVAS_WIDTH - 20, 38, 4, 132);
    ctx.fillRect(CANVAS_WIDTH - 20, 370, 4, 132);

    // 45-degree Angled Corner Bumpers
    ctx.save();
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 3;
    // Top-Left
    ctx.beginPath(); ctx.moveTo(16, 92); ctx.lineTo(70, 38); ctx.stroke();
    // Bottom-Left
    ctx.beginPath(); ctx.moveTo(16, CANVAS_HEIGHT - 92); ctx.lineTo(70, CANVAS_HEIGHT - 38); ctx.stroke();
    // Top-Right
    ctx.beginPath(); ctx.moveTo(CANVAS_WIDTH - 20, 92); ctx.lineTo(CANVAS_WIDTH - 74, 38); ctx.stroke();
    // Bottom-Right
    ctx.beginPath(); ctx.moveTo(CANVAS_WIDTH - 20, CANVAS_HEIGHT - 92); ctx.lineTo(CANVAS_WIDTH - 74, CANVAS_HEIGHT - 38); ctx.stroke();

    // Goal creases
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(20, CANVAS_HEIGHT / 2, 70, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 20, CANVAS_HEIGHT / 2, 70, Math.PI / 2, 3 * Math.PI / 2);
    ctx.stroke();

    // Center dividing line & center circle
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 38);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 38);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 60, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Scoreboard
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${p.score}`, 240, 80);
    ctx.fillText(`${e.score}`, 720, 80);

    // 3. Puck Trail
    ctx.fillStyle = colWhite;
    for (let i = 0; i < b.trail.length; i++) {
      const pt = b.trail[i];
      const rad = (i / b.trail.length) * (b.r - 2);
      ctx.beginPath();
      ctx.arc(Math.round(pt.x), Math.round(pt.y), Math.max(1, rad), 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Puck
    ctx.beginPath();
    ctx.arc(Math.round(b.x), Math.round(b.y), b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colBlack;
    ctx.beginPath();
    ctx.arc(Math.round(b.x), Math.round(b.y), 4, 0, Math.PI * 2);
    ctx.fill();

    // 5. Mallets (Concentric retro rings)
    for (const m of [p, e]) {
      ctx.fillStyle = colWhite;
      ctx.beginPath();
      ctx.arc(Math.round(m.x), Math.round(m.y), m.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colBlack;
      ctx.beginPath();
      ctx.arc(Math.round(m.x), Math.round(m.y), m.r - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colWhite;
      ctx.beginPath();
      ctx.arc(Math.round(m.x), Math.round(m.y), 7, 0, Math.PI * 2);
      ctx.fill();
    }

    if (s.shake > 0) {
      ctx.restore();
    }
  }


  // ========================================================
  // LIGHT CYCLE PONG (Level 60)
  // "The ball leaves a reflective laser maze in its wake!"
  // ========================================================
  initLightCycle(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.w = 12;
    this.player.h = 72;
    this.enemy.w = 12;
    this.enemy.h = 72;

    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - this.player.h) / 2;
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = (CANVAS_HEIGHT - this.enemy.h) / 2;

    this.modeState = {
      segments: [],
      lastNodeX: CANVAS_WIDTH / 2,
      lastNodeY: CANVAS_HEIGHT / 2,
      sparks: [],
      shake: 0,
      serveTimer: 0.5
    };

    this.resetBall(true);
  }

  updateLightCycle(dt) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 25);

    // Sparks
    for (let i = s.sparks.length - 1; i >= 0; i--) {
      const sp = s.sparks[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.life -= dt;
      if (sp.life <= 0) s.sparks.splice(i, 1);
    }

    // Laser trail decay
    for (let i = s.segments.length - 1; i >= 0; i--) {
      const seg = s.segments[i];
      seg.life -= dt;
      if (seg.life <= 0) s.segments.splice(i, 1);
    }

    // Player keyboard controls
    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * 8.5;
    this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));

    // Enemy AI
    const diff = this.difficulty;
    let aiSpeed = 4.2;
    let deadzone = 12;
    if (diff === 'easy') { aiSpeed = 3.2; deadzone = 18; }
    else if (diff === 'hard') { aiSpeed = 5.2; deadzone = 6; }
    else if (diff === 'impossible') { aiSpeed = 6.6; deadzone = 2; }

    const isHeadingToEnemy = b.vx > 0;
    if (isHeadingToEnemy) {
      const targetEnemyY = b.y - this.enemy.h / 2;
      const enemyDiff = targetEnemyY - this.enemy.y;
      if (Math.abs(enemyDiff) > deadzone) {
        this.enemy.y += Math.sign(enemyDiff) * Math.min(Math.abs(enemyDiff), aiSpeed);
      }
    } else {
      const centerDiff = (CANVAS_HEIGHT - this.enemy.h) / 2 - this.enemy.y;
      if (Math.abs(centerDiff) > 10) {
        this.enemy.y += Math.sign(centerDiff) * Math.min(Math.abs(centerDiff), 1.2);
      }
    }
    this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));

    if (s.serveTimer > 0) {
      s.serveTimer -= dt;
      s.lastNodeX = b.x;
      s.lastNodeY = b.y;
      return;
    }

    // Physics sub-steps
    const subSteps = 2;
    const dtSub = 1 / subSteps;
    const r = b.size / 2;

    for (let step = 0; step < subSteps; step++) {
      b.x += b.vx * dtSub;
      b.y += b.vy * dtSub;

      // Drop laser trail node every 20px
      const distFromNode = Math.hypot(b.x - s.lastNodeX, b.y - s.lastNodeY);
      if (distFromNode >= 20) {
        s.segments.push({
          x1: s.lastNodeX,
          y1: s.lastNodeY,
          x2: b.x,
          y2: b.y,
          life: 3.5,
          maxLife: 3.5
        });
        s.lastNodeX = b.x;
        s.lastNodeY = b.y;
      }

      // Rails bounce
      if (b.y - r <= 38) {
        b.y = 38 + r;
        b.vy = Math.abs(b.vy);
        window.Sound?.play('wall');
      } else if (b.y + r >= CANVAS_HEIGHT - 38) {
        b.y = CANVAS_HEIGHT - 38 - r;
        b.vy = -Math.abs(b.vy);
        window.Sound?.play('wall');
      }

      // Laser wall collisions (older than 0.35s)
      for (let i = s.segments.length - 1; i >= 0; i--) {
        const seg = s.segments[i];
        if (seg.life > seg.maxLife - 0.35) continue;

        // Line segment distance
        const dx = seg.x2 - seg.x1;
        const dy = seg.y2 - seg.y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) continue;

        let t = ((b.x - seg.x1) * dx + (b.y - seg.y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const projX = seg.x1 + t * dx;
        const projY = seg.y1 + t * dy;

        const distToSeg = Math.hypot(b.x - projX, b.y - projY);
        if (distToSeg < r + 3) {
          // Reflect velocity across normal
          const segLen = Math.hypot(dx, dy);
          let nx = -dy / segLen;
          let ny = dx / segLen;

          // Align normal against incoming velocity
          if (b.vx * nx + b.vy * ny > 0) {
            nx = -nx;
            ny = -ny;
          }

          const dot = b.vx * nx + b.vy * ny;
          b.vx = b.vx - 2 * dot * nx;
          b.vy = b.vy - 2 * dot * ny;

          // Dissipate segment into sparks
          for (let k = 0; k < 6; k++) {
            s.sparks.push({
              x: projX,
              y: projY,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 0.22,
              maxLife: 0.22
            });
          }
          s.segments.splice(i, 1);
          window.Sound?.play('laser');
          s.shake = 3;
          break;
        }
      }

      // Paddle collisions
      if (b.vx < 0 && b.x - r <= this.player.x + this.player.w &&
          b.x + r >= this.player.x &&
          b.y + r >= this.player.y && b.y - r <= this.player.y + this.player.h) {
        b.x = this.player.x + this.player.w + r;
        const offset = (b.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
        const angle = offset * 0.92;
        let curSpd = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      if (b.vx > 0 && b.x + r >= this.enemy.x && b.x - r <= this.enemy.x + this.enemy.w &&
          b.y + r >= this.enemy.y && b.y - r <= this.enemy.y + this.enemy.h) {
        b.x = this.enemy.x - r;
        const offset = (b.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
        const angle = offset * 0.92;
        let curSpd = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = -Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      // Goal lines
      if (b.x >= CANVAS_WIDTH) {
        this.player.score++;
        window.Sound?.play('score');
        if (this.player.score >= 5) {
          this.showResult(true, 'LIGHT CYCLE MASTER!');
          return;
        }
        s.segments = [];
        this.resetBall(false);
        break;
      } else if (b.x <= 0) {
        this.enemy.score++;
        window.Sound?.play('wall');
        if (this.enemy.score >= 5) {
          this.showResult(false, 'DEREZzED');
          return;
        }
        s.segments = [];
        this.resetBall(true);
        break;
      }
    }
  }

  renderLightCycle(ctx, colWhite, colBlack) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) {
      ctx.save();
      const ox = (Math.random() - 0.5) * s.shake;
      const oy = (Math.random() - 0.5) * s.shake;
      ctx.translate(ox, oy);
    }

    // 1. Rails
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // 2. Scoreboard
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, 240, 80);
    ctx.fillText(`${this.enemy.score}`, 720, 80);

    // 3. Laser Grid Segments
    ctx.save();
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    for (const seg of s.segments) {
      ctx.beginPath();
      ctx.moveTo(Math.round(seg.x1), Math.round(seg.y1));
      ctx.lineTo(Math.round(seg.x2), Math.round(seg.y2));
      ctx.stroke();

      // Laser joint node
      ctx.fillStyle = colWhite;
      ctx.fillRect(Math.round(seg.x2) - 2, Math.round(seg.y2) - 2, 4, 4);
    }
    ctx.restore();

    // 4. Sparks
    ctx.fillStyle = colWhite;
    for (const sp of s.sparks) {
      ctx.fillRect(Math.round(sp.x), Math.round(sp.y), 2, 2);
    }

    // 5. Paddles & Ball
    ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
    ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);
    ctx.fillRect(Math.round(b.x - b.size / 2), Math.round(b.y - b.size / 2), b.size, b.size);

    if (s.shake > 0) {
      ctx.restore();
    }
  }


  // ========================================================
  // GRAVITY FLIP PONG (Level 61)
  // "Predictable parabolic arcs with paddle/space flips!"
  // ========================================================
  initGravityFlip(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.w = 12;
    this.player.h = 88;
    this.enemy.w = 12;
    this.enemy.h = 88;

    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - this.player.h) / 2;
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = (CANVAS_HEIGHT - this.enemy.h) / 2;

    this.modeState = {
      gravityDir: 1, // 1 = down, -1 = up
      gravityMag: 8.5, // gentle predictable parabolic arc
      trail: [],
      shake: 0,
      spaceDebounce: false,
      serveTimer: 0.5
    };

    this.resetBall(true);
  }

  updateGravityFlip(dt) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 25);

    // Player keyboard movement (fast & agile)
    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * 9.2;
    this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));

    // Space key manual gravity flip
    if (this.keys[' '] && !s.spaceDebounce) {
      s.gravityDir = -s.gravityDir;
      s.spaceDebounce = true;
      s.shake = 2;
      window.Sound?.play('flap');
    }
    if (!this.keys[' ']) s.spaceDebounce = false;

    // Enemy AI
    const diff = this.difficulty;
    let aiSpeed = 4.4;
    let deadzone = 12;
    if (diff === 'easy') { aiSpeed = 3.2; deadzone = 18; }
    else if (diff === 'hard') { aiSpeed = 5.4; deadzone = 6; }
    else if (diff === 'impossible') { aiSpeed = 6.8; deadzone = 2; }

    const isHeadingToEnemy = b.vx > 0;
    if (isHeadingToEnemy) {
      const targetEnemyY = b.y - this.enemy.h / 2;
      const enemyDiff = targetEnemyY - this.enemy.y;
      if (Math.abs(enemyDiff) > deadzone) {
        this.enemy.y += Math.sign(enemyDiff) * Math.min(Math.abs(enemyDiff), aiSpeed);
      }
    } else {
      const centerDiff = (CANVAS_HEIGHT - this.enemy.h) / 2 - this.enemy.y;
      if (Math.abs(centerDiff) > 10) {
        this.enemy.y += Math.sign(centerDiff) * Math.min(Math.abs(centerDiff), 1.2);
      }
    }
    this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));

    if (s.serveTimer > 0) {
      s.serveTimer -= dt;
      return;
    }

    // Ball Physics with Ballistic Vertical Gravity
    s.trail.push({ x: b.x, y: b.y });
    if (s.trail.length > 8) s.trail.shift();

    const subSteps = 2;
    const dtSub = 1 / subSteps;
    const r = b.size / 2;

    for (let step = 0; step < subSteps; step++) {
      // Accelerate vertically under gentle gravity
      b.vy += s.gravityDir * s.gravityMag * 0.016 * dtSub;
      b.x += b.vx * dtSub;
      b.y += b.vy * dtSub;

      // Normal elastic rail bounces (NO chaotic gravity flip on rails!)
      if (b.y - r <= 38) {
        b.y = 38 + r;
        b.vy = Math.abs(b.vy);
        window.Sound?.play('wall');
      } else if (b.y + r >= CANVAS_HEIGHT - 38) {
        b.y = CANVAS_HEIGHT - 38 - r;
        b.vy = -Math.abs(b.vy);
        window.Sound?.play('wall');
      }

      // Paddle collisions - Flip gravity on paddle return for rhythmic lobs!
      if (b.vx < 0 && b.x - r <= this.player.x + this.player.w &&
          b.x + r >= this.player.x &&
          b.y + r >= this.player.y && b.y - r <= this.player.y + this.player.h) {
        b.x = this.player.x + this.player.w + r;
        const offset = (b.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
        const angle = offset * 0.90;
        let curSpd = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        s.gravityDir = -s.gravityDir; // Rhythmic alternation on paddle return
        window.Sound?.play('hit');
        s.shake = 2;
      }

      if (b.vx > 0 && b.x + r >= this.enemy.x && b.x - r <= this.enemy.x + this.enemy.w &&
          b.y + r >= this.enemy.y && b.y - r <= this.enemy.y + this.enemy.h) {
        b.x = this.enemy.x - r;
        const offset = (b.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
        const angle = offset * 0.90;
        let curSpd = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = -Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        s.gravityDir = -s.gravityDir; // Rhythmic alternation on paddle return
        window.Sound?.play('hit');
        s.shake = 2;
      }

      // Goal detection
      if (b.x >= CANVAS_WIDTH) {
        this.player.score++;
        window.Sound?.play('score');
        if (this.player.score >= 5) {
          this.showResult(true, 'GRAVITY CHAMPION!');
          return;
        }
        s.trail = [];
        this.resetBall(false);
        break;
      } else if (b.x <= 0) {
        this.enemy.score++;
        window.Sound?.play('wall');
        if (this.enemy.score >= 5) {
          this.showResult(false, 'GRAVITY COLLAPSE');
          return;
        }
        s.trail = [];
        this.resetBall(true);
        break;
      }
    }
  }

  renderGravityFlip(ctx, colWhite, colBlack) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) {
      ctx.save();
      const ox = (Math.random() - 0.5) * s.shake;
      const oy = (Math.random() - 0.5) * s.shake;
      ctx.translate(ox, oy);
    }

    // 1. Rails
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // 2. Scoreboard
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, 240, 80);
    ctx.fillText(`${this.enemy.score}`, 720, 80);

    // 3. Gravity Direction Chevrons along net line
    ctx.save();
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    for (let y = 60; y < CANVAS_HEIGHT - 60; y += 45) {
      ctx.beginPath();
      if (s.gravityDir > 0) {
        ctx.moveTo(CANVAS_WIDTH / 2 - 8, y - 4);
        ctx.lineTo(CANVAS_WIDTH / 2, y + 4);
        ctx.lineTo(CANVAS_WIDTH / 2 + 8, y - 4);
      } else {
        ctx.moveTo(CANVAS_WIDTH / 2 - 8, y + 4);
        ctx.lineTo(CANVAS_WIDTH / 2, y - 4);
        ctx.lineTo(CANVAS_WIDTH / 2 + 8, y + 4);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 4. Parabolic trajectory trail
    ctx.fillStyle = colWhite;
    for (let i = 0; i < s.trail.length; i++) {
      const pt = s.trail[i];
      const sz = Math.max(1, Math.round((i / s.trail.length) * 4));
      ctx.fillRect(Math.round(pt.x - sz / 2), Math.round(pt.y - sz / 2), sz, sz);
    }

    // 5. Paddles & Ball
    ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
    ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);
    ctx.fillRect(Math.round(b.x - b.size / 2), Math.round(b.y - b.size / 2), b.size, b.size);

    if (s.shake > 0) {
      ctx.restore();
    }
  }


  // ========================================================
  // POLARITY PONG (Level 62)
  // "Electromagnetic polarities! Attract and repel the ball."
  // ========================================================
  initPolarity(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.w = 14;
    this.player.h = 76;
    this.enemy.w = 14;
    this.enemy.h = 76;

    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - this.player.h) / 2;
    this.enemy.x = CANVAS_WIDTH - 44;
    this.enemy.y = (CANVAS_HEIGHT - this.enemy.h) / 2;

    this.modeState = {
      playerPolarity: 1,  // 1 = Alpha (Solid White), -1 = Omega (Hollow)
      enemyPolarity: -1,
      ballPolarity: 1,
      polarityTimer: 4.0,
      spaceDebounce: false,
      shake: 0,
      serveTimer: 0.5
    };

    this.resetBall(true);
  }

  updatePolarity(dt) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 25);

    // Player keyboard movement
    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * 8.5;
    this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));

    // SPACE: Toggle player paddle polarity
    if (this.keys[' '] && !s.spaceDebounce) {
      s.playerPolarity = -s.playerPolarity;
      s.spaceDebounce = true;
      s.shake = 2;
      window.Sound?.play('laser');
    }
    if (!this.keys[' ']) s.spaceDebounce = false;

    // AI logic & Polarity switching
    const diff = this.difficulty;
    let aiSpeed = 4.4;
    let deadzone = 12;
    if (diff === 'easy') { aiSpeed = 3.2; deadzone = 18; }
    else if (diff === 'hard') { aiSpeed = 5.4; deadzone = 6; }
    else if (diff === 'impossible') { aiSpeed = 6.8; deadzone = 2; }

    const isHeadingToEnemy = b.vx > 0;
    if (isHeadingToEnemy) {
      const targetEnemyY = b.y - this.enemy.h / 2;
      const enemyDiff = targetEnemyY - this.enemy.y;
      if (Math.abs(enemyDiff) > deadzone) {
        this.enemy.y += Math.sign(enemyDiff) * Math.min(Math.abs(enemyDiff), aiSpeed);
      }
      if (b.x > CANVAS_WIDTH - 220) {
        s.enemyPolarity = s.ballPolarity;
      }
    } else {
      const centerDiff = (CANVAS_HEIGHT - this.enemy.h) / 2 - this.enemy.y;
      if (Math.abs(centerDiff) > 10) {
        this.enemy.y += Math.sign(centerDiff) * Math.min(Math.abs(centerDiff), 1.2);
      }
    }
    this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));

    s.polarityTimer -= dt;
    if (s.polarityTimer <= 0) {
      s.polarityTimer = 4.5;
      s.ballPolarity = -s.ballPolarity;
      window.Sound?.play('wall');
    }

    if (s.serveTimer > 0) {
      s.serveTimer -= dt;
      return;
    }

    // Magnetic Field Forces between ball and paddles
    for (const [pad, pol] of [[this.player, s.playerPolarity], [this.enemy, s.enemyPolarity]]) {
      const padCenterX = pad.x + pad.w / 2;
      const padCenterY = pad.y + pad.h / 2;
      const dx = b.x - padCenterX;
      const dy = b.y - padCenterY;
      const dist = Math.hypot(dx, dy);

      if (dist < 95 && dist > 1) {
        const nx = dx / dist;
        const ny = dy / dist;
        const isSamePolarity = (pol === s.ballPolarity);

        if (isSamePolarity) {
          const force = (95 - dist) * 0.28;
          b.vx += nx * force;
          b.vy += ny * force * 0.4;
        } else {
          const force = (95 - dist) * 0.22;
          b.vx -= nx * force;
          b.vy -= ny * force;
        }
      }
    }

    const subSteps = 2;
    const dtSub = 1 / subSteps;
    const r = b.size / 2;

    for (let step = 0; step < subSteps; step++) {
      b.x += b.vx * dtSub;
      b.y += b.vy * dtSub;

      if (b.y - r <= 38) {
        b.y = 38 + r;
        b.vy = Math.abs(b.vy);
        window.Sound?.play('wall');
      } else if (b.y + r >= CANVAS_HEIGHT - 38) {
        b.y = CANVAS_HEIGHT - 38 - r;
        b.vy = -Math.abs(b.vy);
        window.Sound?.play('wall');
      }

      if (b.vx < 0 && b.x - r <= this.player.x + this.player.w &&
          b.x + r >= this.player.x &&
          b.y + r >= this.player.y && b.y - r <= this.player.y + this.player.h) {
        b.x = this.player.x + this.player.w + r;
        const offset = (b.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
        const angle = offset * 0.92;
        let curSpd = Math.min(14.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      if (b.vx > 0 && b.x + r >= this.enemy.x && b.x - r <= this.enemy.x + this.enemy.w &&
          b.y + r >= this.enemy.y && b.y - r <= this.enemy.y + this.enemy.h) {
        b.x = this.enemy.x - r;
        const offset = (b.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
        const angle = offset * 0.92;
        let curSpd = Math.min(14.0, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = -Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      if (b.x >= CANVAS_WIDTH) {
        this.player.score++;
        window.Sound?.play('score');
        if (this.player.score >= 5) {
          this.showResult(true, 'POLARITY MASTER!');
          return;
        }
        this.resetBall(false);
        break;
      } else if (b.x <= 0) {
        this.enemy.score++;
        window.Sound?.play('wall');
        if (this.enemy.score >= 5) {
          this.showResult(false, 'POLARITY OVERLOAD');
          return;
        }
        this.resetBall(true);
        break;
      }
    }
  }

  renderPolarity(ctx, colWhite, colBlack) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) {
      ctx.save();
      const ox = (Math.random() - 0.5) * s.shake;
      const oy = (Math.random() - 0.5) * s.shake;
      ctx.translate(ox, oy);
    }

    // 1. Rails
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // 2. Scoreboard
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, 240, 80);
    ctx.fillText(`${this.enemy.score}`, 720, 80);

    // 3. Center Line
    ctx.save();
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 38);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 38);
    ctx.stroke();

    // 4. Magnetic Field Rings
    ctx.setLineDash([3, 4]);
    for (const [pad, pol] of [[this.player, s.playerPolarity], [this.enemy, s.enemyPolarity]]) {
      ctx.beginPath();
      ctx.arc(pad.x + pad.w / 2, pad.y + pad.h / 2, 85, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 5. Paddles
    if (s.playerPolarity === 1) {
      ctx.fillStyle = colWhite;
      ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
    } else {
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(this.player.x) + 1, Math.round(this.player.y) + 1, this.player.w - 2, this.player.h - 2);
      ctx.fillStyle = colBlack;
      ctx.fillRect(Math.round(this.player.x) + 3, Math.round(this.player.y) + 3, this.player.w - 6, this.player.h - 6);
    }

    if (s.enemyPolarity === 1) {
      ctx.fillStyle = colWhite;
      ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);
    } else {
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(this.enemy.x) + 1, Math.round(this.enemy.y) + 1, this.enemy.w - 2, this.enemy.h - 2);
      ctx.fillStyle = colBlack;
      ctx.fillRect(Math.round(this.enemy.x) + 3, Math.round(this.enemy.y) + 3, this.enemy.w - 6, this.enemy.h - 6);
    }

    // 6. Ball
    if (s.ballPolarity === 1) {
      ctx.fillStyle = colWhite;
      ctx.fillRect(Math.round(b.x - b.size / 2), Math.round(b.y - b.size / 2), b.size, b.size);
      ctx.fillStyle = colBlack;
      ctx.fillRect(Math.round(b.x - 1), Math.round(b.y - 1), 2, 2);
    } else {
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(b.x - b.size / 2) + 1, Math.round(b.y - b.size / 2) + 1, b.size - 2, b.size - 2);
      ctx.fillStyle = colBlack;
      ctx.fillRect(Math.round(b.x - b.size / 2) + 2, Math.round(b.y - b.size / 2) + 2, b.size - 4, b.size - 4);
      ctx.fillStyle = colWhite;
      ctx.fillRect(Math.round(b.x - 1), Math.round(b.y - 1), 2, 2);
    }

    if (s.shake > 0) {
      ctx.restore();
    }
  }


  // ========================================================
  // SNAKE PONG (Level 63)
  // "The ball is an undulating retro snake that grows with food!"
  // ========================================================
  initSnakePong(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.w = 12;
    this.player.h = 76;
    this.enemy.w = 12;
    this.enemy.h = 76;

    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - this.player.h) / 2;
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = (CANVAS_HEIGHT - this.enemy.h) / 2;

    const startX = CANVAS_WIDTH / 2;
    const startY = CANVAS_HEIGHT / 2;
    const segments = [];
    for (let i = 0; i < 5; i++) {
      segments.push({ x: startX - i * 10, y: startY });
    }

    this.modeState = {
      segments,
      history: [],
      vx: 7.5,
      vy: 2.2,
      food: { x: 480, y: 180, size: 20 }, // Big apple!
      particles: [],
      shake: 0,
      serveTimer: 0.5
    };
  }

  resetSnakePong(serveToPlayer = true) {
    const s = this.modeState;
    if (!s) return;
    const startX = CANVAS_WIDTH / 2;
    const startY = CANVAS_HEIGHT / 2;
    s.segments = [];
    for (let i = 0; i < 5; i++) {
      s.segments.push({ x: startX - i * 10, y: startY });
    }
    s.history = [];
    s.vx = (serveToPlayer ? -1 : 1) * 7.5;
    s.vy = (Math.random() - 0.5) * 4.0;
    s.serveTimer = 0.5;
  }

  updateSnakePong(dt) {
    const s = this.modeState;
    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 25);

    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) s.particles.splice(i, 1);
    }

    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * 8.5;
    this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));

    const head = s.segments[0];
    const diff = this.difficulty;
    let aiSpeed = 4.2;
    let deadzone = 12;
    if (diff === 'easy') { aiSpeed = 3.2; deadzone = 18; }
    else if (diff === 'hard') { aiSpeed = 5.2; deadzone = 6; }
    else if (diff === 'impossible') { aiSpeed = 6.6; deadzone = 2; }

    const isHeadingToEnemy = s.vx > 0;
    if (isHeadingToEnemy) {
      const targetEnemyY = head.y - this.enemy.h / 2;
      const enemyDiff = targetEnemyY - this.enemy.y;
      if (Math.abs(enemyDiff) > deadzone) {
        this.enemy.y += Math.sign(enemyDiff) * Math.min(Math.abs(enemyDiff), aiSpeed);
      }
    } else {
      const centerDiff = (CANVAS_HEIGHT - this.enemy.h) / 2 - this.enemy.y;
      if (Math.abs(centerDiff) > 10) {
        this.enemy.y += Math.sign(centerDiff) * Math.min(Math.abs(centerDiff), 1.2);
      }
    }
    this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));

    if (s.serveTimer > 0) {
      s.serveTimer -= dt;
      return;
    }

    s.history.unshift({ x: head.x, y: head.y });
    if (s.history.length > s.segments.length * 6) {
      s.history.pop();
    }

    head.x += s.vx;
    head.y += s.vy;

    for (let i = 1; i < s.segments.length; i++) {
      const histIndex = Math.min(s.history.length - 1, i * 5);
      if (s.history[histIndex]) {
        s.segments[i].x = s.history[histIndex].x;
        s.segments[i].y = s.history[histIndex].y;
      }
    }

    const r = 6;
    if (head.y - r <= 38) {
      head.y = 38 + r;
      s.vy = Math.abs(s.vy);
      window.Sound?.play('wall');
    } else if (head.y + r >= CANVAS_HEIGHT - 38) {
      head.y = CANVAS_HEIGHT - 38 - r;
      s.vy = -Math.abs(s.vy);
      window.Sound?.play('wall');
    }

    // Generous eating radius for the big apple
    if (Math.hypot(head.x - s.food.x, head.y - s.food.y) < 22) {
      if (s.segments.length < 18) {
        const lastSeg = s.segments[s.segments.length - 1];
        s.segments.push({ x: lastSeg.x, y: lastSeg.y });
      }
      s.food.x = 280 + Math.random() * 400;
      s.food.y = 90 + Math.random() * 340;
      window.Sound?.play('score');
      s.shake = 3;

      for (let k = 0; k < 8; k++) {
        s.particles.push({
          x: head.x, y: head.y,
          vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
          life: 0.28, maxLife: 0.28
        });
      }
    }

    if (s.vx < 0 && head.x - r <= this.player.x + this.player.w &&
        head.x + r >= this.player.x &&
        head.y + r >= this.player.y && head.y - r <= this.player.y + this.player.h) {
      head.x = this.player.x + this.player.w + r;
      const offset = (head.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
      const angle = offset * 0.92;
      let curSpd = Math.min(13.5, Math.hypot(s.vx, s.vy) * 1.05 + 0.2);
      s.vx = Math.abs(Math.cos(angle) * curSpd);
      s.vy = Math.sin(angle) * curSpd;
      window.Sound?.play('hit');
    }

    if (s.vx > 0 && head.x + r >= this.enemy.x && head.x - r <= this.enemy.x + this.enemy.w &&
        head.y + r >= this.enemy.y && head.y - r <= this.enemy.y + this.enemy.h) {
      head.x = this.enemy.x - r;
      const offset = (head.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
      const angle = offset * 0.92;
      let curSpd = Math.min(13.5, Math.hypot(s.vx, s.vy) * 1.05 + 0.2);
      s.vx = -Math.abs(Math.cos(angle) * curSpd);
      s.vy = Math.sin(angle) * curSpd;
      window.Sound?.play('hit');
    }

    if (head.x >= CANVAS_WIDTH) {
      this.player.score++;
      window.Sound?.play('score');
      if (this.player.score >= 5) {
        this.showResult(true, 'SNAKE MASTER!');
        return;
      }
      this.resetSnakePong(false);
    } else if (head.x <= 0) {
      this.enemy.score++;
      window.Sound?.play('wall');
      if (this.enemy.score >= 5) {
        this.showResult(false, 'SNAKE BITE');
        return;
      }
      this.resetSnakePong(true);
    }
  }

  renderSnakePong(ctx, colWhite, colBlack) {
    const s = this.modeState;

    if (s.shake > 0) {
      ctx.save();
      const ox = (Math.random() - 0.5) * s.shake;
      const oy = (Math.random() - 0.5) * s.shake;
      ctx.translate(ox, oy);
    }

    // 1. Rails
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // 2. Scoreboard
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, 240, 80);
    ctx.fillText(`${this.enemy.score}`, 720, 80);

    // 3. Big Chunky Retro Apple (20x20 pixel art)
    ctx.fillStyle = colWhite;
    const fx = Math.round(s.food.x);
    const fy = Math.round(s.food.y);
    // Apple main rounded body
    ctx.fillRect(fx - 9, fy - 6, 18, 14);
    ctx.fillRect(fx - 7, fy - 8, 14, 18);
    // Curved stem and leaf at top
    ctx.fillRect(fx - 1, fy - 12, 3, 5);
    ctx.fillRect(fx + 2, fy - 11, 4, 3);
    // Apple bottom indent & interior shading
    ctx.fillStyle = colBlack;
    ctx.fillRect(fx - 2, fy + 8, 4, 2);
    // Shiny highlight on shoulder
    ctx.fillStyle = colWhite;
    ctx.fillRect(fx - 6, fy - 5, 3, 3);

    // 4. Snake Body
    for (let i = s.segments.length - 1; i >= 1; i--) {
      const seg = s.segments[i];
      const sz = 9;
      ctx.fillRect(Math.round(seg.x - sz / 2), Math.round(seg.y - sz / 2), sz, sz);
      ctx.fillStyle = colBlack;
      ctx.fillRect(Math.round(seg.x - 1), Math.round(seg.y - 1), 2, 2);
      ctx.fillStyle = colWhite;
    }

    // 5. Snake Head with eyes
    const head = s.segments[0];
    ctx.fillRect(Math.round(head.x - 6), Math.round(head.y - 6), 12, 12);
    ctx.fillStyle = colBlack;
    if (s.vx >= 0) {
      ctx.fillRect(Math.round(head.x + 2), Math.round(head.y - 4), 2, 2);
      ctx.fillRect(Math.round(head.x + 2), Math.round(head.y + 2), 2, 2);
    } else {
      ctx.fillRect(Math.round(head.x - 4), Math.round(head.y - 4), 2, 2);
      ctx.fillRect(Math.round(head.x - 4), Math.round(head.y + 2), 2, 2);
    }

    // 6. Particles
    ctx.fillStyle = colWhite;
    for (const p of s.particles) {
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }

    // 7. Paddles
    ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
    ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);

    if (s.shake > 0) {
      ctx.restore();
    }
  }


  // =========================================
  // LEVEL 64: CHRONO PONG
  // "Hold SPACE to rewind time! Step backwards up to 2.5 seconds to undo missed shots."
  // =========================================
  initChrono(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.w = 12;
    this.player.h = 80;
    this.enemy.w = 12;
    this.enemy.h = 80;

    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - this.player.h) / 2;
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = (CANVAS_HEIGHT - this.enemy.h) / 2;

    this.modeState = {
      history: [],        // circular buffer of past game states (up to 150 frames = 2.5s)
      rewinding: false,   // true while holding SPACE with charges
      rewindCharges: 3,   // 3 rewinds per point/round
      maxCharges: 3,
      rewindDuration: 0,  // seconds rewound in current sequence
      ghosts: [],         // afterimage ghost frames
      scanlineY: 0,
      shake: 0,
      serveTimer: 0.5
    };

    this.resetBall(true);
  }

  updateChrono(dt) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 25);
    s.scanlineY = (s.scanlineY + dt * 240) % CANVAS_HEIGHT;

    // Decay ghost afterimages
    for (let i = s.ghosts.length - 1; i >= 0; i--) {
      s.ghosts[i].alpha -= dt * 2.5;
      if (s.ghosts[i].alpha <= 0) s.ghosts.splice(i, 1);
    }

    // CHECK REWIND ACTIVATION (HOLD SPACE)
    const wantsRewind = !!this.keys[' '];
    if (wantsRewind && s.rewindCharges > 0 && s.history.length > 5 && s.serveTimer <= 0) {
      if (!s.rewinding) {
        s.rewinding = true;
        s.rewindDuration = 0;
        window.Sound?.play('wall');
      }

      // Step backwards through history at 2x rewind speed (pop 2 frames per tick)
      for (let step = 0; step < 2; step++) {
        if (s.history.length > 3) {
          const snapshot = s.history.pop();
          b.x = snapshot.bx;
          b.y = snapshot.by;
          b.vx = snapshot.bvx;
          b.vy = snapshot.bvy;
          this.player.y = snapshot.py;
          this.enemy.y = snapshot.ey;
          this.player.score = snapshot.pScore;
          this.enemy.score = snapshot.eScore;

          // Record ghost afterimage
          if (step === 0 && Math.random() < 0.6) {
            s.ghosts.push({
              bx: b.x, by: b.y,
              py: this.player.y, ey: this.enemy.y,
              alpha: 0.5
            });
          }
        } else {
          // Reached beginning of recorded history
          break;
        }
      }

      s.rewindDuration += dt;
      return; // Skip forward simulation while rewinding!
    } else {
      if (s.rewinding) {
        // Rewind released!
        s.rewinding = false;
        s.rewindCharges = Math.max(0, s.rewindCharges - 1);
        window.Sound?.play('portal');
        s.shake = 4;
      }
    }

    // RECORD FORWARD HISTORY
    if (s.serveTimer <= 0) {
      s.history.push({
        bx: b.x,
        by: b.y,
        bvx: b.vx,
        bvy: b.vy,
        py: this.player.y,
        ey: this.enemy.y,
        pScore: this.player.score,
        eScore: this.enemy.score
      });
      // Cap at 150 frames (2.5 seconds of rewindable buffer)
      if (s.history.length > 150) {
        s.history.shift();
      }
    }

    // NORMAL PLAYER MOVEMENT (during forward time)
    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * 8.5;
    this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));

    // ENEMY AI MOVEMENT
    const diff = this.difficulty;
    let aiSpeed = 4.6;
    let deadzone = 10;
    if (diff === 'easy') { aiSpeed = 3.4; deadzone = 16; }
    else if (diff === 'hard') { aiSpeed = 5.6; deadzone = 6; }
    else if (diff === 'impossible') { aiSpeed = 7.0; deadzone = 2; }

    const isHeadingToEnemy = b.vx > 0;
    if (isHeadingToEnemy) {
      const targetEnemyY = b.y - this.enemy.h / 2;
      const enemyDiff = targetEnemyY - this.enemy.y;
      if (Math.abs(enemyDiff) > deadzone) {
        this.enemy.y += Math.sign(enemyDiff) * Math.min(Math.abs(enemyDiff), aiSpeed);
      }
    } else {
      const centerDiff = (CANVAS_HEIGHT - this.enemy.h) / 2 - this.enemy.y;
      if (Math.abs(centerDiff) > 10) {
        this.enemy.y += Math.sign(centerDiff) * Math.min(Math.abs(centerDiff), 1.4);
      }
    }
    this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));

    // SERVE DELAY
    if (s.serveTimer > 0) {
      s.serveTimer -= dt;
      return;
    }

    // BALL PHYSICS
    b.x += b.vx;
    b.y += b.vy;

    // Top / Bottom Rail Collisions
    if (b.y - b.size / 2 <= 38) {
      b.y = 38 + b.size / 2;
      b.vy = Math.abs(b.vy);
      window.Sound?.play('wall');
    } else if (b.y + b.size / 2 >= CANVAS_HEIGHT - 38) {
      b.y = CANVAS_HEIGHT - 38 - b.size / 2;
      b.vy = -Math.abs(b.vy);
      window.Sound?.play('wall');
    }

    // Player Paddle Collision
    if (b.vx < 0 &&
        b.x - b.size / 2 <= this.player.x + this.player.w &&
        b.x + b.size / 2 >= this.player.x &&
        b.y + b.size / 2 >= this.player.y &&
        b.y - b.size / 2 <= this.player.y + this.player.h) {
      b.x = this.player.x + this.player.w + b.size / 2;
      const hitOffset = (b.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
      const speed = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05);
      const angle = hitOffset * (Math.PI / 3.4);
      b.vx = Math.cos(angle) * speed;
      b.vy = Math.sin(angle) * speed;
      window.Sound?.play('hit');
    }

    // Enemy Paddle Collision
    if (b.vx > 0 &&
        b.x + b.size / 2 >= this.enemy.x &&
        b.x - b.size / 2 <= this.enemy.x + this.enemy.w &&
        b.y + b.size / 2 >= this.enemy.y &&
        b.y - b.size / 2 <= this.enemy.y + this.enemy.h) {
      b.x = this.enemy.x - b.size / 2;
      const hitOffset = (b.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
      const speed = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05);
      const angle = Math.PI - hitOffset * (Math.PI / 3.4);
      b.vx = Math.cos(angle) * speed;
      b.vy = Math.sin(angle) * speed;
      window.Sound?.play('hit');
    }

    // GOALS / SCORING
    if (b.x < 10) {
      this.enemy.score++;
      window.Sound?.play('lose');
      if (this.enemy.score >= 5) {
        this.showResult(false);
        return;
      }
      s.serveTimer = 0.6;
      s.rewindCharges = 3; // Refill 3 charges on serve
      s.history = [];
      this.resetBall(true);
    } else if (b.x > CANVAS_WIDTH - 10) {
      this.player.score++;
      window.Sound?.play('score');
      if (this.player.score >= 5) {
        this.showResult(true);
        return;
      }
      s.serveTimer = 0.6;
      s.rewindCharges = 3; // Refill 3 charges on serve
      s.history = [];
      this.resetBall(false);
    }
  }

  renderChrono(ctx, colWhite, colBlack) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
    }

    // 1. Court Arena
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 36, CANVAS_WIDTH - 60, CANVAS_HEIGHT - 72);

    // Center dashed line
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 38);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 38);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Scoreboard
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, 240, 80);
    ctx.fillText(`${this.enemy.score}`, 720, 80);

    // 3. Chrono HUD (Charges indicator)
    ctx.fillStyle = colWhite;
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'center';
    let chargeStr = 'REWIND [';
    for (let c = 0; c < s.maxCharges; c++) {
      chargeStr += (c < s.rewindCharges) ? ' ■' : ' □';
    }
    chargeStr += ' ]  HOLD SPACE';
    ctx.fillText(chargeStr, CANVAS_WIDTH / 2, 24);

    // 4. Ghost Afterimages
    for (const g of s.ghosts) {
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 1;
      // Stippled ghost paddles
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(Math.round(this.player.x), Math.round(g.py), this.player.w, this.player.h);
      ctx.strokeRect(Math.round(this.enemy.x), Math.round(g.ey), this.enemy.w, this.enemy.h);
      ctx.strokeRect(Math.round(g.bx - b.size / 2), Math.round(g.by - b.size / 2), b.size, b.size);
      ctx.setLineDash([]);
    }

    // 5. Paddles & Ball
    ctx.fillStyle = colWhite;
    ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
    ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);
    ctx.fillRect(Math.round(b.x - b.size / 2), Math.round(b.y - b.size / 2), b.size, b.size);

    // 6. VHS Rewind Overlay Effect (when rewinding)
    if (s.rewinding) {
      // Midfield HUD Glitch Text
      ctx.fillStyle = colWhite;
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('<<< REWINDING <<<', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

      // Rewind tracking lines
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 3]);
      const y1 = (s.scanlineY) % (CANVAS_HEIGHT - 80) + 40;
      const y2 = (s.scanlineY + 140) % (CANVAS_HEIGHT - 80) + 40;
      ctx.beginPath();
      ctx.moveTo(32, y1);
      ctx.lineTo(CANVAS_WIDTH - 32, y1);
      ctx.moveTo(32, y2);
      ctx.lineTo(CANVAS_WIDTH - 32, y2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Corner Timecode
      ctx.font = '12px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('<< REC -00:0' + Math.max(0, Math.floor(s.history.length / 15)), 44, 56);
    }

    if (s.shake > 0) {
      ctx.restore();
    }
  }


  // ========================================================
  // ASTEROIDS PONG (Level 65)
  // "Lethal asteroids: Paddle touches die! Scaled by difficulty."
  // ========================================================
  initAsteroidsPong(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.w = 12;
    this.player.h = 76;
    this.enemy.w = 12;
    this.enemy.h = 76;

    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - this.player.h) / 2;
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = (CANVAS_HEIGHT - this.enemy.h) / 2;

    // The higher the difficulty, the more asteroids!
    const diff = this.difficulty;
    let initialCount = 4; // Normal = 4
    if (diff === 'easy') initialCount = 2;
    else if (diff === 'hard') initialCount = 6;
    else if (diff === 'impossible') initialCount = 8;

    const asteroids = [];
    for (let i = 0; i < initialCount; i++) {
      const x = 330 + Math.random() * 300;
      const y = 80 + (i / initialCount) * (CANVAS_HEIGHT - 160);
      asteroids.push(this.createAsteroid(x, y, 24, 3));
    }

    this.modeState = {
      asteroids,
      debris: [],
      shake: 0,
      serveTimer: 0.6
    };

    this.resetBall(true);
  }

  createAsteroid(x, y, r, tier) {
    const numVerts = 8;
    const verts = [];
    for (let i = 0; i < numVerts; i++) {
      const angle = (i / numVerts) * Math.PI * 2;
      const dist = r * (0.75 + Math.random() * 0.45);
      verts.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
    }
    const angle = Math.random() * Math.PI * 2;
    const spd = 0.5 + Math.random() * 0.8;
    return {
      x, y, r, tier,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      rot: Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 0.03,
      verts
    };
  }

  updateAsteroidsPong(dt) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 25);

    // Debris
    for (let i = s.debris.length - 1; i >= 0; i--) {
      const p = s.debris[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) s.debris.splice(i, 1);
    }

    // Move asteroids
    for (const ast of s.asteroids) {
      ast.x += ast.vx;
      ast.y += ast.vy;
      ast.rot += ast.rotSpd;

      // Bounce asteroids off rails
      if (ast.y - ast.r <= 38) {
        ast.y = 38 + ast.r;
        ast.vy = Math.abs(ast.vy);
      } else if (ast.y + ast.r >= CANVAS_HEIGHT - 38) {
        ast.y = CANVAS_HEIGHT - 38 - ast.r;
        ast.vy = -Math.abs(ast.vy);
      }

      // Keep asteroids in court
      if (ast.x - ast.r <= 40) {
        ast.x = 40 + ast.r;
        ast.vx = Math.abs(ast.vx);
      } else if (ast.x + ast.r >= CANVAS_WIDTH - 40) {
        ast.x = CANVAS_WIDTH - 40 - ast.r;
        ast.vx = -Math.abs(ast.vx);
      }
    }

    // Player keyboard movement
    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * 8.5;
    this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));

    // Enemy AI with Active Asteroid Dodging
    const diff = this.difficulty;
    let aiSpeed = 4.2;
    let deadzone = 12;
    if (diff === 'easy') { aiSpeed = 3.2; deadzone = 18; }
    else if (diff === 'hard') { aiSpeed = 5.2; deadzone = 6; }
    else if (diff === 'impossible') { aiSpeed = 6.6; deadzone = 2; }

    // Check if an asteroid threatens enemy paddle
    let threatY = null;
    for (const ast of s.asteroids) {
      if (ast.x > CANVAS_WIDTH - 160 && Math.abs(ast.y - (this.enemy.y + this.enemy.h / 2)) < ast.r + this.enemy.h / 2 + 10) {
        threatY = ast.y;
        break;
      }
    }

    if (threatY !== null) {
      // Dodge asteroid!
      const dodgeDir = (threatY > this.enemy.y + this.enemy.h / 2) ? -1 : 1;
      this.enemy.y += dodgeDir * aiSpeed;
    } else {
      const isHeadingToEnemy = b.vx > 0;
      if (isHeadingToEnemy) {
        const targetEnemyY = b.y - this.enemy.h / 2;
        const enemyDiff = targetEnemyY - this.enemy.y;
        if (Math.abs(enemyDiff) > deadzone) {
          this.enemy.y += Math.sign(enemyDiff) * Math.min(Math.abs(enemyDiff), aiSpeed);
        }
      } else {
        const centerDiff = (CANVAS_HEIGHT - this.enemy.h) / 2 - this.enemy.y;
        if (Math.abs(centerDiff) > 10) {
          this.enemy.y += Math.sign(centerDiff) * Math.min(Math.abs(centerDiff), 1.2);
        }
      }
    }
    this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));

    // LETHAL ASTEROID COLLISION CHECK WITH PADDLES
    if (s.serveTimer <= 0) {
      // Player paddle lethal collision
      for (let i = s.asteroids.length - 1; i >= 0; i--) {
        const ast = s.asteroids[i];
        if (ast.x + ast.r >= this.player.x && ast.x - ast.r <= this.player.x + this.player.w &&
            ast.y + ast.r >= this.player.y && ast.y - ast.r <= this.player.y + this.player.h) {
          // PLAYER DIES!
          for (let k = 0; k < 12; k++) {
            s.debris.push({
              x: this.player.x + this.player.w / 2,
              y: this.player.y + this.player.h / 2,
              vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
              life: 0.35, maxLife: 0.35
            });
          }
          window.Sound?.play('lose');
          s.shake = 8;
          this.enemy.score++;
          if (this.enemy.score >= 5) {
            this.showResult(false, 'ASTEROID COLLISION');
            return;
          }
          s.serveTimer = 0.6;
          this.resetBall(true);
          // Push threatening asteroid away
          ast.x = 240;
          ast.vx = Math.abs(ast.vx) + 1;
          break;
        }

        // Enemy paddle lethal collision
        if (ast.x + ast.r >= this.enemy.x && ast.x - ast.r <= this.enemy.x + this.enemy.w &&
            ast.y + ast.r >= this.enemy.y && ast.y - ast.r <= this.enemy.y + this.enemy.h) {
          // ENEMY DIES!
          for (let k = 0; k < 12; k++) {
            s.debris.push({
              x: this.enemy.x + this.enemy.w / 2,
              y: this.enemy.y + this.enemy.h / 2,
              vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
              life: 0.35, maxLife: 0.35
            });
          }
          window.Sound?.play('score');
          s.shake = 8;
          this.player.score++;
          if (this.player.score >= 5) {
            this.showResult(true, 'ASTEROID SURVIVOR!');
            return;
          }
          s.serveTimer = 0.6;
          this.resetBall(false);
          ast.x = CANVAS_WIDTH - 240;
          ast.vx = -Math.abs(ast.vx) - 1;
          break;
        }
      }
    }

    if (s.serveTimer > 0) {
      s.serveTimer -= dt;
      return;
    }

    // Ball physics
    const subSteps = 2;
    const dtSub = 1 / subSteps;
    const r = b.size / 2;

    for (let step = 0; step < subSteps; step++) {
      b.x += b.vx * dtSub;
      b.y += b.vy * dtSub;

      // Rail bounces
      if (b.y - r <= 38) {
        b.y = 38 + r;
        b.vy = Math.abs(b.vy);
        window.Sound?.play('wall');
      } else if (b.y + r >= CANVAS_HEIGHT - 38) {
        b.y = CANVAS_HEIGHT - 38 - r;
        b.vy = -Math.abs(b.vy);
        window.Sound?.play('wall');
      }

      // Ball vs Asteroids collision & shatter
      for (let i = s.asteroids.length - 1; i >= 0; i--) {
        const ast = s.asteroids[i];
        const dx = b.x - ast.x;
        const dy = b.y - ast.y;
        const dist = Math.hypot(dx, dy);

        if (dist < ast.r + r) {
          const nx = dx / dist;
          const ny = dy / dist;
          b.x = ast.x + nx * (ast.r + r);
          b.y = ast.y + ny * (ast.r + r);

          const dot = b.vx * nx + b.vy * ny;
          b.vx = b.vx - 2 * dot * nx;
          b.vy = b.vy - 2 * dot * ny;

          window.Sound?.play('brick');
          s.shake = 3;

          for (let k = 0; k < 6; k++) {
            s.debris.push({
              x: ast.x, y: ast.y,
              vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
              life: 0.25, maxLife: 0.25
            });
          }

          if (ast.tier === 3) {
            s.asteroids.push(this.createAsteroid(ast.x - 8, ast.y - 8, 14, 2));
            s.asteroids.push(this.createAsteroid(ast.x + 8, ast.y + 8, 14, 2));
          } else if (ast.tier === 2) {
            s.asteroids.push(this.createAsteroid(ast.x - 5, ast.y - 5, 8, 1));
            s.asteroids.push(this.createAsteroid(ast.x + 5, ast.y + 5, 8, 1));
          }
          s.asteroids.splice(i, 1);
          break;
        }
      }

      // Paddle collisions
      if (b.vx < 0 && b.x - r <= this.player.x + this.player.w &&
          b.x + r >= this.player.x &&
          b.y + r >= this.player.y && b.y - r <= this.player.y + this.player.h) {
        b.x = this.player.x + this.player.w + r;
        const offset = (b.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
        const angle = offset * 0.92;
        let curSpd = Math.min(13.5, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      if (b.vx > 0 && b.x + r >= this.enemy.x && b.x - r <= this.enemy.x + this.enemy.w &&
          b.y + r >= this.enemy.y && b.y - r <= this.enemy.y + this.enemy.h) {
        b.x = this.enemy.x - r;
        const offset = (b.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
        const angle = offset * 0.92;
        let curSpd = Math.min(13.5, Math.hypot(b.vx, b.vy) * 1.05 + 0.2);
        b.vx = -Math.abs(Math.cos(angle) * curSpd);
        b.vy = Math.sin(angle) * curSpd;
        window.Sound?.play('hit');
      }

      // Goals
      if (b.x >= CANVAS_WIDTH) {
        this.player.score++;
        window.Sound?.play('score');
        if (this.player.score >= 5) {
          this.showResult(true, 'ASTEROIDS ACE!');
          return;
        }
        this.resetBall(false);
        break;
      } else if (b.x <= 0) {
        this.enemy.score++;
        window.Sound?.play('wall');
        if (this.enemy.score >= 5) {
          this.showResult(false, 'DRIFTED AWAY');
          return;
        }
        this.resetBall(true);
        break;
      }
    }
  }

  renderAsteroidsPong(ctx, colWhite, colBlack) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) {
      ctx.save();
      const ox = (Math.random() - 0.5) * s.shake;
      const oy = (Math.random() - 0.5) * s.shake;
      ctx.translate(ox, oy);
    }

    // 1. Rails
    ctx.fillStyle = colWhite;
    ctx.fillRect(0, 34, CANVAS_WIDTH, 4);
    ctx.fillRect(0, CANVAS_HEIGHT - 34, CANVAS_WIDTH, 4);

    // 2. Scoreboard
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, 240, 80);
    ctx.fillText(`${this.enemy.score}`, 720, 80);

    // 3. Drifting Vector Asteroids
    ctx.save();
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    for (const ast of s.asteroids) {
      ctx.save();
      ctx.translate(Math.round(ast.x), Math.round(ast.y));
      ctx.rotate(ast.rot);
      ctx.beginPath();
      for (let i = 0; i < ast.verts.length; i++) {
        const v = ast.verts[i];
        if (i === 0) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // 4. Debris
    ctx.fillStyle = colWhite;
    for (const p of s.debris) {
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }

    // 5. Paddles & Ball
    ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
    ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);
    ctx.fillRect(Math.round(b.x - b.size / 2), Math.round(b.y - b.size / 2), b.size, b.size);

    if (s.shake > 0) {
      ctx.restore();
    }
  }


  // =========================================
  // LEVEL 66: TIME BOMB PONG
  // "The ball is an armed time bomb! Countdown accelerates on hits. Detonates in a shrapnel explosion."
  // =========================================
  getNewBombTimer() {
    // Unpredictable randomized fuse between 3.5s and 8.5s
    return Number((3.5 + Math.random() * 5.0).toFixed(1));
  }

  initTimeBomb(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.w = 12;
    this.player.h = 80;
    this.enemy.w = 12;
    this.enemy.h = 80;

    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - this.player.h) / 2;
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = (CANVAS_HEIGHT - this.enemy.h) / 2;

    const initialFuse = this.getNewBombTimer();
    this.modeState = {
      bombTimer: initialFuse,
      maxBombTime: initialFuse,
      tickInterval: Math.max(0.18, initialFuse / 7.5),
      tickElapsed: 0,
      sparks: [],
      debris: [],
      shockwaves: [],
      shake: 0,
      serveTimer: 0.5
    };

    this.resetBall(true);
  }

  updateTimeBomb(dt) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 25);

    // Shockwaves
    for (let i = s.shockwaves.length - 1; i >= 0; i--) {
      const sw = s.shockwaves[i];
      sw.r += (sw.maxR - sw.r) * 12 * dt;
      sw.life -= dt;
      if (sw.life <= 0) s.shockwaves.splice(i, 1);
    }

    // Explosion Debris
    for (let i = s.debris.length - 1; i >= 0; i--) {
      const d = s.debris[i];
      d.x += d.vx;
      d.y += d.vy;
      d.life -= dt;
      if (d.life <= 0) s.debris.splice(i, 1);
    }

    // Spark particles from bomb fuse
    for (let i = s.sparks.length - 1; i >= 0; i--) {
      const sp = s.sparks[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.life -= dt;
      if (sp.life <= 0) s.sparks.splice(i, 1);
    }

    // Player keyboard movement
    let dir = 0;
    if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
    this.player.y += dir * 8.5;
    this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));

    // Enemy AI Movement
    const diff = this.difficulty;
    let aiSpeed = 4.8;
    let deadzone = 8;
    if (diff === 'easy') { aiSpeed = 3.6; deadzone = 14; }
    else if (diff === 'hard') { aiSpeed = 5.8; deadzone = 5; }
    else if (diff === 'impossible') { aiSpeed = 7.4; deadzone = 2; }

    const isHeadingToEnemy = b.vx > 0;
    if (isHeadingToEnemy) {
      const targetEnemyY = b.y - this.enemy.h / 2;
      const enemyDiff = targetEnemyY - this.enemy.y;
      if (Math.abs(enemyDiff) > deadzone) {
        this.enemy.y += Math.sign(enemyDiff) * Math.min(Math.abs(enemyDiff), aiSpeed);
      }
    } else {
      const centerDiff = (CANVAS_HEIGHT - this.enemy.h) / 2 - this.enemy.y;
      if (Math.abs(centerDiff) > 10) {
        this.enemy.y += Math.sign(centerDiff) * Math.min(Math.abs(centerDiff), 1.4);
      }
    }
    this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));

    // SERVE DELAY
    if (s.serveTimer > 0) {
      s.serveTimer -= dt;
      return;
    }

    // COUNTDOWN & FUSE SPARK TICKS
    s.bombTimer -= dt;
    s.tickElapsed += dt;

    // Fuse spark emitting from bomb top
    if (Math.random() < 0.6) {
      s.sparks.push({
        x: b.x + (Math.random() - 0.5) * 4,
        y: b.y - 10 + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 3,
        life: 0.18
      });
    }

    if (s.tickElapsed >= s.tickInterval) {
      s.tickElapsed = 0;
      window.Sound?.play('wall');
    }

    // DETONATION (KABOOM!)
    if (s.bombTimer <= 0) {
      // Explode!
      s.shockwaves.push({ x: b.x, y: b.y, r: 8, maxR: 70, life: 0.45 });
      for (let k = 0; k < 28; k++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 9;
        s.debris.push({
          x: b.x, y: b.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0.4
        });
      }
      s.shake = 16;
      window.Sound?.play('lose');

      // Point awarded to side opposite the explosion!
      if (b.x < CANVAS_WIDTH / 2) {
        this.enemy.score++;
        if (this.enemy.score >= 5) {
          this.showResult(false);
          return;
        }
      } else {
        this.player.score++;
        if (this.player.score >= 5) {
          this.showResult(true);
          return;
        }
      }

      const nextFuse = this.getNewBombTimer();
      s.serveTimer = 0.8;
      s.bombTimer = nextFuse;
      s.maxBombTime = nextFuse;
      s.tickInterval = Math.max(0.18, nextFuse / 7.5);
      this.resetBall(b.x < CANVAS_WIDTH / 2);
      return;
    }

    // BALL PHYSICS
    b.x += b.vx;
    b.y += b.vy;

    // Top / Bottom Rail Collisions
    if (b.y - b.size / 2 <= 38) {
      b.y = 38 + b.size / 2;
      b.vy = Math.abs(b.vy);
      window.Sound?.play('wall');
    } else if (b.y + b.size / 2 >= CANVAS_HEIGHT - 38) {
      b.y = CANVAS_HEIGHT - 38 - b.size / 2;
      b.vy = -Math.abs(b.vy);
      window.Sound?.play('wall');
    }

    // Player Paddle Collision
    if (b.vx < 0 &&
        b.x - b.size / 2 <= this.player.x + this.player.w &&
        b.x + b.size / 2 >= this.player.x &&
        b.y + b.size / 2 >= this.player.y &&
        b.y - b.size / 2 <= this.player.y + this.player.h) {
      b.x = this.player.x + this.player.w + b.size / 2;
      const hitOffset = (b.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
      const speed = Math.min(13.5, Math.hypot(b.vx, b.vy) * 1.06);
      const angle = hitOffset * (Math.PI / 3.4);
      b.vx = Math.cos(angle) * speed;
      b.vy = Math.sin(angle) * speed;

      // Shave time off fuse and accelerate tick rate
      s.bombTimer = Math.max(0.5, s.bombTimer - 0.45);
      s.tickInterval = Math.max(0.12, s.bombTimer / 7.5);
      s.shake = 3;
      window.Sound?.play('hit');
    }

    // Enemy Paddle Collision
    if (b.vx > 0 &&
        b.x + b.size / 2 >= this.enemy.x &&
        b.x - b.size / 2 <= this.enemy.x + this.enemy.w &&
        b.y + b.size / 2 >= this.enemy.y &&
        b.y - b.size / 2 <= this.enemy.y + this.enemy.h) {
      b.x = this.enemy.x - b.size / 2;
      const hitOffset = (b.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
      const speed = Math.min(13.5, Math.hypot(b.vx, b.vy) * 1.06);
      const angle = Math.PI - hitOffset * (Math.PI / 3.4);
      b.vx = Math.cos(angle) * speed;
      b.vy = Math.sin(angle) * speed;

      // Shave time off fuse
      s.bombTimer = Math.max(0.5, s.bombTimer - 0.45);
      s.tickInterval = Math.max(0.12, s.bombTimer / 7.5);
      s.shake = 3;
      window.Sound?.play('hit');
    }

    // Normal out-of-bounds goal checks
    if (b.x < 10) {
      this.enemy.score++;
      window.Sound?.play('lose');
      if (this.enemy.score >= 5) {
        this.showResult(false);
        return;
      }
      const nextFuse = this.getNewBombTimer();
      s.serveTimer = 0.6;
      s.bombTimer = nextFuse;
      s.maxBombTime = nextFuse;
      s.tickInterval = Math.max(0.18, nextFuse / 7.5);
      this.resetBall(true);
    } else if (b.x > CANVAS_WIDTH - 10) {
      this.player.score++;
      window.Sound?.play('score');
      if (this.player.score >= 5) {
        this.showResult(true);
        return;
      }
      const nextFuse = this.getNewBombTimer();
      s.serveTimer = 0.6;
      s.bombTimer = nextFuse;
      s.maxBombTime = nextFuse;
      s.tickInterval = Math.max(0.18, nextFuse / 7.5);
      this.resetBall(false);
    }
  }

  renderTimeBomb(ctx, colWhite, colBlack) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
    }

    // 1. Arena Borders (Flash in urgency if timer < 2.0s)
    const isCritical = (s.bombTimer < 2.0 && Math.floor(performance.now() / 120) % 2 === 0);
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);
    ctx.lineWidth = 2;
    if (isCritical) ctx.setLineDash([6, 6]);
    ctx.strokeRect(30, 36, CANVAS_WIDTH - 60, CANVAS_HEIGHT - 72);
    ctx.setLineDash([]);

    // Center dashed line
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 38);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 38);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Scoreboard
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, 240, 80);
    ctx.fillText(`${this.enemy.score}`, 720, 80);

    // 3. Digital Bomb Countdown HUD
    ctx.font = 'bold 14px "Courier New", monospace';
    const timerText = 'BOMB: ' + Math.max(0, s.bombTimer).toFixed(1) + 's';
    ctx.fillText('[ ' + timerText + ' ]', CANVAS_WIDTH / 2, 60);

    // 4. Shockwaves
    for (const sw of s.shockwaves) {
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 5. Sparks and Debris
    ctx.fillStyle = colWhite;
    for (const d of s.debris) {
      ctx.fillRect(Math.round(d.x), Math.round(d.y), 3, 3);
    }
    for (const sp of s.sparks) {
      ctx.fillRect(Math.round(sp.x), Math.round(sp.y), 2, 2);
    }

    // 6. Paddles
    ctx.fillRect(Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);
    ctx.fillRect(Math.round(this.enemy.x), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);

    // 7. Time Bomb Ball (1-bit round bomb with wick & spark)
    ctx.beginPath();
    ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = colWhite;
    ctx.fill();

    // Fuse Wick
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y - 7);
    ctx.quadraticCurveTo(b.x + 4, b.y - 12, b.x + 2, b.y - 15);
    ctx.stroke();

    // Wick Spark Tip
    ctx.fillStyle = colWhite;
    ctx.fillRect(Math.round(b.x + 1), Math.round(b.y - 17), 3, 3);

    if (s.shake > 0) {
      ctx.restore();
    }
  }


  // =========================================
  // LEVEL 67: BULLET HELL PONG
  // "Midfield Danmaku sentinel pulses geometric bullet spirals! Dodge bullet waves and smash the ball through bullet curtains."
  // =========================================
  initBulletHell(aiCfg) {
    this.player.score = 0;
    this.enemy.score = 0;
    this.player.w = 12;
    this.player.h = 80;
    this.enemy.w = 12;
    this.enemy.h = 80;

    this.player.x = 30;
    this.player.y = (CANVAS_HEIGHT - this.player.h) / 2;
    this.enemy.x = CANVAS_WIDTH - 42;
    this.enemy.y = (CANVAS_HEIGHT - this.enemy.h) / 2;

    this.modeState = {
      coreX: CANVAS_WIDTH / 2,
      coreY: CANVAS_HEIGHT / 2,
      coreAngle: 0,
      coreCooldown: 0,
      waveTimer: 0.2,
      waveInterval: 0.65,
      bullets: [],
      sparks: [],
      shockwaves: [],
      playerStun: 0,
      enemyStun: 0,
      shake: 0,
      serveTimer: 0.5
    };

    this.resetBall(true);
    this.ball.x = 260;
  }

  updateBulletHell(dt) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 25);
    if (s.playerStun > 0) s.playerStun = Math.max(0, s.playerStun - dt);
    if (s.enemyStun > 0) s.enemyStun = Math.max(0, s.enemyStun - dt);
    if (s.coreCooldown > 0) s.coreCooldown = Math.max(0, s.coreCooldown - dt);

    // Danmaku Core continuous rotation
    s.coreAngle += dt * 1.6;

    // Pulse geometric bullet rings in unpredictable random directions
    s.waveTimer -= dt;
    if (s.waveTimer <= 0) {
      s.waveTimer = 0.52; // slightly faster pulse cadence
      const diff = this.difficulty;
      const count = (diff === 'hard' ? 8 : (diff === 'impossible' ? 10 : (diff === 'easy' ? 4 : 6)));

      // 1. Pattern ring with randomized angular drift and individual directional offsets
      const baseJitter = (Math.random() - 0.5) * 1.4;
      for (let i = 0; i < count; i++) {
        const randOffset = (Math.random() - 0.5) * 0.7;
        const ang = s.coreAngle + (i * Math.PI * 2 / count) + baseJitter + randOffset;
        const spd = 1.6 + Math.random() * 1.5; // Randomized bullet speed
        s.bullets.push({
          x: s.coreX + Math.cos(ang) * 22,
          y: s.coreY + Math.sin(ang) * 22,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          rot: ang,
          life: 6.0
        });
      }

      // 2. Extra wild stray bullets fired in completely random 360-degree directions
      const extraWildCount = (diff === 'easy') ? 1 : (diff === 'hard' || diff === 'impossible' ? 3 : 2);
      for (let k = 0; k < extraWildCount; k++) {
        const wildAng = Math.random() * Math.PI * 2;
        const wildSpd = 1.4 + Math.random() * 1.8;
        s.bullets.push({
          x: s.coreX + Math.cos(wildAng) * 20,
          y: s.coreY + Math.sin(wildAng) * 20,
          vx: Math.cos(wildAng) * wildSpd,
          vy: Math.sin(wildAng) * wildSpd,
          rot: Math.random() * Math.PI * 2,
          life: 6.0
        });
      }
    }

    // Move bullets
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const bu = s.bullets[i];
      bu.x += bu.vx;
      bu.y += bu.vy;
      bu.rot += dt * 3.5;
      bu.life -= dt;
      if (bu.x < 10 || bu.x > CANVAS_WIDTH - 10 || bu.y < 30 || bu.y > CANVAS_HEIGHT - 30 || bu.life <= 0) {
        s.bullets.splice(i, 1);
      }
    }

    // Shockwaves
    for (let i = s.shockwaves.length - 1; i >= 0; i--) {
      const sw = s.shockwaves[i];
      sw.r += (sw.maxR - sw.r) * 12 * dt;
      sw.life -= dt;
      if (sw.life <= 0) s.shockwaves.splice(i, 1);
    }

    // Sparks
    for (let i = s.sparks.length - 1; i >= 0; i--) {
      const sp = s.sparks[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.life -= dt;
      if (sp.life <= 0) s.sparks.splice(i, 1);
    }

    // Player keyboard movement (if not stunned)
    if (s.playerStun <= 0) {
      let dir = 0;
      if (this.keys['w'] || this.keys['arrowup']) dir -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) dir += 1;
      this.player.y += dir * 8.0;
      this.player.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.player.h, this.player.y));
    }

    // Enemy AI Movement with bullet evasion
    if (s.enemyStun <= 0) {
      const diff = this.difficulty;
      let aiSpeed = 4.6;
      let deadzone = 8;
      if (diff === 'easy') { aiSpeed = 3.2; deadzone = 16; }
      else if (diff === 'hard') { aiSpeed = 5.6; deadzone = 5; }
      else if (diff === 'impossible') { aiSpeed = 7.0; deadzone = 2; }

      const isHeadingToEnemy = b.vx > 0;
      if (isHeadingToEnemy) {
        const targetEnemyY = b.y - this.enemy.h / 2;
        const enemyDiff = targetEnemyY - this.enemy.y;
        if (Math.abs(enemyDiff) > deadzone) {
          this.enemy.y += Math.sign(enemyDiff) * Math.min(Math.abs(enemyDiff), aiSpeed);
        }
      } else {
        const centerDiff = (CANVAS_HEIGHT - this.enemy.h) / 2 - this.enemy.y;
        if (Math.abs(centerDiff) > 10) {
          this.enemy.y += Math.sign(centerDiff) * Math.min(Math.abs(centerDiff), 1.2);
        }
      }
      this.enemy.y = Math.max(38, Math.min(CANVAS_HEIGHT - 38 - this.enemy.h, this.enemy.y));
    }

    // BULLET vs PADDLE COLLISIONS (Stuns paddle)
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const bu = s.bullets[i];

      // Player paddle collision
      if (bu.x >= this.player.x && bu.x <= this.player.x + this.player.w &&
          bu.y >= this.player.y && bu.y <= this.player.y + this.player.h) {
        // Stun player!
        s.playerStun = 0.36;
        s.shake = 5;
        for (let k = 0; k < 6; k++) {
          s.sparks.push({
            x: bu.x, y: bu.y,
            vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
            life: 0.2
          });
        }
        s.bullets.splice(i, 1);
        window.Sound?.play('wall');
        continue;
      }

      // Enemy paddle collision
      if (bu.x >= this.enemy.x && bu.x <= this.enemy.x + this.enemy.w &&
          bu.y >= this.enemy.y && bu.y <= this.enemy.y + this.enemy.h) {
        // Stun enemy!
        s.enemyStun = 0.36;
        s.shake = 5;
        for (let k = 0; k < 6; k++) {
          s.sparks.push({
            x: bu.x, y: bu.y,
            vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
            life: 0.2
          });
        }
        s.bullets.splice(i, 1);
        window.Sound?.play('wall');
        continue;
      }
    }

    // SERVE DELAY
    if (s.serveTimer > 0) {
      s.serveTimer -= dt;
      return;
    }

    // BALL vs BULLET COLLISIONS (Ball shatters bullets!)
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const bu = s.bullets[i];
      if (Math.hypot(b.x - bu.x, b.y - bu.y) < b.size / 2 + 7) {
        // Shatter bullet!
        for (let k = 0; k < 5; k++) {
          s.sparks.push({
            x: bu.x, y: bu.y,
            vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
            life: 0.18
          });
        }
        s.bullets.splice(i, 1);
        window.Sound?.play('hit');
      }
    }

    // BALL vs CENTER CORE COLLISION (EMP Shockwave!)
    if (s.coreCooldown <= 0 && Math.hypot(b.x - s.coreX, b.y - s.coreY) < 24) {
      s.coreCooldown = 0.6;
      const nx = (b.x - s.coreX) / 24;
      const ny = (b.y - s.coreY) / 24;
      const curSpd = Math.hypot(b.vx, b.vy);
      b.vx = nx * Math.max(6.5, curSpd);
      b.vy = ny * Math.max(6.5, curSpd);

      // EMP blast clears all active bullets!
      s.shockwaves.push({ x: s.coreX, y: s.coreY, r: 16, maxR: 120, life: 0.35 });
      for (const bu of s.bullets) {
        s.sparks.push({ x: bu.x, y: bu.y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 0.15 });
      }
      s.bullets = [];
      s.shake = 6;
      window.Sound?.play('portal');
    }

    // BALL PHYSICS
    b.x += b.vx;
    b.y += b.vy;

    // Top / Bottom Rail Collisions
    if (b.y - b.size / 2 <= 38) {
      b.y = 38 + b.size / 2;
      b.vy = Math.abs(b.vy);
      window.Sound?.play('wall');
    } else if (b.y + b.size / 2 >= CANVAS_HEIGHT - 38) {
      b.y = CANVAS_HEIGHT - 38 - b.size / 2;
      b.vy = -Math.abs(b.vy);
      window.Sound?.play('wall');
    }

    // Player Paddle Collision
    if (b.vx < 0 &&
        b.x - b.size / 2 <= this.player.x + this.player.w &&
        b.x + b.size / 2 >= this.player.x &&
        b.y + b.size / 2 >= this.player.y &&
        b.y - b.size / 2 <= this.player.y + this.player.h) {
      b.x = this.player.x + this.player.w + b.size / 2;
      const hitOffset = (b.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
      const speed = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05);
      const angle = hitOffset * (Math.PI / 3.4);
      b.vx = Math.cos(angle) * speed;
      b.vy = Math.sin(angle) * speed;
      window.Sound?.play('hit');
    }

    // Enemy Paddle Collision
    if (b.vx > 0 &&
        b.x + b.size / 2 >= this.enemy.x &&
        b.x - b.size / 2 <= this.enemy.x + this.enemy.w &&
        b.y + b.size / 2 >= this.enemy.y &&
        b.y - b.size / 2 <= this.enemy.y + this.enemy.h) {
      b.x = this.enemy.x - b.size / 2;
      const hitOffset = (b.y - (this.enemy.y + this.enemy.h / 2)) / (this.enemy.h / 2);
      const speed = Math.min(13.0, Math.hypot(b.vx, b.vy) * 1.05);
      const angle = Math.PI - hitOffset * (Math.PI / 3.4);
      b.vx = Math.cos(angle) * speed;
      b.vy = Math.sin(angle) * speed;
      window.Sound?.play('hit');
    }

    // Scoring
    if (b.x < 10) {
      this.enemy.score++;
      window.Sound?.play('lose');
      if (this.enemy.score >= 5) {
        this.showResult(false);
        return;
      }
      s.serveTimer = 0.6;
      s.bullets = [];
      this.resetBall(true);
      this.ball.x = 260;
    } else if (b.x > CANVAS_WIDTH - 10) {
      this.player.score++;
      window.Sound?.play('score');
      if (this.player.score >= 5) {
        this.showResult(true);
        return;
      }
      s.serveTimer = 0.6;
      s.bullets = [];
      this.resetBall(false);
      this.ball.x = CANVAS_WIDTH - 260;
    }
  }

  renderBulletHell(ctx, colWhite, colBlack) {
    const s = this.modeState;
    const b = this.ball;

    if (s.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
    }

    // 1. Arena Borders
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 36, CANVAS_WIDTH - 60, CANVAS_HEIGHT - 72);

    // Center dashed line
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 38);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 38);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Scoreboard
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = colWhite;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.player.score}`, 240, 80);
    ctx.fillText(`${this.enemy.score}`, 720, 80);

    // 3. Center Danmaku Guardian Core
    ctx.save();
    ctx.translate(s.coreX, s.coreY);
    ctx.rotate(s.coreAngle);
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 2;
    // Octagon outline
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI / 4);
      const r = 16;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner rotating crosshair
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
    ctx.moveTo(0, -10); ctx.lineTo(0, 10);
    ctx.stroke();
    ctx.restore();

    // 4. Bullets (1-bit rotating geometric diamonds)
    ctx.fillStyle = colWhite;
    ctx.strokeStyle = colWhite;
    ctx.lineWidth = 1;
    for (const bu of s.bullets) {
      ctx.save();
      ctx.translate(Math.round(bu.x), Math.round(bu.y));
      ctx.rotate(bu.rot);
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(4, 0);
      ctx.lineTo(0, 4);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 5. EMP Shockwaves
    for (const sw of s.shockwaves) {
      ctx.strokeStyle = colWhite;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 6. Sparks
    for (const sp of s.sparks) {
      ctx.fillRect(Math.round(sp.x), Math.round(sp.y), 2, 2);
    }

    // 7. Paddles (with Danmaku core hitbox dot and stun jitter)
    const pStunned = (s.playerStun > 0);
    const pJitterX = pStunned ? (Math.random() - 0.5) * 4 : 0;
    if (pStunned && Math.floor(performance.now() / 60) % 2 === 0) {
      // Flashing stun outline
      ctx.strokeRect(Math.round(this.player.x + pJitterX), Math.round(this.player.y), this.player.w, this.player.h);
    } else {
      ctx.fillRect(Math.round(this.player.x + pJitterX), Math.round(this.player.y), this.player.w, this.player.h);
    }
    // Player Hitbox Dot
    ctx.fillStyle = colBlack;
    ctx.fillRect(Math.round(this.player.x + this.player.w / 2 - 2), Math.round(this.player.y + this.player.h / 2 - 2), 4, 4);

    const eStunned = (s.enemyStun > 0);
    const eJitterX = eStunned ? (Math.random() - 0.5) * 4 : 0;
    ctx.fillStyle = colWhite;
    if (eStunned && Math.floor(performance.now() / 60) % 2 === 0) {
      ctx.strokeRect(Math.round(this.enemy.x + eJitterX), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);
    } else {
      ctx.fillRect(Math.round(this.enemy.x + eJitterX), Math.round(this.enemy.y), this.enemy.w, this.enemy.h);
    }
    // Enemy Hitbox Dot
    ctx.fillStyle = colBlack;
    ctx.fillRect(Math.round(this.enemy.x + this.enemy.w / 2 - 2), Math.round(this.enemy.y + this.enemy.h / 2 - 2), 4, 4);

    // 8. Ball
    ctx.fillStyle = colWhite;
    ctx.fillRect(Math.round(b.x - b.size / 2), Math.round(b.y - b.size / 2), b.size, b.size);

    if (s.shake > 0) {
      ctx.restore();
    }
  }

}


if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    window.Game = new PongModGame();
  });
} else {
  window.Game = new PongModGame();
}
