// ============================================
// engine.js — Core Engine, Rendering, Chunks, Physics
// ============================================
import * as THREE from 'three';
import { BLOCKS, getBlockProperties, ATLAS_SIZE } from './textures.js?v=148';
import { getBiomeParams } from './generation.js?v=155';

// ============================================
// Shader Customization: Wrapped Diffuse Lighting
// ============================================
// Solves standard Lambert limitation where block tops are 0% lit when light sources (torches,
// campfires, lanterns) are placed at or below the block's top face.
if (THREE.ShaderChunk && !THREE.ShaderChunk._slopcraftWrappedLambert) {
    THREE.ShaderChunk._slopcraftWrappedLambert = true;
    THREE.ShaderChunk.lights_lambert_pars_fragment = `
varying vec3 vViewPosition;

struct LambertMaterial {
\tvec3 diffuseColor;
\tfloat specularStrength;
};

void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {

\tfloat rawDot = dot( geometryNormal, directLight.direction );
\t// Cinematic Half-Lambert wrap diffuse: eliminates harsh dark terminators on shaded faces
\tfloat wrap = 0.38;
\tfloat wrappedDot = saturate( ( rawDot + wrap ) / ( 1.0 + wrap ) );
\tfloat dotNL = mix( saturate( rawDot ), wrappedDot, 0.50 );

\t// Slopcraft Dynamic Light Wrapping:
\t// Allows block tops and voxel surfaces to receive wrap illumination from lights level with or below them.
\t// In view space, world UP (0, 1, 0) is (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz.
\tfloat upFactor = dot( geometryNormal, ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
\tif ( upFactor > 0.25 ) {
\t\t// Top face: wrap lighting so torches/lanterns on walls/floors or below the block illuminate the top face
\t\tfloat topWrap = saturate( ( rawDot + 0.65 ) / 1.65 );
\t\tdotNL = max( dotNL, topWrap * 0.95 );
\t} else if ( upFactor > -0.25 ) {
\t\t// Side wall faces: soft wrap to eliminate harsh pitch-black crevices next to torches
\t\tfloat sideWrap = saturate( ( rawDot + 0.35 ) / 1.35 );
\t\tdotNL = max( dotNL, sideWrap * 0.85 );
\t}

\tvec3 irradiance = dotNL * directLight.color;

\treflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

}

void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {

\treflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

}

#define RE_Direct\t\t\t\tRE_Direct_Lambert
#define RE_IndirectDiffuse\t\tRE_IndirectDiffuse_Lambert
`;
}

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128;

// ============================================
// InputManager
// ============================================
export class InputManager {
    constructor() {
        this.keys = { forward: false, backward: false, left: false, right: false, jump: false, sprint: false, crouch: false };
        this.mouse = { dx: 0, dy: 0, leftClick: false, rightClick: false, middleClick: false, scrollDelta: 0, leftDown: false, rightDown: false };
        this.menuKeys = { inventory: false, spellConfig: false, pause: false, planet: false, debug: false, dropItem: false, map: false, devMode: false, togglePerspective: false };
        this._menuKeysDown = { inventory: false, spellConfig: false, pause: false, planet: false, debug: false, dropItem: false, map: false, devMode: false, togglePerspective: false };
        this.hotbarIndex = -1;
        this.isLocked = false;
        this.canvas = null;
        this.keySequence = '';
        this.devModeUnlocked = false;
        this.creativeMode = false;
        this._lastSpaceTime = 0;
        this._creativeFlying = false;
    }

    init(canvas) {
        this.canvas = canvas;

        document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
        document.addEventListener('keyup', (e) => this.onKeyUp(e), false);

        document.addEventListener('mousemove', (e) => {
            if (this.isLocked) {
                this.mouse.dx += e.movementX || 0;
                this.mouse.dy += e.movementY || 0;
            }
        }, false);

        document.addEventListener('mousedown', (e) => {
            if (!this.isLocked) return;
            if (e.button === 0) { this.mouse.leftClick = true; this.mouse.leftDown = true; }
            if (e.button === 1) { this.mouse.middleClick = true; e.preventDefault(); }
            if (e.button === 2) { this.mouse.rightClick = true; this.mouse.rightDown = true; }
        }, false);

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) { this.mouse.leftClick = false; this.mouse.leftDown = false; }
            if (e.button === 1) this.mouse.middleClick = false;
            if (e.button === 2) { this.mouse.rightClick = false; this.mouse.rightDown = false; }
        }, false);

        document.addEventListener('auxclick', (e) => {
            if (e.button === 1) e.preventDefault();
        }, false);

        document.addEventListener('wheel', (e) => {
            if (this.isLocked) {
                this.mouse.scrollDelta = Math.sign(e.deltaY);
            }
        }, { passive: true });

        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === this.canvas;
        }, false);

        // Prevent context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
    }

    requestPointerLock() {
        if (!this.isLocked && this.canvas) {
            try {
                const promise = this.canvas.requestPointerLock();
                if (promise) {
                    promise.catch(e => {
                        console.warn('Pointer lock prevented:', e);
                        document.dispatchEvent(new Event('pointerlockerror'));
                    });
                }
            } catch (e) {
                console.warn('Pointer lock prevented:', e);
                document.dispatchEvent(new Event('pointerlockerror'));
            }
        }
    }

    resetMouse() {
        this.mouse.dx = 0;
        this.mouse.dy = 0;
        this.mouse.scrollDelta = 0;
        this.hotbarIndex = -1;
        // Edge triggered keys reset
        this.menuKeys.inventory = false;
        this.menuKeys.spellConfig = false;
        this.menuKeys.pause = false;
        this.menuKeys.planet = false;
        this.menuKeys.map = false;
        this.menuKeys.devMode = false;
    }

    isPointerLocked() {
        return this.isLocked;
    }

    onKeyDown(e) {
        // If the user is typing in an input field (like creative search or chat), ignore game hotkeys!
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
            if (e.code === 'Escape') {
                document.activeElement.blur();
            }
            return;
        }

        // Dev Mode sequence tracking
        if (!this.devModeUnlocked) {
            this.keySequence += e.key.toLowerCase();
            if (this.keySequence.length > 10) {
                this.keySequence = this.keySequence.substring(this.keySequence.length - 10);
            }
            if (this.keySequence.endsWith('1001')) {
                this.devModeUnlocked = true;
                this.keySequence = '';
                console.log("Dev Mode Unlocked! Press 'U' to toggle.");
            }
        }

        // C key: toggle creative mode
        if ((e.code === 'KeyC' || e.key.toLowerCase() === 'c') && !this._menuKeysDown.creative) {
            this._menuKeysDown.creative = true;
            this.creativeMode = !this.creativeMode;
            this._creativeFlying = false;
            const toast = document.getElementById('creative-toast');
            if (toast) {
                toast.textContent = this.creativeMode ? '✦ Creative Mode ON' : '✦ Creative Mode OFF';
                toast.classList.remove('hidden');
                clearTimeout(this._toastTimer);
                this._toastTimer = setTimeout(() => toast.classList.add('hidden'), 2000);
            }
        }

        // Chat triggers: 'T' opens chat, '/' opens with command prefix
        if (this.onChatOpen && !e.ctrlKey && !e.altKey && !e.metaKey) {
            if (e.code === 'KeyT' || (!e.repeat && (e.key === 't' || e.key === 'T'))) {
                e.preventDefault();
                this.onChatOpen('');
                return;
            } else if (e.code === 'Slash' || (!e.repeat && e.key === '/')) {
                e.preventDefault();
                this.onChatOpen('/');
                return;
            }
        }

        if (e.key.toLowerCase() === 'u') {
            if (!this._menuKeysDown.devMode) {
                this.menuKeys.devMode = true;
                this._menuKeysDown.devMode = true;
            }
        }

        if (e.code === 'Tab' || e.code === 'F3' || e.code === 'F5') e.preventDefault();
        if (!this.isLocked && !['Escape', 'KeyE', 'KeyF', 'KeyP', 'Tab', 'KeyI', 'F3', 'F5', 'KeyQ', 'KeyM', 'KeyU', 'KeyL'].includes(e.code)) return;

        switch (e.code) {
            case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
            case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
            case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
            case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
            case 'Space':
                this.keys.jump = true;
                if (this.creativeMode && !e.repeat) {
                    const now = Date.now();
                    if (now - this._lastSpaceTime < 300) {
                        this._creativeFlying = !this._creativeFlying;
                        this._lastSpaceTime = 0; // Prevent consecutive fast toggles
                        const toast = document.getElementById('creative-toast');
                        if (toast) {
                            toast.textContent = this._creativeFlying ? '✈ Flying ON' : '✈ Flying OFF';
                            toast.classList.remove('hidden');
                            clearTimeout(this._toastTimer);
                            this._toastTimer = setTimeout(() => toast.classList.add('hidden'), 1500);
                        }
                    } else {
                        this._lastSpaceTime = now;
                    }
                }
                break;
            case 'ShiftLeft': case 'ShiftRight': this.keys.crouch = true; break;
            case 'ControlLeft': case 'ControlRight': this.keys.sprint = true; break;

            case 'Tab':
            case 'KeyI':
            case 'KeyE':
                if (!this._menuKeysDown.inventory) { this.menuKeys.inventory = true; this._menuKeysDown.inventory = true; }
                break;
            case 'KeyF':
                if (!this._menuKeysDown.spellConfig) { this.menuKeys.spellConfig = true; this._menuKeysDown.spellConfig = true; }
                break;
            case 'KeyP':
                if (!this._menuKeysDown.planet) { this.menuKeys.planet = true; this._menuKeysDown.planet = true; }
                break;
            case 'KeyM':
                if (!this._menuKeysDown.map) { this.menuKeys.map = true; this._menuKeysDown.map = true; }
                break;
            case 'Escape':
                if (!this._menuKeysDown.pause) { this.menuKeys.pause = true; this._menuKeysDown.pause = true; }
                break;
            case 'F3':
                if (!this._menuKeysDown.debug) { 
                    this.menuKeys.debug = true; 
                    this._menuKeysDown.debug = true; 
                }
                break;
            case 'F5':
                if (!this._menuKeysDown.togglePerspective) { 
                    this.menuKeys.togglePerspective = true; 
                    this._menuKeysDown.togglePerspective = true; 
                }
                break;
            case 'KeyQ':
                if (!this._menuKeysDown.dropItem) { this.menuKeys.dropItem = true; this._menuKeysDown.dropItem = true; }
                break;

            case 'Digit1': this.hotbarIndex = 0; break;
            case 'Digit2': this.hotbarIndex = 1; break;
            case 'Digit3': this.hotbarIndex = 2; break;
            case 'Digit4': this.hotbarIndex = 3; break;
            case 'Digit5': this.hotbarIndex = 4; break;
            case 'Digit6': this.hotbarIndex = 5; break;
            case 'Digit7': this.hotbarIndex = 6; break;
            case 'Digit8': this.hotbarIndex = 7; break;
            case 'Digit9': this.hotbarIndex = 8; break;
        }
    }

    onKeyUp(e) {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
            case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
            case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
            case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
            case 'Space': this.keys.jump = false; break;
            case 'ShiftLeft': case 'ShiftRight': this.keys.crouch = false; break;
            case 'ControlLeft': case 'ControlRight': this.keys.sprint = false; break;

            case 'Tab': case 'KeyI': case 'KeyE': this._menuKeysDown.inventory = false; break;
            case 'KeyF': this._menuKeysDown.spellConfig = false; break;
            case 'KeyP': this._menuKeysDown.planet = false; break;
            case 'KeyM': this._menuKeysDown.map = false; break;
            case 'Escape': this._menuKeysDown.pause = false; break;
            case 'F3': this._menuKeysDown.debug = false; break;
            case 'F5': this._menuKeysDown.togglePerspective = false; break;
            case 'ControlLeft': case 'ControlRight': this._menuKeysDown.debug = false; break;
            case 'KeyQ': this._menuKeysDown.dropItem = false; break;
            case 'KeyU': this._menuKeysDown.devMode = false; break;
            case 'KeyC': this._menuKeysDown.creative = false; break;
        }
    }
}

// ============================================
// GameEngine
// ============================================
export class GameEngine {
    constructor() {
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this._renderer = null;
    }

    get scene() { return this._scene; }
    get camera() { return this._camera; }
    get renderer() { return this._renderer; }

    init(canvas) {
        this._renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        // Default pixel ratio is clamped to 1.0 for smooth 60 FPS across all GPUs
        let initialRatio = 1.0;
        try {
            const stored = localStorage.getItem('slopcraft_resolution');
            if (stored !== null) {
                const val = parseInt(stored);
                if (val <= 50) initialRatio = 0.5;
                else if (val <= 75) initialRatio = 0.75;
                else if (val <= 100) initialRatio = 1.0;
                else if (val <= 125) initialRatio = 1.25;
                else initialRatio = Math.min(window.devicePixelRatio, 2.0);
            }
        } catch (e) {}
        this._renderer.setPixelRatio(initialRatio);

        // Simple light shadows
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Color management: Pure sRGB without tone mapping for authentic pixel art textures and natural Minecraft colors
        this._renderer.outputColorSpace = THREE.SRGBColorSpace;
        this._renderer.toneMapping = THREE.NoToneMapping;
        this._renderer.toneMappingExposure = 1.0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    setResolutionScale(val) {
        this._resolutionScaleVal = val;
        let ratio = 1.0;
        if (val <= 50) ratio = 0.5;
        else if (val <= 75) ratio = 0.75;
        else if (val <= 100) ratio = 1.0;
        else if (val <= 125) ratio = 1.25;
        else ratio = Math.min(window.devicePixelRatio, 2.0);

        if (this._renderer) {
            this._renderer.setPixelRatio(ratio);
            this._renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    resize() {
        if (!this._renderer || !this._camera) return;
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setFog(color, near, far) {
        this._scene.fog = new THREE.Fog(color, near, far);
    }
}

// ============================================
// Chunk
// ============================================

// Face definitions: normal, vertices (x,y,z), ambient occlusion vertex indices
const FACES = [
    { dir: [0, 1, 0], v: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], name: 'top', axis: 'y', dirSign: 1 }, // top (+Y)
    { dir: [0, -1, 0], v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], name: 'bottom', axis: 'y', dirSign: -1 }, // bottom (-Y)
    { dir: [1, 0, 0], v: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], name: 'side', axis: 'x', dirSign: 1 }, // right (+X, East)
    { dir: [-1, 0, 0], v: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], name: 'side', axis: 'x', dirSign: -1 }, // left (-X, West)
    { dir: [0, 0, 1], v: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], name: 'front', axis: 'z', dirSign: 1 }, // front (+Z, South)
    { dir: [0, 0, -1], v: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], name: 'side', axis: 'z', dirSign: -1 }, // back (-Z, North)
];
// ============================================
// Mesh Generation Buffers (Shared to eliminate GC)
// ============================================
const MAX_VERTICES = 2000000; // ~600k vertices is typical for a fully solid chunk, 2M is very safe
const MAX_INDICES = Math.floor(MAX_VERTICES / 4 * 6);

const _positions = new Float32Array(MAX_VERTICES * 3);
const _normals = new Float32Array(MAX_VERTICES * 3);
const _uvs = new Float32Array(MAX_VERTICES * 2);
const _colors = new Float32Array(MAX_VERTICES * 3);

const _opaqueIndices = new Uint32Array(MAX_INDICES);
const _crossIndices = new Uint32Array(MAX_INDICES);
const _glowCrossIndices = new Uint32Array(MAX_INDICES);
const _waterIndices = new Uint32Array(MAX_INDICES);
const _endPortalIndices = new Uint32Array(MAX_INDICES);
const _transparentIndices = new Uint32Array(MAX_INDICES);
const _glowOpaqueIndices = new Uint32Array(MAX_INDICES);
const _glowTransparentIndices = new Uint32Array(MAX_INDICES);
const _slightGlowOpaqueIndices = new Uint32Array(MAX_INDICES);
const _slightGlowTransparentIndices = new Uint32Array(MAX_INDICES);


const _rawGrassColors = new Float32Array(22 * 22 * 3);
const _tempGrass = new Float32Array(22 * 22 * 3);
const _blendedGrass = new Float32Array(16 * 16 * 3);
const _rawFoliageColors = new Float32Array(22 * 22 * 3);
const _tempFoliage = new Float32Array(22 * 22 * 3);
const _blendedFoliage = new Float32Array(16 * 16 * 3);
const _topOpaqueY = new Int16Array(28 * 28);

const _meshPool = [];

// ============================================
// Shader Customization: Grass Fringe Selective Tinting
// ============================================
// Tints only the green grass fringe on grass_block_side and leaves with the interpolated biome vertex color,
// while preserving 100% authentic brown dirt underneath with directional AO and face shading!
if (THREE.ShaderChunk && !THREE.ShaderChunk._slopcraftGrassFoliage) {
    THREE.ShaderChunk._slopcraftGrassFoliage = true;
    THREE.ShaderChunk.color_fragment = `
#ifdef USE_COLOR
    #ifdef USE_MAP
        // In grass_block_side: dirt has sampledDiffuseColor.r > sampledDiffuseColor.g * 1.15
        // Grass fringe and grass top have sampledDiffuseColor.g >= sampledDiffuseColor.r * 0.98
        if (sampledDiffuseColor.r > sampledDiffuseColor.g * 1.15 && sampledDiffuseColor.a > 0.5) {
            float ao = dot(vColor.rgb, vec3(0.299, 0.587, 0.114));
            diffuseColor.rgb *= ao;
        } else {
            diffuseColor.rgb *= vColor;
        }
    #else
        diffuseColor.rgb *= vColor;
    #endif
#endif
`;
}

// Precomputed horizontal neighbor offsets sorted by Euclidean distance
// Eliminates cardinal-axis stair-stepping and produces smooth circular light propagation
const SKY_OFFSETS = [
    // dist 1.0 (4)
    { dx:  1, dz:  0, dist: 1.000 },
    { dx: -1, dz:  0, dist: 1.000 },
    { dx:  0, dz:  1, dist: 1.000 },
    { dx:  0, dz: -1, dist: 1.000 },
    // dist 1.414 (4)
    { dx:  1, dz:  1, dist: 1.414 },
    { dx: -1, dz:  1, dist: 1.414 },
    { dx:  1, dz: -1, dist: 1.414 },
    { dx: -1, dz: -1, dist: 1.414 },
    // dist 2.0 (4)
    { dx:  2, dz:  0, dist: 2.000 },
    { dx: -2, dz:  0, dist: 2.000 },
    { dx:  0, dz:  2, dist: 2.000 },
    { dx:  0, dz: -2, dist: 2.000 },
    // dist 2.236 (8)
    { dx:  2, dz:  1, dist: 2.236 },
    { dx:  2, dz: -1, dist: 2.236 },
    { dx: -2, dz:  1, dist: 2.236 },
    { dx: -2, dz: -1, dist: 2.236 },
    { dx:  1, dz:  2, dist: 2.236 },
    { dx: -1, dz:  2, dist: 2.236 },
    { dx:  1, dz: -2, dist: 2.236 },
    { dx: -1, dz: -2, dist: 2.236 },
    // dist 2.828 (4)
    { dx:  2, dz:  2, dist: 2.828 },
    { dx: -2, dz:  2, dist: 2.828 },
    { dx:  2, dz: -2, dist: 2.828 },
    { dx: -2, dz: -2, dist: 2.828 },
    // dist 3.0 (4)
    { dx:  3, dz:  0, dist: 3.000 },
    { dx: -3, dz:  0, dist: 3.000 },
    { dx:  0, dz:  3, dist: 3.000 },
    { dx:  0, dz: -3, dist: 3.000 },
    // dist 3.162 (8)
    { dx:  3, dz:  1, dist: 3.162 },
    { dx:  3, dz: -1, dist: 3.162 },
    { dx: -3, dz:  1, dist: 3.162 },
    { dx: -3, dz: -1, dist: 3.162 },
    { dx:  1, dz:  3, dist: 3.162 },
    { dx: -1, dz:  3, dist: 3.162 },
    { dx:  1, dz: -3, dist: 3.162 },
    { dx: -1, dz: -3, dist: 3.162 },
    // dist 3.605 (8)
    { dx:  3, dz:  2, dist: 3.605 },
    { dx:  3, dz: -2, dist: 3.605 },
    { dx: -3, dz:  2, dist: 3.605 },
    { dx: -3, dz: -2, dist: 3.605 },
    { dx:  2, dz:  3, dist: 3.605 },
    { dx: -2, dz:  3, dist: 3.605 },
    { dx:  2, dz: -3, dist: 3.605 },
    { dx: -2, dz: -3, dist: 3.605 },
    // dist 4.0 (4)
    { dx:  4, dz:  0, dist: 4.000 },
    { dx: -4, dz:  0, dist: 4.000 },
    { dx:  0, dz:  4, dist: 4.000 },
    { dx:  0, dz: -4, dist: 4.000 },
    // dist 4.123 (8)
    { dx:  4, dz:  1, dist: 4.123 },
    { dx:  4, dz: -1, dist: 4.123 },
    { dx: -4, dz:  1, dist: 4.123 },
    { dx: -4, dz: -1, dist: 4.123 },
    { dx:  1, dz:  4, dist: 4.123 },
    { dx: -1, dz:  4, dist: 4.123 },
    { dx:  1, dz: -4, dist: 4.123 },
    { dx: -1, dz: -4, dist: 4.123 },
    // dist 4.242 (4)
    { dx:  3, dz:  3, dist: 4.242 },
    { dx: -3, dz:  3, dist: 4.242 },
    { dx:  3, dz: -3, dist: 4.242 },
    { dx: -3, dz: -3, dist: 4.242 },
    // dist 4.472 (8)
    { dx:  4, dz:  2, dist: 4.472 },
    { dx:  4, dz: -2, dist: 4.472 },
    { dx: -4, dz:  2, dist: 4.472 },
    { dx: -4, dz: -2, dist: 4.472 },
    { dx:  2, dz:  4, dist: 4.472 },
    { dx: -2, dz:  4, dist: 4.472 },
    { dx:  2, dz: -4, dist: 4.472 },
    { dx: -2, dz: -4, dist: 4.472 },
    // dist 5.0 (4)
    { dx:  5, dz:  0, dist: 5.000 },
    { dx: -5, dz:  0, dist: 5.000 },
    { dx:  0, dz:  5, dist: 5.000 },
    { dx:  0, dz: -5, dist: 5.000 },
    // dist 5.099 (8)
    { dx:  5, dz:  1, dist: 5.099 },
    { dx:  5, dz: -1, dist: 5.099 },
    { dx: -5, dz:  1, dist: 5.099 },
    { dx: -5, dz: -1, dist: 5.099 },
    { dx:  1, dz:  5, dist: 5.099 },
    { dx: -1, dz:  5, dist: 5.099 },
    { dx:  1, dz: -5, dist: 5.099 },
    { dx: -1, dz: -5, dist: 5.099 },
    // dist 5.385 (8)
    { dx:  5, dz:  2, dist: 5.385 },
    { dx:  5, dz: -2, dist: 5.385 },
    { dx: -5, dz:  2, dist: 5.385 },
    { dx: -5, dz: -2, dist: 5.385 },
    { dx:  2, dz:  5, dist: 5.385 },
    { dx: -2, dz:  5, dist: 5.385 },
    { dx:  2, dz: -5, dist: 5.385 },
    { dx: -2, dz: -5, dist: 5.385 }
];

export class Chunk {
    constructor(cx, cz) {
        this.cx = cx;
        this.cz = cz;
        this.blocks = new Uint16Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
        this.data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
        this.mesh = null;
        this.waterMesh = null;
        this.endPortalMesh = null;
        this.dirty = false;
        this._generated = false;
        this._inBuildQueue = false;
        this._inGenQueue = false;
        this.worldBox = new THREE.Box3(
            new THREE.Vector3(cx * CHUNK_SIZE - 2, -2, cz * CHUNK_SIZE - 2),
            new THREE.Vector3(cx * CHUNK_SIZE + CHUNK_SIZE + 2, CHUNK_HEIGHT + 2, cz * CHUNK_SIZE + CHUNK_SIZE + 2)
        );
    }

    getBlock(lx, ly, lz) {
        if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_HEIGHT || lz < 0 || lz >= CHUNK_SIZE) return BLOCKS.AIR;
        return this.blocks[(ly * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx];
    }

