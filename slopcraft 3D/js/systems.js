// ============================================
// systems.js — Lighting, Particles, Audio, UI
// ============================================
import * as THREE from 'three';
import { BLOCKS, getBlockProperties, generateItemTexture, drawDynamicCompassCanvas, drawDynamicClockCanvas } from './textures.js?v=157';
import { Spell, SPELL_TYPES, Wand, Modifier, MODIFIER_TYPES } from './magic.js?v=148';

export class LightingSystem {
    constructor(scene, world = null) {
        this.scene = scene;
        this.world = world;
        this.timeOfDay = 0.3; // start in morning
        this.dayLength = 600; // seconds
        this.weather = 'clear'; // 'clear' | 'rain' | 'thunder'

        // Authentic Minecraft lighting: luminous ambient skylight and directional sun balanced with bright sky
        this.ambientLight = new THREE.AmbientLight(0xdce5f4, 0.88);
        this.scene.add(this.ambientLight);

        // Warm sun directional light (provides clean 3D block shading and face contrast)
        this.sunLight = new THREE.DirectionalLight(0xfff8ea, 0.78);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 140;
        const shadowFrustum = 36;
        this.sunLight.shadow.camera.left = -shadowFrustum;
        this.sunLight.shadow.camera.right = shadowFrustum;
        this.sunLight.shadow.camera.top = shadowFrustum;
        this.sunLight.shadow.camera.bottom = -shadowFrustum;
        this.sunLight.shadow.bias = -0.001;
        this.sunLight.shadow.normalBias = 0.02;
        this.scene.add(this.sunLight);
        this.scene.add(this.sunLight.target);
        this.caveFactor = 0.0;
        this.lastAmbientIntensity = 0.88;
        this.brightnessMultiplier = 1.25;

        // Load Sun Texture (assets/mc/environment/sun.png with jsdelivr CDN fallback)
        const texLoader = new THREE.TextureLoader();
        const cdnSunUrl = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.4/assets/minecraft/textures/environment/sun.png';
        const cdnMoonUrl = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.4/assets/minecraft/textures/environment/moon_phases.png';

        const sunTexture = texLoader.load('assets/mc/environment/sun.png', undefined, undefined, () => {
            texLoader.load(cdnSunUrl, (loadedTex) => {
                loadedTex.magFilter = THREE.NearestFilter;
                loadedTex.minFilter = THREE.NearestFilter;
                loadedTex.generateMipmaps = false;
                sunMat.map = loadedTex;
                sunMat.needsUpdate = true;
            });
        });
        sunTexture.magFilter = THREE.NearestFilter;
        sunTexture.minFilter = THREE.NearestFilter;
        sunTexture.generateMipmaps = false;

        // Sun Mesh: Authentic square Minecraft celestial plane
        const sunGeo = new THREE.PlaneGeometry(24, 24);
        const sunMat = new THREE.MeshBasicMaterial({
            map: sunTexture,
            transparent: true,
            alphaTest: 0.05,
            depthWrite: false,
            fog: false,
            side: THREE.DoubleSide
        });
        this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
        this.sunMesh.renderOrder = -1; // Render before other transparent geometry
        this.scene.add(this.sunMesh);

        // Moon Light (Authentic soft cool blue Minecraft moonlight)
        this.moonLight = new THREE.DirectionalLight(0x687898, 0.26);
        this.moonLight.castShadow = false; // Disabled for FPS
        this.scene.add(this.moonLight);

        // Load Moon Phases Texture (assets/mc/environment/moon_phases.png, 4 columns x 2 rows = 8 phases)
        const moonTexture = texLoader.load('assets/mc/environment/moon_phases.png', undefined, undefined, () => {
            texLoader.load(cdnMoonUrl, (loadedTex) => {
                loadedTex.magFilter = THREE.NearestFilter;
                loadedTex.minFilter = THREE.NearestFilter;
                loadedTex.generateMipmaps = false;
                loadedTex.wrapS = THREE.RepeatWrapping;
                loadedTex.wrapT = THREE.RepeatWrapping;
                loadedTex.repeat.set(0.25, 0.5);
                const dayIndex = Math.floor(this.timeOfDay * 8) % 8;
                loadedTex.offset.set((dayIndex % 4) * 0.25, Math.floor(dayIndex / 4) === 0 ? 0.5 : 0.0);
                moonMat.map = loadedTex;
                moonMat.needsUpdate = true;
                this.moonTexture = loadedTex;
            });
        });
        moonTexture.magFilter = THREE.NearestFilter;
        moonTexture.minFilter = THREE.NearestFilter;
        moonTexture.generateMipmaps = false;
        moonTexture.wrapS = THREE.RepeatWrapping;
        moonTexture.wrapT = THREE.RepeatWrapping;
        moonTexture.repeat.set(0.25, 0.5); // 1 cell in 4x2 grid
        moonTexture.offset.set(0, 0.5);   // Full moon default (top left)
        this.moonTexture = moonTexture;
        this.moonPhase = 0; // 0 to 7

        // Moon Mesh: Authentic square Minecraft celestial plane
        const moonGeo = new THREE.PlaneGeometry(20, 20);
        const moonMat = new THREE.MeshBasicMaterial({
            map: moonTexture,
            transparent: true,
            alphaTest: 0.05,
            depthWrite: false,
            fog: false,
            side: THREE.DoubleSide
        });
        this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
        this.moonMesh.renderOrder = -1;
        this.scene.add(this.moonMesh);

        // SkyDome Shader - Authentic Minecraft celestial gradient & directional sun scatter
        const skyGeo = new THREE.SphereGeometry(400, 32, 16);
        this.skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x78a7ff) },
                horizonColor: { value: new THREE.Color(0xc0d8ff) },
                bottomColor: { value: new THREE.Color(0x182030) },
                sunDirection: { value: new THREE.Vector3(0, 1, 0) },
                sunGlowColor: { value: new THREE.Color(0xffa458) },
                sunGlowIntensity: { value: 0.0 },
                skyExponent: { value: 1.15 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 horizonColor;
                uniform vec3 bottomColor;
                uniform vec3 sunDirection;
                uniform vec3 sunGlowColor;
                uniform float sunGlowIntensity;
                uniform float skyExponent;
                varying vec3 vWorldPosition;

                void main() {
                    vec3 dir = normalize(vWorldPosition);
                    float y = dir.y;
                    
                    vec3 col;
                    if (y >= 0.0) {
                        // Authentic Minecraft celestial hemisphere fade:
                        // Gentle, smooth fade from soft milky horizon haze to pale azure zenith
                        float t = clamp(pow(y, max(0.05, skyExponent)), 0.0, 1.0);
                        col = mix(horizonColor, topColor, t);
                    } else {
                        // Smooth fade into void below horizon
                        float t = clamp(-y * 2.5, 0.0, 1.0);
                        col = mix(horizonColor, bottomColor, t);
                    }
                    
                    // Directional Minecraft sunrise/sunset horizon glow (soft natural scatter)
                    if (sunGlowIntensity > 0.01) {
                        float hBand = smoothstep(-0.20, 0.02, y) * (1.0 - smoothstep(0.02, 0.32, y));
                        float sunDot = max(0.0, dot(dir, normalize(sunDirection)));
                        float glow = pow(sunDot, 6.0) * hBand * sunGlowIntensity;
                        col = mix(col, sunGlowColor, clamp(glow, 0.0, 0.70));
                    }
                    
                    gl_FragColor = vec4(col, 1.0);
                }
            `,
            side: THREE.BackSide,
            depthWrite: false,
            depthTest: false,
            fog: false
        });
        this.skyDome = new THREE.Mesh(skyGeo, this.skyMat);
        this.skyDome.renderOrder = -100;
        this.scene.add(this.skyDome);

        // Build star field (starts invisible, fades in at night)
        this._buildStars();
    }
    
    _getLightState(time) {
        // Authentic Minecraft Java Day/Night cycle
        // Midday Plains: #78A7FF zenith, #C0D8FF horizon haze (soft, airy, desaturated pastel)
        // 0.0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 1.0 = midnight
        const states = [
            // Midnight (t=0.0) - authentic clear Minecraft Java moonlight
            { 
                t: 0.0, 
                amb: new THREE.Color(0x28344e), ambIntensity: 0.28, 
                bg: new THREE.Color(0x121a30), top: new THREE.Color(0x091224), bottom: new THREE.Color(0x040810),
                sun: 0.0, moon: 0.26,
                glow: 0.0, glowColor: new THREE.Color(0xff9850)
            },
            // Pre-dawn twilight (t=0.18 to 0.22)
            { 
                t: 0.18, 
                amb: new THREE.Color(0x28344e), ambIntensity: 0.28, 
                bg: new THREE.Color(0x121a30), top: new THREE.Color(0x091224), bottom: new THREE.Color(0x040810),
                sun: 0.0, moon: 0.26,
                glow: 0.0, glowColor: new THREE.Color(0xff9850)
            },
            { 
                t: 0.22, 
                amb: new THREE.Color(0x384058), ambIntensity: 0.32, 
                bg: new THREE.Color(0x283048), top: new THREE.Color(0x1c2438), bottom: new THREE.Color(0x080c18),
                sun: 0.08, moon: 0.16,
                glow: 0.20, glowColor: new THREE.Color(0xe08050)
            },
            // Sunrise (t=0.25) - classic soft warm peach/amber horizon, gentle morning azure zenith
            { 
                t: 0.25, 
                amb: new THREE.Color(0xffe2c8), ambIntensity: 0.62, 
                bg: new THREE.Color(0xffba84), top: new THREE.Color(0x6078a8), bottom: new THREE.Color(0x1c1e28),
                sun: 0.40, moon: 0.0,
                glow: 0.70, glowColor: new THREE.Color(0xffa458)
            },
            // Early morning transition (t=0.28)
            { 
                t: 0.28, 
                amb: new THREE.Color(0xeef4fc), ambIntensity: 0.84, 
                bg: new THREE.Color(0xc0d8ff), top: new THREE.Color(0x78a7ff), bottom: new THREE.Color(0x182030),
                sun: 0.70, moon: 0.0,
                glow: 0.0, glowColor: new THREE.Color(0xffa458)
            },
            // Midday Clear Day (t=0.30 to 0.70) - authentic vibrant Minecraft sky & bright radiant sunlight
            { 
                t: 0.30, 
                amb: new THREE.Color(0xeef4fc), ambIntensity: 0.88, 
                bg: new THREE.Color(0xc0d8ff), top: new THREE.Color(0x78a7ff), bottom: new THREE.Color(0x182030),
                sun: 0.78, moon: 0.0,
                glow: 0.0, glowColor: new THREE.Color(0xff9850)
            },
            { 
                t: 0.70, 
                amb: new THREE.Color(0xeef4fc), ambIntensity: 0.88, 
                bg: new THREE.Color(0xc0d8ff), top: new THREE.Color(0x78a7ff), bottom: new THREE.Color(0x182030),
                sun: 0.78, moon: 0.0,
                glow: 0.0, glowColor: new THREE.Color(0xff9850)
            },
            // Late Afternoon Golden Hour (t=0.72)
            { 
                t: 0.72, 
                amb: new THREE.Color(0xffd8b8), ambIntensity: 0.72, 
                bg: new THREE.Color(0xffc498), top: new THREE.Color(0x6a86c0), bottom: new THREE.Color(0x1c1e28),
                sun: 0.52, moon: 0.0,
                glow: 0.45, glowColor: new THREE.Color(0xff9850)
            },
            // Sunset (t=0.75) - soft dusty terracotta horizon bloom, twilight dusk lavender-gray zenith
            { 
                t: 0.75, 
                amb: new THREE.Color(0xffbe98), ambIntensity: 0.55, 
                bg: new THREE.Color(0xf48855), top: new THREE.Color(0x4e5880), bottom: new THREE.Color(0x141822),
                sun: 0.35, moon: 0.02,
                glow: 0.75, glowColor: new THREE.Color(0xf57838)
            },
            // Post-sunset twilight (t=0.78)
            { 
                t: 0.78, 
                amb: new THREE.Color(0x383854), ambIntensity: 0.32, 
                bg: new THREE.Color(0x282c42), top: new THREE.Color(0x1c2034), bottom: new THREE.Color(0x080c18),
                sun: 0.08, moon: 0.18,
                glow: 0.15, glowColor: new THREE.Color(0xd86838)
            },
            // Full Night (t=0.80 to 1.0)
            { 
                t: 0.80, 
                amb: new THREE.Color(0x28344e), ambIntensity: 0.28, 
                bg: new THREE.Color(0x121a30), top: new THREE.Color(0x091224), bottom: new THREE.Color(0x040810),
                sun: 0.0, moon: 0.26,
                glow: 0.0, glowColor: new THREE.Color(0xff9850)
            },
            { 
                t: 1.0, 
                amb: new THREE.Color(0x28344e), ambIntensity: 0.28, 
                bg: new THREE.Color(0x121a30), top: new THREE.Color(0x091224), bottom: new THREE.Color(0x040810),
                sun: 0.0, moon: 0.26,
                glow: 0.0, glowColor: new THREE.Color(0xff9850)
            }
        ];

        if (!this._cachedColors) {
            this._cachedColors = {
                amb: new THREE.Color(),
                bg: new THREE.Color(),
                top: new THREE.Color(),
                bottom: new THREE.Color(),
                glowColor: new THREE.Color()
            };
        }

        for (let i = 0; i < states.length - 1; i++) {
            if (time >= states[i].t && time <= states[i+1].t) {
                const fraction = (time - states[i].t) / (states[i+1].t - states[i].t);
                const amb = this._cachedColors.amb.copy(states[i].amb).lerp(states[i+1].amb, fraction);
                const ambIntensity = states[i].ambIntensity + (states[i+1].ambIntensity - states[i].ambIntensity) * fraction;
                const bg = this._cachedColors.bg.copy(states[i].bg).lerp(states[i+1].bg, fraction);
                const top = this._cachedColors.top.copy(states[i].top).lerp(states[i+1].top, fraction);
                const bottom = this._cachedColors.bottom.copy(states[i].bottom || states[i].bg).lerp(states[i+1].bottom || states[i+1].bg, fraction);
                const glow = (states[i].glow || 0) + ((states[i+1].glow || 0) - (states[i].glow || 0)) * fraction;
                const glowColor = this._cachedColors.glowColor.copy(states[i].glowColor || states[i].bg).lerp(states[i+1].glowColor || states[i+1].bg, fraction);
                const sun = states[i].sun + (states[i+1].sun - states[i].sun) * fraction;
                const moon = (states[i].moon !== undefined) ? states[i].moon + (states[i+1].moon - states[i].moon) * fraction : 0.0;
                return { amb, ambIntensity, bg, top, bottom, glow, glowColor, sun, moon };
            }
        }
        return states[0]; // fallback
    }
    
    update(dt, cameraPos, isUnderwater = false, currentDimension = 'overworld') {
        // Nether and End do NOT have day/night cycles; time advances only in the Overworld
        if (currentDimension === 'overworld') {
            this.timeOfDay += dt / this.dayLength;
            if (this.timeOfDay > 1) this.timeOfDay -= 1;
        }

        const angle = (this.timeOfDay - 0.5) * Math.PI * 2;
        const moonAngle = angle + Math.PI;
        
        // In Minecraft, the celestial axis rotates across the sky with a slight diagonal tilt to cast dynamic shadows
        const celestialDist = 280; // Distance towards sky dome for authentic scale
        const sunTilt = 32;
        this.sunLight.position.set(
            cameraPos.x + Math.sin(angle) * 80,
            cameraPos.y + Math.cos(angle) * 80,
            cameraPos.z + sunTilt
        );
        this.sunLight.target.position.copy(cameraPos);
        this.sunLight.target.updateMatrixWorld();

        this.sunMesh.position.set(
            cameraPos.x + Math.sin(angle) * celestialDist,
            cameraPos.y + Math.cos(angle) * celestialDist,
            cameraPos.z
        );
        this.sunMesh.lookAt(cameraPos);

        // Moon position
        this.moonLight.position.set(
            cameraPos.x + Math.sin(moonAngle) * 80,
            cameraPos.y + Math.cos(moonAngle) * 80,
            cameraPos.z - sunTilt
        );
        this.moonLight.target.position.copy(cameraPos);
        this.moonLight.target.updateMatrixWorld();

        this.moonMesh.position.set(
            cameraPos.x + Math.sin(moonAngle) * celestialDist,
            cameraPos.y + Math.cos(moonAngle) * celestialDist,
            cameraPos.z
        );
        this.moonMesh.lookAt(cameraPos);

        this.sunMesh.scale.set(1, 1, 1);
        this.moonMesh.scale.set(1, 1, 1);

        // Advance moon phase each in-game day (8 lunar phases in 4x2 grid)
        if (this.moonTexture) {
            const dayIndex = Math.floor(this.timeOfDay * 8) % 8;
            // 4 columns, 2 rows: cols 0-3 on row 0 (v offset 0.5), cols 0-3 on row 1 (v offset 0.0)
            const col = dayIndex % 4;
            const row = Math.floor(dayIndex / 4);
            this.moonTexture.offset.set(col * 0.25, row === 0 ? 0.5 : 0.0);
        }

        this.skyDome.position.copy(cameraPos);

        this.sunMesh.visible = (currentDimension === 'overworld');
        this.moonMesh.visible = (currentDimension === 'overworld');

        let state;
        if (currentDimension === 'nether') {
            state = {
                amb: new THREE.Color(0x6a2c2c),
                ambIntensity: 0.65,
                bg: new THREE.Color(0x3d0b0b),
                top: new THREE.Color(0x882c2c),
                sun: 0.20,
                moon: 0
            };
        } else if (currentDimension === 'aether') {
            state = {
                amb: new THREE.Color(0xeef6ff),
                ambIntensity: 0.75,
                bg: new THREE.Color(0xddeeff),
                top: new THREE.Color(0xffffff),
                sun: 0.25,
                moon: 0
            };
        } else if (currentDimension === 'end') {
            state = {
                amb: new THREE.Color(0x6d528b), // Pale lavender cosmic glow
                ambIntensity: 0.65,             // Beautifully illuminated End islands
                bg: new THREE.Color(0x150b22),  // Deep void purple
                top: new THREE.Color(0x321a4f), // Rich dark violet sky
                sun: 0.25,                      // Soft directional light for block depth
                moon: 0
            };
        } else {
            state = this._getLightState(this.timeOfDay);
            if (this.weather === 'rain' || this.weather === 'thunder') {
                state.ambIntensity *= 0.75;
                state.sun *= 0.25;
                state.bg.multiplyScalar(0.7);
                state.top.multiplyScalar(0.7);
            }
        }

        // Dynamic Underground & Cave Ambient Lighting
        if (this.caveFactor === undefined) this.caveFactor = 0.0;
        let targetCaveFactor = 0.0;

        if (this.world && currentDimension === 'overworld' && cameraPos) {
            const cx = Math.floor(cameraPos.x);
            const cy = Math.floor(cameraPos.y);
            const cz = Math.floor(cameraPos.z);
            
            // Sample overhead column for solid ceiling up to chunk height
            let solidAbove = 0;
            let firstSolidDist = 999;
            for (let dy = 2; dy < 48; dy++) {
                const y = cy + dy;
                if (y >= 128) break;
                const b = this.world.getBlock(cx, y, cz);
                if (b && b !== BLOCKS.AIR) {
                    const props = getBlockProperties(b);
                    if (!props || !props.transparent) {
                        solidAbove++;
                        if (firstSolidDist === 999) firstSolidDist = dy;
                    }
                }
            }

            // Underground depth & overhead occlusion:
            // True caves require substantial subterranean rock overhead (solidAbove >= 5 and cy < 60).
            if (cy < 60 && solidAbove >= 5 && firstSolidDist < 24) {
                const depthBoost = Math.max(0, Math.min(1.0, (56 - cy) / 40));
                const roofDensity = Math.min(1.0, (solidAbove - 4) / 6);
                targetCaveFactor = Math.min(1.0, (0.4 + 0.6 * depthBoost) * roofDensity);
            } else if (cy < 40 && solidAbove >= 3) {
                targetCaveFactor = Math.min(1.0, (40 - cy) / 25);
            }
        }

        this.caveFactor = THREE.MathUtils.lerp(this.caveFactor, targetCaveFactor, Math.min(1.0, dt * 3.0));
        const caveFloor = 0.22;
        this.lastAmbientIntensity = THREE.MathUtils.lerp(state.ambIntensity, caveFloor, this.caveFactor);

        const brightMult = (this.brightnessMultiplier !== undefined) ? this.brightnessMultiplier : 1.25;
        const caveColor = new THREE.Color(0x0e111a);
        const finalAmbColor = state.amb.clone().lerp(caveColor, this.caveFactor * 0.7);
        const finalAmbIntensity = this.lastAmbientIntensity * brightMult;

        this.ambientLight.color.copy(finalAmbColor);
        this.ambientLight.intensity = finalAmbIntensity;

        // Sunlight & moonlight blocked underground
        this.sunLight.intensity = state.sun * (1.0 - this.caveFactor) * brightMult;
        this.moonLight.intensity = state.moon * (1.0 - this.caveFactor) * brightMult;
        this.sunLight.castShadow = (state.sun > 0.08) && (this.caveFactor < 0.75) && (currentDimension === 'overworld' || currentDimension === 'aether');
        
        const currentBg = isUnderwater ? new THREE.Color(0x3377aa) : (this.caveFactor > 0.05 ? state.bg.clone().lerp(caveColor, this.caveFactor) : state.bg);
        this.scene.background = currentBg;

        if (this.scene.fog) {
            this.scene.fog.color.copy(this.scene.background);
            const renderBlocks = (this.world?.renderDistance || 10) * 16;
            if (this.scene.fog.isFog) {
                if (isUnderwater) {
                    this.scene.fog.near = 1;
                    this.scene.fog.far = 18;
                } else if (currentDimension === 'aether') {
                    this.scene.fog.near = 16;
                    this.scene.fog.far = renderBlocks * 0.75;
                } else if (currentDimension === 'nether') {
                    this.scene.fog.near = 35;
                    this.scene.fog.far = renderBlocks * 1.1;
                } else if (currentDimension === 'end') {
                    this.scene.fog.near = 50;
                    this.scene.fog.far = renderBlocks * 1.5;
                } else {
                    const caveFar = (this.caveFactor > 0.1) ? Math.max(28, renderBlocks * (1.0 - this.caveFactor * 0.5)) : renderBlocks * 1.05;
                    const caveNear = (this.caveFactor > 0.1) ? Math.max(6, renderBlocks * 0.75 * (1.0 - this.caveFactor * 0.5)) : renderBlocks * 0.75;
                    this.scene.fog.near = caveNear;
                    this.scene.fog.far = caveFar;
                }
            } else {
                if (isUnderwater) {
                    this.scene.fog.density = 0.05;
                } else if (currentDimension === 'aether') {
                    this.scene.fog.density = 0.02;
                } else if (currentDimension === 'nether') {
                    this.scene.fog.density = 0.007;
                } else if (currentDimension === 'end') {
                    this.scene.fog.density = 0.0025;
                } else {
                    const defaultCaveDensity = 0.012;
                    const defaultOverworldDensity = this.scene.fog.baseDensity || 0.003;
                    const targetDensity = (this.caveFactor > 0.1) ? defaultCaveDensity : defaultOverworldDensity;
                    this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, targetDensity, 0.05);
                }
            }
        }
        
        // Tint fog with warm sun scatter at sunrise/sunset (calculated first so horizon matches seamlessly)
        if (this.scene.fog && currentDimension === 'overworld') {
            const t = this.timeOfDay;
            const isSunrise = t > 0.22 && t < 0.28;
            const isSunset = t > 0.72 && t < 0.78;
            if (isSunrise || isSunset) {
                const horizonFrac = isSunrise
                    ? 1 - Math.abs(t - 0.25) / 0.03
                    : 1 - Math.abs(t - 0.75) / 0.03;
                const warmFog = isSunrise ? new THREE.Color(0xffba84) : new THREE.Color(0xf08855);
                this.scene.fog.color.lerp(warmFog, Math.min(1, horizonFrac * 0.35));
            }
        }

        // Update SkyDome gradient uniforms (perfect seamless match with horizon fog)
        this.skyMat.uniforms.topColor.value.copy(state.top);
        this.skyMat.uniforms.horizonColor.value.copy(this.scene.fog ? this.scene.fog.color : currentBg);
        this.skyMat.uniforms.bottomColor.value.copy(state.bottom || new THREE.Color(0x101420));
        if (this.sunMesh) {
            this.skyMat.uniforms.sunDirection.value.copy(this.sunMesh.position).sub(cameraPos).normalize();
        }
        this.skyMat.uniforms.sunGlowColor.value.copy(state.glowColor || new THREE.Color(0xff7722));
        this.skyMat.uniforms.sunGlowIntensity.value = (currentDimension === 'overworld') ? (state.glow || 0.0) : 0.0;

        // Update star field visibility
        if (this._stars) {
            const t = this.timeOfDay;
            let starOpacity = 0;
            if (t > 0.8 || t < 0.2) {
                starOpacity = t > 0.8 ? (t - 0.8) / 0.1 : (0.2 - t) / 0.1;
                starOpacity = Math.min(1, starOpacity);
            }
            this._stars.material.opacity = starOpacity * 0.95;
            this._stars.visible = this._stars.material.opacity > 0.01;
            this._stars.position.copy(cameraPos);
        }
    }

    _buildStars() {
        const COUNT = 1500;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(COUNT * 3);
        for (let i = 0; i < COUNT; i++) {
            // Random points on a hemisphere above the player
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.5; // upper half only
            const r = 350;
            positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.cos(phi);
            positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.2,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            sizeAttenuation: false
        });
        this._stars = new THREE.Points(geo, mat);
        this._stars.renderOrder = -90;
        this.scene.add(this._stars);
    }
}

export class TorchLightSystem {
    constructor(scene) {
        this.scene = scene;
        this.torches = new Map();
        this._time = 0;
        this._cachedTorches = [];
        this._lastCamPos = new THREE.Vector3();
        this._sortCooldown = 0;
        this._torchesDirty = false;
        
        // Light Pool to drastically improve FPS (max 8 dynamic lights ever compiled in shader)
        this.poolSize = 8;
        this.lightPool = [];
        for (let i = 0; i < this.poolSize; i++) {
            const light = new THREE.PointLight(0xff6a00, 0, 60);
            light.decay = 1.0;
            light.position.set(0, -10000, 0); // Hide initially
            this.scene.add(light);
            this.lightPool.push(light);
        }
    }

    addTorch(x, y, z) {
        const key = `${x},${y},${z}`;
        if (this.torches.has(key)) return;
        
        this.torches.set(key, {
            position: new THREE.Vector3(x + 0.5, y + 0.92, z + 0.5),
            flickerOffset: Math.random() * 100
        });
        this._torchesDirty = true;
    }

    removeTorch(x, y, z) {
        const key = `${x},${y},${z}`;
        this.torches.delete(key);
        this._torchesDirty = true;
    }

    update(dt, camPos) {
        this._time += dt;
        this._sortCooldown -= dt;

        // Re-sort only when camera moves > 1 block, on torch placement, or periodically (4 times/sec)
        const needsResort = this._torchesDirty || this._sortCooldown <= 0 || (camPos && camPos.distanceToSquared(this._lastCamPos) > 1.0);
        if (needsResort) {
            this._sortCooldown = 0.25;
            this._torchesDirty = false;
            if (camPos) this._lastCamPos.copy(camPos);

            const torchDists = [];
            for (const torch of this.torches.values()) {
                const distSq = camPos ? torch.position.distanceToSquared(camPos) : 0;
                if (!camPos || distSq < 1000) { // ~31 blocks radius
                    torchDists.push({ torch, distSq });
                }
            }
            torchDists.sort((a, b) => a.distSq - b.distSq);
            this._cachedTorches = torchDists.slice(0, this.poolSize);
        }

        for (let i = 0; i < this.poolSize; i++) {
            const light = this.lightPool[i];
            
            if (i < this._cachedTorches.length) {
                const torch = this._cachedTorches[i].torch;
                light.position.copy(torch.position);
                
                const t = this._time + torch.flickerOffset;
                const flicker = Math.sin(t * 7.3) * 0.15
                              + Math.sin(t * 13.7) * 0.08
                              + Math.sin(t * 23.1) * 0.04;

                const baseTorchIntensity = 8.0;
                light.intensity = baseTorchIntensity * (1 + flicker);
                light.distance = 36;
                const r = 1.0;
                const g = 0.52 + flicker * 0.10;
                const b = 0.12;
                light.color.setRGB(r, g, b);
            } else {
                light.intensity = 0;
                light.position.set(0, -10000, 0);
            }
        }
    }
}

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // High-performance InstancedMesh for particles
        this.maxParticles = 2000;
        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxParticles);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        if (this.mesh.instanceColor) this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
        this.mesh.count = 0;
        this.mesh.frustumCulled = false; // Always update all particles
        this.scene.add(this.mesh);
        
        this._dummy = new THREE.Object3D();
        this._color = new THREE.Color();
    }

    emit(pos, type, count = 10, color = 0xffffff) {
        if (!pos) return;
        const basePos = (pos instanceof THREE.Vector3 || (typeof pos.clone === 'function'))
            ? pos.clone()
            : new THREE.Vector3(pos.x || 0, pos.y || 0, pos.z || 0);

        for(let i=0; i<count; i++) {
            if (this.particles.length >= this.maxParticles) {
                // Drop oldest if we reach limit
                this.particles.shift();
            }
            let vel, maxAge;
            if (type === 'leaf') {
                vel = new THREE.Vector3(
                    (Math.random()-0.5)*1.5,
                    -(Math.random()*1 + 0.5), // drift down
                    (Math.random()-0.5)*1.5
                );
                maxAge = 3 + Math.random() * 2;
            } else if (type === 'eat') {
                vel = new THREE.Vector3(
                    (Math.random()-0.5)*1.4,
                    Math.random()*1.2 + 0.4,
                    (Math.random()-0.5)*1.4
                );
                maxAge = 0.35 + Math.random() * 0.35;
            } else if (type === 'snow') {
                vel = new THREE.Vector3(
                    (Math.random()-0.5)*1.5,
                    -(1.8 + Math.random()*1.4), // gentle falling snow
                    (Math.random()-0.5)*1.5
                );
                maxAge = 3.0 + Math.random() * 2.0;
            } else if (type === 'rain') {
                vel = new THREE.Vector3(
                    (Math.random()-0.5)*0.8,
                    -(16 + Math.random()*8),
                    (Math.random()-0.5)*0.8
                );
                maxAge = 0.8 + Math.random() * 0.4;
            } else if (type === 'portal') {
                // Authentic Minecraft Nether/Ender portal particles: subtle drift, gentle upward float, purple/magenta
                vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 1.6,
                    (Math.random() - 0.5) * 1.2 + 0.5,
                    (Math.random() - 0.5) * 1.6
                );
                maxAge = 0.65 + Math.random() * 0.5;
            } else if (type === 'bonemeal') {
                // Authentic Minecraft happy_villager/bonemeal sparkles: upward burst from crop, decelerates and twinkles
                vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 1.4,
                    0.9 + Math.random() * 1.5,
                    (Math.random() - 0.5) * 1.4
                );
                maxAge = 0.75 + Math.random() * 0.45;
            } else if (type === 'smoke') {
                vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.8,
                    0.8 + Math.random() * 1.0,
                    (Math.random() - 0.5) * 0.8
                );
                maxAge = 0.8 + Math.random() * 0.6;
            } else {
                vel = new THREE.Vector3(
                    (Math.random()-0.5)*5,
                    (Math.random()-0.5)*5 + 2,
                    (Math.random()-0.5)*5
                );
                maxAge = 0.5 + Math.random();
            }
            this.particles.push({
                pos: basePos.clone(),
                vel: vel,
                age: 0,
                maxAge: maxAge,
                colorHex: color,
                type: type
            });
        }
    }

    update(dt) {
        let aliveCount = 0;
        let needsUpdate = false;
        
        for(let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.age += dt;
            if(p.age >= p.maxAge) {
                continue; // Dies naturally
            }
            
            if (p.type === 'leaf') {
                p.vel.x += (Math.random() - 0.5) * dt * 5;
                p.vel.z += (Math.random() - 0.5) * dt * 5;
                p.pos.addScaledVector(p.vel, dt);
                // No gravity, they just drift down
                this._dummy.rotation.x += dt;
                this._dummy.rotation.y += dt * 0.5;
            } else if (p.type === 'snow') {
                p.vel.x += (Math.random() - 0.5) * dt * 2.0;
                p.vel.z += (Math.random() - 0.5) * dt * 2.0;
                p.pos.addScaledVector(p.vel, dt);
                this._dummy.rotation.x += dt * 1.5;
                this._dummy.rotation.y += dt * 1.5;
            } else if (p.type === 'eat') {
                p.pos.addScaledVector(p.vel, dt);
                p.vel.y -= 7.0 * dt; // gravity
                p.vel.x *= Math.max(0, 1 - dt * 2.5); // horizontal drag
                p.vel.z *= Math.max(0, 1 - dt * 2.5);
                this._dummy.rotation.x += dt * 6;
                this._dummy.rotation.y += dt * 6;
            } else if (p.type === 'portal') {
                p.pos.addScaledVector(p.vel, dt);
                p.vel.multiplyScalar(Math.max(0, 1 - dt * 1.8)); // gentle drag
                this._dummy.rotation.x += dt * 3;
                this._dummy.rotation.y += dt * 3;
            } else if (p.type === 'bonemeal') {
                p.pos.addScaledVector(p.vel, dt);
                p.vel.x *= Math.max(0, 1 - dt * 2.2);
                p.vel.z *= Math.max(0, 1 - dt * 2.2);
                p.vel.y = Math.max(0.1, p.vel.y - 1.2 * dt);
                this._dummy.rotation.x += dt * 4;
                this._dummy.rotation.y += dt * 4;
            } else if (p.type === 'smoke') {
                p.pos.addScaledVector(p.vel, dt);
                p.vel.multiplyScalar(Math.max(0, 1 - dt * 1.2));
                this._dummy.rotation.x += dt;
                this._dummy.rotation.y += dt;
            } else {
                p.pos.addScaledVector(p.vel, dt);
                p.vel.y -= 9.8 * dt; // gravity
            }
            
            this._dummy.position.copy(p.pos);
            if (p.type === 'leaf') {
                this._dummy.scale.set(0.6, 0.1, 0.6);
            } else if (p.type === 'snow') {
                this._dummy.scale.set(0.35, 0.35, 0.35);
            } else if (p.type === 'eat') {
                const s = 0.45 * Math.max(0.15, 1 - (p.age / p.maxAge) * 0.5);
                this._dummy.scale.set(s, s, s);
            } else if (p.type === 'portal') {
                const s = 0.4 * Math.max(0.08, 1 - p.age / p.maxAge);
                this._dummy.scale.set(s, s, s);
            } else if (p.type === 'bonemeal') {
                const prog = p.age / p.maxAge;
                const s = 0.45 * Math.sin(prog * Math.PI);
                this._dummy.scale.set(s, s, s);
            } else if (p.type === 'smoke') {
                const s = 0.35 + 0.35 * (p.age / p.maxAge);
                this._dummy.scale.set(s, s, s);
            } else {
                this._dummy.scale.set(1, 1, 1);
                this._dummy.rotation.set(0, 0, 0);
            }
            this._dummy.updateMatrix();
            this.mesh.setMatrixAt(aliveCount, this._dummy.matrix);
            
            this._color.setHex(p.colorHex);
            this.mesh.setColorAt(aliveCount, this._color);
            
            this.particles[aliveCount] = p; // Keep alive
            aliveCount++;
            needsUpdate = true;
        }
        
        this.particles.length = aliveCount;
        this.mesh.count = aliveCount;
        
        if (needsUpdate || aliveCount === 0) {
            this.mesh.instanceMatrix.needsUpdate = true;
            if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
        }
    }
}

class UISystem {
    constructor() {
        this.elements = {
            geometricUI: document.getElementById('geometric-ui'),
            survivalContainer: document.getElementById('survival-container'),
            creativeContainer: document.getElementById('creative-container'),
            creativeTabsBar: document.getElementById('creative-tabs-bar'),
            creativeItemsGrid: document.getElementById('creative-items-grid'),
            creativeSearch: document.getElementById('creative-search'),
            creativeTrashSlot: document.getElementById('creative-trash-slot'),
            mainGrid: document.getElementById('main-inventory-grid'),
            invHotbar: document.getElementById('inv-hotbar-grid'),
            mainHotbar: document.getElementById('main-hotbar-grid'),
            wandConfigPanel: document.getElementById('wand-config-panel'),
            wandSlotsGrid: document.getElementById('wand-slots-grid'),
            dragIcon: document.getElementById('drag-item-icon'),
            tooltip: document.getElementById('item-tooltip'),
            craftingGrid: document.getElementById('crafting-grid'),
            craftingOutput: document.getElementById('crafting-output'),
            craftingRecipeName: document.getElementById('crafting-recipe-name'),
            craftingPanel: document.getElementById('crafting-panel'),
            survivalTopPanel: document.getElementById('survival-top-panel'),
            equipmentCol: document.querySelector('.equipment-col'),
            playerPreviewBox: document.getElementById('player-preview-box'),
            chestPanel: document.getElementById('chest-panel'),
            chestGrid: document.getElementById('chest-grid'),
            furnacePanel: document.getElementById('furnace-panel'),
            furnaceInput: document.getElementById('furnace-input'),
            furnaceFuel: document.getElementById('furnace-fuel'),
            furnaceOutput: document.getElementById('furnace-output'),
            furnaceProgress: document.getElementById('furnace-progress'),
            furnaceFire: document.getElementById('furnace-fire'),
            furnaceFireFill: document.getElementById('furnace-fire-fill'),
            stonecutterPanel: document.getElementById('stonecutter-panel'),
            stonecutterInput: document.getElementById('stonecutter-input'),
            stonecutterRecipesContainer: document.getElementById('stonecutter-recipes-container'),
            stonecutterOutput: document.getElementById('stonecutter-output'),
            btnAutofillRecipe: document.getElementById('btn-autofill-recipe'),
            recipeAutofillStatus: document.getElementById('recipe-autofill-status')
        };
        this.isOpen = false;
        this.chestPos = null;
        this.chestInventory = null;
        this.onChestClose = null;
        this.furnacePos = null;
        this.furnaceData = null;
        this.onFurnaceClose = null;
        this.stonecutterPos = null;
        this.stonecutterSlot = null;
        this.stonecutterSelectedRecipe = null;
        this.onStonecutterClose = null;
        this.atlas = null;
        
        // 9 crafting slots (3x3 grid)
        this.craftingSlots = new Array(9).fill(null);
        this.is3x3Crafting = false;

        this.dragState = {
            isDragging: false,
            sourceType: null, // 'inventory' | 'wand' | 'crafting' | 'crafting_output'
            sourceIndex: -1,
            itemData: null,
            offsetX: 0, offsetY: 0
        };

        this.dragDistribution = {
            active: false,
            button: -1,
            slots: new Map(),
            startCount: 0,
            startSlot: null
        };
        this.hoveredSlot = null;
        this.selectedRecipe = null;
        this._pendingClickAction = null;

        this.currentPlayer = null;
        this.isCreativeOpen = false;

        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('keydown', (e) => this.onKeyDown(e));

        this._initCraftingGrid();
        this._initArmorSlots();
        this._initFurnaceSlots();
        this._initStonecutterSlots();

        const btnRecipeBook = document.getElementById('btn-recipe-book');
        const btnRecipeBookWand = document.getElementById('btn-recipe-book-wand');
        const modalRecipeBook = document.getElementById('recipe-book-modal');
        const btnCloseRecipes = document.getElementById('btn-close-recipes');
        if (modalRecipeBook && btnCloseRecipes) {
            const openRecipes = () => {
                modalRecipeBook.classList.remove('hidden');
                this.showRecipeBook();
            };
            if (btnRecipeBook) btnRecipeBook.onclick = openRecipes;
            if (btnRecipeBookWand) btnRecipeBookWand.onclick = openRecipes;
            btnCloseRecipes.onclick = () => modalRecipeBook.classList.add('hidden');
        }

        const btnAutofill = document.getElementById('btn-autofill-recipe');
        if (btnAutofill) {
            btnAutofill.onclick = () => {
                if (this.selectedRecipe) {
                    this.autofillRecipe(this.selectedRecipe);
                }
            };
        }

        if (this.elements.geometricUI) {
            this.elements.geometricUI.addEventListener('mousedown', (e) => {
                if (e.target === this.elements.geometricUI) {
                    if (this.dragState.isDragging && this.dragState.itemData) {
                        e.preventDefault();
                        e.stopPropagation();
                        const isRightClick = e.button === 2;
                        this.dropCursorItem(!isRightClick);
                    }
                }
            });
        }

        this.updateMinecraftHUD(null);
    }

    closeChest() {
        if (this.chestPos) {
            if (this.onChestClose) this.onChestClose();
            this.chestPos = null;
            this.chestInventory = null;
            this.onChestClose = null;
            if (this.elements.chestPanel) this.elements.chestPanel.classList.add('hidden');
            if (this.isOpen && this.elements.survivalTopPanel) this.elements.survivalTopPanel.classList.remove('hidden');
        }
    }

    closeFurnace() {
        if (this.furnacePos) {
            if (this.onFurnaceClose) this.onFurnaceClose();
            this.furnacePos = null;
            this.furnaceData = null;
            this.onFurnaceClose = null;
            if (this.elements.furnacePanel) this.elements.furnacePanel.classList.add('hidden');
            if (this.isOpen && this.elements.survivalTopPanel) this.elements.survivalTopPanel.classList.remove('hidden');
        }
    }

    closeStonecutter() {
        if (this.stonecutterPos) {
            if (this.onStonecutterClose) this.onStonecutterClose();
            this.stonecutterPos = null;
            this.onStonecutterClose = null;
            // Return stonecutter input item to player inventory
            if (this.stonecutterSlot && this.currentPlayer) {
                const added = this.currentPlayer.inventory.addItem(this.stonecutterSlot.item, this.stonecutterSlot.count);
                const em = (window.game && window.game.entityManager) || this.currentPlayer.manager;
                if (!added && em) {
                    em.spawnItem(this.stonecutterSlot.item, this.stonecutterSlot.count, this.currentPlayer.position);
                }
                this.stonecutterSlot = null;
            }
            this.stonecutterSelectedRecipe = null;
            if (this.elements.stonecutterPanel) this.elements.stonecutterPanel.classList.add('hidden');
            if (this.isOpen && this.elements.survivalTopPanel) this.elements.survivalTopPanel.classList.remove('hidden');
        }
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.is3x3Crafting = false; // normal inventory gets 2x2
        this._updateCraftingUILayout();
        
        if (this.isOpen) {
            this.isCreativeOpen = false;
            this.elements.geometricUI.classList.remove('hidden');
            if (this.elements.survivalContainer) this.elements.survivalContainer.classList.remove('hidden');
            if (this.elements.creativeContainer) this.elements.creativeContainer.classList.add('hidden');
            if (this.elements.creativeTrashSlot) this.elements.creativeTrashSlot.classList.add('hidden');
            if (this.elements.survivalTopPanel) this.elements.survivalTopPanel.classList.remove('hidden');
            if (this.elements.chestPanel) this.elements.chestPanel.classList.add('hidden');
            if (this.elements.furnacePanel) this.elements.furnacePanel.classList.add('hidden');
            if (this.elements.stonecutterPanel) this.elements.stonecutterPanel.classList.add('hidden');
            if (this.elements.equipmentCol) this.elements.equipmentCol.style.display = 'flex';
            if (this.elements.playerPreviewBox) this.elements.playerPreviewBox.style.display = 'flex';
        } else {
            this.isCreativeOpen = false;
            this.elements.geometricUI.classList.add('hidden');
            if (this.elements.creativeContainer) this.elements.creativeContainer.classList.add('hidden');
            if (this.elements.creativeTrashSlot) this.elements.creativeTrashSlot.classList.add('hidden');
            this.elements.tooltip.classList.add('hidden');
            const modalRecipeBook = document.getElementById('recipe-book-modal');
            if (modalRecipeBook) modalRecipeBook.classList.add('hidden');
            if (this.dragState.isDragging) this.cancelDrag();
            
            // Return all crafting items back to inventory when closing
            for (let i = 0; i < 9; i++) {
                if (this.craftingSlots[i]) {
                    if (this.currentPlayer) {
                        const added = this.currentPlayer.inventory.addItem(this.craftingSlots[i].item, this.craftingSlots[i].count);
                        const em = (window.game && window.game.entityManager) || this.currentPlayer.manager;
                        if (!added && em) {
                            // Drop item at player feet if inventory full
                            em.spawnItem(this.craftingSlots[i].item, this.craftingSlots[i].count, this.currentPlayer.position);
                        }
                    }
                    this.craftingSlots[i] = null;
                }
            }
            this._matchRecipe();
            
            // Safely close chest, furnace, stonecutter
            this.closeChest();
            this.closeFurnace();
            this.closeStonecutter();
        }
    }

    toggleCraftingTable(onClose) {
        if (!this.isOpen) {
            this.toggle(); // Open UI
        }
        this.is3x3Crafting = true;
        this._updateCraftingUILayout();
        
        // Hide other panels if any
        this.closeChest();
        this.closeFurnace();
        this.closeStonecutter();
        this.elements.wandConfigPanel.classList.add('hidden');
        if (this.elements.survivalTopPanel) this.elements.survivalTopPanel.classList.remove('hidden');
        if (this.elements.equipmentCol) this.elements.equipmentCol.style.display = 'none';
        if (this.elements.playerPreviewBox) this.elements.playerPreviewBox.style.display = 'none';
        this.elements.craftingPanel.classList.remove('hidden');
    }

    toggleChest(x, y, z, inventory, onClose) {
        if (this.chestPos && this.chestPos.x === x && this.chestPos.y === y && this.chestPos.z === z) {
            this.closeChest();
            if (this.isOpen) this.toggle(); // Close inventory UI
            return;
        }

        this.closeFurnace();
        this.closeStonecutter();

        if (!this.isOpen) {
            this.toggle(); // Open UI
        }

        this.chestPos = {x, y, z};
        this.chestInventory = inventory;
        this.onChestClose = onClose;
        if (this.elements.survivalTopPanel) this.elements.survivalTopPanel.classList.add('hidden');
        if (this.elements.stonecutterPanel) this.elements.stonecutterPanel.classList.add('hidden');
        this.elements.chestPanel.classList.remove('hidden');
    }

    toggleFurnace(x, y, z, data, onClose) {
        if (this.furnacePos && this.furnacePos.x === x && this.furnacePos.y === y && this.furnacePos.z === z) {
            this.closeFurnace();
            if (this.isOpen) this.toggle(); // Close UI
            return;
        }

        this.closeChest();
        this.closeStonecutter();

        if (!this.isOpen) {
            this.toggle();
        }

        this.furnacePos = {x, y, z};
        this.furnaceData = data;
        this.onFurnaceClose = onClose;
        if (this.elements.survivalTopPanel) this.elements.survivalTopPanel.classList.add('hidden');
        if (this.elements.stonecutterPanel) this.elements.stonecutterPanel.classList.add('hidden');
        this.elements.furnacePanel.classList.remove('hidden');
    }

    toggleStonecutter(x, y, z, onClose) {
        if (this.stonecutterPos && this.stonecutterPos.x === x && this.stonecutterPos.y === y && this.stonecutterPos.z === z) {
            this.closeStonecutter();
            if (this.isOpen) this.toggle();
            return;
        }

        this.closeChest();
        this.closeFurnace();

        if (!this.isOpen) {
            this.toggle();
        }

        this.stonecutterPos = { x, y, z };
        this.onStonecutterClose = onClose;
        this.is3x3Crafting = false;
        if (this.elements.survivalTopPanel) this.elements.survivalTopPanel.classList.add('hidden');
        if (this.elements.chestPanel) this.elements.chestPanel.classList.add('hidden');
        if (this.elements.furnacePanel) this.elements.furnacePanel.classList.add('hidden');
        if (this.elements.stonecutterPanel) this.elements.stonecutterPanel.classList.remove('hidden');
        this._renderStonecutter();
    }

    toggleCreative(atlas) {
        this.atlas = atlas;
        if (this.isCreativeOpen) {
            // Close creative
            this.isCreativeOpen = false;
            this.isOpen = false;
            if (this.elements.creativeContainer) this.elements.creativeContainer.classList.add('hidden');
            if (this.elements.creativeTrashSlot) this.elements.creativeTrashSlot.classList.add('hidden');
            if (this.elements.geometricUI) this.elements.geometricUI.classList.add('hidden');
            if (this.elements.stonecutterPanel) this.elements.stonecutterPanel.classList.add('hidden');
            this.elements.tooltip.classList.add('hidden');
            if (this.dragState.isDragging) this.cancelDrag();
            return;
        }
        // Close any other open panel first
        this.closeChest();
        this.closeFurnace();
        this.closeStonecutter();
        this.isCreativeOpen = true;
        this.isOpen = true;
        if (this.elements.geometricUI) this.elements.geometricUI.classList.remove('hidden');
        if (this.elements.survivalContainer) this.elements.survivalContainer.classList.add('hidden');
        if (this.elements.creativeContainer) this.elements.creativeContainer.classList.remove('hidden');
        if (this.elements.creativeTrashSlot) this.elements.creativeTrashSlot.classList.remove('hidden');
        this._renderCreativeInventory();
        if (this.currentPlayer) {
            this.renderGrid(this.elements.invHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
        }
    }

    getEquipDataForSubtype(sub) {
        if (!sub) return { damage: 0, durability: 999 };
        // Hoes
        if (sub === 'hoe_netherite' || sub === 'netherite_hoe') return { isHoe: true, damage: 1, durability: 2031, passive: 'Infernal Cultivation (Fireproof)' };
        if (sub === 'hoe_diamond'   || sub === 'diamond_hoe')   return { isHoe: true, damage: 1, durability: 1561 };
        if (sub === 'hoe_iron'      || sub === 'iron_hoe')      return { isHoe: true, damage: 1, durability: 250 };
        if (sub === 'hoe_gold'      || sub === 'golden_hoe')    return { isHoe: true, damage: 1, durability: 32 };
        if (sub === 'hoe_stone'     || sub === 'stone_hoe')     return { isHoe: true, damage: 1, durability: 131 };
        if (sub === 'hoe_wood'      || sub === 'wooden_hoe')    return { isHoe: true, damage: 1, durability: 59 };
        // Netherite
        if (sub === 'sword_netherite')   return { damage: 11, mineSpeed: 1.0, chopSpeed: 1.0, passive: 'Infernal Might (Fireproof & High Knockback)' };
        if (sub === 'pickaxe_netherite') return { mineSpeed: 5.5, damage: 6, chopSpeed: 1.5, passive: 'Infernal Resilience (Fireproof)' };
        if (sub === 'axe_netherite')     return { chopSpeed: 5.5, damage: 10, mineSpeed: 1.0, passive: 'Infernal Cleave (Heavy Strike)' };
        if (sub === 'shovel_netherite')  return { digSpeed: 5.5, damage: 5, mineSpeed: 1.0, chopSpeed: 1.0, passive: 'Infernal Excavation' };
        // Gravitite (Aether)
        if (sub === 'sword_gravitite')   return { damage: 10, mineSpeed: 1.0, chopSpeed: 1.0, levitate: true, passive: 'Levitation Surge (Launches Mobs Upward)' };
        if (sub === 'pickaxe_gravitite') return { mineSpeed: 5.0, damage: 5, chopSpeed: 1.5, passive: 'Levitation Core (Zero-G)' };
        if (sub === 'axe_gravitite')     return { chopSpeed: 5.0, damage: 9, mineSpeed: 1.0, passive: 'Levitation Strike' };
        if (sub === 'shovel_gravitite')  return { digSpeed: 5.0, damage: 4, mineSpeed: 1.0, chopSpeed: 1.0, passive: 'Levitation Scoop' };
        // Ruby
        if (sub === 'sword_ruby')        return { damage: 9, mineSpeed: 1.0, chopSpeed: 1.0, fire: true, passive: 'Igniting Edge (Sets Enemies Ablaze)' };
        if (sub === 'pickaxe_ruby')      return { mineSpeed: 4.5, damage: 5, chopSpeed: 1.5, passive: 'Molten Core (Auto-Smelts Ores to Ingots)' };
        if (sub === 'axe_ruby')          return { chopSpeed: 4.5, damage: 8, mineSpeed: 1.0, passive: 'Kindling Strike' };
        if (sub === 'shovel_ruby')       return { digSpeed: 4.5, damage: 4, mineSpeed: 1.0, chopSpeed: 1.0 };
        // Sapphire
        if (sub === 'sword_sapphire')    return { damage: 8, mineSpeed: 1.0, chopSpeed: 1.0, frost: true, passive: 'Glacial Frost (Freezes Enemies)' };
        if (sub === 'pickaxe_sapphire')  return { mineSpeed: 4.0, damage: 4, chopSpeed: 1.5, passive: 'Crystal Precision' };
        if (sub === 'axe_sapphire')      return { chopSpeed: 4.0, damage: 7, mineSpeed: 1.0, passive: 'Glacial Cleave' };
        if (sub === 'shovel_sapphire')   return { digSpeed: 4.0, damage: 3, mineSpeed: 1.0, chopSpeed: 1.0 };
        // Zanite (Aether)
        if (sub === 'sword_zanite')      return { damage: 7, mineSpeed: 1.0, chopSpeed: 1.0, passive: 'Aetherial Surge (Damage Scales With Use)' };
        if (sub === 'pickaxe_zanite')    return { mineSpeed: 4.2, damage: 4, chopSpeed: 1.5, passive: 'Aetherial Surge (Mines Faster With Use)' };
        if (sub === 'axe_zanite')        return { chopSpeed: 4.2, damage: 7, mineSpeed: 1.0, passive: 'Aetherial Surge' };
        if (sub === 'shovel_zanite')     return { digSpeed: 4.2, damage: 3, mineSpeed: 1.0, chopSpeed: 1.0, passive: 'Aetherial Surge' };
        // Diamond
        if (sub === 'sword_diamond')     return { damage: 12, mineSpeed: 1.0, chopSpeed: 1.0 };
        if (sub === 'pickaxe_diamond')   return { mineSpeed: 6.0, damage: 5, chopSpeed: 1.5 };
        if (sub === 'axe_diamond')       return { chopSpeed: 5.0, damage: 7, mineSpeed: 1.0 };
        if (sub === 'shovel_diamond')    return { digSpeed: 5.0, damage: 4, mineSpeed: 1.0, chopSpeed: 1.0 };
        // Iron
        if (sub === 'sword_iron')        return { damage: 8, mineSpeed: 1.0, chopSpeed: 1.0 };
        if (sub === 'pickaxe_iron')      return { mineSpeed: 3.0, damage: 4, chopSpeed: 1.5 };
        if (sub === 'axe_iron')          return { chopSpeed: 3.0, damage: 5, mineSpeed: 1.0 };
        if (sub === 'shovel_iron')       return { digSpeed: 3.0, damage: 3, mineSpeed: 1.0, chopSpeed: 1.0 };
        // Gold
        if (sub === 'sword_gold')        return { damage: 7, mineSpeed: 1.0, chopSpeed: 1.0 };
        if (sub === 'pickaxe_gold')      return { mineSpeed: 2.5, damage: 3, chopSpeed: 2.5 };
        if (sub === 'axe_gold')          return { chopSpeed: 2.5, damage: 4, mineSpeed: 1.0 };
        if (sub === 'shovel_gold')       return { digSpeed: 2.5, damage: 2, mineSpeed: 1.0, chopSpeed: 1.0 };
        // Stone
        if (sub === 'sword_stone')       return { damage: 5, mineSpeed: 1.0, chopSpeed: 1.0 };
        if (sub === 'pickaxe_stone')     return { mineSpeed: 2.0, damage: 3, chopSpeed: 1.2 };
        if (sub === 'axe_stone')         return { chopSpeed: 2.0, damage: 4, mineSpeed: 1.0 };
        if (sub === 'shovel_stone')      return { digSpeed: 2.0, damage: 2, mineSpeed: 1.0, chopSpeed: 1.0 };
        // Wood
        if (sub === 'sword_wood')        return { damage: 3, mineSpeed: 1.0, chopSpeed: 1.0 };
        if (sub === 'pickaxe_wood')      return { mineSpeed: 1.5, damage: 2, chopSpeed: 1.0 };
        if (sub === 'axe_wood')          return { chopSpeed: 1.5, damage: 3, mineSpeed: 1.0 };
        if (sub === 'shovel_wood')       return { digSpeed: 1.5, damage: 1, mineSpeed: 1.0, chopSpeed: 1.0 };
        if (sub === 'bow')               return { range: 25, damage: 6, passive: 'Ranged Weapon' };
        // Armor
        if (sub.startsWith('head_') || sub.startsWith('helmet_') || sub.includes('helmet')) {
            if (sub.includes('leather')) return { protection: 1 };
            return { protection: sub.includes('diamond') ? 5 : (sub.includes('gold') ? 3 : 2) };
        }
        if (sub.startsWith('chest_') || sub.includes('chestplate')) {
            if (sub.includes('leather')) return { protection: 3 };
            return { protection: sub.includes('diamond') ? 10 : (sub.includes('gold') ? 7 : 5) };
        }
        if (sub.startsWith('legs_') || sub.includes('leggings')) {
            if (sub.includes('leather')) return { protection: 2 };
            return { protection: sub.includes('diamond') ? 7 : (sub.includes('gold') ? 4 : 3) };
        }
        if (sub.startsWith('boots_') || sub.includes('boots')) {
            if (sub.includes('slime')) return { protection: 2, passive: 'Bouncy Slime Absorber' };
            if (sub.includes('leather')) return { protection: 1 };
            return { protection: sub.includes('diamond') ? 5 : (sub.includes('gold') ? 3 : 2) };
        }
        // Mod Items
        if (sub === 'hammer' || sub.endsWith('_hammer') || sub.includes('hammer')) {
            let tier = 'stone';
            if (sub.includes('wood')) tier = 'wood';
            else if (sub.includes('iron')) tier = 'iron';
            else if (sub.includes('gold')) tier = 'gold';
            else if (sub.includes('diamond')) tier = 'diamond';
            else if (sub.includes('netherite')) tier = 'netherite';
            const s = {
                wood: { damage: 5, mineSpeed: 2.5, durability: 120 },
                stone: { damage: 6, mineSpeed: 4.0, durability: 260 },
                iron: { damage: 7, mineSpeed: 6.0, durability: 500 },
                gold: { damage: 5, mineSpeed: 9.0, durability: 70 },
                diamond: { damage: 8, mineSpeed: 8.0, durability: 1561 },
                netherite: { damage: 9, mineSpeed: 9.5, durability: 2031 }
            }[tier] || { damage: 6, mineSpeed: 4.0, durability: 260 };
            return { ...s, chopSpeed: 1.0, is3x3: true, toolType: 'pickaxe', passive: '3x3 Area Miner' };
        }
        if (sub === 'excavator' || sub.endsWith('_excavator') || sub.includes('excavator')) {
            let tier = 'stone';
            if (sub.includes('wood')) tier = 'wood';
            else if (sub.includes('iron')) tier = 'iron';
            else if (sub.includes('gold')) tier = 'gold';
            else if (sub.includes('diamond')) tier = 'diamond';
            else if (sub.includes('netherite')) tier = 'netherite';
            const s = {
                wood: { damage: 4, digSpeed: 2.5, durability: 120 },
                stone: { damage: 5, digSpeed: 4.0, durability: 260 },
                iron: { damage: 6, digSpeed: 6.0, durability: 500 },
                gold: { damage: 4, digSpeed: 9.0, durability: 70 },
                diamond: { damage: 7, digSpeed: 8.0, durability: 1561 },
                netherite: { damage: 8, digSpeed: 9.5, durability: 2031 }
            }[tier] || { damage: 5, digSpeed: 4.0, durability: 260 };
            return { ...s, mineSpeed: 1.0, is3x3: true, toolType: 'shovel', passive: '3x3 Area Excavation' };
        }
        if (sub === 'slime_boots' || sub === 'boots_slime') return { protection: 2, slot: 'boots', bouncy: true, passive: 'Super Bouncy & No Fall Damage' };
        if (sub === 'cloud_parachute' || sub === 'cold_parachute') return { slowFall: true, passive: 'Slow Fall Gliding' };
        if (sub === 'golden_feather')   return { slowFall: true, lowGravity: true, passive: 'Passive Low Gravity & Fall Immunity' };

        return { damage: 0, durability: 999 };
    }

    _renderCreativeInventory() {
        const panel = this.elements.creativeItemsGrid || document.getElementById('creative-items-grid');
        if (!panel) return;
        panel.innerHTML = '';

        const blockDefs = (typeof BLOCKS !== 'undefined' && BLOCKS) ? BLOCKS : (window.BLOCKS_REF || window.BLOCKS);
        if (!blockDefs) return;

        // Skip AIR, internal/invisible/removed blocks, multi-part sub-blocks, growing crop stages, farmland, stems, and biome grass duplicates
        const skip = new Set([
            0, 27, 57, 58, 59, 77, 106, 111, 119, 126, 131, 144, 194, 248, 294,
            // Biome grass duplicates (grass color dynamically adapts to biome)
            37, 38, 42,
            // Farmland (tilled in-game via hoe)
            347, 348,
            // Growing crop block stages (seeds & harvest items appear in materials/food tabs)
            349, 350, 351, 352, 353, 354, 355, 356, // Wheat 0-7
            357, 358, 359, 360,                     // Carrots 0-3
            361, 362, 363, 364,                     // Potatoes 0-3
            365, 366, 367, 368,                     // Beetroots 0-3
            // Stems
            371, 372                                // Pumpkin Stem, Melon Stem
        ]);
        const seenIds = new Set();
        const entries = [];
        for (const [name, id] of Object.entries(blockDefs)) {
            if (skip.has(id) || typeof id !== 'number') continue;
            if (name === 'PLANKS') continue; // Deduplicate: PLANKS and OAK_PLANKS both represent Oak Planks (ID 8)
            if (seenIds.has(id)) continue;
            seenIds.add(id);
            entries.push([name, id]);
        }
        entries.sort((a,b) => a[1] - b[1]);

        const getBlockCategory = (id, nameStr) => {
            const naturalIds = new Set([
                1, 2, 4, 6, 7, 10, 11, 12, 13, 18, 19, 21, 22, 23, 24, 29, 30, 32, 34, 36, 37, 38,
                39, 40, 41, 42, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 60, 61, 62, 63,
                64, 65, 78, 79, 91, 92, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 110, 114, 115, 116,
                117, 118, 120, 121, 122, 123, 125, 129, 130, 132, 133, 134, 135, 136, 137, 138, 143, 185, 186
            ]);
            const lower = nameStr.toLowerCase();
            if (naturalIds.has(id) || lower.includes('ore') || lower.includes('leaves') || lower.includes('sapling') || lower.includes('sculk') || lower.includes('log') || lower.includes('grass') || lower.includes('dirt') || lower.includes('flower') || lower.includes('plant') || lower.includes('vine') || lower.includes('root') || lower.includes('stem') || lower.includes('coral') || lower.includes('nylium') || lower.includes('shroom') || lower.includes('sprout') || lower.includes('soil') || lower.includes('sand') || lower.includes('cloud') || lower.includes('fern')) {
                return 'natural';
            }
            return 'building';
        };

        for (const [name, id] of entries) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot creative-item-slot';
            const readableName = name.replace(/_/g,' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
            slot.title = readableName;
            slot.dataset.blockId = id;
            slot.dataset.blockName = readableName;
            slot.dataset.category = getBlockCategory(id, name);

            if (this.atlas) {
                try {
                    // Pass numeric block id so getBlockProperties and uvMap resolve correctly!
                    const icon = this.atlas.getBlockIcon(id);
                    if (icon) {
                        const img = document.createElement('img');
                        img.src = icon.toDataURL();
                        img.className = 'item-icon';
                        img.style.imageRendering = 'pixelated';
                        img.style.width = '76%'; 
                        img.style.height = '76%';
                        img.style.objectFit = 'contain';
                        img.draggable = false;
                        slot.appendChild(img);
                    }
                } catch(e) {
                    console.warn('Failed to render icon for block', name, id, e);
                }
            }

            // Hover tooltip
            slot.onmouseenter = (e) => {
                if (this.dragState.isDragging || !this.isOpen) return;
                const html = `<strong style="color:#7c5cff; font-size:16px;">${readableName}</strong><br/><span style="color:#aaa;">Block (ID: ${id})</span>`;
                this.elements.tooltip.innerHTML = html;
                this.elements.tooltip.classList.remove('hidden');
                this.elements.tooltip.style.left = (e.clientX + 15) + 'px';
                this.elements.tooltip.style.top = (e.clientY + 15) + 'px';
            };
            slot.onmouseleave = () => {
                this.elements.tooltip.classList.add('hidden');
            };

            // Click / drag to take stack of 64 (or Shift+Click to hotbar directly)
            slot.onmousedown = (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                const fakeSlot = {
                    item: { 
                        type: 'block', 
                        subtype: id, // numeric ID matching game standard
                        name: readableName, 
                        id: 'block_' + id, 
                        stackable: true, 
                        maxStack: 64 
                    },
                    count: 64
                };
                if (e.shiftKey) {
                    if (this.currentPlayer && this.currentPlayer.inventory) {
                        this.currentPlayer.inventory.addItem(fakeSlot.item, fakeSlot.count);
                        this.renderGrid(this.elements.invHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
                        this.renderGrid(this.elements.mainHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
                    }
                    return;
                }
                this.dragState.isDragging = true;
                this.dragState.sourceType = 'creative';
                this.dragState.sourceIndex = -1;
                this.dragState.itemData = fakeSlot;
                this.dragState.isSplit = false;
                this.dragState.offsetX = 0;
                this.dragState.offsetY = 0;
                this.elements.dragIcon.classList.remove('hidden');
                this.renderSlotItem(this.elements.dragIcon, fakeSlot);
                this.updateDragIconPos(e.clientX, e.clientY);
                this.elements.tooltip.classList.add('hidden');
            };

            panel.appendChild(slot);
        }

        // --- Equipment / Items Section ---
        const getEquipDataForSubtype = (sub) => this.getEquipDataForSubtype(sub);

        const equipItems = [
            { type: 'equipment', subtype: 'flint_and_steel', name: 'Flint and Steel' },
            // Mod Items
            { type: 'equipment', subtype: 'slime_boots',     name: 'Slime Boots' },
            { type: 'equipment', subtype: 'cloud_parachute', name: 'Cloud Parachute' },
            { type: 'equipment', subtype: 'golden_feather',   name: 'Golden Feather' },
            // Mod Items - Hammers (all 6 tiers)
            { type: 'equipment', subtype: 'wood_hammer',      name: 'Wooden Hammer' },
            { type: 'equipment', subtype: 'stone_hammer',     name: 'Stone Hammer' },
            { type: 'equipment', subtype: 'iron_hammer',      name: 'Iron Hammer' },
            { type: 'equipment', subtype: 'gold_hammer',      name: 'Golden Hammer' },
            { type: 'equipment', subtype: 'diamond_hammer',   name: 'Diamond Hammer' },
            { type: 'equipment', subtype: 'netherite_hammer', name: 'Netherite Hammer' },
            // Mod Items - Excavators (all 6 tiers)
            { type: 'equipment', subtype: 'wood_excavator',      name: 'Wooden Excavator' },
            { type: 'equipment', subtype: 'stone_excavator',     name: 'Stone Excavator' },
            { type: 'equipment', subtype: 'iron_excavator',      name: 'Iron Excavator' },
            { type: 'equipment', subtype: 'gold_excavator',      name: 'Golden Excavator' },
            { type: 'equipment', subtype: 'diamond_excavator',   name: 'Diamond Excavator' },
            { type: 'equipment', subtype: 'netherite_excavator', name: 'Netherite Excavator' },
            { type: 'material',  subtype: 'lead',             name: 'Lead' },
            { type: 'material',  subtype: 'slime_ball',        name: 'Slimeball' },
            // Netherite
            { type: 'equipment', subtype: 'sword_netherite',   name: 'Netherite Sword' },
            { type: 'equipment', subtype: 'pickaxe_netherite', name: 'Netherite Pickaxe' },
            { type: 'equipment', subtype: 'axe_netherite',     name: 'Netherite Axe' },
            { type: 'equipment', subtype: 'shovel_netherite',  name: 'Netherite Shovel' },
            { type: 'equipment', subtype: 'hoe_netherite',     name: 'Netherite Hoe' },
            // Ruby
            { type: 'equipment', subtype: 'sword_ruby',        name: 'Ruby Sword' },
            { type: 'equipment', subtype: 'pickaxe_ruby',      name: 'Ruby Pickaxe' },
            { type: 'equipment', subtype: 'axe_ruby',          name: 'Ruby Axe' },
            { type: 'equipment', subtype: 'shovel_ruby',       name: 'Ruby Shovel' },
            // Sapphire
            { type: 'equipment', subtype: 'sword_sapphire',    name: 'Sapphire Sword' },
            { type: 'equipment', subtype: 'pickaxe_sapphire',  name: 'Sapphire Pickaxe' },
            { type: 'equipment', subtype: 'axe_sapphire',      name: 'Sapphire Axe' },
            { type: 'equipment', subtype: 'shovel_sapphire',   name: 'Sapphire Shovel' },
            // Zanite (Aether)
            { type: 'equipment', subtype: 'sword_zanite',      name: 'Zanite Sword' },
            { type: 'equipment', subtype: 'pickaxe_zanite',    name: 'Zanite Pickaxe' },
            { type: 'equipment', subtype: 'axe_zanite',        name: 'Zanite Axe' },
            { type: 'equipment', subtype: 'shovel_zanite',     name: 'Zanite Shovel' },
            // Gravitite (Aether)
            { type: 'equipment', subtype: 'sword_gravitite',   name: 'Gravitite Sword' },
            { type: 'equipment', subtype: 'pickaxe_gravitite', name: 'Gravitite Pickaxe' },
            { type: 'equipment', subtype: 'axe_gravitite',     name: 'Gravitite Axe' },
            { type: 'equipment', subtype: 'shovel_gravitite',  name: 'Gravitite Shovel' },
            // Diamond
            { type: 'equipment', subtype: 'sword_diamond',   name: 'Diamond Sword' },
            { type: 'equipment', subtype: 'pickaxe_diamond', name: 'Diamond Pickaxe' },
            { type: 'equipment', subtype: 'axe_diamond',     name: 'Diamond Axe' },
            { type: 'equipment', subtype: 'shovel_diamond',  name: 'Diamond Shovel' },
            { type: 'equipment', subtype: 'hoe_diamond',     name: 'Diamond Hoe' },
            // Iron
            { type: 'equipment', subtype: 'sword_iron',      name: 'Iron Sword' },
            { type: 'equipment', subtype: 'pickaxe_iron',    name: 'Iron Pickaxe' },
            { type: 'equipment', subtype: 'axe_iron',        name: 'Iron Axe' },
            { type: 'equipment', subtype: 'shovel_iron',     name: 'Iron Shovel' },
            { type: 'equipment', subtype: 'hoe_iron',        name: 'Iron Hoe' },
            // Gold
            { type: 'equipment', subtype: 'sword_gold',      name: 'Golden Sword' },
            { type: 'equipment', subtype: 'pickaxe_gold',    name: 'Golden Pickaxe' },
            { type: 'equipment', subtype: 'axe_gold',        name: 'Golden Axe' },
            { type: 'equipment', subtype: 'shovel_gold',     name: 'Golden Shovel' },
            { type: 'equipment', subtype: 'hoe_gold',        name: 'Golden Hoe' },
            // Stone
            { type: 'equipment', subtype: 'sword_stone',     name: 'Stone Sword' },
            { type: 'equipment', subtype: 'pickaxe_stone',   name: 'Stone Pickaxe' },
            { type: 'equipment', subtype: 'axe_stone',       name: 'Stone Axe' },
            { type: 'equipment', subtype: 'shovel_stone',    name: 'Stone Shovel' },
            { type: 'equipment', subtype: 'hoe_stone',       name: 'Stone Hoe' },
            // Wood
            { type: 'equipment', subtype: 'sword_wood',      name: 'Wooden Sword' },
            { type: 'equipment', subtype: 'pickaxe_wood',    name: 'Wooden Pickaxe' },
            { type: 'equipment', subtype: 'axe_wood',        name: 'Wooden Axe' },
            { type: 'equipment', subtype: 'shovel_wood',     name: 'Wooden Shovel' },
            { type: 'equipment', subtype: 'hoe_wood',        name: 'Wooden Hoe' },
            // Armor
            { type: 'equipment', subtype: 'helmet_leather',  name: 'Leather Cap' },
            { type: 'equipment', subtype: 'chest_leather',   name: 'Leather Tunic' },
            { type: 'equipment', subtype: 'legs_leather',    name: 'Leather Pants' },
            { type: 'equipment', subtype: 'boots_leather',   name: 'Leather Boots' },
            { type: 'equipment', subtype: 'helmet_iron',     name: 'Iron Helmet' },
            { type: 'equipment', subtype: 'chest_iron',      name: 'Iron Chestplate' },
            { type: 'equipment', subtype: 'legs_iron',       name: 'Iron Leggings' },
            { type: 'equipment', subtype: 'boots_iron',      name: 'Iron Boots' },
            { type: 'equipment', subtype: 'helmet_gold',     name: 'Golden Helmet' },
            { type: 'equipment', subtype: 'chest_gold',      name: 'Golden Chestplate' },
            { type: 'equipment', subtype: 'legs_gold',       name: 'Golden Leggings' },
            { type: 'equipment', subtype: 'boots_gold',      name: 'Golden Boots' },
            { type: 'equipment', subtype: 'helmet_diamond',  name: 'Diamond Helmet' },
            { type: 'equipment', subtype: 'chest_diamond',   name: 'Diamond Chestplate' },
            { type: 'equipment', subtype: 'legs_diamond',    name: 'Diamond Leggings' },
            { type: 'equipment', subtype: 'boots_diamond',   name: 'Diamond Boots' },
            // Materials
            { type: 'material',  subtype: 'leather',         name: 'Leather' },
            { type: 'material',  subtype: 'item_frame',      name: 'Item Frame' },
            { type: 'material',  subtype: 'netherite_ingot', name: 'Netherite Ingot' },
            { type: 'material',  subtype: 'netherite_scrap', name: 'Netherite Scrap' },
            { type: 'material',  subtype: 'ruby',            name: 'Ruby' },
            { type: 'material',  subtype: 'sapphire',        name: 'Sapphire' },
            { type: 'material',  subtype: 'zanite_gemstone', name: 'Zanite Gemstone' },
            { type: 'material',  subtype: 'gravitite_ore',   name: 'Gravitite Ore' },
            { type: 'material',  subtype: 'ambrosium_shard', name: 'Ambrosium Shard' },
            { type: 'material',  subtype: 'quartz',          name: 'Nether Quartz' },
            { type: 'material',  subtype: 'raw_iron',        name: 'Raw Iron' },
            { type: 'material',  subtype: 'raw_gold',        name: 'Raw Gold' },
            { type: 'material',  subtype: 'iron_ingot',      name: 'Iron Ingot' },
            { type: 'material',  subtype: 'gold_ingot',      name: 'Gold Ingot' },
            { type: 'material',  subtype: 'diamond',         name: 'Diamond' },
            { type: 'material',  subtype: 'emerald',         name: 'Emerald' },
            { type: 'material',  subtype: 'lapis_lazuli',    name: 'Lapis Lazuli' },
            { type: 'material',  subtype: 'redstone',        name: 'Redstone' },
            { type: 'material',  subtype: 'coal',            name: 'Coal' },
            { type: 'material',  subtype: 'flint',           name: 'Flint' },
            { type: 'material',  subtype: 'feather',         name: 'Feather' },
            { type: 'material',  subtype: 'string',          name: 'String' },
            { type: 'material',  subtype: 'paper',           name: 'Paper' },
            { type: 'material',  subtype: 'book',            name: 'Book' },
            { type: 'material',  subtype: 'sugar',           name: 'Sugar' },
            { type: 'material',  subtype: 'wheat',           name: 'Wheat' },
            { type: 'material',  subtype: 'wheat_seeds',     name: 'Wheat Seeds' },
            { type: 'material',  subtype: 'pumpkin_seeds',   name: 'Pumpkin Seeds' },
            { type: 'material',  subtype: 'melon_seeds',     name: 'Melon Seeds' },
            { type: 'material',  subtype: 'beetroot_seeds',  name: 'Beetroot Seeds' },
            { type: 'material',  subtype: 'arrow',           name: 'Arrow' },
            { type: 'material',  subtype: 'compass',         name: 'Compass' },
            { type: 'material',  subtype: 'clock',           name: 'Clock' },
            { type: 'material',  subtype: 'ender_pearl',     name: 'Ender Pearl' },
            { type: 'material',  subtype: 'eye_of_ender',    name: 'Eye of Ender' },
            { type: 'material',  subtype: 'blaze_rod',       name: 'Blaze Rod' },
            { type: 'material',  subtype: 'blaze_powder',    name: 'Blaze Powder' },
            { type: 'equipment', subtype: 'bow',             name: 'Bow' },
            { type: 'equipment', subtype: 'bucket',          name: 'Bucket' },
            { type: 'equipment', subtype: 'water_bucket',    name: 'Water Bucket' },
            { type: 'equipment', subtype: 'lava_bucket',     name: 'Lava Bucket' },
            { type: 'material',  subtype: 'red_dye',         name: 'Red Dye' },
            { type: 'material',  subtype: 'yellow_dye',      name: 'Yellow Dye' },
            { type: 'material',  subtype: 'blue_dye',        name: 'Blue Dye' },
            { type: 'material',  subtype: 'green_dye',       name: 'Green Dye' },
            { type: 'material',  subtype: 'white_dye',       name: 'White Dye' },
            { type: 'material',  subtype: 'black_dye',       name: 'Black Dye' },
            { type: 'material',  subtype: 'iron_nugget',     name: 'Iron Nugget' },
            { type: 'material',  subtype: 'gold_nugget',     name: 'Gold Nugget' },
            { type: 'material',  subtype: 'bone',            name: 'Bone' },
            { type: 'material',  subtype: 'bone_meal',       name: 'Bone Meal' },
            { type: 'material',  subtype: 'gunpowder',       name: 'Gunpowder' },
            // Food
            { type: 'food',      subtype: 'raw_beef',        name: 'Raw Beef' },
            { type: 'food',      subtype: 'cooked_beef',     name: 'Steak' },
            { type: 'food',      subtype: 'raw_porkchop',    name: 'Raw Porkchop' },
            { type: 'food',      subtype: 'cooked_porkchop', name: 'Cooked Porkchop' },
            { type: 'food',      subtype: 'raw_chicken',     name: 'Raw Chicken' },
            { type: 'food',      subtype: 'cooked_chicken',  name: 'Cooked Chicken' },
            { type: 'food',      subtype: 'raw_mutton',      name: 'Raw Mutton' },
            { type: 'food',      subtype: 'cooked_mutton',   name: 'Cooked Mutton' },
            { type: 'food',      subtype: 'raw_fish',        name: 'Raw Fish' },
            { type: 'food',      subtype: 'cooked_fish',     name: 'Cooked Fish' },
            { type: 'food',      subtype: 'apple',           name: 'Apple' },
            { type: 'food',      subtype: 'golden_apple',    name: 'Golden Apple' },
            { type: 'food',      subtype: 'bread',           name: 'Bread' },
            { type: 'food',      subtype: 'carrot',          name: 'Carrot' },
            { type: 'food',      subtype: 'potato',          name: 'Potato' },
            { type: 'food',      subtype: 'baked_potato',    name: 'Baked Potato' },
            { type: 'food',      subtype: 'poisonous_potato',name: 'Poisonous Potato' },
            { type: 'food',      subtype: 'beetroot',        name: 'Beetroot' },
            { type: 'food',      subtype: 'beetroot_soup',   name: 'Beetroot Soup' },
            { type: 'food',      subtype: 'melon_slice',     name: 'Melon Slice' },
            { type: 'food',      subtype: 'sweet_berries',   name: 'Sweet Berries' },
            { type: 'food',      subtype: 'chorus_fruit',    name: 'Chorus Fruit' },
            { type: 'food',      subtype: 'cookie',          name: 'Cookie' },
            { type: 'food',      subtype: 'pumpkin_pie',     name: 'Pumpkin Pie' },
        ];

        // Render equipment/item slots synchronously using generateItemTexture
        for (const itm of equipItems) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot creative-item-slot';
            slot.title = itm.name;
            slot.dataset.itemType = itm.type;
            slot.dataset.itemSubtype = itm.subtype;
            slot.dataset.itemName = itm.name;
            slot.dataset.category = itm.type === 'equipment' ? 'equipment' : 'materials';

            const cvs = generateItemTexture(itm.type, itm.subtype, (updatedCvs) => {
                const existing = slot.querySelector('img');
                if (existing) existing.src = updatedCvs.toDataURL();
            });
            const img = document.createElement('img');
            img.src = cvs.toDataURL();
            img.className = 'item-icon';
            img.style.imageRendering = 'pixelated';
            img.style.width = '76%';
            img.style.height = '76%';
            img.style.objectFit = 'contain';
            img.draggable = false;
            slot.appendChild(img);

            slot.onmouseenter = (e) => {
                if (this.dragState.isDragging || !this.isOpen) return;
                let html = `<strong style="color:#7c5cff; font-size:16px;">${itm.name}</strong><br/><span style="color:#aaa;">${itm.type.charAt(0).toUpperCase() + itm.type.slice(1)}</span>`;
                if (itm.type === 'equipment') {
                    const ed = getEquipDataForSubtype(itm.subtype);
                    if (ed.damage) html += `<br/><span style="color:#ff6666;">Damage: ${ed.damage}</span>`;
                    if (ed.mineSpeed && ed.mineSpeed > 1) html += `<br/><span style="color:#ffaa44;">Mine Speed: ${ed.mineSpeed}x</span>`;
                    if (ed.chopSpeed && ed.chopSpeed > 1) html += `<br/><span style="color:#a7c957;">Chop Speed: ${ed.chopSpeed}x</span>`;
                    if (ed.digSpeed && ed.digSpeed > 1) html += `<br/><span style="color:#d4a373;">Dig Speed: ${ed.digSpeed}x</span>`;
                    if (ed.protection) html += `<br/><span style="color:#88aaff;">Protection: ${ed.protection}</span>`;
                    if (ed.passive) html += `<br/><span style="color:#ffd166; font-weight:bold;">★ ${ed.passive}</span>`;
                }
                this.elements.tooltip.innerHTML = html;
                this.elements.tooltip.classList.remove('hidden');
                this.elements.tooltip.style.left = (e.clientX + 15) + 'px';
                this.elements.tooltip.style.top  = (e.clientY + 15) + 'px';
            };
            slot.onmouseleave = () => this.elements.tooltip.classList.add('hidden');

            slot.onmousedown = (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                const fakeSlot = {
                    item: {
                        type: itm.type,
                        subtype: itm.subtype,
                        name: itm.name,
                        id: `${itm.type}_${itm.subtype}_${Date.now()}`,
                        stackable: itm.type === 'material' || itm.type === 'food',
                        maxStack: (itm.type === 'material' || itm.type === 'food') ? 64 : 1,
                        data: itm.type === 'equipment' ? { equipData: getEquipDataForSubtype(itm.subtype) } : {},
                        description: ''
                    },
                    count: (itm.type === 'material' || itm.type === 'food') ? 64 : 1
                };
                if (e.shiftKey) {
                    if (this.currentPlayer && this.currentPlayer.inventory) {
                        this.currentPlayer.inventory.addItem(fakeSlot.item, fakeSlot.count);
                        this.renderGrid(this.elements.invHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
                        this.renderGrid(this.elements.mainHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
                    }
                    return;
                }
                this.dragState.isDragging = true;
                this.dragState.sourceType = 'creative';
                this.dragState.sourceIndex = -1;
                this.dragState.itemData = fakeSlot;
                this.dragState.isSplit = false;
                this.dragState.offsetX = 0;
                this.dragState.offsetY = 0;
                this.elements.dragIcon.classList.remove('hidden');
                this.renderSlotItem(this.elements.dragIcon, fakeSlot);
                this.updateDragIconPos(e.clientX, e.clientY);
                this.elements.tooltip.classList.add('hidden');
            };

            panel.appendChild(slot);
        }

        // --- Spawn Eggs Section ---
        const spawnEggs = [
            { subtype: 'cow',             name: 'Spawn Cow',             mob: 'COW' },
            { subtype: 'pig',             name: 'Spawn Pig',             mob: 'PIG' },
            { subtype: 'sheep',           name: 'Spawn Sheep',           mob: 'SHEEP' },
            { subtype: 'chicken',         name: 'Spawn Chicken',         mob: 'CHICKEN' },
            { subtype: 'zombie',          name: 'Spawn Zombie',          mob: 'ZOMBIE' },
            { subtype: 'skeleton',        name: 'Spawn Skeleton',        mob: 'SKELETON' },
            { subtype: 'creeper',         name: 'Spawn Creeper',         mob: 'CREEPER' },
            { subtype: 'enderman',        name: 'Spawn Enderman',        mob: 'ENDERMAN' },
            { subtype: 'spider',          name: 'Spawn Spider',          mob: 'SPIDER' },
            { subtype: 'slime',           name: 'Spawn Slime',           mob: 'SLIME' },
            { subtype: 'lavaslime',       name: 'Spawn Magma Cube',      mob: 'LAVASLIME' },
            { subtype: 'bat',             name: 'Spawn Bat',             mob: 'BAT' },
            { subtype: 'piglin_bruiser',  name: 'Spawn Piglin Brute',    mob: 'PIGLIN_BRUISER' },
            { subtype: 'golem',           name: 'Spawn Iron Golem',      mob: 'GOLEM' },
            { subtype: 'turtle',          name: 'Spawn Turtle',          mob: 'TURTLE' },
            { subtype: 'frog',            name: 'Spawn Frog',            mob: 'FROG' },
            { subtype: 'camel',           name: 'Spawn Camel',           mob: 'CAMEL' },
            { subtype: 'cod',             name: 'Spawn Cod',             mob: 'COD' },
            { subtype: 'salmon',          name: 'Spawn Salmon',          mob: 'SALMON' },
            { subtype: 'tropical_fish',   name: 'Spawn Tropical Fish',   mob: 'TROPICAL_FISH' },
            { subtype: 'pufferfish',      name: 'Spawn Pufferfish',      mob: 'PUFFERFISH' },
            { subtype: 'swet',            name: 'Spawn Swet',            mob: 'SWET' },
            { subtype: 'aerwhale',        name: 'Spawn Aerwhale',        mob: 'AERWHALE' },
            { subtype: 'airwhale',        name: 'Spawn Airwhale',        mob: 'AERWHALE' },
        ];

        for (const egg of spawnEggs) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot creative-item-slot';
            slot.title = egg.name;
            slot.dataset.itemType = 'spawn_egg';
            slot.dataset.itemSubtype = egg.subtype;
            slot.dataset.itemName = egg.name;
            slot.dataset.category = 'spawneggs';

            const cvs = generateItemTexture('spawn_egg', egg.subtype, (updatedCvs) => {
                const existing = slot.querySelector('img');
                if (existing) existing.src = updatedCvs.toDataURL();
            });
            const img = document.createElement('img');
            img.src = cvs.toDataURL();
            img.className = 'item-icon';
            img.style.imageRendering = 'pixelated';
            img.style.width = '76%';
            img.style.height = '76%';
            img.style.objectFit = 'contain';
            img.draggable = false;
            slot.appendChild(img);

            slot.onmouseenter = (e) => {
                if (this.dragState.isDragging || !this.isOpen) return;
                const html = `<strong style="color:#7c5cff; font-size:16px;">${egg.name}</strong><br/><span style="color:#aaccff;">Spawn Egg</span><br/><span style="color:#aaa;">Right-click ground to spawn</span>`;
                this.elements.tooltip.innerHTML = html;
                this.elements.tooltip.classList.remove('hidden');
                this.elements.tooltip.style.left = (e.clientX + 15) + 'px';
                this.elements.tooltip.style.top  = (e.clientY + 15) + 'px';
            };
            slot.onmouseleave = () => this.elements.tooltip.classList.add('hidden');

            slot.onmousedown = (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                const fakeSlot = {
                    item: {
                        type: 'spawn_egg',
                        subtype: egg.subtype,
                        name: egg.name,
                        id: `spawn_egg_${egg.subtype}_${Date.now()}`,
                        stackable: true,
                        maxStack: 64,
                        data: { mobType: egg.mob },
                        description: 'Right-click ground to spawn'
                    },
                    count: 64
                };
                if (e.shiftKey) {
                    if (this.currentPlayer && this.currentPlayer.inventory) {
                        this.currentPlayer.inventory.addItem(fakeSlot.item, fakeSlot.count);
                        this.renderGrid(this.elements.invHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
                        this.renderGrid(this.elements.mainHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
                    }
                    return;
                }
                this.dragState.isDragging = true;
                this.dragState.sourceType = 'creative';
                this.dragState.sourceIndex = -1;
                this.dragState.itemData = fakeSlot;
                this.dragState.isSplit = false;
                this.dragState.offsetX = 0;
                this.dragState.offsetY = 0;
                this.elements.dragIcon.classList.remove('hidden');
                this.renderSlotItem(this.elements.dragIcon, fakeSlot);
                this.updateDragIconPos(e.clientX, e.clientY);
                this.elements.tooltip.classList.add('hidden');
            };

            panel.appendChild(slot);
        }

        // --- Magic Section (Wands, Spells, Modifiers) ---
        const wandTemplates = [
            { subtype: 'wand_basic', name: 'Basic Wand', slots: 4, innate: 'BOLT', desc: 'Channels arcane energy.' },
            { subtype: 'wand_fire', name: 'Fire Wand', slots: 4, innate: 'BURST', desc: 'Shoots burning projectiles.' },
            { subtype: 'wand_ice', name: 'Ice Wand', slots: 4, innate: 'BOLT', desc: 'Shoots fast freezing bolts.' },
            { subtype: 'wand_nature', name: 'Nature Wand', slots: 4, innate: 'HEAL', desc: 'Heals the wielder.' },
            { subtype: 'wand_lightning', name: 'Lightning Wand', slots: 4, innate: 'THUNDER', desc: 'Strikes targets with instant lightning.' },
            { subtype: 'wand_earth', name: 'Earth Wand', slots: 4, innate: 'EARTH', desc: 'Hurls crushing boulders.' },
            { subtype: 'wand_wind', name: 'Wind Wand', slots: 4, innate: 'WIND', desc: 'Fires cutting wind blades with high knockback.' },
            { subtype: 'wand_void', name: 'Void Wand', slots: 4, innate: 'VOID', desc: 'Fires destructive void orbs.' },
            { subtype: 'wand_meteor', name: 'Meteor Wand', slots: 5, innate: 'METEOR', desc: 'Calls down devastating meteors.' },
            { subtype: 'wand_master', name: 'Master Wand', slots: 6, innate: 'THUNDER', desc: 'Ultimate magical staff with 6 spell slots.' },
        ];

        for (const wt of wandTemplates) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot creative-item-slot';
            slot.title = wt.name;
            slot.dataset.itemType = 'wand';
            slot.dataset.itemSubtype = wt.subtype;
            slot.dataset.itemName = wt.name;
            slot.dataset.category = 'magic';

            const cvs = generateItemTexture('wand', wt.subtype, (updatedCvs) => {
                const existing = slot.querySelector('img');
                if (existing) existing.src = updatedCvs.toDataURL();
            });
            const img = document.createElement('img');
            img.src = cvs.toDataURL();
            img.className = 'item-icon';
            img.style.imageRendering = 'pixelated';
            img.style.width = '76%';
            img.style.height = '76%';
            img.style.objectFit = 'contain';
            img.draggable = false;
            slot.appendChild(img);

            slot.onmouseenter = (e) => {
                if (this.dragState.isDragging || !this.isOpen) return;
                const html = `<strong style="color:#c084fc; font-size:16px;">${wt.name}</strong><br/><span style="color:#aaa;">Wand (${wt.slots} Slots)</span><br/><span style="color:#67e8f9;">Innate: ${wt.innate}</span><br/><span style="color:#e2e8f0;">${wt.desc}</span>`;
                this.elements.tooltip.innerHTML = html;
                this.elements.tooltip.classList.remove('hidden');
                this.elements.tooltip.style.left = (e.clientX + 15) + 'px';
                this.elements.tooltip.style.top = (e.clientY + 15) + 'px';
            };
            slot.onmouseleave = () => this.elements.tooltip.classList.add('hidden');

            slot.onmousedown = (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                const wandObj = new Wand(wt.name, wt.slots, wt.innate);
                const fakeSlot = {
                    item: {
                        type: 'wand',
                        subtype: wt.subtype,
                        name: wt.name,
                        id: `wand_${wt.subtype}_${Date.now()}`,
                        stackable: false,
                        maxStack: 1,
                        data: { wand: wandObj },
                        description: wt.desc
                    },
                    count: 1
                };
                if (e.shiftKey) {
                    if (this.currentPlayer && this.currentPlayer.inventory) {
                        this.currentPlayer.inventory.addItem(fakeSlot.item, 1);
                        this.renderGrid(this.elements.invHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
                        this.renderGrid(this.elements.mainHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
                    }
                    return;
                }
                this.dragState.isDragging = true;
                this.dragState.sourceType = 'creative';
                this.dragState.sourceIndex = -1;
                this.dragState.itemData = fakeSlot;
                this.dragState.isSplit = false;
                this.dragState.offsetX = 0;
                this.dragState.offsetY = 0;
                this.elements.dragIcon.classList.remove('hidden');
                this.renderSlotItem(this.elements.dragIcon, fakeSlot);
                this.updateDragIconPos(e.clientX, e.clientY);
                this.elements.tooltip.classList.add('hidden');
            };

            panel.appendChild(slot);
        }

        // Spells
        for (const [spellKey, spellCfg] of Object.entries(SPELL_TYPES)) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot creative-item-slot';
            slot.title = spellCfg.name;
            slot.dataset.itemType = 'spell';
            slot.dataset.itemSubtype = spellKey;
            slot.dataset.itemName = spellCfg.name;
            slot.dataset.category = 'magic';

            const cvs = generateItemTexture('spell', spellKey, (updatedCvs) => {
                const existing = slot.querySelector('img');
                if (existing) existing.src = updatedCvs.toDataURL();
            });
            const img = document.createElement('img');
            img.src = cvs.toDataURL();
            img.className = 'item-icon';
            img.style.imageRendering = 'pixelated';
            img.style.width = '76%';
            img.style.height = '76%';
            img.style.objectFit = 'contain';
            img.draggable = false;
            slot.appendChild(img);

            slot.onmouseenter = (e) => {
                if (this.dragState.isDragging || !this.isOpen) return;
                let html = `<strong style="color:#60a5fa; font-size:16px;">${spellCfg.name}</strong><br/><span style="color:#aaa;">Spell [${spellCfg.element}]</span><br/>`;
                if (spellCfg.baseDamage) html += `<span style="color:#f87171;">Damage: ${spellCfg.baseDamage}</span><br/>`;
                if (spellCfg.baseManaCost) html += `<span style="color:#38bdf8;">Mana: ${spellCfg.baseManaCost}</span><br/>`;
                if (spellCfg.projectileSpeed) html += `<span style="color:#4ade80;">Speed: ${spellCfg.projectileSpeed}</span><br/>`;
                html += `<span style="color:#cbd5e1;">${spellCfg.description || ''}</span>`;
                this.elements.tooltip.innerHTML = html;
                this.elements.tooltip.classList.remove('hidden');
                this.elements.tooltip.style.left = (e.clientX + 15) + 'px';
                this.elements.tooltip.style.top = (e.clientY + 15) + 'px';
            };
            slot.onmouseleave = () => this.elements.tooltip.classList.add('hidden');

            slot.onmousedown = (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                const spellObj = new Spell(spellKey);
                const fakeSlot = {
                    item: {
                        type: 'spell',
                        subtype: spellKey,
                        name: spellCfg.name,
                        id: `spell_${spellKey}_${Date.now()}`,
                        stackable: true,
                        maxStack: 16,
                        data: { spell: spellObj },
                        description: spellCfg.description || ''
                    },
                    count: 1
                };
                if (e.shiftKey) {
                    if (this.currentPlayer && this.currentPlayer.inventory) {
                        this.currentPlayer.inventory.addItem(fakeSlot.item, 1);
                        this.renderGrid(this.elements.invHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
                        this.renderGrid(this.elements.mainHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
                    }
                    return;
                }
                this.dragState.isDragging = true;
                this.dragState.sourceType = 'creative';
                this.dragState.sourceIndex = -1;
                this.dragState.itemData = fakeSlot;
                this.dragState.isSplit = false;
                this.dragState.offsetX = 0;
                this.dragState.offsetY = 0;
                this.elements.dragIcon.classList.remove('hidden');
                this.renderSlotItem(this.elements.dragIcon, fakeSlot);
                this.updateDragIconPos(e.clientX, e.clientY);
                this.elements.tooltip.classList.add('hidden');
            };

            panel.appendChild(slot);
        }

        // Modifiers
        for (const [modKey, modCfg] of Object.entries(MODIFIER_TYPES)) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot creative-item-slot';
            slot.title = modCfg.name;
            slot.dataset.itemType = 'modifier';
            slot.dataset.itemSubtype = modKey;
            slot.dataset.itemName = modCfg.name;
            slot.dataset.category = 'magic';

            const cvs = generateItemTexture('modifier', modKey, (updatedCvs) => {
                const existing = slot.querySelector('img');
                if (existing) existing.src = updatedCvs.toDataURL();
            });
            const img = document.createElement('img');
            img.src = cvs.toDataURL();
            img.className = 'item-icon';
            img.style.imageRendering = 'pixelated';
            img.style.width = '76%';
            img.style.height = '76%';
            img.style.objectFit = 'contain';
            img.draggable = false;
            slot.appendChild(img);

            slot.onmouseenter = (e) => {
                if (this.dragState.isDragging || !this.isOpen) return;
                const html = `<strong style="color:#f472b6; font-size:16px;">${modCfg.name}</strong><br/><span style="color:#aaa;">Modifier (${modCfg.rarity})</span><br/><span style="color:#cbd5e1;">${modCfg.description || ''}</span>`;
                this.elements.tooltip.innerHTML = html;
                this.elements.tooltip.classList.remove('hidden');
                this.elements.tooltip.style.left = (e.clientX + 15) + 'px';
                this.elements.tooltip.style.top = (e.clientY + 15) + 'px';
            };
            slot.onmouseleave = () => this.elements.tooltip.classList.add('hidden');

            slot.onmousedown = (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                const modObj = new Modifier(modKey);
                const fakeSlot = {
                    item: {
                        type: 'modifier',
                        subtype: modKey,
                        name: modCfg.name,
                        id: `mod_${modKey}_${Date.now()}`,
                        stackable: true,
                        maxStack: 16,
                        data: { mod: modObj },
                        description: modCfg.description || ''
                    },
                    count: 1
                };
                if (e.shiftKey) {
                    if (this.currentPlayer && this.currentPlayer.inventory) {
                        this.currentPlayer.inventory.addItem(fakeSlot.item, 1);
                        this.renderGrid(this.elements.invHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
                        this.renderGrid(this.elements.mainHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
                    }
                    return;
                }
                this.dragState.isDragging = true;
                this.dragState.sourceType = 'creative';
                this.dragState.sourceIndex = -1;
                this.dragState.itemData = fakeSlot;
                this.dragState.isSplit = false;
                this.dragState.offsetX = 0;
                this.dragState.offsetY = 0;
                this.elements.dragIcon.classList.remove('hidden');
                this.renderSlotItem(this.elements.dragIcon, fakeSlot);
                this.updateDragIconPos(e.clientX, e.clientY);
                this.elements.tooltip.classList.add('hidden');
            };

            panel.appendChild(slot);
        }

        this._initCreativeTabsAndSearch();
        this._filterCreativeSlots();
    }

    _initCreativeTabsAndSearch() {
        if (this._creativeTabsInitialized) return;
        this._creativeTabsInitialized = true;
        this.activeCreativeTab = 'all';

        const tabs = document.querySelectorAll('.creative-tab');
        tabs.forEach(tabBtn => {
            tabBtn.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabBtn.classList.add('active');
                const tabKey = tabBtn.dataset.tab;
                this.activeCreativeTab = tabKey;
                if (tabKey === 'survival') {
                    if (this.elements.survivalContainer) this.elements.survivalContainer.classList.remove('hidden');
                    if (this.elements.creativeItemsGrid) this.elements.creativeItemsGrid.parentElement.classList.add('hidden');
                    if (this.elements.creativeSearch) this.elements.creativeSearch.parentElement.classList.add('hidden');
                    if (this.currentPlayer) {
                        this.renderGrid(this.elements.mainGrid, this.currentPlayer.inventory.slots.slice(9, 36), 9, this.currentPlayer, 'inventory');
                        this.renderGrid(this.elements.invHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
                    }
                } else {
                    if (this.elements.survivalContainer) this.elements.survivalContainer.classList.add('hidden');
                    if (this.elements.creativeItemsGrid) this.elements.creativeItemsGrid.parentElement.classList.remove('hidden');
                    if (this.elements.creativeSearch) this.elements.creativeSearch.parentElement.classList.remove('hidden');
                    this._filterCreativeSlots();
                }
            };
        });

        if (this.elements.creativeSearch) {
            this.elements.creativeSearch.oninput = () => this._filterCreativeSlots();
        }

        if (this.elements.creativeTrashSlot) {
            this.elements.creativeTrashSlot.onmouseup = () => {
                if (this.dragState.isDragging) {
                    this.dragState.itemData = null;
                    this.dragState.isDragging = false;
                    this.elements.dragIcon.classList.add('hidden');
                    this._updateInventory();
                }
            };
            this.elements.creativeTrashSlot.onclick = () => {
                if (this.dragState.isDragging) {
                    this.dragState.itemData = null;
                    this.dragState.isDragging = false;
                    this.elements.dragIcon.classList.add('hidden');
                    this._updateInventory();
                } else if (this.currentPlayer && this.currentPlayer.inventory) {
                    const sel = this.currentPlayer.selectedSlot;
                    if (this.currentPlayer.inventory.slots[sel]) {
                        this.currentPlayer.inventory.slots[sel] = null;
                        this.renderGrid(this.elements.invHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
                        this.renderGrid(this.elements.mainHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
                    }
                }
            };
        }
    }

    _filterCreativeSlots() {
        const query = (this.elements.creativeSearch ? this.elements.creativeSearch.value : '').toLowerCase().trim();
        const tab = this.activeCreativeTab || 'all';
        const slots = (this.elements.creativeItemsGrid || document.getElementById('creative-items-grid'))?.querySelectorAll('.creative-item-slot');
        if (!slots) return;
        const q = query.endsWith('s') ? query.slice(0, -1) : query;
        slots.forEach(slot => {
            const cat = (slot.dataset.category || 'building').toLowerCase();
            const name = (slot.title || slot.dataset.itemName || slot.dataset.blockName || '').toLowerCase();
            const subtype = (slot.dataset.itemSubtype || '').toLowerCase();
            const keywords = (slot.dataset.itemKeywords || '').toLowerCase();
            // When user types a search query, search EVERYTHING across all tabs!
            const matchesTab = (query.length > 0) || (tab === 'all') || cat.includes(tab);
            
            const matchesQuery = !query || 
                name.includes(query) || 
                subtype.includes(query) || 
                keywords.includes(query) ||
                (q.length >= 3 && (name.includes(q) || subtype.includes(q) || keywords.includes(q)));
            
            slot.style.display = (matchesTab && matchesQuery) ? '' : 'none';
        });
    }

    updateHUD(player, fps, atlas) {
        if (!player) return;
        this.currentPlayer = player;
        this.atlas = atlas;

        // Render Always-Visible Hotbar
        this.renderGrid(this.elements.mainHotbar, player.inventory.slots.slice(0, 9), 0, player, 'inventory');
        this.updateMinecraftHUD(player);
        
        // If open, render full inventory
        if (this.isOpen) {
            const isSurvivalShowing = !this.isCreativeOpen || this.activeCreativeTab === 'survival';
            if (isSurvivalShowing) {
                this.renderGrid(this.elements.mainGrid, player.inventory.slots.slice(9, 36), 9, player, 'inventory');
            }
            this.renderGrid(this.elements.invHotbar, player.inventory.slots.slice(0, 9), 0, player, 'inventory');
            
            if (isSurvivalShowing) {
                // Render Wand Config if holding wand (and not using 3x3 crafting table, chest, or furnace)
                const activeSlot = player.inventory.slots[player.selectedSlot];
                if (!this.is3x3Crafting && !this.chestPos && !this.furnacePos && activeSlot && activeSlot.item.type === 'wand') {
                    if (this.elements.wandConfigPanel) this.elements.wandConfigPanel.classList.remove('hidden');
                    if (this.elements.craftingPanel) this.elements.craftingPanel.classList.add('hidden');
                    this.renderWandConfig(activeSlot.item);
                } else {
                    if (this.elements.wandConfigPanel) this.elements.wandConfigPanel.classList.add('hidden');
                    if (!this.chestPos && !this.furnacePos && this.elements.craftingPanel) {
                        this.elements.craftingPanel.classList.remove('hidden');
                    }
                }

                // Render crafting slots
                this._updateCraftingSlots();
                this._updateCraftingOutput();

                // Render armor slots
                this._updateArmorSlots();

                // Render live 3D player character preview in inventory box
                this._renderPlayerPreview(player);

                // Render chest if open
                if (this.chestPos && this.chestInventory) {
                    this.renderGrid(this.elements.chestGrid, this.chestInventory, 0, player, 'chest');
                }

                // Render furnace if open
                if (this.furnacePos && this.furnaceData) {
                    this._updateFurnaceSlots();
                }
            }
        }
    }

    updateMinecraftHUD(player) {
        const pHealth = (player && player.health !== undefined) ? player.health : 100;
        const pMaxHealth = (player && player.maxHealth) ? player.maxHealth : 100;
        const pMana = (player && player.mana !== undefined) ? player.mana : 100;
        const pMaxMana = (player && player.maxMana) ? player.maxMana : 100;
        const pSelected = (player && player.selectedSlot !== undefined) ? player.selectedSlot : 0;

        // 1. Hotbar Selector position
        const selector = document.getElementById('mc-hotbar-selector');
        if (selector) {
            selector.style.left = `${pSelected * 50 - 3}px`;
        }

        // 2. Blue Mana Bar (Repurposed XP bar)
        const manaFill = document.getElementById('mc-mana-fill');
        const manaText = document.getElementById('mc-mana-text');
        if (manaFill) {
            const manaPct = Math.max(0, Math.min(100, (pMana / pMaxMana) * 100));
            manaFill.style.width = `${manaPct}%`;
        }
        if (manaText) {
            manaText.textContent = `${Math.ceil(pMana)}`;
        }

        // 3. Health Hearts (10 hearts total, 10 HP per heart)
        const healthBar = document.getElementById('mc-health-bar');
        if (healthBar) {
            if (player && (player.isCreative || player.isSpectator)) {
                healthBar.style.display = 'none';
                healthBar.classList.add('hidden');
            } else {
                healthBar.style.display = 'flex';
                healthBar.classList.remove('hidden');
                const maxHearts = 10;
                const hpPerHeart = pMaxHealth / maxHearts; // 10 HP
                const halfHp = hpPerHeart / 2; // 5 HP

                if (this._prevHealth === undefined) this._prevHealth = pHealth;
                const isHurt = pHealth < this._prevHealth;
                this._prevHealth = pHealth;

                const isHardcore = !!(player && player.isHardcore);

                let heartsHtml = '';
                for (let i = 0; i < maxHearts; i++) {
                    const heartVal = (i + 1) * hpPerHeart;
                    let heartImg = isHardcore ? 'heart_hardcore_empty.png' : 'heart_empty.png';
                    if (pHealth >= heartVal) {
                        heartImg = isHardcore
                            ? (isHurt ? 'heart_hardcore_flash_full.png' : 'heart_hardcore_full.png')
                            : (isHurt ? 'heart_flash_full.png' : 'heart_full.png');
                    } else if (pHealth >= heartVal - halfHp) {
                        heartImg = isHardcore
                            ? (isHurt ? 'heart_hardcore_flash_half.png' : 'heart_hardcore_half.png')
                            : (isHurt ? 'heart_flash_half.png' : 'heart_half.png');
                    } else {
                        heartImg = isHardcore
                            ? 'heart_hardcore_empty.png'
                            : (isHurt ? 'heart_flash_empty.png' : 'heart_empty.png');
                    }

                    const lowHealthShake = (pHealth <= 20 && Math.random() > 0.6) ? 'transform: translateY(-2px);' : '';
                    heartsHtml += `<img src="assets/mc/hud/${heartImg}" class="mc-heart" style="${lowHealthShake}" />`;
                }
                healthBar.innerHTML = heartsHtml;
            }
        }

        // 4. Armor Bar (10 chestplate icons)
        const armorBar = document.getElementById('mc-armor-bar');
        if (armorBar) {
            let totalArmor = 0;
            if (player && !player.isCreative && !player.isSpectator && player.inventory && player.inventory.armor) {
                for (const slot of player.inventory.armor) {
                    if (slot && slot.item && slot.item.data && slot.item.data.equipData) {
                        totalArmor += (slot.item.data.equipData.protection || 0);
                    }
                }
            }

            if (totalArmor > 0) {
                armorBar.classList.remove('hidden');
                let armorHtml = '';
                const maxArmorIcons = 10;
                const armorPerIcon = 2;
                for (let i = 0; i < maxArmorIcons; i++) {
                    const iconVal = (i + 1) * armorPerIcon;
                    let armorImg = 'armor_empty.png';
                    if (totalArmor >= iconVal) {
                        armorImg = 'armor_full.png';
                    } else if (totalArmor >= iconVal - 1) {
                        armorImg = 'armor_half.png';
                    }
                    armorHtml += `<img src="assets/mc/hud/${armorImg}" class="mc-armor" />`;
                }
                armorBar.innerHTML = armorHtml;
            } else {
                armorBar.classList.add('hidden');
            }
        }

        // 5. Hunger Bar (10 drumstick icons, 2 hunger per drumstick)
        const hungerBar = document.getElementById('mc-hunger-bar');
        if (hungerBar) {
            if (player && (player.isCreative || player.isSpectator)) {
                hungerBar.style.display = 'none';
                hungerBar.classList.add('hidden');
            } else {
                hungerBar.style.display = 'flex';
                hungerBar.classList.remove('hidden');
                const pHunger = (player && player.hunger !== undefined) ? player.hunger : 20;
                if (pHunger <= 6) {
                    hungerBar.classList.add('mc-shaking');
                } else {
                    hungerBar.classList.remove('mc-shaking');
                }
                const maxFoodIcons = 10;
                let foodHtml = '';
                const hasHungerEffect = player && player.hungerEffectTimer > 0;
                for (let i = 0; i < maxFoodIcons; i++) {
                    const iconVal = (i + 1) * 2;
                    let foodImg = 'food_empty.png';
                    if (pHunger >= iconVal) {
                        foodImg = 'food_full.png';
                    } else if (pHunger >= iconVal - 1) {
                        foodImg = 'food_half.png';
                    }
                    const lowHungerShake = (pHunger <= 6 && Math.random() > 0.6) ? 'transform: translateY(-2px);' : '';
                    const effectFilter = hasHungerEffect ? 'filter: hue-rotate(65deg) saturate(1.4);' : '';
                    foodHtml += `<img src="assets/mc/hud/${foodImg}" class="mc-food" style="${lowHungerShake} ${effectFilter}" />`;
                }
                hungerBar.innerHTML = foodHtml;
            }
        }

        // 5. Offhand HUD Slot (displayed next to hotbar when holding an offhand item)
        const offhandHud = document.getElementById('mc-hotbar-offhand');
        if (offhandHud) {
            if (player && player.inventory && player.inventory.offhand) {
                offhandHud.classList.remove('hidden');
                this.renderSlotItem(offhandHud, player.inventory.offhand);
            } else {
                offhandHud.classList.add('hidden');
                offhandHud.innerHTML = '';
            }
        }

        // Dynamic compass and clock refresh in hotbar HUD
        if (player && player.inventory) {
            if (!this._lastHudCompassTick || performance.now() - this._lastHudCompassTick > 150) {
                this._lastHudCompassTick = performance.now();
                if (this.elements.mainHotbar) {
                    for (let i = 0; i < 9; i++) {
                        const s = player.inventory.slots[i];
                        if (s && s.item && (s.item.subtype === 'compass' || s.item.subtype === 'clock')) {
                            const el = this.elements.mainHotbar.children[i];
                            if (el) this.renderSlotItem(el, s);
                        }
                    }
                }
                if (player.inventory.offhand && (player.inventory.offhand.item.subtype === 'compass' || player.inventory.offhand.item.subtype === 'clock')) {
                    const offhandHud = document.getElementById('mc-hotbar-offhand');
                    if (offhandHud) this.renderSlotItem(offhandHud, player.inventory.offhand);
                }
            }
        }

        // Hide mana bar in spectator mode
        const manaContainer = document.getElementById('mc-mana-container');
        if (manaContainer && player && player.isSpectator) {
            manaContainer.style.display = 'none';
        }
    }

    renderGrid(container, slotsData, offsetIndex, player, type, forceUpdate = false) {
        if (!container) return;
        if (container.children.length !== slotsData.length) {
            container.innerHTML = '';
            for (let i = 0; i < slotsData.length; i++) {
                const el = document.createElement('div');
                el.className = 'inv-slot';
                const actualIndex = offsetIndex + i;
                el._slotInfo = { type, index: actualIndex };
                
                el.onmousedown = (e) => this.onSlotMouseDown(e, type, actualIndex);
                el.onmouseenter = (e) => this.onSlotEnter(e, type, actualIndex);
                el.onmouseleave = () => this.onSlotLeave();
                el.onmouseup = (e) => this.onSlotMouseUp(e, type, actualIndex);

                container.appendChild(el);
            }
        }

        for (let i = 0; i < slotsData.length; i++) {
            const el = container.children[i];
            const actualIndex = offsetIndex + i;
            el._slotInfo = { type, index: actualIndex };
            const slot = slotsData[i];
            
            if (type === 'inventory' && actualIndex === player.selectedSlot) el.classList.add('active');
            else el.classList.remove('active');

            if (this.dragState.isDragging && this.dragState.sourceType === type && this.dragState.sourceIndex === actualIndex) {
                el.style.opacity = '0.3';
            } else {
                el.style.opacity = '1.0';
            }

            this.renderSlotItem(el, slot, forceUpdate);
        }
    }

    renderWandConfig(wandItem) {
        if (!wandItem || !wandItem.data || !wandItem.data.wand) return;
        const wand = wandItem.data.wand;
        
        // Build array of slots [{item: spell, count: 1}] to reuse renderGrid
        const slotsData = wand.spellSlots.map(obj => {
            if (!obj) return null;
            let wrapped = obj;
            if (wrapped.type !== 'spell' && wrapped.type !== 'modifier') {
                const itemType = wrapped.rarity ? 'modifier' : 'spell';
                wrapped = { type: itemType, subtype: wrapped.type, name: wrapped.name, stackable: false, id: wrapped.id, data: { spell: wrapped, mod: wrapped } };
            }
            return { item: wrapped, count: 1 };
        });
        this.renderGrid(this.elements.wandSlotsGrid, slotsData, 0, this.currentPlayer, 'wand');
    }

    renderSlotItem(el, slot, forceUpdate) {
        if (!slot) {
            if (el._cacheKey !== 'empty') {
                el._cacheKey = 'empty';
                el.innerHTML = '';
            }
            return;
        }
        const itm = (slot && slot.item) ? slot.item : slot;
        const cnt = (slot && slot.count !== undefined) ? slot.count : 1;
        const itemId = itm.id || `${itm.type || 'item'}_${itm.subtype || 'none'}`;
        let cacheKey = `${itemId}_${cnt}`;
        if (itm.subtype === 'compass') {
            let angle = 0;
            if (this.currentPlayer) {
                const spawn = this.currentPlayer.spawnPoint || { x: 0, y: 64, z: 0 };
                const dx = spawn.x - this.currentPlayer.position.x;
                const dz = spawn.z - this.currentPlayer.position.z;
                angle = Math.atan2(dx, dz) - (this.currentPlayer.rotation ? this.currentPlayer.rotation.yaw : 0);
            }
            const qAngle = Math.round((angle || 0) * 8);
            cacheKey += `_${qAngle}`;
        } else if (itm.subtype === 'clock') {
            const time = (window.game && window.game.lighting) ? window.game.lighting.timeOfDay : 0.5;
            const qTime = Math.round((time || 0) * 32);
            cacheKey += `_${qTime}`;
        }
        if (!forceUpdate && el._cacheKey === cacheKey) return;
        el._cacheKey = cacheKey;
        if (itm) {
            let inner = '';
            if (itm.type === 'block' && this.atlas) {
                // Use the 3D isometric icon canvas
                const iconCanvas = this.atlas.getBlockIcon(itm.subtype);
                const dataURL = iconCanvas.toDataURL();
                inner = `<img src="${dataURL}" class="item-icon" draggable="false" style="image-rendering:pixelated;width:76%;height:76%;object-fit:contain;" />`;
            } else {
                let cvs;
                const updateImg = (canvas) => {
                    if (el._cacheKey === cacheKey) {
                        const img = el.querySelector('img.item-icon');
                        if (img) img.src = canvas.toDataURL();
                    }
                };
                if (itm.subtype === 'compass') {
                    let angle = 0;
                    if (this.currentPlayer) {
                        const spawn = this.currentPlayer.spawnPoint || { x: 0, y: 64, z: 0 };
                        const dx = spawn.x - this.currentPlayer.position.x;
                        const dz = spawn.z - this.currentPlayer.position.z;
                        angle = Math.atan2(dx, dz) - (this.currentPlayer.rotation ? this.currentPlayer.rotation.yaw : 0);
                    }
                    cvs = drawDynamicCompassCanvas(angle);
                } else if (itm.subtype === 'clock') {
                    const time = (window.game && window.game.lighting) ? window.game.lighting.timeOfDay : 0.5;
                    cvs = drawDynamicClockCanvas(time);
                } else if (itm.type === 'wand') cvs = generateItemTexture('wand', itm.subtype || 'wand_basic', updateImg);
                else if (itm.type === 'spell') cvs = generateItemTexture('spell', (itm.data && itm.data.spell && itm.data.spell.element) || 'spell_basic', updateImg);
                else if (itm.type === 'material') cvs = generateItemTexture('material', itm.subtype, updateImg);
                else if (itm.type === 'equipment') cvs = generateItemTexture('equipment', itm.subtype, updateImg);
                else if (itm.type === 'modifier') cvs = generateItemTexture('modifier', itm.subtype, updateImg);
                else if (itm.type === 'food') cvs = generateItemTexture('food', itm.subtype, updateImg);
                else if (itm.type === 'spawn_egg') cvs = generateItemTexture('spawn_egg', itm.subtype, updateImg);
                
                if (cvs) {
                    inner = `<img src="${cvs.toDataURL()}" class="item-icon" draggable="false" style="image-rendering: pixelated; width: 76%; height: 76%; object-fit: contain;" />`;
                } else {
                    inner = `<div style="text-align:center; line-height:100%;">${(itm.name || 'IT').substring(0,2).toUpperCase()}</div>`;
                }
            }
            if (cnt > 1) inner += `<span class="item-count">${cnt}</span>`;
            el.innerHTML = inner;
        } else {
            el.innerHTML = '';
        }
    }

    // =============================
    // Slot Data Helpers
    // =============================
    _getSlotData(lType, idx) {
        if (!this.currentPlayer && window.game) this.currentPlayer = window.game.player;
        if (!this.currentPlayer || !this.currentPlayer.inventory) return null;
        const inv = this.currentPlayer.inventory.slots;
        if (lType === 'inventory') return inv[idx];
        if (lType === 'offhand') return this.currentPlayer.inventory.offhand;
        if (lType === 'armor') return idx === -1 ? this.currentPlayer.inventory.offhand : this.currentPlayer.inventory.armor[idx];
        if (lType === 'crafting') return this.craftingSlots[idx];
        if (lType === 'crafting_output') return this._matchRecipe();
        if (lType === 'chest') return this.chestInventory ? this.chestInventory[idx] : null;
        if (lType === 'stonecutter') return this.stonecutterSlot;
        if (lType === 'furnace') {
            if (!this.furnaceData) return null;
            return idx === 0 ? this.furnaceData.input : (idx === 1 ? this.furnaceData.fuel : this.furnaceData.output);
        }
        if (lType === 'wand') {
            const w = inv[this.currentPlayer.selectedSlot];
            if (!w || w.item.type !== 'wand') return null;
            const obj = w.item.data.wand.spellSlots[idx];
            if (!obj) return null;
            let wrapped = obj;
            if (wrapped.type !== 'spell' && wrapped.type !== 'modifier') {
                const itemType = wrapped.rarity ? 'modifier' : 'spell';
                wrapped = { type: itemType, subtype: wrapped.type, name: wrapped.name, stackable: false, id: wrapped.id, data: { spell: wrapped, mod: wrapped } };
            }
            return { item: wrapped, count: 1 };
        }
        return null;
    }

    _setSlotData(lType, idx, val) {
        if (!this.currentPlayer && window.game) this.currentPlayer = window.game.player;
        if (!this.currentPlayer || !this.currentPlayer.inventory) return;
        const inv = this.currentPlayer.inventory.slots;
        if (lType === 'creative') return;
        if (lType === 'inventory') inv[idx] = val;
        else if (lType === 'offhand') this.currentPlayer.inventory.offhand = val;
        else if (lType === 'armor') {
            if (idx === -1) this.currentPlayer.inventory.offhand = val;
            else this.currentPlayer.inventory.armor[idx] = val;
        }
        else if (lType === 'crafting') this.craftingSlots[idx] = val;
        else if (lType === 'chest' && this.chestInventory) this.chestInventory[idx] = val;
        else if (lType === 'stonecutter') {
            this.stonecutterSlot = val;
            this._renderStonecutter();
        }
        else if (lType === 'furnace' && this.furnaceData) {
            if (idx === 0) this.furnaceData.input = val;
            else if (idx === 1) this.furnaceData.fuel = val;
            else if (idx === 2) this.furnaceData.output = val;
        }
        else if (lType === 'wand') {
            const w = inv[this.currentPlayer.selectedSlot];
            if (w && w.item.type === 'wand') {
                w.item.data.wand.spellSlots[idx] = val ? val.item : null;
            }
        }
    }

    // =============================
    // Shift-Click Quick Transfer
    // =============================
    _handleShiftClick(type, index, slot) {
        if (!this.currentPlayer && window.game) this.currentPlayer = window.game.player;
        if (!slot || !slot.item || !this.currentPlayer || !this.currentPlayer.inventory) return;
        const inv = this.currentPlayer.inventory;
        const B = (typeof BLOCKS !== 'undefined') ? BLOCKS : window.BLOCKS;

        if (type === 'crafting_output') {
            let craftedAny = false;
            while (true) {
                const res = this._matchRecipe();
                if (!res) break;
                const added = inv.addItem(res.item, res.count);
                if (!added) break; // Inventory full
                this._consumeCraftingSlots();
                craftedAny = true;
            }
            if (craftedAny) {
                this._updateCraftingSlots();
                this._updateCraftingOutput();
                this._updateInventory();
                if (window.game && window.game.audio) window.game.audio.playClick();
            }
            return;
        }

        if (type === 'inventory') {
            // 1. If chest is open, quick-move to chest
            if (this.chestInventory) {
                let moved = false;
                for (let i = 0; i < this.chestInventory.length; i++) {
                    const c = this.chestInventory[i];
                    if (c && c.item.type === slot.item.type && c.item.subtype === slot.item.subtype && c.item.stackable && c.count < c.item.maxStack) {
                        const canTake = Math.min(slot.count, c.item.maxStack - c.count);
                        c.count += canTake;
                        slot.count -= canTake;
                        if (slot.count <= 0) {
                            inv.slots[index] = null;
                            moved = true;
                            break;
                        }
                    }
                }
                if (slot.count > 0) {
                    for (let i = 0; i < this.chestInventory.length; i++) {
                        if (!this.chestInventory[i]) {
                            this.chestInventory[i] = slot;
                            inv.slots[index] = null;
                            moved = true;
                            break;
                        }
                    }
                }
                if (moved && window.game && window.game.audio) window.game.audio.playClick();
                this._updateInventory();
                this._updateChestSlots();
                return;
            }

            // 2. If furnace is open, quick-move to furnace input or fuel
            if (this.furnaceData) {
                const isFuel = (slot.item.subtype === 'coal' || slot.item.subtype === 'stick' || (B && (slot.item.subtype === B.PLANKS || slot.item.subtype === B.WOOD || slot.item.subtype === B.COAL_BLOCK)));
                const fKey = isFuel ? 'fuel' : 'input';
                const currentF = this.furnaceData[fKey];
                if (!currentF) {
                    this.furnaceData[fKey] = slot;
                    inv.slots[index] = null;
                } else if (currentF.item.type === slot.item.type && currentF.item.subtype === slot.item.subtype && currentF.count < currentF.item.maxStack) {
                    const canTake = Math.min(slot.count, currentF.item.maxStack - currentF.count);
                    currentF.count += canTake;
                    slot.count -= canTake;
                    if (slot.count <= 0) inv.slots[index] = null;
                }
                this._updateInventory();
                this._updateFurnaceSlots();
                if (window.game && window.game.audio) window.game.audio.playClick();
                return;
            }

            // 3. Armor auto-equip
            if (slot.item.type === 'equipment') {
                const sub = slot.item.subtype || '';
                let armorIdx = -1;
                if (sub.includes('helmet') || sub.includes('head') || sub.includes('cap')) armorIdx = 0;
                else if (sub.includes('chest') || sub.includes('tunic')) armorIdx = 1;
                else if (sub.includes('leg') || sub.includes('pants')) armorIdx = 2;
                else if (sub.includes('boot')) armorIdx = 3;

                if (armorIdx !== -1 && !inv.armor[armorIdx]) {
                    inv.armor[armorIdx] = slot;
                    inv.slots[index] = null;
                    this._updateInventory();
                    this._updateArmorSlots();
                    if (window.game && window.game.audio) window.game.audio.playClick();
                    return;
                }
            }

            // 4. Move between hotbar (0..8) and main inventory (9..35)
            const targetStart = (index < 9) ? 9 : 0;
            const targetEnd = (index < 9) ? 36 : 9;
            let moved = false;

            for (let i = targetStart; i < targetEnd; i++) {
                const targetSlot = inv.slots[i];
                if (targetSlot && targetSlot.item.type === slot.item.type && targetSlot.item.subtype === slot.item.subtype && targetSlot.item.stackable && targetSlot.count < targetSlot.item.maxStack) {
                    const canTake = Math.min(slot.count, targetSlot.item.maxStack - targetSlot.count);
                    targetSlot.count += canTake;
                    slot.count -= canTake;
                    if (slot.count <= 0) {
                        inv.slots[index] = null;
                        moved = true;
                        break;
                    }
                }
            }
            if (slot.count > 0) {
                for (let i = targetStart; i < targetEnd; i++) {
                    if (!inv.slots[i]) {
                        inv.slots[i] = slot;
                        inv.slots[index] = null;
                        moved = true;
                        break;
                    }
                }
            }
            if (moved && window.game && window.game.audio) window.game.audio.playClick();
            this._updateInventory();
            return;
        }

        // Chest/Furnace/Crafting/Armor/Offhand to Inventory
        if (type === 'chest' || type === 'furnace' || type === 'crafting' || type === 'armor' || type === 'offhand') {
            const addedCount = inv.addItemCount ? inv.addItemCount(slot.item, slot.count) : (inv.addItem(slot.item, slot.count) ? slot.count : 0);
            if (addedCount > 0) {
                slot.count -= addedCount;
                if (slot.count <= 0) {
                    this._setSlotData(type, index, null);
                }
                if (type === 'crafting') {
                    this._updateCraftingSlots();
                    this._updateCraftingOutput();
                }
                this._updateInventory();
                this._updateArmorSlots();
                this._updateFurnaceSlots();
                this._updateChestSlots();
                if (window.game && window.game.audio) window.game.audio.playClick();
            }
        }
    }

    // =============================
    // Drag Crafting & Mouse Distribution
    // =============================
    _getSlotElement(type, index) {
        if (type === 'crafting') {
            const grid = document.getElementById('crafting-grid');
            return grid ? grid.children[index] : null;
        }
        if (type === 'inventory' || type === 'hotbar') {
            const totalIdx = (type === 'hotbar') ? index : index + 9;
            const slots = document.querySelectorAll('.inv-grid-section .inv-slot');
            return slots[totalIdx] || null;
        }
        if (type === 'armor') {
            const ARMOR_NAMES = ['head', 'chest', 'legs', 'boots'];
            return document.querySelector(`[data-slot="${ARMOR_NAMES[index]}"]`);
        }
        if (type === 'offhand') return document.querySelector('.offhand-slot');
        if (type === 'furnace') {
            if (index === 0) return document.getElementById('furnace-input');
            if (index === 1) return document.getElementById('furnace-fuel');
            if (index === 2) return document.getElementById('furnace-output');
        }
        return null;
    }

    _canSlotAcceptDraggedItem(type, index) {
        if (!this.dragState.isDragging || !this.dragState.itemData) return false;
        if (type === 'crafting_output' || type === 'stonecutter_output') return false;
        if (type === 'furnace' && index === 2) return false;
        if (type === 'furnace' && index === 1) {
            if (!this.furnaceData) return false;
            const fs = this.dragState.itemData.item.subtype;
            const isFuelItem = (fs === 'coal' || fs === 'charcoal' || fs === 'stick' || fs === 'lava_bucket' || (typeof BLOCKS !== 'undefined' && (fs === BLOCKS.PLANKS || fs === BLOCKS.COAL_BLOCK || fs === BLOCKS.WOOD || fs === BLOCKS.CRAFTING_TABLE || fs === BLOCKS.BOOKSHELF || fs === BLOCKS.LADDER || fs === BLOCKS.FENCE || fs === BLOCKS.GATE || fs === BLOCKS.TRAPDOOR || (typeof fs === 'string' && (fs.includes('plank') || fs.includes('wood') || fs.includes('log') || fs.includes('fence'))))));
            if (!isFuelItem) return false;
        }
        if (type === 'armor') {
            const sub = (this.dragState.itemData.item.subtype || '').toLowerCase();
            if (index === 0 && !(sub.includes('helmet') || sub.includes('head') || sub.includes('cap'))) return false;
            if (index === 1 && !(sub.includes('chest') || sub.includes('tunic') || sub.includes('elytra'))) return false;
            if (index === 2 && !(sub.includes('leg') || sub.includes('pants'))) return false;
            if (index === 3 && !(sub.includes('boot'))) return false;
        }

        const existing = this._getSlotData(type, index);
        const held = this.dragState.itemData;
        if (existing && existing.item) {
            if (existing.item.type !== held.item.type || existing.item.subtype !== held.item.subtype || !held.item.stackable) {
                return false;
            }
            if (existing.count >= (existing.item.maxStack || 64)) return false;
        }
        return true;
    }

    _handleSlotDragEnter(arg1, arg2, arg3, arg4) {
        let e, type, index, el;
        if (typeof arg1 === 'string') {
            type = arg1;
            index = arg2;
            el = arg3;
        } else {
            e = arg1;
            type = arg2;
            index = arg3;
            el = arg4;
        }
        if (!el && e && e.currentTarget) el = e.currentTarget;
        if (!el) el = this._getSlotElement(type, index);

        if (!this._canSlotAcceptDraggedItem(type, index)) return;

        const start = this.dragDistribution.startSlot;
        if (start && !this.dragDistribution.active) {
            if (type !== start.type || index !== start.index) {
                this.dragDistribution.active = true;
                this._pendingClickAction = null;
                if (this._canSlotAcceptDraggedItem(start.type, start.index)) {
                    const startKey = `${start.type}_${start.index}`;
                    if (!this.dragDistribution.slots.has(startKey)) {
                        this.dragDistribution.slots.set(startKey, {
                            type: start.type,
                            index: start.index,
                            el: start.el,
                            originalCount: start.originalCount
                        });
                    }
                }
            }
        }

        if (!this.dragDistribution.active) return;

        const key = `${type}_${index}`;
        if (!this.dragDistribution.slots.has(key)) {
            const existing = this._getSlotData(type, index);
            this.dragDistribution.slots.set(key, {
                type,
                index,
                el,
                originalCount: existing ? existing.count : 0
            });
            this._updateDragDistributionPreview();
            if (window.game && window.game.audio) window.game.audio.playClick();
        }
    }

    _updateDragDistributionPreview() {
        if (!this.dragDistribution.active || !this.dragState.itemData) return;
        const totalItems = this.dragDistribution.startCount || this.dragState.itemData.count;
        const slotsArray = Array.from(this.dragDistribution.slots.values());
        const slotCount = slotsArray.length;
        if (slotCount === 0) return;

        const isRightClick = (this.dragDistribution.button === 2);
        const held = this.dragState.itemData;
        const maxStack = held.item.maxStack || 64;

        if (isRightClick) {
            const canGive = Math.min(totalItems, slotCount);
            const remaining = totalItems - canGive;

            slotsArray.forEach((info, idx) => {
                if (info.el) info.el.classList.add('drag-highlight');
                const willReceive = (idx < canGive) ? 1 : 0;
                info.itemsToAdd = willReceive;
                const previewCount = info.originalCount + willReceive;
                info.previewCount = previewCount;
                if (info.el) this._renderSlotCountPreview(info.el, held.item, previewCount);
            });
            this._updateDragIconCount(remaining);
        } else {
            const itemsPerSlot = Math.floor(totalItems / slotCount);
            let totalDistributed = 0;

            slotsArray.forEach(info => {
                if (info.el) info.el.classList.add('drag-highlight');
                const maxCanTake = Math.max(0, maxStack - info.originalCount);
                const add = Math.min(itemsPerSlot, maxCanTake);
                info.itemsToAdd = add;
                totalDistributed += add;
                const previewCount = info.originalCount + add;
                info.previewCount = previewCount;
                if (info.el) this._renderSlotCountPreview(info.el, held.item, previewCount);
            });
            const remaining = Math.max(0, totalItems - totalDistributed);
            this._updateDragIconCount(remaining);
        }
    }

    _renderSlotCountPreview(el, item, count) {
        if (!el) return;
        let countEl = el.querySelector('.item-count');
        if (count > 0) {
            if (!el.querySelector('.item-icon') && !el.querySelector('canvas') && !el.querySelector('img')) {
                this.renderSlotItem(el, { item, count }, true);
                return;
            }
            if (!countEl) {
                countEl = document.createElement('span');
                countEl.className = 'item-count';
                el.appendChild(countEl);
            }
            countEl.textContent = count > 1 ? count : '';
        }
    }

    _updateDragIconCount(count) {
        if (!this.elements.dragIcon) return;
        let countEl = this.elements.dragIcon.querySelector('.item-count');
        if (count > 0) {
            if (!countEl) {
                countEl = document.createElement('span');
                countEl.className = 'item-count';
                this.elements.dragIcon.appendChild(countEl);
            }
            countEl.textContent = count > 1 ? count : '';
            this.elements.dragIcon.style.opacity = '1.0';
        } else {
            if (countEl) countEl.textContent = '';
            this.elements.dragIcon.style.opacity = '0.35';
        }
    }

    _commitDragDistribution() {
        if (!this.dragState.itemData) {
            this._clearDragDistribution();
            return;
        }

        const held = this.dragState.itemData;
        const slotsArray = Array.from(this.dragDistribution.slots.values());
        let totalGiven = 0;

        for (const info of slotsArray) {
            const add = info.itemsToAdd || 0;
            if (add <= 0) continue;

            totalGiven += add;
            const targetSlot = this._getSlotData(info.type, info.index);

            if (!targetSlot) {
                this._setSlotData(info.type, info.index, {
                    item: Object.assign({}, held.item),
                    count: add
                });
            } else {
                targetSlot.count += add;
            }
        }

        held.count -= totalGiven;
        if (held.count <= 0) {
            this.dragState.isDragging = false;
            this.dragState.itemData = null;
            this.elements.dragIcon.classList.add('hidden');
        } else {
            this.renderSlotItem(this.elements.dragIcon, held, true);
        }

        this._clearDragDistribution();
        this._updateInventory();
        this._updateCraftingSlots();
        this._updateCraftingOutput();
        this._updateArmorSlots();
        this._updateFurnaceSlots();
        this._updateChestSlots();
        if (window.game && window.game.audio) window.game.audio.playClick();
    }

    _clearDragDistribution() {
        for (const info of this.dragDistribution.slots.values()) {
            if (info.el) info.el.classList.remove('drag-highlight');
        }
        if (this.dragDistribution.startSlot && this.dragDistribution.startSlot.el) {
            this.dragDistribution.startSlot.el.classList.remove('drag-highlight');
        }
        this.dragDistribution.active = false;
        this.dragDistribution.slots.clear();
        this.dragDistribution.startCount = 0;
        this.dragDistribution.startSlot = null;
        this.dragDistribution.button = -1;
        this._updateInventory();
        this._updateCraftingSlots();
        this._updateArmorSlots();
        this._updateFurnaceSlots();
        this._updateChestSlots();
    }

    _executeSingleClickPlacement(type, index, button) {
        const held = this.dragState.itemData;
        if (!held) return;
        if (type === 'crafting_output' || type === 'stonecutter_output') return;
        if (type === 'furnace' && index === 2) return;
        if (type === 'furnace' && index === 1) {
            const fs = held.item.subtype;
            const isFuelItem = (fs === 'coal' || fs === 'charcoal' || fs === 'stick' || fs === 'lava_bucket' || (typeof BLOCKS !== 'undefined' && (fs === BLOCKS.PLANKS || fs === BLOCKS.COAL_BLOCK || fs === BLOCKS.WOOD || fs === BLOCKS.CRAFTING_TABLE || fs === BLOCKS.BOOKSHELF || fs === BLOCKS.LADDER || fs === BLOCKS.FENCE || fs === BLOCKS.GATE || fs === BLOCKS.TRAPDOOR || (typeof fs === 'string' && (fs.includes('plank') || fs.includes('wood') || fs.includes('log') || fs.includes('fence'))))));
            if (!isFuelItem) return;
        }
        if (type === 'armor') {
            const sub = (held.item.subtype || '').toLowerCase();
            if (index === 0 && !(sub.includes('helmet') || sub.includes('head') || sub.includes('cap'))) return;
            if (index === 1 && !(sub.includes('chest') || sub.includes('tunic') || sub.includes('elytra'))) return;
            if (index === 2 && !(sub.includes('leg') || sub.includes('pants'))) return;
            if (index === 3 && !(sub.includes('boot'))) return;
        }
        const targetSlot = this._getSlotData(type, index);

        if (button === 2) {
            // Right click: deposit 1 item
            if (!targetSlot) {
                this._setSlotData(type, index, {
                    item: Object.assign({}, held.item),
                    count: 1
                });
                held.count -= 1;
            } else if (targetSlot.item.type === held.item.type && targetSlot.item.subtype === held.item.subtype && targetSlot.item.stackable && targetSlot.count < (targetSlot.item.maxStack || 64)) {
                targetSlot.count += 1;
                held.count -= 1;
            }
            if (held.count <= 0) {
                this.dragState.isDragging = false;
                this.dragState.itemData = null;
                this.elements.dragIcon.classList.add('hidden');
            } else {
                this.renderSlotItem(this.elements.dragIcon, held, true);
            }
        } else if (button === 0) {
            // Left click: deposit all, merge, or swap
            if (!targetSlot) {
                this._setSlotData(type, index, held);
                this.dragState.isDragging = false;
                this.dragState.itemData = null;
                this.elements.dragIcon.classList.add('hidden');
            } else if (targetSlot.item.type === held.item.type && targetSlot.item.subtype === held.item.subtype && targetSlot.item.stackable) {
                const maxSt = targetSlot.item.maxStack || 64;
                const canTake = Math.min(held.count, maxSt - targetSlot.count);
                if (canTake > 0) {
                    targetSlot.count += canTake;
                    held.count -= canTake;
                }
                if (held.count <= 0) {
                    this.dragState.isDragging = false;
                    this.dragState.itemData = null;
                    this.elements.dragIcon.classList.add('hidden');
                } else {
                    this.renderSlotItem(this.elements.dragIcon, held, true);
                }
            } else {
                // Swap
                this._setSlotData(type, index, held);
                this.dragState.itemData = targetSlot;
                this.renderSlotItem(this.elements.dragIcon, this.dragState.itemData, true);
            }
        }

        this._clearDragDistribution();
        this._updateInventory();
        this._updateCraftingSlots();
        this._updateCraftingOutput();
        this._updateArmorSlots();
        this._updateFurnaceSlots();
        this._updateChestSlots();
        if (window.game && window.game.audio) window.game.audio.playClick();
    }

    // --- Drag & Drop ---
    onSlotMouseDown(e, type, index) {
        if (!this.isOpen || (e.button !== 0 && e.button !== 2)) return;

        let slot = this._getSlotData(type, index);

        // Shift click handling (instant transfer)
        if (e.shiftKey) {
            this._handleShiftClick(type, index, slot);
            return;
        }

        // Crafting output click (craft 1)
        if (type === 'crafting_output') {
            const result = this._matchRecipe();
            if (result) {
                const inv = this.currentPlayer.inventory;
                if (!this.dragState.isDragging) {
                    this._consumeCraftingSlots();
                    this.dragState.isDragging = true;
                    this.dragState.sourceType = 'crafting_output';
                    this.dragState.sourceIndex = 0;
                    this.dragState.itemData = { item: Object.assign({}, result.item), count: result.count };
                    this.elements.dragIcon.classList.remove('hidden');
                    this.renderSlotItem(this.elements.dragIcon, this.dragState.itemData);
                    this.updateDragIconPos(e.clientX, e.clientY);
                } else if (this.dragState.itemData && this.dragState.itemData.item.type === result.item.type && this.dragState.itemData.item.subtype === result.item.subtype && this.dragState.itemData.count + result.count <= result.item.maxStack) {
                    this._consumeCraftingSlots();
                    this.dragState.itemData.count += result.count;
                    this.renderSlotItem(this.elements.dragIcon, this.dragState.itemData, true);
                }
                this._updateCraftingSlots();
                this._updateCraftingOutput();
                if (window.game && window.game.audio) window.game.audio.playClick();
            }
            return;
        }

        // CASE 1: Cursor ALREADY has an item (Click-to-place or start of drag)
        if (this.dragState.isDragging && this.dragState.itemData) {
            const held = this.dragState.itemData;
            this.dragDistribution.active = false;
            this.dragDistribution.button = e.button;
            this.dragDistribution.startCount = held.count;
            this.dragDistribution.slots.clear();
            this.dragDistribution.startSlot = {
                type,
                index,
                el: e.currentTarget,
                originalCount: slot ? slot.count : 0
            };

            this._pendingClickAction = {
                type,
                index,
                button: e.button,
                slot,
                heldCount: held.count
            };
            return;
        }

        // CASE 2: Cursor is EMPTY (Pick up item)
        if (slot && slot.item) {
            let takeCount = slot.count;
            if (e.button === 2 && slot.count > 1) {
                takeCount = Math.ceil(slot.count / 2);
                slot.count -= takeCount;
            } else {
                this._setSlotData(type, index, null);
            }

            this.dragState.isDragging = true;
            this.dragState.sourceType = type;
            this.dragState.sourceIndex = index;
            this.dragState.itemData = { item: Object.assign({}, slot.item), count: takeCount };

            // Crucial fix: Reset drag distribution completely on item pickup
            this.dragDistribution.active = false;
            this.dragDistribution.button = -1;
            this.dragDistribution.startCount = 0;
            this.dragDistribution.startSlot = null;
            this.dragDistribution.slots.clear();
            this._pendingClickAction = null;

            this.elements.dragIcon.classList.remove('hidden');
            this.renderSlotItem(this.elements.dragIcon, this.dragState.itemData, true);
            this.updateDragIconPos(e.clientX, e.clientY);
            this.elements.tooltip.classList.add('hidden');

            this._updateInventory();
            this._updateCraftingSlots();
            this._updateCraftingOutput();
            this._updateArmorSlots();
            this._updateFurnaceSlots();
            this._updateChestSlots();
            if (window.game && window.game.audio) window.game.audio.playClick();
        }
    }

    onMouseMove(e) {
        if (this.dragState.isDragging) {
            this.updateDragIconPos(e.clientX, e.clientY);

            if ((e.buttons & 1 || e.buttons & 2) && this.dragDistribution.startSlot) {
                const targetEl = document.elementFromPoint(e.clientX, e.clientY);
                const slotEl = targetEl ? targetEl.closest('.inv-slot') : null;
                if (slotEl && slotEl._slotInfo) {
                    this._handleSlotDragEnter(e, slotEl._slotInfo.type, slotEl._slotInfo.index, slotEl);
                }
            }
        } else if (this.isOpen && !this.elements.tooltip.classList.contains('hidden')) {
            this.elements.tooltip.style.left = (e.clientX + 15) + 'px';
            this.elements.tooltip.style.top = (e.clientY + 15) + 'px';
        }
    }

    updateDragIconPos(x, y) {
        this.elements.dragIcon.style.left = (x - 20) + 'px';
        this.elements.dragIcon.style.top = (y - 20) + 'px';
    }

    onMouseUp(e) {
        if (this.dragDistribution.active && this.dragDistribution.slots.size > 1) {
            this._commitDragDistribution();
            return;
        }
        if (this._pendingClickAction) {
            const act = this._pendingClickAction;
            this._pendingClickAction = null;
            this._executeSingleClickPlacement(act.type, act.index, act.button);
            return;
        }
        if (this.dragDistribution.active) {
            this._clearDragDistribution();
        }
    }

    cancelDrag() {
        if (this.dragState.isDragging && this.dragState.itemData) {
            const held = this.dragState.itemData;
            if (this.currentPlayer && this.currentPlayer.inventory) {
                const added = this.currentPlayer.inventory.addItem(held.item, held.count);
                const em = (window.game && window.game.entityManager) || this.currentPlayer.manager;
                if (!added && em) {
                    em.spawnItem(held.item, held.count, this.currentPlayer.position);
                }
            }
            this._updateInventory();
            this._updateCraftingSlots();
            this._updateArmorSlots();
            this._updateFurnaceSlots();
            this._updateChestSlots();
        }
        this._clearDragDistribution();
        this.dragState.isDragging = false;
        this.elements.dragIcon.classList.add('hidden');
        this.dragState.itemData = null;
        this.dragState.isSplit = false;
    }

    onSlotMouseUp(e, targetType, targetIndex) {
        if (this.dragDistribution.active && this.dragDistribution.slots.size > 1) {
            this._commitDragDistribution();
            return;
        }

        if (this._pendingClickAction) {
            const act = this._pendingClickAction;
            this._pendingClickAction = null;
            if (act.type === targetType && act.index === targetIndex) {
                this._executeSingleClickPlacement(act.type, act.index, act.button);
                return;
            }
        }
    }

    // --- Tooltips & Drag Enter ---
    onSlotEnter(e, type, index) {
        const el = e.currentTarget;
        this.hoveredSlot = { type, index, el };

        // Handle Drag Distribution (Drag Crafting)
        if (this.dragState.isDragging && (e.buttons & 1 || e.buttons & 2)) {
            this._handleSlotDragEnter(e, type, index, el);
            return;
        }

        if (this.dragState.isDragging || !this.isOpen) return;
        let slot = this._getSlotData(type, index);

        if (slot) {
            let html = `<strong style="color:#7c5cff; font-size:16px;">${slot.item.name}</strong><br/>`;
            if (slot.item.type === 'spell') {
                const sp = slot.item.data.spell || slot.item;
                html += `<span style="color:#aaa;">Element: ${sp.element || 'Arcane'}</span><br/>`;
                html += `<span style="color:#ff8844;">Damage: ${sp.baseDamage || 0}</span><br/>`;
                html += `<span style="color:#4488ff;">Mana: ${sp.baseManaCost || 0}</span><br/>`;
                if (sp.description) html += `<span style="color:#ccc; font-style:italic;">${sp.description}</span><br/>`;
            } else if (slot.item.type === 'wand') {
                const w = slot.item.data.wand;
                html += `<span style="color:#aaa;">Spell Slots: ${w.maxSlots}</span>`;
            } else if (slot.item.type === 'block') {
                html += `<span style="color:#aaa;">Block</span>`;
            } else if (slot.item.type === 'material') {
                html += `<span style="color:#aaa;">Material — used for crafting</span>`;
            } else if (slot.item.type === 'equipment') {
                const ed = slot.item.data.equipData || {};
                if (ed.protection) html += `<span style="color:#88aaff;">Protection: ${ed.protection}</span><br/>`;
                if (ed.mineSpeed && ed.mineSpeed > 1) html += `<span style="color:#ffaa44;">Mine Speed: ${ed.mineSpeed}x</span><br/>`;
                if (ed.chopSpeed && ed.chopSpeed > 1) html += `<span style="color:#a7c957;">Chop Speed: ${ed.chopSpeed}x</span><br/>`;
                if (ed.digSpeed && ed.digSpeed > 1) html += `<span style="color:#d4a373;">Dig Speed: ${ed.digSpeed}x</span><br/>`;
                if (ed.damage) html += `<span style="color:#ff6666;">Damage: ${ed.damage}</span><br/>`;
                if (ed.speedMult) html += `<span style="color:#44ff88;">Speed: ${ed.speedMult}x</span><br/>`;
                if (ed.flying) html += `<span style="color:#88ffff;">🕊 Can fly</span><br/>`;
                if (ed.passive) html += `<span style="color:#ffd166; font-weight:bold;">★ ${ed.passive}</span><br/>`;
                if (slot.item.description) html += `<span style="color:#aaa;">${slot.item.description}</span>`;
            } else if (slot.item.type === 'food') {
                html += `<span style="color:#aaa;">Food</span><br/><span style="color:#88ff88;">Restores hunger & health</span>`;
            } else if (slot.item.type === 'spawn_egg') {
                html += `<span style="color:#aaccff;">Spawn Egg</span><br/><span style="color:#aaa;">Right-click to spawn mob</span>`;
            }
            this.elements.tooltip.innerHTML = html;
            this.elements.tooltip.classList.remove('hidden');
            this.elements.tooltip.style.left = (e.clientX + 15) + 'px';
            this.elements.tooltip.style.top = (e.clientY + 15) + 'px';
        }
    }

    onSlotLeave() {
        this.hoveredSlot = null;
        this.elements.tooltip.classList.add('hidden');
    }

    // =============================
    // Keyboard Shortcuts (1-9 Swap & Q Drop)
    // =============================
    onKeyDown(e) {
        if (!this.isOpen) return;
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea') return;

        // Space: Autofill recipe
        if (e.code === 'Space') {
            const modalRecipeBook = document.getElementById('recipe-book-modal');
            if (modalRecipeBook && !modalRecipeBook.classList.contains('hidden')) {
                if (this.selectedRecipe) {
                    e.preventDefault();
                    this.autofillRecipe(this.selectedRecipe, e.shiftKey);
                }
            }
        }

        // Digits 1-9: Hotbar quick swap
        if (e.code.startsWith('Digit') && !e.ctrlKey && !e.altKey) {
            const num = parseInt(e.code.replace('Digit', ''), 10);
            if (num >= 1 && num <= 9 && this.hoveredSlot) {
                e.preventDefault();
                this.swapSlotWithHotbar(this.hoveredSlot, num - 1);
            }
        }

        // Key Q: Drop item into world
        if (e.code === 'KeyQ' && this.hoveredSlot) {
            e.preventDefault();
            this.dropHoveredSlotItem(this.hoveredSlot, e.ctrlKey);
        }
    }

    swapSlotWithHotbar(hoveredSlot, hotbarIdx) {
        if (!this.currentPlayer && window.game) this.currentPlayer = window.game.player;
        if (!hoveredSlot || !this.currentPlayer || !this.currentPlayer.inventory) return;
        const inv = this.currentPlayer.inventory.slots;
        if (hotbarIdx < 0 || hotbarIdx > 8) return;

        const srcType = hoveredSlot.type;
        const srcIndex = hoveredSlot.index;
        if (srcType === 'crafting_output' || srcType === 'stonecutter_output') return;
        if (srcType === 'furnace' && srcIndex === 2) return;

        const currentHotbarItem = inv[hotbarIdx];
        if (srcType === 'armor' && currentHotbarItem) {
            const sub = (currentHotbarItem.item?.subtype || '').toLowerCase();
            if (srcIndex === 0 && !(sub.includes('helmet') || sub.includes('head') || sub.includes('cap'))) return;
            if (srcIndex === 1 && !(sub.includes('chest') || sub.includes('tunic') || sub.includes('elytra'))) return;
            if (srcIndex === 2 && !(sub.includes('leg') || sub.includes('pants'))) return;
            if (srcIndex === 3 && !(sub.includes('boot'))) return;
        }
        if (srcType === 'furnace' && srcIndex === 1 && currentHotbarItem) {
            const fs = currentHotbarItem.item?.subtype;
            const isFuelItem = (fs === 'coal' || fs === 'charcoal' || fs === 'stick' || fs === 'lava_bucket' || (typeof BLOCKS !== 'undefined' && (fs === BLOCKS.PLANKS || fs === BLOCKS.COAL_BLOCK || fs === BLOCKS.WOOD || fs === BLOCKS.CRAFTING_TABLE || fs === BLOCKS.BOOKSHELF || fs === BLOCKS.LADDER || fs === BLOCKS.FENCE || fs === BLOCKS.GATE || fs === BLOCKS.TRAPDOOR || (typeof fs === 'string' && (fs.includes('plank') || fs.includes('wood') || fs.includes('log') || fs.includes('fence'))))));
            if (!isFuelItem) return;
        }

        const currentTargetItem = this._getSlotData(srcType, srcIndex);

        this._setSlotData(srcType, srcIndex, currentHotbarItem);
        inv[hotbarIdx] = currentTargetItem;

        this._updateInventory();
        this._updateCraftingSlots();
        this._updateCraftingOutput();
        this._updateArmorSlots();
        this._updateFurnaceSlots();
        this._updateChestSlots();
        if (window.game && window.game.audio) window.game.audio.playClick();
    }

    dropHoveredSlotItem(hoveredSlot, dropStack = false) {
        if (!this.currentPlayer && window.game) this.currentPlayer = window.game.player;
        if (!hoveredSlot || !this.currentPlayer) return;

        const p = this.currentPlayer;
        const lookDir = p.getLookDirection ? p.getLookDirection() : new THREE.Vector3(0, 0, -1);
        const eyePos = p.getEyePosition ? p.getEyePosition() : p.position.clone().add(new THREE.Vector3(0, 1.6, 0));
        const dropPos = eyePos.clone().add(lookDir.clone().multiplyScalar(0.5));
        const velocity = lookDir.clone().multiplyScalar(8);
        const em = (window.game && window.game.entityManager) || p.manager;

        // If hovering over crafting or stonecutter output, actually consume the recipe ingredients before dropping!
        if (hoveredSlot.type === 'crafting_output' || hoveredSlot.type === 'stonecutter_output') {
            const res = (hoveredSlot.type === 'crafting_output') ? this._matchRecipe() : this._getSlotData('stonecutter_output', 0);
            if (!res || !res.item) return;
            const dropCount = dropStack ? res.count : 1;
            if (hoveredSlot.type === 'crafting_output') {
                this._consumeCraftingSlots(res);
                this._updateCraftingSlots();
                this._updateCraftingOutput();
            } else {
                this._setSlotData('stonecutter_output', 0, null);
            }
            if (em) em.spawnItem(res.item, dropCount, dropPos, velocity);
            if (window.game && window.game.audio) window.game.audio.playClick();
            this._updateInventory();
            return;
        }

        const slotData = this._getSlotData(hoveredSlot.type, hoveredSlot.index);
        if (!slotData || !slotData.item || slotData.count <= 0) return;

        const dropCount = dropStack ? slotData.count : 1;
        slotData.count -= dropCount;
        if (slotData.count <= 0) {
            this._setSlotData(hoveredSlot.type, hoveredSlot.index, null);
        }

        if (em) {
            em.spawnItem(slotData.item, dropCount, dropPos, velocity);
        }
        if (window.game && window.game.audio) window.game.audio.playClick();

        this._updateInventory();
        this._updateCraftingSlots();
        this._updateCraftingOutput();
        this._updateArmorSlots();
        this._updateFurnaceSlots();
        this._updateChestSlots();
    }

    dropCursorItem(dropStack = false) {
        if (!this.currentPlayer && window.game) this.currentPlayer = window.game.player;
        if (!this.dragState.isDragging || !this.dragState.itemData || !this.currentPlayer) return;
        const held = this.dragState.itemData;
        const dropCount = dropStack ? held.count : 1;
        held.count -= dropCount;

        const p = this.currentPlayer;
        const lookDir = p.getLookDirection ? p.getLookDirection() : new THREE.Vector3(0, 0, -1);
        const eyePos = p.getEyePosition ? p.getEyePosition() : p.position.clone().add(new THREE.Vector3(0, 1.6, 0));
        const dropPos = eyePos.clone().add(lookDir.clone().multiplyScalar(0.5));
        const velocity = lookDir.clone().multiplyScalar(8);

        if (window.game && window.game.entityManager) {
            window.game.entityManager.spawnItem(held.item, dropCount, dropPos, velocity);
        }
        if (window.game && window.game.audio) window.game.audio.playClick();

        if (held.count <= 0) {
            this.dragState.isDragging = false;
            this.dragState.itemData = null;
            this.elements.dragIcon.classList.add('hidden');
        } else {
            this.renderSlotItem(this.elements.dragIcon, this.dragState.itemData, true);
        }
    }

    // =============================
    // Recipe Autofill
    // =============================
    autofillRecipe(recipe, shiftMax = false) {
        if (!this.currentPlayer && window.game) this.currentPlayer = window.game.player;
        if (!recipe || !this.currentPlayer || !this.currentPlayer.inventory) return;
        const inv = this.currentPlayer.inventory;
        const B = (typeof BLOCKS !== 'undefined') ? BLOCKS : window.BLOCKS;

        const statusEl = document.getElementById('recipe-autofill-status');
        const setStatus = (msg, isError = false) => {
            if (statusEl) {
                statusEl.textContent = msg;
                statusEl.style.color = isError ? '#cc2222' : '#2e7d32';
            }
        };

        if (recipe.needs3x3 && !this.is3x3Crafting) {
            setStatus("★ Requires Crafting Table (3x3 Grid)", true);
            if (window.game && window.game.audio) window.game.audio.playClick();
            return;
        }

        let targetSlots = new Array(9).fill(null);
        if (this.is3x3Crafting) {
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    targetSlots[r * 3 + c] = recipe.grid[r] ? recipe.grid[r][c] : null;
                }
            }
        } else {
            let minX = 2, maxX = 0, minY = 2, maxY = 0;
            let hasItem = false;
            for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                    if (recipe.grid[y] && recipe.grid[y][x]) {
                        hasItem = true;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            if (!hasItem) return;
            if ((maxX - minX > 1) || (maxY - minY > 1)) {
                setStatus("★ Recipe cannot fit into 2x2 grid", true);
                return;
            }
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const targetIdx = (y - minY) * 2 + (x - minX);
                    targetSlots[targetIdx] = recipe.grid[y] ? recipe.grid[y][x] : null;
                }
            }
        }

        const isPlank = (t) => B && [
            B.PLANKS, B.ACACIA_PLANKS, B.CHERRY_PLANKS, B.AUTUMN_PLANKS, B.PALM_PLANKS,
            B.PINE_PLANKS, B.CRIMSON_PLANKS, B.DARK_OAK_PLANKS, B.BIRCH_PLANKS, B.MANGROVE_PLANKS,
            B.MAGIC_PLANKS, B.REDWOOD_PLANKS, B.WARPED_PLANKS, B.GOLDEN_OAK_PLANKS, B.AETHER_PLANKS
        ].includes(t);

        const isLog = (t) => B && [
            B.WOOD, B.ACACIA_WOOD, B.CHERRY_LOG, B.AUTUMN_WOOD, B.PALM_WOOD,
            B.JUNGLE_LOG, B.PINE_WOOD, B.CRIMSON_STEM, B.DARK_OAK_WOOD, B.BIRCH_WOOD,
            B.MANGROVE_LOG, B.MAGIC_WOOD, B.REDWOOD_LOG, B.WARPED_STEM, B.GOLDEN_OAK_WOOD,
            B.ENCHANTED_AETHER_LOG, B.AETHER_WOOD
        ].includes(t);

        const matchesReq = (item, req) => {
            if (!item || !req) return false;
            if (req.subtype === (B && B.PLANKS)) {
                return item.type === 'block' && isPlank(item.subtype);
            }
            if (req.subtype === (B && B.WOOD)) {
                return item.type === 'block' && isLog(item.subtype);
            }
            if (req.subtype === (B && B.COBBLESTONE)) {
                return item.type === 'block' && (item.subtype === B.COBBLESTONE || item.subtype === B.MOSSY_COBBLESTONE);
            }
            return item.type === req.type && item.subtype === req.subtype;
        };

        // Return existing crafting items to inventory
        for (let i = 0; i < 9; i++) {
            if (this.craftingSlots[i]) {
                const added = inv.addItem(this.craftingSlots[i].item, this.craftingSlots[i].count);
                const em = (window.game && window.game.entityManager) || this.currentPlayer.manager;
                if (!added && em) {
                    em.spawnItem(this.craftingSlots[i].item, this.craftingSlots[i].count, this.currentPlayer.position);
                }
                this.craftingSlots[i] = null;
            }
        }

        const requiredReqs = [];
        for (let i = 0; i < 9; i++) {
            if (targetSlots[i]) requiredReqs.push({ slotIndex: i, req: targetSlots[i] });
        }

        if (requiredReqs.length === 0) return;

        let canFulfill = true;
        const missingList = [];
        const usedCounts = new Map();

        for (const { req } of requiredReqs) {
            let found = false;
            for (let invIdx = 0; invIdx < inv.slots.length; invIdx++) {
                const invSlot = inv.slots[invIdx];
                if (!invSlot || !invSlot.item) continue;
                const alreadyUsed = usedCounts.get(invIdx) || 0;
                const available = invSlot.count - alreadyUsed;
                if (available > 0 && matchesReq(invSlot.item, req)) {
                    usedCounts.set(invIdx, alreadyUsed + 1);
                    found = true;
                    break;
                }
            }
            if (!found) {
                canFulfill = false;
                const reqName = (req.subtype ? String(req.subtype).replace(/_/g, ' ') : 'Item');
                if (!missingList.includes(reqName)) missingList.push(reqName);
            }
        }

        if (!canFulfill) {
            setStatus(`Missing: ${missingList.join(', ')}`, true);
            if (window.game && window.game.audio) window.game.audio.playClick();
            return;
        }

        let craftsCount = 1;
        if (shiftMax) {
            let maxPossible = 64;
            for (const { req } of requiredReqs) {
                let totalInInv = 0;
                for (const s of inv.slots) {
                    if (s && s.item && matchesReq(s.item, req)) totalInInv += s.count;
                }
                const occurrences = requiredReqs.filter(r => matchesReq({ type: r.req.type, subtype: r.req.subtype }, req)).length;
                const possibleForThis = Math.floor(totalInInv / occurrences);
                if (possibleForThis < maxPossible) maxPossible = possibleForThis;
            }
            craftsCount = Math.max(1, Math.min(64, maxPossible));
        }

        for (const { slotIndex, req } of requiredReqs) {
            let needed = craftsCount;
            let placedItem = null;
            for (let invIdx = 0; invIdx < inv.slots.length; invIdx++) {
                const invSlot = inv.slots[invIdx];
                if (!invSlot || !invSlot.item) continue;
                if (matchesReq(invSlot.item, req)) {
                    const take = Math.min(needed, invSlot.count);
                    invSlot.count -= take;
                    placedItem = invSlot.item;
                    needed -= take;
                    if (invSlot.count <= 0) inv.slots[invIdx] = null;
                    if (needed <= 0) break;
                }
            }
            this.craftingSlots[slotIndex] = {
                item: placedItem || { type: req.type, subtype: req.subtype, name: req.subtype, stackable: true, maxStack: 64 },
                count: craftsCount
            };
        }

        this._updateCraftingSlots();
        this._updateInventory();
        this._matchRecipe();
        this._updateCraftingOutput();

        setStatus(`✓ Autofilled: ${recipe.name}${craftsCount > 1 ? ' (x' + craftsCount + ')' : ''}!`);
        if (window.game && window.game.audio) window.game.audio.playClick();
    }

    // =============================
    // Crafting Grid
    // =============================
    _updateCraftingUILayout() {
        const grid = this.elements.craftingGrid;
        if (!grid) return;
        
        if (this.is3x3Crafting) {
            grid.style.gridTemplateColumns = 'repeat(3, 40px)';
            grid.style.gridTemplateRows = 'repeat(3, 40px)';
            if (this.elements.survivalTopPanel) {
                this.elements.survivalTopPanel.classList.add('crafting-table-mode');
            }
            for (let i = 0; i < 9; i++) {
                if (grid.children[i]) grid.children[i].style.display = 'flex';
            }
        } else {
            grid.style.gridTemplateColumns = 'repeat(2, 40px)';
            grid.style.gridTemplateRows = 'repeat(2, 40px)';
            if (this.elements.survivalTopPanel) {
                this.elements.survivalTopPanel.classList.remove('crafting-table-mode');
            }
            for (let i = 0; i < 9; i++) {
                if (!grid.children[i]) continue;
                if (i < 4) grid.children[i].style.display = 'flex';
                else grid.children[i].style.display = 'none';
                
                // If switching to 2x2, drop items in hidden slots
                if (i >= 4 && this.craftingSlots[i]) {
                    if (this.currentPlayer) {
                        const added = this.currentPlayer.inventory.addItem(this.craftingSlots[i].item, this.craftingSlots[i].count);
                        const em = (window.game && window.game.entityManager) || this.currentPlayer.manager;
                        if (!added && em) {
                            em.spawnItem(this.craftingSlots[i].item, this.craftingSlots[i].count, this.currentPlayer.position);
                        }
                    }
                    this.craftingSlots[i] = null;
                }
            }
        }
        this._matchRecipe(); // refresh
    }

    _initCraftingGrid() {
        const grid = this.elements.craftingGrid;
        if (!grid) return;
        grid.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const el = document.createElement('div');
            el.className = 'inv-slot';
            el._slotInfo = { type: 'crafting', index: i };
            el.onmousedown = (e) => this.onSlotMouseDown(e, 'crafting', i);
            el.onmouseup = (e) => this.onSlotMouseUp(e, 'crafting', i);
            el.onmouseenter = (e) => this.onSlotEnter(e, 'crafting', i);
            el.onmouseleave = () => this.onSlotLeave();
            grid.appendChild(el);
        }
        this._updateCraftingUILayout();

        const out = this.elements.craftingOutput;
        if (out) {
            out._slotInfo = { type: 'crafting_output', index: 0 };
            out.onmousedown = (e) => this.onSlotMouseDown(e, 'crafting_output', 0);
            out.onmouseup = (e) => this.onSlotMouseUp(e, 'crafting_output', 0);
            out.onmouseenter = (e) => this.onSlotEnter(e, 'crafting_output', 0);
            out.onmouseleave = () => this.onSlotLeave();
        }
    }

    _initArmorSlots() {
        // Find all armor/offhand slots in the DOM and wire them up
        const ARMOR_NAMES = ['head', 'chest', 'legs', 'boots'];
        ARMOR_NAMES.forEach((slotName, i) => {
            const el = document.querySelector(`[data-slot="${slotName}"]`);
            if (!el) return;
            el._slotInfo = { type: 'armor', index: i };
            el.onmousedown = (e) => this.onSlotMouseDown(e, 'armor', i);
            el.onmouseup = (e) => this.onSlotMouseUp(e, 'armor', i);
            el.onmouseenter = (e) => this.onSlotEnter(e, 'armor', i);
            el.onmouseleave = () => this.onSlotLeave();
        });

        const offhandEl = document.querySelector('.offhand-slot');
        if (offhandEl) {
            offhandEl._slotInfo = { type: 'offhand', index: 0 };
            offhandEl.onmousedown = (e) => this.onSlotMouseDown(e, 'offhand', 0);
            offhandEl.onmouseup = (e) => this.onSlotMouseUp(e, 'offhand', 0);
            offhandEl.onmouseenter = (e) => this.onSlotEnter(e, 'offhand', 0);
            offhandEl.onmouseleave = () => this.onSlotLeave();
        }
    }

    _initFurnaceSlots() {
        if (this.elements.furnaceInput) {
            this.elements.furnaceInput._slotInfo = { type: 'furnace', index: 0 };
            this.elements.furnaceInput.onmousedown = (e) => this.onSlotMouseDown(e, 'furnace', 0);
            this.elements.furnaceInput.onmouseup = (e) => this.onSlotMouseUp(e, 'furnace', 0);
            this.elements.furnaceInput.onmouseenter = (e) => this.onSlotEnter(e, 'furnace', 0);
            this.elements.furnaceInput.onmouseleave = () => this.onSlotLeave();
        }
        if (this.elements.furnaceFuel) {
            this.elements.furnaceFuel._slotInfo = { type: 'furnace', index: 1 };
            this.elements.furnaceFuel.onmousedown = (e) => this.onSlotMouseDown(e, 'furnace', 1);
            this.elements.furnaceFuel.onmouseup = (e) => this.onSlotMouseUp(e, 'furnace', 1);
            this.elements.furnaceFuel.onmouseenter = (e) => this.onSlotEnter(e, 'furnace', 1);
            this.elements.furnaceFuel.onmouseleave = () => this.onSlotLeave();
        }
        if (this.elements.furnaceOutput) {
            this.elements.furnaceOutput._slotInfo = { type: 'furnace', index: 2 };
            this.elements.furnaceOutput.onmousedown = (e) => this.onSlotMouseDown(e, 'furnace', 2);
            this.elements.furnaceOutput.onmouseup = (e) => this.onSlotMouseUp(e, 'furnace', 2);
            this.elements.furnaceOutput.onmouseenter = (e) => this.onSlotEnter(e, 'furnace', 2);
            this.elements.furnaceOutput.onmouseleave = () => this.onSlotLeave();
        }
    }

    _initStonecutterSlots() {
        if (this.elements.stonecutterInput) {
            this.elements.stonecutterInput._slotInfo = { type: 'stonecutter', index: 0 };
            this.elements.stonecutterInput.onmousedown = (e) => this.onSlotMouseDown(e, 'stonecutter', 0);
            this.elements.stonecutterInput.onmouseup = (e) => this.onSlotMouseUp(e, 'stonecutter', 0);
            this.elements.stonecutterInput.onmouseenter = (e) => this.onSlotEnter(e, 'stonecutter', 0);
            this.elements.stonecutterInput.onmouseleave = () => this.onSlotLeave();
        }
        if (this.elements.stonecutterOutput) {
            this.elements.stonecutterOutput._slotInfo = { type: 'stonecutter_output', index: 0 };
            this.elements.stonecutterOutput.onmousedown = (e) => this.onSlotMouseDown(e, 'stonecutter_output', 0);
            this.elements.stonecutterOutput.onmouseup = (e) => this.onSlotMouseUp(e, 'stonecutter_output', 0);
            this.elements.stonecutterOutput.onmouseenter = (e) => this.onSlotEnter(e, 'stonecutter_output', 0);
            this.elements.stonecutterOutput.onmouseleave = () => this.onSlotLeave();
        }
    }

    _getStonecutterRecipes(blockId) {
        const B = (typeof BLOCKS !== 'undefined') ? BLOCKS : window.BLOCKS;
        if (!B) return [];
        const table = {
            [B.STONE]: [
                { block: B.STONE_SLAB, count: 2, name: 'Stone Slab' },
                { block: B.STONE_STAIRS, count: 1, name: 'Stone Stairs' },
                { block: B.STONE_BRICKS, count: 1, name: 'Stone Bricks' },
                { block: B.STONE_WALL, count: 1, name: 'Stone Wall' },
                { block: B.STONE_BRICK_WALL, count: 1, name: 'Stone Brick Wall' },
                { block: B.CHISELED_STONE_BRICKS, count: 1, name: 'Chiseled Stone Bricks' }
            ],
            [B.COBBLESTONE]: [
                { block: B.COBBLESTONE_SLAB, count: 2, name: 'Cobblestone Slab' },
                { block: B.COBBLESTONE_STAIRS, count: 1, name: 'Cobblestone Stairs' },
                { block: B.COBBLESTONE_WALL, count: 1, name: 'Cobblestone Wall' }
            ],
            [B.STONE_BRICKS]: [
                { block: B.STONE_BRICK_WALL, count: 1, name: 'Stone Brick Wall' },
                { block: B.CHISELED_STONE_BRICKS, count: 1, name: 'Chiseled Stone Bricks' },
                { block: B.STONE_SLAB, count: 2, name: 'Stone Slab' },
                { block: B.STONE_STAIRS, count: 1, name: 'Stone Stairs' }
            ],
            [B.MOSSY_COBBLESTONE]: [
                { block: B.MOSSY_COBBLESTONE_WALL, count: 1, name: 'Mossy Cobblestone Wall' }
            ],
            [B.SANDSTONE]: [
                { block: B.SANDSTONE_WALL, count: 1, name: 'Sandstone Wall' },
                { block: B.CHISELED_SANDSTONE, count: 1, name: 'Chiseled Sandstone' }
            ],
            [B.BLACKSTONE]: [
                { block: B.BLACKSTONE_WALL, count: 1, name: 'Blackstone Wall' },
                { block: B.POLISHED_BLACKSTONE, count: 1, name: 'Polished Blackstone' },
                { block: B.POLISHED_BLACKSTONE_BRICKS, count: 1, name: 'Polished Blackstone Bricks' },
                { block: B.CHISELED_POLISHED_BLACKSTONE, count: 1, name: 'Chiseled Polished Blackstone' }
            ],
            [B.POLISHED_BLACKSTONE]: [
                { block: B.POLISHED_BLACKSTONE_BRICKS, count: 1, name: 'Polished Blackstone Bricks' },
                { block: B.CHISELED_POLISHED_BLACKSTONE, count: 1, name: 'Chiseled Polished Blackstone' },
                { block: B.BLACKSTONE_WALL, count: 1, name: 'Blackstone Wall' }
            ],
            [B.POLISHED_BLACKSTONE_BRICKS]: [
                { block: B.CHISELED_POLISHED_BLACKSTONE, count: 1, name: 'Chiseled Polished Blackstone' },
                { block: B.BLACKSTONE_WALL, count: 1, name: 'Blackstone Wall' }
            ],
            [B.BRICKS]: [
                { block: B.BRICK_WALL, count: 1, name: 'Brick Wall' }
            ],
            [B.NETHER_BRICKS]: [
                { block: B.NETHER_BRICK_WALL, count: 1, name: 'Nether Brick Wall' },
                { block: B.CHISELED_NETHER_BRICKS, count: 1, name: 'Chiseled Nether Bricks' }
            ],
            [B.AETHER_HOLYSTONE]: [
                { block: B.HOLYSTONE_WALL, count: 1, name: 'Holystone Wall' }
            ]
        };
        return table[blockId] || [];
    }

    _renderStonecutter() {
        if (!this.elements.stonecutterInput || !this.elements.stonecutterOutput) return;
        this.renderSlotItem(this.elements.stonecutterInput, this.stonecutterSlot);
        this._updateStonecutterRecipes();
        this._updateStonecutterOutput();
    }

    _updateStonecutterRecipes() {
        const container = this.elements.stonecutterRecipesContainer;
        if (!container) return;
        container.innerHTML = '';
        if (!this.stonecutterSlot || !this.stonecutterSlot.item || this.stonecutterSlot.item.type !== 'block') {
            this.stonecutterSelectedRecipe = null;
            return;
        }

        const recipes = this._getStonecutterRecipes(this.stonecutterSlot.item.subtype);
        if (recipes.length === 0) {
            this.stonecutterSelectedRecipe = null;
            return;
        }

        if (!this.stonecutterSelectedRecipe || !recipes.some(r => r.block === this.stonecutterSelectedRecipe.block)) {
            this.stonecutterSelectedRecipe = recipes[0];
        }

        for (const rec of recipes) {
            const btn = document.createElement('div');
            btn.className = 'inv-slot' + (this.stonecutterSelectedRecipe && this.stonecutterSelectedRecipe.block === rec.block ? ' active' : '');
            btn.style.width = '36px';
            btn.style.height = '36px';
            btn.style.minWidth = '36px';
            btn.style.minHeight = '36px';
            btn.style.cursor = 'pointer';
            btn.title = `${rec.name} (${rec.count})`;
            if (this.stonecutterSelectedRecipe && this.stonecutterSelectedRecipe.block === rec.block) {
                btn.style.outline = '2px solid #fff';
                btn.style.background = 'rgba(255,255,255,0.2)';
            }
            this.renderSlotItem(btn, { item: { type: 'block', subtype: rec.block, name: rec.name }, count: rec.count });
            btn.onclick = (e) => {
                e.stopPropagation();
                this.stonecutterSelectedRecipe = rec;
                this._renderStonecutter();
            };
            container.appendChild(btn);
        }
    }

    _updateStonecutterOutput() {
        if (!this.elements.stonecutterOutput) return;
        if (this.stonecutterSlot && this.stonecutterSlot.count > 0 && this.stonecutterSelectedRecipe) {
            const rec = this.stonecutterSelectedRecipe;
            this.renderSlotItem(this.elements.stonecutterOutput, {
                item: { type: 'block', subtype: rec.block, name: rec.name },
                count: rec.count
            });
        } else {
            this.renderSlotItem(this.elements.stonecutterOutput, null);
        }
    }

    _craftFromStonecutter(shiftClick = false) {
        if (!this.stonecutterSlot || !this.stonecutterSlot.count || !this.stonecutterSelectedRecipe || !this.currentPlayer) return;
        const rec = this.stonecutterSelectedRecipe;
        const inv = this.currentPlayer.inventory;
        const outItem = { type: 'block', subtype: rec.block, name: rec.name, stackable: true, maxStack: 64, data: {} };

        if (shiftClick) {
            while (this.stonecutterSlot && this.stonecutterSlot.count > 0) {
                const added = inv.addItem(outItem, rec.count);
                if (!added) break;
                this.stonecutterSlot.count--;
                if (this.stonecutterSlot.count <= 0) this.stonecutterSlot = null;
            }
        } else {
            if (this.dragState.isDragging) {
                if (this.dragState.itemData && this.dragState.itemData.item.subtype === rec.block && this.dragState.itemData.count + rec.count <= 64) {
                    this.dragState.itemData.count += rec.count;
                    this.stonecutterSlot.count--;
                    if (this.stonecutterSlot.count <= 0) this.stonecutterSlot = null;
                }
            } else {
                this.dragState.isDragging = true;
                this.dragState.sourceType = 'stonecutter_output';
                this.dragState.sourceIndex = -1;
                this.dragState.itemData = { item: outItem, count: rec.count };
                this.dragState.offsetX = 0;
                this.dragState.offsetY = 0;
                this.elements.dragIcon.classList.remove('hidden');
                this.renderSlotItem(this.elements.dragIcon, this.dragState.itemData);
                this.stonecutterSlot.count--;
                if (this.stonecutterSlot.count <= 0) this.stonecutterSlot = null;
            }
        }
        this._renderStonecutter();
        this._updateInventory();
    }

    _updateChestSlots(forceUpdate = false) {
        if (this.chestPos && this.chestInventory) {
            this.renderGrid(this.elements.chestGrid, this.chestInventory, 0, this.currentPlayer, 'chest', forceUpdate);
        }
    }

    _updateInventory(forceUpdate = false) {
        if (!this.currentPlayer) return;
        const p = this.currentPlayer;
        this.renderGrid(this.elements.mainHotbar, p.inventory.slots.slice(0, 9), 0, p, 'inventory', forceUpdate);
        if (this.isOpen) {
            this.renderGrid(this.elements.mainGrid, p.inventory.slots.slice(9, 36), 9, p, 'inventory', forceUpdate);
            this.renderGrid(this.elements.invHotbar, p.inventory.slots.slice(0, 9), 0, p, 'inventory', forceUpdate);
        }
    }

    _updateArmorSlots() {
        if (!this.currentPlayer) return;
        const ARMOR_NAMES = ['head', 'chest', 'legs', 'boots'];
        ARMOR_NAMES.forEach((slotName, i) => {
            const el = document.querySelector(`[data-slot="${slotName}"]`);
            if (!el) return;
            this.renderSlotItem(el, this.currentPlayer.inventory.armor[i]);
        });
        const offhandEl = document.querySelector('.offhand-slot');
        if (offhandEl) {
            this.renderSlotItem(offhandEl, this.currentPlayer.inventory.offhand);
        }
    }

    _renderPlayerPreview(player) {
        const canvas = document.getElementById('player-preview-canvas');
        if (!canvas || !player) return;

        if (!this._previewRenderer) {
            this._previewRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
            this._previewRenderer.setSize(104, 144);
            this._previewRenderer.setPixelRatio(window.devicePixelRatio || 1);

            this._previewScene = new THREE.Scene();
            this._previewCamera = new THREE.PerspectiveCamera(40, 104 / 144, 0.1, 20);
            this._previewCamera.position.set(0, 1.05, 3.1);
            this._previewCamera.lookAt(0, 0.95, 0);

            const ambient = new THREE.AmbientLight(0xffffff, 0.85);
            this._previewScene.add(ambient);

            const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
            dirLight.position.set(1.5, 3.0, 2.0);
            this._previewScene.add(dirLight);

            // Preview player model instance (independent from in-game player.mesh)
            this._previewModel = player.createPlayerMesh(false);
            this._previewModel.position.set(0, 0, 0);
            this._previewScene.add(this._previewModel);
            this._previewAngle = 0;
        }

        // Keep preview model at scene origin and gently spin
        this._previewAngle = (this._previewAngle || 0) + 0.02;
        if (this._previewModel) {
            this._previewModel.position.set(0, 0, 0);
            this._previewModel.rotation.y = Math.PI + Math.sin(this._previewAngle) * 0.45; // gentle front sway facing camera
            // Make arms hang naturally
            const la = this._previewModel.getObjectByName('leftArm');
            const ra = this._previewModel.getObjectByName('rightArm');
            if (la) la.rotation.x = 0;
            if (ra) ra.rotation.x = 0;

            // Sync armor display from live player inventory
            if (typeof player.syncArmorDisplay === 'function') {
                player.syncArmorDisplay(this._previewModel);
            }
        }

        this._previewRenderer.render(this._previewScene, this._previewCamera);
    }

    _updateCraftingSlots(forceUpdate = false) {
        const grid = this.elements.craftingGrid;
        if (!grid) return;
        const count = this.is3x3Crafting ? 9 : 4;
        for (let i = 0; i < count; i++) {
            this.renderSlotItem(grid.children[i], this.craftingSlots[i], forceUpdate);
        }
        this._updateCraftingOutput();
    }

    _updateCraftingOutput() {
        const out = this.elements.craftingOutput;
        const nameEl = this.elements.craftingRecipeName;
        if (!out) return;
        const result = this._matchRecipe();
        if (result) {
            this.renderSlotItem(out, result);
            if (nameEl) nameEl.textContent = result.item.name;
        } else {
            this.renderSlotItem(out, null);
            if (nameEl) nameEl.textContent = '';
        }
    }

    _updateFurnaceSlots() {
        if (!this.furnaceData) return;
        this.renderSlotItem(this.elements.furnaceInput, this.furnaceData.input);
        this.renderSlotItem(this.elements.furnaceFuel, this.furnaceData.fuel);
        this.renderSlotItem(this.elements.furnaceOutput, this.furnaceData.output);
        if (this.elements.furnaceProgress) {
            const prog = Math.max(0, Math.min(1, this.furnaceData.progress || 0));
            this.elements.furnaceProgress.style.width = `${Math.floor(prog * 100)}%`;
        }
        if (this.elements.furnaceFire) {
            const f = this.furnaceData;
            const burnTime = f.burnTime || 0;
            const maxBurnTime = f.maxBurnTime || 0;
            const burnRatio = (maxBurnTime > 0 && burnTime > 0) ? Math.max(0, Math.min(1, burnTime / maxBurnTime)) : 0;
            
            if (this.elements.furnaceFireFill) {
                this.elements.furnaceFireFill.style.height = `${Math.round(burnRatio * 100)}%`;
            }
            if (burnTime > 0 || f.isSmelting) {
                this.elements.furnaceFire.classList.add('lit');
                this.elements.furnaceFire.style.opacity = '1.0';
            } else {
                this.elements.furnaceFire.classList.remove('lit');
                this.elements.furnaceFire.style.opacity = '1.0';
                if (this.elements.furnaceFireFill) {
                    this.elements.furnaceFireFill.style.height = '0%';
                }
            }
        }
    }

    _getSlotType(slot) {
        if (!slot || !slot.item) return null;
        if (slot.item.type === 'block') return slot.item.subtype;
        if (slot.item.type === 'material') return slot.item.subtype;
        if (slot.item.type === 'equipment') return slot.item.subtype;
        if (slot.item.type === 'spawn_egg') return slot.item.subtype;
        if (slot.item.type === 'food') return slot.item.subtype;
        return null;
    }

    _matchRecipe() {
        const activeSlots = this.craftingSlots.filter(s => s && s.item);
        const spells = activeSlots.filter(s => s.item.type === 'spell');
        const modifiers = activeSlots.filter(s => s.item.type === 'modifier');
        if (spells.length === 1 && modifiers.length >= 1 && spells.length + modifiers.length === activeSlots.length) {
            const baseSpellItem = spells[0].item;
            const baseSpell = baseSpellItem.data && baseSpellItem.data.spell ? baseSpellItem.data.spell : baseSpellItem;
            
            const newSpell = Object.assign(Object.create(Object.getPrototypeOf(baseSpell)), baseSpell);
            newSpell.modifiers = baseSpell.modifiers ? [...baseSpell.modifiers] : [];
            newSpell.id = 'magic_' + Math.random();
            
            for (const modSlot of modifiers) {
                const mod = modSlot.item;
                const modData = mod.data && mod.data.mod ? mod.data.mod : mod;
                if (modData.config && !modData.config.stackable && newSpell.modifiers.some(m => m.type === modData.type)) return null;
                if (typeof newSpell.addModifier === 'function') newSpell.addModifier(modData);
                else newSpell.modifiers.push(modData);
            }
            
            const newItem = Object.assign({}, baseSpellItem);
            newItem.id = newSpell.id;
            if (baseSpellItem.data && baseSpellItem.data.spell) {
                newItem.data = Object.assign({}, baseSpellItem.data, { spell: newSpell });
            } else {
                Object.assign(newItem, newSpell);
            }
            return { item: newItem, count: 1 };
        }

        // Build a 2x2 pattern from crafting slots [tl, tr, bl, br]
        const s = this.craftingSlots.map(s => this._getSlotType(s));
        const [tl, tr, bl, br] = s;

        // Helper: check if a pattern (array of 4 block IDs or null) matches
        const B = (typeof BLOCKS !== 'undefined') ? BLOCKS : window.BLOCKS;
        if (!B) return null;

        // Helper: get count of a specific material/block in the grid
        const getCount = (type) => s.filter(x => x === type).length;
        const totalItems = s.filter(x => x !== null).length;

        const match = (pattern, out) => {
            for (let i = 0; i < 4; i++) {
                if (pattern[i] !== s[i]) return null;
            }
            return out;
        };

        // Utility to make a material item
        const mat = (subType, name, count = 1, icon = null) => ({ item: { type: 'material', subtype: subType, name, stackable: true, maxStack: 64, id: `mat_${subType}`, data: { icon }, description: '' }, count });
        const food = (subType, name, count = 1) => ({ item: { type: 'food', subtype: subType, name, stackable: true, maxStack: 64, id: `food_${subType}_${Date.now()}`, data: {}, description: '' }, count });
        const equip = (subType, data, name, desc, count = 1) => ({ item: { type: 'equipment', subtype: subType, name, stackable: false, maxStack: 1, id: `equip_${subType}_${Date.now()}`, data: { equipData: data }, description: desc }, count });
        const block = (type, name, count = 1) => ({ item: { type: 'block', subtype: type, name, stackable: true, maxStack: 64, id: `block_${type}`, data: {}, description: '' }, count });

        // --- Recipes ---
        const woodToPlankMap = {
            [B.WOOD]: { block: B.PLANKS, name: 'Planks' },
            [B.ACACIA_WOOD]: { block: B.ACACIA_PLANKS, name: 'Acacia Planks' },
            [B.CHERRY_LOG]: { block: B.CHERRY_PLANKS, name: 'Cherry Planks' },
            [B.AUTUMN_WOOD]: { block: B.AUTUMN_PLANKS, name: 'Autumn Planks' },
            [B.PALM_WOOD]: { block: B.PALM_PLANKS, name: 'Palm Planks' },
            [B.JUNGLE_LOG]: { block: B.PALM_PLANKS, name: 'Jungle Planks' },
            [B.PINE_WOOD]: { block: B.PINE_PLANKS, name: 'Pine Planks' },
            [B.CRIMSON_STEM]: { block: B.CRIMSON_PLANKS, name: 'Crimson Planks' },
            [B.DARK_OAK_WOOD]: { block: B.DARK_OAK_PLANKS, name: 'Dark Oak Planks' },
            [B.BIRCH_WOOD]: { block: B.BIRCH_PLANKS, name: 'Birch Planks' },
            [B.MANGROVE_LOG]: { block: B.MANGROVE_PLANKS, name: 'Mangrove Planks' },
            [B.MAGIC_WOOD]: { block: B.MAGIC_PLANKS, name: 'Magic Planks' },
            [B.REDWOOD_LOG]: { block: B.REDWOOD_PLANKS, name: 'Redwood Planks' },
            [B.WARPED_STEM]: { block: B.WARPED_PLANKS, name: 'Warped Planks' },
            [B.GOLDEN_OAK_WOOD]: { block: B.GOLDEN_OAK_PLANKS, name: 'Golden Oak Planks' },
            [B.ENCHANTED_AETHER_LOG]: { block: B.GOLDEN_OAK_PLANKS, name: 'Golden Oak Planks' },
            [B.AETHER_WOOD]: { block: B.AETHER_PLANKS, name: 'Skyroot Planks' },
        };
        const woodType = s.find(x => x !== null && woodToPlankMap[x]);
        const isPlank = (t) => [
            B.PLANKS, B.ACACIA_PLANKS, B.CHERRY_PLANKS, B.AUTUMN_PLANKS, B.PALM_PLANKS,
            B.PINE_PLANKS, B.CRIMSON_PLANKS, B.DARK_OAK_PLANKS, B.BIRCH_PLANKS, B.MANGROVE_PLANKS,
            B.MAGIC_PLANKS, B.REDWOOD_PLANKS, B.WARPED_PLANKS, B.GOLDEN_OAK_PLANKS, B.AETHER_PLANKS
        ].includes(t);
        const countAnyPlank = s.filter(x => x !== null && isPlank(x)).length;
        const isLog = (t) => t !== null && woodToPlankMap[t] !== undefined;
        const countAnyLog = s.filter(x => isLog(x)).length;
        const matchesMat = (t, expected) => expected === B.PLANKS ? isPlank(t) : t === expected;

        const getMatSuffix = (matType) => {
            if (matType === 'netherite_ingot') return '_netherite';
            if (matType === 'gravitite_ore')   return '_gravitite';
            if (matType === 'ruby')            return '_ruby';
            if (matType === 'sapphire')        return '_sapphire';
            if (matType === 'zanite_gemstone') return '_zanite';
            if (matType === 'iron_ingot')      return '_iron';
            if (matType === 'gold_ingot')      return '_gold';
            if (matType === 'diamond')         return '_diamond';
            if (matType === B.COBBLESTONE)     return '_stone';
            if (matType === B.PLANKS)          return '_wood';
            return '_iron';
        };

        // Pickaxes: 3 top mat, 2 stick middle
        const pickaxeRecipe = (matType, mineSpeed, damage, chopSpeed, toolName, passive = '') => {
            if (matchesMat(s[0], matType) && matchesMat(s[1], matType) && matchesMat(s[2], matType) &&
                !s[3] && s[4] === 'stick' && !s[5] &&
                !s[6] && s[7] === 'stick' && !s[8])
                return equip('pickaxe' + getMatSuffix(matType), { mineSpeed, damage, chopSpeed, passive }, toolName, `${toolName}. Mine Speed: ${mineSpeed}x${passive ? ' · ' + passive : ''}`);
            return null;
        };

        // Swords: 2 mat vertical, 1 stick bottom
        const swordRecipe = (matType, damage, toolName, extraData = {}) => {
            if (!s[0] && matchesMat(s[1], matType) && !s[2] &&
                !s[3] && matchesMat(s[4], matType) && !s[5] &&
                !s[6] && s[7] === 'stick' && !s[8])
                return equip('sword' + getMatSuffix(matType), { mineSpeed: 1.0, damage, chopSpeed: 1.0, ...extraData }, toolName, `${toolName}. Damage: ${damage}${extraData.passive ? ' · ' + extraData.passive : ''}`);
            return null;
        };

        // Axes: 3 mat corner, 2 stick
        const axeRecipe = (matType, chopSpeed, damage, toolName, passive = '') => {
            if (matchesMat(s[0], matType) && matchesMat(s[1], matType) && !s[2] &&
                matchesMat(s[3], matType) && s[4] === 'stick' && !s[5] &&
                !s[6] && s[7] === 'stick' && !s[8])
                return equip('axe' + getMatSuffix(matType), { mineSpeed: 1.0, damage, chopSpeed, passive }, toolName, `${toolName}. Chop Speed: ${chopSpeed}x${passive ? ' · ' + passive : ''}`);
            return null;
        };

        // Shovels: 1 mat top-middle, 2 stick
        const shovelRecipe = (matType, digSpeed, damage, toolName, passive = '') => {
            if (!s[0] && matchesMat(s[1], matType) && !s[2] &&
                !s[3] && s[4] === 'stick' && !s[5] &&
                !s[6] && s[7] === 'stick' && !s[8])
                return equip('shovel' + getMatSuffix(matType), { mineSpeed: 1.0, digSpeed, damage, chopSpeed: 1.0, passive }, toolName, `${toolName}. Dig Speed: ${digSpeed}x${passive ? ' · ' + passive : ''}`);
            return null;
        };

        // Hoes: 2 mat top row, 2 stick middle column
        const hoeRecipe = (matType, toolName, passive = '') => {
            const isP1 = matchesMat(s[0], matType) && matchesMat(s[1], matType) && !s[2] &&
                         !s[3] && s[4] === 'stick' && !s[5] &&
                         !s[6] && s[7] === 'stick' && !s[8];
            const isP2 = !s[0] && matchesMat(s[1], matType) && matchesMat(s[2], matType) &&
                         !s[3] && s[4] === 'stick' && !s[5] &&
                         !s[6] && s[7] === 'stick' && !s[8];
            if (isP1 || isP2)
                return equip('hoe' + getMatSuffix(matType), { isHoe: true, damage: 1, passive }, toolName, `${toolName}.${passive ? ' · ' + passive : ''}`);
            return null;
        };

        // Armor Helmet: 5 mat top arch
        const armorRecipe2H = (matType, name, subType, protection) => {
            if (s[0] === matType && s[1] === matType && s[2] === matType &&
                s[3] === matType && !s[4] && s[5] === matType &&
                !s[6] && !s[7] && !s[8])
                return equip(subType, { protection }, name, `Protection: ${protection}`);
            return null;
        };
        // Armor Chestplate: 8 mat ring
        const armorRecipeFull = (matType, name, subType, protection) => {
            if (s[0] === matType && !s[1] && s[2] === matType &&
                s[3] === matType && s[4] === matType && s[5] === matType &&
                s[6] === matType && s[7] === matType && s[8] === matType)
                return equip(subType, { protection }, name, `Protection: ${protection}`);
            return null;
        };
        // Armor Leggings: 7 mat arch
        const armorRecipeLegs = (matType, name, subType, protection) => {
            if (s[0] === matType && s[1] === matType && s[2] === matType &&
                s[3] === matType && !s[4] && s[5] === matType &&
                s[6] === matType && !s[7] && s[8] === matType)
                return equip(subType, { protection }, name, `Protection: ${protection}`);
            return null;
        };
        // Armor Boots: 4 mat sides (top two rows or bottom two rows)
        const armorRecipeBoots = (matType, name, subType, protection) => {
            const row23 = (!s[0] && !s[1] && !s[2] &&
                s[3] === matType && !s[4] && s[5] === matType &&
                s[6] === matType && !s[7] && s[8] === matType);
            const row12 = (s[0] === matType && !s[1] && s[2] === matType &&
                s[3] === matType && !s[4] && s[5] === matType &&
                !s[6] && !s[7] && !s[8]);
            if (row23 || row12)
                return equip(subType, { protection }, name, `Protection: ${protection}`);
            return null;
        };

        // Spell Recipe: mana crystal center, 4 mats in cross
        const spellRecipe = (matType, spellId) => {
            if (s[4] !== 'mana_crystal') return null;
            if (!s[0] && matchesMat(s[1], matType) && !s[2] &&
                matchesMat(s[3], matType) && matchesMat(s[5], matType) &&
                !s[6] && matchesMat(s[7], matType) && !s[8]) {
                const sp = SPELL_TYPES[spellId];
                if (!sp) return null;
                const spellInst = new Spell(spellId);
                return { 
                    item: { 
                        type: 'spell', subtype: spellId, name: sp.name, 
                        stackable: false, maxStack: 1, id: `spell_${spellId}_${Date.now()}`, 
                        data: { spell: spellInst }, description: sp.description 
                    }, 
                    count: 1 
                };
            }
            return null;
        };

        const wndRecipe = (sub, name, desc, innate, slots = 4) => ({
            item: {
                type: 'wand', subtype: sub, name: name,
                stackable: false, maxStack: 1, id: `wand_${sub}_${Date.now()}`,
                data: { wand: new Wand(name, slots, innate) },
                description: desc
            },
            count: 1
        });

        // --- 2x2 and 3x3 shared recipes ---
        if (woodType !== undefined && totalItems === 1) return block(woodToPlankMap[woodType].block, woodToPlankMap[woodType].name, 4);
        if (countAnyPlank === 2 && totalItems === 2) return mat('stick', 'Stick', 4);
        if ((getCount('coal') === 1 || getCount('charcoal') === 1) && getCount('stick') === 1 && totalItems === 2) return block(B.TORCH, 'Torch', 4);
        
        if (getCount('stick') === 1 && getCount('iron_ingot') === 1 && totalItems === 2) return wndRecipe('wand_basic', 'Basic Wand', 'Channels raw magic.', 'BOLT', 4);
        if (getCount('wand_basic') === 1 && getCount('coal') === 1 && totalItems === 2) return wndRecipe('wand_fire', 'Fire Wand', 'Shoots fireballs.', 'BURST', 4);
        if (getCount('wand_basic') === 1 && getCount(B.SNOW) === 1 && totalItems === 2) return wndRecipe('wand_ice', 'Ice Wand', 'Shoots ice blasts.', 'BOLT', 4);
        if (getCount('wand_basic') === 1 && (getCount(B.LEAVES) === 1 || getCount(B.CHERRY_LEAVES) === 1 || getCount(B.AUTUMN_LEAVES) === 1) && totalItems === 2) return wndRecipe('wand_nature', 'Nature Wand', 'Heals the wielder.', 'HEAL', 4);

        if (getCount(B.STONE) === 4 && totalItems === 4) return block(B.STONE_BRICKS, 'Stone Bricks', 4);
        if (getCount(B.CLAY) === 4 && totalItems === 4) return block(B.BRICKS, 'Bricks', 4);
        if (countAnyPlank === 4 && totalItems === 4) return block(B.CRAFTING_TABLE, 'Crafting Table', 1);
        if (getCount('iron_ingot') === 1 && (getCount(B.GRAVEL) === 1 || getCount('flint') === 1) && totalItems === 2) return equip('flint_and_steel', { damage: 0 }, 'Flint and Steel', 'Lights fires.');
        if (getCount(B.COBBLESTONE) === 1 && (getCount(B.LEAVES) === 1 || getCount(B.CHERRY_LEAVES) === 1 || getCount(B.AUTUMN_LEAVES) === 1) && totalItems === 2) return block(B.MOSSY_COBBLESTONE, 'Mossy Cobble', 1);
        
        if (getCount('string') === 4 && totalItems === 4) return block(B.WOOL, 'Wool', 1);
        if (getCount(B.NETHERRACK) === 4 && totalItems === 4) return block(B.NETHER_BRICKS, 'Nether Bricks', 4);
        if (getCount(B.MAGMA_STONE) === 4 && totalItems === 4) return block(B.MAGMA, 'Magma Block', 4);
        if (getCount(B.BASALT) === 4 && totalItems === 4) return block(B.SMOOTH_BASALT, 'Smooth Basalt', 4);
        if (getCount(B.HOLYSTONE) === 4 && totalItems === 4) return block(B.CARVED_HOLYSTONE, 'Carved Holystone', 4);

        if (getCount(B.SUGARCANE) === 1 && totalItems === 1) return mat('sugar', 'Sugar', 1);
        if (getCount(B.SUGARCANE) === 3 && totalItems === 3) return mat('paper', 'Paper', 3);
        if (getCount('paper') === 3 && (getCount('leather') === 1 || totalItems === 3) && (totalItems === 4 || totalItems === 3)) return mat('book', 'Book', 1);
        if (getCount(B.SANDSTONE) === 4 && totalItems === 4) return block(B.SANDSTONE, 'Smooth Sandstone', 4);

        // Workstations & Utility Blocks
        if (getCount('flint') === 2 && (countAnyPlank === 4 || countAnyPlank === 2) && totalItems === (2 + countAnyPlank)) return block(B.FLETCHING_TABLE, 'Fletching Table', 1);
        if (getCount('iron_ingot') === 1 && getCount(B.STONE) === 3 && totalItems === 4) return block(B.STONECUTTER, 'Stonecutter', 1);
        if ((getCount(B.POINTED_DRIPSTONE_DOWN) + getCount(B.POINTED_DRIPSTONE_UP)) === 4 && totalItems === 4) return block(B.DRIPSTONE_BLOCK, 'Dripstone Block', 1);
        if ((getCount('slime_ball') === 4 || getCount('slimeball') === 4) && totalItems === 4) return block(B.SLIME_BLOCK, 'Slime Block', 1);
        if ((getCount('slime_ball') === 9 || getCount('slimeball') === 9) && totalItems === 9) return block(B.SLIME_BLOCK, 'Slime Block', 1);
        if (getCount(B.SLIME_BLOCK) === 1 && totalItems === 1) return mat('slime_ball', 'Slimeball', 9);
        if ((getCount('slime_ball') === 1 || getCount('slimeball') === 1) && getCount('blaze_powder') === 1 && totalItems === 2) return mat('lavaslime_ball', 'Magma Cream', 1);
        if (getCount('string') === 4 && (getCount('slime_ball') === 1 || getCount('slimeball') === 1) && totalItems === 5) return mat('lead', 'Lead', 2);
        if (getCount('gunpowder') === 5 && getCount(B.SAND) === 4 && totalItems === 9) return block(B.TNT, 'TNT', 1);

        // Mod Items (Shared / Shapeless)
        if ((getCount('slime_ball') === 2 || getCount('slimeball') === 2) && (getCount('boots_iron') === 1 || getCount('boots_diamond') === 1 || getCount('boots_gold') === 1) && totalItems === 3) {
            return equip('slime_boots', { protection: 2, slot: 'boots', bouncy: true, passive: 'Super Bouncy & No Fall Damage' }, 'Slime Boots', 'Bouncy boots that negate fall damage.');
        }
        if ((getCount(B.WHITE_WOOL) === 4 || getCount(B.WOOL) === 4 || getCount('feather') === 4 || getCount(B.AETHER_CLOUD) === 4) && getCount('string') === 1 && totalItems === 5) {
            return equip('cloud_parachute', { slowFall: true, passive: 'Slow Fall Gliding' }, 'Cloud Parachute', 'Slow fall gliding in mid-air.');
        }
        if ((getCount(B.WHITE_WOOL) === 3 || getCount(B.WOOL) === 3 || getCount('feather') === 3 || getCount(B.AETHER_CLOUD) === 3) && getCount('string') === 2 && totalItems === 5) {
            return equip('cloud_parachute', { slowFall: true, passive: 'Slow Fall Gliding' }, 'Cloud Parachute', 'Slow fall gliding in mid-air.');
        }
        if (getCount('feather') === 1 && (getCount('gold_ingot') === 8 || getCount('gold_ingot') === 4) && totalItems === (1 + getCount('gold_ingot'))) {
            return equip('golden_feather', { slowFall: true, lowGravity: true, passive: 'Passive Low Gravity & Fall Immunity' }, 'Golden Feather', 'Passive low gravity and fall damage immunity.');
        }

        // Reverse Storage is 1 item -> 9 items.
        if (getCount(B.IRON_BLOCK) === 1 && totalItems === 1) return mat('iron_ingot', 'Iron Ingot', 9);
        if (getCount('iron_ingot') === 1 && totalItems === 1) return mat('iron_nugget', 'Iron Nugget', 9);
        if (getCount(B.GOLD_BLOCK) === 1 && totalItems === 1) return mat('gold_ingot', 'Gold Ingot', 9);
        if (getCount('gold_ingot') === 1 && totalItems === 1) return mat('gold_nugget', 'Gold Nugget', 9);
        if (getCount(B.DIAMOND_BLOCK) === 1 && totalItems === 1) return mat('diamond', 'Diamond', 9);
        if (getCount(B.EMERALD_BLOCK) === 1 && totalItems === 1) return mat('emerald', 'Emerald', 9);
        if (getCount(B.LAPIS_BLOCK) === 1 && totalItems === 1) return mat('lapis_lazuli', 'Lapis Lazuli', 9);
        if (getCount(B.REDSTONE_BLOCK) === 1 && totalItems === 1) return mat('redstone', 'Redstone Dust', 9);
        if (getCount(B.COAL_BLOCK) === 1 && totalItems === 1) return mat('coal', 'Coal', 9);
        if (getCount(B.BONE_BLOCK) === 1 && totalItems === 1) return mat('bone_meal', 'Bone Meal', 9);
        if (getCount('bone') === 1 && totalItems === 1) return mat('bone_meal', 'Bone Meal', 3);
        if (getCount('bone_meal') === 1 && totalItems === 1) return mat('white_dye', 'White Dye', 1);
        if (getCount('netherite_scrap') === 4 && getCount('gold_ingot') === 4 && totalItems === 8) return mat('netherite_ingot', 'Netherite Ingot', 1);

        // Food & Agriculture
        if (getCount('wheat') === 3 && totalItems === 3) return food('bread', 'Bread', 1);
        if (getCount('wheat') === 2 && (getCount('cocoa_beans') === 1 || getCount('sugar') === 1) && totalItems === 3) return food('cookie', 'Cookie', 8);
        if (getCount('wheat') === 3 && getCount('sugar') === 2 && getCount('egg') === 1 && totalItems === 6) return block(B.CAKE, 'Cake', 1);
        if (getCount(B.PUMPKIN) === 1 && totalItems === 1) return mat('pumpkin_seeds', 'Pumpkin Seeds', 4);
        if (getCount('melon_slice') === 1 && totalItems === 1) return mat('melon_seeds', 'Melon Seeds', 1);
        if (getCount('beetroot') === 6 && totalItems === 6) return food('beetroot_soup', 'Beetroot Soup', 1);
        if (getCount('beetroot') >= 1 && getCount('bowl') === 1 && totalItems === (getCount('beetroot') + 1)) return food('beetroot_soup', 'Beetroot Soup', 1);
        if (countAnyPlank === 3 && totalItems === 3) return mat('bowl', 'Bowl', 4);
        if (getCount(B.PUMPKIN) === 1 && getCount('sugar') === 1 && getCount('egg') === 1 && totalItems === 3) return food('pumpkin_pie', 'Pumpkin Pie', 1);
        if (getCount('gold_nugget') === 8 && getCount('carrot') === 1 && totalItems === 9) return food('golden_carrot', 'Golden Carrot', 1);
        if (getCount('gold_nugget') === 8 && getCount('melon_slice') === 1 && totalItems === 9) return mat('glistering_melon', 'Glistering Melon', 1);
        if (getCount('flint') === 1 && getCount('stick') === 1 && getCount('feather') === 1 && totalItems === 3) return mat('arrow', 'Arrow', 4);

        // Flowers to Dyes (1 flower -> 1 dye)
        if (getCount(B.RED_FLOWER) === 1 && totalItems === 1) return mat('red_dye', 'Red Dye', 1);
        if (getCount(B.YELLOW_FLOWER) === 1 && totalItems === 1) return mat('yellow_dye', 'Yellow Dye', 1);
        if (getCount(B.BLUE_FLOWER) === 1 && totalItems === 1) return mat('blue_dye', 'Blue Dye', 1);
        if (getCount(B.WHITE_FLOWER) === 1 && totalItems === 1) return mat('white_dye', 'White Dye', 1);
        if (getCount(B.PURPLE_FLOWER) === 1 && totalItems === 1) return mat('purple_dye', 'Purple Dye', 1);
        if (getCount(B.ORANGE_FLOWER) === 1 && totalItems === 1) return mat('orange_dye', 'Orange Dye', 1);
        if (getCount(B.AETHER_FLOWER) === 1 && totalItems === 1) return mat('cyan_dye', 'Cyan Dye', 1);
        if (getCount(B.CACTUS) === 1 && totalItems === 1) return mat('green_dye', 'Green Dye', 1);

        // Blaze Powder & Eye of Ender
        if (getCount('blaze_rod') === 1 && totalItems === 1) return mat('blaze_powder', 'Blaze Powder', 2);
        if (getCount('ender_pearl') === 1 && getCount('blaze_powder') === 1 && totalItems === 2) return mat('eye_of_ender', 'Eye of Ender', 1);

        // Dye Mixing (2 dyes -> 2 mixed dyes)
        if (getCount('red_dye') === 1 && getCount('yellow_dye') === 1 && totalItems === 2) return mat('orange_dye', 'Orange Dye', 2);
        if (getCount('red_dye') === 1 && getCount('blue_dye') === 1 && totalItems === 2) return mat('purple_dye', 'Purple Dye', 2);
        if (getCount('red_dye') === 1 && getCount('white_dye') === 1 && totalItems === 2) return mat('pink_dye', 'Pink Dye', 2);
        if (getCount('blue_dye') === 1 && getCount('yellow_dye') === 1 && totalItems === 2) return mat('green_dye', 'Green Dye', 2);
        if (getCount('blue_dye') === 1 && getCount('white_dye') === 1 && totalItems === 2) return mat('light_blue_dye', 'Light Blue Dye', 2);
        if (getCount('blue_dye') === 1 && getCount('green_dye') === 1 && totalItems === 2) return mat('cyan_dye', 'Cyan Dye', 2);
        if (getCount('black_dye') === 1 && getCount('white_dye') === 1 && totalItems === 2) return mat('gray_dye', 'Gray Dye', 2);
        if (getCount('gray_dye') === 1 && getCount('white_dye') === 1 && totalItems === 2) return mat('light_gray_dye', 'Light Gray Dye', 2);
        if (getCount('green_dye') === 1 && getCount('white_dye') === 1 && totalItems === 2) return mat('lime_dye', 'Lime Dye', 2);
        if (getCount('purple_dye') === 1 && getCount('pink_dye') === 1 && totalItems === 2) return mat('magenta_dye', 'Magenta Dye', 2);
        if (getCount('orange_dye') === 1 && getCount('black_dye') === 1 && totalItems === 2) return mat('brown_dye', 'Brown Dye', 2);

        // Wool Dyeing: any wool + dye -> colored wool (1x)
        const dyeToWoolMap = {
            'red_dye': { block: B.RED_WOOL, name: 'Red Wool' },
            'blue_dye': { block: B.BLUE_WOOL, name: 'Blue Wool' },
            'yellow_dye': { block: B.YELLOW_WOOL, name: 'Yellow Wool' },
            'green_dye': { block: B.GREEN_WOOL, name: 'Green Wool' },
            'black_dye': { block: B.BLACK_WOOL, name: 'Black Wool' },
            'purple_dye': { block: B.PURPLE_WOOL, name: 'Purple Wool' },
            'orange_dye': { block: B.ORANGE_WOOL, name: 'Orange Wool' },
            'pink_dye': { block: B.PINK_WOOL, name: 'Pink Wool' },
            'cyan_dye': { block: B.CYAN_WOOL, name: 'Cyan Wool' },
            'lime_dye': { block: B.LIME_WOOL, name: 'Lime Wool' },
            'gray_dye': { block: B.GRAY_WOOL, name: 'Gray Wool' },
            'light_blue_dye': { block: B.LIGHT_BLUE_WOOL, name: 'Light Blue Wool' },
            'brown_dye': { block: B.BROWN_WOOL, name: 'Brown Wool' },
            'magenta_dye': { block: B.MAGENTA_WOOL, name: 'Magenta Wool' },
            'light_gray_dye': { block: B.LIGHT_GRAY_WOOL, name: 'Light Gray Wool' },
            'white_dye': { block: B.WOOL, name: 'White Wool' }
        };
        const allWoolsList = [
            B.WOOL, B.WHITE_WOOL, B.RED_WOOL, B.BLUE_WOOL, B.YELLOW_WOOL, B.GREEN_WOOL,
            B.BLACK_WOOL, B.PURPLE_WOOL, B.ORANGE_WOOL, B.PINK_WOOL, B.CYAN_WOOL,
            B.LIME_WOOL, B.GRAY_WOOL, B.LIGHT_BLUE_WOOL, B.BROWN_WOOL, B.MAGENTA_WOOL, B.LIGHT_GRAY_WOOL
        ];
        if (totalItems === 2) {
            for (const [dyeSubtype, woolInfo] of Object.entries(dyeToWoolMap)) {
                if (getCount(dyeSubtype) === 1) {
                    for (const w of allWoolsList) {
                        if (getCount(w) === 1) {
                            return block(woolInfo.block, woolInfo.name, 1);
                        }
                    }
                }
            }
        }

        // Bed Dyeing: any bed + dye -> colored bed (1x)
        const dyeToBedMap = {
            'red_dye': { block: B.RED_BED, name: 'Red Bed' },
            'white_dye': { block: B.WHITE_BED, name: 'White Bed' },
            'blue_dye': { block: B.BLUE_BED, name: 'Blue Bed' },
            'yellow_dye': { block: B.YELLOW_BED, name: 'Yellow Bed' },
            'green_dye': { block: B.GREEN_BED, name: 'Green Bed' },
            'black_dye': { block: B.BLACK_BED, name: 'Black Bed' },
            'purple_dye': { block: B.PURPLE_BED, name: 'Purple Bed' },
            'orange_dye': { block: B.ORANGE_BED, name: 'Orange Bed' },
            'pink_dye': { block: B.PINK_BED, name: 'Pink Bed' },
            'cyan_dye': { block: B.CYAN_BED, name: 'Cyan Bed' },
            'lime_dye': { block: B.LIME_BED, name: 'Lime Bed' },
            'gray_dye': { block: B.GRAY_BED, name: 'Gray Bed' },
            'light_blue_dye': { block: B.LIGHT_BLUE_BED, name: 'Light Blue Bed' },
            'brown_dye': { block: B.BROWN_BED, name: 'Brown Bed' },
            'magenta_dye': { block: B.MAGENTA_BED, name: 'Magenta Bed' },
            'light_gray_dye': { block: B.LIGHT_GRAY_BED, name: 'Light Gray Bed' }
        };
        const allBedsList = [
            B.RED_BED, B.WHITE_BED, B.BLUE_BED, B.YELLOW_BED, B.GREEN_BED, B.BLACK_BED,
            B.PURPLE_BED, B.ORANGE_BED, B.PINK_BED, B.CYAN_BED, B.LIME_BED, B.GRAY_BED,
            B.LIGHT_BLUE_BED, B.BROWN_BED, B.MAGENTA_BED, B.LIGHT_GRAY_BED
        ];
        if (totalItems === 2) {
            for (const [dyeSubtype, bedInfo] of Object.entries(dyeToBedMap)) {
                if (getCount(dyeSubtype) === 1) {
                    for (const bd of allBedsList) {
                        if (getCount(bd) === 1) {
                            return block(bedInfo.block, bedInfo.name, 1);
                        }
                    }
                }
            }
        }

        if (!this.is3x3Crafting) return null;

        // ONLY 3x3 recipes
            let r;
            // Pickaxes
            r = pickaxeRecipe('netherite_ingot', 5.5, 6, 1.5, 'Netherite Pickaxe', 'Infernal Resilience (Fireproof)'); if (r) return r;
            r = pickaxeRecipe('gravitite_ore', 5.0, 5, 1.5, 'Gravitite Pickaxe', 'Levitation Core'); if (r) return r;
            r = pickaxeRecipe('ruby', 4.5, 5, 1.5, 'Ruby Pickaxe', 'Molten Core (Auto-Smelts Ores)'); if (r) return r;
            r = pickaxeRecipe('sapphire', 4.0, 4, 1.5, 'Sapphire Pickaxe', 'Crystal Precision'); if (r) return r;
            r = pickaxeRecipe('zanite_gemstone', 4.2, 4, 1.5, 'Zanite Pickaxe', 'Aetherial Surge'); if (r) return r;
            r = pickaxeRecipe('diamond', 6.0, 8, 3.0, 'Diamond Pickaxe'); if (r) return r;
            r = pickaxeRecipe('iron_ingot', 3.0, 5, 1.5, 'Iron Pickaxe'); if (r) return r;
            r = pickaxeRecipe('gold_ingot', 2.5, 4, 2.5, 'Gold Pickaxe'); if (r) return r;
            r = pickaxeRecipe(B.COBBLESTONE, 2.0, 4, 1.2, 'Stone Pickaxe'); if (r) return r;
            r = pickaxeRecipe(B.PLANKS, 1.5, 3, 1.0, 'Wooden Pickaxe'); if (r) return r;

            // Swords
            r = swordRecipe('netherite_ingot', 11, 'Netherite Sword', { passive: 'Infernal Might (Fireproof & High Knockback)' }); if (r) return r;
            r = swordRecipe('gravitite_ore', 10, 'Gravitite Sword', { levitate: true, passive: 'Levitation Surge (Launches Mobs Upward)' }); if (r) return r;
            r = swordRecipe('ruby', 9, 'Ruby Sword', { fire: true, passive: 'Igniting Edge (Sets Enemies Ablaze)' }); if (r) return r;
            r = swordRecipe('sapphire', 8, 'Sapphire Sword', { frost: true, passive: 'Glacial Frost (Freezes Enemies)' }); if (r) return r;
            r = swordRecipe('zanite_gemstone', 7, 'Zanite Sword', { passive: 'Aetherial Surge' }); if (r) return r;
            r = swordRecipe('diamond', 12, 'Diamond Sword'); if (r) return r;
            r = swordRecipe('iron_ingot', 8, 'Iron Sword'); if (r) return r;
            r = swordRecipe('gold_ingot', 7, 'Gold Sword'); if (r) return r;
            r = swordRecipe(B.COBBLESTONE, 5, 'Stone Sword'); if (r) return r;
            r = swordRecipe(B.PLANKS, 3, 'Wooden Sword'); if (r) return r;

            // Axes
            r = axeRecipe('netherite_ingot', 5.5, 10, 'Netherite Axe', 'Infernal Cleave'); if (r) return r;
            r = axeRecipe('gravitite_ore', 5.0, 9, 'Gravitite Axe', 'Levitation Strike'); if (r) return r;
            r = axeRecipe('ruby', 4.5, 8, 'Ruby Axe', 'Kindling Strike'); if (r) return r;
            r = axeRecipe('sapphire', 4.0, 7, 'Sapphire Axe', 'Glacial Cleave'); if (r) return r;
            r = axeRecipe('zanite_gemstone', 4.2, 7, 'Zanite Axe', 'Aetherial Surge'); if (r) return r;
            r = axeRecipe('diamond', 5.0, 7, 'Diamond Axe'); if (r) return r;
            r = axeRecipe('iron_ingot', 3.0, 5, 'Iron Axe'); if (r) return r;
            r = axeRecipe('gold_ingot', 2.5, 4, 'Gold Axe'); if (r) return r;
            r = axeRecipe(B.COBBLESTONE, 2.0, 4, 'Stone Axe'); if (r) return r;
            r = axeRecipe(B.PLANKS, 1.5, 3, 'Wooden Axe'); if (r) return r;

            // Shovels
            r = shovelRecipe('netherite_ingot', 5.5, 5, 'Netherite Shovel', 'Infernal Excavation'); if (r) return r;
            r = shovelRecipe('gravitite_ore', 5.0, 4, 'Gravitite Shovel', 'Levitation Scoop'); if (r) return r;
            r = shovelRecipe('ruby', 4.5, 4, 'Ruby Shovel'); if (r) return r;
            r = shovelRecipe('sapphire', 4.0, 3, 'Sapphire Shovel'); if (r) return r;
            r = shovelRecipe('zanite_gemstone', 4.2, 3, 'Zanite Shovel', 'Aetherial Surge'); if (r) return r;
            r = shovelRecipe('diamond', 5.0, 4, 'Diamond Shovel'); if (r) return r;
            r = shovelRecipe('iron_ingot', 3.0, 3, 'Iron Shovel'); if (r) return r;
            r = shovelRecipe('gold_ingot', 2.5, 2, 'Golden Shovel'); if (r) return r;
            r = shovelRecipe(B.COBBLESTONE, 2.0, 2, 'Stone Shovel'); if (r) return r;
            r = shovelRecipe(B.PLANKS, 1.5, 1, 'Wooden Shovel'); if (r) return r;

            // Hoes
            r = hoeRecipe('netherite_ingot', 'Netherite Hoe', 'Infernal Cultivation (Fireproof)'); if (r) return r;
            r = hoeRecipe('gravitite_ore', 'Gravitite Hoe', 'Levitation Cultivation'); if (r) return r;
            r = hoeRecipe('ruby', 'Ruby Hoe'); if (r) return r;
            r = hoeRecipe('sapphire', 'Sapphire Hoe'); if (r) return r;
            r = hoeRecipe('zanite_gemstone', 'Zanite Hoe'); if (r) return r;
            r = hoeRecipe('diamond', 'Diamond Hoe'); if (r) return r;
            r = hoeRecipe('iron_ingot', 'Iron Hoe'); if (r) return r;
            r = hoeRecipe('gold_ingot', 'Golden Hoe'); if (r) return r;
            r = hoeRecipe(B.COBBLESTONE, 'Stone Hoe'); if (r) return r;
            r = hoeRecipe(B.PLANKS, 'Wooden Hoe'); if (r) return r;

            // Leather Armor
            r = armorRecipe2H('leather', 'Leather Cap', 'helmet_leather', 1); if (r) return r;
            r = armorRecipeFull('leather', 'Leather Tunic', 'chest_leather', 3); if (r) return r;
            r = armorRecipeLegs('leather', 'Leather Pants', 'legs_leather', 2); if (r) return r;
            r = armorRecipeBoots('leather', 'Leather Boots', 'boots_leather', 1); if (r) return r;

            r = armorRecipe2H('iron_ingot', 'Iron Helmet', 'head_iron', 2); if (r) return r;
            r = armorRecipeFull('iron_ingot', 'Iron Chestplate', 'chest_iron', 5); if (r) return r;
            r = armorRecipeLegs('iron_ingot', 'Iron Leggings', 'legs_iron', 3); if (r) return r;
            r = armorRecipeBoots('iron_ingot', 'Iron Boots', 'boots_iron', 2); if (r) return r;

            r = armorRecipe2H('diamond', 'Diamond Helmet', 'head_diamond', 5); if (r) return r;
            r = armorRecipeFull('diamond', 'Diamond Chestplate', 'chest_diamond', 10); if (r) return r;
            r = armorRecipeLegs('diamond', 'Diamond Leggings', 'legs_diamond', 7); if (r) return r;
            r = armorRecipeBoots('diamond', 'Diamond Boots', 'boots_diamond', 5); if (r) return r;

            r = armorRecipe2H('gold_ingot', 'Gold Helmet', 'head_gold', 3); if (r) return r;
            r = armorRecipeFull('gold_ingot', 'Gold Chestplate', 'chest_gold', 7); if (r) return r;
            r = armorRecipeLegs('gold_ingot', 'Gold Leggings', 'legs_gold', 4); if (r) return r;
            r = armorRecipeBoots('gold_ingot', 'Gold Boots', 'boots_gold', 3); if (r) return r;

            // Mod Items (3x3 Shaped)
            r = armorRecipeBoots('slime_ball', 'Slime Boots', 'slime_boots', 2); if (r) return r;

            // --- Tinkers' Construct Hammers (all 6 tiers) ---
            // Netherite Hammer upgrade: diamond hammer + netherite ingot
            if ((getCount('diamond_hammer') === 1 || getCount('hammer') === 1) && getCount('netherite_ingot') === 1 && totalItems === 2) {
                return equip('netherite_hammer', { damage: 9, mineSpeed: 9.5, durability: 2031, is3x3: true, toolType: 'pickaxe', passive: '3x3 Area Miner' }, 'Netherite Hammer', 'Mines a 3x3 area of stone & ores.');
            }
            if (getCount('netherite_ingot') === 5 && getCount('stick') === 2 && totalItems === 7) {
                return equip('netherite_hammer', { damage: 9, mineSpeed: 9.5, durability: 2031, is3x3: true, toolType: 'pickaxe', passive: '3x3 Area Miner' }, 'Netherite Hammer', 'Mines a 3x3 area of stone & ores.');
            }
            if (getCount('diamond') === 5 && getCount('stick') === 2 && totalItems === 7) {
                return equip('diamond_hammer', { damage: 8, mineSpeed: 8.0, durability: 1561, is3x3: true, toolType: 'pickaxe', passive: '3x3 Area Miner' }, 'Diamond Hammer', 'Mines a 3x3 area of stone & ores.');
            }
            if (getCount('gold_ingot') === 5 && getCount('stick') === 2 && totalItems === 7) {
                return equip('gold_hammer', { damage: 5, mineSpeed: 9.0, durability: 70, is3x3: true, toolType: 'pickaxe', passive: '3x3 Area Miner' }, 'Golden Hammer', 'Mines a 3x3 area of stone & ores.');
            }
            if (getCount('iron_ingot') === 5 && getCount('stick') === 2 && totalItems === 7) {
                return equip('iron_hammer', { damage: 7, mineSpeed: 6.0, durability: 500, is3x3: true, toolType: 'pickaxe', passive: '3x3 Area Miner' }, 'Iron Hammer', 'Mines a 3x3 area of stone & ores.');
            }
            if ((getCount(B.COBBLESTONE) + getCount(B.STONE) + getCount(B.COBBLED_DEEPSLATE)) >= 5 && getCount('stick') === 2 && totalItems === (getCount(B.COBBLESTONE) + getCount(B.STONE) + getCount(B.COBBLED_DEEPSLATE) + 2)) {
                return equip('stone_hammer', { damage: 6, mineSpeed: 4.0, durability: 260, is3x3: true, toolType: 'pickaxe', passive: '3x3 Area Miner' }, 'Stone Hammer', 'Mines a 3x3 area of stone & ores.');
            }
            if (countAnyPlank === 5 && getCount('stick') === 2 && totalItems === 7) {
                return equip('wood_hammer', { damage: 5, mineSpeed: 2.5, durability: 120, is3x3: true, toolType: 'pickaxe', passive: '3x3 Area Miner' }, 'Wooden Hammer', 'Mines a 3x3 area of stone & ores.');
            }

            // --- Tinkers' Construct Excavators (all 6 tiers) ---
            // Netherite Excavator upgrade: diamond excavator + netherite ingot
            if ((getCount('diamond_excavator') === 1 || getCount('excavator') === 1) && getCount('netherite_ingot') === 1 && totalItems === 2) {
                return equip('netherite_excavator', { digSpeed: 9.5, damage: 8, durability: 2031, is3x3: true, toolType: 'shovel', passive: '3x3 Area Excavation' }, 'Netherite Excavator', 'Digs a 3x3 area of dirt, sand & gravel.');
            }
            if (getCount('netherite_ingot') === 3 && getCount('stick') === 2 && totalItems === 5) {
                return equip('netherite_excavator', { digSpeed: 9.5, damage: 8, durability: 2031, is3x3: true, toolType: 'shovel', passive: '3x3 Area Excavation' }, 'Netherite Excavator', 'Digs a 3x3 area of dirt, sand & gravel.');
            }
            if (getCount('diamond') === 3 && getCount('stick') === 2 && totalItems === 5) {
                return equip('diamond_excavator', { digSpeed: 8.0, damage: 7, durability: 1561, is3x3: true, toolType: 'shovel', passive: '3x3 Area Excavation' }, 'Diamond Excavator', 'Digs a 3x3 area of dirt, sand & gravel.');
            }
            if (getCount('gold_ingot') === 3 && getCount('stick') === 2 && totalItems === 5) {
                return equip('gold_excavator', { digSpeed: 9.0, damage: 4, durability: 70, is3x3: true, toolType: 'shovel', passive: '3x3 Area Excavation' }, 'Golden Excavator', 'Digs a 3x3 area of dirt, sand & gravel.');
            }
            if (getCount('iron_ingot') === 3 && getCount('stick') === 2 && totalItems === 5) {
                return equip('iron_excavator', { digSpeed: 6.0, damage: 6, durability: 500, is3x3: true, toolType: 'shovel', passive: '3x3 Area Excavation' }, 'Iron Excavator', 'Digs a 3x3 area of dirt, sand & gravel.');
            }
            if ((getCount(B.COBBLESTONE) + getCount(B.STONE) + getCount(B.COBBLED_DEEPSLATE)) === 3 && getCount('stick') === 2 && totalItems === 5) {
                return equip('stone_excavator', { digSpeed: 4.0, damage: 5, durability: 260, is3x3: true, toolType: 'shovel', passive: '3x3 Area Excavation' }, 'Stone Excavator', 'Digs a 3x3 area of dirt, sand & gravel.');
            }
            if (countAnyPlank === 3 && getCount('stick') === 2 && totalItems === 5) {
                return equip('wood_excavator', { digSpeed: 2.5, damage: 4, durability: 120, is3x3: true, toolType: 'shovel', passive: '3x3 Area Excavation' }, 'Wooden Excavator', 'Digs a 3x3 area of dirt, sand & gravel.');
            }

            if (!s[0] && !s[1] && !s[2] && 
                s[3] === 'iron_ingot' && !s[4] && s[5] === 'iron_ingot' && 
                !s[6] && s[7] === 'iron_ingot' && !s[8]) return mat('bucket', 'Bucket', 1);

            if (!s[0] && s[1] === B.SNOW && !s[2] && 
                s[3] === 'iron_ingot' && !s[4] && s[5] === 'iron_ingot' && 
                !s[6] && s[7] === 'iron_ingot' && !s[8]) return mat('water_bucket', 'Water Bucket', 1);

            if (!s[0] && s[1] === B.NETHERRACK && !s[2] && 
                s[3] === 'iron_ingot' && !s[4] && s[5] === 'iron_ingot' && 
                !s[6] && s[7] === 'iron_ingot' && !s[8]) return mat('lava_bucket', 'Lava Bucket', 1);

            r = spellRecipe(B.SNOW, 'ICE'); if (r) return r;
            r = spellRecipe('coal', 'FIRE'); if (r) return r;
            r = spellRecipe('gold_ingot', 'THUNDER'); if (r) return r;
            r = spellRecipe(B.STONE, 'EARTH'); if (r) return r;
            r = spellRecipe('gold_nugget', 'THUNDER'); if (r) return r; // Alternative
            r = spellRecipe(B.OBSIDIAN, 'DARK'); if (r) return r;
            r = spellRecipe('sugar', 'WIND'); if (r) return r;
            r = spellRecipe(B.LEAVES, 'POISON'); if (r) return r;
            r = spellRecipe(B.SAND, 'WATER'); if (r) return r;
            r = spellRecipe(B.ALIEN_STONE, 'VOID'); if (r) return r;
            r = spellRecipe(B.GLASS, 'LIGHT'); if (r) return r;
            r = spellRecipe('water_bucket', 'FROST'); if (r) return r; // Or similar
            r = spellRecipe(B.PLANKS, 'BUILDER'); if (r) return r;

            if (getCount(B.SAND) === 8 && totalItems === 8) return block(B.GLASS, 'Glass', 8);
            if (getCount(B.COBBLESTONE) === 8 && totalItems === 8) return block(B.FURNACE, 'Furnace', 1);
            if (isPlank(s[0]) && isPlank(s[1]) && !s[2] && isPlank(s[3]) && isPlank(s[4]) && !s[5] && isPlank(s[6]) && isPlank(s[7]) && !s[8]) return block(B.DUNGEON_DOOR, 'Door', 3);
            if (!s[0] && isPlank(s[1]) && isPlank(s[2]) && !s[3] && isPlank(s[4]) && isPlank(s[5]) && !s[6] && isPlank(s[7]) && isPlank(s[8])) return block(B.DUNGEON_DOOR, 'Door', 3);

            // Workstations & Furniture
            if (getCount(B.FURNACE) === 1 && countAnyLog === 4 && totalItems === 5) return block(B.SMOKER, 'Smoker', 1);

            if (countAnyPlank === 8 && totalItems === 8) return block(B.CHEST_BLOCK, 'Chest', 1);
            if (countAnyPlank === 6 && getCount('book') === 3 && totalItems === 9) return block(B.BOOKSHELF, 'Bookshelf', 1);
            if (countAnyPlank === 6 && totalItems === 6) return block(B.BOOKSHELF, 'Bookshelf', 1);
            if (getCount('stick') === 7 && totalItems === 7) return block(B.LADDER, 'Ladder', 3);

            // Storage Blocks (9 items -> 1 block)
            if (getCount('iron_nugget') === 9 && totalItems === 9) return mat('iron_ingot', 'Iron Ingot', 1);
            if (getCount('gold_nugget') === 9 && totalItems === 9) return mat('gold_ingot', 'Gold Ingot', 1);
            if (getCount('iron_ingot') === 9 && totalItems === 9) return block(B.IRON_BLOCK, 'Iron Block', 1);
            if (getCount('gold_ingot') === 9 && totalItems === 9) return block(B.GOLD_BLOCK, 'Gold Block', 1);
            if (getCount('diamond') === 9 && totalItems === 9) return block(B.DIAMOND_BLOCK, 'Diamond Block', 1);
            if (getCount('emerald') === 9 && totalItems === 9) return block(B.EMERALD_BLOCK, 'Emerald Block', 1);
            if ((getCount('lapis_lazuli') === 9 || getCount('lapis') === 9) && totalItems === 9) return block(B.LAPIS_BLOCK, 'Lapis Block', 1);
            if (getCount('redstone') === 9 && totalItems === 9) return block(B.REDSTONE_BLOCK, 'Redstone Block', 1);
            if (getCount('coal') === 9 && totalItems === 9) return block(B.COAL_BLOCK, 'Coal Block', 1);
            if ((getCount('bone_meal') === 9 || getCount('bone') === 9) && totalItems === 9) return block(B.BONE_BLOCK, 'Bone Block', 1);

            // Lanterns (8 Iron Nuggets surrounding 1 Torch or Soul Sand/Soul Torch)
            if (getCount('iron_nugget') === 8 && (getCount(B.TORCH) === 1 || getCount('torch') === 1) && totalItems === 9) return block(B.LANTERN, 'Lantern', 1);
            if (getCount('iron_nugget') === 8 && (getCount(B.SOUL_SAND) === 1 || getCount('soul_sand') === 1 || getCount(B.SOUL_TORCH) === 1 || getCount('soul_torch') === 1) && totalItems === 9) return block(B.SOUL_LANTERN, 'Soul Lantern', 1);

            // Utilities & Weapons
            if (getCount('stick') === 8 && getCount('leather') === 1 && totalItems === 9) return mat('item_frame', 'Item Frame', 1);
            if (getCount('iron_ingot') === 4 && getCount('redstone') === 1 && totalItems === 5) return mat('compass', 'Compass', 1);
            if (getCount('gold_ingot') === 4 && getCount('redstone') === 1 && totalItems === 5) return mat('clock', 'Clock', 1);
            if (getCount('stick') === 3 && getCount('string') === 3 && totalItems === 6) return equip('bow', { range: 25, damage: 6, passive: 'Ranged Weapon' }, 'Bow', 'Fires arrows at distant foes.');
            if (getCount('gold_ingot') === 8 && getCount('apple') === 1 && totalItems === 9) return { item: { type: 'food', subtype: 'golden_apple', name: 'Golden Apple', stackable: true, maxStack: 64, id: `food_golden_apple_${Date.now()}`, data: { heal: 20 }, description: 'Restores 20 health.' }, count: 1 };
            
            // Slabs (3 horizontal items in any row)
            const isRow = (r, t) => s[r*3] === t && s[r*3+1] === t && s[r*3+2] === t && totalItems === 3;
            if (isRow(0, B.PLANKS) || isRow(1, B.PLANKS) || isRow(2, B.PLANKS)) return block(B.OAK_SLAB, 'Oak Slab', 6);
            if (isRow(0, B.BIRCH_PLANKS) || isRow(1, B.BIRCH_PLANKS) || isRow(2, B.BIRCH_PLANKS)) return block(B.BIRCH_SLAB, 'Birch Slab', 6);
            if (isRow(0, B.COBBLESTONE) || isRow(1, B.COBBLESTONE) || isRow(2, B.COBBLESTONE)) return block(B.COBBLESTONE_SLAB, 'Cobblestone Slab', 6);
            if (isRow(0, B.STONE) || isRow(1, B.STONE) || isRow(2, B.STONE)) return block(B.STONE_SLAB, 'Stone Slab', 6);

            // Fences (Plank + Stick + Plank across 2 rows)
            const isFence = (plankType) => {
                if (s[0] === plankType && s[1] === 'stick' && s[2] === plankType &&
                    s[3] === plankType && s[4] === 'stick' && s[5] === plankType && !s[6] && !s[7] && !s[8]) return true;
                if (!s[0] && !s[1] && !s[2] &&
                    s[3] === plankType && s[4] === 'stick' && s[5] === plankType &&
                    s[6] === plankType && s[7] === 'stick' && s[8] === plankType) return true;
                return false;
            };
            if (isFence(B.PLANKS)) return block(B.OAK_FENCE, 'Oak Fence', 3);
            if (isFence(B.BIRCH_PLANKS)) return block(B.BIRCH_FENCE, 'Birch Fence', 3);
            if (isFence(B.PINE_PLANKS)) return block(B.SPRUCE_FENCE, 'Spruce Fence', 3);
            if (isFence(B.PALM_PLANKS)) return block(B.JUNGLE_FENCE, 'Jungle Fence', 3);
            if (isFence(B.ACACIA_PLANKS)) return block(B.ACACIA_FENCE, 'Acacia Fence', 3);
            if (isFence(B.DARK_OAK_PLANKS)) return block(B.DARK_OAK_FENCE, 'Dark Oak Fence', 3);
            if (isFence(B.MANGROVE_PLANKS)) return block(B.MANGROVE_FENCE, 'Mangrove Fence', 3);
            if (isFence(B.CHERRY_PLANKS)) return block(B.CHERRY_FENCE, 'Cherry Fence', 3);
            if (isFence(B.CRIMSON_PLANKS)) return block(B.CRIMSON_FENCE, 'Crimson Fence', 3);
            if (isFence(B.WARPED_PLANKS)) return block(B.WARPED_FENCE, 'Warped Fence', 3);
            if (isFence(B.AUTUMN_PLANKS)) return block(B.AUTUMN_FENCE, 'Autumn Fence', 3);

            // Fence Gates (Stick + Plank + Stick across 2 rows)
            const isGate = (plankType) => {
                if (s[0] === 'stick' && s[1] === plankType && s[2] === 'stick' &&
                    s[3] === 'stick' && s[4] === plankType && s[5] === 'stick' && !s[6] && !s[7] && !s[8]) return true;
                if (!s[0] && !s[1] && !s[2] &&
                    s[3] === 'stick' && s[4] === plankType && s[5] === 'stick' &&
                    s[6] === 'stick' && s[7] === plankType && s[8] === 'stick') return true;
                return false;
            };
            if (isGate(B.PLANKS)) return block(B.OAK_FENCE_GATE, 'Oak Fence Gate', 1);
            if (isGate(B.BIRCH_PLANKS)) return block(B.BIRCH_FENCE_GATE, 'Birch Fence Gate', 1);
            if (isGate(B.PINE_PLANKS)) return block(B.SPRUCE_FENCE_GATE, 'Spruce Fence Gate', 1);
            if (isGate(B.PALM_PLANKS)) return block(B.JUNGLE_FENCE_GATE, 'Jungle Fence Gate', 1);
            if (isGate(B.ACACIA_PLANKS)) return block(B.ACACIA_FENCE_GATE, 'Acacia Fence Gate', 1);
            if (isGate(B.DARK_OAK_PLANKS)) return block(B.DARK_OAK_FENCE_GATE, 'Dark Oak Fence Gate', 1);
            if (isGate(B.MANGROVE_PLANKS)) return block(B.MANGROVE_FENCE_GATE, 'Mangrove Fence Gate', 1);
            if (isGate(B.CHERRY_PLANKS)) return block(B.CHERRY_FENCE_GATE, 'Cherry Fence Gate', 1);
            if (isGate(B.CRIMSON_PLANKS)) return block(B.CRIMSON_FENCE_GATE, 'Crimson Fence Gate', 1);
            if (isGate(B.WARPED_PLANKS)) return block(B.WARPED_FENCE_GATE, 'Warped Fence Gate', 1);
            if (isGate(B.AUTUMN_PLANKS)) return block(B.AUTUMN_FENCE_GATE, 'Autumn Fence Gate', 1);

            // Walls (2 rows of 3)
            const isWallMat = (mat) => {
                if (s[0] === mat && s[1] === mat && s[2] === mat && s[3] === mat && s[4] === mat && s[5] === mat && !s[6] && !s[7] && !s[8]) return true;
                if (!s[0] && !s[1] && !s[2] && s[3] === mat && s[4] === mat && s[5] === mat && s[6] === mat && s[7] === mat && s[8] === mat) return true;
                return false;
            };
            if (isWallMat(B.COBBLESTONE)) return block(B.COBBLESTONE_WALL, 'Cobblestone Wall', 6);
            if (isWallMat(B.MOSSY_COBBLESTONE)) return block(B.MOSSY_COBBLESTONE_WALL, 'Mossy Cobblestone Wall', 6);
            if (isWallMat(B.STONE_BRICKS)) return block(B.STONE_BRICK_WALL, 'Stone Brick Wall', 6);
            if (isWallMat(B.STONE)) return block(B.STONE_WALL, 'Stone Wall', 6);
            if (isWallMat(B.SANDSTONE)) return block(B.SANDSTONE_WALL, 'Sandstone Wall', 6);
            if (isWallMat(B.BLACKSTONE)) return block(B.BLACKSTONE_WALL, 'Blackstone Wall', 6);
            if (isWallMat(B.HOLYSTONE)) return block(B.HOLYSTONE_WALL, 'Holystone Wall', 6);
            if (isWallMat(B.BRICKS)) return block(B.BRICK_WALL, 'Brick Wall', 6);
            if (isWallMat(B.NETHER_BRICKS)) return block(B.NETHER_BRICK_WALL, 'Nether Brick Wall', 6);

            // Stairs
            const isStairMat = (mat) => {
                if (s[0] === mat && !s[1] && !s[2] && s[3] === mat && s[4] === mat && !s[5] && s[6] === mat && s[7] === mat && s[8] === mat) return true;
                if (!s[0] && !s[1] && s[2] === mat && !s[3] && s[4] === mat && s[5] === mat && s[6] === mat && s[7] === mat && s[8] === mat) return true;
                return false;
            };
            if (isStairMat(B.PLANKS)) return block(B.OAK_STAIRS, 'Oak Stairs', 4);
            if (isStairMat(B.BIRCH_PLANKS)) return block(B.BIRCH_STAIRS, 'Birch Stairs', 4);
            if (isStairMat(B.COBBLESTONE)) return block(B.COBBLESTONE_STAIRS, 'Cobblestone Stairs', 4);
            if (isStairMat(B.STONE)) return block(B.STONE_STAIRS, 'Stone Stairs', 4);



            // Beds (3 matching wool in row, 3 planks directly below)
            const woolBedList = [
                { wool: B.RED_WOOL, bed: B.RED_BED, name: 'Red Bed' },
                { wool: B.WOOL, bed: B.WHITE_BED, name: 'White Bed' },
                { wool: B.WHITE_WOOL, bed: B.WHITE_BED, name: 'White Bed' },
                { wool: B.BLUE_WOOL, bed: B.BLUE_BED, name: 'Blue Bed' },
                { wool: B.YELLOW_WOOL, bed: B.YELLOW_BED, name: 'Yellow Bed' },
                { wool: B.GREEN_WOOL, bed: B.GREEN_BED, name: 'Green Bed' },
                { wool: B.BLACK_WOOL, bed: B.BLACK_BED, name: 'Black Bed' },
                { wool: B.PURPLE_WOOL, bed: B.PURPLE_BED, name: 'Purple Bed' },
                { wool: B.ORANGE_WOOL, bed: B.ORANGE_BED, name: 'Orange Bed' },
                { wool: B.PINK_WOOL, bed: B.PINK_BED, name: 'Pink Bed' },
                { wool: B.CYAN_WOOL, bed: B.CYAN_BED, name: 'Cyan Bed' },
                { wool: B.LIME_WOOL, bed: B.LIME_BED, name: 'Lime Bed' },
                { wool: B.GRAY_WOOL, bed: B.GRAY_BED, name: 'Gray Bed' },
                { wool: B.LIGHT_BLUE_WOOL, bed: B.LIGHT_BLUE_BED, name: 'Light Blue Bed' },
                { wool: B.BROWN_WOOL, bed: B.BROWN_BED, name: 'Brown Bed' },
                { wool: B.MAGENTA_WOOL, bed: B.MAGENTA_BED, name: 'Magenta Bed' },
                { wool: B.LIGHT_GRAY_WOOL, bed: B.LIGHT_GRAY_BED, name: 'Light Gray Bed' }
            ];
            for (const wb of woolBedList) {
                // Rows 0 and 1
                if (s[0] === wb.wool && s[1] === wb.wool && s[2] === wb.wool &&
                    isPlank(s[3]) && isPlank(s[4]) && isPlank(s[5]) && totalItems === 6) {
                    return block(wb.bed, wb.name, 1);
                }
                // Rows 1 and 2
                if (s[3] === wb.wool && s[4] === wb.wool && s[5] === wb.wool &&
                    isPlank(s[6]) && isPlank(s[7]) && isPlank(s[8]) && totalItems === 6) {
                    return block(wb.bed, wb.name, 1);
                }
            }

            return null;
    }

    _consumeCraftingSlots(result) {
        // Remove 1 from each crafting slot; return empty containers (e.g. buckets)
        for (let i = 0; i < 9; i++) {
            const slot = this.craftingSlots[i];
            if (slot) {
                const sub = slot.item.subtype;
                const isBucket = (sub === 'water_bucket' || sub === 'lava_bucket' || sub === 'milk_bucket');
                slot.count -= 1;
                if (slot.count <= 0) {
                    if (isBucket) {
                        this.craftingSlots[i] = {
                            item: { type: 'equipment', subtype: 'bucket', name: 'Bucket', stackable: true, maxStack: 16, data: {} },
                            count: 1
                        };
                    } else {
                        this.craftingSlots[i] = null;
                    }
                } else if (isBucket) {
                    const bucketItem = { type: 'equipment', subtype: 'bucket', name: 'Bucket', stackable: true, maxStack: 16, data: {} };
                    if (this.currentPlayer && this.currentPlayer.inventory) {
                        const added = this.currentPlayer.inventory.addItem(bucketItem, 1);
                        if (!added) {
                            const em = (window.game && window.game.entityManager) || this.currentPlayer.manager;
                            if (em) em.spawnItem(bucketItem, 1, this.currentPlayer.position);
                        }
                    }
                }
            }
        }
    }

    showRecipeBook() {
        const list = document.getElementById('recipe-list');
        if (!list) return;
        const B = (typeof BLOCKS !== 'undefined') ? BLOCKS : window.BLOCKS;
        if (!B) return;

        const mat = (id) => ({ type: 'material', subtype: id });
        const blk = (id) => ({ type: 'block', subtype: id });
        const eqp = (id) => ({ type: 'equipment', subtype: id });
        const spl = (id) => ({ type: 'spell', subtype: id });
        const wnd = (id) => ({ type: 'wand', subtype: id });
        const _ = null;

        // Structured recipes for visual grid
        const recipes = [
            { name: "Oak Planks (4)", desc: "Basic building block.", grid: [[_,_,_],[_,blk(B.WOOD),_],[_,_,_]], out: blk(B.PLANKS), outCount: 4, needs3x3: false },
            { name: "Birch Planks (4)", desc: "Light wood building block.", grid: [[_,_,_],[_,blk(B.BIRCH_WOOD),_],[_,_,_]], out: blk(B.BIRCH_PLANKS), outCount: 4, needs3x3: false },
            { name: "Blaze Powder (2)", desc: "Crafted from a Blaze Rod.", grid: [[_,_,_],[_,mat('blaze_rod'),_],[_,_,_]], out: mat('blaze_powder'), outCount: 2, needs3x3: false },
            { name: "Eye of Ender", desc: "Locates Strongholds and activates End Portals.", grid: [[_,_,_],[mat('ender_pearl'),mat('blaze_powder'),_],[_,_,_]], out: mat('eye_of_ender'), outCount: 1, needs3x3: false },
            { name: "Stick (4)", desc: "Used for tools.", grid: [[_,_,_],[_,blk(B.PLANKS),_],[_,blk(B.PLANKS),_]], out: mat('stick'), outCount: 4, needs3x3: false },
            { name: "Crafting Table", desc: "Unlocks 3x3 crafting.", grid: [[_,_,_],[blk(B.PLANKS),blk(B.PLANKS),_],[blk(B.PLANKS),blk(B.PLANKS),_]], out: blk(B.CRAFTING_TABLE), outCount: 1, needs3x3: false },
            { name: "Torch (4)", desc: "Lights up the dark.", grid: [[_,_,_],[_,mat('coal'),_],[_,mat('stick'),_]], out: blk(B.TORCH), outCount: 4, needs3x3: false },
            { name: "Iron Nugget (9)", desc: "Crafted from 1 iron ingot.", grid: [[_,_,_],[_,mat('iron_ingot'),_],[_,_,_]], out: mat('iron_nugget'), outCount: 9, needs3x3: false },
            { name: "Lantern", desc: "Authentic Minecraft lantern.", grid: [[mat('iron_nugget'),mat('iron_nugget'),mat('iron_nugget')],[mat('iron_nugget'),blk(B.TORCH),mat('iron_nugget')],[mat('iron_nugget'),mat('iron_nugget'),mat('iron_nugget')]], out: blk(B.LANTERN), outCount: 1, needs3x3: true },
            { name: "Soul Lantern", desc: "Soul fire lantern crafted with soul sand.", grid: [[mat('iron_nugget'),mat('iron_nugget'),mat('iron_nugget')],[mat('iron_nugget'),blk(B.SOUL_SAND),mat('iron_nugget')],[mat('iron_nugget'),mat('iron_nugget'),mat('iron_nugget')]], out: blk(B.SOUL_LANTERN), outCount: 1, needs3x3: true },
            { name: "Iron Sword", desc: "Deals moderate damage.", grid: [[_,mat('iron_ingot'),_],[_,mat('iron_ingot'),_],[_,mat('stick'),_]], out: eqp('sword_iron'), outCount: 1, needs3x3: true },
            { name: "Shark Sword", desc: "High damage weapon.", grid: [[_,mat('shark_tooth'),_],[_,mat('shark_tooth'),_],[_,mat('stick'),_]], out: eqp('sword_shark'), outCount: 1, needs3x3: true },
            { name: "Iron Pickaxe", desc: "Mines ores.", grid: [[mat('iron_ingot'),mat('iron_ingot'),mat('iron_ingot')],[_,mat('stick'),_],[_,mat('stick'),_]], out: eqp('pickaxe_iron'), outCount: 1, needs3x3: true },
            { name: "Iron Axe", desc: "Chops wood quickly.", grid: [[mat('iron_ingot'),mat('iron_ingot'),_],[mat('iron_ingot'),mat('stick'),_],[_,mat('stick'),_]], out: eqp('axe_iron'), outCount: 1, needs3x3: true },
            { name: "Iron Helmet", desc: "Basic protection.", grid: [[mat('iron_ingot'),mat('iron_ingot'),mat('iron_ingot')],[mat('iron_ingot'),_,mat('iron_ingot')],[_,_,_]], out: eqp('helmet_iron'), outCount: 1, needs3x3: true },
            { name: "Iron Chestplate", desc: "Solid defense.", grid: [[mat('iron_ingot'),_,mat('iron_ingot')],[mat('iron_ingot'),mat('iron_ingot'),mat('iron_ingot')],[mat('iron_ingot'),mat('iron_ingot'),mat('iron_ingot')]], out: eqp('chest_iron'), outCount: 1, needs3x3: true },
            { name: "Basic Wand", desc: "Casts spells.", grid: [[_,_,_],[_,mat('iron_ingot'),_],[mat('stick'),_,_]], out: wnd('wand_basic'), outCount: 1, needs3x3: false },
            { name: "Fire Wand", desc: "Empowers fire magic.", grid: [[_,_,mat('coal')],[_,wnd('wand_basic'),_],[_,_,_]], out: wnd('wand_fire'), outCount: 1, needs3x3: false },
            { name: "Ice Wand", desc: "Empowers ice magic.", grid: [[_,_,blk(B.SNOW)],[_,wnd('wand_basic'),_],[_,_,_]], out: wnd('wand_ice'), outCount: 1, needs3x3: false },
            { name: "Furnace", desc: "Smelts ores.", grid: [[blk(B.COBBLESTONE),blk(B.COBBLESTONE),blk(B.COBBLESTONE)],[blk(B.COBBLESTONE),_,blk(B.COBBLESTONE)],[blk(B.COBBLESTONE),blk(B.COBBLESTONE),blk(B.COBBLESTONE)]], out: blk(B.FURNACE), outCount: 1, needs3x3: true },
            { name: "Chest", desc: "Stores items.", grid: [[blk(B.PLANKS),blk(B.PLANKS),blk(B.PLANKS)],[blk(B.PLANKS),_,blk(B.PLANKS)],[blk(B.PLANKS),blk(B.PLANKS),blk(B.PLANKS)]], out: blk(B.CHEST_BLOCK), outCount: 1, needs3x3: true },
            { name: "Flint and Steel", desc: "Ignites TNT.", grid: [[_,_,_],[mat('iron_ingot'),_,_],[_,blk(B.GRAVEL),_]], out: eqp('flint_and_steel'), outCount: 1, needs3x3: false },
            { name: "Bucket", desc: "Holds liquids.", grid: [[_,_,_],[mat('iron_ingot'),_,mat('iron_ingot')],[_,mat('iron_ingot'),_]], out: mat('bucket'), outCount: 1, needs3x3: true },
            { name: "Water Bucket", desc: "Crafted from snow.", grid: [[_,blk(B.SNOW),_],[mat('iron_ingot'),_,mat('iron_ingot')],[_,mat('iron_ingot'),_]], out: mat('water_bucket'), outCount: 1, needs3x3: true },
            { name: "Lava Bucket", desc: "Crafted from netherrack.", grid: [[_,blk(B.NETHERRACK),_],[mat('iron_ingot'),_,mat('iron_ingot')],[_,mat('iron_ingot'),_]], out: mat('lava_bucket'), outCount: 1, needs3x3: true },
            { name: "Fire Spell", desc: "Crafted magic.", grid: [[_,mat('coal'),_],[mat('coal'),mat('mana_crystal'),mat('coal')],[_,mat('coal'),_]], out: spl('FIRE'), outCount: 1, needs3x3: true },
            { name: "Ice Spell", desc: "Crafted magic.", grid: [[_,blk(B.SNOW),_],[blk(B.SNOW),mat('mana_crystal'),blk(B.SNOW)],[_,blk(B.SNOW),_]], out: spl('ICE'), outCount: 1, needs3x3: true },
            { name: "Thunder Spell", desc: "Crafted magic.", grid: [[_,mat('gold_ingot'),_],[mat('gold_ingot'),mat('mana_crystal'),mat('gold_ingot')],[_,mat('gold_ingot'),_]], out: spl('THUNDER'), outCount: 1, needs3x3: true },
            { name: "Earth Spell", desc: "Crafted magic.", grid: [[_,blk(B.STONE),_],[blk(B.STONE),mat('mana_crystal'),blk(B.STONE)],[_,blk(B.STONE),_]], out: spl('EARTH'), outCount: 1, needs3x3: true },
            { name: "Dark Spell", desc: "Crafted magic.", grid: [[_,blk(B.OBSIDIAN),_],[blk(B.OBSIDIAN),mat('mana_crystal'),blk(B.OBSIDIAN)],[_,blk(B.OBSIDIAN),_]], out: spl('DARK'), outCount: 1, needs3x3: true },
            { name: "Wind Spell", desc: "Crafted magic.", grid: [[_,mat('sugar'),_],[mat('sugar'),mat('mana_crystal'),mat('sugar')],[_,mat('sugar'),_]], out: spl('WIND'), outCount: 1, needs3x3: true },
            { name: "Poison Spell", desc: "Crafted magic.", grid: [[_,blk(B.LEAVES),_],[blk(B.LEAVES),mat('mana_crystal'),blk(B.LEAVES)],[_,blk(B.LEAVES),_]], out: spl('POISON'), outCount: 1, needs3x3: true },

            { name: "Wooden Sword", desc: "Basic weapon.", grid: [[_,blk(B.PLANKS),_],[_,blk(B.PLANKS),_],[_,mat('stick'),_]], out: eqp('sword_wood'), outCount: 1, needs3x3: true },
            { name: "Stone Sword", desc: "Decent weapon.", grid: [[_,blk(B.COBBLESTONE),_],[_,blk(B.COBBLESTONE),_],[_,mat('stick'),_]], out: eqp('sword_stone'), outCount: 1, needs3x3: true },
            { name: "Gold Sword", desc: "Fast but weak.", grid: [[_,mat('gold_ingot'),_],[_,mat('gold_ingot'),_],[_,mat('stick'),_]], out: eqp('sword_gold'), outCount: 1, needs3x3: true },
            { name: "Diamond Sword", desc: "Strongest weapon.", grid: [[_,mat('diamond'),_],[_,mat('diamond'),_],[_,mat('stick'),_]], out: eqp('sword_diamond'), outCount: 1, needs3x3: true },

            { name: "Wooden Pickaxe", desc: "Basic miner.", grid: [[blk(B.PLANKS),blk(B.PLANKS),blk(B.PLANKS)],[_,mat('stick'),_],[_,mat('stick'),_]], out: eqp('pickaxe_wood'), outCount: 1, needs3x3: true },
            { name: "Stone Pickaxe", desc: "Mines iron.", grid: [[blk(B.COBBLESTONE),blk(B.COBBLESTONE),blk(B.COBBLESTONE)],[_,mat('stick'),_],[_,mat('stick'),_]], out: eqp('pickaxe_stone'), outCount: 1, needs3x3: true },
            { name: "Gold Pickaxe", desc: "Fast mining.", grid: [[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')],[_,mat('stick'),_],[_,mat('stick'),_]], out: eqp('pickaxe_gold'), outCount: 1, needs3x3: true },
            { name: "Diamond Pickaxe", desc: "Mines everything.", grid: [[mat('diamond'),mat('diamond'),mat('diamond')],[_,mat('stick'),_],[_,mat('stick'),_]], out: eqp('pickaxe_diamond'), outCount: 1, needs3x3: true },

            { name: "Wooden Axe", desc: "Basic chopper.", grid: [[blk(B.PLANKS),blk(B.PLANKS),_],[blk(B.PLANKS),mat('stick'),_],[_,mat('stick'),_]], out: eqp('axe_wood'), outCount: 1, needs3x3: true },
            { name: "Stone Axe", desc: "Decent chopper.", grid: [[blk(B.COBBLESTONE),blk(B.COBBLESTONE),_],[blk(B.COBBLESTONE),mat('stick'),_],[_,mat('stick'),_]], out: eqp('axe_stone'), outCount: 1, needs3x3: true },
            { name: "Gold Axe", desc: "Fast chopper.", grid: [[mat('gold_ingot'),mat('gold_ingot'),_],[mat('gold_ingot'),mat('stick'),_],[_,mat('stick'),_]], out: eqp('axe_gold'), outCount: 1, needs3x3: true },
            { name: "Diamond Axe", desc: "Best chopper.", grid: [[mat('diamond'),mat('diamond'),_],[mat('diamond'),mat('stick'),_],[_,mat('stick'),_]], out: eqp('axe_diamond'), outCount: 1, needs3x3: true },
            { name: "Iron Hoe", desc: "Tills soil for farming.", grid: [[mat('iron_ingot'),mat('iron_ingot'),_],[_,mat('stick'),_],[_,mat('stick'),_]], out: eqp('hoe_iron'), outCount: 1, needs3x3: true },
            { name: "Diamond Hoe", desc: "Long-lasting farming tool.", grid: [[mat('diamond'),mat('diamond'),_],[_,mat('stick'),_],[_,mat('stick'),_]], out: eqp('hoe_diamond'), outCount: 1, needs3x3: true },
            { name: "Bread", desc: "Restores hunger.", grid: [[_,_,_],[mat('wheat'),mat('wheat'),mat('wheat')],[_,_,_]], out: { type: 'food', subtype: 'bread' }, outCount: 1, needs3x3: false },
            { name: "Cookie (8)", desc: "Sweet snack made with cocoa.", grid: [[_,_,_],[mat('wheat'),mat('cocoa_beans'),mat('wheat')],[_,_,_]], out: { type: 'food', subtype: 'cookie' }, outCount: 8, needs3x3: false },
            { name: "Cake", desc: "Celebratory multi-slice food.", grid: [[mat('sugar'),mat('egg'),mat('sugar')],[mat('wheat'),mat('wheat'),mat('wheat')],[_,_,_]], out: blk(B.CAKE), outCount: 1, needs3x3: true },
            { name: "Pumpkin Pie", desc: "Hearty dessert.", grid: [[_,_,_],[blk(B.PUMPKIN),mat('sugar'),mat('egg')],[_,_,_]], out: { type: 'food', subtype: 'pumpkin_pie' }, outCount: 1, needs3x3: false },
            { name: "Beetroot Soup", desc: "Nutritious red stew.", grid: [[mat('beetroot'),mat('beetroot'),mat('beetroot')],[mat('beetroot'),mat('beetroot'),mat('beetroot')],[_,_,_]], out: { type: 'food', subtype: 'beetroot_soup' }, outCount: 1, needs3x3: true },
            { name: "Golden Carrot", desc: "High-saturation golden food.", grid: [[mat('gold_nugget'),mat('gold_nugget'),mat('gold_nugget')],[mat('gold_nugget'),mat('carrot'),mat('gold_nugget')],[mat('gold_nugget'),mat('gold_nugget'),mat('gold_nugget')]], out: { type: 'food', subtype: 'golden_carrot' }, outCount: 1, needs3x3: true },
            { name: "Stonecutter", desc: "Precision masonry saw workstation.", grid: [[_,mat('iron_ingot'),_],[blk(B.STONE),blk(B.STONE),blk(B.STONE)],[_,_,_]], out: blk(B.STONECUTTER), outCount: 1, needs3x3: true },
            { name: "Dripstone Block", desc: "Solid dripstone block.", grid: [[_,_,_],[blk(B.POINTED_DRIPSTONE_DOWN),blk(B.POINTED_DRIPSTONE_DOWN),_],[blk(B.POINTED_DRIPSTONE_DOWN),blk(B.POINTED_DRIPSTONE_DOWN),_]], out: blk(B.DRIPSTONE_BLOCK), outCount: 1, needs3x3: false },
            { name: "Slime Block", desc: "Bouncy compact gelatin block.", grid: [[mat('slime_ball'),mat('slime_ball'),mat('slime_ball')],[mat('slime_ball'),mat('slime_ball'),mat('slime_ball')],[mat('slime_ball'),mat('slime_ball'),mat('slime_ball')]], out: blk(B.SLIME_BLOCK), outCount: 1, needs3x3: true },
            { name: "Magma Cream", desc: "Infused slimeball for potions and fire wands.", grid: [[_,_,_],[mat('slime_ball'),mat('blaze_powder'),_],[_,_,_]], out: mat('lavaslime_ball'), outCount: 1, needs3x3: false },
            { name: "TNT", desc: "Explosive block.", grid: [[mat('gunpowder'),blk(B.SAND),mat('gunpowder')],[blk(B.SAND),mat('gunpowder'),blk(B.SAND)],[mat('gunpowder'),blk(B.SAND),mat('gunpowder')]], out: blk(B.TNT), outCount: 1, needs3x3: true },
            { name: "Lead (2)", desc: "Leash for creatures.", grid: [[mat('string'),mat('string'),_],[mat('string'),mat('slime_ball'),_],[_,_,mat('string')]], out: mat('lead'), outCount: 2, needs3x3: true },
            { name: "Pumpkin Seeds (4)", desc: "Plant to grow pumpkins.", grid: [[_,_,_],[_,blk(B.PUMPKIN),_],[_,_,_]], out: mat('pumpkin_seeds'), outCount: 4, needs3x3: false },
            { name: "Slime Boots", desc: "Bouncy jumps & no fall damage.", grid: [[_,_,_],[mat('slime_ball'),_,mat('slime_ball')],[mat('slime_ball'),_,mat('slime_ball')]], out: eqp('slime_boots'), outCount: 1, needs3x3: true },
            { name: "Cloud Parachute", desc: "Slow fall glide through the air.", grid: [[mat('feather'),mat('feather'),mat('feather')],[mat('string'),_,mat('string')],[_,_,_]], out: eqp('cloud_parachute'), outCount: 1, needs3x3: true },
            { name: "Golden Feather", desc: "Passive low gravity & fall immunity.", grid: [[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')],[mat('gold_ingot'),mat('feather'),mat('gold_ingot')],[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')]], out: eqp('golden_feather'), outCount: 1, needs3x3: true },
            // Hammers (all 6 tiers)
            { name: "Wooden Hammer", desc: "Mines a 3x3 area of stone & ores.", grid: [[blk(B.PLANKS),blk(B.PLANKS),blk(B.PLANKS)],[blk(B.PLANKS),mat('stick'),blk(B.PLANKS)],[_,mat('stick'),_]], out: eqp('wood_hammer'), outCount: 1, needs3x3: true },
            { name: "Stone Hammer", desc: "Mines a 3x3 area of stone & ores.", grid: [[blk(B.COBBLESTONE),blk(B.COBBLESTONE),blk(B.COBBLESTONE)],[blk(B.COBBLESTONE),mat('stick'),blk(B.COBBLESTONE)],[_,mat('stick'),_]], out: eqp('stone_hammer'), outCount: 1, needs3x3: true },
            { name: "Iron Hammer", desc: "Mines a 3x3 area of stone & ores.", grid: [[mat('iron_ingot'),mat('iron_ingot'),mat('iron_ingot')],[mat('iron_ingot'),mat('stick'),mat('iron_ingot')],[_,mat('stick'),_]], out: eqp('iron_hammer'), outCount: 1, needs3x3: true },
            { name: "Golden Hammer", desc: "Fast 3x3 area mining.", grid: [[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')],[mat('gold_ingot'),mat('stick'),mat('gold_ingot')],[_,mat('stick'),_]], out: eqp('gold_hammer'), outCount: 1, needs3x3: true },
            { name: "Diamond Hammer", desc: "High-durability 3x3 area mining.", grid: [[mat('diamond'),mat('diamond'),mat('diamond')],[mat('diamond'),mat('stick'),mat('diamond')],[_,mat('stick'),_]], out: eqp('diamond_hammer'), outCount: 1, needs3x3: true },
            { name: "Netherite Hammer", desc: "Ultimate fireproof 3x3 area miner.", grid: [[_,_,_],[eqp('diamond_hammer'),mat('netherite_ingot'),_],[_,_,_]], out: eqp('netherite_hammer'), outCount: 1, needs3x3: false },

            // Excavators (all 6 tiers)
            { name: "Wooden Excavator", desc: "Digs a 3x3 area of dirt, sand & gravel.", grid: [[_,blk(B.PLANKS),_],[blk(B.PLANKS),mat('stick'),blk(B.PLANKS)],[_,mat('stick'),_]], out: eqp('wood_excavator'), outCount: 1, needs3x3: true },
            { name: "Stone Excavator", desc: "Digs a 3x3 area of dirt, sand & gravel.", grid: [[_,blk(B.COBBLESTONE),_],[blk(B.COBBLESTONE),mat('stick'),blk(B.COBBLESTONE)],[_,mat('stick'),_]], out: eqp('stone_excavator'), outCount: 1, needs3x3: true },
            { name: "Iron Excavator", desc: "Digs a 3x3 area of dirt, sand & gravel.", grid: [[_,mat('iron_ingot'),_],[mat('iron_ingot'),mat('stick'),mat('iron_ingot')],[_,mat('stick'),_]], out: eqp('iron_excavator'), outCount: 1, needs3x3: true },
            { name: "Golden Excavator", desc: "Fast 3x3 excavation.", grid: [[_,mat('gold_ingot'),_],[mat('gold_ingot'),mat('stick'),mat('gold_ingot')],[_,mat('stick'),_]], out: eqp('gold_excavator'), outCount: 1, needs3x3: true },
            { name: "Diamond Excavator", desc: "High-durability 3x3 excavation.", grid: [[_,mat('diamond'),_],[mat('diamond'),mat('stick'),mat('diamond')],[_,mat('stick'),_]], out: eqp('diamond_excavator'), outCount: 1, needs3x3: true },
            { name: "Netherite Excavator", desc: "Ultimate fireproof 3x3 excavator.", grid: [[_,_,_],[eqp('diamond_excavator'),mat('netherite_ingot'),_],[_,_,_]], out: eqp('netherite_excavator'), outCount: 1, needs3x3: false },

            { name: "Leather Cap", desc: "Basic protective cap.", grid: [[mat('leather'),mat('leather'),mat('leather')],[mat('leather'),_,mat('leather')],[_,_,_]], out: eqp('helmet_leather'), outCount: 1, needs3x3: true },
            { name: "Leather Tunic", desc: "Basic protective tunic.", grid: [[mat('leather'),_,mat('leather')],[mat('leather'),mat('leather'),mat('leather')],[mat('leather'),mat('leather'),mat('leather')]], out: eqp('chest_leather'), outCount: 1, needs3x3: true },
            { name: "Leather Pants", desc: "Basic protective pants.", grid: [[mat('leather'),mat('leather'),mat('leather')],[mat('leather'),_,mat('leather')],[mat('leather'),_,mat('leather')]], out: eqp('legs_leather'), outCount: 1, needs3x3: true },
            { name: "Leather Boots", desc: "Basic protective boots.", grid: [[_,_,_],[mat('leather'),_,mat('leather')],[mat('leather'),_,mat('leather')]], out: eqp('boots_leather'), outCount: 1, needs3x3: true },

            { name: "Gold Helmet", desc: "Shiny protection.", grid: [[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')],[mat('gold_ingot'),_,mat('gold_ingot')],[_,_,_]], out: eqp('helmet_gold'), outCount: 1, needs3x3: true },
            { name: "Gold Chestplate", desc: "Shiny protection.", grid: [[mat('gold_ingot'),_,mat('gold_ingot')],[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')],[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')]], out: eqp('chest_gold'), outCount: 1, needs3x3: true },
            { name: "Gold Leggings", desc: "Shiny protection.", grid: [[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')],[mat('gold_ingot'),_,mat('gold_ingot')],[mat('gold_ingot'),_,mat('gold_ingot')]], out: eqp('legs_gold'), outCount: 1, needs3x3: true },
            { name: "Gold Boots", desc: "Shiny protection.", grid: [[_,_,_],[mat('gold_ingot'),_,mat('gold_ingot')],[mat('gold_ingot'),_,mat('gold_ingot')]], out: eqp('boots_gold'), outCount: 1, needs3x3: true },

            { name: "Diamond Helmet", desc: "Strong protection.", grid: [[mat('diamond'),mat('diamond'),mat('diamond')],[mat('diamond'),_,mat('diamond')],[_,_,_]], out: eqp('helmet_diamond'), outCount: 1, needs3x3: true },
            { name: "Diamond Chestplate", desc: "Strong protection.", grid: [[mat('diamond'),_,mat('diamond')],[mat('diamond'),mat('diamond'),mat('diamond')],[mat('diamond'),mat('diamond'),mat('diamond')]], out: eqp('chest_diamond'), outCount: 1, needs3x3: true },
            { name: "Diamond Leggings", desc: "Strong protection.", grid: [[mat('diamond'),mat('diamond'),mat('diamond')],[mat('diamond'),_,mat('diamond')],[mat('diamond'),_,mat('diamond')]], out: eqp('legs_diamond'), outCount: 1, needs3x3: true },
            { name: "Diamond Boots", desc: "Strong protection.", grid: [[_,_,_],[mat('diamond'),_,mat('diamond')],[mat('diamond'),_,mat('diamond')]], out: eqp('boots_diamond'), outCount: 1, needs3x3: true },

            { name: "Nature Wand", desc: "Heals you.", grid: [[_,_,blk(B.LEAVES)],[_,wnd('wand_basic'),_],[_,_,_]], out: wnd('wand_nature'), outCount: 1, needs3x3: false },

            { name: "Stone Bricks (4)", desc: "Building block.", grid: [[_,_,_],[blk(B.STONE),blk(B.STONE),_],[blk(B.STONE),blk(B.STONE),_]], out: blk(B.STONE_BRICKS), outCount: 4, needs3x3: false },
            { name: "Bricks (4)", desc: "Building block.", grid: [[_,_,_],[blk(B.CLAY),blk(B.CLAY),_],[blk(B.CLAY),blk(B.CLAY),_]], out: blk(B.BRICKS), outCount: 4, needs3x3: false },
            { name: "Sandstone (4)", desc: "Building block.", grid: [[_,_,_],[blk(B.SAND),blk(B.SAND),_],[blk(B.SAND),blk(B.SAND),_]], out: blk(B.SANDSTONE), outCount: 4, needs3x3: false },
            { name: "Mossy Cobble", desc: "Building block.", grid: [[_,_,_],[blk(B.COBBLESTONE),blk(B.LEAVES),_],[_,_,_]], out: blk(B.MOSSY_COBBLESTONE), outCount: 1, needs3x3: false },

            { name: "Sugar", desc: "Sweet dust.", grid: [[_,_,_],[blk(B.SUGARCANE),_,_],[_,_,_]], out: mat('sugar'), outCount: 1, needs3x3: false },
            { name: "Paper (3)", desc: "Writing material.", grid: [[_,_,_],[blk(B.SUGARCANE),blk(B.SUGARCANE),_],[_,blk(B.SUGARCANE),_]], out: mat('paper'), outCount: 3, needs3x3: false },
            { name: "Book", desc: "A readable item.", grid: [[_,_,_],[mat('paper'),mat('paper'),_],[mat('paper'),mat('leather'),_]], out: mat('book'), outCount: 1, needs3x3: false },
            { name: "Item Frame", desc: "Displays items on walls.", grid: [[mat('stick'),mat('stick'),mat('stick')],[mat('stick'),mat('leather'),mat('stick')],[mat('stick'),mat('stick'),mat('stick')]], out: mat('item_frame'), outCount: 1, needs3x3: true },
            
            { name: "Iron Block", desc: "Storage block.", grid: [[mat('iron_ingot'),mat('iron_ingot'),mat('iron_ingot')],[mat('iron_ingot'),mat('iron_ingot'),mat('iron_ingot')],[mat('iron_ingot'),mat('iron_ingot'),mat('iron_ingot')]], out: blk(B.IRON_BLOCK), outCount: 1, needs3x3: true },
            { name: "Gold Block", desc: "Storage block.", grid: [[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')],[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')],[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')]], out: blk(B.GOLD_BLOCK), outCount: 1, needs3x3: true },
            { name: "Diamond Block", desc: "Storage block.", grid: [[mat('diamond'),mat('diamond'),mat('diamond')],[mat('diamond'),mat('diamond'),mat('diamond')],[mat('diamond'),mat('diamond'),mat('diamond')]], out: blk(B.DIAMOND_BLOCK), outCount: 1, needs3x3: true },
            { name: "Emerald Block", desc: "Storage block.", grid: [[mat('emerald'),mat('emerald'),mat('emerald')],[mat('emerald'),mat('emerald'),mat('emerald')],[mat('emerald'),mat('emerald'),mat('emerald')]], out: blk(B.EMERALD_BLOCK), outCount: 1, needs3x3: true },
            { name: "Lapis Block", desc: "Storage block.", grid: [[mat('lapis_lazuli'),mat('lapis_lazuli'),mat('lapis_lazuli')],[mat('lapis_lazuli'),mat('lapis_lazuli'),mat('lapis_lazuli')],[mat('lapis_lazuli'),mat('lapis_lazuli'),mat('lapis_lazuli')]], out: blk(B.LAPIS_BLOCK), outCount: 1, needs3x3: true },
            { name: "Redstone Block", desc: "Storage block.", grid: [[mat('redstone'),mat('redstone'),mat('redstone')],[mat('redstone'),mat('redstone'),mat('redstone')],[mat('redstone'),mat('redstone'),mat('redstone')]], out: blk(B.REDSTONE_BLOCK), outCount: 1, needs3x3: true },
            { name: "Coal Block", desc: "Storage & fuel block.", grid: [[mat('coal'),mat('coal'),mat('coal')],[mat('coal'),mat('coal'),mat('coal')],[mat('coal'),mat('coal'),mat('coal')]], out: blk(B.COAL_BLOCK), outCount: 1, needs3x3: true },

            { name: "Iron Ingot (9)", desc: "Revert block.", grid: [[_,_,_],[blk(B.IRON_BLOCK),_,_],[_,_,_]], out: mat('iron_ingot'), outCount: 9, needs3x3: false },
            { name: "Gold Ingot (9)", desc: "Revert block.", grid: [[_,_,_],[blk(B.GOLD_BLOCK),_,_],[_,_,_]], out: mat('gold_ingot'), outCount: 9, needs3x3: false },
            { name: "Diamond (9)", desc: "Revert block.", grid: [[_,_,_],[blk(B.DIAMOND_BLOCK),_,_],[_,_,_]], out: mat('diamond'), outCount: 9, needs3x3: false },
            { name: "Emerald (9)", desc: "Revert block.", grid: [[_,_,_],[blk(B.EMERALD_BLOCK),_,_],[_,_,_]], out: mat('emerald'), outCount: 9, needs3x3: false },
            { name: "Lapis Lazuli (9)", desc: "Revert block.", grid: [[_,_,_],[blk(B.LAPIS_BLOCK),_,_],[_,_,_]], out: mat('lapis_lazuli'), outCount: 9, needs3x3: false },
            { name: "Redstone (9)", desc: "Revert block.", grid: [[_,_,_],[blk(B.REDSTONE_BLOCK),_,_],[_,_,_]], out: mat('redstone'), outCount: 9, needs3x3: false },
            { name: "Coal (9)", desc: "Revert block.", grid: [[_,_,_],[blk(B.COAL_BLOCK),_,_],[_,_,_]], out: mat('coal'), outCount: 9, needs3x3: false },
            { name: "Bone Block", desc: "Storage block.", grid: [[mat('bone_meal'),mat('bone_meal'),mat('bone_meal')],[mat('bone_meal'),mat('bone_meal'),mat('bone_meal')],[mat('bone_meal'),mat('bone_meal'),mat('bone_meal')]], out: blk(B.BONE_BLOCK), outCount: 1, needs3x3: true },
            { name: "Bone Meal (9)", desc: "Revert block.", grid: [[_,_,_],[blk(B.BONE_BLOCK),_,_],[_,_,_]], out: mat('bone_meal'), outCount: 9, needs3x3: false },
            { name: "Wool", desc: "Spun textile block.", grid: [[_,_,_],[mat('string'),mat('string'),_],[mat('string'),mat('string'),_]], out: blk(B.WOOL), outCount: 1, needs3x3: false },
            { name: "Nether Bricks (4)", desc: "Durable Nether masonry.", grid: [[_,_,_],[blk(B.NETHERRACK),blk(B.NETHERRACK),_],[blk(B.NETHERRACK),blk(B.NETHERRACK),_]], out: blk(B.NETHER_BRICKS), outCount: 4, needs3x3: false },
            { name: "Magma Block (4)", desc: "Fiery volcanic block.", grid: [[_,_,_],[blk(B.MAGMA_STONE),blk(B.MAGMA_STONE),_],[blk(B.MAGMA_STONE),blk(B.MAGMA_STONE),_]], out: blk(B.MAGMA), outCount: 4, needs3x3: false },
            { name: "Smooth Basalt (4)", desc: "Polished basalt masonry.", grid: [[_,_,_],[blk(B.BASALT),blk(B.BASALT),_],[blk(B.BASALT),blk(B.BASALT),_]], out: blk(B.SMOOTH_BASALT), outCount: 4, needs3x3: false },
            { name: "Mangrove Planks (4)", desc: "Warm reddish planks.", grid: [[_,_,_],[_,blk(B.MANGROVE_LOG),_],[_,_,_]], out: blk(B.MANGROVE_PLANKS), outCount: 4, needs3x3: false },
            { name: "Dark Oak Planks (4)", desc: "Deep rich planks.", grid: [[_,_,_],[_,blk(B.DARK_OAK_WOOD),_],[_,_,_]], out: blk(B.DARK_OAK_PLANKS), outCount: 4, needs3x3: false },

            // Slabs
            { name: "Oak Slab (6)", desc: "Half wooden block.", grid: [[_,_,_],[blk(B.PLANKS),blk(B.PLANKS),blk(B.PLANKS)],[_,_,_]], out: blk(B.OAK_SLAB), outCount: 6, needs3x3: true },
            { name: "Cobblestone Slab (6)", desc: "Half stone block.", grid: [[_,_,_],[blk(B.COBBLESTONE),blk(B.COBBLESTONE),blk(B.COBBLESTONE)],[_,_,_]], out: blk(B.COBBLESTONE_SLAB), outCount: 6, needs3x3: true },
            { name: "Stone Slab (6)", desc: "Smooth stone slab.", grid: [[_,_,_],[blk(B.STONE),blk(B.STONE),blk(B.STONE)],[_,_,_]], out: blk(B.STONE_SLAB), outCount: 6, needs3x3: true },
            { name: "Birch Slab (6)", desc: "Half birch block.", grid: [[_,_,_],[blk(B.BIRCH_PLANKS),blk(B.BIRCH_PLANKS),blk(B.BIRCH_PLANKS)],[_,_,_]], out: blk(B.BIRCH_SLAB), outCount: 6, needs3x3: true },

            // Stairs
            { name: "Oak Stairs (4)", desc: "Ascending wooden steps.", grid: [[blk(B.PLANKS),_,_],[blk(B.PLANKS),blk(B.PLANKS),_],[blk(B.PLANKS),blk(B.PLANKS),blk(B.PLANKS)]], out: blk(B.OAK_STAIRS), outCount: 4, needs3x3: true },
            { name: "Cobblestone Stairs (4)", desc: "Ascending stone steps.", grid: [[blk(B.COBBLESTONE),_,_],[blk(B.COBBLESTONE),blk(B.COBBLESTONE),_],[blk(B.COBBLESTONE),blk(B.COBBLESTONE),blk(B.COBBLESTONE)]], out: blk(B.COBBLESTONE_STAIRS), outCount: 4, needs3x3: true },
            { name: "Stone Stairs (4)", desc: "Ascending smooth stone steps.", grid: [[blk(B.STONE),_,_],[blk(B.STONE),blk(B.STONE),_],[blk(B.STONE),blk(B.STONE),blk(B.STONE)]], out: blk(B.STONE_STAIRS), outCount: 4, needs3x3: true },
            { name: "Birch Stairs (4)", desc: "Ascending birch steps.", grid: [[blk(B.BIRCH_PLANKS),_,_],[blk(B.BIRCH_PLANKS),blk(B.BIRCH_PLANKS),_],[blk(B.BIRCH_PLANKS),blk(B.BIRCH_PLANKS),blk(B.BIRCH_PLANKS)]], out: blk(B.BIRCH_STAIRS), outCount: 4, needs3x3: true },

            // Fences & Gates
            { name: "Oak Fence (3)", desc: "Connecting wooden barrier.", grid: [[_,_,_],[blk(B.PLANKS),mat('stick'),blk(B.PLANKS)],[blk(B.PLANKS),mat('stick'),blk(B.PLANKS)]], out: blk(B.OAK_FENCE), outCount: 3, needs3x3: true },
            { name: "Birch Fence (3)", desc: "Connecting birch barrier.", grid: [[_,_,_],[blk(B.BIRCH_PLANKS),mat('stick'),blk(B.BIRCH_PLANKS)],[blk(B.BIRCH_PLANKS),mat('stick'),blk(B.BIRCH_PLANKS)]], out: blk(B.BIRCH_FENCE), outCount: 3, needs3x3: true },
            { name: "Spruce Fence (3)", desc: "Connecting spruce barrier.", grid: [[_,_,_],[blk(B.PINE_PLANKS),mat('stick'),blk(B.PINE_PLANKS)],[blk(B.PINE_PLANKS),mat('stick'),blk(B.PINE_PLANKS)]], out: blk(B.SPRUCE_FENCE), outCount: 3, needs3x3: true },
            { name: "Jungle Fence (3)", desc: "Connecting jungle barrier.", grid: [[_,_,_],[blk(B.PALM_PLANKS),mat('stick'),blk(B.PALM_PLANKS)],[blk(B.PALM_PLANKS),mat('stick'),blk(B.PALM_PLANKS)]], out: blk(B.JUNGLE_FENCE), outCount: 3, needs3x3: true },
            { name: "Acacia Fence (3)", desc: "Connecting acacia barrier.", grid: [[_,_,_],[blk(B.ACACIA_PLANKS),mat('stick'),blk(B.ACACIA_PLANKS)],[blk(B.ACACIA_PLANKS),mat('stick'),blk(B.ACACIA_PLANKS)]], out: blk(B.ACACIA_FENCE), outCount: 3, needs3x3: true },
            { name: "Dark Oak Fence (3)", desc: "Connecting dark oak barrier.", grid: [[_,_,_],[blk(B.DARK_OAK_PLANKS),mat('stick'),blk(B.DARK_OAK_PLANKS)],[blk(B.DARK_OAK_PLANKS),mat('stick'),blk(B.DARK_OAK_PLANKS)]], out: blk(B.DARK_OAK_FENCE), outCount: 3, needs3x3: true },
            { name: "Mangrove Fence (3)", desc: "Connecting mangrove barrier.", grid: [[_,_,_],[blk(B.MANGROVE_PLANKS),mat('stick'),blk(B.MANGROVE_PLANKS)],[blk(B.MANGROVE_PLANKS),mat('stick'),blk(B.MANGROVE_PLANKS)]], out: blk(B.MANGROVE_FENCE), outCount: 3, needs3x3: true },
            { name: "Cherry Fence (3)", desc: "Connecting cherry barrier.", grid: [[_,_,_],[blk(B.CHERRY_PLANKS),mat('stick'),blk(B.CHERRY_PLANKS)],[blk(B.CHERRY_PLANKS),mat('stick'),blk(B.CHERRY_PLANKS)]], out: blk(B.CHERRY_FENCE), outCount: 3, needs3x3: true },
            { name: "Crimson Fence (3)", desc: "Connecting crimson barrier.", grid: [[_,_,_],[blk(B.CRIMSON_PLANKS),mat('stick'),blk(B.CRIMSON_PLANKS)],[blk(B.CRIMSON_PLANKS),mat('stick'),blk(B.CRIMSON_PLANKS)]], out: blk(B.CRIMSON_FENCE), outCount: 3, needs3x3: true },
            { name: "Autumn Fence (3)", desc: "Connecting autumn barrier.", grid: [[_,_,_],[blk(B.AUTUMN_PLANKS),mat('stick'),blk(B.AUTUMN_PLANKS)],[blk(B.AUTUMN_PLANKS),mat('stick'),blk(B.AUTUMN_PLANKS)]], out: blk(B.AUTUMN_FENCE), outCount: 3, needs3x3: true },

            { name: "Oak Fence Gate", desc: "Swinging wooden barrier gate.", grid: [[_,_,_],[mat('stick'),blk(B.PLANKS),mat('stick')],[mat('stick'),blk(B.PLANKS),mat('stick')]], out: blk(B.OAK_FENCE_GATE), outCount: 1, needs3x3: true },
            { name: "Birch Fence Gate", desc: "Swinging birch barrier gate.", grid: [[_,_,_],[mat('stick'),blk(B.BIRCH_PLANKS),mat('stick')],[mat('stick'),blk(B.BIRCH_PLANKS),mat('stick')]], out: blk(B.BIRCH_FENCE_GATE), outCount: 1, needs3x3: true },
            { name: "Spruce Fence Gate", desc: "Swinging spruce barrier gate.", grid: [[_,_,_],[mat('stick'),blk(B.PINE_PLANKS),mat('stick')],[mat('stick'),blk(B.PINE_PLANKS),mat('stick')]], out: blk(B.SPRUCE_FENCE_GATE), outCount: 1, needs3x3: true },
            { name: "Jungle Fence Gate", desc: "Swinging jungle barrier gate.", grid: [[_,_,_],[mat('stick'),blk(B.PALM_PLANKS),mat('stick')],[mat('stick'),blk(B.PALM_PLANKS),mat('stick')]], out: blk(B.JUNGLE_FENCE_GATE), outCount: 1, needs3x3: true },
            { name: "Acacia Fence Gate", desc: "Swinging acacia barrier gate.", grid: [[_,_,_],[mat('stick'),blk(B.ACACIA_PLANKS),mat('stick')],[mat('stick'),blk(B.ACACIA_PLANKS),mat('stick')]], out: blk(B.ACACIA_FENCE_GATE), outCount: 1, needs3x3: true },
            { name: "Dark Oak Fence Gate", desc: "Swinging dark oak barrier gate.", grid: [[_,_,_],[mat('stick'),blk(B.DARK_OAK_PLANKS),mat('stick')],[mat('stick'),blk(B.DARK_OAK_PLANKS),mat('stick')]], out: blk(B.DARK_OAK_FENCE_GATE), outCount: 1, needs3x3: true },
            { name: "Mangrove Fence Gate", desc: "Swinging mangrove barrier gate.", grid: [[_,_,_],[mat('stick'),blk(B.MANGROVE_PLANKS),mat('stick')],[mat('stick'),blk(B.MANGROVE_PLANKS),mat('stick')]], out: blk(B.MANGROVE_FENCE_GATE), outCount: 1, needs3x3: true },
            { name: "Cherry Fence Gate", desc: "Swinging cherry barrier gate.", grid: [[_,_,_],[mat('stick'),blk(B.CHERRY_PLANKS),mat('stick')],[mat('stick'),blk(B.CHERRY_PLANKS),mat('stick')]], out: blk(B.CHERRY_FENCE_GATE), outCount: 1, needs3x3: true },
            { name: "Crimson Fence Gate", desc: "Swinging crimson barrier gate.", grid: [[_,_,_],[mat('stick'),blk(B.CRIMSON_PLANKS),mat('stick')],[mat('stick'),blk(B.CRIMSON_PLANKS),mat('stick')]], out: blk(B.CRIMSON_FENCE_GATE), outCount: 1, needs3x3: true },
            { name: "Autumn Fence Gate", desc: "Swinging autumn barrier gate.", grid: [[_,_,_],[mat('stick'),blk(B.AUTUMN_PLANKS),mat('stick')],[mat('stick'),blk(B.AUTUMN_PLANKS),mat('stick')]], out: blk(B.AUTUMN_FENCE_GATE), outCount: 1, needs3x3: true },
            { name: "Warped Fence (3)", desc: "Connecting warped barrier.", grid: [[_,_,_],[blk(B.WARPED_PLANKS),mat('stick'),blk(B.WARPED_PLANKS)],[blk(B.WARPED_PLANKS),mat('stick'),blk(B.WARPED_PLANKS)]], out: blk(B.WARPED_FENCE), outCount: 3, needs3x3: true },
            { name: "Warped Fence Gate", desc: "Swinging warped barrier gate.", grid: [[_,_,_],[mat('stick'),blk(B.WARPED_PLANKS),mat('stick')],[mat('stick'),blk(B.WARPED_PLANKS),mat('stick')]], out: blk(B.WARPED_FENCE_GATE), outCount: 1, needs3x3: true },

            // Walls
            { name: "Cobblestone Wall (6)", desc: "Connecting cobblestone barrier.", grid: [[_,_,_],[blk(B.COBBLESTONE),blk(B.COBBLESTONE),blk(B.COBBLESTONE)],[blk(B.COBBLESTONE),blk(B.COBBLESTONE),blk(B.COBBLESTONE)]], out: blk(B.COBBLESTONE_WALL), outCount: 6, needs3x3: true },
            { name: "Mossy Cobblestone Wall (6)", desc: "Connecting mossy cobblestone barrier.", grid: [[_,_,_],[blk(B.MOSSY_COBBLESTONE),blk(B.MOSSY_COBBLESTONE),blk(B.MOSSY_COBBLESTONE)],[blk(B.MOSSY_COBBLESTONE),blk(B.MOSSY_COBBLESTONE),blk(B.MOSSY_COBBLESTONE)]], out: blk(B.MOSSY_COBBLESTONE_WALL), outCount: 6, needs3x3: true },
            { name: "Stone Brick Wall (6)", desc: "Connecting stone brick barrier.", grid: [[_,_,_],[blk(B.STONE_BRICKS),blk(B.STONE_BRICKS),blk(B.STONE_BRICKS)],[blk(B.STONE_BRICKS),blk(B.STONE_BRICKS),blk(B.STONE_BRICKS)]], out: blk(B.STONE_BRICK_WALL), outCount: 6, needs3x3: true },
            { name: "Stone Wall (6)", desc: "Connecting stone barrier.", grid: [[_,_,_],[blk(B.STONE),blk(B.STONE),blk(B.STONE)],[blk(B.STONE),blk(B.STONE),blk(B.STONE)]], out: blk(B.STONE_WALL), outCount: 6, needs3x3: true },
            { name: "Sandstone Wall (6)", desc: "Connecting sandstone barrier.", grid: [[_,_,_],[blk(B.SANDSTONE),blk(B.SANDSTONE),blk(B.SANDSTONE)],[blk(B.SANDSTONE),blk(B.SANDSTONE),blk(B.SANDSTONE)]], out: blk(B.SANDSTONE_WALL), outCount: 6, needs3x3: true },
            { name: "Blackstone Wall (6)", desc: "Connecting blackstone barrier.", grid: [[_,_,_],[blk(B.BLACKSTONE),blk(B.BLACKSTONE),blk(B.BLACKSTONE)],[blk(B.BLACKSTONE),blk(B.BLACKSTONE),blk(B.BLACKSTONE)]], out: blk(B.BLACKSTONE_WALL), outCount: 6, needs3x3: true },
            { name: "Holystone Wall (6)", desc: "Connecting holystone barrier.", grid: [[_,_,_],[blk(B.HOLYSTONE),blk(B.HOLYSTONE),blk(B.HOLYSTONE)],[blk(B.HOLYSTONE),blk(B.HOLYSTONE),blk(B.HOLYSTONE)]], out: blk(B.HOLYSTONE_WALL), outCount: 6, needs3x3: true },
            { name: "Brick Wall (6)", desc: "Connecting brick barrier.", grid: [[_,_,_],[blk(B.BRICKS),blk(B.BRICKS),blk(B.BRICKS)],[blk(B.BRICKS),blk(B.BRICKS),blk(B.BRICKS)]], out: blk(B.BRICK_WALL), outCount: 6, needs3x3: true },
            { name: "Nether Brick Wall (6)", desc: "Connecting nether brick barrier.", grid: [[_,_,_],[blk(B.NETHER_BRICKS),blk(B.NETHER_BRICKS),blk(B.NETHER_BRICKS)],[blk(B.NETHER_BRICKS),blk(B.NETHER_BRICKS),blk(B.NETHER_BRICKS)]], out: blk(B.NETHER_BRICK_WALL), outCount: 6, needs3x3: true },

            { name: "Fletching Table", desc: "Decorative workstation.", grid: [[mat('flint'),mat('flint'),_],[blk(B.PLANKS),blk(B.PLANKS),_],[blk(B.PLANKS),blk(B.PLANKS),_]], out: blk(B.FLETCHING_TABLE), outCount: 1, needs3x3: true },
            { name: "Smoker", desc: "Rapidly cooks food.", grid: [[_,blk(B.WOOD),_],[blk(B.WOOD),blk(B.FURNACE),blk(B.WOOD)],[_,blk(B.WOOD),_]], out: blk(B.SMOKER), outCount: 1, needs3x3: true },
            { name: "Bookshelf", desc: "Storage for literature.", grid: [[blk(B.PLANKS),blk(B.PLANKS),blk(B.PLANKS)],[mat('book'),mat('book'),mat('book')],[blk(B.PLANKS),blk(B.PLANKS),blk(B.PLANKS)]], out: blk(B.BOOKSHELF), outCount: 1, needs3x3: true },

            { name: "Bow", desc: "Ranged weapon.", grid: [[_,mat('stick'),mat('string')],[mat('stick'),_,mat('string')],[_,mat('stick'),mat('string')]], out: eqp('bow'), outCount: 1, needs3x3: true },
            { name: "Arrow (4)", desc: "Ammunition for bows.", grid: [[_,mat('flint'),_],[_,mat('stick'),_],[_,mat('feather'),_]], out: mat('arrow'), outCount: 4, needs3x3: true },
            { name: "Bread", desc: "Filling baked food.", grid: [[_,_,_],[mat('wheat'),mat('wheat'),mat('wheat')],[_,_,_]], out: mat('bread'), outCount: 1, needs3x3: true },
            { name: "Golden Apple", desc: "Powerful restorative food.", grid: [[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')],[mat('gold_ingot'),mat('apple'),mat('gold_ingot')],[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')]], out: mat('golden_apple'), outCount: 1, needs3x3: true },
            { name: "Compass", desc: "Navigation instrument.", grid: [[_,mat('iron_ingot'),_],[mat('iron_ingot'),mat('redstone'),mat('iron_ingot')],[_,mat('iron_ingot'),_]], out: mat('compass'), outCount: 1, needs3x3: true },
            { name: "Clock", desc: "Tracks day and night cycle.", grid: [[_,mat('gold_ingot'),_],[mat('gold_ingot'),mat('redstone'),mat('gold_ingot')],[_,mat('gold_ingot'),_]], out: mat('clock'), outCount: 1, needs3x3: true },
            { name: "Red Bed", desc: "Sleep at night and set your spawn point.", grid: [[_,_,_],[blk(B.RED_WOOL),blk(B.RED_WOOL),blk(B.RED_WOOL)],[blk(B.PLANKS),blk(B.PLANKS),blk(B.PLANKS)]], out: blk(B.RED_BED), outCount: 1, needs3x3: true },
            { name: "White Bed", desc: "Sleep at night and set your spawn point.", grid: [[_,_,_],[blk(B.WOOL),blk(B.WOOL),blk(B.WOOL)],[blk(B.PLANKS),blk(B.PLANKS),blk(B.PLANKS)]], out: blk(B.WHITE_BED), outCount: 1, needs3x3: true },
            { name: "Blue Bed", desc: "Sleep at night and set your spawn point.", grid: [[_,_,_],[blk(B.BLUE_WOOL),blk(B.BLUE_WOOL),blk(B.BLUE_WOOL)],[blk(B.PLANKS),blk(B.PLANKS),blk(B.PLANKS)]], out: blk(B.BLUE_BED), outCount: 1, needs3x3: true },
            { name: "Red Dye", desc: "Crafted from red flowers.", grid: [[_,_,_],[_,blk(B.RED_FLOWER),_],[_,_,_]], out: mat('red_dye'), outCount: 1, needs3x3: false },
            { name: "Yellow Dye", desc: "Crafted from yellow flowers.", grid: [[_,_,_],[_,blk(B.YELLOW_FLOWER),_],[_,_,_]], out: mat('yellow_dye'), outCount: 1, needs3x3: false },
            { name: "Blue Dye", desc: "Crafted from blue flowers.", grid: [[_,_,_],[_,blk(B.BLUE_FLOWER),_],[_,_,_]], out: mat('blue_dye'), outCount: 1, needs3x3: false },
            { name: "Red Wool", desc: "Dye wool with red dye.", grid: [[_,_,_],[_,blk(B.WOOL),mat('red_dye')],[_,_,_]], out: blk(B.RED_WOOL), outCount: 1, needs3x3: false },
            { name: "Blue Wool", desc: "Dye wool with blue dye.", grid: [[_,_,_],[_,blk(B.WOOL),mat('blue_dye')],[_,_,_]], out: blk(B.BLUE_WOOL), outCount: 1, needs3x3: false }
        ];

        const searchInput = document.getElementById('recipe-search');
        if (searchInput && !searchInput._wired) {
            searchInput._wired = true;
            searchInput.oninput = () => this.showRecipeBook();
        }
        const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
        const q = query.endsWith('s') ? query.slice(0, -1) : query;

        const filteredRecipes = recipes.filter(r => {
            if (!query) return true;
            const name = r.name.toLowerCase();
            const desc = (r.desc || '').toLowerCase();
            return name.includes(query) || (q.length >= 3 && name.includes(q)) || desc.includes(query);
        });

        let html = '<ul style="list-style: none; padding: 0; margin: 0;">';
        if (filteredRecipes.length === 0) {
            html += '<li style="padding: 10px; color: #555; font-size: 11px; text-align: center;">No recipes found</li>';
        } else {
            filteredRecipes.forEach((r, idx) => {
                const tag = r.needs3x3 ? '<span style="font-size:9px; color:#ffdd55; float:right;">3x3</span>' : '<span style="font-size:9px; color:#88ff88; float:right;">2x2</span>';
                html += `<li class="recipe-item" data-idx="${idx}"><span class="recipe-item-name">${r.name}</span> ${tag}</li>`;
            });
        }
        html += '</ul>';
        list.innerHTML = html;

        const items = list.querySelectorAll('.recipe-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                items.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                
                const idx = parseInt(item.getAttribute('data-idx'));
                this.showRecipeDetails(filteredRecipes[idx]);
            });
            item.addEventListener('dblclick', () => {
                const idx = parseInt(item.getAttribute('data-idx'));
                const rec = filteredRecipes[idx];
                if (rec) {
                    this.showRecipeDetails(rec);
                    this.autofillRecipe(rec);
                }
            });
        });

        // Select first automatically
        if (items.length > 0) items[0].click();
    }

    showRecipeDetails(recipe) {
        if (!recipe) return;
        this.selectedRecipe = recipe;
        const statusEl = document.getElementById('recipe-autofill-status');
        if (statusEl) {
            statusEl.textContent = 'Press [Space] to autofill';
            statusEl.style.color = '#404040';
        }
        document.getElementById('recipe-viewer-title').innerText = recipe.name;
        let descHtml = recipe.desc || '';
        if (recipe.needs3x3 && !this.is3x3Crafting) {
            descHtml += '<div style="color: #ffaa00; font-size: 10px; font-weight: bold; margin-top: 4px;">★ Requires Crafting Table (3x3 Grid)</div>';
        } else if (recipe.needs3x3) {
            descHtml += '<div style="color: #88ff88; font-size: 10px; margin-top: 4px;">Crafted on 3x3 Table</div>';
        } else {
            descHtml += '<div style="color: #88ff88; font-size: 10px; margin-top: 4px;">Crafted in 2x2 or 3x3 Grid</div>';
        }
        document.getElementById('recipe-viewer-desc').innerHTML = descHtml;
        
        const gridContainer = document.getElementById('recipe-viewer-grid');
        gridContainer.innerHTML = '';
        
        // Helper to generate the exact HTML element for a given recipe item definition
        const createSlotEl = (def) => {
            const el = document.createElement('div');
            el.className = 'inv-slot';
            if (!def) return el;
            
            const atlas = this.atlas || (window.game ? window.game.atlas : null);
            let dataURL = null;
            if (def.type === 'block' && atlas && atlas.getBlockIcon) {
                const iconCanvas = atlas.getBlockIcon(def.subtype);
                if (iconCanvas) dataURL = iconCanvas.toDataURL();
            } else {
                const iconCanvas = generateItemTexture(def.type, def.subtype, (c) => {
                    const elImg = el.querySelector('img');
                    if (elImg && c) elImg.src = c.toDataURL();
                });
                if (iconCanvas) dataURL = iconCanvas.toDataURL();
            }
            
            if (dataURL) {
                const img = document.createElement('img');
                img.src = dataURL;
                img.className = 'item-icon';
                el.appendChild(img);
            }
            return el;
        };

        if (!this.is3x3Crafting && !recipe.needs3x3) {
            // Find the bounding box of the recipe
            let minX = 2, maxX = 0, minY = 2, maxY = 0;
            for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                    if (recipe.grid[y][x]) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            // If empty (shouldn't happen), default to top-left
            if (minX > maxX) { minX = 0; maxX = 0; minY = 0; maxY = 0; }
            
            // Expand bounding box to 2x2
            if (maxX - minX < 1) maxX = minX + 1;
            if (maxY - minY < 1) maxY = minY + 1;
            
            // Clamp to 2x2 maximum size (just in case)
            if (maxX - minX > 1) maxX = minX + 1;
            if (maxY - minY > 1) maxY = minY + 1;
            
            gridContainer.style.gridTemplateColumns = 'repeat(2, 40px)';
            gridContainer.style.gridTemplateRows = 'repeat(2, 40px)';
            
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    gridContainer.appendChild(createSlotEl(recipe.grid[y] ? recipe.grid[y][x] : null));
                }
            }
        } else {
            gridContainer.style.gridTemplateColumns = 'repeat(3, 40px)';
            gridContainer.style.gridTemplateRows = 'repeat(3, 40px)';
            // Render 3x3
            for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                    gridContainer.appendChild(createSlotEl(recipe.grid[y][x]));
                }
            }
        }

        // Render Output
        const outContainer = document.getElementById('recipe-viewer-output');
        outContainer.innerHTML = '';
        const outEl = createSlotEl(recipe.out);
        while (outEl.children.length > 0) {
            outContainer.appendChild(outEl.children[0]);
        }
        if (recipe.outCount > 1) {
            const num = document.createElement('div');
            num.className = 'item-count';
            num.innerText = recipe.outCount;
            outContainer.appendChild(num);
        }
        outContainer.style.cursor = 'pointer';
        outContainer.title = 'Click to autofill into crafting grid (or press Space)';
        outContainer.onclick = () => {
            this.autofillRecipe(recipe);
        };
    }
}

export { UISystem };
export class CloudSystem {
    constructor(scene) {
        this.scene = scene;
        this.clouds = new THREE.Group();
        this.scene.add(this.clouds);

        this.cloudAltitude = 128; // Authentic Minecraft cloud height
        this.cloudThickness = 4;  // 4 blocks thick (Fancy 3D clouds)
        this.cellSize = 12;       // 12 blocks per cloud texture pixel
        this.radius = 16;         // 32x32 cell footprint (384x384 blocks around player, optimized)
        this.gridSize = 256;      // Minecraft 256x256 clouds.png

        this.cloudData = new Uint8Array(256 * 256);
        this.isLoaded = false;
        this.cloudOffset = 0;
        this.lastCellX = null;
        this.lastCellZ = null;

        // Material with vertex colors for authentic Minecraft face shading
        this.cloudMat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.82,
            fog: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        this.cloudsMesh = null;

        // Load authentic Minecraft clouds.png
        this._loadCloudTexture();
    }

    _loadCloudTexture() {
        // Fast temporary procedural cloud field so clouds appear immediately on frame 1
        for (let y = 0; y < 256; y++) {
            for (let x = 0; x < 256; x++) {
                const n = Math.sin(x * 0.12) * Math.cos(y * 0.12) + Math.sin(x * 0.05 + y * 0.05);
                this.cloudData[y * 256 + x] = (n > 0.6) ? 1 : 0;
            }
        }

        if (typeof Image === 'undefined') return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 256;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const imgData = ctx.getImageData(0, 0, 256, 256).data;
                for (let i = 0; i < 256 * 256; i++) {
                    // In authentic Minecraft clouds.png, alpha > 128 indicates cloud block
                    this.cloudData[i] = (imgData[i * 4 + 3] > 128) ? 1 : 0;
                }
                this.isLoaded = true;
                this.lastCellX = null;
                this.lastCellZ = null;
            } catch (e) {
                console.warn('Failed to parse clouds.png, using procedural fallback', e);
            }
        };
        img.onerror = () => {
            // CDN fallback
            img.src = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.2/assets/minecraft/textures/environment/clouds.png';
        };
        img.src = 'assets/mc/environment/clouds.png';
    }

    _isCloud(u, v) {
        const wrapU = ((u % 256) + 256) % 256;
        const wrapV = ((v % 256) + 256) % 256;
        return this.cloudData[wrapV * 256 + wrapU] === 1;
    }

    _buildMesh(centerCX, centerCZ) {
        const R = this.radius;
        const CS = this.cellSize;
        const H = this.cloudThickness;

        const positions = [];
        const colors = [];
        const indices = [];
        let vertCount = 0;

        const addQuad = (p0, p1, p2, p3, shade) => {
            const base = vertCount;
            positions.push(
                p0[0], p0[1], p0[2],
                p1[0], p1[1], p1[2],
                p2[0], p2[1], p2[2],
                p3[0], p3[1], p3[2]
            );
            for (let i = 0; i < 4; i++) {
                colors.push(shade, shade, shade);
            }
            indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
            vertCount += 4;
        };

        for (let dz = -R; dz <= R; dz++) {
            const cz = centerCZ + dz;
            for (let dx = -R; dx <= R; dx++) {
                const cx = centerCX + dx;
                if (!this._isCloud(cx, cz)) continue;

                const x0 = dx * CS;
                const x1 = x0 + CS;
                const z0 = dz * CS;
                const z1 = z0 + CS;
                const y0 = 0;
                const y1 = H;

                // 1. Bottom face (-Y): Minecraft authentic bottom cloud shading (0.70)
                addQuad(
                    [x0, y0, z0],
                    [x1, y0, z0],
                    [x1, y0, z1],
                    [x0, y0, z1],
                    0.70
                );

                // 2. Top face (+Y): Minecraft authentic top cloud shading (1.00)
                addQuad(
                    [x0, y1, z1],
                    [x1, y1, z1],
                    [x1, y1, z0],
                    [x0, y1, z0],
                    1.00
                );

                // 3. North face (-Z): if neighbor cell is empty
                if (!this._isCloud(cx, cz - 1)) {
                    addQuad(
                        [x0, y0, z0],
                        [x0, y1, z0],
                        [x1, y1, z0],
                        [x1, y0, z0],
                        0.80
                    );
                }

                // 4. South face (+Z): if neighbor cell is empty
                if (!this._isCloud(cx, cz + 1)) {
                    addQuad(
                        [x1, y0, z1],
                        [x1, y1, z1],
                        [x0, y1, z1],
                        [x0, y0, z1],
                        0.80
                    );
                }

                // 5. West face (-X): if neighbor cell is empty
                if (!this._isCloud(cx - 1, cz)) {
                    addQuad(
                        [x0, y0, z1],
                        [x0, y1, z1],
                        [x0, y1, z0],
                        [x0, y0, z0],
                        0.85
                    );
                }

                // 6. East face (+X): if neighbor cell is empty
                if (!this._isCloud(cx + 1, cz)) {
                    addQuad(
                        [x1, y0, z0],
                        [x1, y1, z0],
                        [x1, y1, z1],
                        [x1, y0, z1],
                        0.85
                    );
                }
            }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geo.setIndex(indices);
        // MeshBasicMaterial is unlit with vertex colors and does not use normals, skipping computeVertexNormals saves CPU

        if (this.cloudsMesh) {
            this.clouds.remove(this.cloudsMesh);
            this.cloudsMesh.geometry.dispose();
        }

        this.cloudsMesh = new THREE.Mesh(geo, this.cloudMat);
        this.cloudsMesh.renderOrder = 5;
        this.clouds.add(this.cloudsMesh);
    }

    update(dt, cameraPos) {
        // Minecraft cloud drift: smooth drift along +X at 2.5 blocks/second
        this.cloudOffset += dt * 2.5;

        const worldCamX = cameraPos.x - this.cloudOffset;
        const worldCamZ = cameraPos.z;

        const cellX = Math.floor(worldCamX / this.cellSize);
        const cellZ = Math.floor(worldCamZ / this.cellSize);

        // Rebuild mesh when camera or drift crosses a cloud cell boundary
        if (cellX !== this.lastCellX || cellZ !== this.lastCellZ || !this.cloudsMesh) {
            this.lastCellX = cellX;
            this.lastCellZ = cellZ;
            this._buildMesh(cellX, cellZ);
        }

        // Sub-cell continuous smooth translation
        const fracX = worldCamX - cellX * this.cellSize;
        const fracZ = worldCamZ - cellZ * this.cellSize;
        if (this.cloudsMesh) {
            this.cloudsMesh.position.set(cameraPos.x - fracX, this.cloudAltitude, cameraPos.z - fracZ);
        }

        // Dynamically tint cloud color to match environmental lighting / time of day
        if (this.scene && this.scene.fog && this.scene.fog.color) {
            const fc = this.scene.fog.color;
            const lum = Math.max(0.20, fc.r * 0.299 + fc.g * 0.587 + fc.b * 0.114);
            const isWarm = (fc.r > fc.b * 1.25); // Sunrise or sunset warm horizon
            if (isWarm) {
                // Soft warm glow during dawn/dusk
                this.cloudMat.color.setRGB(
                    Math.min(1.0, fc.r * 1.15),
                    Math.min(1.0, fc.g * 1.1),
                    Math.min(1.0, fc.b * 1.2)
                );
            } else {
                // Daytime white or night dark blue-gray
                const cloudB = Math.min(1.0, lum * 1.25);
                this.cloudMat.color.setRGB(cloudB, cloudB, Math.min(1.0, cloudB * 1.05));
            }
        }
    }
}

export class MeteorShowerSystem {
    constructor(scene, particles, audio, world) {
        this.scene = scene;
        this.particles = particles;
        this.audio = audio;
        this.world = world;
        this.meteors = [];
        this.isActive = false;
        this.timer = 0;
        
        this.geo = new THREE.DodecahedronGeometry(1.0);
        this.mat = new THREE.MeshLambertMaterial({ color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 0.8 });
    }

    startShower() {
        this.isActive = true;
        this.timer = 15.0; // lasts 15 seconds
    }

    update(dt, playerPos) {
        // Randomly start shower
        if (!this.isActive && Math.random() < dt * 0.005) { // 0.5% chance per second
            this.startShower();
        }

        if (this.isActive) {
            this.timer -= dt;
            if (this.timer <= 0) this.isActive = false;

            // Spawn meteors
            if (Math.random() < dt * 2.0) { // 2 meteors per second
                const mesh = new THREE.Mesh(this.geo, this.mat);
                const startPos = new THREE.Vector3(
                    playerPos.x + (Math.random() - 0.5) * 60,
                    playerPos.y + 80 + Math.random() * 20,
                    playerPos.z + (Math.random() - 0.5) * 60
                );
                mesh.position.copy(startPos);
                this.scene.add(mesh);
                
                // Add light
                const light = new THREE.PointLight(0xff4400, 2, 20);
                mesh.add(light);

                this.meteors.push({
                    mesh,
                    velocity: new THREE.Vector3((Math.random()-0.5)*10, -30 - Math.random()*20, (Math.random()-0.5)*10),
                    age: 0
                });
            }
        }

        // Update active meteors
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const m = this.meteors[i];
            m.age += dt;
            m.mesh.position.addScaledVector(m.velocity, dt);
            this.particles.emit(m.mesh.position, 'fire', 2, 0xffaa00);

            let hit = false;
            // Check world collision
            const bx = Math.floor(m.mesh.position.x);
            const by = Math.floor(m.mesh.position.y);
            const bz = Math.floor(m.mesh.position.z);
            if (by < 128 && by >= 0) {
                const type = this.world.getBlock(bx, by, bz);
                if (type !== BLOCKS.AIR && type !== BLOCKS.WATER && type !== BLOCKS.LAVA) {
                    hit = true;
                }
            }
            if (m.mesh.position.y < -10) hit = true;

            if (hit) {
                this.particles.emit(m.mesh.position, 'explosion', 30, 0xff4400);
                this.audio.playExplode();
                
                // Carve crater
                const radius = 2 + Math.floor(Math.random() * 2);
                for(let dx=-radius; dx<=radius; dx++) {
                    for(let dy=-radius; dy<=radius; dy++) {
                        for(let dz=-radius; dz<=radius; dz++) {
                            if (dx*dx + dy*dy + dz*dz <= radius*radius) {
                                if (this.world.getBlock(bx+dx, by+dy, bz+dz) !== BLOCKS.AIR) {
                                    this.world.setBlock(bx+dx, by+dy, bz+dz, BLOCKS.AIR);
                                }
                            }
                        }
                    }
                }
                
                // Drop something rare maybe
                if (Math.random() < 0.2) {
                    this.world.setBlock(bx, by-radius, bz, BLOCKS.GLOWSTONE);
                }

                this.scene.remove(m.mesh);
                m.mesh.geometry.dispose();
                m.mesh.material.dispose();
                this.meteors.splice(i, 1);
            }
        }
    }
}

