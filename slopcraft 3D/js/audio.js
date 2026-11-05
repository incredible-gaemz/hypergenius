// ============================================
// audio.js - SFX Synthesizer using Web Audio API
// ============================================

import { BLOCKS, getBlockProperties } from './textures.js?v=116';

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.underwaterFilter = null;
        this.camera = null;
        this._isUnderwater = false;
        this.masterVolume = 1.0;

        // Background music player
        this.musicGain = null;
        this.musicAudio = null;
        this.isMusicPlaying = false;
        this.musicTimer = null;
        this.musicTracks = [
            'sweden',
            'subwoofer_lullaby',
            'wet_hands',
            'dry_hands',
            'minecraft',
            'clark',
            'haggstrom',
            'living_mice',
            'mice_on_venus'
        ];
        this.lastTrackIndex = -1;
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        }
        if (this.musicAudio) {
            this.musicAudio.volume = Math.max(0, Math.min(1, 0.45 * this.masterVolume));
        }
    }

    _ensureContext() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Master gain connects to underwater lowpass filter, which connects to destination
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = (this.masterVolume !== undefined ? this.masterVolume : 1.0);

        this.underwaterFilter = this.ctx.createBiquadFilter();
        this.underwaterFilter.type = 'lowpass';
        this.underwaterFilter.frequency.setValueAtTime(22000, this.ctx.currentTime);
        this.underwaterFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

        this.masterGain.connect(this.underwaterFilter);
        this.underwaterFilter.connect(this.ctx.destination);

        // Music gain (routed through underwater filter as well, so underwater muffles ambient music like Minecraft!)
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.45;
        this.musicGain.connect(this.underwaterFilter);

        this.startMusicScheduler();
    }

    setUnderwater(isUnderwater) {
        if (this._isUnderwater === isUnderwater) return;
        this._isUnderwater = isUnderwater;
        if (!this.underwaterFilter || !this.ctx) return;

        const targetFreq = isUnderwater ? 380 : 22000;
        const now = this.ctx.currentTime;
        this.underwaterFilter.frequency.cancelScheduledValues(now);
        this.underwaterFilter.frequency.setTargetAtTime(targetFreq, now, 0.12);
    }

    startMusicScheduler() {
        if (this.musicTimer) return;
        // First track starts after a short initial ambience delay (15-30s)
        const initialDelay = 15000 + Math.random() * 15000;
        this.musicTimer = setTimeout(() => this._playNextMusicTrack(), initialDelay);
    }

    _playNextMusicTrack() {
        if (!this.musicTracks || this.musicTracks.length === 0) return;
        let nextIdx = Math.floor(Math.random() * this.musicTracks.length);
        if (this.musicTracks.length > 1 && nextIdx === this.lastTrackIndex) {
            nextIdx = (nextIdx + 1) % this.musicTracks.length;
        }
        this.lastTrackIndex = nextIdx;
        const trackName = this.musicTracks[nextIdx];
        const localSrc = `assets/mc/sounds/music/game/${trackName}.ogg`;
        const cdnSrc = `https://assets.mcasset.cloud/1.21.11/assets/minecraft/sounds/music/game/${trackName}.ogg`;

        if (this.musicAudio) {
            try { this.musicAudio.pause(); } catch(e) {}
            this.musicAudio = null;
        }

        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = localSrc;
        this.musicAudio = audio;
        this.isMusicPlaying = true;

        let sourceNode = null;
        try {
            sourceNode = this.ctx.createMediaElementSource(audio);
            sourceNode.connect(this.musicGain);
        } catch(e) {
            // If already connected or CORS fallback
        }

        const onTrackEnded = () => {
            this.isMusicPlaying = false;
            // Minecraft pauses 1 to 4 minutes between songs (60s to 240s)
            const gapMs = (60 + Math.random() * 180) * 1000;
            this.musicTimer = setTimeout(() => this._playNextMusicTrack(), gapMs);
        };

        audio.addEventListener('ended', onTrackEnded, { once: true });
        audio.addEventListener('error', () => {
            if (audio.src !== cdnSrc) {
                audio.src = cdnSrc;
                audio.play().catch(() => onTrackEnded());
            } else {
                onTrackEnded();
            }
        }, { once: true });

        // Resume audio context if user has interacted
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        audio.play().catch(() => {
            // Autoplay policy: retry on user interaction
            const retryPlay = () => {
                window.removeEventListener('click', retryPlay);
                window.removeEventListener('keydown', retryPlay);
                if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
                audio.play().catch(() => onTrackEnded());
            };
            window.addEventListener('click', retryPlay, { once: true });
            window.addEventListener('keydown', retryPlay, { once: true });
        });
    }

    _loadMCFile(path) {
        if (!this.mcCache) this.mcCache = {};
        if (this.mcCache[path]) return this.mcCache[path];
        
        this.mcCache[path] = (async () => {
            try {
                // Try local first if available, else jsdelivr CDN or mcasset.cloud (both have Access-Control-Allow-Origin: *)
                let res = await fetch(`assets/mc/sounds/${path}.ogg`);
                if (!res.ok) {
                    res = await fetch(`https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.4/assets/minecraft/sounds/${path}.ogg`);
                }
                if (!res.ok) {
                    res = await fetch(`https://assets.mcasset.cloud/1.21.11/assets/minecraft/sounds/${path}.ogg`);
                }
                if (!res.ok) throw new Error("HTTP error");
                const arrayBuffer = await res.arrayBuffer();
                const audioBuffer = await new Promise((resolve, reject) => {
                    this.ctx.decodeAudioData(arrayBuffer, resolve, reject);
                });
                return audioBuffer;
            } catch (e) {
                return null;
            }
        })();
        
        return this.mcCache[path];
    }
    
    async playMC(path, vol=1.0, position=null) {
        this._ensureContext();
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        const buffer = await this._loadMCFile(path);
        if (!buffer) return false;
        
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.value = vol;
        source.connect(gain);
        
        if (position && this.camera) {
            this._connectWithPanner(gain, position);
        } else {
            gain.connect(this.masterGain);
        }
        source.start();
        return true;
    }

    playTone(freq, type, duration, vol = 1.0, slide = 0, position = null) {
        this._ensureContext();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slide !== 0) {
            osc.frequency.exponentialRampToValueAtTime(freq + slide, this.ctx.currentTime + duration);
        }
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        this._connectWithPanner(gain, position);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration, vol = 1.0, position = null) {
        this._ensureContext();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buffer;
        
        // Simple lowpass filter for noise
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        noiseSource.connect(filter);
        filter.connect(gain);
        this._connectWithPanner(gain, position);
        
        noiseSource.start();
    }

    _connectWithPanner(sourceNode, position) {
        if (position && this.camera) {
            const panner = this.ctx.createPanner();
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = 1;
            panner.maxDistance = 50;
            panner.rolloffFactor = 1;
            
            panner.positionX.value = position.x;
            panner.positionY.value = position.y;
            panner.positionZ.value = position.z;

            if (this.ctx.listener && this.ctx.listener.positionX) {
                this.ctx.listener.positionX.value = this.camera.position.x;
                this.ctx.listener.positionY.value = this.camera.position.y;
                this.ctx.listener.positionZ.value = this.camera.position.z;
                
                // Hacky way to get forward vector for Three.js camera
                const vector = new THREE.Vector3(0, 0, -1);
                vector.applyQuaternion(this.camera.quaternion);
                
                if (this.ctx.listener.forwardX) {
                    this.ctx.listener.forwardX.value = vector.x;
                    this.ctx.listener.forwardY.value = vector.y;
                    this.ctx.listener.forwardZ.value = vector.z;
                    
                    const up = new THREE.Vector3(0, 1, 0);
                    up.applyQuaternion(this.camera.quaternion);
                    this.ctx.listener.upX.value = up.x;
                    this.ctx.listener.upY.value = up.y;
                    this.ctx.listener.upZ.value = up.z;
                }
            }
            
            sourceNode.connect(panner);
            panner.connect(this.masterGain);
        } else {
            sourceNode.connect(this.masterGain);
        }
    }

    _getMCBlockMaterial(blockType) {
        if (blockType === undefined || blockType === null) return 'stone';
        
        let props = null;
        try {
            if (typeof getBlockProperties === 'function') {
                props = getBlockProperties(blockType);
            }
        } catch (e) {}

        const name = (props && props.name) ? props.name.toLowerCase() : '';
        
        if (props && props.isLog) return 'wood';
        if (name.includes('wood') || name.includes('plank') || name.includes('log') || name.includes('door') || name.includes('chest') || name.includes('table') || name.includes('barrel') || name.includes('fence') || name.includes('slab')) {
            if (!name.includes('stone') && !name.includes('brick') && !name.includes('cobble')) return 'wood';
        }
        if (name.includes('leaves') || name.includes('grass') || name.includes('fern') || name.includes('flower') || name.includes('bush') || name.includes('plant') || name.includes('vine') || name.includes('spore') || name.includes('moss') || name.includes('crop') || name.includes('sapling') || name.includes('wart') || name.includes('pad') || name.includes('algae') || name.includes('roots') || name.includes('cactus')) {
            return 'grass';
        }
        if (name.includes('dirt') || name.includes('mud') || name.includes('podzol') || name.includes('mycelium') || name.includes('farmland') || name.includes('soul')) {
            return 'gravel';
        }
        if (name.includes('sand')) return 'sand';
        if (name.includes('gravel')) return 'gravel';
        if (name.includes('snow')) return 'snow';
        if (name.includes('ice') || name.includes('glass')) return 'glass';

        const woods = [BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.ACACIA_WOOD, BLOCKS.ACACIA_PLANKS, BLOCKS.CHERRY_LOG, BLOCKS.CHERRY_PLANKS, BLOCKS.AUTUMN_WOOD, BLOCKS.AUTUMN_PLANKS, BLOCKS.PALM_WOOD, BLOCKS.PALM_PLANKS, BLOCKS.PINE_WOOD, BLOCKS.PINE_PLANKS, BLOCKS.DARK_OAK_WOOD, BLOCKS.DARK_OAK_PLANKS, BLOCKS.BIRCH_WOOD, BLOCKS.BIRCH_PLANKS, BLOCKS.CRIMSON_STEM, BLOCKS.CRIMSON_PLANKS, BLOCKS.MUSHROOM_STEM, BLOCKS.CRAFTING_TABLE, BLOCKS.CHEST_BLOCK, BLOCKS.BARREL, BLOCKS.ENCHANTED_AETHER_LOG, BLOCKS.PORTAL_FRAME];
        if (woods.includes(blockType)) return 'wood';
        
        const plants = [BLOCKS.TALL_GRASS, BLOCKS.ALIEN_TALL_GRASS, BLOCKS.AETHER_TALL_GRASS, BLOCKS.RED_FLOWER, BLOCKS.BLUE_FLOWER, BLOCKS.YELLOW_FLOWER, BLOCKS.WHITE_FLOWER, BLOCKS.PURPLE_FLOWER, BLOCKS.ORANGE_FLOWER, BLOCKS.FERN, BLOCKS.OASIS_FERN, BLOCKS.AETHER_FLOWER, BLOCKS.VINES, BLOCKS.SUGARCANE, BLOCKS.SEAGRASS, BLOCKS.KELP, BLOCKS.KELP_PLANT, BLOCKS.RED_KELP, BLOCKS.BROWN_KELP, BLOCKS.ALGAE, BLOCKS.LILY_PAD, BLOCKS.CACTUS, BLOCKS.NETHER_WART_BLOCK, BLOCKS.TUBE_CORAL, BLOCKS.BRAIN_CORAL, BLOCKS.FIRE_CORAL, BLOCKS.HORN_CORAL, BLOCKS.BUBBLE_CORAL];
        if (plants.includes(blockType)) return 'grass';
        const grasses = [BLOCKS.GRASS, BLOCKS.DIRT, BLOCKS.SAVANNA_GRASS, BLOCKS.SWAMP_GRASS, BLOCKS.ALIEN_GRASS, BLOCKS.PINE_GRASS, BLOCKS.MUD, BLOCKS.MYCELIUM, BLOCKS.AETHER_GRASS, BLOCKS.AETHER_DIRT, BLOCKS.CRIMSON_NYLIUM, BLOCKS.LEAVES, BLOCKS.ACACIA_LEAVES, BLOCKS.CHERRY_LEAVES, BLOCKS.AUTUMN_LEAVES, BLOCKS.PALM_LEAVES, BLOCKS.PINE_LEAVES, BLOCKS.DARK_OAK_LEAVES, BLOCKS.BIRCH_LEAVES, BLOCKS.GLOW_LEAVES, BLOCKS.ENCHANTED_AETHER_LEAVES, BLOCKS.CRIMSON_WART, BLOCKS.MUSHROOM_CAP, BLOCKS.ALIEN_SPORE_BLOCK];
        if (grasses.includes(blockType)) return 'grass';
        
        const sands = [BLOCKS.SAND, BLOCKS.RED_SAND];
        if (sands.includes(blockType)) return 'sand';
        
        const gravels = [BLOCKS.GRAVEL, BLOCKS.QUICKSOIL];
        if (gravels.includes(blockType)) return 'gravel';
        
        const snows = [BLOCKS.SNOW];
        if (snows.includes(blockType)) return 'snow';
        
        const glasses = [BLOCKS.GLASS, BLOCKS.ALIEN_CRYSTAL, BLOCKS.GLOWSTONE, BLOCKS.SEA_LANTERN, BLOCKS.ICE];
        if (glasses.includes(blockType)) return 'glass';
        
        return 'stone';
    }

    playFootstep(blockType) {
        const doFallback = () => { this.playNoise(0.05, 0.1); };
        let mat = this._getMCBlockMaterial(blockType);
        if (mat === 'glass') mat = 'stone'; // stepping on glass sounds like stone
        const v = Math.floor(Math.random() * 4) + 1;
        this.playMC(`step/${mat}${v}`, 0.4).then(s => { if(!s) doFallback(); });
    }

    playSwim(position = null) {
        const v = Math.floor(Math.random() * 4) + 1;
        this.playMC(`liquid/swim${v}`, 0.6, position).then(s => { if(!s) this.playNoise(0.1, 0.2, position); });
    }

    playWaterSplash(position = null) {
        const doFallback = () => { this.playNoise(0.3, 0.4, position); };
        this.playMC('random/splash', 0.6, position).then(s => { if(!s) doFallback(); });
    }

    playItemBreak(position = null) {
        const doFallback = () => {
            this.playNoise(0.2, 0.5, position);
            this.playTone(200, 'square', 0.1, 0.3, -120, position);
        };
        this.playMC('random/break', 0.8, position).then(s => { if(!s) doFallback(); });
    }

    playBreak(blockType) {
        const doFallback = () => {
            this.playNoise(0.15, 0.3);
            this.playTone(150, 'square', 0.05, 0.2, -50);
        };
        let mat = this._getMCBlockMaterial(blockType);
        if (mat === 'glass') {
            const v = Math.floor(Math.random() * 3) + 1;
            this.playMC(`random/glass${v}`, 0.6).then(s => { if(!s) doFallback(); });
            return;
        }
        const v = Math.floor(Math.random() * 4) + 1;
        this.playMC(`dig/${mat}${v}`, 0.6).then(s => { if(!s) doFallback(); });
    }

    playPlace(blockType, position) {
        const doFallback = () => {
            this.playNoise(0.1, 0.2, position);
        };
        let mat = this._getMCBlockMaterial(blockType);
        if (mat === 'glass') mat = 'stone'; // placing glass sounds like stone in MC
        const v = Math.floor(Math.random() * 4) + 1;
        // In Minecraft, placing blocks uses dig/<material> sounds (not footsteps!)
        this.playMC(`dig/${mat}${v}`, 0.65, position).then(s => {
            if (!s) {
                this.playMC(`step/${mat}${v}`, 0.5, position).then(s2 => {
                    if (!s2) doFallback();
                });
            }
        });
    }

    playExplode(position = null) {
        const v = Math.floor(Math.random() * 4) + 1;
        this.playMC(`random/explode${v}`, 0.9, position).then(s => { if(!s) this.playNoise(0.5, 0.8, position); });
    }

    playFizz(position = null) {
        this.playMC('random/fizz', 0.8, position).then(s => { if(!s) this.playNoise(0.2, 0.4, position); });
    }

    playHit(position) {
        const doFallback = () => {
            this.playNoise(0.05, 0.4, position);
            this.playTone(300, 'square', 0.05, 0.2, -100, position);
        };
        this.playMC('damage/hit1', 0.7, position).then(s => { if(!s) doFallback(); });
    }

    playHurt(position) {
        const doFallback = () => {
            this.playTone(400, 'sawtooth', 0.2, 0.4, -200, position);
            this.playNoise(0.1, 0.5, position);
        };
        this.playMC('damage/hit2', 0.7, position).then(s => { if(!s) doFallback(); });
    }

    playChestOpen(position = null) {
        this.playMC('block/chest/open', 0.8, position).then(s => { if(!s) this.playNoise(0.1, 0.3, position); });
    }
    
    playChestClose(position = null) {
        this.playMC('block/chest/close1', 0.8, position).then(s => { if(!s) this.playNoise(0.1, 0.3, position); });
    }
    
    playDoorOpen(position = null) {
        this.playMC('random/door_open', 0.8, position).then(s => { if(!s) this.playNoise(0.1, 0.2, position); });
    }
    
    playDoorClose(position = null) {
        this.playMC('random/door_close', 0.8, position).then(s => { if(!s) this.playNoise(0.1, 0.2, position); });
    }

    playEat(position = null) {
        const doFallback = () => {
            this.playNoise(0.2, 0.4, position);
            this.playTone(300, 'square', 0.1, 0.3, -50, position);
        };
        const v = Math.floor(Math.random() * 3) + 1;
        this.playMC(`random/eat${v}`, 0.7, position).then(s => { if(!s) doFallback(); });
    }

    playClick() {
        const doFallback = () => {
            this.playTone(800, 'sine', 0.05, 0.2);
        };
        this.playMC('random/click', 0.7).then(s => { if(!s) doFallback(); });
    }

    playPop(position = null) {
        const doFallback = () => {
            this.playTone(600, 'sine', 0.08, 0.3, 200, position);
        };
        this.playMC('random/pop', 0.7, position).then(s => { if(!s) doFallback(); });
    }

    playCast(element = null, position = null) {
        if (typeof element === 'object' && element !== null && (element.x !== undefined || element.y !== undefined)) {
            position = element;
            element = null;
        }
        if (element === 'FIRE' || element === 'LAVA' || element === 'MAGMA') {
            this.playMC('item/firecharge/use', 0.85, position).then(s => {
                if (!s) {
                    this.playTone(220, 'sawtooth', 0.22, 0.4, 380, position);
                    this.playNoise(0.2, 0.25, position);
                }
            });
        } else if (element === 'ICE' || element === 'FROST') {
            this.playTone(850, 'sine', 0.25, 0.35, 450, position);
            setTimeout(() => this.playTone(1200, 'triangle', 0.2, 0.3, -200, position), 60);
        } else if (element === 'BUILDER') {
            this.playTone(320, 'triangle', 0.3, 0.45, 120, position);
            setTimeout(() => this.playTone(480, 'sine', 0.25, 0.35, -80, position), 70);
            this.playMC('block/stone/place', 0.7, position);
        } else if (element === 'THUNDER' || element === 'STORM') {
            this.playTone(140, 'sawtooth', 0.18, 0.5, 300, position);
            this.playNoise(0.25, 0.35, position);
        } else if (element === 'VOID' || element === 'DARK') {
            this.playTone(110, 'sine', 0.4, 0.6, -40, position);
            this.playTone(190, 'triangle', 0.3, 0.4, 60, position);
        } else if (element === 'HEAL') {
            this.playTone(523.25, 'sine', 0.18, 0.3, 0, position);
            setTimeout(() => this.playTone(659.25, 'sine', 0.18, 0.3, 0, position), 70);
            setTimeout(() => this.playTone(783.99, 'sine', 0.25, 0.3, 0, position), 140);
        } else {
            this.playMC('random/bow', 0.8, position).then(s => {
                if (!s) this.playTone(600, 'sine', 0.3, 0.3, 400, position);
            });
        }
    }

    playBow(position = null) {
        this.playMC('random/bow', 1.0, position).then(s => {
            if (!s) this.playTone(450, 'triangle', 0.2, 0.4, 250, position);
        });
    }

    playPortalTravel(position = null) {
        const doFallback = () => {
            this.playTone(180, 'sine', 1.2, 0.4, 60, position);
            this.playTone(90, 'triangle', 1.4, 0.5, -30, position);
            this.playNoise(0.8, 0.25, position);
        };
        this.playMC('portal/travel', 0.85, position).then(s => { if (!s) doFallback(); });
    }

    playEyePlace(position = null) {
        const doFallback = () => {
            this.playTone(420, 'sine', 0.12, 0.4, 80, position);
        };
        const v = Math.floor(Math.random() * 3) + 1;
        this.playMC(`block/end_portal/eyeplace${v}`, 0.9, position).then(s => { if (!s) doFallback(); });
    }

    playEnderEyeLaunch(position = null) {
        const doFallback = () => {
            this.playTone(340, 'sine', 0.35, 0.4, 260, position);
        };
        this.playMC('entity/endereye/endereye_launch1', 0.85, position).then(s => { if (!s) doFallback(); });
    }

    playEndPortalSpawn(position = null) {
        const doFallback = () => {
            if (this.playExplode) this.playExplode();
            if (this.playPortalTravel) this.playPortalTravel(position);
        };
        this.playMC('block/end_portal/endportal', 1.0, position).then(s => { if (!s) doFallback(); });
    }

    playWardenHeartbeat(position = null) {
        const doFallback = () => {
            this.playTone(60, 'sine', 0.25, 0.6, -20, position);
        };
        this.playMC('entity/warden/heartbeat', 0.9, position).then(s => { if (!s) doFallback(); });
    }

    playWardenRoar(position = null) {
        const doFallback = () => {
            this.playTone(85, 'sawtooth', 0.8, 0.8, -35, position);
            this.playNoise(0.6, 0.4, position);
        };
        this.playMC('entity/warden/roar', 1.0, position).then(s => { if (!s) doFallback(); });
    }

    playWardenSonicBoom(position = null) {
        const doFallback = () => {
            this.playTone(180, 'sawtooth', 0.6, 0.9, -120, position);
            this.playTone(45, 'sine', 0.9, 1.0, 0, position);
            this.playNoise(0.5, 0.6, position);
        };
        this.playMC('entity/warden/sonic_boom', 1.0, position).then(s => { if (!s) doFallback(); });
    }

    playVillager(position = null) {
        const doFallback = () => {
            this.playTone(160, 'triangle', 0.35, 0.5, 40, position);
        };
        const v = Math.floor(Math.random() * 3) + 1;
        this.playMC(`entity/villager/idle${v}`, 0.8, position).then(s => { if (!s) doFallback(); });
    }

    playBoneMeal(position = null) {
        const doFallback = () => {
            const freqs = [520, 680, 840, 1040, 1280];
            freqs.forEach((f, idx) => {
                setTimeout(() => {
                    this.playTone(f + (Math.random() - 0.5) * 80, 'sine', 0.08, 0.35, 120, position);
                }, idx * 25);
            });
            this.playNoise(0.12, 0.25, position);
        };
        this.playMC('item/bone_meal/use', 0.85, position).then(s => { if (!s) doFallback(); });
    }

    playEnderPearlThrow(position = null) {
        const doFallback = () => {
            this.playTone(460, 'sine', 0.2, 0.45, 180, position);
        };
        this.playMC('entity/ender_pearl/throw', 0.8, position).then(s => {
            if (!s) {
                this.playMC('random/bow', 0.7, position).then(s2 => {
                    if (!s2) doFallback();
                });
            }
        });
    }

    playEnderPearlTeleport(position = null) {
        const doFallback = () => {
            this.playTone(280, 'sine', 0.35, 0.6, 220, position);
            this.playTone(440, 'triangle', 0.3, 0.5, -180, position);
            this.playNoise(0.2, 0.3, position);
        };
        this.playMC('entity/enderman/teleport', 0.9, position).then(s => {
            if (!s) {
                this.playMC('item/chorus_fruit/teleport', 0.85, position).then(s2 => {
                    if (!s2) doFallback();
                });
            }
        });
    }

    playChorusTeleport(position = null) {
        const doFallback = () => {
            this.playTone(320, 'sine', 0.25, 0.5, 200, position);
            this.playTone(550, 'triangle', 0.2, 0.4, -150, position);
        };
        this.playMC('item/chorus_fruit/teleport', 0.85, position).then(s => { if (!s) doFallback(); });
    }

    playEndGatewayTeleport(position = null) {
        const doFallback = () => {
            this.playTone(120, 'sine', 0.8, 0.7, 180, position);
            this.playTone(60, 'triangle', 1.0, 0.6, 0, position);
            this.playNoise(0.5, 0.3, position);
        };
        this.playMC('block/end_gateway/teleport', 1.0, position).then(s => { if (!s) doFallback(); });
    }

    playPolarBearRoar(position = null) {
        const doFallback = () => {
            this.playTone(95, 'sawtooth', 0.6, 0.7, -40, position);
            this.playNoise(0.4, 0.3, position);
        };
        this.playMC('entity/polar_bear/warning', 0.9, position).then(s => { if (!s) doFallback(); });
    }

    playSnowballThrow(position = null) {
        const doFallback = () => {
            this.playTone(450, 'sine', 0.08, 0.3, 150, position);
        };
        this.playMC('entity/snowball/throw', 0.7, position).then(s => { if (!s) doFallback(); });
    }

    playWitchCelebrate(position = null) {
        const doFallback = () => {
            this.playTone(320, 'triangle', 0.15, 0.5, 60, position);
            setTimeout(() => this.playTone(480, 'triangle', 0.25, 0.5, -80, position), 120);
        };
        this.playMC('entity/witch/celebrate', 0.85, position).then(s => { if (!s) doFallback(); });
    }

    playPotionThrow(position = null) {
        const doFallback = () => {
            this.playTone(380, 'sine', 0.1, 0.35, 120, position);
        };
        this.playMC('entity/witch/throw', 0.75, position).then(s => { if (!s) doFallback(); });
    }

    playPotionSplash(position = null) {
        const doFallback = () => {
            this.playNoise(0.2, 0.5, position);
            this.playTone(600, 'sine', 0.15, 0.4, -200, position);
        };
        this.playMC('entity/potion/splash', 0.85, position).then(s => { if (!s) doFallback(); });
    }
}

