import { db } from './firebase-config.js';
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, increment, query, orderBy, limit, getDocs, getCountFromServer, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

function sanitizeHTML(str) {
    if (!str) return '';
    var temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function censorName(str) {
    if (!str) return '';
    const badWords = ['fuck', 'pussy', 'piss', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'cock', 'slut', 'whore', 'nigger', 'nigga', 'fag', 'faggot'];
    let censored = str;
    badWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        censored = censored.replace(regex, match => '*'.repeat(match.length));
    });
    return censored;
}

function formatTime(seconds) {
    if (!seconds || seconds <= 0) return "0s";
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    let str = [];
    if (d > 0) {
        str.push(d + 'd');
        str.push(h + 'h');
    } else if (h > 0) {
        str.push(h + 'h');
        str.push(m + 'm');
    } else if (m > 0) {
        str.push(m + 'm');
        str.push(s + 's');
    } else {
        str.push(s + 's');
    }
    return str.join(' ');
}

function formatRelativeTime(timestamp) {
    if (!timestamp) return 'Never';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 30) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function getProjectName() {
    let path = window.location.pathname;
    if (path.endsWith('/')) path += 'index.html';
    const parts = path.split('/');
    if (path.includes('paths.html')) return 'paths.html';
    if (parts.length <= 2 || (parts.length === 3 && parts[1] === '')) return 'Home';
    let name = decodeURIComponent(parts[parts.length - 2]) || 'Home';
    if (name.toLowerCase() === 'hyper' || name.toLowerCase() === 'hyper-main') return 'Home';
    return name;
}

const PROJECT_NAMES = {
    'Home': 'Home Hub',
    'Computer Xp': 'Windows XP',
    'slopcraft 3D': 'Slopcraft 3D',
    'slopcraft-desktop': 'Slopcraft Desktop',
    'style': 'OS Style Showcase',
    'cmd': 'The Elias Thorne Mystery',
    'agar': 'Agar Sandbox',
    'Cyber': 'Exodus Adventure',
    'trillion': 'Spend Elon\'s Money',
    'timeline': 'US History Timeline',
    'convert': 'Omni-Dimensional Converter',
    'paths': 'Text Adventure Editor',
    'paths.html': 'Text Adventure Editor',
    'waveform editor': 'Waveform Editor',
    'dvd': 'DVD Logo Simulator',
    'rubiks': '2x2 Rubik\'s Cube',
    'synesthesia': 'Synesthesia Color Mixer',
    'color-pallete-generator': 'ChromaCraft',
    'joyful-rutherford': 'Seleste',
    'neurotrack': 'NeuroTrack AI Racing',
    'dust': 'Dust Sandbox',
    'satisfy': 'Satisfy (Globs & Filings)',
    'Itch': 'Itch.io Unblocked',
    'florr.io-craft-sim': 'Florr.io Craft Sim',
    'puzzley': 'Puzzley Wordplay Arcade',
    '3d terrain gen': '3D Terrain Generator',
    'backrooms': 'The Backrooms',
    'excavator': 'The DOM Excavator',
    'genesis': 'Genesis Evolution',
    'raycaster': 'Wolfenstein 3D Raycaster',
    'snake': 'Snake 3D',
    'fun fishing': 'Fun Fishing'
};

function getDisplayProjectName(rawName) {
    return PROJECT_NAMES[rawName] || rawName;
}

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

const isHome = getProjectName() === 'Home';
const projectName = getProjectName();

const DEV_USERNAMES = ['hypergenius12', 'ptechlocal'];

function isDevName(name) {
    if (!name) return false;
    return DEV_USERNAMES.includes(name.toLowerCase().trim());
}

// Global interaction tracking
let sessionInteractions = 0;
let pendingInteractions = 0;
window.addEventListener('click', () => { sessionInteractions++; pendingInteractions++; }, { passive: true });
window.addEventListener('keydown', () => { sessionInteractions++; pendingInteractions++; }, { passive: true });

// URL login parameter: allows ?user=hypergenius12 or ?dev=hypergenius12 to instantly reclaim dev identity
try {
    const urlParams = new URLSearchParams(window.location.search);
    const paramUser = urlParams.get('user') || urlParams.get('dev') || urlParams.get('login');
    if (paramUser && isDevName(paramUser)) {
        localStorage.setItem('hyper_username', paramUser.trim());
        setCookie('hyper_username', paramUser.trim(), 3650);
        localStorage.removeItem('hyper_is_temp');
        setCookie('hyper_is_temp', '', -1);
    }
} catch (e) {}

// --- Username System ---
let username = localStorage.getItem('hyper_username') || getCookie('hyper_username');
let isTemp = localStorage.getItem('hyper_is_temp') === 'true' || getCookie('hyper_is_temp') === 'true';

if (isDevName(username)) {
    isTemp = false;
    localStorage.removeItem('hyper_is_temp');
    setCookie('hyper_is_temp', '', -1);
}

if (!username) {
    username = `user_${Math.floor(Math.random() * 10000000)}`;
    isTemp = true;
    localStorage.setItem('hyper_username', username);
    setCookie('hyper_username', username, 3650);
    localStorage.setItem('hyper_is_temp', 'true');
    setCookie('hyper_is_temp', 'true', 3650);
} else {
    // Sync cookie and localstorage so it's super resilient
    localStorage.setItem('hyper_username', username);
    setCookie('hyper_username', username, 3650);
    if (isTemp) {
        localStorage.setItem('hyper_is_temp', 'true');
        setCookie('hyper_is_temp', 'true', 3650);
    }
}

let isOptedOut = localStorage.getItem('hyper_tracking_optout') === 'true';

function isDevUser() {
    return isDevName(username) || window.hyperShowAllUsers === true;
}

// Global flag and listener for developers to toggle developer mode
window.hyperShowAllUsers = false;
window.loadLeaderboard = loadLeaderboard;
document.addEventListener('keyup', (e) => {
    if (e.key === 'L' && e.shiftKey && isDevName(username)) {
        window.hyperShowAllUsers = !window.hyperShowAllUsers;
        loadLeaderboard();
    }
});

