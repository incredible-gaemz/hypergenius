const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let game;
let renderer;
let player;
let lastTime = 0;
let lastUiUpdate = 0;
let myId = "player_1";

// UI Elements
const startMenu = document.getElementById('startMenu');
const playBtn = document.getElementById('playBtn');
const playerNameInput = document.getElementById('playerNameInput');
const playerColorInput = document.getElementById('playerColor');

// Autofill from global system
const globalUsername = localStorage.getItem('hyper_username');
if (globalUsername && playerNameInput) {
    playerNameInput.value = globalUsername;
}

const overlays = document.getElementById('overlays');
const scoreDisplay = document.getElementById('scoreDisplay');
const leaderboardList = document.getElementById('leaderboardList');
const leaderboard = document.getElementById('leaderboard');
const scoreBox = document.getElementById('scoreBox');
const spectateBtn = document.getElementById('spectateBtn');
const spectateTip = document.getElementById('spectateTip');

let spectating = false;
let globalMouseX = window.innerWidth / 2;
let globalMouseY = window.innerHeight / 2;
let spectateZoom = 0.35;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function init() {
    game = new Game();
    renderer = new Renderer(canvas, ctx, game);
    window.game = game;
    window.renderer = renderer;
    window.myId = myId;
    
    // Mouse inputs
    window.addEventListener('mousemove', (e) => {
        globalMouseX = e.clientX;
        globalMouseY = e.clientY;
        if (player) {
            player.mouseX = e.clientX;
            player.mouseY = e.clientY;
        }
    });

    // Touch support for mobile/trackpads
    const handleTouch = (e) => {
        if (e.touches && e.touches[0]) {
            const touch = e.touches[0];
            globalMouseX = touch.clientX;
            globalMouseY = touch.clientY;
            if (player) {
                player.mouseX = touch.clientX;
                player.mouseY = touch.clientY;
            }
        }
    };
    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('touchmove', handleTouch, { passive: true });

    // Wheel zoom during spectating
    window.addEventListener('wheel', (e) => {
        if (spectating) {
            spectateZoom += e.deltaY * -0.0005;
            spectateZoom = Math.max(0.08, Math.min(1.2, spectateZoom));
        }
    }, { passive: true });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' && spectating) {
            spectating = false;
            startMenu.classList.remove('hidden');
            leaderboard.classList.add('hidden');
            spectateTip.classList.add('hidden');
            return;
        }

        if (e.code === 'Enter' && !startMenu.classList.contains('hidden')) {
            startGame();
            return;
        }
        
        if (!player) return;
        
        if (e.code === 'Space') {
            game.splitPlayer(myId);
        } else if (e.code === 'KeyW') {
            game.ejectMass(myId);
        }
    });

    playBtn.addEventListener('click', startGame);
    
    spectateBtn.addEventListener('click', () => {
        spectating = true;
        startMenu.classList.add('hidden');
        leaderboard.classList.remove('hidden');
        scoreBox.classList.add('hidden');
        spectateTip.classList.remove('hidden');
        
        if (player) {
            game.removePlayer(myId);
            player = null;
        }
    });
    
    // UI Setup for Leaderboard Tabs
    const tabGlobal = document.getElementById('tabGlobal');
    const tabPersonal = document.getElementById('tabPersonal');
    if (tabGlobal) {
        tabGlobal.addEventListener('click', () => {
            currentTab = 'global';
            tabGlobal.style.background = '#22c55e';
            tabGlobal.style.color = '#052e16';
            tabPersonal.style.background = '#334155';
            tabPersonal.style.color = '#cbd5e1';
            renderMenuLeaderboard();
        });
    }

    if (tabPersonal) {
        tabPersonal.addEventListener('click', () => {
            currentTab = 'personal';
            tabPersonal.style.background = '#22c55e';
            tabPersonal.style.color = '#052e16';
            tabGlobal.style.background = '#334155';
            tabGlobal.style.color = '#cbd5e1';
            renderMenuLeaderboard();
        });
    }

    const submitScoreBtn = document.getElementById('submitScoreBtn');
    if (submitScoreBtn) {
        submitScoreBtn.addEventListener('click', async () => {
            if (!window.lastDeathName) return;
            submitScoreBtn.disabled = true;
            submitScoreBtn.innerText = "Submitting...";
            
            await submitScoreToGlobal(window.lastDeathName, window.lastDeathScore);
            savePersonalScore(window.lastDeathName, window.lastDeathScore);
            
            submitScoreBtn.disabled = false;
            submitScoreBtn.innerText = "Submit to Global Leaderboard";
            
            document.getElementById('deathPopup').classList.add('hidden');
            startMenu.classList.remove('hidden');
        });
    }

    const skipScoreBtn = document.getElementById('skipScoreBtn');
    if (skipScoreBtn) {
        skipScoreBtn.addEventListener('click', () => {
            if (!window.lastDeathName) return;
            savePersonalScore(window.lastDeathName, window.lastDeathScore);
            document.getElementById('deathPopup').classList.add('hidden');
            startMenu.classList.remove('hidden');
        });
    }

    // Start game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    // Initial global leaderboard fetch
    fetchGlobalLeaderboard();
}