    setBlock(lx, ly, lz, type) {
        if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_HEIGHT || lz < 0 || lz >= CHUNK_SIZE) return;
        this.blocks[(ly * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx] = type;
        this.dirty = true;
    }

    getData(lx, ly, lz) {
        if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_HEIGHT || lz < 0 || lz >= CHUNK_SIZE) return 0;
        return this.data[(ly * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx];
    }

    setData(lx, ly, lz, dataValue) {
        if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_HEIGHT || lz < 0 || lz >= CHUNK_SIZE) return;
        this.data[(ly * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx] = dataValue;
    }

    buildMesh(atlas, neighborChunks, planetParams = null) {
        // Create an optimized local getter to avoid Hash Map lookups across chunk boundaries
        const getBlockOptimized = (wx, wy, wz) => {
            if (wy < 0 || wy >= CHUNK_HEIGHT) return BLOCKS.AIR;
            const dcx = Math.floor(wx / CHUNK_SIZE) - this.cx;
            const dcz = Math.floor(wz / CHUNK_SIZE) - this.cz;
            if (dcx >= -1 && dcx <= 1 && dcz >= -1 && dcz <= 1) {
                const c = neighborChunks[dcx + 1][dcz + 1];
                if (c) {
                    const lx = wx - (this.cx + dcx) * CHUNK_SIZE;
                    const lz = wz - (this.cz + dcz) * CHUNK_SIZE;
                    return c.blocks[(wy * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx];
                }
            }
            return BLOCKS.AIR;
        };

        const getDataOptimized = (wx, wy, wz) => {
            if (wy < 0 || wy >= CHUNK_HEIGHT) return 0;
            const dcx = Math.floor(wx / CHUNK_SIZE) - this.cx;
            const dcz = Math.floor(wz / CHUNK_SIZE) - this.cz;
            if (dcx >= -1 && dcx <= 1 && dcz >= -1 && dcz <= 1) {
                const c = neighborChunks[dcx + 1][dcz + 1];
                if (c) {
                    const lx = wx - (this.cx + dcx) * CHUNK_SIZE;
                    const lz = wz - (this.cz + dcz) * CHUNK_SIZE;
                    return c.data[(wy * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx];
                }
            }
            return 0;
        };

        const wxBase = this.cx * CHUNK_SIZE;
        const wzBase = this.cz * CHUNK_SIZE;

        // 5x5 Biome Color Blending: smooth continuous gradient across biome boundaries
        const plainsR = 145 / 255, plainsG = 189 / 255, plainsB = 89 / 255;
        const folPlainsR = 119 / 255, folPlainsG = 171 / 255, folPlainsB = 47 / 255;
        const BLEND_RAD = 2; // 5x5 smoothing kernel
        const PADDING = 3;
        const gridDim = CHUNK_SIZE + PADDING * 2;
        const rawGrassColors = _rawGrassColors;
        const rawFoliageColors = _rawFoliageColors;

        for (let lz = -PADDING; lz < CHUNK_SIZE + PADDING; lz++) {
            for (let lx = -PADDING; lx < CHUNK_SIZE + PADDING; lx++) {
                const bInfo = getBiomeParams(wxBase + lx, wzBase + lz, planetParams);
                const gCol = (bInfo && bInfo.biome && bInfo.biome.grassColor) ? bInfo.biome.grassColor : [plainsR, plainsG, plainsB];
                const fCol = (bInfo && bInfo.biome && bInfo.biome.foliageColor) ? bInfo.biome.foliageColor : [folPlainsR, folPlainsG, folPlainsB];
                const idx = ((lz + PADDING) * gridDim + (lx + PADDING)) * 3;
                rawGrassColors[idx] = gCol[0];
                rawGrassColors[idx + 1] = gCol[1];
                rawGrassColors[idx + 2] = gCol[2];
                rawFoliageColors[idx] = fCol[0];
                rawFoliageColors[idx + 1] = fCol[1];
                rawFoliageColors[idx + 2] = fCol[2];
            }
        }

        const tempGrass = _tempGrass;
        const blendedGrass = _blendedGrass;
        const tempFoliage = _tempFoliage;
        const blendedFoliage = _blendedFoliage;
        const kSize = BLEND_RAD * 2 + 1; // 5

        for (let gz = 0; gz < gridDim; gz++) {
            for (let gx = BLEND_RAD; gx < gridDim - BLEND_RAD; gx++) {
                let sr = 0, sg = 0, sb = 0;
                let fr = 0, fg = 0, fb = 0;
                for (let dx = -BLEND_RAD; dx <= BLEND_RAD; dx++) {
                    const idx = (gz * gridDim + (gx + dx)) * 3;
                    sr += rawGrassColors[idx];
                    sg += rawGrassColors[idx + 1];
                    sb += rawGrassColors[idx + 2];
                    fr += rawFoliageColors[idx];
                    fg += rawFoliageColors[idx + 1];
                    fb += rawFoliageColors[idx + 2];
                }
                const outIdx = (gz * gridDim + gx) * 3;
                tempGrass[outIdx] = sr / kSize;
                tempGrass[outIdx + 1] = sg / kSize;
                tempGrass[outIdx + 2] = sb / kSize;
                tempFoliage[outIdx] = fr / kSize;
                tempFoliage[outIdx + 1] = fg / kSize;
                tempFoliage[outIdx + 2] = fb / kSize;
            }
        }

        for (let bx = 0; bx < CHUNK_SIZE; bx++) {
            const gx = bx + PADDING;
            for (let bz = 0; bz < CHUNK_SIZE; bz++) {
                const gz = bz + PADDING;
                let sr = 0, sg = 0, sb = 0;
                let fr = 0, fg = 0, fb = 0;
                for (let dz = -BLEND_RAD; dz <= BLEND_RAD; dz++) {
                    const idx = ((gz + dz) * gridDim + gx) * 3;
                    sr += tempGrass[idx];
                    sg += tempGrass[idx + 1];
                    sb += tempGrass[idx + 2];
                    fr += tempFoliage[idx];
                    fg += tempFoliage[idx + 1];
                    fb += tempFoliage[idx + 2];
                }
                const bIdx = (bz * CHUNK_SIZE + bx) * 3;
                blendedGrass[bIdx] = sr / kSize;
                blendedGrass[bIdx + 1] = sg / kSize;
                blendedGrass[bIdx + 2] = sb / kSize;
                blendedFoliage[bIdx] = fr / kSize;
                blendedFoliage[bIdx + 1] = fg / kSize;
                blendedFoliage[bIdx + 2] = fb / kSize;
            }
        }

        // Minecraft Sky Light & Overhang Occlusion:
        // Precompute the top opaque/solid block for a 28x28 column grid around the chunk
        const SKY_PAD = 6;
        const SKY_DIM = CHUNK_SIZE + SKY_PAD * 2; // 28
        const topOpaqueY = _topOpaqueY;

        for (let gz = 0; gz < SKY_DIM; gz++) {
            const wz = wzBase + gz - SKY_PAD;
            for (let gx = 0; gx < SKY_DIM; gx++) {
                const wx = wxBase + gx - SKY_PAD;
                let topY = -1;
                for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
                    const b = getBlockOptimized(wx, y, wz);
                    if (b !== BLOCKS.AIR && b !== BLOCKS.WATER && b !== BLOCKS.SWAMP_WATER && b !== BLOCKS.GLASS && !getBlockProperties(b).isTransparent) {
                        topY = y;
                        break;
                    }
                }
                topOpaqueY[gz * SKY_DIM + gx] = topY;
            }
        }

        const getSkyLightFactor = (nx, ny, nz) => {
            const gx = nx + SKY_PAD;
            const gz = nz + SKY_PAD;
            if (gx < 0 || gx >= SKY_DIM || gz < 0 || gz >= SKY_DIM) return 1.0;
            if (ny > topOpaqueY[gz * SKY_DIM + gx]) return 1.0; // Open directly to the sky

            // Under an overhang or in a cave:
            // Find continuous Euclidean distance to nearest open-sky column at altitude ny
            let minDist = 6.0;
            for (let i = 0; i < SKY_OFFSETS.length; i++) {
                const off = SKY_OFFSETS[i];
                const ngx = gx + off.dx;
                const ngz = gz + off.dz;
                if (ngx >= 0 && ngx < SKY_DIM && ngz >= 0 && ngz < SKY_DIM) {
                    if (ny > topOpaqueY[ngz * SKY_DIM + ngx]) {
                        minDist = off.dist;
                        break;
                    }
                }
            }

            // Smooth S-curve (cubic Hermite) transition from 1.0 down to 0.52 (ambient overhang/cave light)
            const t = Math.min(1.0, minDist / 6.0);
            const smoothT = t * t * (3.0 - 2.0 * t);
            return 1.0 - smoothT * 0.48;
        };

        let posCount = 0;
        let uvCount = 0;
        let colorCount = 0;

        let opaqueIndexCount = 0;
        let crossIndexCount = 0;
        let glowCrossIndexCount = 0;
        let waterIndexCount = 0;
        let endPortalIndexCount = 0;
        let transparentIndexCount = 0;
        let glowOpaqueIndexCount = 0;
        let glowTransparentIndexCount = 0;
        let slightGlowOpaqueIndexCount = 0;
        let slightGlowTransparentIndexCount = 0;


        let vertexCount = 0;

        const pushCustomBox = (minX, minY, minZ, maxX, maxY, maxZ, bx, by, bz, uvTop, uvSide, uvBottom, cullMask = 0, aoMult = 1.0, isGlowing = false, isEndPortal = false, isTransparent = false) => {
            const addBoxQuad = (base) => {
                if (isEndPortal) {
                    _endPortalIndices[endPortalIndexCount++] = base;
                    _endPortalIndices[endPortalIndexCount++] = base + 1;
                    _endPortalIndices[endPortalIndexCount++] = base + 2;
                    _endPortalIndices[endPortalIndexCount++] = base;
                    _endPortalIndices[endPortalIndexCount++] = base + 2;
                    _endPortalIndices[endPortalIndexCount++] = base + 3;
                } else if (isGlowing) {
                    _glowTransparentIndices[glowTransparentIndexCount++] = base;
                    _glowTransparentIndices[glowTransparentIndexCount++] = base + 1;
                    _glowTransparentIndices[glowTransparentIndexCount++] = base + 2;
                    _glowTransparentIndices[glowTransparentIndexCount++] = base;
                    _glowTransparentIndices[glowTransparentIndexCount++] = base + 2;
                    _glowTransparentIndices[glowTransparentIndexCount++] = base + 3;
                } else if (isTransparent) {
                    _transparentIndices[transparentIndexCount++] = base;
                    _transparentIndices[transparentIndexCount++] = base + 1;
                    _transparentIndices[transparentIndexCount++] = base + 2;
                    _transparentIndices[transparentIndexCount++] = base;
                    _transparentIndices[transparentIndexCount++] = base + 2;
                    _transparentIndices[transparentIndexCount++] = base + 3;
                } else {
                    _opaqueIndices[opaqueIndexCount++] = base;
                    _opaqueIndices[opaqueIndexCount++] = base + 1;
                    _opaqueIndices[opaqueIndexCount++] = base + 2;
                    _opaqueIndices[opaqueIndexCount++] = base;
                    _opaqueIndices[opaqueIndexCount++] = base + 2;
                    _opaqueIndices[opaqueIndexCount++] = base + 3;
                }
            };

            // Top (+Y)
            if (!(cullMask & 1)) {
                _positions[posCount++] = minX; _positions[posCount++] = maxY; _positions[posCount++] = maxZ;
                _positions[posCount++] = maxX; _positions[posCount++] = maxY; _positions[posCount++] = maxZ;
                _positions[posCount++] = maxX; _positions[posCount++] = maxY; _positions[posCount++] = minZ;
                _positions[posCount++] = minX; _positions[posCount++] = maxY; _positions[posCount++] = minZ;

                for (let k = 0; k < 4; k++) {
                    _normals[posCount - 12 + k * 3] = 0; _normals[posCount - 11 + k * 3] = 1; _normals[posCount - 10 + k * 3] = 0;
                    _colors[colorCount++] = aoMult; _colors[colorCount++] = aoMult; _colors[colorCount++] = aoMult;
                }

                _uvs[uvCount++] = uvTop.u + (minX - bx) * uvTop.uSize; _uvs[uvCount++] = uvTop.v + (minZ - bz) * uvTop.vSize;
                _uvs[uvCount++] = uvTop.u + (maxX - bx) * uvTop.uSize; _uvs[uvCount++] = uvTop.v + (minZ - bz) * uvTop.vSize;
                _uvs[uvCount++] = uvTop.u + (maxX - bx) * uvTop.uSize; _uvs[uvCount++] = uvTop.v + (maxZ - bz) * uvTop.vSize;
                _uvs[uvCount++] = uvTop.u + (minX - bx) * uvTop.uSize; _uvs[uvCount++] = uvTop.v + (maxZ - bz) * uvTop.vSize;

                const base = vertexCount;
                addBoxQuad(base);
                vertexCount += 4;
            }

            // Bottom (-Y)
            if (!(cullMask & 2)) {
                _positions[posCount++] = minX; _positions[posCount++] = minY; _positions[posCount++] = minZ;
                _positions[posCount++] = maxX; _positions[posCount++] = minY; _positions[posCount++] = minZ;
                _positions[posCount++] = maxX; _positions[posCount++] = minY; _positions[posCount++] = maxZ;
                _positions[posCount++] = minX; _positions[posCount++] = minY; _positions[posCount++] = maxZ;

                for (let k = 0; k < 4; k++) {
                    _normals[posCount - 12 + k * 3] = 0; _normals[posCount - 11 + k * 3] = -1; _normals[posCount - 10 + k * 3] = 0;
                    const c = aoMult * 0.5;
                    _colors[colorCount++] = c; _colors[colorCount++] = c; _colors[colorCount++] = c;
                }

                _uvs[uvCount++] = uvBottom.u + (minX - bx) * uvBottom.uSize; _uvs[uvCount++] = uvBottom.v + (minZ - bz) * uvBottom.vSize;
                _uvs[uvCount++] = uvBottom.u + (maxX - bx) * uvBottom.uSize; _uvs[uvCount++] = uvBottom.v + (minZ - bz) * uvBottom.vSize;
                _uvs[uvCount++] = uvBottom.u + (maxX - bx) * uvBottom.uSize; _uvs[uvCount++] = uvBottom.v + (maxZ - bz) * uvBottom.vSize;
                _uvs[uvCount++] = uvBottom.u + (minX - bx) * uvBottom.uSize; _uvs[uvCount++] = uvBottom.v + (maxZ - bz) * uvBottom.vSize;

                const base = vertexCount;
                addBoxQuad(base);
                vertexCount += 4;
            }

            // East (+X)
            if (!(cullMask & 4)) {
                _positions[posCount++] = maxX; _positions[posCount++] = minY; _positions[posCount++] = maxZ;
                _positions[posCount++] = maxX; _positions[posCount++] = minY; _positions[posCount++] = minZ;
                _positions[posCount++] = maxX; _positions[posCount++] = maxY; _positions[posCount++] = minZ;
                _positions[posCount++] = maxX; _positions[posCount++] = maxY; _positions[posCount++] = maxZ;

                for (let k = 0; k < 4; k++) {
                    _normals[posCount - 12 + k * 3] = 1; _normals[posCount - 11 + k * 3] = 0; _normals[posCount - 10 + k * 3] = 0;
                    const c = aoMult * 0.6;
                    _colors[colorCount++] = c; _colors[colorCount++] = c; _colors[colorCount++] = c;
                }

                _uvs[uvCount++] = uvSide.u + (minZ - bz) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (minY - by) * uvSide.vSize;
                _uvs[uvCount++] = uvSide.u + (maxZ - bz) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (minY - by) * uvSide.vSize;
                _uvs[uvCount++] = uvSide.u + (maxZ - bz) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (maxY - by) * uvSide.vSize;
                _uvs[uvCount++] = uvSide.u + (minZ - bz) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (maxY - by) * uvSide.vSize;

                const base = vertexCount;
                addBoxQuad(base);
                vertexCount += 4;
            }

            // West (-X)
            if (!(cullMask & 8)) {
                _positions[posCount++] = minX; _positions[posCount++] = minY; _positions[posCount++] = minZ;
                _positions[posCount++] = minX; _positions[posCount++] = minY; _positions[posCount++] = maxZ;
                _positions[posCount++] = minX; _positions[posCount++] = maxY; _positions[posCount++] = maxZ;
                _positions[posCount++] = minX; _positions[posCount++] = maxY; _positions[posCount++] = minZ;

                for (let k = 0; k < 4; k++) {
                    _normals[posCount - 12 + k * 3] = -1; _normals[posCount - 11 + k * 3] = 0; _normals[posCount - 10 + k * 3] = 0;
                    const c = aoMult * 0.6;
                    _colors[colorCount++] = c; _colors[colorCount++] = c; _colors[colorCount++] = c;
                }

                _uvs[uvCount++] = uvSide.u + (1 - (maxZ - bz)) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (minY - by) * uvSide.vSize;
                _uvs[uvCount++] = uvSide.u + (1 - (minZ - bz)) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (minY - by) * uvSide.vSize;
                _uvs[uvCount++] = uvSide.u + (1 - (minZ - bz)) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (maxY - by) * uvSide.vSize;
                _uvs[uvCount++] = uvSide.u + (1 - (maxZ - bz)) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (maxY - by) * uvSide.vSize;

                const base = vertexCount;
                addBoxQuad(base);
                vertexCount += 4;
            }

            // South (+Z)
            if (!(cullMask & 16)) {
                _positions[posCount++] = minX; _positions[posCount++] = minY; _positions[posCount++] = maxZ;
                _positions[posCount++] = maxX; _positions[posCount++] = minY; _positions[posCount++] = maxZ;
                _positions[posCount++] = maxX; _positions[posCount++] = maxY; _positions[posCount++] = maxZ;
                _positions[posCount++] = minX; _positions[posCount++] = maxY; _positions[posCount++] = maxZ;

                for (let k = 0; k < 4; k++) {
                    _normals[posCount - 12 + k * 3] = 0; _normals[posCount - 11 + k * 3] = 0; _normals[posCount - 10 + k * 3] = 1;
                    const c = aoMult * 0.8;
                    _colors[colorCount++] = c; _colors[colorCount++] = c; _colors[colorCount++] = c;
                }

                _uvs[uvCount++] = uvSide.u + (minX - bx) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (minY - by) * uvSide.vSize;
                _uvs[uvCount++] = uvSide.u + (maxX - bx) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (minY - by) * uvSide.vSize;
                _uvs[uvCount++] = uvSide.u + (maxX - bx) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (maxY - by) * uvSide.vSize;
                _uvs[uvCount++] = uvSide.u + (minX - bx) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (maxY - by) * uvSide.vSize;

                const base = vertexCount;
                addBoxQuad(base);
                vertexCount += 4;
            }

            // North (-Z)
            if (!(cullMask & 32)) {
                _positions[posCount++] = maxX; _positions[posCount++] = minY; _positions[posCount++] = minZ;
                _positions[posCount++] = minX; _positions[posCount++] = minY; _positions[posCount++] = minZ;
                _positions[posCount++] = minX; _positions[posCount++] = maxY; _positions[posCount++] = minZ;
                _positions[posCount++] = maxX; _positions[posCount++] = maxY; _positions[posCount++] = minZ;

                for (let k = 0; k < 4; k++) {
                    _normals[posCount - 12 + k * 3] = 0; _normals[posCount - 11 + k * 3] = 0; _normals[posCount - 10 + k * 3] = -1;
                    const c = aoMult * 0.8;
                    _colors[colorCount++] = c; _colors[colorCount++] = c; _colors[colorCount++] = c;
                }

                _uvs[uvCount++] = uvSide.u + (1 - (maxX - bx)) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (minY - by) * uvSide.vSize;
                _uvs[uvCount++] = uvSide.u + (1 - (minX - bx)) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (minY - by) * uvSide.vSize;
                _uvs[uvCount++] = uvSide.u + (1 - (minX - bx)) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (maxY - by) * uvSide.vSize;
                _uvs[uvCount++] = uvSide.u + (1 - (maxX - bx)) * uvSide.uSize; _uvs[uvCount++] = uvSide.v + (maxY - by) * uvSide.vSize;

                const base = vertexCount;
                addBoxQuad(base);
                vertexCount += 4;
            }
        };

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                for (let x = 0; x < CHUNK_SIZE; x++) {
                    const blockType = this.getBlock(x, y, z);
                    const props = getBlockProperties(blockType);
                    if (blockType === BLOCKS.AIR || blockType === BLOCKS.CHEST_BLOCK || blockType === BLOCKS.DUNGEON_DOOR || blockType === BLOCKS.DUNGEON_DOOR_TOP || props.isFenceGate || props.isBed || props.isBedHead) continue;

                    const wx = wxBase + x;
                    const wz = wzBase + z;

                    if (props.isLilyPad) {
                        const uvInfo = atlas.getUV(blockType, 'side');
                        const padY = y + 0.015;
                        _positions[posCount++] = x;     _positions[posCount++] = padY; _positions[posCount++] = z;
                        _positions[posCount++] = x + 1; _positions[posCount++] = padY; _positions[posCount++] = z;
                        _positions[posCount++] = x + 1; _positions[posCount++] = padY; _positions[posCount++] = z + 1;
                        _positions[posCount++] = x;     _positions[posCount++] = padY; _positions[posCount++] = z + 1;

                        for (let k = 0; k < 4; k++) {
                            _normals[posCount - 12 + k * 3] = 0;
                            _normals[posCount - 11 + k * 3] = 1;
                            _normals[posCount - 10 + k * 3] = 0;
                            _colors[colorCount++] = 1.0;
                            _colors[colorCount++] = 1.0;
                            _colors[colorCount++] = 1.0;
                        }

                        _uvs[uvCount++] = uvInfo.u;                 _uvs[uvCount++] = uvInfo.v;
                        _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v;
                        _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;
                        _uvs[uvCount++] = uvInfo.u;                 _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;

                        _transparentIndices[transparentIndexCount++] = vertexCount;
                        _transparentIndices[transparentIndexCount++] = vertexCount + 1;
                        _transparentIndices[transparentIndexCount++] = vertexCount + 2;
                        _transparentIndices[transparentIndexCount++] = vertexCount;
                        _transparentIndices[transparentIndexCount++] = vertexCount + 2;
                        _transparentIndices[transparentIndexCount++] = vertexCount + 3;
                        vertexCount += 4;
                        continue;
                    }

                    if (props.isCross) {
                        let uvInfo;
                        if (blockType === BLOCKS.POINTED_DRIPSTONE_DOWN) {
                            const bAbove = (y + 1 < CHUNK_HEIGHT) ? this.getBlock(x, y + 1, z) : getBlockOptimized(wx, y + 1, wz);
                            const bBelow = (y > 0) ? this.getBlock(x, y - 1, z) : getBlockOptimized(wx, y - 1, wz);
                            let stage = 'tip';
                            if (bBelow === BLOCKS.POINTED_DRIPSTONE_UP) {
                                stage = 'merge';
                            } else if (bBelow !== BLOCKS.POINTED_DRIPSTONE_DOWN) {
                                stage = 'tip';
                            } else if (bAbove !== BLOCKS.POINTED_DRIPSTONE_DOWN) {
                                stage = 'base';
                            } else {
                                const bBelow2 = (y > 1) ? this.getBlock(x, y - 2, z) : getBlockOptimized(wx, y - 2, wz);
                                stage = (bBelow2 !== BLOCKS.POINTED_DRIPSTONE_DOWN && bBelow2 !== BLOCKS.POINTED_DRIPSTONE_UP) ? 'frustum' : 'middle';
                            }
                            uvInfo = atlas.getUV(blockType, stage);
                        } else if (blockType === BLOCKS.POINTED_DRIPSTONE_UP) {
                            const bAbove = (y + 1 < CHUNK_HEIGHT) ? this.getBlock(x, y + 1, z) : getBlockOptimized(wx, y + 1, wz);
                            const bBelow = (y > 0) ? this.getBlock(x, y - 1, z) : getBlockOptimized(wx, y - 1, wz);
                            let stage = 'tip';
                            if (bAbove === BLOCKS.POINTED_DRIPSTONE_DOWN) {
                                stage = 'merge';
                            } else if (bAbove !== BLOCKS.POINTED_DRIPSTONE_UP) {
                                stage = 'tip';
                            } else if (bBelow !== BLOCKS.POINTED_DRIPSTONE_UP) {
                                stage = 'base';
                            } else {
                                const bAbove2 = (y + 2 < CHUNK_HEIGHT) ? this.getBlock(x, y + 2, z) : getBlockOptimized(wx, y + 2, wz);
                                stage = (bAbove2 !== BLOCKS.POINTED_DRIPSTONE_UP && bAbove2 !== BLOCKS.POINTED_DRIPSTONE_DOWN) ? 'frustum' : 'middle';
                            }
                            uvInfo = atlas.getUV(blockType, stage);
                        } else {
                            uvInfo = atlas.getUV(blockType, 'side');
                        }
                        
                        let topAO = 1.0;
                        let bottomAO = 1.0;
                        if (blockType !== BLOCKS.TORCH) {
                            const belowBlock = (y > 0) ? this.getBlock(x, y - 1, z) : getBlockOptimized(wx, y - 1, wz);
                            const hasGround = getBlockProperties(belowBlock).solid;
                            bottomAO = hasGround ? 0.72 : 0.90;

                            let occludeCount = 0;
                            if (getBlockProperties(getBlockOptimized(wx + 1, y, wz)).solid) occludeCount++;
                            if (getBlockProperties(getBlockOptimized(wx - 1, y, wz)).solid) occludeCount++;
                            if (getBlockProperties(getBlockOptimized(wx, y, wz + 1)).solid) occludeCount++;
                            if (getBlockProperties(getBlockOptimized(wx, y, wz - 1)).solid) occludeCount++;
                            if (occludeCount > 0) {
                                const occFactor = Math.max(0.65, 1.0 - occludeCount * 0.08);
                                topAO *= occFactor;
                                bottomAO *= occFactor;
                            }
                        }

                        const plantSkyLight = getSkyLightFactor(x, y, z);
                        topAO *= plantSkyLight;
                        bottomAO *= plantSkyLight;
                        let plantR = 1.0, plantG = 1.0, plantB = 1.0;
                        if (blockType === BLOCKS.VINES) {
                            const bColIdx = (z * CHUNK_SIZE + x) * 3;
                            plantR = blendedFoliage[bColIdx]; plantG = blendedFoliage[bColIdx + 1]; plantB = blendedFoliage[bColIdx + 2];
                        } else if (blockType === BLOCKS.TALL_GRASS || blockType === BLOCKS.FERN || blockType === BLOCKS.OASIS_FERN) {
                            const bColIdx = (z * CHUNK_SIZE + x) * 3;
                            plantR = blendedGrass[bColIdx]; plantG = blendedGrass[bColIdx + 1]; plantB = blendedGrass[bColIdx + 2];
                        }

                        const y0 = props.isCrop ? (y - 1/16) : y;
                        const y1 = props.isCrop ? (y - 1/16 + 1.0) : (y + 1);

                        // Authentic Minecraft crop rendering (4 parallel planes) vs standard cross (2 diagonal planes)
                        const isCropHash = props.isCrop && (blockType !== BLOCKS.PUMPKIN_STEM && blockType !== BLOCKS.MELON_STEM);

                        if (isCropHash) {
                            const planes = [
                                [x, y0, z + 0.25, x + 1, y0, z + 0.25, x + 1, y1, z + 0.25, x, y1, z + 0.25],
                                [x, y0, z + 0.75, x + 1, y0, z + 0.75, x + 1, y1, z + 0.75, x, y1, z + 0.75],
                                [x + 0.25, y0, z, x + 0.25, y0, z + 1, x + 0.25, y1, z + 1, x + 0.25, y1, z],
                                [x + 0.75, y0, z, x + 0.75, y0, z + 1, x + 0.75, y1, z + 1, x + 0.75, y1, z]
                            ];
                            for (const p of planes) {
                                for (let vi = 0; vi < 12; vi += 3) {
                                    _positions[posCount++] = p[vi];
                                    _positions[posCount++] = p[vi + 1];
                                    _positions[posCount++] = p[vi + 2];
                                    _normals[posCount - 3] = 0; _normals[posCount - 2] = 1; _normals[posCount - 1] = 0;
                                }
                                _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v;
                                _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v;
                                _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;
                                _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;

                                _colors[colorCount++] = bottomAO * plantR; _colors[colorCount++] = bottomAO * plantG; _colors[colorCount++] = bottomAO * plantB;
                                _colors[colorCount++] = bottomAO * plantR; _colors[colorCount++] = bottomAO * plantG; _colors[colorCount++] = bottomAO * plantB;
                                _colors[colorCount++] = topAO * plantR; _colors[colorCount++] = topAO * plantG; _colors[colorCount++] = topAO * plantB;
                                _colors[colorCount++] = topAO * plantR; _colors[colorCount++] = topAO * plantG; _colors[colorCount++] = topAO * plantB;

                                _crossIndices[crossIndexCount++] = vertexCount; _crossIndices[crossIndexCount++] = vertexCount + 1; _crossIndices[crossIndexCount++] = vertexCount + 2;
                                _crossIndices[crossIndexCount++] = vertexCount; _crossIndices[crossIndexCount++] = vertexCount + 2; _crossIndices[crossIndexCount++] = vertexCount + 3;
                                vertexCount += 4;
                            }
                        } else {
                            // Diagonal 1
                            _positions[posCount++] = x; _positions[posCount++] = y0; _positions[posCount++] = z;
                            _positions[posCount++] = x + 1; _positions[posCount++] = y0; _positions[posCount++] = z + 1;
                            _positions[posCount++] = x + 1; _positions[posCount++] = y1; _positions[posCount++] = z + 1;
                            _positions[posCount++] = x; _positions[posCount++] = y1; _positions[posCount++] = z;
                            
                            _normals[posCount - 12] = 0; _normals[posCount - 11] = 1; _normals[posCount - 10] = 0;
                            _normals[posCount - 9] = 0; _normals[posCount - 8] = 1; _normals[posCount - 7] = 0;
                            _normals[posCount - 6] = 0; _normals[posCount - 5] = 1; _normals[posCount - 4] = 0;
                            _normals[posCount - 3] = 0; _normals[posCount - 2] = 1; _normals[posCount - 1] = 0;

                            _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v;
                            _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v;
                            _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;
                            _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;

                            _colors[colorCount++] = bottomAO * plantR; _colors[colorCount++] = bottomAO * plantG; _colors[colorCount++] = bottomAO * plantB;
                            _colors[colorCount++] = bottomAO * plantR; _colors[colorCount++] = bottomAO * plantG; _colors[colorCount++] = bottomAO * plantB;
                            _colors[colorCount++] = topAO * plantR; _colors[colorCount++] = topAO * plantG; _colors[colorCount++] = topAO * plantB;
                            _colors[colorCount++] = topAO * plantR; _colors[colorCount++] = topAO * plantG; _colors[colorCount++] = topAO * plantB;

                            // Diagonal 2
                            _positions[posCount++] = x; _positions[posCount++] = y0; _positions[posCount++] = z + 1;
                            _positions[posCount++] = x + 1; _positions[posCount++] = y0; _positions[posCount++] = z;
                            _positions[posCount++] = x + 1; _positions[posCount++] = y1; _positions[posCount++] = z;
                            _positions[posCount++] = x; _positions[posCount++] = y1; _positions[posCount++] = z + 1;

                            _normals[posCount - 12] = 0; _normals[posCount - 11] = 1; _normals[posCount - 10] = 0;
                            _normals[posCount - 9] = 0; _normals[posCount - 8] = 1; _normals[posCount - 7] = 0;
                            _normals[posCount - 6] = 0; _normals[posCount - 5] = 1; _normals[posCount - 4] = 0;
                            _normals[posCount - 3] = 0; _normals[posCount - 2] = 1; _normals[posCount - 1] = 0;

                            _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v;
                            _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v;
                            _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;
                            _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;

                            _colors[colorCount++] = bottomAO * plantR; _colors[colorCount++] = bottomAO * plantG; _colors[colorCount++] = bottomAO * plantB;
                            _colors[colorCount++] = bottomAO * plantR; _colors[colorCount++] = bottomAO * plantG; _colors[colorCount++] = bottomAO * plantB;
                            _colors[colorCount++] = topAO * plantR; _colors[colorCount++] = topAO * plantG; _colors[colorCount++] = topAO * plantB;
                            _colors[colorCount++] = topAO * plantR; _colors[colorCount++] = topAO * plantG; _colors[colorCount++] = topAO * plantB;

                            if (blockType === BLOCKS.TORCH) {
                                _glowCrossIndices[glowCrossIndexCount++] = vertexCount; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 1; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 2;
                                _glowCrossIndices[glowCrossIndexCount++] = vertexCount; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 2; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 3;
                                _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 4; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 5; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 6;
                                _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 4; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 6; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 7;
                            } else {
                                _crossIndices[crossIndexCount++] = vertexCount; _crossIndices[crossIndexCount++] = vertexCount + 1; _crossIndices[crossIndexCount++] = vertexCount + 2;
                                _crossIndices[crossIndexCount++] = vertexCount; _crossIndices[crossIndexCount++] = vertexCount + 2; _crossIndices[crossIndexCount++] = vertexCount + 3;
                                _crossIndices[crossIndexCount++] = vertexCount + 4; _crossIndices[crossIndexCount++] = vertexCount + 5; _crossIndices[crossIndexCount++] = vertexCount + 6;
                                _crossIndices[crossIndexCount++] = vertexCount + 4; _crossIndices[crossIndexCount++] = vertexCount + 6; _crossIndices[crossIndexCount++] = vertexCount + 7;
                            }
                            vertexCount += 8;
                        }
                    }

                    let currentBlockType = blockType;
                    let currentProps = props;

                    if (props.isCross) {
                        if (props.isWaterlogged) {
                            const seaLvl = (window.worldGenParams && window.worldGenParams.seaLevel !== undefined) ? window.worldGenParams.seaLevel : 62;
                            const aboveType = (y < CHUNK_HEIGHT - 1) ? this.getBlock(x, y + 1, z) : getBlockOptimized(wx, y + 1, wz);
                            const pAbove = getBlockProperties(aboveType);
                            const isSubmerged = (y <= seaLvl) || (pAbove && (pAbove.isLiquid || pAbove.isWaterlogged));
                            if (isSubmerged) {
                                currentBlockType = window.BLOCKS.WATER;
                                currentProps = getBlockProperties(window.BLOCKS.WATER);
                            } else {
                                continue;
                            }
                        } else {
                            continue;
                        }
                    }

                    if (props.isSlab || props.isStair || props.isFence || props.isWall || blockType === BLOCKS.STONECUTTER || blockType === BLOCKS.PORTAL_FRAME || blockType === BLOCKS.END_PORTAL_FRAME_EYE || blockType === BLOCKS.END_PORTAL || blockType === BLOCKS.END_GATEWAY || blockType === BLOCKS.CHORUS_PLANT || blockType === BLOCKS.CHORUS_FLOWER || blockType === BLOCKS.CHORUS_FLOWER_DEAD || blockType === BLOCKS.DRAGON_EGG || props.isLantern || props.isFarmland || props.isDirtPath) {
                        const uvTop = atlas.getUV(blockType, 'top');
                        const uvSide = atlas.getUV(blockType, 'side');
                        const uvBottom = atlas.getUV(blockType, 'bottom');
                        const curData = this.data ? this.data[(y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x] : 0;

                        if (props.isLantern) {
                            const aboveBlock = (y < CHUNK_HEIGHT - 1) ? this.getBlock(x, y + 1, z) : getBlockOptimized(wx, y + 1, wz);
                            const pAbove = getBlockProperties(aboveBlock);
                            const isHanging = pAbove.solid || pAbove.isFence || pAbove.isWall;

                            const lx0 = x + 5/16, lx1 = x + 11/16;
                            const lz0 = z + 5/16, lz1 = z + 11/16;
                            const ly0 = isHanging ? (y + 2/16) : y;
                            const ly1 = isHanging ? (y + 13/16) : (y + 11/16);

                            const addLanternQuad = (p0, p1, p2, p3, u0, v0, u1, v1) => {
                                _positions[posCount++] = p0[0]; _positions[posCount++] = p0[1]; _positions[posCount++] = p0[2];
                                _positions[posCount++] = p1[0]; _positions[posCount++] = p1[1]; _positions[posCount++] = p1[2];
                                _positions[posCount++] = p2[0]; _positions[posCount++] = p2[1]; _positions[posCount++] = p2[2];
                                _positions[posCount++] = p3[0]; _positions[posCount++] = p3[1]; _positions[posCount++] = p3[2];

                                for (let k = 0; k < 4; k++) {
                                    _normals[posCount - 12 + k * 3] = 0; _normals[posCount - 11 + k * 3] = 1; _normals[posCount - 10 + k * 3] = 0;
                                    _colors[colorCount++] = 1.0; _colors[colorCount++] = 1.0; _colors[colorCount++] = 1.0;
                                }

                                _uvs[uvCount++] = u0; _uvs[uvCount++] = v0;
                                _uvs[uvCount++] = u1; _uvs[uvCount++] = v0;
                                _uvs[uvCount++] = u1; _uvs[uvCount++] = v1;
                                _uvs[uvCount++] = u0; _uvs[uvCount++] = v1;

                                const base = vertexCount;
                                _glowTransparentIndices[glowTransparentIndexCount++] = base;
                                _glowTransparentIndices[glowTransparentIndexCount++] = base + 1;
                                _glowTransparentIndices[glowTransparentIndexCount++] = base + 2;
                                _glowTransparentIndices[glowTransparentIndexCount++] = base;
                                _glowTransparentIndices[glowTransparentIndexCount++] = base + 2;
                                _glowTransparentIndices[glowTransparentIndexCount++] = base + 3;
                                vertexCount += 4;
                            };

                            const su0 = uvSide.u, su1 = uvSide.u + uvSide.uSize;
                            const sv0 = uvSide.v, sv1 = uvSide.v + uvSide.vSize;

                            // 4 Outer Faces of Lantern Body (Full authentic texture on each face)
                            // South face (+Z)
                            addLanternQuad([lx0, ly0, lz1], [lx1, ly0, lz1], [lx1, ly1, lz1], [lx0, ly1, lz1], su0, sv0, su1, sv1);
                            // North face (-Z)
                            addLanternQuad([lx1, ly0, lz0], [lx0, ly0, lz0], [lx0, ly1, lz0], [lx1, ly1, lz0], su0, sv0, su1, sv1);
                            // East face (+X)
                            addLanternQuad([lx1, ly0, lz1], [lx1, ly0, lz0], [lx1, ly1, lz0], [lx1, ly1, lz1], su0, sv0, su1, sv1);
                            // West face (-X)
                            addLanternQuad([lx0, ly0, lz0], [lx0, ly0, lz1], [lx0, ly1, lz1], [lx0, ly1, lz0], su0, sv0, su1, sv1);

                            // Top face (+Y)
                            addLanternQuad([lx0, ly1, lz1], [lx1, ly1, lz1], [lx1, ly1, lz0], [lx0, ly1, lz0], su0, sv0, su1, sv1);
                            // Bottom face (-Y)
                            addLanternQuad([lx0, ly0, lz0], [lx1, ly0, lz0], [lx1, ly0, lz1], [lx0, ly0, lz1], su0, sv0, su1, sv1);

                            // 2 Internal Diagonals so lantern is fully vibrant from all 3D angles
                            addLanternQuad([lx0, ly0, lz0], [lx1, ly0, lz1], [lx1, ly1, lz1], [lx0, ly1, lz0], su0, sv0, su1, sv1);
                            addLanternQuad([lx0, ly0, lz1], [lx1, ly0, lz0], [lx1, ly1, lz0], [lx0, ly1, lz1], su0, sv0, su1, sv1);

                            // If hanging, draw top connecting chain loop up to ceiling
                            if (isHanging) {
                                const cx0 = x + 7/16, cx1 = x + 9/16;
                                const cz0 = z + 7/16, cz1 = z + 9/16;
                                addLanternQuad([cx0, ly1, cz0], [cx1, ly1, cz1], [cx1, y + 1.0, cz1], [cx0, y + 1.0, cz0], su0, sv0, su1, sv1);
                                addLanternQuad([cx0, ly1, cz1], [cx1, ly1, cz0], [cx1, y + 1.0, cz0], [cx0, y + 1.0, cz1], su0, sv0, su1, sv1);
                            }
                        } else if (blockType === BLOCKS.STONECUTTER) {
                            // 9/16 tall stone base (0.5625)
                            pushCustomBox(x, y, z, x + 1, y + 9/16, z + 1, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0);
                            // Centered circular saw blade (authentic saw texture from stonecutter.json, rows 9..15 arc, routed to transparent pass for pixel cutout)
                            const uvSaw = atlas.getUV(blockType, 'front');
                            const isXAxis = (curData & 1) === 1;
                            if (isXAxis) {
                                pushCustomBox(x + 7.9/16, y + 9/16, z + 1/16, x + 8.1/16, y + 16/16, z + 15/16, x, y, z, uvSaw, uvSaw, uvSaw, 3, 1.0, false, false, true);
                            } else {
                                pushCustomBox(x + 1/16, y + 9/16, z + 7.9/16, x + 15/16, y + 16/16, z + 8.1/16, x, y, z, uvSaw, uvSaw, uvSaw, 3, 1.0, false, false, true);
                            }
                        } else if (blockType === BLOCKS.PORTAL_FRAME || blockType === BLOCKS.END_PORTAL_FRAME_EYE) {
                            // 13/16 tall frame (0.8125)
                            pushCustomBox(x, y, z, x + 1, y + 13/16, z + 1, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0);
                            if (blockType === BLOCKS.END_PORTAL_FRAME_EYE) {
                                // Authentic Minecraft 8x3x8 eye of ender socket element from block/end_portal_frame_filled.json
                                const uvEye = atlas.getUV(blockType, 'eye');
                                pushCustomBox(x + 4/16, y + 13/16, z + 4/16, x + 12/16, y + 1.0, z + 12/16, x, y, z, uvEye, uvEye, uvEye, 0, 1.0, false);
                            }
                        } else if (blockType === BLOCKS.END_PORTAL || blockType === BLOCKS.END_GATEWAY) {
                            if (blockType === BLOCKS.END_GATEWAY) {
                                // Full cube void portal block with infinite cosmic parallax shader
                                pushCustomBox(x, y, z, x + 1, y + 1, z + 1, x, y, z, uvTop, uvTop, uvTop, 0, 1.0, false, true);
                            } else {
                                // Authentic Minecraft horizontal flat void portal pane at y = 12/16 (0.75) with infinite cosmic parallax shader
                                pushCustomBox(x, y + 11.9/16, z, x + 1, y + 12.1/16, z + 1, x, y, z, uvTop, uvTop, uvTop, 0, 1.0, false, true);
                            }
                        } else if (blockType === BLOCKS.CHORUS_PLANT) {
                            // Authentic Minecraft chorus plant stalk (8/16 core column with 6-directional connecting arms)
                            const canConn = (bx, by, bz) => {
                                const b = (bx >= 0 && bx < CHUNK_SIZE && bz >= 0 && bz < CHUNK_SIZE && by >= 0 && by < CHUNK_HEIGHT)
                                    ? this.getBlock(bx, by, bz)
                                    : getBlockOptimized(wxBase + bx, by, wzBase + bz);
                                return b === BLOCKS.CHORUS_PLANT || b === BLOCKS.CHORUS_FLOWER || b === BLOCKS.CHORUS_FLOWER_DEAD || b === BLOCKS.END_STONE;
                            };
                            // Central 8x8x8 core cube
                            pushCustomBox(x + 4/16, y + 4/16, z + 4/16, x + 12/16, y + 12/16, z + 12/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, false, false, true);
                            // 6 connecting branches to adjacent chorus parts/ground
                            if (canConn(x, y + 1, z)) pushCustomBox(x + 4/16, y + 12/16, z + 4/16, x + 12/16, y + 1.0, z + 12/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, false, false, true);
                            if (canConn(x, y - 1, z)) pushCustomBox(x + 4/16, y, z + 4/16, x + 12/16, y + 4/16, z + 12/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, false, false, true);
                            if (canConn(x, y, z - 1)) pushCustomBox(x + 4/16, y + 4/16, z, x + 12/16, y + 12/16, z + 4/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, false, false, true);
                            if (canConn(x, y, z + 1)) pushCustomBox(x + 4/16, y + 4/16, z + 12/16, x + 12/16, y + 12/16, z + 1.0, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, false, false, true);
                            if (canConn(x - 1, y, z)) pushCustomBox(x, y + 4/16, z + 4/16, x + 4/16, y + 12/16, z + 12/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, false, false, true);
                            if (canConn(x + 1, y, z)) pushCustomBox(x + 12/16, y + 4/16, z + 4/16, x + 1.0, y + 12/16, z + 12/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, false, false, true);
                        } else if (blockType === BLOCKS.CHORUS_FLOWER || blockType === BLOCKS.CHORUS_FLOWER_DEAD) {
                            // Authentic Minecraft Chorus Flower model from template_chorus_flower.json:
                            // 1. Core cube [4,4,4] to [12,12,12]
                            pushCustomBox(x + 4/16, y + 4/16, z + 4/16, x + 12/16, y + 12/16, z + 12/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, false, false, true);
                            // 2. Z-cross slab [2,2,6] to [14,14,10]
                            pushCustomBox(x + 2/16, y + 2/16, z + 6/16, x + 14/16, y + 14/16, z + 10/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, false, false, true);
                            // 3. X-cross slab [6,2,2] to [10,14,14]
                            pushCustomBox(x + 6/16, y + 2/16, z + 2/16, x + 10/16, y + 14/16, z + 14/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, false, false, true);
                            // 4. Y-cross slab [2,6,2] to [14,10,14]
                            pushCustomBox(x + 2/16, y + 6/16, z + 2/16, x + 14/16, y + 10/16, z + 14/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, false, false, true);
                        } else if (blockType === BLOCKS.DRAGON_EGG) {
                            // Authentic Minecraft 8-element dragon egg model from block/dragon_egg.json:
                            pushCustomBox(x + 3/16, y +  0/16, z + 3/16, x + 13/16, y +  1/16, z + 13/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, true);
                            pushCustomBox(x + 2/16, y +  1/16, z + 2/16, x + 14/16, y +  3/16, z + 14/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, true);
                            pushCustomBox(x + 1/16, y +  3/16, z + 1/16, x + 15/16, y +  8/16, z + 15/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, true);
                            pushCustomBox(x + 2/16, y +  8/16, z + 2/16, x + 14/16, y + 11/16, z + 14/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, true);
                            pushCustomBox(x + 3/16, y + 11/16, z + 3/16, x + 13/16, y + 13/16, z + 13/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, true);
                            pushCustomBox(x + 5/16, y + 13/16, z + 5/16, x + 11/16, y + 14/16, z + 11/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, true);
                            pushCustomBox(x + 5/16, y + 14/16, z + 5/16, x + 11/16, y + 15/16, z + 11/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, true);
                            pushCustomBox(x + 6/16, y + 15/16, z + 6/16, x + 10/16, y + 16/16, z + 10/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0, true);
                        } else if (props.isFarmland || props.isDirtPath) {
                            const belowBlock = (y > 0) ? this.getBlock(x, y - 1, z) : getBlockOptimized(wx, y - 1, wz);
                            const cullBottom = getBlockProperties(belowBlock).solid && !getBlockProperties(belowBlock).isSlab;
                            pushCustomBox(x, y, z, x + 1, y + 15/16, z + 1, x, y, z, uvTop, uvSide, uvBottom, cullBottom ? 2 : 0, 1.0);
                        } else if (props.isSlab) {
                            const belowBlock = (y > 0) ? this.getBlock(x, y - 1, z) : getBlockOptimized(wx, y - 1, wz);
                            const cullBottom = getBlockProperties(belowBlock).solid && !getBlockProperties(belowBlock).isSlab;
                            pushCustomBox(x, y, z, x + 1, y + 0.5, z + 1, x, y, z, uvTop, uvSide, uvBottom, cullBottom ? 2 : 0, 1.0);
                        } else if (props.isStair) {
                            // Step 1: Base half slab
                            pushCustomBox(x, y, z, x + 1, y + 0.5, z + 1, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0);

                            // Step 2: Upper step based on facing
                            // 0: North (-Z), 1: East (+X), 2: South (+Z), 3: West (-X)
                            const facing = curData & 3;
                            let sx0 = x, sz0 = z, sx1 = x + 1, sz1 = z + 1;
                            if (facing === 0) sz1 = z + 0.5;
                            else if (facing === 1) sx0 = x + 0.5;
                            else if (facing === 2) sz0 = z + 0.5;
                            else sx1 = x + 0.5;
                            pushCustomBox(sx0, y + 0.5, sz0, sx1, y + 1.0, sz1, x, y, z, uvTop, uvSide, uvBottom, 2, 1.0);

                            // Connecting stairs wrap logic (only for perpendicular stairs forming an authentic L-corner)
                            const getStairFacing = (bx, by, bz) => {
                                const b = getBlockOptimized(bx, by, bz);
                                if (!getBlockProperties(b).isStair) return -1;
                                return getDataOptimized(bx, by, bz) & 3;
                            };

                            const fN = getStairFacing(wx, y, wz - 1);
                            const fS = getStairFacing(wx, y, wz + 1);
                            const fW = getStairFacing(wx - 1, y, wz);
                            const fE = getStairFacing(wx + 1, y, wz);

                            if (facing === 0) { // High at North (-Z), Low at South (+Z)
                                if (fS === 1 && fW !== 0) pushCustomBox(x + 0.5, y + 0.5, z + 0.5, x + 1.0, y + 1.0, z + 1.0, x, y, z, uvTop, uvSide, uvBottom, 2, 1.0);
                                if (fS === 3 && fE !== 0) pushCustomBox(x, y + 0.5, z + 0.5, x + 0.5, y + 1.0, z + 1.0, x, y, z, uvTop, uvSide, uvBottom, 2, 1.0);
                            } else if (facing === 2) { // High at South (+Z), Low at North (-Z)
                                if (fN === 1 && fW !== 2) pushCustomBox(x + 0.5, y + 0.5, z, x + 1.0, y + 1.0, z + 0.5, x, y, z, uvTop, uvSide, uvBottom, 2, 1.0);
                                if (fN === 3 && fE !== 2) pushCustomBox(x, y + 0.5, z, x + 0.5, y + 1.0, z + 0.5, x, y, z, uvTop, uvSide, uvBottom, 2, 1.0);
                            } else if (facing === 1) { // High at East (+X), Low at West (-X)
                                if (fW === 0 && fS !== 1) pushCustomBox(x, y + 0.5, z, x + 0.5, y + 1.0, z + 0.5, x, y, z, uvTop, uvSide, uvBottom, 2, 1.0);
                                if (fW === 2 && fN !== 1) pushCustomBox(x, y + 0.5, z + 0.5, x + 0.5, y + 1.0, z + 1.0, x, y, z, uvTop, uvSide, uvBottom, 2, 1.0);
                            } else if (facing === 3) { // High at West (-X), Low at East (+X)
                                if (fE === 0 && fS !== 3) pushCustomBox(x + 0.5, y + 0.5, z, x + 1.0, y + 1.0, z + 0.5, x, y, z, uvTop, uvSide, uvBottom, 2, 1.0);
                                if (fE === 2 && fN !== 3) pushCustomBox(x + 0.5, y + 0.5, z + 0.5, x + 1.0, y + 1.0, z + 1.0, x, y, z, uvTop, uvSide, uvBottom, 2, 1.0);
                            }
                        } else if (props.isFence) {
                            // Center post
                            pushCustomBox(x + 6/16, y, z + 6/16, x + 10/16, y + 1.0, z + 10/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0);

                            const canConn = (b) => { const p = getBlockProperties(b); return p.solid || p.isFence || p.isWall || p.isFenceGate; };
                            if (canConn(getBlockOptimized(wx, y, wz - 1))) {
                                pushCustomBox(x + 7/16, y + 12/16, z, x + 9/16, y + 15/16, z + 6/16, x, y, z, uvTop, uvSide, uvBottom, 0, 0.95);
                                pushCustomBox(x + 7/16, y + 6/16, z, x + 9/16, y + 9/16, z + 6/16, x, y, z, uvTop, uvSide, uvBottom, 0, 0.95);
                            }
                            if (canConn(getBlockOptimized(wx, y, wz + 1))) {
                                pushCustomBox(x + 7/16, y + 12/16, z + 10/16, x + 9/16, y + 15/16, z + 1, x, y, z, uvTop, uvSide, uvBottom, 0, 0.95);
                                pushCustomBox(x + 7/16, y + 6/16, z + 10/16, x + 9/16, y + 9/16, z + 1, x, y, z, uvTop, uvSide, uvBottom, 0, 0.95);
                            }
                            if (canConn(getBlockOptimized(wx - 1, y, wz))) {
                                pushCustomBox(x, y + 12/16, z + 7/16, x + 6/16, y + 15/16, z + 9/16, x, y, z, uvTop, uvSide, uvBottom, 0, 0.95);
                                pushCustomBox(x, y + 6/16, z + 7/16, x + 6/16, y + 9/16, z + 9/16, x, y, z, uvTop, uvSide, uvBottom, 0, 0.95);
                            }
                            if (canConn(getBlockOptimized(wx + 1, y, wz))) {
                                pushCustomBox(x + 10/16, y + 12/16, z + 7/16, x + 1, y + 15/16, z + 9/16, x, y, z, uvTop, uvSide, uvBottom, 0, 0.95);
                                pushCustomBox(x + 10/16, y + 6/16, z + 7/16, x + 1, y + 9/16, z + 9/16, x, y, z, uvTop, uvSide, uvBottom, 0, 0.95);
                            }
                        } else if (props.isWall) {
                            // Center post
                            pushCustomBox(x + 4/16, y, z + 4/16, x + 12/16, y + 1.0, z + 12/16, x, y, z, uvTop, uvSide, uvBottom, 0, 1.0);

                            const canConn = (b) => { const p = getBlockProperties(b); return p.solid || p.isWall || p.isFence || p.isFenceGate; };
                            if (canConn(getBlockOptimized(wx, y, wz - 1))) pushCustomBox(x + 5/16, y, z, x + 11/16, y + 14/16, z + 4/16, x, y, z, uvTop, uvSide, uvBottom, 0, 0.95);
                            if (canConn(getBlockOptimized(wx, y, wz + 1))) pushCustomBox(x + 5/16, y, z + 12/16, x + 11/16, y + 14/16, z + 1, x, y, z, uvTop, uvSide, uvBottom, 0, 0.95);
                            if (canConn(getBlockOptimized(wx - 1, y, wz))) pushCustomBox(x, y, z + 5/16, x + 4/16, y + 14/16, z + 11/16, x, y, z, uvTop, uvSide, uvBottom, 0, 0.95);
                            if (canConn(getBlockOptimized(wx + 1, y, wz))) pushCustomBox(x + 12/16, y, z + 5/16, x + 1, y + 14/16, z + 11/16, x, y, z, uvTop, uvSide, uvBottom, 0, 0.95);
                        }
                        continue;
                    }

                    let liquidTopY = 1.0;
                    if (currentProps.isLiquid) {
                        const blockAbove = (y + 1 < CHUNK_HEIGHT) ? this.getBlock(x, y + 1, z) : getBlockOptimized(wx, y + 1, wz);
                        const aboveProps = getBlockProperties(blockAbove);
                        if (!aboveProps.isLiquid) {
                            const curData = this.data[(y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x];
                            const isLava = (currentBlockType === BLOCKS.LAVA);
                            const maxLevel = isLava ? 3 : 7;
                            if (curData === 0) {
                                liquidTopY = 1.0; // Source block is full height like Minecraft to avoid air gaps
                            } else if (curData === 8) {
                                liquidTopY = 1.0; // Falling column
                            } else {
                                liquidTopY = 0.25 + (curData / maxLevel) * 0.70; // Flowing levels
                            }
                        }
                    }

                    for (const face of FACES) {
                        const nx = x + face.dir[0];
                        const ny = y + face.dir[1];
                        const nz = z + face.dir[2];

                        let neighborType;
                        if (nx < 0 || nx >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE || ny < 0 || ny >= CHUNK_HEIGHT) {
                            neighborType = getBlockOptimized(wx + face.dir[0], ny, wz + face.dir[2]);
                        } else {
                            // Fast path for blocks inside chunk
                            neighborType = this.blocks[(ny * CHUNK_SIZE * CHUNK_SIZE) + (nz * CHUNK_SIZE) + nx];
                        }

                        const neighborProps = getBlockProperties(neighborType);
                        
                        let effectiveNeighborType = neighborType;
                        let effectiveNeighborProps = neighborProps;
                        
                        if (neighborProps.isWaterlogged) {
                            effectiveNeighborType = BLOCKS.WATER;
                            effectiveNeighborProps = getBlockProperties(BLOCKS.WATER);
                        }

                        const isCurWater = (currentBlockType === BLOCKS.WATER || currentBlockType === BLOCKS.SWAMP_WATER);
                        const isCurLava = (currentBlockType === BLOCKS.LAVA);
                        const isNeighWater = (effectiveNeighborType === BLOCKS.WATER || effectiveNeighborType === BLOCKS.SWAMP_WATER);
                        const isNeighLava = (effectiveNeighborType === BLOCKS.LAVA);
                        const sameLiquid = (isCurWater && isNeighWater) || (isCurLava && isNeighLava);

                        let isLiquidStep = false;
                        let nTop = 0;
                        let shouldRenderFace = false;
                        if (currentBlockType === BLOCKS.CACTUS) {
                            if (face.name === 'top' || face.name === 'bottom') {
                                shouldRenderFace = (effectiveNeighborType !== BLOCKS.CACTUS && (effectiveNeighborType === BLOCKS.AIR || effectiveNeighborProps.transparent));
                            } else {
                                // Cactus sides are inset 1/16th, visible unless touching another cactus
                                shouldRenderFace = (effectiveNeighborType !== BLOCKS.CACTUS);
                            }
                        } else if (currentProps.isLiquid) {
                            if (sameLiquid) {
                                if (face.dir[1] === 0) {
                                    // Check if current liquid is taller than neighbor liquid (render step to prevent air gap)
                                    const nAbove = getBlockOptimized(wx + face.dir[0], y + 1, wz + face.dir[2]);
                                    let neighborTopY = 1.0;
                                    if (!getBlockProperties(nAbove).isLiquid) {
                                        const nData = (nx >= 0 && nx < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE) ?
                                            this.data[(y * CHUNK_SIZE * CHUNK_SIZE) + (nz * CHUNK_SIZE) + nx] :
                                            getDataOptimized(wx + face.dir[0], y, wz + face.dir[2]);
                                        const isLava = (currentBlockType === BLOCKS.LAVA);
                                        const maxLevel = isLava ? 3 : 7;
                                        if (nData === 0) {
                                            neighborTopY = 1.0;
                                        } else if (nData === 8) {
                                            neighborTopY = 1.0;
                                        } else {
                                            neighborTopY = 0.25 + (nData / maxLevel) * 0.70;
                                        }
                                    }
                                    if (liquidTopY > neighborTopY + 0.01) {
                                        shouldRenderFace = true;
                                        isLiquidStep = true;
                                        nTop = neighborTopY;
                                    }
                                }
                            } else {
                                // Liquid touching non-same liquid:
                                // Render face if exposed to AIR or a transparent block or different liquid
                                if (effectiveNeighborType === BLOCKS.AIR) {
                                    shouldRenderFace = true;
                                } else if (effectiveNeighborProps.isLiquid) {
                                    shouldRenderFace = true; // Liquid boundary (e.g. water next to lava)
                                } else if (effectiveNeighborProps.transparent) {
                                    shouldRenderFace = true; // Transparent block boundary (e.g. glass, ice, doors)
                                }
                            }
                        } else {
                            shouldRenderFace = (effectiveNeighborType === BLOCKS.AIR || (effectiveNeighborProps.transparent && currentBlockType !== effectiveNeighborType));
                        }

                        // Render face if visible
                        if (shouldRenderFace) {
                            let texName = face.name;
                            let rotateUV = false;
                            const curData = this.data[(y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x];

                            if (currentProps.isLog) {
                                // 0 = Y axis (vertical), 1 = X axis (east-west), 2 = Z axis (north-south)
                                const logAxis = curData === 1 ? 'x' : (curData === 2 ? 'z' : 'y');
                                if (face.axis === logAxis) {
                                    texName = 'top'; // Log rings end cap
                                } else {
                                    texName = 'side'; // Bark
                                    if (logAxis === 'x') {
                                        rotateUV = true;
                                    } else if (logAxis === 'z') {
                                        if (face.axis === 'x') {
                                            rotateUV = true;
                                        }
                                    }
                                }
                            } else if (currentProps.hasFacing) {
                                // 0: South (+Z), 1: West (-X), 2: North (-Z), 3: East (+X)
                                const facingDirs = [
                                    { axis: 'z', dirSign: 1 },
                                    { axis: 'x', dirSign: -1 },
                                    { axis: 'z', dirSign: -1 },
                                    { axis: 'x', dirSign: 1 }
                                ];
                                const targetFacing = facingDirs[curData % 4];
                                if (face.axis === targetFacing.axis && face.dirSign === targetFacing.dirSign) {
                                    texName = 'front';
                                } else if (face.name === 'top' || face.name === 'bottom') {
                                    texName = face.name;
                                } else {
                                    texName = 'side';
                                }
                            }

                            let uvInfo;
                            if ((currentBlockType === BLOCKS.GRASS || currentBlockType === BLOCKS.SWAMP_GRASS || currentBlockType === BLOCKS.SAVANNA_GRASS) && face.name !== 'top' && face.name !== 'bottom') {
                                uvInfo = atlas.getUV(currentBlockType, 'side');
                            } else {
                                uvInfo = atlas.getUV(currentBlockType, texName);
                            }

                            // Calculate directional face shading and sky lighting first so subterranean face check is accurate
                            const nx = x + face.dir[0];
                            const ny = y + face.dir[1];
                            const nz = z + face.dir[2];
                            const baseSky = getSkyLightFactor(nx, ny, nz);

                            // Calculate ambient occlusion
                            const aoColor = calculateVertexAO(wx, y, wz, face, getBlockOptimized, currentBlockType);

                            // Authentic Minecraft directional face shading multipliers:
                            // Top (+Y): 1.0, Bottom (-Y): 0.55, Z-sides (South/North): 0.85, X-sides (East/West): 0.75
                            let faceShade = 1.0;
                            if (face.dir[1] > 0) faceShade = 1.0;
                            else if (face.dir[1] < 0) faceShade = 0.55;
                            else if (face.dir[2] !== 0) faceShade = 0.85;
                            else if (face.dir[0] !== 0) faceShade = 0.75;
                            
                            let waterFade = 0;
                            if (effectiveNeighborType === BLOCKS.WATER || effectiveNeighborType === BLOCKS.SWAMP_WATER || neighborType === BLOCKS.WATER || neighborType === BLOCKS.SWAMP_WATER) {
                                let depth = Math.max(0, 22 - y);
                                waterFade = Math.min(1.0, depth / 10.0);
                            }

                            const isGrassBlock = (currentBlockType === BLOCKS.GRASS || currentBlockType === BLOCKS.SWAMP_GRASS || currentBlockType === BLOCKS.SAVANNA_GRASS);
                            let rMult = 1.0, gMult = 1.0, bMult = 1.0;
                            if (isGrassBlock) {
                                if (face.name !== 'bottom') {
                                    const bIdx = (z * CHUNK_SIZE + x) * 3;
                                    rMult = blendedGrass[bIdx] / plainsR;
                                    gMult = blendedGrass[bIdx + 1] / plainsG;
                                    bMult = blendedGrass[bIdx + 2] / plainsB;
                                }
                            } else if (currentBlockType === BLOCKS.LEAVES) {
                                const bIdx = (z * CHUNK_SIZE + x) * 3;
                                rMult = blendedFoliage[bIdx] / folPlainsR;
                                gMult = blendedFoliage[bIdx + 1] / folPlainsG;
                                bMult = blendedFoliage[bIdx + 2] / folPlainsB;
                            }

                            const flipQuad = (aoColor[0] + aoColor[2] > aoColor[1] + aoColor[3]);

                                for (let i = 0; i < 4; i++) {
                                    const v = face.v[i];
                                    let vx = x + v[0];
                                    let vy = y + v[1];
                                    let vz = z + v[2];

                                    if (currentProps.isLiquid) {
                                        if (isLiquidStep) {
                                            vy = (v[1] === 0) ? (y + nTop) : (y + liquidTopY);
                                        } else {
                                            if (v[1] === 1) vy = y + liquidTopY;
                                        }
                                    } else if (currentBlockType === BLOCKS.CACTUS) {
                                        if (v[0] === 0) vx = x + 0.0625;
                                        else if (v[0] === 1) vx = x + 0.9375;
                                        if (v[2] === 0) vz = z + 0.0625;
                                        else if (v[2] === 1) vz = z + 0.9375;
                                    }

                                    _positions[posCount++] = vx;
                                    _positions[posCount++] = vy;
                                    _positions[posCount++] = vz;
                                    
                                    _normals[posCount - 3] = face.dir[0];
                                    _normals[posCount - 2] = face.dir[1];
                                    _normals[posCount - 1] = face.dir[2];

                                    let vSky = baseSky;
                                    if (baseSky < 0.999) {
                                        const cdx = (face.dir[0] === 0) ? (face.v[i][0] === 1 ? 1 : -1) : 0;
                                        const cdy = (face.dir[1] === 0) ? (face.v[i][1] === 1 ? 1 : -1) : 0;
                                        const cdz = (face.dir[2] === 0) ? (face.v[i][2] === 1 ? 1 : -1) : 0;
                                        const cornerSky = getSkyLightFactor(nx + cdx, ny + cdy, nz + cdz);
                                        vSky = (baseSky + cornerSky) * 0.5;
                                    }
                                    if (face.dir[1] < 0 && vSky < 1.0) vSky = Math.max(0.48, vSky * 0.94);

                                    let c = (currentBlockType === BLOCKS.WATER || currentBlockType === BLOCKS.SWAMP_WATER) ? 1.0 : (aoColor[i] * faceShade * vSky);
                                    if (currentBlockType === BLOCKS.WATER || currentBlockType === BLOCKS.SWAMP_WATER) {
                                        _colors[colorCount++] = 1.0;
                                        _colors[colorCount++] = 1.0;
                                        _colors[colorCount++] = 1.0;
                                    } else if (waterFade > 0) {
                                        const wc = { r: 0x11/255, g: 0x33/255, b: 0x66/255 };
                                        _colors[colorCount++] = c * (1 - waterFade) + wc.r * waterFade;
                                        _colors[colorCount++] = c * (1 - waterFade) + wc.g * waterFade;
                                        _colors[colorCount++] = c * (1 - waterFade) + wc.b * waterFade;
                                    } else {
                                        _colors[colorCount++] = c * rMult;
                                        _colors[colorCount++] = c * gMult;
                                        _colors[colorCount++] = c * bMult;
                                    }
                                }

                                if (rotateUV) {
                                    _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;
                                    _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v;
                                    _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v;
                                    _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;
                                } else if (isLiquidStep) {
                                    const v0 = uvInfo.v + uvInfo.vSize * (1 - liquidTopY);
                                    const v1 = uvInfo.v + uvInfo.vSize * (1 - nTop);
                                    _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = v1;
                                    _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = v1;
                                    _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = v0;
                                    _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = v0;
                                } else if (currentBlockType === BLOCKS.CACTUS) {
                                    if (face.name === 'top' || face.name === 'bottom') {
                                        const u0 = uvInfo.u + uvInfo.uSize * 0.0625;
                                        const u1 = uvInfo.u + uvInfo.uSize * 0.9375;
                                        const v0 = uvInfo.v + uvInfo.vSize * 0.0625;
                                        const v1 = uvInfo.v + uvInfo.vSize * 0.9375;
                                        _uvs[uvCount++] = u0; _uvs[uvCount++] = v0;
                                        _uvs[uvCount++] = u1; _uvs[uvCount++] = v0;
                                        _uvs[uvCount++] = u1; _uvs[uvCount++] = v1;
                                        _uvs[uvCount++] = u0; _uvs[uvCount++] = v1;
                                    } else {
                                        _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v;
                                        _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v;
                                        _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;
                                        _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;
                                    }
                                } else {
                                    _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v;
                                    _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v;
                                    _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;
                                    _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;
                                }

                                const i0 = vertexCount, i1 = vertexCount + 1, i2 = vertexCount + 2, i3 = vertexCount + 3;
                                const pushQuadIndices = (arr, count) => {
                                    if (flipQuad) {
                                        arr[count++] = i1; arr[count++] = i2; arr[count++] = i3;
                                        arr[count++] = i1; arr[count++] = i3; arr[count++] = i0;
                                    } else {
                                        arr[count++] = i0; arr[count++] = i1; arr[count++] = i2;
                                        arr[count++] = i0; arr[count++] = i2; arr[count++] = i3;
                                    }
                                    return count;
                                };

                                if (currentProps.transparent) {
                                    if (currentBlockType === BLOCKS.WATER || currentBlockType === BLOCKS.SWAMP_WATER || currentBlockType === BLOCKS.LAVA) {
                                        waterIndexCount = pushQuadIndices(_waterIndices, waterIndexCount);
                                    } else if (currentProps.emissive >= 0.8) {
                                        glowTransparentIndexCount = pushQuadIndices(_glowTransparentIndices, glowTransparentIndexCount);
                                    } else if (currentProps.emissive > 0) {
                                        slightGlowTransparentIndexCount = pushQuadIndices(_slightGlowTransparentIndices, slightGlowTransparentIndexCount);
                                    } else {
                                        transparentIndexCount = pushQuadIndices(_transparentIndices, transparentIndexCount);
                                    }
                                } else {
                                    if (currentProps.emissive >= 0.8) {
                                        glowOpaqueIndexCount = pushQuadIndices(_glowOpaqueIndices, glowOpaqueIndexCount);
                                    } else if (currentProps.emissive > 0) {
                                        slightGlowOpaqueIndexCount = pushQuadIndices(_slightGlowOpaqueIndices, slightGlowOpaqueIndexCount);
                                    } else {
                                        opaqueIndexCount = pushQuadIndices(_opaqueIndices, opaqueIndexCount);
                                    }
                                }
                                vertexCount += 4;
                            }
                        }
                    }
                }
            }

        const geometry = new THREE.BufferGeometry();
        
        // Merge indices into one big index array (water is separated into dedicated waterMesh for correct transparent sorting)
        const totalIndices = opaqueIndexCount + crossIndexCount + glowCrossIndexCount + transparentIndexCount + glowOpaqueIndexCount + glowTransparentIndexCount + slightGlowOpaqueIndexCount + slightGlowTransparentIndexCount;
        const allIndices = new Uint32Array(totalIndices);
        
        let offset = 0;
        allIndices.set(_opaqueIndices.subarray(0, opaqueIndexCount), offset); offset += opaqueIndexCount;
        allIndices.set(_crossIndices.subarray(0, crossIndexCount), offset); offset += crossIndexCount;
        allIndices.set(_glowCrossIndices.subarray(0, glowCrossIndexCount), offset); offset += glowCrossIndexCount;
        allIndices.set(_transparentIndices.subarray(0, transparentIndexCount), offset); offset += transparentIndexCount;
        allIndices.set(_glowOpaqueIndices.subarray(0, glowOpaqueIndexCount), offset); offset += glowOpaqueIndexCount;
        allIndices.set(_glowTransparentIndices.subarray(0, glowTransparentIndexCount), offset); offset += glowTransparentIndexCount;
        allIndices.set(_slightGlowOpaqueIndices.subarray(0, slightGlowOpaqueIndexCount), offset); offset += slightGlowOpaqueIndexCount;
        allIndices.set(_slightGlowTransparentIndices.subarray(0, slightGlowTransparentIndexCount), offset); offset += slightGlowTransparentIndexCount;

        geometry.setIndex(new THREE.BufferAttribute(allIndices, 1));

        let groupOffset = 0;
        geometry.addGroup(groupOffset, opaqueIndexCount, 0); groupOffset += opaqueIndexCount;
        geometry.addGroup(groupOffset, crossIndexCount, 1); groupOffset += crossIndexCount;
        geometry.addGroup(groupOffset, glowCrossIndexCount, 2); groupOffset += glowCrossIndexCount;
        geometry.addGroup(groupOffset, 0, 3); // index 3 reserved for water material compatibility
        geometry.addGroup(groupOffset, transparentIndexCount, 4); groupOffset += transparentIndexCount;
        geometry.addGroup(groupOffset, glowOpaqueIndexCount, 5); groupOffset += glowOpaqueIndexCount;
        geometry.addGroup(groupOffset, glowTransparentIndexCount, 6); groupOffset += glowTransparentIndexCount;
        geometry.addGroup(groupOffset, slightGlowOpaqueIndexCount, 7); groupOffset += slightGlowOpaqueIndexCount;
        geometry.addGroup(groupOffset, slightGlowTransparentIndexCount, 8); groupOffset += slightGlowTransparentIndexCount;

        geometry.setAttribute('position', new THREE.BufferAttribute(_positions.slice(0, posCount), 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(_normals.slice(0, posCount), 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(_uvs.slice(0, uvCount), 2));
        geometry.setAttribute('color', new THREE.BufferAttribute(_colors.slice(0, colorCount), 3));

        // Use shared materials instead of allocating new ones
        const materials = atlas.sharedMaterials;

        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(CHUNK_SIZE/2, CHUNK_HEIGHT/2, CHUNK_SIZE/2), Math.max(CHUNK_SIZE, CHUNK_HEIGHT/2));
        geometry.boundingBox = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE));
        this.worldBox.min.set(this.cx * CHUNK_SIZE - 2, -2, this.cz * CHUNK_SIZE - 2);
        this.worldBox.max.set(this.cx * CHUNK_SIZE + CHUNK_SIZE + 2, CHUNK_HEIGHT + 2, this.cz * CHUNK_SIZE + CHUNK_SIZE + 2);

        if (this.mesh) {
            this.mesh.geometry.dispose();
            // DO NOT dispose materials since they are shared globally
            this.mesh.geometry = geometry;
            this.mesh.material = materials;
        } else if (_meshPool.length > 0) {
            this.mesh = _meshPool.pop();
            this.mesh.geometry = geometry;
            this.mesh.material = materials;
            this.mesh.position.set(this.cx * CHUNK_SIZE, 0, this.cz * CHUNK_SIZE);
        } else {
            this.mesh = new THREE.Mesh(geometry, materials);
            this.mesh.position.set(this.cx * CHUNK_SIZE, 0, this.cz * CHUNK_SIZE);
            this.mesh.castShadow = false; // Voxel chunks don't cast shadows to protect 60 FPS
            this.mesh.receiveShadow = true; // Terrain chunks receive soft light shadows from mobs, player, and entities
        }
        this.mesh.castShadow = false;
        this.mesh.receiveShadow = true;
        this.mesh.matrixAutoUpdate = false;
        this.mesh.updateMatrix();
        this.mesh.userData.isChunkMesh = true;
        this.mesh.visible = true;

        // Dedicated water mesh in transparent render pass
        if (waterIndexCount > 0) {
            const waterGeometry = new THREE.BufferGeometry();
            waterGeometry.setIndex(new THREE.BufferAttribute(_waterIndices.slice(0, waterIndexCount), 1));
            waterGeometry.setAttribute('position', geometry.attributes.position);
            waterGeometry.setAttribute('normal', geometry.attributes.normal);
            waterGeometry.setAttribute('uv', geometry.attributes.uv);
            waterGeometry.setAttribute('color', geometry.attributes.color);
            waterGeometry.boundingSphere = geometry.boundingSphere;
            waterGeometry.boundingBox = geometry.boundingBox;

            const waterMat = atlas.matWater || materials[3];

            if (this.waterMesh) {
                this.waterMesh.geometry.dispose();
                this.waterMesh.geometry = waterGeometry;
                this.waterMesh.material = waterMat;
            } else {
                this.waterMesh = new THREE.Mesh(waterGeometry, waterMat);
                this.waterMesh.position.set(this.cx * CHUNK_SIZE, 0, this.cz * CHUNK_SIZE);
                this.waterMesh.userData.isChunkMesh = true;
                this.waterMesh.renderOrder = 1;
            }
            this.waterMesh.castShadow = false;
            this.waterMesh.receiveShadow = true;
            this.waterMesh.matrixAutoUpdate = false;
            this.waterMesh.updateMatrix();
            this.waterMesh.visible = true;
            if (this.mesh && this.mesh.parent && !this.waterMesh.parent) {
                this.mesh.parent.add(this.waterMesh);
            }
        } else if (this.waterMesh) {
            if (this.waterMesh.parent) this.waterMesh.parent.remove(this.waterMesh);
            this.waterMesh.geometry.dispose();
            this.waterMesh = null;
        }

        // Dedicated End Portal mesh with animated cosmic parallax shader
        if (endPortalIndexCount > 0) {
            const endPortalGeometry = new THREE.BufferGeometry();
            endPortalGeometry.setIndex(new THREE.BufferAttribute(_endPortalIndices.slice(0, endPortalIndexCount), 1));
            endPortalGeometry.setAttribute('position', geometry.attributes.position);
            endPortalGeometry.setAttribute('normal', geometry.attributes.normal);
            endPortalGeometry.setAttribute('uv', geometry.attributes.uv);
            endPortalGeometry.setAttribute('color', geometry.attributes.color);
            endPortalGeometry.boundingSphere = geometry.boundingSphere;
            endPortalGeometry.boundingBox = geometry.boundingBox;

            const portalMat = atlas.matEndPortal;

            if (this.endPortalMesh) {
                this.endPortalMesh.geometry.dispose();
                this.endPortalMesh.geometry = endPortalGeometry;
                if (portalMat) this.endPortalMesh.material = portalMat;
            } else {
                this.endPortalMesh = new THREE.Mesh(endPortalGeometry, portalMat);
                this.endPortalMesh.position.set(this.cx * CHUNK_SIZE, 0, this.cz * CHUNK_SIZE);
                this.endPortalMesh.userData.isChunkMesh = true;
                this.endPortalMesh.renderOrder = 2;
            }
            this.endPortalMesh.matrixAutoUpdate = false;
            this.endPortalMesh.updateMatrix();
            this.endPortalMesh.visible = true;
            if (this.mesh && this.mesh.parent && !this.endPortalMesh.parent) {
                this.mesh.parent.add(this.endPortalMesh);
            }
        } else if (this.endPortalMesh) {
            if (this.endPortalMesh.parent) this.endPortalMesh.parent.remove(this.endPortalMesh);
            this.endPortalMesh.geometry.dispose();
            this.endPortalMesh = null;
        }

        this.dirty = false;
        return this.mesh;
    }

    dispose() {
        if (this.mesh) {
            if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.geometry = null;
            // DO NOT dispose materials since they are shared globally
            _meshPool.push(this.mesh);
            this.mesh = null;
        }
        if (this.waterMesh) {
            if (this.waterMesh.parent) this.waterMesh.parent.remove(this.waterMesh);
            this.waterMesh.geometry.dispose();
            this.waterMesh = null;
        }
        if (this.endPortalMesh) {
            if (this.endPortalMesh.parent) this.endPortalMesh.parent.remove(this.endPortalMesh);
            this.endPortalMesh.geometry.dispose();
            this.endPortalMesh = null;
        }
        this._inBuildQueue = false;
        this._inGenQueue = false;
        this._generated = false;
    }
}

const _aoResult = [1, 1, 1, 1];

function _isSolid(wx, wy, wz, dx, dy, dz, getNeighborBlock) {
    const type = getNeighborBlock(wx + dx, wy + dy, wz + dz);
    if (!type || type === BLOCKS.AIR) return false;
    const props = getBlockProperties(type);
    if (!props.solid || props.transparent || props.isLiquid || props.isCross) return false;
    return true;
}

function _vertexAO(wx, wy, wz, vx, vy, vz, face, getNeighborBlock) {
    let dx1 = 0, dy1 = 0, dz1 = 0;
    let dx2 = 0, dy2 = 0, dz2 = 0;

    if (face.dir[0] !== 0) { // X face
        dy1 = vy === 1 ? 1 : -1;
        dz2 = vz === 1 ? 1 : -1;
    } else if (face.dir[1] !== 0) { // Y face
        dx1 = vx === 1 ? 1 : -1;
        dz2 = vz === 1 ? 1 : -1;
    } else { // Z face
        dx1 = vx === 1 ? 1 : -1;
        dy2 = vy === 1 ? 1 : -1;
    }

    const side1 = _isSolid(wx, wy, wz, face.dir[0] + dx1, face.dir[1] + dy1, face.dir[2] + dz1, getNeighborBlock);
    const side2 = _isSolid(wx, wy, wz, face.dir[0] + dx2, face.dir[1] + dy2, face.dir[2] + dz2, getNeighborBlock);
    const corner = _isSolid(wx, wy, wz, face.dir[0] + dx1 + dx2, face.dir[1] + dy1 + dy2, face.dir[2] + dz1 + dz2, getNeighborBlock);

    if (side1 && side2) return 0.64;
    const count = (side1 ? 1 : 0) + (side2 ? 1 : 0) + (corner ? 1 : 0);
    const aoValues = [1.0, 0.88, 0.76, 0.64];
    return aoValues[count];
}

function calculateVertexAO(wx, wy, wz, face, getNeighborBlock, blockType) {
    if (blockType === BLOCKS.WATER || blockType === BLOCKS.SWAMP_WATER || blockType === BLOCKS.LAVA || blockType === BLOCKS.GLASS || blockType === BLOCKS.TORCH) {
        _aoResult[0] = 1; _aoResult[1] = 1; _aoResult[2] = 1; _aoResult[3] = 1;
        return _aoResult;
    }

    _aoResult[0] = _vertexAO(wx, wy, wz, face.v[0][0], face.v[0][1], face.v[0][2], face, getNeighborBlock);
    _aoResult[1] = _vertexAO(wx, wy, wz, face.v[1][0], face.v[1][1], face.v[1][2], face, getNeighborBlock);
    _aoResult[2] = _vertexAO(wx, wy, wz, face.v[2][0], face.v[2][1], face.v[2][2], face, getNeighborBlock);
    _aoResult[3] = _vertexAO(wx, wy, wz, face.v[3][0], face.v[3][1], face.v[3][2], face, getNeighborBlock);
    
    return _aoResult;
}

// ============================================
// World
// ============================================
export class World {
    constructor(scene, textureAtlas, onChunkUnloaded = null, onBlockDestroyed = null) {
        this.scene = scene;
        this.textureAtlas = textureAtlas;
        this.chunks = new Map();
        this.chunksToBuild = [];
        this.chunksToGenerate = []; // Chunks waiting for blocks
        this.renderDistance = 10;
        this.lastPlayerChunkX = null;
        this.lastPlayerChunkZ = null;
        this._forceChunkScan = true;
        this.onChunkUnloaded = onChunkUnloaded;
        this.onBlockDestroyed = onBlockDestroyed;
        
        // Block change hooks
        this.onChestPlaced = null;
        this.onChestRemoved = null;
        this.onDoorPlaced = null;
        this.onDoorRemoved = null;
        this.onTorchPlaced = null;
        this.onTorchRemoved = null;
        this.planetParams = null;

        // Ambient Occlusion settings
        this.enableAO = true;

        this.liquidUpdates = new Set();
        
        // Persistent modifications map: chunkKey -> Map<idx, {block, data}>
        this.modifications = new Map();
        
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
        
        // Initialize shared materials to drastically reduce GC and WebGL overhead
        // MeshLambertMaterial gives classic Minecraft Gouraud diffuse shading and torch lighting
        const matOpaque = new THREE.MeshLambertMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: false,
            side: THREE.FrontSide // Massive performance gain for opaque blocks
        });
        const matCross = new THREE.MeshLambertMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.5,
            depthWrite: true,
            side: THREE.DoubleSide
        });
        const matGlowCross = new THREE.MeshBasicMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.5,
            depthWrite: true,
            side: THREE.DoubleSide
        });
        const matWater = new THREE.MeshLambertMaterial({
            map: textureAtlas.texture,
            color: new THREE.Color(0xffffff), // Authentic MC water texture colors (already colored blue in texture)
            vertexColors: true,
            transparent: true,
            opacity: 0.65, // Authentic translucent water
            depthWrite: false, // Prevents z-sorting fighting and clipping underwater terrain
            side: THREE.DoubleSide
        });
        const matTransparent = new THREE.MeshLambertMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.25,
            depthWrite: true,
            side: THREE.DoubleSide
        });
        const matGlowOpaque = new THREE.MeshBasicMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            side: THREE.FrontSide // Massive performance gain for opaque blocks
        });
        const matGlowTransparent = new THREE.MeshBasicMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.1,
            depthWrite: true,
            side: THREE.DoubleSide
        });
        const matSlightGlowOpaque = new THREE.MeshLambertMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: false,
            side: THREE.FrontSide,
            emissive: new THREE.Color(0xffffff),
            emissiveMap: textureAtlas.texture,
            emissiveIntensity: 0.2
        });
        const matSlightGlowTransparent = new THREE.MeshLambertMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.25,
            depthWrite: true,
            side: THREE.DoubleSide,
            emissive: new THREE.Color(0xffffff),
            emissiveMap: textureAtlas.texture,
            emissiveIntensity: 0.2
        });
        this.matWater = matWater;
        textureAtlas.matWater = matWater;
        this.sharedMaterials = [matOpaque, matCross, matGlowCross, matWater, matTransparent, matGlowOpaque, matGlowTransparent, matSlightGlowOpaque, matSlightGlowTransparent];

        // Authentic Minecraft End Portal cosmic parallax shader
        const endPortalTex = new THREE.TextureLoader().load('assets/mc/block/end_portal.png');
        endPortalTex.wrapS = THREE.RepeatWrapping;
        endPortalTex.wrapT = THREE.RepeatWrapping;
        endPortalTex.magFilter = THREE.NearestFilter;
        endPortalTex.minFilter = THREE.NearestFilter;

        const matEndPortal = new THREE.ShaderMaterial({
            uniforms: {
                tPortal: { value: endPortalTex },
                time: { value: 0 },
                cameraPos: { value: new THREE.Vector3() }
            },
            vertexShader: `
                varying vec3 vWorldPos;
                void main() {
                    vec4 wp = modelMatrix * vec4(position, 1.0);
                    vWorldPos = wp.xyz;
                    gl_Position = projectionMatrix * viewMatrix * wp;
                }
            `,
            fragmentShader: `
                uniform sampler2D tPortal;
                uniform float time;
                uniform vec3 cameraPos;
                varying vec3 vWorldPos;

                vec2 rot(vec2 p, float a) {
                    float s = sin(a), c = cos(a);
                    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
                }

                void main() {
                    vec3 dir = normalize(vWorldPos - cameraPos);
                    vec2 p = vWorldPos.xz;

                    // Multi-layer infinite cosmic parallax projection
                    vec2 uv1 = rot(p * 0.14 + dir.xz * 1.8 + vec2(time * 0.02, time * 0.015), 0.5);
                    vec2 uv2 = rot(p * 0.28 + dir.xz * 3.6 + vec2(-time * 0.025, time * 0.02), -0.8);
                    vec2 uv3 = rot(p * 0.45 + dir.xz * 5.8 + vec2(time * 0.035, -time * 0.03), 1.3);
                    vec2 uv4 = rot(p * 0.08 + dir.xz * 0.9 + vec2(-time * 0.01, -time * 0.012), 2.1);

                    vec4 c1 = texture2D(tPortal, uv1);
                    vec4 c2 = texture2D(tPortal, uv2);
                    vec4 c3 = texture2D(tPortal, uv3);
                    vec4 c4 = texture2D(tPortal, uv4);

                    vec3 col = vec3(0.0);
                    col += c1.rgb * vec3(0.2, 0.35, 0.7);
                    col += c2.rgb * vec3(0.6, 0.2, 0.8);
                    col += c3.rgb * vec3(0.2, 0.8, 0.7);
                    col += c4.rgb * vec3(0.5, 0.4, 0.9);
                    col *= 2.2;

                    float shimmer = 0.9 + 0.1 * sin(time * 4.0 + p.x * 2.0 + p.y * 2.0);
                    col *= shimmer;

                    gl_FragColor = vec4(col, 1.0);
                }
            `,
            side: THREE.DoubleSide
        });

        this.matEndPortal = matEndPortal;
        textureAtlas.matEndPortal = matEndPortal;

        // Chunk queues to avoid stuttering
        this.chunksToGenerate = [];
        this.chunksToBuild = [];

        // Fluid tick queue
        this.liquidUpdates = new Set(); // Stores strings of "x,y,z"
        this.tickTimer = 0;
    }

    queueChunkToBuild(chunk) {
        if (!chunk || chunk._inBuildQueue) return;
        chunk._inBuildQueue = true;
        this.chunksToBuild.push(chunk);
    }

    queueChunkToGenerate(chunk) {
        if (!chunk || chunk._inGenQueue) return;
        chunk._inGenQueue = true;
        this.chunksToGenerate.push(chunk);
    }

    setRenderDistance(d) {
        this.renderDistance = d;
        this._forceChunkScan = true;
        if (this.scene.fog) {
            const blocks = d * 16;
            if (this.scene.fog.isFog) {
                this.scene.fog.near = blocks * 0.75;
                this.scene.fog.far = blocks * 1.05;
            } else {
                this.scene.fog.density = 1.0 / (blocks * 0.75);
                this.scene.fog.baseDensity = this.scene.fog.density;
            }
        }
    }

    setCamera(camera) {
        this.camera = camera;
    }

    clearAll() {
        for (const chunk of this.chunks.values()) {
            chunk.dispose();
        }
        this.chunks.clear();
        this.chunksToBuild = [];
        this.chunksToGenerate = [];
        this.liquidUpdates.clear();
        this.lastPlayerChunkX = null;
        this.lastPlayerChunkZ = null;
        this._forceChunkScan = true;

        // Also sweep scene for any orphaned chunk meshes or leftover meshes
        const toRemove = [];
        if (this.scene && this.scene.children) {
            for (const child of this.scene.children) {
                if (child.isMesh && (child.userData.isChunkMesh || child.material === this.sharedMaterials || (Array.isArray(child.material) && child.material[0] === this.sharedMaterials[0]))) {
                    toRemove.push(child);
                }
            }
            for (const mesh of toRemove) {
                this.scene.remove(mesh);
                if (mesh.geometry) mesh.geometry.dispose();
            }
        }
        _meshPool.length = 0;
    }

    getChunkKey(cx, cz) {
        return `${this.dimension || 'overworld'},${cx},${cz}`;
    }

    getBiomeAt(wx, wz) {
        if (!this.planetParams) return null;
        return getBiomeParams(wx, wz, this.planetParams).biome;
    }

    getBlock(wx, wy, wz) {
        wx = Math.floor(wx); wy = Math.floor(wy); wz = Math.floor(wz);
        if (wy < 0 || wy >= CHUNK_HEIGHT) return BLOCKS.AIR;

        const cx = Math.floor(wx / CHUNK_SIZE);
        const cz = Math.floor(wz / CHUNK_SIZE);
        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

        const chunkKey = this.getChunkKey(cx, cz);
        const mods = this.modifications ? this.modifications.get(chunkKey) : null;
        if (mods) {
            const idx = (wy * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
            const mod = mods.get(idx);
            if (mod !== undefined) return mod.block;
        }

        const chunk = this.chunks.get(chunkKey);
        if (chunk) return chunk.getBlock(lx, wy, lz);
        return BLOCKS.AIR;
    }

    getData(wx, wy, wz) {
        wx = Math.floor(wx); wy = Math.floor(wy); wz = Math.floor(wz);
        if (wy < 0 || wy >= CHUNK_HEIGHT) return 0;

        const cx = Math.floor(wx / CHUNK_SIZE);
        const cz = Math.floor(wz / CHUNK_SIZE);
        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

        const chunkKey = this.getChunkKey(cx, cz);
        const mods = this.modifications ? this.modifications.get(chunkKey) : null;
        if (mods) {
            const idx = (wy * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
            const mod = mods.get(idx);
            if (mod !== undefined) return mod.data;
        }

        const chunk = this.chunks.get(chunkKey);
        if (chunk) return chunk.getData(lx, wy, lz);
        return 0;
    }

    getHighestBlock(x, z) {
        x = Math.floor(x);
        z = Math.floor(z);
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
            const b = this.getBlock(x, y, z);
            if (b !== BLOCKS.AIR) {
                const props = getBlockProperties(b);
                if (props && props.solid) return y;
            }
        }
        return 0;
    }

    setData(wx, wy, wz, dataValue) {
        wx = Math.floor(wx); wy = Math.floor(wy); wz = Math.floor(wz);
        if (wy < 0 || wy >= CHUNK_HEIGHT) return;
        const cx = Math.floor(wx / CHUNK_SIZE);
        const cz = Math.floor(wz / CHUNK_SIZE);
        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const chunk = this.getChunkAt(wx, wz);
        
        // Record modification
        const chunkKey = this.getChunkKey(cx, cz);
        let mods = this.modifications.get(chunkKey);
        if (!mods) {
            mods = new Map();
            this.modifications.set(chunkKey, mods);
        }
        const idx = (wy * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
        let mod = mods.get(idx);
        if (!mod) {
            const block = chunk ? chunk.getBlock(lx, wy, lz) : 0;
            mod = { block: block, data: dataValue };
            mods.set(idx, mod);
        } else {
            mod.data = dataValue;
        }

        if (chunk) chunk.setData(lx, wy, lz, dataValue);
    }

    checkSupport(x, y, z) {
        const type = this.getBlock(x, y, z);
        if (type === window.BLOCKS.AIR) return;

        let needsBreak = false;
        const blockBelow = this.getBlock(x, y - 1, z);
        
        // Plant-like blocks need dirt/grass/snow below
        if ([
            window.BLOCKS.TALL_GRASS, window.BLOCKS.FLOWER_RED, window.BLOCKS.FLOWER_YELLOW,
            window.BLOCKS.FERN, window.BLOCKS.TALL_FERN, window.BLOCKS.TALL_FERN_TOP,
            window.BLOCKS.BLUE_FLOWER, window.BLOCKS.WHITE_FLOWER, window.BLOCKS.PURPLE_FLOWER,
            window.BLOCKS.PINK_PETALS, window.BLOCKS.MUSHROOM_RED, window.BLOCKS.MUSHROOM_BROWN,
            window.BLOCKS.SWEET_BERRY_BUSH
        ].includes(type)) {
            if (type === window.BLOCKS.TALL_FERN_TOP) {
                if (blockBelow !== window.BLOCKS.TALL_FERN) needsBreak = true;
            } else if (![
                window.BLOCKS.GRASS, window.BLOCKS.DIRT, window.BLOCKS.MYCELIUM,
                window.BLOCKS.CRIMSON_NYLIUM, window.BLOCKS.WARPED_NYLIUM, window.BLOCKS.PODZOL,
                window.BLOCKS.MUD, window.BLOCKS.SWAMP_GRASS, window.BLOCKS.SAVANNA_GRASS,
                window.BLOCKS.SNOW
            ].includes(blockBelow)) {
                needsBreak = true;
            }
        }
        else if (type === window.BLOCKS.CACTUS) {
            if (blockBelow !== window.BLOCKS.SAND && blockBelow !== window.BLOCKS.CACTUS && blockBelow !== window.BLOCKS.RED_SAND) needsBreak = true;
        }
        else if (type === window.BLOCKS.SUGARCANE) {
            if (blockBelow === window.BLOCKS.SUGARCANE) {
                needsBreak = false;
            } else if ([window.BLOCKS.SAND, window.BLOCKS.DIRT, window.BLOCKS.GRASS, window.BLOCKS.PODZOL, window.BLOCKS.MYCELIUM, window.BLOCKS.COARSE_DIRT].includes(blockBelow)) {
                // Must be adjacent to water horizontally or diagonally below
                const neighbors = [
                    this.getBlock(x + 1, y - 1, z),
                    this.getBlock(x - 1, y - 1, z),
                    this.getBlock(x, y - 1, z + 1),
                    this.getBlock(x, y - 1, z - 1),
                    this.getBlock(x + 1, y - 2, z),
                    this.getBlock(x - 1, y - 2, z),
                    this.getBlock(x, y - 2, z + 1),
                    this.getBlock(x, y - 2, z - 1)
                ];
                if (!neighbors.includes(window.BLOCKS.WATER) && !neighbors.includes(window.BLOCKS.SWAMP_WATER)) {
                    needsBreak = true;
                }
            } else {
                needsBreak = true;
            }
        }
        else if (type === window.BLOCKS.TORCH) {
            // Needs ANY solid adjacent block
            let hasSupport = false;
            const dirs = [[0,-1,0], [0,1,0], [1,0,0], [-1,0,0], [0,0,1], [0,0,-1]];
            for (let d of dirs) {
                const adj = this.getBlock(x + d[0], y + d[1], z + d[2]);
                const p = getBlockProperties(adj);
                if (p && p.solid) { hasSupport = true; break; }
            }
            if (!hasSupport) needsBreak = true;
        }
        else if (type === window.BLOCKS.LADDER) {
            // Needs ANY solid adjacent block except top/bottom
            let hasSupport = false;
            const dirs = [[1,0,0], [-1,0,0], [0,0,1], [0,0,-1]];
            for (let d of dirs) {
                const adj = this.getBlock(x + d[0], y + d[1], z + d[2]);
                const p = getBlockProperties(adj);
                if (p && p.solid) { hasSupport = true; break; }
            }
            if (!hasSupport) needsBreak = true;
        }
        else if (type === window.BLOCKS.KELP || type === window.BLOCKS.KELP_PLANT) {
            const validSupports = [
                window.BLOCKS.KELP,
                window.BLOCKS.KELP_PLANT,
                window.BLOCKS.SAND,
                window.BLOCKS.RED_SAND,
                window.BLOCKS.GRAVEL,
                window.BLOCKS.DIRT,
                window.BLOCKS.STONE,
                window.BLOCKS.CLAY,
                window.BLOCKS.MUD
            ];
            if (!validSupports.includes(blockBelow)) {
                needsBreak = true;
            }
        }
        else {
            const pType = getBlockProperties(type);
            if (pType && pType.isCrop) {
                if (blockBelow !== window.BLOCKS.FARMLAND && blockBelow !== window.BLOCKS.FARMLAND_MOIST) {
                    needsBreak = true;
                }
            }
        }

        if (needsBreak) {
            const props = getBlockProperties(type);
            const replacement = (props && props.isWaterlogged) ? window.BLOCKS.WATER : window.BLOCKS.AIR;
            this.setBlock(x, y, z, replacement);
            this.checkAdjacentSupports(x, y, z);
        }
    }

    checkAdjacentSupports(wx, wy, wz) {
        // Only run if we aren't already deep in a recursive update stack to prevent infinite loops just in case
        this._updateDepth = (this._updateDepth || 0) + 1;
        if (this._updateDepth > 10) {
            this._updateDepth--;
            return;
        }

        this.checkSupport(wx, wy + 1, wz);
        this.checkSupport(wx, wy - 1, wz);
        this.checkSupport(wx + 1, wy, wz);
        this.checkSupport(wx - 1, wy, wz);
        this.checkSupport(wx, wy, wz + 1);
        this.checkSupport(wx, wy, wz - 1);

        this._updateDepth--;
    }

    setBlock(wx, wy, wz, type, dataValue = 0) {
        wx = Math.floor(wx); wy = Math.floor(wy); wz = Math.floor(wz);
        if (wy < 0 || wy >= CHUNK_HEIGHT) return;

        const cx = Math.floor(wx / CHUNK_SIZE);
        const cz = Math.floor(wz / CHUNK_SIZE);
        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        
        // Record modification
        const chunkKey = this.getChunkKey(cx, cz);
        let mods = this.modifications.get(chunkKey);
        if (!mods) {
            mods = new Map();
            this.modifications.set(chunkKey, mods);
        }
        const idx = (wy * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
        let mod = mods.get(idx);
        if (!mod) {
            mod = { block: type, data: dataValue };
            mods.set(idx, mod);
        } else {
            mod.block = type;
            mod.data = dataValue;
        }

        const chunk = this.getChunkAt(wx, wz);
        if (chunk) {
            const oldType = chunk.getBlock(lx, wy, lz);
            chunk.setBlock(lx, wy, lz, type);
            chunk.setData(lx, wy, lz, dataValue);
            
            if (this.onBlockDestroyed && (type === window.BLOCKS.AIR || type === window.BLOCKS.WATER || type === window.BLOCKS.SWAMP_WATER || type === window.BLOCKS.LAVA)) {
                this.onBlockDestroyed(wx, wy, wz, oldType, type);
            }
            
            // Register chest placement/removal
            if (oldType === window.BLOCKS.CHEST_BLOCK && type !== window.BLOCKS.CHEST_BLOCK) {
                if (this.onChestRemoved) this.onChestRemoved(wx, wy, wz);
            } else if (oldType !== window.BLOCKS.CHEST_BLOCK && type === window.BLOCKS.CHEST_BLOCK) {
                if (this.onChestPlaced) this.onChestPlaced(wx, wy, wz);
            }

            // Register boss spawner placement/removal
            if (oldType === window.BLOCKS.BOSS_SPAWNER && type !== window.BLOCKS.BOSS_SPAWNER) {
                if (this.spawners) this.spawners.delete(`${wx},${wy},${wz}`);
            } else if (oldType !== window.BLOCKS.BOSS_SPAWNER && type === window.BLOCKS.BOSS_SPAWNER) {
                if (!this.spawners) this.spawners = new Set();
                this.spawners.add(`${wx},${wy},${wz}`);
            }

            // Register furnace placement/removal
            if (oldType === window.BLOCKS.FURNACE && type !== window.BLOCKS.FURNACE) {
                if (this.onFurnaceRemoved) this.onFurnaceRemoved(wx, wy, wz);
            } else if (oldType !== window.BLOCKS.FURNACE && type === window.BLOCKS.FURNACE) {
                if (this.onFurnacePlaced) this.onFurnacePlaced(wx, wy, wz);
            }

            // Register door placement/removal
            const isDoor = (b) => b === window.BLOCKS.DUNGEON_DOOR || b === window.BLOCKS.DUNGEON_DOOR_TOP;
            if (isDoor(oldType) && !isDoor(type)) {
                if (this.onDoorRemoved) this.onDoorRemoved(wx, wy, wz);
            } else if (!isDoor(oldType) && isDoor(type)) {
                if (this.onDoorPlaced) this.onDoorPlaced(wx, wy, wz);
            }

            // Register fence gate placement/removal
            const isGate = (b) => getBlockProperties(b).isFenceGate;
            if (isGate(oldType) && !isGate(type)) {
                if (this.onGateRemoved) this.onGateRemoved(wx, wy, wz);
            } else if (!isGate(oldType) && isGate(type)) {
                if (this.onGatePlaced) this.onGatePlaced(wx, wy, wz, type);
            }

            // Register bed placement/removal
            const isBedFoot = (b) => {
                const p = getBlockProperties(b);
                return p.isBed && !p.isBedHead;
            };
            const isBedBlock = (b) => {
                const p = getBlockProperties(b);
                return p.isBed || p.isBedHead;
            };
            if (isBedBlock(oldType) && !isBedBlock(type)) {
                if (this.onBedRemoved) this.onBedRemoved(wx, wy, wz);
            } else if (!isBedFoot(oldType) && isBedFoot(type)) {
                if (this.onBedPlaced) this.onBedPlaced(wx, wy, wz, type);
            }

            if (oldType !== type) {
                this.checkAdjacentSupports(wx, wy, wz);
            }

            this.queueChunkToBuild(chunk);
            // Trigger neighbor fluid updates
            this.queueLiquidUpdate(wx, wy + 1, wz);
            this.queueLiquidUpdate(wx, wy - 1, wz);
            this.queueLiquidUpdate(wx, wy, wz + 1);
            this.queueLiquidUpdate(wx, wy, wz - 1);
            this.queueLiquidUpdate(wx + 1, wy, wz);
            this.queueLiquidUpdate(wx - 1, wy, wz);
            if (type === BLOCKS.WATER || type === BLOCKS.SWAMP_WATER || type === BLOCKS.LAVA) this.queueLiquidUpdate(wx, wy, wz);
            // Check neighbors if block is on border
            if (lx === 0) this._markChunkDirty(cx - 1, cz);
            if (lx === CHUNK_SIZE - 1) this._markChunkDirty(cx + 1, cz);
            if (lz === 0) this._markChunkDirty(cx, cz - 1);
            if (lz === CHUNK_SIZE - 1) this._markChunkDirty(cx, cz + 1);
        }
    }

    _markChunkDirty(cx, cz) {
        const chunk = this.chunks.get(this.getChunkKey(cx, cz));
        if (chunk) {
            chunk.dirty = true;
            this.queueChunkToBuild(chunk);
        }
    }

    getChunkAt(wx, wz) {
        const cx = Math.floor(Math.floor(wx) / CHUNK_SIZE);
        const cz = Math.floor(Math.floor(wz) / CHUNK_SIZE);
        return this.chunks.get(this.getChunkKey(cx, cz));
    }

    queueLiquidUpdate(x, y, z) {
        const t = this.getBlock(x, y, z);
        const props = getBlockProperties(t);
        if (props.isLiquid) {
            this.liquidUpdates.add(`${x},${y},${z}`);
        }
    }

    tickFluids() {
        const updates = Array.from(this.liquidUpdates);
        this.liquidUpdates.clear();        for (const key of updates) {
            const [x, y, z] = key.split(',').map(Number);
            const type = this.getBlock(x, y, z);
            const props = getBlockProperties(type);

            if (!props.isLiquid) continue;

            const isWater = type === BLOCKS.WATER || type === BLOCKS.SWAMP_WATER;
            const isLava = type === BLOCKS.LAVA;
            const maxLevel = isLava ? 3 : 7;
            
            const isWaterBlock = (b) => b === BLOCKS.WATER || b === BLOCKS.SWAMP_WATER;
            const isSameFluid = (b1, b2) => {
                if (b1 === b2) return true;
                if (isWaterBlock(b1) && isWaterBlock(b2)) return true;
                return false;
            };

            const data = this.getData(x, y, z);
            const isFalling = (data === 8);
            const currentLevel = (data === 0 || isFalling) ? maxLevel : data;

            // 1. Decay check: if not a source block, it needs a valid feed to survive
            if (data !== 0) {
                let hasFeed = false;
                const aboveBlock = this.getBlock(x, y + 1, z);
                if (isSameFluid(aboveBlock, type)) hasFeed = true;
                
                if (!hasFeed && !isFalling) {
                    const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                    for (const [dx, dz] of sides) {
                        const sideBlock = this.getBlock(x + dx, y, z + dz);
                        if (isSameFluid(sideBlock, type)) {
                            const sideData = this.getData(x + dx, y, z + dz);
                            const sideLevel = (sideData === 0 || sideData === 8) ? maxLevel : sideData;
                            if (sideLevel > currentLevel) { hasFeed = true; break; }
                        }
                    }
                }
                
                if (!hasFeed) {
                    this.setBlock(x, y, z, BLOCKS.AIR);
                    const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                    for (const [dx, dz] of sides) {
                        this.queueLiquidUpdate(x + dx, y, z + dz);
                    }
                    this.queueLiquidUpdate(x, y - 1, z);
                    continue; // Stop processing, the block is gone
                }
            }

            const bBelow = this.getBlock(x, y - 1, z);
            const belowProps = getBlockProperties(bBelow);

            const isWashablePlant = (b, p) => {
                if (!p) return false;
                if (p.isWaterlogged || p.isWaterPlant) return false;
                if (b >= BLOCKS.TUBE_CORAL && b <= BLOCKS.HORN_CORAL) return false;
                if (b === BLOCKS.BUBBLE_CORAL || b === BLOCKS.SEAGRASS || b === BLOCKS.KELP || b === BLOCKS.KELP_PLANT || b === BLOCKS.RED_KELP || b === BLOCKS.BROWN_KELP || b === BLOCKS.ALGAE) return false;
                return (p.isCross || p.isGrass);
            };

            // 2. Flow downwards
            if (bBelow === BLOCKS.AIR || isWashablePlant(bBelow, belowProps)) {
                this.setBlock(x, y - 1, z, type);
                this.setData(x, y - 1, z, 8); // 8 indicates falling fluid
                this.queueLiquidUpdate(x, y - 1, z);
            } 
            // 3. Water-lava interactions
            else if (belowProps.isLiquid && !isSameFluid(bBelow, type)) {
                if (isWater && bBelow === BLOCKS.LAVA) {
                    this.setBlock(x, y - 1, z, BLOCKS.OBSIDIAN);
                } else if (isLava && isWaterBlock(bBelow)) {
                    this.setBlock(x, y - 1, z, BLOCKS.STONE);
                }
            } 
            // 4. Spread sideways if blocked below (solid block) or if it's a source block
            if ((!belowProps.isLiquid || data === 0) && currentLevel > 1) {
                const nextLevel = currentLevel - 1;
                const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                for (const [dx, dz] of sides) {
                    const sideBlock = this.getBlock(x + dx, y, z + dz);
                    const sideProps = getBlockProperties(sideBlock);

                    if (sideBlock === BLOCKS.AIR || isWashablePlant(sideBlock, sideProps)) {
                        this.setBlock(x + dx, y, z + dz, type);
                        this.setData(x + dx, y, z + dz, nextLevel);
                        this.queueLiquidUpdate(x + dx, y, z + dz);
                    } else if (sideProps.isLiquid && !isSameFluid(sideBlock, type)) {
                        // Sideways mixing (water vs lava)
                        const sideIsLava = sideBlock === BLOCKS.LAVA;
                        if (isWater && sideIsLava) this.setBlock(x + dx, y, z + dz, BLOCKS.OBSIDIAN);
                        else if (isLava && !sideIsLava) this.setBlock(x, y, z, BLOCKS.COBBLESTONE);
                    } else if (isSameFluid(sideBlock, type)) {
                        const sideData = this.getData(x + dx, y, z + dz);
                        if (sideData !== 0 && sideData !== 8) {
                            if (nextLevel > sideData) {
                                this.setData(x + dx, y, z + dz, nextLevel);
                                this.queueLiquidUpdate(x + dx, y, z + dz);
                            }
                        }
                    }
                }
            }
        }
    }

    registerChunkFeatures(chunk) {
        if (!chunk || !chunk.blocks) return;
        for (let i = 0; i < chunk.blocks.length; i++) {
            const blockType = chunk.blocks[i];
            const bProps = getBlockProperties(blockType);
            if (blockType === window.BLOCKS.CHEST_BLOCK || blockType === window.BLOCKS.DUNGEON_DOOR || blockType === window.BLOCKS.TORCH || blockType === window.BLOCKS.FURNACE || blockType === window.BLOCKS.BOSS_SPAWNER || (bProps && bProps.isFenceGate)) {
                const y = Math.floor(i / (16 * 16));
                const rem = i % (16 * 16);
                const z = Math.floor(rem / 16);
                const x = rem % 16;
                const wx = chunk.cx * 16 + x;
                const wz = chunk.cz * 16 + z;
                if (blockType === window.BLOCKS.CHEST_BLOCK && this.onChestGenerated) {
                    this.onChestGenerated(wx, y, wz);
                } else if (blockType === window.BLOCKS.DUNGEON_DOOR && this.onDoorGenerated) {
                    this.onDoorGenerated(wx, y, wz);
                } else if ((blockType === window.BLOCKS.TORCH || blockType === window.BLOCKS.LANTERN || blockType === window.BLOCKS.SOUL_LANTERN || blockType === window.BLOCKS.GLOWSTONE) && this.onTorchGenerated) {
                    this.onTorchGenerated(wx, y, wz);
                } else if (blockType === window.BLOCKS.FURNACE && this.onFurnaceGenerated) {
                    this.onFurnaceGenerated(wx, y, wz);
                } else if (blockType === window.BLOCKS.BOSS_SPAWNER) {
                    if (!this.spawners) this.spawners = new Set();
                    this.spawners.add(`${wx},${y},${wz}`);
                } else if (bProps && bProps.isFenceGate && this.onGateGenerated) {
                    this.onGateGenerated(wx, y, wz, blockType);
                }
            }
        }
    }

    update(playerPos, terrainGenerator, dt) {
        if (this.matEndPortal) {
            this.matEndPortal.uniforms.time.value += (dt || 0.016);
            if (this.camera) {
                this.matEndPortal.uniforms.cameraPos.value.copy(this.camera.position);
            } else if (playerPos) {
                this.matEndPortal.uniforms.cameraPos.value.set(playerPos.x, playerPos.y, playerPos.z);
            }
        }

        const px = Math.floor(playerPos.x / CHUNK_SIZE);
        const pz = Math.floor(playerPos.z / CHUNK_SIZE);

        const playerMovedChunk = (px !== this.lastPlayerChunkX || pz !== this.lastPlayerChunkZ || this._forceChunkScan);
        if (playerMovedChunk) {
            this.lastPlayerChunkX = px;
            this.lastPlayerChunkZ = pz;
            this._forceChunkScan = false;

            const chunksToKeep = new Set();
            const r2 = this.renderDistance * this.renderDistance;

            // Find chunks that should be loaded
            for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
                for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                    if (x * x + z * z <= r2) {
                        const cx = px + x;
                        const cz = pz + z;
                        const key = this.getChunkKey(cx, cz);
                        chunksToKeep.add(key);

                        if (!this.chunks.has(key)) {
                            const chunk = new Chunk(cx, cz);
                            this.chunks.set(key, chunk);
                            this.queueChunkToGenerate(chunk);
                        }
                    }
                }
            }

            // Unload far chunks
            for (const [key, chunk] of this.chunks.entries()) {
                if (!chunksToKeep.has(key)) {
                    chunk.dispose();
                    if (this.onChunkUnloaded) this.onChunkUnloaded(chunk.cx, chunk.cz);
                    this.chunks.delete(key);
                    const index = this.chunksToBuild.indexOf(chunk);
                    if (index > -1) {
                        this.chunksToBuild.splice(index, 1);
                        chunk._inBuildQueue = false;
                    }
                    const gIndex = this.chunksToGenerate.indexOf(chunk);
                    if (gIndex > -1) {
                        this.chunksToGenerate.splice(gIndex, 1);
                        chunk._inGenQueue = false;
                    }
                }
            }
        }

        // Process chunks with a unified 6ms budget per frame to maintain locked 60 FPS
        const chunkWorkStart = performance.now();
        const MAX_CHUNK_WORK_MS = 6.0;
        let gensThisFrame = 0;
        
        while (this.chunksToGenerate.length > 0 && gensThisFrame < 2 && (performance.now() - chunkWorkStart < MAX_CHUNK_WORK_MS)) {
            let bestIdx = -1;
            let bestDist = Infinity;
            for (let i = 0; i < this.chunksToGenerate.length; i++) {
                const chunk = this.chunksToGenerate[i];
                const dist = Math.abs(chunk.cx - px) + Math.abs(chunk.cz - pz);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = i;
                }
            }
            let chunk;
            if (bestIdx > -1) {
                const lastIdx = this.chunksToGenerate.length - 1;
                chunk = this.chunksToGenerate[bestIdx];
                this.chunksToGenerate[bestIdx] = this.chunksToGenerate[lastIdx];
                this.chunksToGenerate.length = lastIdx;
            } else {
                chunk = this.chunksToGenerate.pop();
            }
            chunk._inGenQueue = false;
            // Don't generate if it was removed
            if (!this.chunks.has(this.getChunkKey(chunk.cx, chunk.cz))) continue;

            const genResult = terrainGenerator(chunk.cx, chunk.cz);
            chunk.blocks = genResult;
            if (genResult && genResult.data) {
                chunk.data.set(genResult.data);
            }
            chunk._generated = true;
            
            // Apply persistent modifications
            const chunkKey = this.getChunkKey(chunk.cx, chunk.cz);
            const mods = this.modifications.get(chunkKey);
            if (mods) {
                for (const [idx, mod] of mods.entries()) {
                    chunk.blocks[idx] = mod.block;
                    chunk.data[idx] = mod.data !== undefined ? mod.data : 0;
                }
            }

            chunk.dirty = true;
            this.queueChunkToBuild(chunk);

            // Register chests, doors, torches, furnaces, fence gates, and boss spawners
            this.registerChunkFeatures(chunk);

            // Re-mesh existing neighbor chunks to eliminate boundary seams / water walls (deduplicated)
            const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dx, dz] of neighbors) {
                const nKey = this.getChunkKey(chunk.cx + dx, chunk.cz + dz);
                const nChunk = this.chunks.get(nKey);
                if (nChunk && nChunk._generated) {
                    nChunk.dirty = true;
                    this.queueChunkToBuild(nChunk);
                }
            }
            gensThisFrame++;
        }

        // Process chunk meshing within dedicated time budget (guarantee at least 2 chunks mesh per frame to prevent blank world)
        const meshWorkStart = performance.now();
        const MAX_MESH_WORK_MS = 6.0;
        let buildsThisFrame = 0;
        while (this.chunksToBuild.length > 0 && (buildsThisFrame < 2 || (performance.now() - meshWorkStart < MAX_MESH_WORK_MS))) {
            if (buildsThisFrame >= 4) break;
            let bestIdx = -1;
            let bestDist = Infinity;
            for (let i = 0; i < this.chunksToBuild.length; i++) {
                const chunk = this.chunksToBuild[i];
                const dist = Math.abs(chunk.cx - px) + Math.abs(chunk.cz - pz);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = i;
                }
            }
            let chunk;
            if (bestIdx > -1) {
                const lastIdx = this.chunksToBuild.length - 1;
                chunk = this.chunksToBuild[bestIdx];
                this.chunksToBuild[bestIdx] = this.chunksToBuild[lastIdx];
                this.chunksToBuild.length = lastIdx;
            } else {
                chunk = this.chunksToBuild.pop();
            }
            chunk._inBuildQueue = false;
            if (chunk.dirty) {
                // Pass shared materials through atlas for convenience
                this.textureAtlas.sharedMaterials = this.sharedMaterials;
                const neighborChunks = [
                    [null, null, null],
                    [null, null, null],
                    [null, null, null]
                ];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        const key = this.getChunkKey(chunk.cx + dx, chunk.cz + dz);
                        neighborChunks[dx + 1][dz + 1] = this.chunks.get(key) || null;
                    }
                }
                const mesh = chunk.buildMesh(this.textureAtlas, neighborChunks, this.planetParams);
                if (mesh && !mesh.parent) {
                    this.scene.add(mesh);
                }
                if (chunk.waterMesh && !chunk.waterMesh.parent) {
                    this.scene.add(chunk.waterMesh);
                }
                if (chunk.endPortalMesh && !chunk.endPortalMesh.parent) {
                    this.scene.add(chunk.endPortalMesh);
                }
                buildsThisFrame++;
            }
        }

        // Frustum culling
        if (this.camera) {
            this.camera.updateMatrixWorld();
            this.projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
            this.frustum.setFromProjectionMatrix(this.projScreenMatrix);

            for (const chunk of this.chunks.values()) {
                const isVis = this.frustum.intersectsBox(chunk.worldBox);
                if (chunk.mesh) chunk.mesh.visible = isVis;
                if (chunk.waterMesh) chunk.waterMesh.visible = isVis;
                if (chunk.endPortalMesh) chunk.endPortalMesh.visible = isVis;
            }
        }

        if (dt) {
            this.tickTimer += dt;
            if (this.tickTimer >= 0.2) { // tick every 0.2s for snappy fluids and fire
                this.tickTimer = 0;
                this.tickFluids();
                this.tickRandomBlocks();
            }
        }
    }

    isFlammable(block) {
        if (!block || block === window.BLOCKS.AIR) return false;
        const props = getBlockProperties(block);
        return (props && props.flammable === true) || block === window.BLOCKS.TNT;
    }

    tickRandomBlocks() {
        let px = 0, pz = 0, hasCam = false;
        if (this.camera) {
            px = Math.floor(this.camera.position.x / 16);
            pz = Math.floor(this.camera.position.z / 16);
            hasCam = true;
        }

        // Pick random blocks per active chunk within simulation distance (~64 blocks around player)
        for (const chunk of this.chunks.values()) {
            if (!chunk._generated || !chunk.blocks) continue;
            if (hasCam && (Math.abs(chunk.cx - px) > 4 || Math.abs(chunk.cz - pz) > 4)) continue;
            
            for (let i = 0; i < 80; i++) {
                const rx = Math.floor(Math.random() * 16);
                const ry = Math.floor(Math.random() * CHUNK_HEIGHT);
                const rz = Math.floor(Math.random() * 16);
                
                const index = ry * 256 + rz * 16 + rx;
                const block = chunk.blocks[index];
                
                if (block === window.BLOCKS.SUGARCANE) {
                    const wx = chunk.cx * 16 + rx;
                    const wy = ry;
                    const wz = chunk.cz * 16 + rz;
                    // Check if air is above
                    if (wy < CHUNK_HEIGHT - 1 && this.getBlock(wx, wy + 1, wz) === window.BLOCKS.AIR) {
                        // Find how many sugarcane blocks are below
                        let height = 1;
                        let checkY = wy - 1;
                        while (checkY > 0 && this.getBlock(wx, checkY, wz) === window.BLOCKS.SUGARCANE) {
                            height++;
                            checkY--;
                        }
                        if (height < 3 && Math.random() < 0.2) { // Grow!
                            this.setBlock(wx, wy + 1, wz, window.BLOCKS.SUGARCANE);
                        }
                    }
                } else if (block === window.BLOCKS.KELP) {
                    const wx = chunk.cx * 16 + rx;
                    const wy = ry;
                    const wz = chunk.cz * 16 + rz;
                    // Kelp grows upward underwater
                    const blockAbove = (wy < CHUNK_HEIGHT - 1) ? this.getBlock(wx, wy + 1, wz) : window.BLOCKS.AIR;
                    const blockAbove2 = (wy < CHUNK_HEIGHT - 2) ? this.getBlock(wx, wy + 2, wz) : window.BLOCKS.AIR;
                    if (blockAbove === window.BLOCKS.WATER && blockAbove2 === window.BLOCKS.WATER) {
                        let height = 1;
                        let checkY = wy - 1;
                        while (checkY > 0 && (this.getBlock(wx, checkY, wz) === window.BLOCKS.KELP_PLANT || this.getBlock(wx, checkY, wz) === window.BLOCKS.KELP)) {
                            height++;
                            checkY--;
                        }
                        if (height < 15 && Math.random() < 0.15) {
                            // Turn current kelp top into kelp_plant, new block above becomes kelp!
                            this.setBlock(wx, wy, wz, window.BLOCKS.KELP_PLANT);
                            this.setBlock(wx, wy + 1, wz, window.BLOCKS.KELP);
                        }
                    }
                } else if (block === window.BLOCKS.FIRE || block === window.BLOCKS.SOUL_FIRE) {
                    const wx = chunk.cx * 16 + rx;
                    const wy = ry;
                    const wz = chunk.cz * 16 + rz;
                    const isSoulFire = block === window.BLOCKS.SOUL_FIRE;
                    
                    const dirs = [
                        [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]
                    ];
                    
                    // 1. Check if supported (needs solid block below, or adjacent flammable block)
                    let supported = false;
                    const blockBelow = this.getBlock(wx, wy - 1, wz);
                    const onSoulGround = blockBelow === window.BLOCKS.SOUL_SAND || blockBelow === window.BLOCKS.SOUL_SOIL;
                    if (isSoulFire && onSoulGround) {
                        supported = true;
                    } else if (blockBelow !== window.BLOCKS.AIR && blockBelow !== window.BLOCKS.WATER && blockBelow !== window.BLOCKS.LAVA && blockBelow !== window.BLOCKS.FIRE && blockBelow !== window.BLOCKS.SOUL_FIRE) {
                        supported = true;
                    } else {
                        for (const [dx, dy, dz] of dirs) {
                            if (this.isFlammable(this.getBlock(wx + dx, wy + dy, wz + dz))) {
                                supported = true;
                                break;
                            }
                        }
                    }
                    
                    if (!supported) {
                        this.setBlock(wx, wy, wz, window.BLOCKS.AIR);
                        continue;
                    }
                    
                    // 2. Spread to nearby AIR blocks that are next to flammable blocks
                    if (Math.random() < 0.4) {
                        const rx_spread = Math.floor(Math.random() * 3) - 1;
                        const ry_spread = Math.floor(Math.random() * 3) - 1;
                        const rz_spread = Math.floor(Math.random() * 3) - 1;
                        
                        if (rx_spread !== 0 || ry_spread !== 0 || rz_spread !== 0) {
                            const nx = wx + rx_spread;
                            const ny = wy + ry_spread;
                            const nz = wz + rz_spread;
                            
                            if (this.getBlock(nx, ny, nz) === window.BLOCKS.AIR) {
                                let canCatch = false;
                                for (const [dx, dy, dz] of dirs) {
                                    if (this.isFlammable(this.getBlock(nx + dx, ny + dy, nz + dz))) {
                                        canCatch = true;
                                        break;
                                    }
                                }
                                if (canCatch) {
                                    const belowTarget = this.getBlock(nx, ny - 1, nz);
                                    const spreadSoul = belowTarget === window.BLOCKS.SOUL_SAND || belowTarget === window.BLOCKS.SOUL_SOIL;
                                    this.setBlock(nx, ny, nz, spreadSoul ? window.BLOCKS.SOUL_FIRE : window.BLOCKS.FIRE);
                                }
                            }
                        }
                    }
                    
                    // 3. Destroy adjacent flammable blocks (burn them up over time) or ignite TNT
                    dirs.sort(() => Math.random() - 0.5);
                    for (const [dx, dy, dz] of dirs) {
                        const nx = wx + dx, ny = wy + dy, nz = wz + dz;
                        const adjBlock = this.getBlock(nx, ny, nz);
                        if (adjBlock === window.BLOCKS.TNT) {
                            if (window.game && window.game.igniteTNT) {
                                window.game.igniteTNT(nx, ny, nz);
                            } else {
                                this.setBlock(nx, ny, nz, window.BLOCKS.AIR);
                            }
                            break;
                        } else if (this.isFlammable(adjBlock) && Math.random() < 0.45) {
                            this.setBlock(nx, ny, nz, Math.random() < 0.6 ? (isSoulFire ? window.BLOCKS.SOUL_FIRE : window.BLOCKS.FIRE) : window.BLOCKS.AIR);
                            break;
                        }
                    }
                    
                    // 4. Fire naturally dies out sometimes (soul fire on soul soil never dies)
                    if (!isSoulFire && Math.random() < 0.1) {
                        this.setBlock(wx, wy, wz, window.BLOCKS.AIR);
                    }
                } else if (block === window.BLOCKS.LAVA) {
                    const wx = chunk.cx * 16 + rx;
                    const wy = ry;
                    const wz = chunk.cz * 16 + rz;
                    // Check immediate neighbors for TNT!
                    const dirs6 = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
                    for (const [dx, dy, dz] of dirs6) {
                        const nx = wx + dx, ny = wy + dy, nz = wz + dz;
                        if (this.getBlock(nx, ny, nz) === window.BLOCKS.TNT) {
                            if (window.game && window.game.igniteTNT) {
                                window.game.igniteTNT(nx, ny, nz);
                            }
                        }
                    }
                    if (Math.random() < 0.25) {
                        const wy = ry;
                        const wz = chunk.cz * 16 + rz;
                        
                        const nx = wx + (Math.floor(Math.random() * 3) - 1);
                        const ny = wy + (Math.floor(Math.random() * 3) - 1);
                        const nz = wz + (Math.floor(Math.random() * 3) - 1);
                        
                        // If it found an air block...
                        if (this.getBlock(nx, ny, nz) === window.BLOCKS.AIR) {
                            // Check if that air block is adjacent to something flammable
                            const dirs = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
                            let canCatch = false;
                            for (const [dx, dy, dz] of dirs) {
                                if (this.isFlammable(this.getBlock(nx + dx, ny + dy, nz + dz))) {
                                    canCatch = true;
                                    break;
                                }
                            }
                            if (canCatch) {
                                this.setBlock(nx, ny, nz, window.BLOCKS.FIRE);
                            }
                        }
                    }
                } else if (block === window.BLOCKS.FARMLAND || block === window.BLOCKS.FARMLAND_MOIST) {
                    const wx = chunk.cx * 16 + rx;
                    const wy = ry;
                    const wz = chunk.cz * 16 + rz;
                    // Check horizontal 9x9 area (Chebyshev distance 4) and dy in [-1, 1] for water
                    let hasWater = false;
                    for (let dx = -4; dx <= 4 && !hasWater; dx++) {
                        for (let dz = -4; dz <= 4 && !hasWater; dz++) {
                            for (let dy = -1; dy <= 1; dy++) {
                                const b = this.getBlock(wx + dx, wy + dy, wz + dz);
                                if (b === window.BLOCKS.WATER || b === window.BLOCKS.SWAMP_WATER) {
                                    hasWater = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (hasWater) {
                        if (block === window.BLOCKS.FARMLAND) {
                            this.setBlock(wx, wy, wz, window.BLOCKS.FARMLAND_MOIST);
                        }
                    } else {
                        if (block === window.BLOCKS.FARMLAND_MOIST) {
                            this.setBlock(wx, wy, wz, window.BLOCKS.FARMLAND);
                        } else {
                            // Dry farmland with no crop above reverts to dirt over time
                            const above = this.getBlock(wx, wy + 1, wz);
                            const pAbove = getBlockProperties(above);
                            if (!pAbove || !pAbove.isCrop) {
                                if (Math.random() < 0.25) {
                                    this.setBlock(wx, wy, wz, window.BLOCKS.DIRT);
                                }
                            }
                        }
                    }
                } else if (block >= window.BLOCKS.WHEAT_0 && block <= window.BLOCKS.WHEAT_6) {
                    const wx = chunk.cx * 16 + rx;
                    const wy = ry;
                    const wz = chunk.cz * 16 + rz;
                    const below = this.getBlock(wx, wy - 1, wz);
                    const isMoist = below === window.BLOCKS.FARMLAND_MOIST;
                    // Crops grow 1/3rd faster: moist 0.47 (was 0.35), dry 0.16 (was 0.12)
                    if (Math.random() < (isMoist ? 0.47 : 0.16)) {
                        this.setBlock(wx, wy, wz, block + 1);
                    }
                } else if (block >= window.BLOCKS.CARROTS_0 && block <= window.BLOCKS.CARROTS_2) {
                    const wx = chunk.cx * 16 + rx;
                    const wy = ry;
                    const wz = chunk.cz * 16 + rz;
                    const below = this.getBlock(wx, wy - 1, wz);
                    const isMoist = below === window.BLOCKS.FARMLAND_MOIST;
                    if (Math.random() < (isMoist ? 0.47 : 0.16)) {
                        this.setBlock(wx, wy, wz, block + 1);
                    }
                } else if (block >= window.BLOCKS.POTATOES_0 && block <= window.BLOCKS.POTATOES_2) {
                    const wx = chunk.cx * 16 + rx;
                    const wy = ry;
                    const wz = chunk.cz * 16 + rz;
                    const below = this.getBlock(wx, wy - 1, wz);
                    const isMoist = below === window.BLOCKS.FARMLAND_MOIST;
                    if (Math.random() < (isMoist ? 0.47 : 0.16)) {
                        this.setBlock(wx, wy, wz, block + 1);
                    }
                } else if (block >= window.BLOCKS.BEETROOTS_0 && block <= window.BLOCKS.BEETROOTS_2) {
                    const wx = chunk.cx * 16 + rx;
                    const wy = ry;
                    const wz = chunk.cz * 16 + rz;
                    const below = this.getBlock(wx, wy - 1, wz);
                    const isMoist = below === window.BLOCKS.FARMLAND_MOIST;
                    if (Math.random() < (isMoist ? 0.47 : 0.16)) {
                        this.setBlock(wx, wy, wz, block + 1);
                    }
                } else if (block === window.BLOCKS.PUMPKIN_STEM || block === window.BLOCKS.MELON_STEM) {
                    const wx = chunk.cx * 16 + rx;
                    const wy = ry;
                    const wz = chunk.cz * 16 + rz;
                    if (Math.random() < 0.27) {
                        const hDirs = [[1,0], [-1,0], [0,1], [0,-1]];
                        const [dx, dz] = hDirs[Math.floor(Math.random() * hDirs.length)];
                        const tx = wx + dx, ty = wy, tz = wz + dz;
                        if (this.getBlock(tx, ty, tz) === window.BLOCKS.AIR) {
                            const ground = this.getBlock(tx, ty - 1, tz);
                            const pG = getBlockProperties(ground);
                            if (pG && pG.solid && !pG.isLeaves && ground !== window.BLOCKS.AIR) {
                                const fruit = (block === window.BLOCKS.PUMPKIN_STEM) ? window.BLOCKS.PUMPKIN : window.BLOCKS.MELON;
                                this.setBlock(tx, ty, tz, fruit);
                            }
                        }
                    }
                } else if (block === window.BLOCKS.POINTED_DRIPSTONE_DOWN) {
                    const wx = chunk.cx * 16 + rx;
                    const wy = ry;
                    const wz = chunk.cz * 16 + rz;
                    const below = this.getBlock(wx, wy - 1, wz);
                    // Authentic Minecraft dripstone dripping water particles
                    if (window.game && window.game.particles && (below === window.BLOCKS.AIR || below === window.BLOCKS.POINTED_DRIPSTONE_UP)) {
                        if (Math.random() < 0.35) {
                            window.game.particles.emit(new THREE.Vector3(wx + 0.5, wy + 0.1, wz + 0.5), 'splash', 1, 0x3366cc);
                        }
                    }
                    // Growth tick (~15% chance when chosen)
                    if (Math.random() < 0.15) {
                        let topY = wy;
                        while (topY < 250 && this.getBlock(wx, topY + 1, wz) === window.BLOCKS.POINTED_DRIPSTONE_DOWN) {
                            topY++;
                        }
                        const attachBlock = this.getBlock(wx, topY + 1, wz);
                        const waterSource = this.getBlock(wx, topY + 2, wz);
                        const hasWater = (waterSource === window.BLOCKS.WATER || waterSource === window.BLOCKS.SWAMP_WATER || attachBlock === window.BLOCKS.DRIPSTONE_BLOCK);
                        if (hasWater) {
                            let tipY = wy;
                            while (tipY > 1 && this.getBlock(wx, tipY - 1, wz) === window.BLOCKS.POINTED_DRIPSTONE_DOWN) {
                                tipY--;
                            }
                            const blockUnderTip = this.getBlock(wx, tipY - 1, wz);
                            if (blockUnderTip === window.BLOCKS.AIR) {
                                this.setBlock(wx, tipY - 1, wz, window.BLOCKS.POINTED_DRIPSTONE_DOWN);
                            } else if (blockUnderTip !== window.BLOCKS.POINTED_DRIPSTONE_UP) {
                                // Search downwards for floor/stalagmite up to 10 blocks to grow upward towards tip
                                for (let dy = 1; dy <= 10; dy++) {
                                    const bCheck = this.getBlock(wx, tipY - dy, wz);
                                    if (bCheck === window.BLOCKS.POINTED_DRIPSTONE_UP) {
                                        if (this.getBlock(wx, tipY - dy + 1, wz) === window.BLOCKS.AIR) {
                                            this.setBlock(wx, tipY - dy + 1, wz, window.BLOCKS.POINTED_DRIPSTONE_UP);
                                        }
                                        break;
                                    } else if (getBlockProperties(bCheck).solid) {
                                        if (this.getBlock(wx, tipY - dy + 1, wz) === window.BLOCKS.AIR) {
                                            this.setBlock(wx, tipY - dy + 1, wz, window.BLOCKS.POINTED_DRIPSTONE_UP);
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } else {
                    const bProps = getBlockProperties(block);
                    if (bProps && bProps.isSapling) {
                        const wx = chunk.cx * 16 + rx;
                        const wy = ry;
                        const wz = chunk.cz * 16 + rz;
                        // Natural sapling growth tick (~12% chance when chosen)
                        if (Math.random() < 0.12) {
                            growSapling(this, wx, wy, wz, block);
                        }
                    }
                }
            }
        }
    }

    raycast(origin, direction, maxDist = 8, hitLiquids = false) {
        // Fast voxel raycast algorithm (Amanatides & Woo)
        let t = 0;
        let ix = Math.floor(origin.x);
        let iy = Math.floor(origin.y);
        let iz = Math.floor(origin.z);

        const stepX = Math.sign(direction.x);
        const stepY = Math.sign(direction.y);
        const stepZ = Math.sign(direction.z);

        const tDeltaX = stepX !== 0 ? Math.abs(1 / direction.x) : Infinity;
        const tDeltaY = stepY !== 0 ? Math.abs(1 / direction.y) : Infinity;
        const tDeltaZ = stepZ !== 0 ? Math.abs(1 / direction.z) : Infinity;

        let tMaxX = stepX > 0 ? (ix + 1 - origin.x) * tDeltaX : (origin.x - ix) * tDeltaX;
        let tMaxY = stepY > 0 ? (iy + 1 - origin.y) * tDeltaY : (origin.y - iy) * tDeltaY;
        let tMaxZ = stepZ > 0 ? (iz + 1 - origin.z) * tDeltaZ : (origin.z - iz) * tDeltaZ;

        let steppedIndex = -1;

        while (t <= maxDist) {
            const blockType = this.getBlock(ix, iy, iz);
            const props = getBlockProperties(blockType);

            const isLiquidHit = hitLiquids && props.isLiquid;
            const isSolidOrInteractable = props.solid || props.isCross || blockType === BLOCKS.FIRE || (window.BLOCKS && (blockType === window.BLOCKS.FIRE || blockType === window.BLOCKS.SOUL_FIRE)) || blockType === BLOCKS.PORTAL || blockType === BLOCKS.BOSS_SPAWNER || (window.BLOCKS && (blockType === window.BLOCKS.AETHER_PORTAL || blockType === window.BLOCKS.CAVERN_PORTAL || blockType === window.BLOCKS.HIGHLANDS_PORTAL));
            if (blockType !== BLOCKS.AIR && (isLiquidHit || (!props.isLiquid && isSolidOrInteractable))) {
                const hitNormal = new THREE.Vector3(0, 0, 0);
                if (steppedIndex === 0) hitNormal.x = -stepX;
                if (steppedIndex === 1) hitNormal.y = -stepY;
                if (steppedIndex === 2) hitNormal.z = -stepZ;

                return {
                    hit: true,
                    position: origin.clone().add(direction.clone().multiplyScalar(t)),
                    normal: hitNormal,
                    face: hitNormal,
                    blockPos: { x: ix, y: iy, z: iz },
                    blockType: blockType
                };
            }

            if (tMaxX < tMaxY) {
                if (tMaxX < tMaxZ) {
                    ix += stepX;
                    t = tMaxX;
                    tMaxX += tDeltaX;
                    steppedIndex = 0;
                } else {
                    iz += stepZ;
                    t = tMaxZ;
                    tMaxZ += tDeltaZ;
                    steppedIndex = 2;
                }
            } else {
                if (tMaxY < tMaxZ) {
                    iy += stepY;
                    t = tMaxY;
                    tMaxY += tDeltaY;
                    steppedIndex = 1;
                } else {
                    iz += stepZ;
                    t = tMaxZ;
                    tMaxZ += tDeltaZ;
                    steppedIndex = 2;
                }
            }
        }

        return { hit: false };
    }

    collide(position, velocity, entityWidth = 0.6, entityHeight = 1.8, isSneaking = false, stepHeight = 0.55) {
        // AABB vs Voxel Grid collision
        const hw = entityWidth / 2;

        let targetX = position.x + velocity.x;
        let targetY = position.y + velocity.y;
        let targetZ = position.z + velocity.z;
        let grounded = false;

        // Function to check if an AABB overlaps solid blocks
        const checkCollision = (px, py, pz) => {
            const minX = Math.floor(px - hw + 0.01);
            const maxX = Math.floor(px + hw - 0.01);
            const minY = Math.floor(py);
            const maxY = Math.floor(py + entityHeight - 0.01);
            const minZ = Math.floor(pz - hw + 0.01);
            const maxZ = Math.floor(pz + hw - 0.01);

            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        const block = this.getBlock(x, y, z);
                        const bProps = getBlockProperties(block);
                            if (bProps.solid) {
                                if ((block === window.BLOCKS.DUNGEON_DOOR || block === window.BLOCKS.DUNGEON_DOOR_TOP) && this.isDoorOpen && this.isDoorOpen(x, y, z)) {
                                    continue;
                                }
                                if (bProps.isFenceGate && this.isGateOpen && this.isGateOpen(x, y, z)) {
                                    continue;
                                }
                                if (bProps.isFarmland || bProps.isDirtPath) {
                                    if (py < y + 0.9375 && py + entityHeight > y) return true;
                                    continue;
                                }
                                if (bProps.isSlab) {
                                    if (py < y + 0.5 && py + entityHeight > y) return true;
                                    continue;
                                }
                                if (bProps.isStair) {
                                    // Lower step (0 to 0.5) is across full block
                                    if (py < y + 0.5 && py + entityHeight > y) return true;
                                    // Upper step (0.5 to 1.0) is only on the high half
                                    if (py < y + 1.0 && py + entityHeight > y + 0.5) {
                                        const sFacing = (this.getData ? this.getData(x, y, z) : 0) & 3;
                                        // 0: North (-Z), 1: East (+X), 2: South (+Z), 3: West (-X)
                                        let sMinX = x, sMaxX = x + 1, sMinZ = z, sMaxZ = z + 1;
                                        if (sFacing === 0) sMaxZ = z + 0.5;
                                        else if (sFacing === 1) sMinX = x + 0.5;
                                        else if (sFacing === 2) sMinZ = z + 0.5;
                                        else sMaxX = x + 0.5;

                                        // Player AABB is [px - hw, px + hw] x [pz - hw, pz + hw]
                                        if (px + hw > sMinX && px - hw < sMaxX && pz + hw > sMinZ && pz - hw < sMaxZ) {
                                            return true;
                                        }
                                    }
                                    continue;
                                }
                                if (bProps.isBed || bProps.isBedHead || bProps.isStonecutter || block === window.BLOCKS.STONECUTTER) {
                                    if (py < y + 0.5625 && py + entityHeight > y) return true;
                                    continue;
                                }
                                if (bProps.isLilyPad || block === window.BLOCKS.LILY_PAD) {
                                    if (py < y + 0.015 && py + entityHeight > y) return true;
                                    continue;
                                }
                                if (block === window.BLOCKS.PORTAL_FRAME || block === window.BLOCKS.END_PORTAL_FRAME_EYE) {
                                    if (py < y + 0.8125 && py + entityHeight > y) return true;
                                    continue;
                                }
                                if (bProps.isFence || bProps.isWall) {
                                    if (py < y + 1.5 && py + entityHeight > y) {
                                        // Authentic Minecraft fence collision: central post [x+0.375, x+0.625] x [z+0.375, z+0.625] plus connected arms
                                        const pL = px - hw, pR = px + hw, pN = pz - hw, pF = pz + hw;
                                        if (pR > x + 0.375 && pL < x + 0.625 && pF > z + 0.375 && pN < z + 0.625) return true;

                                        const canConn = (bx, bz) => {
                                            const p = getBlockProperties(this.getBlock(bx, y, bz));
                                            return p.solid || p.isFence || p.isWall;
                                        };
                                        // -X arm
                                        if (canConn(x - 1, z) && pR > x && pL < x + 0.375 && pF > z + 0.375 && pN < z + 0.625) return true;
                                        // +X arm
                                        if (canConn(x + 1, z) && pR > x + 0.625 && pL < x + 1.0 && pF > z + 0.375 && pN < z + 0.625) return true;
                                        // -Z arm
                                        if (canConn(x, z - 1) && pR > x + 0.375 && pL < x + 0.625 && pF > z && pN < z + 0.375) return true;
                                        // +Z arm
                                        if (canConn(x, z + 1) && pR > x + 0.375 && pL < x + 0.625 && pF > z + 0.625 && pN < z + 1.0) return true;
                                    }
                                    continue;
                                }
                                if (bProps.isFenceGate) {
                                    if (this.isGateOpen && this.isGateOpen(x, y, z)) {
                                        continue; // Open fence gate: no collision, walk freely through
                                    }
                                    if (py < y + 1.5 && py + entityHeight > y) return true;
                                    continue;
                                }
                                return true;
                            }
                        }
                    }
                }
                return false;
            };

            // Sneak edge detection
            if (isSneaking && checkCollision(position.x, position.y - 0.1, position.z)) {
                if (!checkCollision(targetX, position.y - 0.1, position.z)) {
                    velocity.x = 0;
                    targetX = position.x;
                }
                if (!checkCollision(targetX, position.y - 0.1, targetZ)) { // Use targetX because it might have been reset
                    velocity.z = 0;
                    targetZ = position.z;
                }
            }

            // Y-axis
            if (checkCollision(position.x, targetY, position.z)) {
                velocity.y = 0;
                if (targetY < position.y) { // Falling down
                    grounded = true;
                    const minX = Math.floor(position.x - hw + 0.01);
                    const maxX = Math.floor(position.x + hw - 0.01);
                    const minZ = Math.floor(position.z - hw + 0.01);
                    const maxZ = Math.floor(position.z + hw - 0.01);
                    const startY = Math.floor(position.y);
                    const endY = Math.floor(targetY);
                    let highestSurfaceY = null;
                    for (let y = startY; y >= endY; y--) {
                        for (let x = minX; x <= maxX; x++) {
                            for (let z = minZ; z <= maxZ; z++) {
                                const block = this.getBlock(x, y, z);
                                const bProps = getBlockProperties(block);
                                if (bProps.solid) {
                                    if ((block === window.BLOCKS.DUNGEON_DOOR || block === window.BLOCKS.DUNGEON_DOOR_TOP) && this.isDoorOpen && this.isDoorOpen(x, y, z)) continue;
                                    if (bProps.isFenceGate && this.isGateOpen && this.isGateOpen(x, y, z)) continue;
                                    let surfH = 1.0;
                                    if (bProps.isFarmland || bProps.isDirtPath) surfH = 0.9375;
                                    else if (bProps.isSlab) surfH = 0.5;
                                    else if (bProps.isStair) {
                                        const sFacing = (this.getData ? this.getData(x, y, z) : 0) & 3;
                                        let isHigh = false;
                                        if (sFacing === 0 && (position.z - Math.floor(position.z)) < 0.5) isHigh = true;
                                        else if (sFacing === 1 && (position.x - Math.floor(position.x)) >= 0.5) isHigh = true;
                                        else if (sFacing === 2 && (position.z - Math.floor(position.z)) >= 0.5) isHigh = true;
                                        else if (sFacing === 3 && (position.x - Math.floor(position.x)) < 0.5) isHigh = true;
                                        surfH = isHigh ? 1.0 : 0.5;
                                    }
                                    else if (bProps.isBed || bProps.isBedHead || bProps.isStonecutter || block === window.BLOCKS.STONECUTTER) surfH = 0.5625;
                                    else if (bProps.isLilyPad || block === window.BLOCKS.LILY_PAD) surfH = 0.015;
                                    else if (block === window.BLOCKS.PORTAL_FRAME || block === window.BLOCKS.END_PORTAL_FRAME_EYE) surfH = 0.8125;
                                    else if (bProps.isFence || bProps.isWall || bProps.isFenceGate) surfH = 1.5;
                                    if (highestSurfaceY === null || (y + surfH) > highestSurfaceY) {
                                        highestSurfaceY = y + surfH;
                                    }
                                }
                            }
                        }
                        if (highestSurfaceY !== null) break;
                    }
                    targetY = highestSurfaceY !== null ? highestSurfaceY : (Math.floor(position.y) + 1.0);
                } else { // Jumping up and hitting ceiling
                    const minX = Math.floor(position.x - hw + 0.01);
                    const maxX = Math.floor(position.x + hw - 0.01);
                    const minZ = Math.floor(position.z - hw + 0.01);
                    const maxZ = Math.floor(position.z + hw - 0.01);
                    const startY = Math.floor(position.y + entityHeight);
                    const endY = Math.floor(targetY + entityHeight - 0.01);
                    let lowestCeilingY = null;
                    for (let y = startY; y <= endY; y++) {
                        for (let x = minX; x <= maxX; x++) {
                            for (let z = minZ; z <= maxZ; z++) {
                                const block = this.getBlock(x, y, z);
                                const bProps = getBlockProperties(block);
                                if (bProps.solid) {
                                    if ((block === window.BLOCKS.DUNGEON_DOOR || block === window.BLOCKS.DUNGEON_DOOR_TOP) && this.isDoorOpen && this.isDoorOpen(x, y, z)) continue;
                                    if (bProps.isFenceGate && this.isGateOpen && this.isGateOpen(x, y, z)) continue;
                                    if (lowestCeilingY === null || y < lowestCeilingY) {
                                        lowestCeilingY = y;
                                    }
                                }
                        }
                    }
                    if (lowestCeilingY !== null) break;
                }
                const ceilingBlockY = lowestCeilingY !== null ? lowestCeilingY : Math.floor(targetY + entityHeight - 0.01);
                targetY = Math.min(position.y, ceilingBlockY - entityHeight - 0.001);
            }
        }

        // Top surface evaluation helper for obstacle stepping
        const getBlockTopY = (x, y, z, px, pz) => {
            const block = this.getBlock(x, y, z);
            const bProps = getBlockProperties(block);
            if (!bProps || !bProps.solid) return null;
            if ((block === window.BLOCKS.DUNGEON_DOOR || block === window.BLOCKS.DUNGEON_DOOR_TOP) && this.isDoorOpen && this.isDoorOpen(x, y, z)) return null;
            if (bProps.isFenceGate && this.isGateOpen && this.isGateOpen(x, y, z)) return null;

            let surfH = 1.0;
            if (bProps.isFarmland || bProps.isDirtPath) surfH = 0.9375;
            else if (bProps.isSlab) surfH = 0.5;
            else if (bProps.isStair) {
                const sFacing = (this.getData ? this.getData(x, y, z) : 0) & 3;
                let isHigh = false;
                const fracX = px - Math.floor(px);
                const fracZ = pz - Math.floor(pz);
                if (sFacing === 0 && fracZ < 0.5) isHigh = true;
                else if (sFacing === 1 && fracX >= 0.5) isHigh = true;
                else if (sFacing === 2 && fracZ >= 0.5) isHigh = true;
                else if (sFacing === 3 && fracX < 0.5) isHigh = true;
                surfH = isHigh ? 1.0 : 0.5;
            } else if (bProps.isBed || bProps.isBedHead || bProps.isStonecutter || block === window.BLOCKS.STONECUTTER) {
                surfH = 0.5625;
            } else if (bProps.isLilyPad || block === window.BLOCKS.LILY_PAD) {
                surfH = 0.015;
            } else if (block === window.BLOCKS.PORTAL_FRAME || block === window.BLOCKS.END_PORTAL_FRAME_EYE) {
                surfH = 0.8125;
            } else if (bProps.isFence || bProps.isWall || bProps.isFenceGate) {
                surfH = 1.5;
            }
            return y + surfH;
        };

        const findFootprintSurfaceY = (px, py, pz, maxStep) => {
            const minX = Math.floor(px - hw + 0.01);
            const maxX = Math.floor(px + hw - 0.01);
            const minZ = Math.floor(pz - hw + 0.01);
            const maxZ = Math.floor(pz + hw - 0.01);
            const minY = Math.floor(py - 0.2);
            const maxY = Math.floor(py + maxStep);
            let highest = null;
            for (let y = maxY; y >= minY; y--) {
                for (let x = minX; x <= maxX; x++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        const topY = getBlockTopY(x, y, z, px, pz);
                        if (topY !== null && topY <= py + maxStep + 0.01) {
                            if (highest === null || topY > highest) {
                                highest = topY;
                            }
                        }
                    }
                }
            }
            return highest;
        };

        const canStep = (grounded || checkCollision(position.x, position.y - 0.08, position.z)) && (stepHeight > 0);

        // X-axis: collision and half-block auto-walk step-up
        if (checkCollision(targetX, targetY, position.z)) {
            let stepped = false;
            if (canStep) {
                const stepSurf = findFootprintSurfaceY(targetX, targetY, position.z, stepHeight);
                if (stepSurf !== null) {
                    const diff = stepSurf - targetY;
                    if (diff > 0.001 && diff <= stepHeight + 0.01) {
                        if (!checkCollision(position.x, stepSurf, position.z) && !checkCollision(targetX, stepSurf, position.z)) {
                            targetY = stepSurf;
                            grounded = true;
                            stepped = true;
                        }
                    }
                }
            }
            if (!stepped) {
                velocity.x = 0;
                targetX = position.x;
            }
        }

        // Z-axis: collision and half-block auto-walk step-up
        if (checkCollision(targetX, targetY, targetZ)) {
            let stepped = false;
            if (canStep) {
                const stepSurf = findFootprintSurfaceY(targetX, targetY, targetZ, stepHeight);
                if (stepSurf !== null) {
                    const diff = stepSurf - targetY;
                    if (diff > 0.001 && diff <= stepHeight + 0.01) {
                        if (!checkCollision(targetX, stepSurf, position.z) && !checkCollision(targetX, stepSurf, targetZ)) {
                            targetY = stepSurf;
                            grounded = true;
                            stepped = true;
                        }
                    }
                }
            }
            if (!stepped) {
                velocity.z = 0;
                targetZ = position.z;
            }
        }

        position.set(targetX, targetY, targetZ);
        return { position, velocity, grounded };
    }
}

export function growSapling(world, wx, wy, wz, saplingType, particles = null, audio = null) {
    if (!world) return false;
    saplingType = Number(saplingType);
    
    // Check 4 possible 2x2 corner arrangements containing (wx, wz)
    const offsets = [[0, 0], [-1, 0], [0, -1], [-1, -1]];
    let is2x2 = false;
    let base2x2X = wx;
    let base2x2Z = wz;

    for (const [ox, oz] of offsets) {
        const bx = wx + ox;
        const bz = wz + oz;
        const b00 = world.getBlock(bx, wy, bz);
        const b10 = world.getBlock(bx + 1, wy, bz);
        const b01 = world.getBlock(bx, wy, bz + 1);
        const b11 = world.getBlock(bx + 1, wy, bz + 1);
        if (b00 === saplingType && b10 === saplingType && b01 === saplingType && b11 === saplingType) {
            is2x2 = true;
            base2x2X = bx;
            base2x2Z = bz;
            break;
        }
    }

    const oakSap = (window.BLOCKS && window.BLOCKS.OAK_SAPLING) || 373;
    const spruceSap = (window.BLOCKS && window.BLOCKS.SPRUCE_SAPLING) || 374;
    const birchSap = (window.BLOCKS && window.BLOCKS.BIRCH_SAPLING) || 375;
    const jungleSap = (window.BLOCKS && window.BLOCKS.JUNGLE_SAPLING) || 376;
    const acaciaSap = (window.BLOCKS && window.BLOCKS.ACACIA_SAPLING) || 377;
    const darkOakSap = (window.BLOCKS && window.BLOCKS.DARK_OAK_SAPLING) || 378;

    const oakWood = (window.BLOCKS && window.BLOCKS.WOOD) || 5;
    const oakLeaves = (window.BLOCKS && window.BLOCKS.LEAVES) || 18;
    const spruceWood = (window.BLOCKS && window.BLOCKS.PINE_WOOD) || 39;
    const spruceLeaves = (window.BLOCKS && window.BLOCKS.PINE_LEAVES) || 40;
    const birchWood = (window.BLOCKS && window.BLOCKS.BIRCH_WOOD) || 45;
    const birchLeaves = (window.BLOCKS && window.BLOCKS.BIRCH_LEAVES) || 46;
    const jungleLeaves = (window.BLOCKS && (window.BLOCKS.JUNGLE_LEAVES || window.BLOCKS.LEAVES)) || 18;
    const acaciaWood = (window.BLOCKS && window.BLOCKS.ACACIA_WOOD) || 51;
    const acaciaLeaves = (window.BLOCKS && window.BLOCKS.ACACIA_LEAVES) || 52;
    const darkOakWood = (window.BLOCKS && window.BLOCKS.DARK_OAK_WOOD) || 47;
    const darkOakLeaves = (window.BLOCKS && window.BLOCKS.DARK_OAK_LEAVES) || 48;
    const vinesId = (window.BLOCKS && window.BLOCKS.VINES) || 63;
    const airId = (window.BLOCKS && window.BLOCKS.AIR) || 0;

    const safeSet = (sx, sy, sz, type, onlyAir = false) => {
        if (sy < 0 || sy >= CHUNK_HEIGHT) return;
        if (onlyAir) {
            const cur = world.getBlock(sx, sy, sz);
            if (cur !== airId) return;
        }
        world.setBlock(sx, sy, sz, type);
    };

    if (is2x2) {
        // Clear 4 saplings
        safeSet(base2x2X, wy, base2x2Z, airId);
        safeSet(base2x2X + 1, wy, base2x2Z, airId);
        safeSet(base2x2X, wy, base2x2Z + 1, airId);
        safeSet(base2x2X + 1, wy, base2x2Z + 1, airId);

        let woodType = oakWood;
        let leafType = oakLeaves;
        if (saplingType === spruceSap) { woodType = spruceWood; leafType = spruceLeaves; }
        else if (saplingType === birchSap) { woodType = birchWood; leafType = birchLeaves; }
        else if (saplingType === jungleSap) { woodType = oakWood; leafType = jungleLeaves; }
        else if (saplingType === acaciaSap) { woodType = acaciaWood; leafType = acaciaLeaves; }
        else if (saplingType === darkOakSap) { woodType = darkOakWood; leafType = darkOakLeaves; }

        if (saplingType === darkOakSap) {
            // Authentic Minecraft Dark Oak Tree: 2x2 trunk, 7-10 tall, thick broad canopy
            const height = 7 + Math.floor(Math.random() * 3);
            for (let i = 0; i < height; i++) {
                safeSet(base2x2X, wy + i, base2x2Z, woodType);
                safeSet(base2x2X + 1, wy + i, base2x2Z, woodType);
                safeSet(base2x2X, wy + i, base2x2Z + 1, woodType);
                safeSet(base2x2X + 1, wy + i, base2x2Z + 1, woodType);
            }
            // Branch logs
            safeSet(base2x2X - 1, wy + height - 2, base2x2Z, woodType);
            safeSet(base2x2X + 2, wy + height - 2, base2x2Z + 1, woodType);
            
            // Canopy
            const topY = wy + height;
            for (let dy = -2; dy <= 1; dy++) {
                const rad = (dy === 1) ? 2 : (dy === -2 ? 3 : 4);
                for (let dx = -rad; dx <= rad + 1; dx++) {
                    for (let dz = -rad; dz <= rad + 1; dz++) {
                        const distSq = (dx - 0.5) * (dx - 0.5) + (dz - 0.5) * (dz - 0.5);
                        if (distSq > (rad + 0.6) * (rad + 0.6)) continue;
                        safeSet(base2x2X + dx, topY + dy, base2x2Z + dz, leafType, true);
                    }
                }
            }
        } else if (saplingType === spruceSap) {
            // Mega Spruce Tree: 20-28 tall, tapered conical canopy
            const height = 20 + Math.floor(Math.random() * 8);
            for (let i = 0; i < height; i++) {
                safeSet(base2x2X, wy + i, base2x2Z, woodType);
                safeSet(base2x2X + 1, wy + i, base2x2Z, woodType);
                safeSet(base2x2X, wy + i, base2x2Z + 1, woodType);
                safeSet(base2x2X + 1, wy + i, base2x2Z + 1, woodType);
            }
            const topY = wy + height;
            safeSet(base2x2X, topY + 1, base2x2Z, leafType);
            safeSet(base2x2X + 1, topY + 1, base2x2Z, leafType);
            safeSet(base2x2X, topY + 1, base2x2Z + 1, leafType);
            safeSet(base2x2X + 1, topY + 1, base2x2Z + 1, leafType);

            for (let ly = topY; ly >= wy + 4; ly--) {
                const distFromTop = topY - ly;
                const rad = Math.min(4, 1 + Math.floor(distFromTop / 3));
                for (let dx = -rad; dx <= rad + 1; dx++) {
                    for (let dz = -rad; dz <= rad + 1; dz++) {
                        const distSq = (dx - 0.5) * (dx - 0.5) + (dz - 0.5) * (dz - 0.5);
                        if (distSq > (rad + 0.5) * (rad + 0.5)) continue;
                        safeSet(base2x2X + dx, ly, base2x2Z + dz, leafType, true);
                    }
                }
            }
        } else if (saplingType === jungleSap) {
            // Mega Jungle Tree: 16-24 tall, draped vines, massive dome
            const height = 16 + Math.floor(Math.random() * 8);
            for (let i = 0; i < height; i++) {
                safeSet(base2x2X, wy + i, base2x2Z, woodType);
                safeSet(base2x2X + 1, wy + i, base2x2Z, woodType);
                safeSet(base2x2X, wy + i, base2x2Z + 1, woodType);
                safeSet(base2x2X + 1, wy + i, base2x2Z + 1, woodType);

                if (i >= 0 && i < height - 2 && Math.random() < 0.4) {
                    safeSet(base2x2X - 1, wy + i, base2x2Z, vinesId, true);
                    safeSet(base2x2X + 2, wy + i, base2x2Z, vinesId, true);
                    safeSet(base2x2X, wy + i, base2x2Z - 1, vinesId, true);
                    safeSet(base2x2X, wy + i, base2x2Z + 2, vinesId, true);
                }
            }
            const topY = wy + height;
            for (let dy = -3; dy <= 1; dy++) {
                const rad = (dy === 1) ? 2 : (dy === -3 ? 3 : 4);
                for (let dx = -rad; dx <= rad + 1; dx++) {
                    for (let dz = -rad; dz <= rad + 1; dz++) {
                        const distSq = (dx - 0.5) * (dx - 0.5) + (dz - 0.5) * (dz - 0.5);
                        if (distSq > (rad + 0.8) * (rad + 0.8)) continue;
                        safeSet(base2x2X + dx, topY + dy, base2x2Z + dz, leafType, true);
                    }
                }
            }
        } else {
            // Generic 2x2 Giant Tree (Oak / Birch / Acacia)
            const height = 12 + Math.floor(Math.random() * 6);
            for (let i = 0; i < height; i++) {
                safeSet(base2x2X, wy + i, base2x2Z, woodType);
                safeSet(base2x2X + 1, wy + i, base2x2Z, woodType);
                safeSet(base2x2X, wy + i, base2x2Z + 1, woodType);
                safeSet(base2x2X + 1, wy + i, base2x2Z + 1, woodType);
            }
            const topY = wy + height;
            for (let dy = -2; dy <= 2; dy++) {
                const rad = (Math.abs(dy) === 2) ? 2 : 4;
                for (let dx = -rad; dx <= rad + 1; dx++) {
                    for (let dz = -rad; dz <= rad + 1; dz++) {
                        const distSq = (dx - 0.5) * (dx - 0.5) + (dz - 0.5) * (dz - 0.5);
                        if (distSq > (rad + 0.6) * (rad + 0.6)) continue;
                        safeSet(base2x2X + dx, topY + dy, base2x2Z + dz, leafType, true);
                    }
                }
            }
        }

        if (particles) particles.emit({ x: base2x2X + 1, y: wy + 2, z: base2x2Z + 1 }, 'leaf', 20, 0x55ff55);
        if (audio && audio.playDig) audio.playDig(woodType);
        return true;
    }

    // Single 1x1 Sapling Growth
    if (saplingType === darkOakSap) {
        // Dark oak requires 2x2 to grow (authentic Minecraft mechanics)
        return false;
    }

    safeSet(wx, wy, wz, airId);

    if (saplingType === spruceSap) {
        // Standard Spruce (Pine) Tree
        const height = 7 + Math.floor(Math.random() * 4);
        for (let i = 0; i < height; i++) safeSet(wx, wy + i, wz, spruceWood);
        const topY = wy + height;
        safeSet(wx, topY + 1, wz, spruceLeaves, true);
        safeSet(wx, topY, wz, spruceLeaves, true);
        for (let ly = topY; ly >= wy + 3; ly--) {
            const dist = topY - ly;
            const rad = (dist === 0) ? 1 : ((dist % 2 === 1) ? Math.min(2, 1 + Math.floor(dist / 3)) : 1);
            for (let dx = -rad; dx <= rad; dx++) {
                for (let dz = -rad; dz <= rad; dz++) {
                    if (Math.abs(dx) === rad && Math.abs(dz) === rad && rad > 1) continue;
                    safeSet(wx + dx, ly, wz + dz, spruceLeaves, true);
                }
            }
        }
    } else if (saplingType === birchSap) {
        // Birch Tree
        const height = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < height; i++) safeSet(wx, wy + i, wz, birchWood);
        const topY = wy + height;
        for (let ly = topY - 2; ly <= topY - 1; ly++) {
            for (let dx = -2; dx <= 2; dx++) {
                for (let dz = -2; dz <= 2; dz++) {
                    if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && (ly === topY - 1 || Math.random() < 0.5)) continue;
                    safeSet(wx + dx, ly, wz + dz, birchLeaves, true);
                }
            }
        }
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (Math.abs(dx) === 1 && Math.abs(dz) === 1 && Math.random() < 0.4) continue;
                safeSet(wx + dx, topY, wz + dz, birchLeaves, true);
            }
        }
        safeSet(wx, topY + 1, wz, birchLeaves, true);
        safeSet(wx + 1, topY + 1, wz, birchLeaves, true);
        safeSet(wx - 1, topY + 1, wz, birchLeaves, true);
        safeSet(wx, topY + 1, wz + 1, birchLeaves, true);
        safeSet(wx, topY + 1, wz - 1, birchLeaves, true);
    } else if (saplingType === jungleSap) {
        // Jungle Tree
        const height = 6 + Math.floor(Math.random() * 4);
        for (let i = 0; i < height; i++) {
            safeSet(wx, wy + i, wz, oakWood);
            if (Math.random() < 0.4) safeSet(wx + 1, wy + i, wz, vinesId, true);
            if (Math.random() < 0.4) safeSet(wx - 1, wy + i, wz, vinesId, true);
        }
        const topY = wy + height;
        for (let dy = -2; dy <= 1; dy++) {
            const rad = (dy === 1) ? 1 : 2;
            for (let dx = -rad; dx <= rad; dx++) {
                for (let dz = -rad; dz <= rad; dz++) {
                    if (Math.abs(dx) === rad && Math.abs(dz) === rad && Math.random() < 0.5) continue;
                    safeSet(wx + dx, topY + dy, wz + dz, jungleLeaves, true);
                }
            }
        }
    } else if (saplingType === acaciaSap) {
        // Acacia Tree
        const baseH = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < baseH; i++) safeSet(wx, wy + i, wz, acaciaWood);
        const cardDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const d = cardDirs[Math.floor(Math.random() * 4)];
        let bx = wx, by = wy + baseH, bz = wz;
        for (let s = 0; s < 3; s++) {
            bx += d[0]; bz += d[1]; by++;
            safeSet(bx, by, bz, acaciaWood);
        }
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
                safeSet(bx + dx, by, bz + dz, acaciaLeaves, true);
            }
        }
        safeSet(bx, by + 1, bz, acaciaLeaves, true);
    } else {
        // Standard Oak Tree
        const height = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < height; i++) safeSet(wx, wy + i, wz, oakWood);
        const topY = wy + height;
        for (let ly = topY - 2; ly <= topY - 1; ly++) {
            for (let dx = -2; dx <= 2; dx++) {
                for (let dz = -2; dz <= 2; dz++) {
                    if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && (ly === topY - 1 || Math.random() < 0.5)) continue;
                    safeSet(wx + dx, ly, wz + dz, oakLeaves, true);
                }
            }
        }
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (Math.abs(dx) === 1 && Math.abs(dz) === 1 && Math.random() < 0.4) continue;
                safeSet(wx + dx, topY, wz + dz, oakLeaves, true);
            }
        }
        safeSet(wx, topY + 1, wz, oakLeaves, true);
        safeSet(wx + 1, topY + 1, wz, oakLeaves, true);
        safeSet(wx - 1, topY + 1, wz, oakLeaves, true);
        safeSet(wx, topY + 1, wz + 1, oakLeaves, true);
        safeSet(wx, topY + 1, wz - 1, oakLeaves, true);
    }

    if (particles) particles.emit({ x: wx + 0.5, y: wy + 1.5, z: wz + 0.5 }, 'leaf', 15, 0x55ff55);
    if (audio && audio.playDig) audio.playDig(oakWood);
    return true;
}