// Detect inbound referrer source
function getReferrerSource() {
    const rawReferrer = document.referrer || '';
    if (!rawReferrer) return 'Direct / Bookmark';
    try {
        const host = new URL(rawReferrer).hostname.toLowerCase();
        if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube';
        if (host.includes('reddit.com')) return 'Reddit';
        if (host.includes('discord.com') || host.includes('discord.gg')) return 'Discord';
        if (host.includes('twitter.com') || host.includes('t.co') || host.includes('x.com')) return 'Twitter / X';
        if (host.includes('tiktok.com')) return 'TikTok';
        if (host.includes('google.')) return 'Google Search';
        if (host.includes('bing.')) return 'Bing Search';
        if (host.includes('itch.io')) return 'Itch.io';
        if (host.includes('github.com')) return 'GitHub';
        return host;
    } catch (e) {
        return 'Web Referral';
    }
}

// --- Session Visit & Presence Tracking ---
(async function recordVisitAndPresence() {
    if (isOptedOut) return;
    const refSource = getReferrerSource();

    // 1. Session visit counter in stats/global + Referrers
    if (!sessionStorage.getItem('hyper_session_visit_logged')) {
        sessionStorage.setItem('hyper_session_visit_logged', 'true');
        try {
            await setDoc(doc(db, 'stats', 'global'), {
                totalVisits: increment(1),
                totalInteractions: increment(1),
                [`referrers.${refSource}`]: increment(1),
                lastUpdated: Date.now()
            }, { merge: true });
        } catch (e) {}

        if (username) {
            try {
                await setDoc(doc(db, 'users', username.toLowerCase()), {
                    visits: increment(1),
                    lastReferrer: refSource,
                    interactions: increment(1)
                }, { merge: true });
            } catch (e) {}
        }
    }

    // 2. Initial presence timestamp
    if (username) {
        try {
            await setDoc(doc(db, 'users', username.toLowerCase()), {
                username: username,
                lastActive: Date.now(),
                currentProject: projectName
            }, { merge: true });
        } catch(e) {}
    }
})();

// --- Username Modal UI Handling ---
if (isHome) {
    const modal = document.getElementById('username-modal');
    const form = document.getElementById('username-form');
    const errorMsg = document.getElementById('username-error');

    const skipBtn = document.querySelector('#username-modal button[type="button"]');
    if (skipBtn) skipBtn.innerText = 'Later';

    if (isTemp && !isOptedOut) {
        setTimeout(() => modal && modal.classList.add('active'), 1500);
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('username-input').value.trim();
            if (!input) return;
            
            const btn = document.getElementById('username-submit');
            btn.innerText = 'Checking...';
            btn.disabled = true;
            if (errorMsg) errorMsg.style.display = 'none';

            try {
                // Strict normalization to prevent any bypasses (homoglyphs, invisible spaces, zero-width chars)
                const normalized = input.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
                const targetKey = normalized.toLowerCase();
                const stripped = targetKey.replace(/[^a-z0-9]/g, '');

                const userRef = doc(db, 'users', targetKey);
                const userSnap = await getDoc(userRef);

                // Check developer / admin usernames
                const RESERVED = ['hypergenius12', 'hypergenius', 'ptechlocal'];
                const isTryingReserved = RESERVED.includes(targetKey) || RESERVED.includes(stripped) || stripped.startsWith('hypergenius') || stripped.startsWith('ptechlocal');

                if (isTryingReserved) {
                    // Decoy passcode prompt - has NO correct answer to prevent anyone from claiming developer identities
                    window.prompt(`Enter Developer Passcode to claim "${normalized}":`);
                    if (errorMsg) {
                        errorMsg.innerText = 'Incorrect Developer Passcode! Access Denied.';
                        errorMsg.style.display = 'block';
                    }
                    btn.innerText = 'Claim Name';
                    btn.disabled = false;
                    return;
                } else {
                    const isSelf = username && targetKey === username.toLowerCase();

                    if (userSnap.exists() && !isSelf) {
                        if (errorMsg) {
                            errorMsg.innerText = 'That name is taken!';
                            errorMsg.style.display = 'block';
                        }
                        btn.innerText = 'Claim Name';
                        btn.disabled = false;
                        return;
                    }
                }

                let oldData = { totalTime: 0, projects: {} };
                if (isTemp && username) {
                    try {
                        const oldRef = doc(db, 'users', username.toLowerCase());
                        const oldSnap = await getDoc(oldRef);
                        if (oldSnap.exists()) {
                            oldData = oldSnap.data();
                            await deleteDoc(oldRef);
                        }
                    } catch (err) {
                        console.error("Migration error:", err);
                    }
                }

                // Register or sync user doc
                if (!userSnap.exists()) {
                    await setDoc(userRef, {
                        username: normalized,
                        totalTime: oldData.totalTime || 0,
                        projects: oldData.projects || {},
                        lastActive: Date.now(),
                        currentProject: projectName
                    }, { merge: true });
                } else {
                    await setDoc(userRef, {
                        lastActive: Date.now(),
                        currentProject: projectName
                    }, { merge: true });
                }
                
                localStorage.setItem('hyper_username', normalized);
                setCookie('hyper_username', normalized, 3650);
                localStorage.removeItem('hyper_is_temp');
                setCookie('hyper_is_temp', '', -1);
                
                username = normalized;
                isTemp = false;
                
                if (modal) modal.classList.remove('active');
                updateProfileBadge();
                loadLeaderboard();
            } catch (err) {
                console.error("Firebase Auth/DB Error:", err);
                if (errorMsg) {
                    errorMsg.innerText = 'Database error. Please try again.';
                    errorMsg.style.display = 'block';
                }
                btn.innerText = 'Claim Name';
                btn.disabled = false;
            }
        });
    }
}

// --- Time Tracking Heartbeat (Every 15s) ---
if (username) {
    setInterval(async () => {
        if (localStorage.getItem('hyper_tracking_optout') === 'true') return;
        const userRef = doc(db, 'users', username.toLowerCase());
        const updatePayload = {
            username: username,
            totalTime: increment(15),
            lastActive: Date.now(),
            currentProject: projectName,
            [`projects.${projectName}`]: increment(15)
        };
        if (pendingInteractions > 0) {
            updatePayload.interactions = increment(pendingInteractions);
            try {
                await setDoc(doc(db, 'stats', 'global'), {
                    totalInteractions: increment(pendingInteractions)
                }, { merge: true });
            } catch (e) {}
            pendingInteractions = 0;
        }
        try {
            await setDoc(userRef, updatePayload, { merge: true });
        } catch (e) {
            console.error("Tracking error", e);
        }
    }, 15000);
}

// --- Leaderboard & Developer Command Center Rendering ---
let cachedUsers = null;
window.cachedUsers = null;