const GLOBAL_LB_API = "https://api.restful-api.dev/objects/ff8081819d82fab6019eefc8cc9f4964";
let myHighScore = 0;
let globalScores = [];
let myPersonalScores = JSON.parse(localStorage.getItem('hyper_agar_scores')) || [];
let currentTab = 'global';

const SWEAR_WORDS = ["fuck", "shit", "bitch", "asshole", "cunt", "nigger", "nigga", "fag", "dick", "pussy", "cock", "slut", "whore", "bastard"];

function containsSwear(name) {
    const lowerName = name.toLowerCase();
    return SWEAR_WORDS.some(swear => lowerName.includes(swear));
}

async function fetchGlobalLeaderboard() {
    try {
        const response = await fetch(GLOBAL_LB_API);
        const data = await response.json();
        if (data && data.data && data.data.scores) {
            globalScores = data.data.scores;
            globalScores.sort((a, b) => b.score - a.score);
            renderMenuLeaderboard();
        }
    } catch (e) {
        console.error("Failed to fetch global leaderboard", e);
    }
}

function renderMenuLeaderboard() {
    const list = document.getElementById('menuLeaderboardList');
    if (!list) return;
    list.innerHTML = '';
    
    const targetArray = currentTab === 'global' ? globalScores : myPersonalScores;
    
    if (targetArray.length === 0) {
        list.innerHTML = '<li>No scores yet!</li>';
        return;
    }
    
    targetArray.slice(0, 10).forEach(entry => {
        const li = document.createElement('li');
        li.innerText = `${entry.name} - ${entry.score}`;
        list.appendChild(li);
    });
}

async function submitScoreToGlobal(name, score) {
    if (score < 50) return;
    
    try {
        const response = await fetch(GLOBAL_LB_API);
        const data = await response.json();
        let scores = [];
        if (data && data.data && data.data.scores) {
            scores = data.data.scores;
        }
        
        scores.push({ name: name, score: score });
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 100);
        
        await fetch(GLOBAL_LB_API, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: "hyper-agar-leaderboard",
                data: { scores: scores }
            })
        });
        
        fetchGlobalLeaderboard();
    } catch (e) {
        console.error("Failed to submit score", e);
    }
}

function startGame() {
    let name = playerNameInput.value ? playerNameInput.value.trim() : "An unnamed cell";
    if (!name) name = "An unnamed cell";
    
    if (containsSwear(name)) {
        alert("Please choose a different name without inappropriate words.");
        return;
    }
    
    const colorInput = document.getElementById('playerColor');
    const selectedColor = colorInput ? colorInput.value : null;

    if (player) {
        game.removePlayer(myId);
    }
    
    myHighScore = 0;
    
    // Spawn human player at authentic Agar starting mass (15 mass)
    const { color } = game.addPlayer(myId, name, selectedColor, 15);
    player = new Player(game, myId, name, color);
    
    startMenu.classList.add('hidden');
    leaderboard.classList.remove('hidden');
    scoreBox.classList.remove('hidden');
    
    canvas.focus();
}