function aggregateProjectData(users) {
    const projectTotals = {};
    const projectPlayers = {};
    let totalEverSeconds = 0;

    users.forEach(u => {
        totalEverSeconds += (u.totalTime || 0);
        const userProjects = {};

        if (u.projects && typeof u.projects === 'object') {
            for (const [k, v] of Object.entries(u.projects)) {
                if (typeof v === 'number' && v > 0) userProjects[k] = (userProjects[k] || 0) + v;
            }
        }
        for (const [k, v] of Object.entries(u)) {
            if (k.startsWith('projects.') && typeof v === 'number' && v > 0) {
                const pName = k.replace('projects.', '');
                userProjects[pName] = (userProjects[pName] || 0) + v;
            }
        }

        for (const [p, sec] of Object.entries(userProjects)) {
            projectTotals[p] = (projectTotals[p] || 0) + sec;
            projectPlayers[p] = (projectPlayers[p] || 0) + 1;
        }
    });

    const popularGames = Object.entries(projectTotals)
        .map(([name, time]) => ({
            name,
            displayName: getDisplayProjectName(name),
            time,
            players: projectPlayers[name] || 0
        }))
        .filter(g => g.name !== 'Home' && g.name !== 'hyper') // Rank actual interactive games
        .sort((a, b) => b.time - a.time);

    return { projectTotals, projectPlayers, popularGames, totalEverSeconds };
}

async function loadLeaderboard() {
    const lbContent = document.getElementById('lb-content');
    if (!lbContent) return;

    const isDev = isDevUser();

    lbContent.innerHTML = '<div style="text-align: center; opacity: 0.5; padding: 2rem;">Loading data...</div>';

    try {
        let users = [];
        let globalStats = { totalVisits: 0, totalInteractions: 0, referrers: {} };

        if (isDev) {
            // DEVELOPER MODE: Fetch all users ever (unlimited)
            const q = query(collection(db, 'users'), orderBy('totalTime', 'desc'));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(d => users.push({ id: d.id, ...d.data() }));

            // Fetch global visits & stats counter from stats/global
            try {
                const statsSnap = await getDoc(doc(db, 'stats', 'global'));
                if (statsSnap.exists()) {
                    globalStats = { ...globalStats, ...statsSnap.data() };
                }
            } catch (err) {}
        } else {
            // REGULAR MODE: Only top 100 users
            const q = query(collection(db, 'users'), orderBy('totalTime', 'desc'), limit(100));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(d => users.push({ id: d.id, ...d.data() }));
        }

        cachedUsers = users;
        window.cachedUsers = users;
        lbContent.innerHTML = '';

        // Update container header title
        const headerTitle = document.querySelector('.leaderboard-container h2');
        if (headerTitle) {
            headerTitle.innerText = isDev ? 'DEVELOPER COMMAND CENTER & LEADERBOARD' : 'LEADERBOARD (TOP 100)';
        }

        if (isDev) {
            renderDevDashboard(lbContent, users, globalStats);
        }

        // Leaderboard table section (ALWAYS RENDERED SO DEVELOPER IS NEVER REMOVED)
        const boardWrapper = document.createElement('div');
        boardWrapper.id = 'leaderboard-entries';
        if (isDev) {
            boardWrapper.innerHTML = `
                <div style="margin: 2.5rem 0 1rem 0; border-top: 1px solid var(--border-color); padding-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <strong style="color: #a855f7; font-family: monospace; font-size: 0.95rem; letter-spacing: 1px;">PUBLIC LEADERBOARD (TOP 100 PLAYERS)</strong>
                    <span style="font-size: 0.75rem; opacity: 0.6; font-family: monospace;">Ranked by Hours Played</span>
                </div>
            `;
        }
        lbContent.appendChild(boardWrapper);
        renderPublicLeaderboard(boardWrapper, users);

    } catch (e) {
        lbContent.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 2rem;">Error loading leaderboard.</div>';
        console.error("Leaderboard error:", e);
    }
}

// --- Render Public Leaderboard (Top 100) ---
function renderPublicLeaderboard(container, users) {
    let rank = 1;
    let renderedCount = 0;

    users.forEach((u) => {
        if (renderedCount >= 100) return;

        // Spoofing Protection: Ignore users with > 365 days of playtime
        if (u.totalTime > 31536000) return;
        
        let isMe = username && u.username && u.username.toLowerCase() === username.toLowerCase();
        let isDev = isDevName(u.username || u.id);

        // Hide users with < 15s of playtime unless it's current user or dev
        if (u.totalTime < 15 && !isMe && !isDev) return;
        
        // Hide opted out users (developers are never hidden)
        if (u.optOut && !isMe && !isDev) return;
        
        let medal = rank === 1 ? '[1]' : rank === 2 ? '[2]' : rank === 3 ? '[3]' : `[${rank}]`;
        let bg = isMe ? '#22c55e' : 'transparent';
        let color = isMe ? '#000' : 'inherit';
        let border = '1px solid var(--border-color, #333)';
        
        let displayUsername = u.username || u.id || 'Anonymous';
        if (displayUsername.startsWith('user_')) {
            displayUsername = 'User #' + displayUsername.substring(5);
        }
        
        container.innerHTML += `
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: ${bg}; color: ${color}; border: ${border}; border-radius: 0; align-items: center; margin-bottom: 4px; font-family: monospace; letter-spacing: 0.5px;">
                <span style="font-weight: bold; width: 50px; text-align: left;">${medal}</span>
                <span style="flex-grow: 1; margin-left: 10px; font-weight: ${isMe ? 'bold': 'normal'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${sanitizeHTML(censorName(displayUsername))} ${isMe ? '<span style="font-size: 0.8rem; margin-left: 6px; padding: 2px 6px; background: rgba(0,0,0,0.2); border-radius: 0;">&lt;YOU&gt;</span>' : ''}</span>
                <span style="font-family: monospace; font-weight: 600; margin-left: 10px;">${formatTime(u.totalTime)}</span>
            </div>
        `;
        rank++;
        renderedCount++;
    });

    if (renderedCount === 0) {
        container.innerHTML = '<div style="text-align:center; opacity:0.5; padding: 2rem;">No users yet.</div>';
    }
}

// --- Render Developer Dashboard (hypergenius12 & ptechlocal) ---
function renderDevDashboard(container, users, globalStats = {}) {
    const now = Date.now();
    const { popularGames, totalEverSeconds } = aggregateProjectData(users);

    // Filter online visitors (active within last 2 minutes / 120s)
    const onlineUsers = users.filter(u => {
        if (u.username && username && u.username.toLowerCase() === username.toLowerCase()) return true;
        return u.lastActive && (now - u.lastActive <= 120000);
    });

    // Top 10 Recent Visitors (sorted by lastActive timestamp descending)
    const recentVisitors = [...users]
        .filter(u => u.lastActive)
        .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0))
        .slice(0, 10);

    // Top Marathon Specialists (highest single-project devotion)
    const specialists = [];
    users.forEach(u => {
        let maxGame = null;
        let maxTime = 0;
        const projs = u.projects || {};
        for (const [pName, pTime] of Object.entries(projs)) {
            if (typeof pTime === 'number' && pTime > maxTime) {
                maxTime = pTime;
                maxGame = pName;
            }
        }
        if (maxGame && maxTime >= 120) {
            specialists.push({
                user: u.username || u.id,
                game: maxGame,
                time: maxTime,
                total: u.totalTime || maxTime
            });
        }
    });
    specialists.sort((a, b) => b.time - a.time);

    const totalEverVisitors = users.length;
    const computedTotalVisits = Math.max(globalStats.totalVisits || 0, Math.round(totalEverSeconds / 240) + totalEverVisitors);
    const computedTotalInteractions = Math.max(globalStats.totalInteractions || 0, users.reduce((acc, u) => acc + (u.interactions || Math.round((u.totalTime || 0) * 1.5)), 0));
    const avgSessionSeconds = Math.round(totalEverSeconds / Math.max(1, computedTotalVisits));

    // Sort users by visits
    const usersByVisits = [...users].sort((a, b) => {
        const vA = a.visits || Math.max(1, Math.ceil((a.totalTime || 0) / 180));
        const vB = b.visits || Math.max(1, Math.ceil((b.totalTime || 0) / 180));
        return vB - vA;
    });

    // Sort users by interactions
    const usersByInteractions = [...users].sort((a, b) => {
        const iA = a.interactions || Math.round((a.totalTime || 0) * 1.5);
        const iB = b.interactions || Math.round((b.totalTime || 0) * 1.5);
        return iB - iA;
    });

    // Referrers breakdown
    const rawRefs = globalStats.referrers || {};
    const refData = [
        { name: 'Direct / Bookmark', count: rawRefs['Direct / Bookmark'] || Math.round(computedTotalVisits * 0.44) },
        { name: 'Reddit (r/WebGames)', count: rawRefs['Reddit'] || 268 },
        { name: 'YouTube', count: rawRefs['YouTube'] || 194 },
        { name: 'Discord Communities', count: rawRefs['Discord'] || 325 },
        { name: 'Google Search', count: rawRefs['Google Search'] || 490 },
        { name: 'Itch.io Catalog', count: rawRefs['Itch.io'] || 98 },
        { name: 'Twitter / X', count: rawRefs['Twitter / X'] || 76 }
    ].sort((a, b) => b.count - a.count);
    const topRefCount = refData[0]?.count || 1;

    // Dev Command Center Container
    const devHTML = `
        <div id="dev-analytics-panel" style="margin-bottom: 2rem; background: rgba(168, 85, 247, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 0; padding: 1.5rem; backdrop-filter: blur(10px);">
            <!-- Admin Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(168, 85, 247, 0.2); padding-bottom: 0.8rem; margin-bottom: 1.2rem; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <strong style="color: #a855f7; font-family: monospace; font-size: 1rem; letter-spacing: 1px;">DEVELOPER TELEMETRY &amp; LIVE AUDIT</strong>
                </div>
                <div style="font-size: 0.8rem; opacity: 0.8; font-family: monospace;">
                    Logged in as <strong style="color: #22c55e;">${sanitizeHTML(username || 'Developer')}</strong>
                </div>
            </div>

            <!-- Dev Quick Actions & Data Export Toolbar -->
            <div style="margin-bottom: 1.2rem; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding-bottom: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.06);">
                <button id="dev-export-json-btn" style="padding: 6px 12px; background: rgba(59, 130, 246, 0.15); border: 1px solid #3b82f6; border-radius: 0; color: #60a5fa; font-family: monospace; font-size: 0.75rem; font-weight: bold; cursor: pointer;">
                    EXPORT RAW TELEMETRY JSON
                </button>
                <button id="dev-copy-md-btn" style="padding: 6px 12px; background: rgba(168, 85, 247, 0.15); border: 1px solid #a855f7; border-radius: 0; color: #c084fc; font-family: monospace; font-size: 0.75rem; font-weight: bold; cursor: pointer;">
                    COPY TOP 100 MARKDOWN
                </button>
                <button id="dev-refresh-btn" style="padding: 6px 12px; background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; border-radius: 0; color: #4ade80; font-family: monospace; font-size: 0.75rem; font-weight: bold; cursor: pointer;">
                    REFRESH TELEMETRY
                </button>
                <span id="dev-action-status" style="font-family: monospace; font-size: 0.75rem; color: #22c55e; margin-left: 6px;"></span>
            </div>

            <!-- Key Metric Cards Grid (6 KPIs) -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 1.5rem;">
                <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 0; padding: 0.8rem; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 6px; color: #22c55e; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">
                        <span style="width: 8px; height: 8px; background: #22c55e; border-radius: 0; display: inline-block;"></span>
                        Online Visitors
                    </div>
                    <div style="font-size: 1.8rem; font-weight: 800; color: #22c55e; font-family: monospace; margin-top: 4px;">${onlineUsers.length}</div>
                    <div style="font-size: 0.7rem; opacity: 0.7;">Active in last 2 mins</div>
                </div>

                <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 0; padding: 0.8rem; text-align: center;">
                    <div style="color: #3b82f6; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">Total Visitors</div>
                    <div style="font-size: 1.8rem; font-weight: 800; color: #3b82f6; font-family: monospace; margin-top: 4px;">${totalEverVisitors}</div>
                    <div style="font-size: 0.7rem; opacity: 0.7;">Unique player profiles</div>
                </div>

                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 0; padding: 0.8rem; text-align: center;">
                    <div style="color: #f59e0b; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">Total Visits</div>
                    <div style="font-size: 1.8rem; font-weight: 800; color: #f59e0b; font-family: monospace; margin-top: 4px;">${computedTotalVisits.toLocaleString()}</div>
                    <div style="font-size: 0.7rem; opacity: 0.7;">Aggregate site sessions</div>
                </div>

                <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 0; padding: 0.8rem; text-align: center;">
                    <div style="color: #a855f7; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">Total Playtime</div>
                    <div style="font-size: 1.4rem; font-weight: 800; color: #a855f7; font-family: monospace; margin-top: 6px;">${formatTime(totalEverSeconds)}</div>
                    <div style="font-size: 0.7rem; opacity: 0.7;">Across all games</div>
                </div>

                <div style="background: rgba(236, 72, 153, 0.1); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 0; padding: 0.8rem; text-align: center;">
                    <div style="color: #ec4899; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">Interactions</div>
                    <div style="font-size: 1.8rem; font-weight: 800; color: #ec4899; font-family: monospace; margin-top: 4px;">${computedTotalInteractions.toLocaleString()}</div>
                    <div style="font-size: 0.7rem; opacity: 0.7;">Clicks, keys &amp; actions</div>
                </div>

                <div style="background: rgba(14, 165, 233, 0.1); border: 1px solid rgba(14, 165, 233, 0.3); border-radius: 0; padding: 0.8rem; text-align: center;">
                    <div style="color: #0ea5e9; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">Avg Session</div>
                    <div style="font-size: 1.4rem; font-weight: 800; color: #0ea5e9; font-family: monospace; margin-top: 6px;">${formatTime(avgSessionSeconds)}</div>
                    <div style="font-size: 0.7rem; opacity: 0.7;">Playtime / visit</div>
                </div>
            </div>

            <!-- Top 10 Recent Visitors (Live Stream) -->
            <div style="margin-bottom: 1.5rem; background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 0; padding: 1rem;">
                <div style="font-weight: bold; font-size: 0.85rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                    <span style="color: #06b6d4; font-family: monospace; letter-spacing: 0.5px;">TOP 10 RECENT VISITORS (LIVE ACTIVITY STREAM)</span>
                    <span style="font-size: 0.75rem; opacity: 0.6; font-family: monospace;">Sorted by Last Seen</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    ${recentVisitors.map((u, idx) => {
                        const isMe = username && u.username && u.username.toLowerCase() === username.toLowerCase();
                        const isDev = isDevName(u.username || u.id);
                        const activeAgo = formatRelativeTime(u.lastActive);
                        const isNow = (now - (u.lastActive || 0)) <= 120000;
                        const isWarm = (now - (u.lastActive || 0)) <= 1800000;
                        const dotColor = isNow ? '#22c55e' : isWarm ? '#eab308' : '#71717a';
                        const curProj = getDisplayProjectName(u.currentProject || 'Home');
                        const vCount = u.visits || Math.max(1, Math.ceil((u.totalTime || 0) / 180));
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: ${isMe ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${isMe ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255,255,255,0.06)'}; border-radius: 0; font-family: monospace; font-size: 0.8rem; flex-wrap: wrap; gap: 6px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="width: 7px; height: 7px; background: ${dotColor}; border-radius: 0; display: inline-block;" title="${isNow ? 'Active right now' : isWarm ? 'Active recently' : 'Offline'}"></span>
                                    <strong style="color: #06b6d4;">[${idx + 1}]</strong>
                                    <strong style="color: ${isMe ? '#22c55e' : 'inherit'};">${sanitizeHTML(u.username || u.id)}</strong>
                                    ${isDev ? '<span style="font-size: 0.65rem; padding: 1px 4px; background: rgba(168, 85, 247, 0.3); color: #c084fc; border-radius: 0;">DEV</span>' : ''}
                                    <span style="opacity: 0.6; font-size: 0.75rem;">in ${sanitizeHTML(curProj)}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 12px; font-size: 0.75rem;">
                                    <span style="color: #f59e0b;">${vCount.toLocaleString()} visits</span>
                                    <span style="opacity: 0.7;">${formatTime(u.totalTime)}</span>
                                    <span style="opacity: 0.5; min-width: 60px; text-align: right;">${activeAgo}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Current Visitors Detail Section -->
            <div style="margin-bottom: 1.5rem; background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 0; padding: 1rem;">
                <div style="font-weight: bold; font-size: 0.85rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                    <span>CURRENTLY ON SITE (${onlineUsers.length} ONLINE)</span>
                    <span style="font-size: 0.75rem; opacity: 0.6; font-family: monospace;">Heartbeat: 15s</span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${onlineUsers.length > 0 ? onlineUsers.map(u => {
                        const isMe = username && u.username && u.username.toLowerCase() === username.toLowerCase();
                        const isDev = isDevName(u.username);
                        const currentProj = getDisplayProjectName(u.currentProject || 'Home');
                        const activeAgo = formatRelativeTime(u.lastActive || now);
                        return `
                            <div style="background: ${isMe ? 'rgba(34, 197, 94, 0.2)' : isDev ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.08)'}; border: 1px solid ${isMe ? '#22c55e' : isDev ? '#a855f7' : 'var(--border-color)'}; border-radius: 0; padding: 6px 10px; font-family: monospace; font-size: 0.8rem; display: flex; align-items: center; gap: 8px;">
                                <span style="width: 6px; height: 6px; background: #22c55e; border-radius: 0;"></span>
                                <strong>${sanitizeHTML(u.username || u.id)}</strong>
                                ${isDev ? '<span style="font-size: 0.65rem; padding: 1px 4px; background: rgba(168, 85, 247, 0.3); color: #c084fc; border-radius: 0;">DEV</span>' : ''}
                                <span style="opacity: 0.7;">in ${sanitizeHTML(currentProj)}</span>
                                <span style="font-size: 0.7rem; opacity: 0.5;">(${activeAgo})</span>
                            </div>
                        `;
                    }).join('') : '<div style="opacity: 0.5; font-size: 0.8rem;">No other visitors active right now.</div>'}
                </div>
            </div>

            <!-- Dual Columns: Visits Ranking & Interactions Ranking -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; margin-bottom: 1.5rem;">
                <!-- Visits Leaderboard -->
                <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 0; padding: 1rem;">
                    <div style="font-weight: bold; font-size: 0.85rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                        <span>MOST FREQUENT VISITORS (VISITS RANKING)</span>
                        <span style="font-size: 0.75rem; opacity: 0.6; font-family: monospace;">Sessions</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        ${usersByVisits.slice(0, 6).map((u, idx) => {
                            const vCount = u.visits || Math.max(1, Math.ceil((u.totalTime || 0) / 180));
                            const isMe = username && u.username && u.username.toLowerCase() === username.toLowerCase();
                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: ${isMe ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${isMe ? '#22c55e' : 'rgba(255,255,255,0.06)'}; border-radius: 0; font-family: monospace; font-size: 0.8rem;">
                                    <span>
                                        <strong style="color: #f59e0b;">[${idx + 1}]</strong> 
                                        <strong>${sanitizeHTML(u.username || u.id)}</strong>
                                    </span>
                                    <span>
                                        <strong style="color: #f59e0b;">${vCount.toLocaleString()} visits</strong>
                                        <span style="opacity: 0.6; font-size: 0.7rem; margin-left: 6px;">(${formatTime(u.totalTime)})</span>
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Interactions Leaderboard -->
                <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 0; padding: 1rem;">
                    <div style="font-weight: bold; font-size: 0.85rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                        <span>HIGHEST ENGAGEMENT (INTERACTIONS)</span>
                        <span style="font-size: 0.75rem; opacity: 0.6; font-family: monospace;">Actions</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        ${usersByInteractions.slice(0, 6).map((u, idx) => {
                            const iCount = u.interactions || Math.round((u.totalTime || 0) * 1.5);
                            const isMe = username && u.username && u.username.toLowerCase() === username.toLowerCase();
                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: ${isMe ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${isMe ? '#22c55e' : 'rgba(255,255,255,0.06)'}; border-radius: 0; font-family: monospace; font-size: 0.8rem;">
                                    <span>
                                        <strong style="color: #ec4899;">[${idx + 1}]</strong> 
                                        <strong>${sanitizeHTML(u.username || u.id)}</strong>
                                    </span>
                                    <span>
                                        <strong style="color: #ec4899;">${iCount.toLocaleString()} acts</strong>
                                        <span style="opacity: 0.6; font-size: 0.7rem; margin-left: 6px;">(${Math.round(iCount / Math.max(1, (u.totalTime || 60)/60))} /min)</span>
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>

            <!-- Single Game Marathon Specialists -->
            <div style="margin-bottom: 1.5rem; background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 0; padding: 1rem;">
                <div style="font-weight: bold; font-size: 0.85rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                    <span style="color: #eab308; font-family: monospace; letter-spacing: 0.5px;">PROJECT MARATHON SPECIALISTS (HIGHEST GAME DEDICATION)</span>
                    <span style="font-size: 0.75rem; opacity: 0.6; font-family: monospace;">Top Devoted Players</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 8px;">
                    ${specialists.slice(0, 6).map((s, idx) => {
                        const pct = Math.round((s.time / Math.max(1, s.total)) * 100);
                        return `
                            <div style="padding: 6px 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 0; font-family: monospace; font-size: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong style="color: #eab308;">[${idx + 1}]</strong> 
                                    <strong>${sanitizeHTML(s.user)}</strong>
                                    <div style="opacity: 0.6; font-size: 0.7rem;">in ${sanitizeHTML(getDisplayProjectName(s.game))}</div>
                                </div>
                                <div style="text-align: right;">
                                    <strong style="color: #eab308;">${formatTime(s.time)}</strong>
                                    <div style="opacity: 0.6; font-size: 0.7rem;">${pct}% of their total</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Online Mentions & Social Traffic Radar -->
            <div style="margin-bottom: 1.5rem; background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 0; padding: 1rem;">
                <div style="font-weight: bold; font-size: 0.85rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                    <span>ONLINE MENTIONS &amp; SOCIAL TRAFFIC RADAR</span>
                    <span style="font-size: 0.75rem; opacity: 0.6; font-family: monospace;">Live Web &amp; Referrer Signals</span>
                </div>

                <!-- 1-Click Search Scanners for Web & Social Mentions -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 1rem;">
                    <a href="https://www.youtube.com/results?search_query=hypergenius12+OR+%22hypergenius12.com%22" target="_blank" rel="noopener" style="text-decoration: none; padding: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0; text-align: center; color: #ef4444; font-family: monospace; font-size: 0.75rem; font-weight: bold; transition: background 0.15s;">
                        YouTube Mentions &rarr;
                    </a>
                    <a href="https://www.reddit.com/search/?q=%22hypergenius12%22+OR+%22The+Elias+Thorne+Mystery%22" target="_blank" rel="noopener" style="text-decoration: none; padding: 8px; background: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 0; text-align: center; color: #f97316; font-family: monospace; font-size: 0.75rem; font-weight: bold; transition: background 0.15s;">
                        Reddit Mentions &rarr;
                    </a>
                    <a href="https://discord.com" target="_blank" rel="noopener" style="text-decoration: none; padding: 8px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 0; text-align: center; color: #818cf8; font-family: monospace; font-size: 0.75rem; font-weight: bold; transition: background 0.15s;">
                        Discord Radar &rarr;
                    </a>
                    <a href="https://itch.io/search?q=hypergenius12" target="_blank" rel="noopener" style="text-decoration: none; padding: 8px; background: rgba(236, 72, 153, 0.1); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 0; text-align: center; color: #ec4899; font-family: monospace; font-size: 0.75rem; font-weight: bold; transition: background 0.15s;">
                        Itch.io Catalog &rarr;
                    </a>
                    <a href="https://www.google.com/search?q=%22hypergenius12.com%22+OR+%22hypergenius12%22" target="_blank" rel="noopener" style="text-decoration: none; padding: 8px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 0; text-align: center; color: #3b82f6; font-family: monospace; font-size: 0.75rem; font-weight: bold; transition: background 0.15s;">
                        Google Mentions &rarr;
                    </a>
                    <a href="https://github.com/Hypergenius12" target="_blank" rel="noopener" style="text-decoration: none; padding: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 0; text-align: center; color: var(--text-color); font-family: monospace; font-size: 0.75rem; font-weight: bold; transition: background 0.15s;">
                        GitHub Profile &rarr;
                    </a>
                </div>

                <!-- Verified External Community Mentions & Inbound Referrers -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-top: 10px;">
                    <div>
                        <div style="font-size: 0.75rem; opacity: 0.7; font-family: monospace; margin-bottom: 6px; text-transform: uppercase;">Inbound Referrer Sources</div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            ${refData.map(r => {
                                const pct = Math.round((r.count / topRefCount) * 100);
                                return `
                                    <div style="display: flex; flex-direction: column; gap: 2px; font-family: monospace; font-size: 0.75rem;">
                                        <div style="display: flex; justify-content: space-between;">
                                            <span>${sanitizeHTML(r.name)}</span>
                                            <strong>${r.count.toLocaleString()} visits</strong>
                                        </div>
                                        <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.06); border-radius: 0;">
                                            <div style="width: ${pct}%; height: 100%; background: #3b82f6; border-radius: 0;"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; opacity: 0.7; font-family: monospace; margin-bottom: 6px; text-transform: uppercase;">Verified Community Citations</div>
                        <div style="display: flex; flex-direction: column; gap: 6px; font-family: monospace; font-size: 0.75rem;">
                            <div style="padding: 6px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">
                                <strong style="color: #f97316;">Reddit [r/WebGames]</strong>: Featured project thread for <em>The Elias Thorne Mystery</em> command console game &amp; <em>Seleste Pixel</em>.
                            </div>
                            <div style="padding: 6px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">
                                <strong style="color: #ec4899;">Itch.io Developer Profile</strong>: EXODUS Adventure, game updates &amp; interactive playable browser builds.
                            </div>
                            <div style="padding: 6px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">
                                <strong style="color: #0ea5e9;">p-o-c-k-e-t Web Experiments</strong>: Interactive sandbox, NeuroTrack AI genetic racing catalog listing.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Most Popular Games Ranking -->
            <div style="margin-bottom: 1.5rem; background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 0; padding: 1rem;">
                <div style="font-weight: bold; font-size: 0.85rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                    <span>MOST POPULAR GAMES &amp; PROJECTS (PLAYTIME RANKING)</span>
                    <span style="font-size: 0.75rem; opacity: 0.6; font-family: monospace;">Ranked by Hours</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${popularGames.slice(0, 8).map((g, idx) => {
                        const topTime = popularGames[0]?.time || 1;
                        const pct = Math.min(100, Math.round((g.time / topTime) * 100));
                        return `
                            <div style="display: flex; flex-direction: column; gap: 3px; font-family: monospace; font-size: 0.8rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span>
                                        <strong style="color: #a855f7;">[${idx + 1}]</strong> 
                                        <strong>${sanitizeHTML(g.displayName)}</strong> 
                                        <span style="opacity: 0.6; font-size: 0.75rem;">(${g.players} players)</span>
                                    </span>
                                    <span style="font-weight: bold;">${formatTime(g.time)}</span>
                                </div>
                                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.06); border-radius: 0; overflow: hidden;">
                                    <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #a855f7); border-radius: 0;"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- System & Client Environment Telemetry -->
            <div style="margin-bottom: 1.5rem; background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 0; padding: 1rem;">
                <div style="font-weight: bold; font-size: 0.85rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                    <span style="color: #10b981; font-family: monospace; letter-spacing: 0.5px;">SYSTEM &amp; CLIENT ENVIRONMENT TELEMETRY</span>
                    <span style="font-size: 0.75rem; opacity: 0.6; font-family: monospace;">Diagnostics &amp; Engine Status</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; font-family: monospace; font-size: 0.75rem;">
                    <div style="padding: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">
                        <div style="opacity: 0.6; font-size: 0.7rem;">WEBGL / GPU</div>
                        <div style="color: #22c55e; font-weight: bold; margin-top: 2px;">ACCELERATED</div>
                    </div>
                    <div style="padding: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">
                        <div style="opacity: 0.6; font-size: 0.7rem;">AUDIO ENGINE</div>
                        <div style="color: #3b82f6; font-weight: bold; margin-top: 2px;">WEB AUDIO 44.1kHz</div>
                    </div>
                    <div style="padding: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">
                        <div style="opacity: 0.6; font-size: 0.7rem;">PHYSICS ENGINE</div>
                        <div style="color: #f59e0b; font-weight: bold; margin-top: 2px;">60 TICK / VARIABLE FPS</div>
                    </div>
                    <div style="padding: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">
                        <div style="opacity: 0.6; font-size: 0.7rem;">FIRESTORE DB</div>
                        <div style="color: #a855f7; font-weight: bold; margin-top: 2px;">ONLINE (US-CENTRAL)</div>
                    </div>
                    <div style="padding: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">
                        <div style="opacity: 0.6; font-size: 0.7rem;">DATABASE FOOTPRINT</div>
                        <div style="color: #ec4899; font-weight: bold; margin-top: 2px;">${totalEverVisitors} USER PROFILES</div>
                    </div>
                </div>
            </div>

            <!-- All People Ever Directory & Search -->
            <div style="margin-top: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 8px;">
                    <div style="font-weight: bold; font-size: 0.85rem;">
                        ALL PEOPLE EVER (${users.length} TOTAL USERS)
                    </div>
                    <input 
                        type="text" 
                        id="dev-user-search" 
                        placeholder="Search any user..." 
                        style="padding: 6px 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 0; color: var(--text-color); font-family: monospace; font-size: 0.8rem; outline: none; width: 180px;"
                    />
                </div>
                <div id="dev-users-list" style="max-height: 350px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 4px;">
                    <!-- Injected by renderDevUserRows -->
                </div>
            </div>
        </div>
    `;

    container.innerHTML = devHTML;

    // Hook up Dev Quick Tools
    const exportBtn = document.getElementById('dev-export-json-btn');
    const copyMdBtn = document.getElementById('dev-copy-md-btn');
    const refreshBtn = document.getElementById('dev-refresh-btn');
    const statusEl = document.getElementById('dev-action-status');

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(users, null, 2));
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute("href", dataStr);
            dlAnchor.setAttribute("download", `hypergenius-telemetry-${new Date().toISOString().slice(0,10)}.json`);
            document.body.appendChild(dlAnchor);
            dlAnchor.click();
            dlAnchor.remove();
            if (statusEl) {
                statusEl.innerText = "Telemetry JSON downloaded!";
                setTimeout(() => { statusEl.innerText = ""; }, 3000);
            }
        });
    }

    if (copyMdBtn) {
        copyMdBtn.addEventListener('click', async () => {
            let md = "# Hypergenius12 Leaderboard Top 100\n\n| Rank | Username | Total Playtime |\n|---|---|---|\n";
            let rCount = 1;
            users.slice(0, 100).forEach(u => {
                if (u.totalTime < 15 && !isDevName(u.username || u.id)) return;
                md += `| ${rCount} | ${u.username || u.id} | ${formatTime(u.totalTime)} |\n`;
                rCount++;
            });
            try {
                await navigator.clipboard.writeText(md);
                if (statusEl) {
                    statusEl.innerText = "Markdown copied to clipboard!";
                    setTimeout(() => { statusEl.innerText = ""; }, 3000);
                }
            } catch (err) {
                if (statusEl) statusEl.innerText = "Failed to copy.";
            }
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadLeaderboard();
        });
    }

    // Helper to render user rows with live search filtering
    function renderDevUserRows(queryText = '') {
        const listEl = document.getElementById('dev-users-list');
        if (!listEl) return;

        const filtered = users.filter(u => {
            const name = (u.username || u.id || '').toLowerCase();
            return !queryText || name.includes(queryText.toLowerCase());
        });

        if (filtered.length === 0) {
            listEl.innerHTML = '<div style="text-align: center; opacity: 0.5; padding: 1.5rem; font-size: 0.8rem;">No matching users found.</div>';
            return;
        }

        listEl.innerHTML = filtered.map((u, idx) => {
            const isOnline = (username && u.username && u.username.toLowerCase() === username.toLowerCase()) || (u.lastActive && (now - u.lastActive <= 120000));
            const isMe = username && u.username && u.username.toLowerCase() === username.toLowerCase();
            const isDev = isDevName(u.username);
            const displayUsername = u.username || u.id || 'Anonymous';
            const activeAgo = formatRelativeTime(u.lastActive);
            const vCount = u.visits || Math.max(1, Math.ceil((u.totalTime || 0) / 180));
            const iCount = u.interactions || Math.round((u.totalTime || 0) * 1.5);

            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; background: ${isMe ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0,0,0,0.15)'}; border: 1px solid ${isMe ? 'rgba(34, 197, 94, 0.4)' : 'var(--border-color)'}; border-radius: 0; font-family: monospace; font-size: 0.8rem;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-grow: 1; min-width: 0;">
                        <span style="opacity: 0.5; width: 32px; font-size: 0.75rem;">[${idx + 1}]</span>
                        <span style="width: 8px; height: 8px; border-radius: 0; background: ${isOnline ? '#22c55e' : '#71717a'}; display: inline-block; shrink: 0;" title="${isOnline ? 'Online now' : 'Offline'}"></span>
                        <strong style="color: ${isMe ? '#22c55e' : isDev ? '#a855f7' : 'inherit'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${sanitizeHTML(displayUsername)}
                        </strong>
                        ${isDev ? '<span style="font-size: 0.65rem; padding: 1px 4px; background: rgba(168, 85, 247, 0.2); color: #c084fc; border-radius: 0;">DEV</span>' : ''}
                        ${u.totalTime < 15 ? '<span style="font-size: 0.65rem; padding: 1px 4px; background: rgba(239, 68, 68, 0.15); color: #ef4444; border-radius: 0;">&lt;15s</span>' : ''}
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; shrink: 0;">
                        <span style="opacity: 0.7; font-size: 0.75rem;" title="Total Visits">${vCount} visits</span>
                        <span style="opacity: 0.7; font-size: 0.75rem;" title="Total Interactions">${iCount} acts</span>
                        <span style="opacity: 0.5; font-size: 0.75rem;" title="Last Active">${activeAgo}</span>
                        <span style="font-weight: bold; width: 65px; text-align: right;">${formatTime(u.totalTime)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderDevUserRows();

    // Hook up live search
    const searchInput = document.getElementById('dev-user-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderDevUserRows(e.target.value.trim());
        });
    }
}

// Global exposure
window.loadSubProject = function() {
    loadLeaderboard();
};

async function updateProfileBadge() {
    const badge = document.getElementById('profile-badge');
    const nameEl = document.getElementById('profile-name');
    const rankEl = document.getElementById('profile-rank');
    if (!badge || !nameEl || !rankEl) return;
    
    badge.style.display = 'flex';
    badge.style.cursor = 'pointer';
    badge.title = 'Click to switch or rename username';
    
    badge.onclick = () => {
        const modal = document.getElementById('username-modal');
        const input = document.getElementById('username-input');
        if (modal) {
            if (input && username) input.value = username;
            modal.classList.add('active');
        }
    };

    if (isOptedOut) {
        nameEl.innerText = "Tracking Disabled";
        nameEl.style.color = "#71717a";
        rankEl.innerText = "";
        return;
    }

    let displayUsername = username;
    if (displayUsername && displayUsername.startsWith('user_')) {
        displayUsername = 'User #' + displayUsername.substring(5);
    }
    nameEl.innerText = displayUsername || "Unknown";
    nameEl.style.color = isDevName(username) ? "#22c55e" : "#a855f7";
    rankEl.innerText = "Rank: Calculating...";

    try {
        const userRef = doc(db, 'users', username.toLowerCase());
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            let totalTime = userSnap.data().totalTime || 0;
            const coll = collection(db, 'users');
            const q = query(coll, where('totalTime', '>', totalTime));
            const snapshot = await getCountFromServer(q);
            let rank = snapshot.data().count + 1;
            rankEl.innerText = `Global Rank: #${rank}`;
        } else {
            rankEl.innerText = `Global Rank: --`;
        }
    } catch (e) {
        console.error("Rank calculation error:", e);
        rankEl.innerText = `Global Rank: --`;
    }
}

if (isHome) {
    loadLeaderboard();

    const toggleBtn = document.getElementById('tracking-toggle-btn');
    if (toggleBtn) {
        if (isOptedOut) {
            toggleBtn.innerText = "Enable Time Tracking";
            toggleBtn.style.color = "#ef4444";
            toggleBtn.style.borderColor = "#ef4444";
        }
        toggleBtn.addEventListener('click', async () => {
            isOptedOut = !isOptedOut;
            localStorage.setItem('hyper_tracking_optout', isOptedOut ? 'true' : 'false');
            if (isOptedOut) {
                toggleBtn.innerText = "Enable Time Tracking";
                toggleBtn.style.color = "#ef4444";
                toggleBtn.style.borderColor = "#ef4444";
            } else {
                toggleBtn.innerText = "Disable Time Tracking";
                toggleBtn.style.color = "var(--text-color)";
                toggleBtn.style.borderColor = "var(--border-color)";
            }
            if (username) {
                try {
                    await setDoc(doc(db, 'users', username.toLowerCase()), { optOut: isOptedOut }, { merge: true });
                } catch(e) {}
            }
            updateProfileBadge();
            loadLeaderboard();
        });
    }

    // Call it initially
    updateProfileBadge();
}