function updateUI() {
    if (!player && !spectating) return;

    if (player) {
        let hasMyCells = false;
        let currentMass = 0;

        for (let i = 0; i < game.cellsArray.length; i++) {
            const e = game.cellsArray[i];
            if (e.ownerId === myId && !e.killedBy) {
                hasMyCells = true;
                currentMass += e.mass;
            }
        }
        
        const score = Math.floor(currentMass);
        if (score > myHighScore) {
            myHighScore = score;
        }
        
        if (!hasMyCells && startMenu.classList.contains('hidden') && document.getElementById('deathPopup').classList.contains('hidden')) {
            handlePlayerDeath(player.name, myHighScore);
            player = null;
            return;
        }

        scoreDisplay.innerText = score;
    }

    const lb = game.getLeaderboard();
    leaderboardList.innerHTML = '';
    
    for (let i = 0; i < lb.length; i++) {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.innerText = `${i + 1}. ${lb[i].name || 'An unnamed cell'} - ${lb[i].score}`;
        if (player && lb[i].name === player.name) {
            nameSpan.style.color = '#FFAAAA';
            nameSpan.style.fontWeight = 'bold';
        }
        
        item.appendChild(nameSpan);
        leaderboardList.appendChild(item);
    }
}

async function handlePlayerDeath(playerName, score) {
    const deathPopup = document.getElementById('deathPopup');
    startMenu.classList.add('hidden');
    leaderboard.classList.add('hidden');
    scoreBox.classList.add('hidden');
    spectateTip.classList.add('hidden');
    
    deathPopup.classList.remove('hidden');
    document.getElementById('deathScoreDisplay').innerText = score;
    
    window.lastDeathName = playerName;
    window.lastDeathScore = score;
    
    let personalRank = 1;
    for (let s of myPersonalScores) {
        if (s.score > score) personalRank++;
    }
    document.getElementById('personalPlacementDisplay').innerText = `#${personalRank}`;
    
    document.getElementById('globalPlacementDisplay').innerText = "Loading...";
    try {
        const response = await fetch(GLOBAL_LB_API);
        const data = await response.json();
        if (data && data.data && data.data.scores) {
            globalScores = data.data.scores;
            globalScores.sort((a, b) => b.score - a.score);
        }
    } catch (e) {
        console.error("Failed to fetch global leaderboard on death", e);
    }
    
    let globalRank = 1;
    for (let s of globalScores) {
        if (s.score > score) globalRank++;
    }
    document.getElementById('globalPlacementDisplay').innerText = `#${globalRank}`;
}

function savePersonalScore(name, score) {
    myPersonalScores.push({ name: name, score: score });
    myPersonalScores.sort((a, b) => b.score - a.score);
    myPersonalScores = myPersonalScores.slice(0, 100);
    localStorage.setItem('hyper_agar_scores', JSON.stringify(myPersonalScores));
    renderMenuLeaderboard();
}

function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (player) {
        player.updateTarget(renderer.cameraX, renderer.cameraY, renderer.zoom, canvas.width, canvas.height);
    }
    game.update(dt);
    
    let hasMyCells = false;
    for (let i = 0; i < game.cellsArray.length; i++) {
        const c = game.cellsArray[i];
        if (c.ownerId === myId && !c.killedBy) {
            hasMyCells = true;
            break;
        }
    }
    
    if (hasMyCells) {
        renderer.updateCamera(myId);
    } else if (spectating) {
        const dx = globalMouseX - canvas.width / 2;
        const dy = globalMouseY - canvas.height / 2;
        
        renderer.cameraX += (dx * 0.035) / renderer.zoom;
        renderer.cameraY += (dy * 0.035) / renderer.zoom;
        
        renderer.cameraX = Math.max(0, Math.min(Config.MAP_WIDTH, renderer.cameraX));
        renderer.cameraY = Math.max(0, Math.min(Config.MAP_HEIGHT, renderer.cameraY));
        
        renderer.targetZoom = spectateZoom;
        renderer.zoom = MathUtils.lerp(renderer.zoom, renderer.targetZoom, 0.1);
    } else {
        // Idle camera drift when on menu
        renderer.cameraX += 0.4;
        renderer.cameraY += 0.4;
        renderer.zoom = 0.4;
    }
    
    renderer.draw();
    
    // Throttle UI update to every ~180ms for buttery-smooth performance
    if (timestamp - lastUiUpdate > 180) {
        lastUiUpdate = timestamp;
        updateUI();
    }

    requestAnimationFrame(gameLoop);
}

init();
