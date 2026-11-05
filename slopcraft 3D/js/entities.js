// ============================================
// entities.js — Player, Mobs, Bosses, Inventory
// ============================================
import * as THREE from 'three';
import { CHUNK_HEIGHT, CHUNK_SIZE } from './constants.js?v=116';
import { generateRandomWand, generateRandomSpell, generateRandomModifier } from './magic.js?v=116';
import { getBlockProperties, BLOCKS, generateItemTexture, generateMobTexture, generatePlayerSkinTextures, createSteveBodyMaterials, getMobBoxMaterials, createExtrudedItemMesh } from './textures.js?v=157';

// Pre-allocated buffers for GC-free math
const _tempMin = new THREE.Vector3();
const _tempMax = new THREE.Vector3();
const _tempBox = new THREE.Box3();
const _tempRay = new THREE.Ray();
const _tempHit = new THREE.Vector3();
const _tempMoveDir = new THREE.Vector3();
const _tempVec1 = new THREE.Vector3();
const _tempVec2 = new THREE.Vector3();
const _tempVec3 = new THREE.Vector3();

// ============================================
// Inventory & Items
// ============================================
export const FOOD_DATA = {
    'bread':            { hunger: 5, saturation: 6.0, heal: 0 },
    'cooked_beef':      { hunger: 8, saturation: 12.8, heal: 0 },
    'steak':            { hunger: 8, saturation: 12.8, heal: 0 },
    'cooked_porkchop':  { hunger: 8, saturation: 12.8, heal: 0 },
    'cooked_mutton':    { hunger: 6, saturation: 9.6, heal: 0 },
    'cooked_chicken':   { hunger: 6, saturation: 7.2, heal: 0 },
    'cooked_fish':      { hunger: 5, saturation: 6.0, heal: 0 },
    'cooked_salmon':    { hunger: 6, saturation: 9.6, heal: 0 },
    'baked_potato':     { hunger: 5, saturation: 6.0, heal: 0 },
    'apple':            { hunger: 4, saturation: 2.4, heal: 0 },
    'golden_apple':     { hunger: 4, saturation: 9.6, heal: 10, absorption: true },
    'golden_carrot':    { hunger: 6, saturation: 14.4, heal: 0 },
    'carrot':           { hunger: 3, saturation: 3.6, heal: 0 },
    'cookie':           { hunger: 2, saturation: 0.4, heal: 0 },
    'pumpkin_pie':      { hunger: 8, saturation: 4.8, heal: 0 },
    'mushroom_stew':    { hunger: 6, saturation: 7.2, heal: 0 },
    'beetroot_soup':    { hunger: 6, saturation: 7.2, heal: 0 },
    'raw_beef':         { hunger: 3, saturation: 1.8, heal: 0 },
    'raw_porkchop':     { hunger: 3, saturation: 1.8, heal: 0 },
    'raw_mutton':       { hunger: 2, saturation: 1.2, heal: 0 },
    'raw_chicken':      { hunger: 2, saturation: 1.2, heal: 0, hungerPoison: 0.3 },
    'raw_fish':         { hunger: 2, saturation: 0.4, heal: 0 },
    'melon_slice':      { hunger: 2, saturation: 1.2, heal: 0 },
    'sweet_berries':    { hunger: 2, saturation: 1.2, heal: 0 },
    'potato':           { hunger: 1, saturation: 0.6, heal: 0 },
    'beetroot':         { hunger: 1, saturation: 1.2, heal: 0 },
    'rotten_flesh':     { hunger: 4, saturation: 0.8, hungerEffect: true },
    'spider_eye':       { hunger: 2, saturation: 3.2, poison: true },
    'honey_bottle':     { hunger: 6, saturation: 1.2, curePoison: true },
    'poisonous_potato': { hunger: 2, saturation: 1.2, poison: true },
    'chorus_fruit':     { hunger: 4, saturation: 2.4, teleport: true }
};

let itemIdCounter = 0;
export class Item {
    constructor(type, subtype, data = {}, name, desc) {
        this.type = type; // 'block' | 'wand' | 'spell' | 'modifier'
        this.subtype = subtype;
        this.data = data;
        this.name = name || 'Item';
        this.description = desc || '';
        this.stackable = type === 'block' || type === 'material' || type === 'food' || type === 'spawn_egg';
        this.maxStack = this.stackable ? 64 : 1;
        this.id = `item_${itemIdCounter++}`;
    }

    static blockItem(blockType, name) { return new Item('block', blockType, {}, name); }
    static wandItem(wand) { return new Item('wand', 'wand', { wand }, wand.name); }
    static spellItem(spell) { return new Item('spell', spell.type, { spell }, spell.name); }
    static modifierItem(mod) { return new Item('modifier', mod.type, { mod }, mod.name, mod.rarity); }
    static equipmentItem(subType, equipData, name, desc) { return new Item('equipment', subType, { equipData }, name, desc); }
    static materialItem(subType, name, desc) { return new Item('material', subType, {}, name, desc); }
    static foodItem(subType, healAmount, name, desc) { return new Item('food', subType, { heal: healAmount }, name, desc); }
    static spawnEggItem(subType, mobType, name, desc) { return new Item('spawn_egg', subType, { mobType }, name || `${mobType} Spawn Egg`, desc || 'Right-click to spawn mob'); }
}

export class Inventory {
    constructor() {
        this.slots = new Array(36).fill(null); // 0-8 is hotbar, 9-35 is main grid
        this.armor = new Array(4).fill(null); // Head, Chest, Legs, Boots
        this.offhand = null;
    }
    
    addItem(item, count = 1) {
        return this.addItemCount(item, count) === count;
    }

    addItemCount(item, count = 1) {
        let remaining = count;
        const maxSt = item.maxStack || 64;
        if (item.stackable) {
            for (let i = 0; i < this.slots.length; i++) {
                if (this.slots[i] && this.slots[i].item.type === item.type && this.slots[i].item.subtype === item.subtype) {
                    if (this.slots[i].count < maxSt) {
                        const add = Math.min(remaining, maxSt - this.slots[i].count);
                        this.slots[i].count += add;
                        remaining -= add;
                        if (remaining <= 0) return count;
                    }
                }
            }
        }
        // Find empty slot
        for (let i = 0; i < this.slots.length; i++) {
            if (!this.slots[i]) {
                const take = item.stackable ? Math.min(remaining, maxSt) : 1;
                this.slots[i] = { item: Object.assign({}, item), count: take };
                remaining -= take;
                if (remaining <= 0) return count;
            }
        }
        return count - remaining;
    }
}

// ============================================
// Player
// ============================================
export class Player {
    constructor() {
        this.position = new THREE.Vector3(0, 100, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = { yaw: 0, pitch: 0 };
        
        this.health = 100;
        this.maxHealth = 100;
        this.mana = 100;
        this.maxMana = 100;
        this.manaRegenRate = 15;

        this.inventory = new Inventory();
        this.selectedSlot = 0; // Index 0-8 in inventory
        this.equippedWand = null;

        this.grounded = false;
        this.sprinting = false;
        
        this.width = 0.6;
        this.height = 1.8;
        this.eyeHeight = 1.62;
        this.speedMult = 1.0;
        this.jumpSpeed = 9.0;

        // Give starting items
        const starterWand = generateRandomWand();
        starterWand.name = "Archmage Wand";
        starterWand.maxSlots = 8;
        starterWand.spellSlots = new Array(8).fill(null);
        starterWand.cooldowns = new Array(8).fill(0);
        
        // Load it up with some cool spells and modifiers
        const spell1 = generateRandomSpell();
        spell1.addModifier(generateRandomModifier());
        starterWand.equipSpell(0, spell1);
        
        const spell2 = generateRandomSpell();
        spell2.addModifier(generateRandomModifier());
        spell2.addModifier(generateRandomModifier());
        starterWand.equipSpell(1, spell2);
        
        starterWand.equipSpell(2, generateRandomSpell());

        this.inventory.addItem(Item.wandItem(starterWand));
        this.inventory.addItem(Item.blockItem(BLOCKS.TORCH, 'Torch'), 64);
        this.equippedWand = starterWand;
        this.burnTimer = 0;
        this.burnTickTimer = 0;
        this.naturalRegenTimer = 0;
        this.fastRegenTimer = 0;
        this.starveTimer = 0;
        this.hunger = 20;
        this.maxHunger = 20;
        this.saturation = 5.0;
        this.exhaustion = 0.0;
        this.isCreative = false;
        this.fallStartY = this.position.y;
        this.fallDistance = 0;
        this.spawnGraceTimer = 5.0; // 5 seconds of spawn invulnerability & no fall damage
        this.spawnPoint = null;
        this.stepHeight = 0.55; // Auto walk over any height difference of half a block or less (slabs, stairs, farmland)
    }

    eatFood(subtype, itemData = {}) {
        const fData = FOOD_DATA[subtype] || { hunger: itemData.heal ? Math.round(itemData.heal / 2.5) : 3, saturation: 2.0 };
        if (!this.isCreative && this.hunger >= 20 && !fData.absorption && subtype !== 'golden_apple' && subtype !== 'chorus_fruit') {
            return false;
        }
        this.hunger = Math.min(20, this.hunger + (fData.hunger || 0));
        this.saturation = Math.min(this.hunger, this.saturation + (fData.saturation || 0));
        if (subtype === 'golden_apple') {
            this.health = Math.min(this.maxHealth + 20, this.health + 20);
        } else if (fData.heal) {
            this.health = Math.min(this.maxHealth, this.health + fData.heal);
        }
        if (fData.hungerEffect && Math.random() < 0.8) {
            this.hungerEffectTimer = 30.0;
        }
        if (fData.curePoison) {
            this.poisonTimer = 0;
        }
        if (fData.hungerPoison && Math.random() < fData.hungerPoison) {
            this.hungerEffectTimer = 30.0;
        }
        if (fData.poison && Math.random() < 0.6) {
            this.poisonTimer = 4.0;
        }
        return true;
    }

    update(dt, keys, mouse, world, sensitivity = 0.002) {
        this.isCreative = !!(keys && keys._creativeMode);
        if (this.isCreative) {
            this.burnTimer = 0;
            this.burnTickTimer = 0;
            this.health = this.maxHealth;
        }

        // Mouse Look
        this.rotation.yaw -= mouse.dx * sensitivity;
        this.rotation.pitch -= mouse.dy * sensitivity;
        this.rotation.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, this.rotation.pitch));

        // Spectator Mode: Noclip free flight, invulnerable, no collision
        if (this.isSpectator) {
            this.burnTimer = 0;
            this.burnTickTimer = 0;
            this.health = this.maxHealth;
            this.hunger = 20;
            this.saturation = 20;
            this.exhaustion = 0;

            const forward = _tempVec1.set(-Math.sin(this.rotation.yaw), 0, -Math.cos(this.rotation.yaw)).normalize();
            const right = _tempVec2.set(Math.cos(this.rotation.yaw), 0, -Math.sin(this.rotation.yaw)).normalize();
            const specSpeed = keys.sprint ? 24.0 : 12.0;
            let moveDir = _tempMoveDir.set(0, 0, 0);
            if (keys.forward) moveDir.add(forward);
            if (keys.backward) moveDir.sub(forward);
            if (keys.right) moveDir.add(right);
            if (keys.left) moveDir.sub(right);
            if (moveDir.lengthSq() > 0) moveDir.normalize();

            this.velocity.x = moveDir.x * specSpeed;
            this.velocity.z = moveDir.z * specSpeed;
            if (keys.jump) {
                this.velocity.y = specSpeed;
            } else if (keys.crouch) {
                this.velocity.y = -specSpeed;
            } else {
                this.velocity.y = 0;
            }

            this.position.addScaledVector(this.velocity, dt);
            this.grounded = false;
            this.fallDistance = 0;
            return;
        }

        // Direction vectors
        const forward = _tempVec1.set(-Math.sin(this.rotation.yaw), 0, -Math.cos(this.rotation.yaw)).normalize();
        const right = _tempVec2.set(Math.cos(this.rotation.yaw), 0, -Math.sin(this.rotation.yaw)).normalize();
        // Equipment Effects
        let speedMult = 1.0;
        let flying = false;
        
        // Boots & Equipment checks
        const boots = this.inventory && this.inventory.armor ? this.inventory.armor[3] : null;
        if (boots && boots.item && boots.item.data && boots.item.data.equipData) {
            if (boots.item.data.equipData.speedMult) speedMult = boots.item.data.equipData.speedMult;
            if (boots.item.data.equipData.flying) flying = true;
        }
        if (keys && keys._creativeFlying) {
            flying = true;
        }

        const heldSlot = (this.inventory && this.inventory.slots) ? this.inventory.slots[this.selectedSlot] : null;
        const heldItem = (heldSlot && heldSlot.item) ? heldSlot.item : null;
        const bootsItem = (boots && boots.item) ? boots.item : null;

        const hasSlimeBoots = (bootsItem && (bootsItem.subtype === 'slime_boots' || bootsItem.subtype === 'boots_slime')) ||
                              (heldItem && (heldItem.subtype === 'slime_boots' || heldItem.subtype === 'boots_slime'));

        const hasItemAnywhere = (sub) => {
            if (!this.inventory) return false;
            if (heldItem && (heldItem.subtype === sub || heldItem.type === sub)) return true;
            if (this.inventory.slots) {
                for (let i = 0; i < this.inventory.slots.length; i++) {
                    const s = this.inventory.slots[i];
                    if (s && s.item && (s.item.subtype === sub || s.item.type === sub)) return true;
                }
            }
            return false;
        };

        const hasGoldenFeather = hasItemAnywhere('golden_feather');
        const hasParachute = hasItemAnywhere('cloud_parachute') || hasItemAnywhere('cold_parachute');

        // Creative mode movement speed boost
        if (this.isCreative) {
            if (flying) {
                speedMult *= (keys.sprint ? 5.5 : 4.0); // Super fast cruising speed when flying
            } else {
                speedMult *= 1.6; // Ground running boost
            }
        }

        // Apply speed bonus
        speedMult *= this.speedMult;

        // Crouch logic
        const NORMAL_HEIGHT = 1.8;
        const NORMAL_EYE = 1.62;
        const CROUCH_HEIGHT = 0.9;
        const CROUCH_EYE = 0.72;

        let shouldCrouch = keys.crouch;

        if (!shouldCrouch && this.height < NORMAL_HEIGHT) {
            // Check if we have headroom to stand up
            // Check for solid blocks in the space between our current head and the normal head
            const minX = Math.floor(this.position.x - this.width/2 + 0.01);
            const maxX = Math.floor(this.position.x + this.width/2 - 0.01);
            const minZ = Math.floor(this.position.z - this.width/2 + 0.01);
            const maxZ = Math.floor(this.position.z + this.width/2 - 0.01);
            const minY = Math.floor(this.position.y + this.height);
            const maxY = Math.floor(this.position.y + NORMAL_HEIGHT - 0.01);
            
            let headroomBlocked = false;
            for(let y=minY; y<=maxY; y++) {
                for(let x=minX; x<=maxX; x++) {
                    for(let z=minZ; z<=maxZ; z++) {
                        const block = world.getBlock(x,y,z);
                        const props = getBlockProperties(block);
                        if (props && props.solid) headroomBlocked = true;
                    }
                }
            }

            if (headroomBlocked) shouldCrouch = true; // Forced to stay crouched
        }

        if (shouldCrouch) {
            this.height = CROUCH_HEIGHT;
            this.eyeHeight = CROUCH_EYE;
            speedMult *= 0.5;
        } else {
            this.height = NORMAL_HEIGHT;
            this.eyeHeight = NORMAL_EYE;
        }

        // Movement input
        const canSprint = this.isCreative || (this.hunger > 6);
        const isSprinting = keys.sprint && canSprint && !shouldCrouch;
        const speed = (isSprinting ? 9.5 : 6.0) * speedMult;
        let moveDir = _tempMoveDir.set(0,0,0);
        
        if (keys.forward) moveDir.add(forward);
        if (keys.backward) moveDir.sub(forward);
        if (keys.right) moveDir.add(right);
        if (keys.left) moveDir.sub(right);
        
        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            if (!this.isCreative && this.grounded) {
                this.exhaustion += (isSprinting ? 0.1 : 0.01) * dt;
            }
        }

        const blockIn = world.getBlock(this.position.x, this.position.y + 0.1, this.position.z);
        const blockProps = getBlockProperties(blockIn);
        const inWater = blockProps && (blockProps.isLiquid || blockProps.isWaterlogged) && blockIn !== BLOCKS.LAVA;
        this.inWater = inWater;
        const inLava = blockIn === BLOCKS.LAVA;
        const inFire = blockIn === BLOCKS.FIRE;
        const isClimbable = (b) => (b === BLOCKS.LADDER || (BLOCKS.VINES && b === BLOCKS.VINES) || (BLOCKS.TWISTING_VINES && b === BLOCKS.TWISTING_VINES) || (BLOCKS.CAVE_VINES && b === BLOCKS.CAVE_VINES));
        const blockInMid = world.getBlock(this.position.x, this.position.y + 0.8, this.position.z);
        const onLadder = isClimbable(blockIn) || isClimbable(blockInMid);

        if (inWater) {
            this.burnTimer = 0;
        }

        if (!this.isCreative && (inLava || inFire)) {
            this.burnTimer = 5.0; // Stay burning as long as you're in it
            if (Math.random() < dt * 4) {
                this.takeDamage(inLava ? 5 : 2); // Initial intense damage
                const d = document.getElementById('damage-flash');
                if(d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
            }
        }

        if (!this.isCreative && this.burnTimer > 0) {
            this.burnTimer -= dt;
            this.burnTickTimer -= dt;
            if (this.burnTickTimer <= 0) {
                this.takeDamage(1); // take 1 damage per second
                const d = document.getElementById('damage-flash');
                if(d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
                this.burnTickTimer = 1.0;
            }
        }

        // Physics variables
        // Make the player much more floaty in water (lower gravity)
        let gravity = (inWater || inLava) ? -1.5 : -25;
        let drag = (inWater || inLava) ? 6 : 10;
        let jumpForce = (inWater || inLava) ? 3.5 : 9;
        
        if (flying) {
            gravity = 0; // Zero gravity when flying
            drag = 12;   // Stop floating drift
        } else if (onLadder) {
            gravity = 0; // Cancel gravity on ladder
            drag = 15; // Higher drag so you stop quickly
        }

        const blockUnderFeet = world ? world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y - 0.2), Math.floor(this.position.z)) : 0;
        if (blockUnderFeet === BLOCKS.QUICKSOIL || (window.BLOCKS && blockUnderFeet === window.BLOCKS.QUICKSOIL)) {
            drag = 2.5; // Slippery fast Aether quicksoil
            speed *= 1.6;
        }

        // X/Z velocity update
        this.velocity.x += moveDir.x * speed * 10 * dt;
        this.velocity.z += moveDir.z * speed * 10 * dt;

        // Drag (friction) — exponential decay for 100% numerical stability against lag spikes
        const friction = Math.exp(-drag * dt);
        this.velocity.x *= friction;
        this.velocity.z *= friction;
        if (inWater || inLava) {
            this.velocity.y *= Math.exp(-4.5 * dt);
        }

        // Y velocity update (gravity & slow fall effects)
        if (hasGoldenFeather) {
            gravity *= 0.65; // Soft Aether low gravity
        }
        this.velocity.y += gravity * dt;

        // Golden feather passive slow falling
        if (hasGoldenFeather && !this.grounded && !inWater && !inLava && !flying) {
            if (this.velocity.y < -3.2) {
                this.velocity.y = -3.2;
                this.fallDistance = 0;
            }
            if (Math.random() < 0.22 && window.game && window.game.particles) {
                window.game.particles.emit(this.position, 'magic', 2, 0xffd700);
            }
        }

        // Cloud parachute active gliding
        if (hasParachute && !this.grounded && !inWater && !inLava && !flying) {
            const isHoldingParachute = (heldItem && (heldItem.subtype === 'cloud_parachute' || heldItem.subtype === 'cold_parachute'));
            if (keys.jump || isHoldingParachute) {
                if (this.velocity.y < -1.8) {
                    this.velocity.y = Math.max(this.velocity.y, -1.8);
                    this.fallDistance = 0;
                    // Forward glide boost in viewing direction
                    const lookX = -Math.sin(this.rotation.yaw);
                    const lookZ = -Math.cos(this.rotation.yaw);
                    this.velocity.x += lookX * 4.5 * dt;
                    this.velocity.z += lookZ * 4.5 * dt;
                    if (Math.random() < 0.35 && window.game && window.game.particles) {
                        window.game.particles.emit(this.position, 'cloud', 2, 0xffffff);
                    }
                }
            }
        }

        // Jumping and Climbing
        if (onLadder) {
            if (keys.jump) {
                this.velocity.y = 3.5;
            } else if (keys.crouch) {
                this.velocity.y = 0; // In Minecraft, crouching on a ladder or vine locks the player in place
            } else {
                this.velocity.y *= friction; // Stop vertical movement if not climbing
            }
        } else if (flying) {
            if (keys.jump) {
                this.velocity.y = 12;
            } else if (keys.crouch) {
                this.velocity.y = -12;
            } else {
                this.velocity.y *= friction;
            }
        } else if (keys.jump) {
            if (this.grounded) {
                // If wearing or holding slime boots, jump 50% higher with bouncy force!
                this.velocity.y = hasSlimeBoots ? 11.2 : this.jumpSpeed;
                this.grounded = false;
                if (hasSlimeBoots && window.game && window.game.particles) {
                    window.game.particles.emit(this.position, 'magic', 6, 0x76d435);
                }
                if (!this.isCreative) {
                    this.exhaustion += (isSprinting ? 0.2 : 0.05);
                }
            } else if (inWater || inLava) {
                // Minecraft-style liquid swimming: apply upward acceleration instead of instant snap
                this.velocity.y += 18 * dt;
                // Cap upward velocity so we don't shoot out of the water like a rocket
                if (this.velocity.y > 4.5) this.velocity.y = 4.5;
                // Water jump vault: boost upward to climb out onto land when jumping near a shoreline block
                const frontX = this.position.x + moveDir.x * 0.45;
                const frontZ = this.position.z + moveDir.z * 0.45;
                const blockAhead = world.getBlock(Math.floor(frontX), Math.floor(this.position.y + 0.5), Math.floor(frontZ));
                const blockAheadProps = getBlockProperties(blockAhead);
                if (blockAheadProps && blockAheadProps.solid) {
                    this.velocity.y = Math.max(this.velocity.y, 6.0);
                }
            }
        }

        // Spawn grace timer: zero out fall distance and provide spawn immunity
        if (this.spawnGraceTimer > 0) {
            this.spawnGraceTimer -= dt;
            this.fallStartY = this.position.y;
            this.fallDistance = 0;
        }

        // Track falling height
        if (flying || this.isCreative || inWater || inLava || onLadder || this.spawnGraceTimer > 0) {
            this.fallStartY = this.position.y;
            this.fallDistance = 0;
        } else if (!this.grounded) {
            if (this.velocity.y > 0) {
                this.fallStartY = this.position.y;
                this.fallDistance = 0;
            } else if (this.velocity.y < 0) {
                this.fallDistance = Math.max(this.fallDistance, this.fallStartY - this.position.y);
            }
        }

        // Collision
        const wasGrounded = this.grounded;
        const velStep = this.velocity.clone().multiplyScalar(dt);
        const colResult = world.collide(this.position, velStep, this.width, this.height, keys.crouch && this.grounded, (this.stepHeight !== undefined ? this.stepHeight : 0.55));
        
        // Update state based on collision
        this.position.copy(colResult.position);
        if (colResult.velocity.y === 0 && this.velocity.y < 0) this.grounded = true;
        else this.grounded = false;

        if (colResult.velocity.x === 0) this.velocity.x = 0;
        if (colResult.velocity.z === 0) this.velocity.z = 0;
        if (colResult.velocity.y === 0) this.velocity.y = 0;

        if (!wasGrounded && this.grounded) {
            // Slime Boots landing: bounce back up into air with springy physics & zero fall damage!
            if (hasSlimeBoots) {
                const distFell = this.fallDistance;
                this.fallDistance = 0;
                if (distFell > 0.8) {
                    const bounceForce = Math.min(22, Math.max(9.0, Math.sqrt(distFell * 28) * 0.82));
                    this.velocity.y = bounceForce;
                    this.grounded = false;
                    this.fallStartY = this.position.y;
                    if (window.game && window.game.particles) {
                        window.game.particles.emit(this.position, 'magic', 16, 0x76d435);
                    }
                    if (window.game && window.game.audio && window.game.audio.playSquish) {
                        window.game.audio.playSquish(this.position);
                    }
                    return;
                }
            }

            // Golden Feather & Cloud Parachute 100% fall damage immunity
            if (hasGoldenFeather || hasParachute) {
                this.fallDistance = 0;
            }

            // Check block under feet for Aercloud bounce or cushioning
            const blockUnder = world ? world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y - 0.2), Math.floor(this.position.z)) : 0;
            const isBlueCloud = (blockUnder === BLOCKS.BLUE_AERCLOUD || (window.BLOCKS && blockUnder === window.BLOCKS.BLUE_AERCLOUD));
            const isAnyCloud = isBlueCloud || blockUnder === BLOCKS.AETHER_CLOUD || (window.BLOCKS && (blockUnder === window.BLOCKS.GOLDEN_AERCLOUD || blockUnder === window.BLOCKS.AETHER_CLOUD));

            if (isBlueCloud) {
                this.velocity.y = 18; // Super high cloud bounce!
                this.grounded = false;
                this.fallDistance = 0;
                if (window.game && window.game.particles) window.game.particles.emit(this.position, 'cloud', 15, 0x55aaff);
            } else if (isAnyCloud) {
                this.velocity.y = 9; // Gentle cloud bounce
                this.grounded = false;
                this.fallDistance = 0;
                if (window.game && window.game.particles) window.game.particles.emit(this.position, 'cloud', 10, 0xffffff);
            } else {
                // Farmland trampling on landing from a fall
                const fx = Math.floor(this.position.x);
                const fy = Math.floor(this.position.y - 0.2);
                const fz = Math.floor(this.position.z);
                if ((blockUnder === BLOCKS.FARMLAND || blockUnder === BLOCKS.FARMLAND_MOIST) && this.fallDistance > 0.5) {
                    if (world) {
                        world.setBlock(fx, fy, fz, BLOCKS.DIRT);
                        if (world.checkSupport) world.checkSupport(fx, fy + 1, fz);
                        if (window.game && window.game.audio && window.game.audio.playBreak) {
                            window.game.audio.playBreak(BLOCKS.DIRT);
                        }
                    }
                }
            }
            if (!this.isCreative && !flying && !inWater && !inLava && !onLadder && !hasSlimeBoots && !hasGoldenFeather && !hasParachute) {
                const dist = this.fallDistance;
                if (dist > 15) {
                    // Fall damage: only when falling from > 15 blocks. Kill height is 70 blocks.
                    // 15 blocks = 0 dmg, 70 blocks = 100 dmg (lethal, kill height)
                    const dmg = ((dist - 15) / (70 - 15)) * this.maxHealth;
                    this.takeDamage(dmg);
                    const d = document.getElementById('damage-flash');
                    if (d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
                    if (window.game && window.game.audio && window.game.audio.playHit) {
                        window.game.audio.playHit(this.position);
                    }
                }
            }
            this.fallStartY = this.position.y;
            this.fallDistance = 0;
        }

        // Anti-stuck / spawn safety: if player is embedded inside solid blocks, nudge upward to open air
        if (world && !flying) {
            const hw = this.width / 2;
            const minX = Math.floor(this.position.x - hw + 0.05);
            const maxX = Math.floor(this.position.x + hw - 0.05);
            const minZ = Math.floor(this.position.z - hw + 0.05);
            const maxZ = Math.floor(this.position.z + hw - 0.05);
            const minY = Math.floor(this.position.y);
            const maxY = Math.floor(this.position.y + this.height - 0.05);

            let isStuck = false;
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        const b = world.getBlock(x, y, z);
                        if (getBlockProperties(b).solid) {
                            if (!(b === window.BLOCKS.DUNGEON_DOOR && world.isDoorOpen && world.isDoorOpen(x, y, z))) {
                                isStuck = true;
                                break;
                            }
                        }
                    }
                    if (isStuck) break;
                }
                if (isStuck) break;
            }

            if (isStuck) {
                // Find next clear vertical space above player
                for (let step = 1; step <= 30; step++) {
                    const testY = Math.floor(this.position.y) + step;
                    let clear = true;
                    for (let y = testY; y <= testY + 1; y++) {
                        for (let x = minX; x <= maxX; x++) {
                            for (let z = minZ; z <= maxZ; z++) {
                                const b = world.getBlock(x, y, z);
                                if (getBlockProperties(b).solid) {
                                    clear = false;
                                    break;
                                }
                            }
                            if (!clear) break;
                        }
                        if (!clear) break;
                    }
                    if (clear) {
                        this.position.y = testY + 0.02;
                        this.velocity.y = 0;
                        break;
                    }
                }
            }
        }

        // Fall clamp
        if (this.velocity.y < -50) this.velocity.y = -50;

        // Void damage (except in Aether where falling drops into the Overworld sky)
        if (!this.isCreative && this.position.y < -10 && (!world || world.dimension !== 'aether')) {
            this.spawnGraceTimer = 0;
            this.health = 0;
        }

        // Hunger, exhaustion, natural health regeneration and starvation
        if (!this.isCreative) {
            // Hunger effect debuff (from rotten flesh / raw chicken)
            if (this.hungerEffectTimer > 0) {
                this.hungerEffectTimer = Math.max(0, this.hungerEffectTimer - dt);
                this.exhaustion += 0.03 * dt;
            }
            // Poison effect (stops at 1 heart, 10 HP)
            if (this.poisonTimer > 0) {
                this.poisonTimer = Math.max(0, this.poisonTimer - dt);
                this.poisonTickTimer = (this.poisonTickTimer || 0) + dt;
                if (this.poisonTickTimer >= 1.25) {
                    this.poisonTickTimer = 0;
                    if (this.health > 10) {
                        this.takeDamage(10);
                        const d = document.getElementById('damage-flash');
                        if (d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
                    }
                }
            }

            // Drain exhaustion into saturation / hunger
            while (this.exhaustion >= 4.0) {
                this.exhaustion -= 4.0;
                if (this.saturation > 0) {
                    this.saturation = Math.max(0, this.saturation - 1.0);
                } else {
                    this.hunger = Math.max(0, this.hunger - 1);
                }
            }

            // Health regeneration
            if (this.health > 0 && this.health < this.maxHealth) {
                if (this.hunger >= 20 && this.saturation > 0) {
                    // Fast natural regen when full hunger & saturation
                    this.fastRegenTimer = (this.fastRegenTimer || 0) + dt;
                    if (this.fastRegenTimer >= 1.0) {
                        this.fastRegenTimer = 0;
                        this.health = Math.min(this.maxHealth, this.health + 10);
                        this.exhaustion += 6.0;
                    }
                } else if (this.hunger >= 18) {
                    // Standard natural regen (hunger >= 18)
                    this.naturalRegenTimer = (this.naturalRegenTimer || 0) + dt;
                    if (this.naturalRegenTimer >= 4.0) {
                        this.naturalRegenTimer = 0;
                        this.health = Math.min(this.maxHealth, this.health + 5);
                        this.exhaustion += 6.0;
                    }
                } else {
                    this.naturalRegenTimer = 0;
                    this.fastRegenTimer = 0;
                }
            } else {
                this.naturalRegenTimer = 0;
                this.fastRegenTimer = 0;
            }

            // Starvation damage
            if (this.hunger === 0) {
                this.starveTimer = (this.starveTimer || 0) + dt;
                if (this.starveTimer >= 4.0) {
                    this.starveTimer = 0;
                    if (this.isHardcore || this.health > 10) { // In Hardcore, starves all the way to death! In Normal, stops at 1 heart (10 HP)
                        this.takeDamage(10);
                        const d = document.getElementById('damage-flash');
                        if (d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
                        if (window.game && window.game.audio && window.game.audio.playHit) {
                            window.game.audio.playHit(this.position);
                        }
                    }
                }
            } else {
                this.starveTimer = 0;
            }
        } else {
            this.hunger = 20;
            this.saturation = 20;
            this.exhaustion = 0;
            this.health = this.maxHealth;
            this.naturalRegenTimer = 0;
            this.fastRegenTimer = 0;
            this.starveTimer = 0;
        }

        // Mana regen
        if (this.mana < this.maxMana) {
            this.mana += this.manaRegenRate * dt;
            if (this.mana > this.maxMana) this.mana = this.maxMana;
        }

        // Update wand cooldowns
        for (let i = 0; i < this.inventory.slots.length; i++) {
            const slot = this.inventory.slots[i];
            if (slot && slot.item && slot.item.type === 'wand' && slot.item.data && slot.item.data.wand) {
                if (typeof slot.item.data.wand.updateCooldowns === 'function') {
                    slot.item.data.wand.updateCooldowns(dt);
                }
            }
        }
    }

    createPlayerMesh(assignToPlayer = true) {
        const group = new THREE.Group();
        group.name = 'playerCharacterModel';

        const headMats = createSteveBodyMaterials('head');
        const torsoMats = createSteveBodyMaterials('torso');
        const leftArmMats = createSteveBodyMaterials('leftArm');
        const rightArmMats = createSteveBodyMaterials('rightArm');
        const leftLegMats = createSteveBodyMaterials('leftLeg');
        const rightLegMats = createSteveBodyMaterials('rightLeg');

        // Head Group (pivot at neck y=1.45)
        const headPivot = new THREE.Group();
        headPivot.name = 'head';
        headPivot.position.set(0, 1.45, 0);

        // Head mesh (0.4 x 0.4 x 0.4)
        // In Three.js BoxGeometry face mapping:
        // [4]: +Z (Back of head / hair, facing backward)
        // [5]: -Z (Front face of Steve, facing forward!)
        const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const headMesh = new THREE.Mesh(headGeo, headMats);
        headMesh.position.set(0, 0.2, 0);
        headMesh.rotation.y = 0; // Face faces forward (-Z), NOT on back of head!
        headMesh.castShadow = true;
        headPivot.add(headMesh);

        // Armor: Helmet (open-faced cap with sides, forehead brow, and nose bridge so face remains visible)
        const helmetGroup = new THREE.Group();
        helmetGroup.name = 'armor_helmet';
        const helmetMat = new THREE.MeshLambertMaterial({ color: 0xdcdcdc, emissive: 0x333333 });
        // Helmet top
        const hTop = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.46), helmetMat);
        hTop.position.set(0, 0.39, 0);
        helmetGroup.add(hTop);
        // Helmet back
        const hBack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.36, 0.08), helmetMat);
        hBack.position.set(0, 0.22, 0.19);
        helmetGroup.add(hBack);
        // Helmet left side
        const hLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.44), helmetMat);
        hLeft.position.set(-0.19, 0.22, 0.01);
        helmetGroup.add(hLeft);
        // Helmet right side
        const hRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.44), helmetMat);
        hRight.position.set(0.19, 0.22, 0.01);
        helmetGroup.add(hRight);
        // Helmet forehead visor / brow band
        const hBrow = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.10, 0.08), helmetMat);
        hBrow.position.set(0, 0.33, -0.19);
        helmetGroup.add(hBrow);
        // Helmet nose bridge ridge
        const hNose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.08), helmetMat);
        hNose.position.set(0, 0.21, -0.19);
        helmetGroup.add(hNose);
        helmetGroup.visible = false;
        headPivot.add(helmetGroup);

        group.add(headPivot);

        // Torso (0.45 x 0.65 x 0.25, centered at y=1.05)
        const torsoGeo = new THREE.BoxGeometry(0.45, 0.65, 0.25);
        const torso = new THREE.Mesh(torsoGeo, torsoMats);
        torso.name = 'torso';
        torso.position.set(0, 1.05, 0);
        torso.castShadow = true;

        // Armor: Chestplate Torso
        const chestGeo = new THREE.BoxGeometry(0.52, 0.68, 0.32);
        const chestMat = new THREE.MeshLambertMaterial({ color: 0xdcdcdc, emissive: 0x333333 });
        const chestMesh = new THREE.Mesh(chestGeo, chestMat);
        chestMesh.name = 'armor_chest';
        chestMesh.visible = false;
        torso.add(chestMesh);

        // Armor: Leggings Belt / Hip Guard (sits around lower waist)
        const leggingsMat = new THREE.MeshLambertMaterial({ color: 0xdcdcdc, emissive: 0x333333 });
        const beltArmorGeo = new THREE.BoxGeometry(0.49, 0.22, 0.29);
        const beltArmor = new THREE.Mesh(beltArmorGeo, leggingsMat);
        beltArmor.name = 'armor_legs_belt';
        beltArmor.position.set(0, -0.24, 0);
        beltArmor.visible = false;
        torso.add(beltArmor);

        group.add(torso);

        // Left Arm (pivot at shoulder y=1.35, x=-0.32)
        const leftArmPivot = new THREE.Group();
        leftArmPivot.name = 'leftArm';
        leftArmPivot.position.set(-0.32, 1.35, 0);

        const armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.18);
        const leftArmMesh = new THREE.Mesh(armGeo, leftArmMats);
        leftArmMesh.position.set(0, -0.28, 0);
        leftArmMesh.castShadow = true;
        leftArmPivot.add(leftArmMesh);

        // Armor: Left Arm Pauldron / Sleeve (part of Chestplate)
        const armArmorGeo = new THREE.BoxGeometry(0.24, 0.36, 0.24);
        const leftArmArmor = new THREE.Mesh(armArmorGeo, chestMat);
        leftArmArmor.name = 'armor_chest_l_arm';
        leftArmArmor.position.set(0, -0.14, 0);
        leftArmArmor.visible = false;
        leftArmPivot.add(leftArmArmor);

        group.add(leftArmPivot);

        // Right Arm (pivot at shoulder y=1.35, x=0.32)
        const rightArmPivot = new THREE.Group();
        rightArmPivot.name = 'rightArm';
        rightArmPivot.position.set(0.32, 1.35, 0);

        const rightArmMesh = new THREE.Mesh(armGeo, rightArmMats);
        rightArmMesh.position.set(0, -0.28, 0);
        rightArmMesh.castShadow = true;
        rightArmPivot.add(rightArmMesh);

        // Armor: Right Arm Pauldron / Sleeve (part of Chestplate)
        const rightArmArmor = new THREE.Mesh(armArmorGeo, chestMat);
        rightArmArmor.name = 'armor_chest_r_arm';
        rightArmArmor.position.set(0, -0.14, 0);
        rightArmArmor.visible = false;
        rightArmPivot.add(rightArmArmor);

        group.add(rightArmPivot);

        // Left Leg (pivot at hip y=0.72, x=-0.12)
        const leftLegPivot = new THREE.Group();
        leftLegPivot.name = 'leftLeg';
        leftLegPivot.position.set(-0.12, 0.72, 0);

        const legGeo = new THREE.BoxGeometry(0.2, 0.72, 0.2);
        const leftLegMesh = new THREE.Mesh(legGeo, leftLegMats);
        leftLegMesh.position.set(0, -0.36, 0);
        leftLegMesh.castShadow = true;
        leftLegPivot.add(leftLegMesh);

        // Armor: Left Leggings piece
        const legArmorGeo = new THREE.BoxGeometry(0.25, 0.48, 0.25);
        const leftLegArmor = new THREE.Mesh(legArmorGeo, leggingsMat);
        leftLegArmor.name = 'armor_legs_l';
        leftLegArmor.position.set(0, -0.22, 0);
        leftLegArmor.visible = false;
        leftLegPivot.add(leftLegArmor);

        // Armor: Left Boot
        const bootsMat = new THREE.MeshLambertMaterial({ color: 0xdcdcdc, emissive: 0x333333 });
        const bootGeo = new THREE.BoxGeometry(0.26, 0.26, 0.28);
        const leftBoot = new THREE.Mesh(bootGeo, bootsMat);
        leftBoot.name = 'armor_boots_l';
        leftBoot.position.set(0, -0.59, -0.01);
        leftBoot.visible = false;
        leftLegPivot.add(leftBoot);

        group.add(leftLegPivot);

        // Right Leg (pivot at hip y=0.72, x=0.12)
        const rightLegPivot = new THREE.Group();
        rightLegPivot.name = 'rightLeg';
        rightLegPivot.position.set(0.12, 0.72, 0);

        const rightLegMesh = new THREE.Mesh(legGeo, rightLegMats);
        rightLegMesh.position.set(0, -0.36, 0);
        rightLegMesh.castShadow = true;
        rightLegPivot.add(rightLegMesh);

        // Armor: Right Leggings piece
        const rightLegArmor = new THREE.Mesh(legArmorGeo, leggingsMat);
        rightLegArmor.name = 'armor_legs_r';
        rightLegArmor.position.set(0, -0.22, 0);
        rightLegArmor.visible = false;
        rightLegPivot.add(rightLegArmor);

        // Armor: Right Boot
        const rightBoot = new THREE.Mesh(bootGeo, bootsMat);
        rightBoot.name = 'armor_boots_r';
        rightBoot.position.set(0, -0.59, -0.01);
        rightBoot.visible = false;
        rightLegPivot.add(rightBoot);

        group.add(rightLegPivot);

        if (assignToPlayer) {
            this.mesh = group;
        }
        return group;
    }

    updatePlayerModel(dt, keys) {
        if (!this.mesh) return;

        // Position model directly at player feet coordinates
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation.yaw; // Face forward along look direction

        // Head pitch look
        const head = this.mesh.getObjectByName('head');
        if (head) {
            head.rotation.x = this.rotation.pitch;
        }

        // Walk animation
        const isMoving = keys && (keys.forward || keys.backward || keys.left || keys.right);
        const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
        if (isMoving || horizontalSpeed > 0.5) {
            this.walkPhase = (this.walkPhase || 0) + dt * (keys.sprint ? 14 : 9);
        } else {
            // Decay to rest
            this.walkPhase = (this.walkPhase || 0) * Math.pow(0.05, dt * 8);
        }

        const swing = Math.sin(this.walkPhase || 0) * 0.7;
        const leftArm = this.mesh.getObjectByName('leftArm');
        const rightArm = this.mesh.getObjectByName('rightArm');
        const leftLeg = this.mesh.getObjectByName('leftLeg');
        const rightLeg = this.mesh.getObjectByName('rightLeg');

        if (leftLeg) leftLeg.rotation.x = -swing;
        if (rightLeg) rightLeg.rotation.x = swing;
        if (leftArm) leftArm.rotation.x = swing;

        // Animate Steve's right arm with swing arc during mining/attacking
        if (rightArm) {
            if (this.isSwinging && this.swingProgress !== undefined) {
                // Minecraft attack/mining swing: raise up and chop forward
                const s = Math.sin(this.swingProgress * Math.PI);
                rightArm.rotation.x = -Math.PI / 2.5 * s - (1 - s) * swing;
                rightArm.rotation.y = -Math.PI / 6 * s;
                rightArm.rotation.z = Math.PI / 8 * s;
            } else {
                rightArm.rotation.set(-swing, 0, 0);
            }
        }

        // Sync held item mesh on Steve's right hand in 3rd person
        this.syncHeldItemDisplay(this.mesh);

        // Sync armor visibility and colors
        this.syncArmorDisplay(this.mesh);
    }

    syncHeldItemDisplay(targetModel) {
        if (!targetModel) return;
        const rightArm = targetModel.getObjectByName('rightArm');
        if (!rightArm) return;

        let heldContainer = rightArm.getObjectByName('heldItemContainer');
        if (!heldContainer) {
            heldContainer = new THREE.Group();
            heldContainer.name = 'heldItemContainer';
            // Position at Steve's hand (fist at bottom of right arm)
            heldContainer.position.set(0, -0.56, -0.05);
            rightArm.add(heldContainer);
        } else {
            heldContainer.position.set(0, -0.56, -0.05);
        }

        const clearHeld = () => {
            while (heldContainer.children.length > 0) {
                const child = heldContainer.children[0];
                heldContainer.remove(child);
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            }
        };

        const slot = this.inventory ? this.inventory.slots[this.selectedSlot] : null;
        if (!slot) {
            clearHeld();
            heldContainer.userData.currentKey = null;
            heldContainer.userData.currentSubtype = null;
            return;
        }

        const currentKey = `${slot.item.type}_${slot.item.subtype}`;
        if (heldContainer.userData.currentKey === currentKey) return;

        clearHeld();
        heldContainer.userData.currentKey = currentKey;

        if (slot.item.type === 'block') {
            const atlas = window.game && window.game.atlas;
            const blockProps = getBlockProperties ? getBlockProperties(slot.item.subtype) : {};
            if (atlas) {
                const mat = new THREE.MeshLambertMaterial({
                    map: atlas.texture,
                    alphaTest: 0.5,
                    transparent: blockProps.transparent || blockProps.isCross || false,
                    side: blockProps.isCross ? THREE.DoubleSide : THREE.FrontSide
                });

                if (blockProps.isCross || slot.item.subtype === BLOCKS.TORCH) {
                    const geom = new THREE.BufferGeometry();
                    const s = 0.12;
                    const positions = [
                        -s, -s, -s, s, -s, s, s, s, s, -s, s, -s,
                        -s, -s, s, s, -s, -s, s, s, -s, -s, s, s
                    ];
                    const uvInfo = atlas.getUV(slot.item.subtype, 'side');
                    const uvs = [];
                    for (let i = 0; i < 2; i++) {
                        uvs.push(uvInfo.u, uvInfo.v, uvInfo.u + uvInfo.uSize, uvInfo.v, uvInfo.u + uvInfo.uSize, uvInfo.v + uvInfo.vSize, uvInfo.u, uvInfo.v + uvInfo.vSize);
                    }
                    const indices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7];
                    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
                    geom.setIndex(indices);
                    geom.computeVertexNormals();
                    const m = new THREE.Mesh(geom, mat);
                    m.position.set(0, 0.12, -0.08);
                    heldContainer.add(m);
                } else {
                    const geom = new THREE.BoxGeometry(0.25, 0.25, 0.25).toNonIndexed();
                    const uvs = geom.attributes.uv.array;
                    const faceNames = ['side', 'side', 'top', 'bottom', 'side', 'side'];
                    for (let i = 0; i < 6; i++) {
                        const uvInfo = atlas.getUV(slot.item.subtype, faceNames[i]);
                        for (let v = 0; v < 6; v++) {
                            const baseU = uvs[i * 12 + v * 2];
                            const baseV = uvs[i * 12 + v * 2 + 1];
                            uvs[i * 12 + v * 2] = uvInfo.u + baseU * uvInfo.uSize;
                            uvs[i * 12 + v * 2 + 1] = uvInfo.v + baseV * uvInfo.vSize;
                        }
                    }
                    const m = new THREE.Mesh(geom, mat);
                    m.position.set(0, 0.10, -0.12);
                    m.rotation.set(Math.PI / 8, -Math.PI / 4, 0);
                    heldContainer.add(m);
                }
            }
            return;
        }

        const safeSubtype = String(slot.item.subtype || '').toLowerCase();
        const isTool = slot.item.type === 'tool' ||
            safeSubtype.includes('sword') ||
            safeSubtype.includes('pickaxe') ||
            safeSubtype.includes('axe') ||
            safeSubtype.includes('shovel') ||
            safeSubtype.includes('hoe') ||
            safeSubtype.includes('hammer') ||
            safeSubtype.includes('excavator') ||
            safeSubtype.includes('rod');

        const applyTransform = (m) => {
            if (isTool) {
                // Handle placed in Steve's fist, tool blade points up and forward
                m.position.set(0.08, 0.16, -0.05);
                m.rotation.set(-Math.PI / 3, Math.PI / 4, 0);
            } else {
                // Flat item / food / material held in palm
                m.position.set(0, 0.08, -0.08);
                m.rotation.set(Math.PI / 6, 0, 0);
            }
        };

        const iconCanvas = generateItemTexture(slot.item.type, slot.item.subtype, (c) => {
            if (heldContainer.userData.currentKey === currentKey) {
                clearHeld();
                const m = createExtrudedItemMesh(c, 0.45, 0.035);
                applyTransform(m);
                heldContainer.add(m);
            }
        });

        const mesh = createExtrudedItemMesh(iconCanvas, 0.45, 0.035);
        applyTransform(mesh);
        heldContainer.add(mesh);
    }

    syncArmorDisplay(targetModel) {
        if (!targetModel) return;

        const getArmorColor = (item) => {
            if (!item || !item.subtype) return 0xdcdcdc;
            const sub = item.subtype.toLowerCase();
            if (sub.includes('diamond')) return 0x33ebcb;
            if (sub.includes('gold')) return 0xffd700;
            if (sub.includes('iron')) return 0xdcdcdc;
            if (sub.includes('netherite')) return 0x3b3337;
            if (sub.includes('ruby')) return 0xe0115f;
            if (sub.includes('sapphire')) return 0x1e60ff;
            if (sub.includes('zanite')) return 0x9d4edd;
            if (sub.includes('slime')) return 0x76d435;
            if (sub.includes('leather')) return 0x93512b;
            return 0xdcdcdc;
        };

        const applyColor = (mesh, hexColor) => {
            if (!mesh) return;
            mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    if (child.material.color) child.material.color.setHex(hexColor);
                    if (child.material.emissive) child.material.emissive.setHex(hexColor).multiplyScalar(0.25);
                }
            });
        };

        const helmet = this.inventory.armor[0];
        const chest = this.inventory.armor[1];
        const legs = this.inventory.armor[2];
        const boots = this.inventory.armor[3];

        // 1. Helmet
        const helmetMesh = targetModel.getObjectByName('armor_helmet');
        if (helmetMesh) {
            helmetMesh.visible = !!helmet;
            if (helmet) applyColor(helmetMesh, getArmorColor(helmet.item));
        }

        // 2. Chestplate (Torso + Arm Pauldrons)
        const chestMesh = targetModel.getObjectByName('armor_chest');
        const chestArmL = targetModel.getObjectByName('armor_chest_l_arm');
        const chestArmR = targetModel.getObjectByName('armor_chest_r_arm');
        const hasChest = !!chest;
        if (chestMesh) {
            chestMesh.visible = hasChest;
            if (hasChest) applyColor(chestMesh, getArmorColor(chest.item));
        }
        if (chestArmL) {
            chestArmL.visible = hasChest;
            if (hasChest) applyColor(chestArmL, getArmorColor(chest.item));
        }
        if (chestArmR) {
            chestArmR.visible = hasChest;
            if (hasChest) applyColor(chestArmR, getArmorColor(chest.item));
        }

        // 3. Leggings (Belt/Hips + Left Leg + Right Leg)
        const beltMesh = targetModel.getObjectByName('armor_legs_belt');
        const legsL = targetModel.getObjectByName('armor_legs_l');
        const legsR = targetModel.getObjectByName('armor_legs_r');
        const hasLegs = !!legs;
        if (beltMesh) {
            beltMesh.visible = hasLegs;
            if (hasLegs) applyColor(beltMesh, getArmorColor(legs.item));
        }
        if (legsL && legsR) {
            legsL.visible = hasLegs;
            legsR.visible = hasLegs;
            if (hasLegs) {
                const col = getArmorColor(legs.item);
                applyColor(legsL, col);
                applyColor(legsR, col);
            }
        }

        // 4. Boots
        const bootsL = targetModel.getObjectByName('armor_boots_l');
        const bootsR = targetModel.getObjectByName('armor_boots_r');
        const hasBoots = !!boots;
        if (bootsL && bootsR) {
            bootsL.visible = hasBoots;
            bootsR.visible = hasBoots;
            if (hasBoots) {
                const col = getArmorColor(boots.item);
                applyColor(bootsL, col);
                applyColor(bootsR, col);
            }
        }
    }

    getEyePosition() {
        return new THREE.Vector3(this.position.x, this.position.y + this.eyeHeight, this.position.z);
    }

    getLookDirection() {
        return new THREE.Vector3(
            -Math.sin(this.rotation.yaw) * Math.cos(this.rotation.pitch),
            Math.sin(this.rotation.pitch),
            -Math.cos(this.rotation.yaw) * Math.cos(this.rotation.pitch)
        ).normalize();
    }

    takeDamage(amt) {
        if (this.isCreative || this.isSpectator || (this.spawnGraceTimer !== undefined && this.spawnGraceTimer > 0)) return false;
        if (this.health <= 0) return true;
        
        let protection = 0;
        // Sum protection from armor slots
        for (let i = 0; i < 4; i++) {
            const piece = this.inventory.armor[i];
            if (piece && piece.item.data.equipData && piece.item.data.equipData.protection) {
                protection += piece.item.data.equipData.protection;
            }
        }
        
        const damageTaken = Math.max(0.5, amt - protection);
        this.health -= damageTaken;
        return this.health <= 0;
    }

    useMana(amt) {
        if (this.isCreative) return true;
        if (this.mana >= amt) {
            this.mana -= amt;
            return true;
        }
        return false;
    }
}

// ============================================
// Helper: Build mob body parts
// ============================================

function createMobMaterial(color, emissive = 0x000000, emissiveIntensity = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    
    // Fill base
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, 16, 16);
    
    // Add noise
    const imgData = ctx.getImageData(0, 0, 16, 16);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() - 0.5) * 40;
        d[i] = Math.max(0, Math.min(255, d[i] + v));
        d[i+1] = Math.max(0, Math.min(255, d[i+1] + v));
        d[i+2] = Math.max(0, Math.min(255, d[i+2] + v));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    return new THREE.MeshLambertMaterial({ map: texture, emissive, emissiveIntensity });
}

const mobTextureCache = {};
function getMobMaterial(type, part = 'body') {
    const key = `${type}_${part}`;
    if (!mobTextureCache[key]) {
        let tex;
        const updateTex = (canvas) => {
            if (tex) {
                tex.image = canvas;
                tex.needsUpdate = true;
            }
        };
        const cvs = generateMobTexture(type, part, updateTex);
        tex = new THREE.CanvasTexture(cvs);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        mobTextureCache[key] = new THREE.MeshLambertMaterial({ map: tex });
    }
    return mobTextureCache[key];
}

const mobHeadCache = {};
function getMobHeadMaterials(type) {
    if (!mobHeadCache[type]) {
        const sideMat = getMobMaterial(type, 'head_side');
        const topMat = getMobMaterial(type, 'head_top');
        const bottomMat = getMobMaterial(type, 'head_bottom');
        const frontMat = getMobMaterial(type, 'head_front');
        const backMat = getMobMaterial(type, 'head_back');
        // Three.js BoxGeometry face mapping: [+X, -X, +Y, -Y, +Z, -Z]
        mobHeadCache[type] = [sideMat, sideMat, topMat, bottomMat, frontMat, backMat];
    }
    return mobHeadCache[type];
}

function createMobHead(geo, mobType) {
    const mats = getMobHeadMaterials(mobType);
    const mesh = new THREE.Mesh(geo, mats);
    mesh.castShadow = true;
    return mesh;
}

function createBodyPart(geo, colorOrType, emissive = 0x000000, emissiveIntensity = 0, part = 'body') {
    let mat;
    if (typeof colorOrType === 'string') {
        mat = getMobMaterial(colorOrType, part);
        if (emissive !== 0x000000) {
            mat = mat.clone();
            mat.emissive = new THREE.Color(emissive);
            mat.emissiveIntensity = emissiveIntensity;
        }
    } else {
        mat = createMobMaterial(colorOrType, emissive, emissiveIntensity);
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    return mesh;
}

// ============================================
// Mob Type Definitions (Enhanced)
// ============================================

export const MOB_TYPES = {
    COW: {
        name: 'Cow', health: 20, damage: 0, speed: 1.5, hostile: false, color: 0xffffff,
        size: 0.9, xpDrop: 4, lootChance: 0.5,
        buildMesh: () => {
            const group = new THREE.Group();
            // Authentic Minecraft Cow Body: Box (12, 10, 18) in MC coords -> (0.75, 0.625, 1.125) unrotated
            // Vanilla MC Cow Body UV: { u: 18, v: 4, w: 12, h: 10, l: 18 }
            const bodyGeo = new THREE.BoxGeometry(0.75, 0.625, 1.125);
            const bodyMats = getMobBoxMaterials('COW', { u: 18, v: 4, w: 12, h: 10, l: 18 }, { isBody: true, part: 'body' });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.set(0, 1.0625, 0);
            body.castShadow = true;
            group.add(body);

            // Udder: Vanilla MC Udder (4x2x6 in world, 4x6x2 rotated 90 deg around X attached to rear belly)
            const udderGeo = new THREE.BoxGeometry(0.25, 0.125, 0.375);
            const udderMats = getMobBoxMaterials('COW', { u: 52, v: 0, w: 4, h: 2, d: 6 }, {
                part: 'snout',
                faceUVs: {
                    left: [52, 2, 2, 6],
                    right: [58, 2, 2, 6],
                    top: [54, 0, 4, 2],
                    bottom: [54, 2, 4, 6],
                    front: [54, 0, 4, 2],
                    back: [58, 0, 4, 2]
                }
            });
            const udder = new THREE.Mesh(udderGeo, udderMats);
            udder.position.set(0, 0.70, -0.25);
            udder.castShadow = true;
            group.add(udder);

            // Head (faces +Z forward): Vanilla MC Cow Head UV: { u: 0, v: 0, w: 8, h: 8, d: 6 }
            const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.375);
            const headMats = getMobBoxMaterials('COW', { u: 0, v: 0, w: 8, h: 8, d: 6 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 1.20, 0.62);
            head.name = 'head';
            head.castShadow = true;

            // Horns attached to head: Vanilla MC Horn UV: { u: 22, v: 0, w: 1, h: 3, d: 1 }
            const hornGeo = new THREE.BoxGeometry(0.0625, 0.1875, 0.0625);
            const hornMats = getMobBoxMaterials('COW', { u: 22, v: 0, w: 1, h: 3, d: 1 }, { part: 'horn' });
            const leftHorn = new THREE.Mesh(hornGeo, hornMats);
            leftHorn.position.set(-0.28, 0.26, -0.05);
            leftHorn.rotation.z = 0.15;
            head.add(leftHorn);
            const rightHorn = new THREE.Mesh(hornGeo, hornMats);
            rightHorn.position.set(0.28, 0.26, -0.05);
            rightHorn.rotation.z = -0.15;
            head.add(rightHorn);

            group.add(head);

            // 4 Legs: Vanilla MC Cow Leg UV: { u: 0, v: 16, w: 4, h: 12, d: 4 } (height 12 px = 0.75)
            const legGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
            const legMats = getMobBoxMaterials('COW', { u: 0, v: 16, w: 4, h: 12, d: 4 }, { part: 'leg' });
            for(let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(legGeo, legMats);
                const x = (i % 2 === 0 ? -0.25 : 0.25);
                const z = (i < 2 ? 0.38 : -0.38);
                leg.position.set(x, 0.375, z);
                leg.name = `leg_${i}`;
                leg.castShadow = true;
                group.add(leg);
            }
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const leg0 = mesh.getObjectByName('leg_0');
            const leg1 = mesh.getObjectByName('leg_1');
            const leg2 = mesh.getObjectByName('leg_2');
            const leg3 = mesh.getObjectByName('leg_3');
            const head = mesh.getObjectByName('head');
            if (!isMoving) {
                if (leg0) leg0.rotation.x = 0;
                if (leg1) leg1.rotation.x = 0;
                if (leg2) leg2.rotation.x = 0;
                if (leg3) leg3.rotation.x = 0;
                if (head) {
                    const cycle = (age + 2.5) % 13;
                    if (cycle > 7 && cycle < 11.5) {
                        // Grazing / eating grass
                        const t = Math.min(1, Math.min((cycle - 7) * 2, (11.5 - cycle) * 2));
                        const chew = Math.sin(age * 12) * 0.05;
                        head.rotation.x = 0.65 * t + chew;
                        head.rotation.y = Math.sin(age * 2) * 0.04;
                        head.rotation.z = Math.sin(age * 10) * 0.04 * t;
                        head.position.y = 1.20 - 0.28 * t;
                        head.position.z = 0.62 + 0.12 * t;
                    } else {
                        // Normal idle look
                        head.rotation.x = 0;
                        head.rotation.y = Math.sin(age * 1.2) * 0.12;
                        head.rotation.z = 0;
                        head.position.set(0, 1.20, 0.62);
                    }
                }
            } else {
                const swing = Math.sin(age * 7) * 0.45;
                if (leg0) leg0.rotation.x = swing;
                if (leg1) leg1.rotation.x = -swing;
                if (leg2) leg2.rotation.x = -swing;
                if (leg3) leg3.rotation.x = swing;
                if (head) {
                    head.rotation.x = 0;
                    head.rotation.y = 0;
                    head.rotation.z = 0;
                    head.position.set(0, 1.20, 0.62);
                }
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
            if (mob.health < mob.maxHealth) {
                const fleeDir = _tempVec3.subVectors(mob.position, playerPos).normalize();
                fleeDir.y = 0;
                mob.velocity.x = fleeDir.x * mob.speed * 1.5;
                mob.velocity.z = fleeDir.z * mob.speed * 1.5;
                if (mob.mesh) mob.mesh.rotation.y = Math.atan2(fleeDir.x, fleeDir.z);
            } else {
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    if (Math.random() < 0.3) {
                        mob.wanderTimer = 2 + Math.random() * 4;
                        const angle = Math.random() * Math.PI * 2;
                        mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                    } else {
                        mob.wanderTimer = 4 + Math.random() * 5;
                        mob.wanderDir.set(0, 0, 0);
                    }
                }
                mob.velocity.x = mob.wanderDir.x * mob.speed * 0.3;
                mob.velocity.z = mob.wanderDir.z * mob.speed * 0.3;
                if (mob.wanderDir.lengthSq() > 0 && mob.mesh) mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
            }
        }
    },
    SHEEP: {
        name: 'Sheep', health: 15, damage: 0, speed: 2.5, hostile: false, color: 0xffffff,
        size: 0.8, xpDrop: 2, lootChance: 1.0,
        buildMesh: () => {
            const group = new THREE.Group();
            // Authentic Minecraft Sheep Body (Fleece Wool coat): Box (12, 8, 16) in MC coords -> (0.75, 0.50, 1.0) unrotated
            // Vanilla MC Sheep Wool body UV: { u: 28, v: 8, w: 8, h: 6, l: 16 }
            const bodyGeo = new THREE.BoxGeometry(0.75, 0.50, 1.0);
            const bodyMats = getMobBoxMaterials('SHEEP', { u: 28, v: 8, w: 8, h: 6, l: 16 }, { isBody: true, skinKey: 'sheep/sheep_fur.png', part: 'body' });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.name = 'body_wool';
            body.position.set(0, 1.0, 0);
            body.castShadow = true;
            group.add(body);

            // Head (faces +Z forward): Vanilla MC Sheep Head UV: { u: 0, v: 0, w: 6, h: 6, d: 8 } on sheep.png skin
            const headGeo = new THREE.BoxGeometry(0.375, 0.375, 0.50);
            const headMats = getMobBoxMaterials('SHEEP', { u: 0, v: 0, w: 6, h: 6, d: 8 }, { skinKey: 'sheep/sheep.png', part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 1.10, 0.58);
            head.name = 'head';
            head.castShadow = true;

            // Head Wool Cap: Vanilla MC Sheep Head Wool UV: { u: 0, v: 0, w: 6, h: 6, d: 6 } on sheep_fur.png
            const headWoolGeo = new THREE.BoxGeometry(0.40, 0.40, 0.40);
            const headWoolMats = getMobBoxMaterials('SHEEP', { u: 0, v: 0, w: 6, h: 6, d: 6 }, { isOverlay: true, transparent: true, skinKey: 'sheep/sheep_fur.png', part: 'head_front' });
            const headWool = new THREE.Mesh(headWoolGeo, headWoolMats);
            headWool.name = 'head_wool';
            headWool.position.set(0, 0.02, -0.06);
            headWool.castShadow = false; // Overlay mesh does not cast shadow to prevent black shadow acne on head
            head.add(headWool); // Child of head!

            group.add(head);

            // 4 Legs: Vanilla MC Sheep Leg UV: { u: 0, v: 16, w: 4, h: 12, d: 4 } on sheep.png skin (height 12 px = 0.75)
            const legGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
            const legMats = getMobBoxMaterials('SHEEP', { u: 0, v: 16, w: 4, h: 12, d: 4 }, { skinKey: 'sheep/sheep.png', part: 'leg' });
            for(let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(legGeo, legMats);
                const x = (i % 2 === 0 ? -0.22 : 0.22);
                const z = (i < 2 ? 0.35 : -0.35);
                leg.position.set(x, 0.375, z);
                leg.name = `leg_${i}`;
                leg.castShadow = true;
                group.add(leg);
            }
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const leg0 = mesh.getObjectByName('leg_0');
            const leg1 = mesh.getObjectByName('leg_1');
            const leg2 = mesh.getObjectByName('leg_2');
            const leg3 = mesh.getObjectByName('leg_3');
            const head = mesh.getObjectByName('head');
            if (!isMoving) {
                if (leg0) leg0.rotation.x = 0;
                if (leg1) leg1.rotation.x = 0;
                if (leg2) leg2.rotation.x = 0;
                if (leg3) leg3.rotation.x = 0;
                if (head) {
                    const cycle = age % 11;
                    if (cycle > 5.5 && cycle < 9.5) {
                        // Authentic Minecraft Sheep grass-grazing animation!
                        const t = Math.min(1, Math.min((cycle - 5.5) * 2, (9.5 - cycle) * 2));
                        const chew = Math.sin(age * 16) * 0.06;
                        head.rotation.x = 0.75 * t + chew;
                        head.rotation.y = Math.sin(age * 3) * 0.04;
                        head.position.y = 1.10 - 0.35 * t;
                        head.position.z = 0.58 + 0.15 * t;
                    } else {
                        head.rotation.x = 0;
                        head.rotation.y = Math.sin(age * 1.5) * 0.10;
                        head.position.set(0, 1.10, 0.58);
                    }
                }
            } else {
                const swing = Math.sin(age * 8) * 0.4;
                if (leg0) leg0.rotation.x = swing;
                if (leg1) leg1.rotation.x = -swing;
                if (leg2) leg2.rotation.x = -swing;
                if (leg3) leg3.rotation.x = swing;
                if (head) {
                    head.rotation.x = 0;
                    head.rotation.y = 0;
                    head.position.set(0, 1.10, 0.58);
                }
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
            if (mob.health < mob.maxHealth) {
                const fleeDir = _tempVec3.subVectors(mob.position, playerPos).normalize();
                fleeDir.y = 0;
                mob.velocity.x = fleeDir.x * mob.speed * 2.0;
                mob.velocity.z = fleeDir.z * mob.speed * 2.0;
                if (mob.mesh) mob.mesh.rotation.y = Math.atan2(fleeDir.x, fleeDir.z);
            } else {
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    if (Math.random() < 0.4) {
                        mob.wanderTimer = 1.5 + Math.random() * 3;
                        const angle = Math.random() * Math.PI * 2;
                        mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                    } else {
                        mob.wanderTimer = 3 + Math.random() * 4;
                        mob.wanderDir.set(0, 0, 0);
                    }
                }
                mob.velocity.x = mob.wanderDir.x * mob.speed * 0.4;
                mob.velocity.z = mob.wanderDir.z * mob.speed * 0.4;
                if (mob.wanderDir.lengthSq() > 0 && mob.mesh) mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
            }
        }
    },
    SLIME: {
        name: 'Slime', health: 20, damage: 5, speed: 2.2, hostile: true, color: 0x44cc44,
        size: 0.65, xpDrop: 5, lootChance: 0.3,
        buildMesh: () => {
            const group = new THREE.Group();
            // Outer translucent slime cube (exact Minecraft proportions)
            const outerGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
            const outer = createBodyPart(outerGeo, 'SLIME');
            outer.position.y = 0.3;
            outer.material.transparent = true;
            outer.material.opacity = 0.65;
            outer.name = 'outer';
            group.add(outer);

            // Inner solid core cube
            const coreGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
            const core = createBodyPart(coreGeo, 'SLIME');
            core.position.y = 0.28;
            core.name = 'core';
            group.add(core);

            // Eyes on inner core face (+Z)
            const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0a240a });
            const le = new THREE.Mesh(eyeGeo, eyeMat);
            le.position.set(-0.1, 0.34, 0.17);
            le.name = 'le';
            group.add(le);

            const re = new THREE.Mesh(eyeGeo, eyeMat);
            re.position.set(0.1, 0.34, 0.17);
            re.name = 're';
            group.add(re);

            // Mouth
            const mouthGeo = new THREE.BoxGeometry(0.06, 0.04, 0.02);
            const mouth = new THREE.Mesh(mouthGeo, eyeMat);
            mouth.position.set(0, 0.22, 0.17);
            mouth.name = 'mouth';
            group.add(mouth);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            // Authentic Minecraft hop & squash/stretch
            const cycle = (age * 3.5) % Math.PI;
            const isJumping = Math.sin(cycle) > 0.1;
            const stretch = isJumping ? 1.0 + Math.sin(cycle) * 0.3 : 1.0;
            const squish = isJumping ? 1.0 / Math.sqrt(stretch) : 1.0 + Math.abs(Math.sin(age * 7)) * 0.15;
            
            const outer = mesh.getObjectByName('outer');
            const core = mesh.getObjectByName('core');
            if (outer) outer.scale.set(squish, stretch, squish);
            if (core) core.scale.set(squish, stretch, squish);
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.jumpTimer) mob.jumpTimer = 0;
            mob.jumpTimer -= dt;
            const dist = mob.position.distanceTo(playerPos);

            if (mob.grounded && mob.jumpTimer <= 0) {
                mob.jumpTimer = 1.0 + Math.random() * 0.8;
                mob.velocity.y = 5.5; // Minecraft slime hop
                mob.grounded = false;

                if (dist < 16) {
                    const dir = _tempVec3.subVectors(playerPos, mob.position);
                    dir.y = 0;
                    if (dir.lengthSq() > 0) dir.normalize();
                    mob.velocity.x = dir.x * mob.speed * 1.5;
                    mob.velocity.z = dir.z * mob.speed * 1.5;
                    if (mob.mesh) mob.mesh.rotation.y = Math.atan2(dir.x, dir.z);
                } else {
                    const angle = Math.random() * Math.PI * 2;
                    mob.velocity.x = Math.cos(angle) * mob.speed;
                    mob.velocity.z = Math.sin(angle) * mob.speed;
                    if (mob.mesh) mob.mesh.rotation.y = angle;
                }
            } else if (mob.grounded) {
                mob.velocity.x *= 0.5;
                mob.velocity.z *= 0.5;
            }
        }
    },
    LAVASLIME: {
        name: 'Magma Cube', health: 30, damage: 8, speed: 2.2, hostile: true, color: 0xcc4400,
        size: 0.75, xpDrop: 8, lootChance: 0.4,
        buildMesh: () => {
            const group = new THREE.Group();
            // Outer segmented magma shell
            const outerGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
            const outer = createBodyPart(outerGeo, 'LAVASLIME');
            outer.position.y = 0.35;
            outer.name = 'outer';
            group.add(outer);

            // Glowing magma core
            const coreGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
            const coreMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
            const core = new THREE.Mesh(coreGeo, coreMat);
            core.position.y = 0.35;
            core.name = 'core';
            group.add(core);

            // Glowing yellow/orange eyes
            const eyeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.02);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff22 });
            const le = new THREE.Mesh(eyeGeo, eyeMat);
            le.position.set(-0.16, 0.4, 0.36);
            group.add(le);
            const re = new THREE.Mesh(eyeGeo, eyeMat);
            re.position.set(0.16, 0.4, 0.36);
            group.add(re);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const cycle = (age * 3.5) % Math.PI;
            const isJumping = Math.sin(cycle) > 0.1;
            const stretch = isJumping ? 1.0 + Math.sin(cycle) * 0.4 : 1.0;
            const squish = isJumping ? 1.0 / Math.sqrt(stretch) : 1.0 + Math.abs(Math.sin(age * 7)) * 0.15;
            
            const outer = mesh.getObjectByName('outer');
            if (outer) outer.scale.set(squish, stretch, squish);
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.jumpTimer) mob.jumpTimer = 0;
            mob.jumpTimer -= dt;
            const dist = mob.position.distanceTo(playerPos);

            if (mob.grounded && mob.jumpTimer <= 0) {
                mob.jumpTimer = 1.0 + Math.random() * 0.8;
                mob.velocity.y = 6.0;
                mob.grounded = false;

                if (dist < 16) {
                    const dir = _tempVec3.subVectors(playerPos, mob.position);
                    dir.y = 0;
                    if (dir.lengthSq() > 0) dir.normalize();
                    mob.velocity.x = dir.x * mob.speed * 1.5;
                    mob.velocity.z = dir.z * mob.speed * 1.5;
                    if (mob.mesh) mob.mesh.rotation.y = Math.atan2(dir.x, dir.z);
                } else {
                    const angle = Math.random() * Math.PI * 2;
                    mob.velocity.x = Math.cos(angle) * mob.speed;
                    mob.velocity.z = Math.sin(angle) * mob.speed;
                    if (mob.mesh) mob.mesh.rotation.y = angle;
                }
            } else if (mob.grounded) {
                mob.velocity.x *= 0.5;
                mob.velocity.z *= 0.5;
            }
        }
    },
    PIG: {
        name: 'Pig', health: 15, damage: 0, speed: 2.0, hostile: false, color: 0xffffff,
        size: 0.7, xpDrop: 3, lootChance: 0.5,
        buildMesh: () => {
            const group = new THREE.Group();
            // Authentic Minecraft Pig Body: Box (10, 8, 16) in MC coords -> (0.625, 0.50, 1.0) unrotated
            // Vanilla MC Pig Body UV: { u: 28, v: 8, w: 10, h: 8, l: 16 }
            const bodyGeo = new THREE.BoxGeometry(0.625, 0.50, 1.0);
            const bodyMats = getMobBoxMaterials('PIG', { u: 28, v: 8, w: 10, h: 8, l: 16 }, { isBody: true, part: 'body' });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.set(0, 0.625, 0);
            body.castShadow = true;
            group.add(body);

            // Head (faces +Z forward): Vanilla MC Pig Head UV: { u: 0, v: 0, w: 8, h: 8, d: 8 }
            const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const headMats = getMobBoxMaterials('PIG', { u: 0, v: 0, w: 8, h: 8, d: 8 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 0.70, 0.55);
            head.name = 'head';
            head.castShadow = true;

            // 3D Protruding Snout on front of head: Vanilla MC Pig Snout UV: { u: 16, v: 16, w: 4, h: 3, d: 1 }
            const snoutGeo = new THREE.BoxGeometry(0.25, 0.1875, 0.0625);
            const snoutMats = getMobBoxMaterials('PIG', { u: 16, v: 16, w: 4, h: 3, d: 1 }, { part: 'snout' });
            const snout = new THREE.Mesh(snoutGeo, snoutMats);
            snout.position.set(0, -0.09, 0.28);
            snout.castShadow = true;
            head.add(snout); // Child of head!

            group.add(head);

            // 4 Legs with trotters: Vanilla MC Pig Leg UV: { u: 0, v: 16, w: 4, h: 6, d: 4 } (height 6 px = 0.375)
            const legGeo = new THREE.BoxGeometry(0.25, 0.375, 0.25);
            const legMats = getMobBoxMaterials('PIG', { u: 0, v: 16, w: 4, h: 6, d: 4 }, { part: 'leg' });
            for(let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(legGeo, legMats);
                const x = (i % 2 === 0 ? -0.20 : 0.20);
                const z = (i < 2 ? 0.30 : -0.30);
                leg.position.set(x, 0.1875, z);
                leg.name = `leg_${i}`;
                leg.castShadow = true;
                group.add(leg);
            }
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const leg0 = mesh.getObjectByName('leg_0');
            const leg1 = mesh.getObjectByName('leg_1');
            const leg2 = mesh.getObjectByName('leg_2');
            const leg3 = mesh.getObjectByName('leg_3');
            const head = mesh.getObjectByName('head');
            if (!isMoving) {
                if (leg0) leg0.rotation.x = 0;
                if (leg1) leg1.rotation.x = 0;
                if (leg2) leg2.rotation.x = 0;
                if (leg3) leg3.rotation.x = 0;
                if (head) {
                    const cycle = (age + 4.2) % 10;
                    if (cycle > 5 && cycle < 8.5) {
                        // Sniffing and rooting in ground
                        const t = Math.min(1, Math.min((cycle - 5) * 2, (8.5 - cycle) * 2));
                        const sniff = Math.sin(age * 22) * 0.05;
                        head.rotation.x = 0.45 * t + sniff;
                        head.rotation.y = Math.sin(age * 14) * 0.06 * t;
                        head.position.y = 0.70 - 0.18 * t;
                        head.position.z = 0.55 + 0.08 * t;
                    } else {
                        head.rotation.x = 0;
                        head.rotation.y = Math.sin(age * 1.2) * 0.10;
                        head.position.set(0, 0.70, 0.55);
                    }
                }
            } else {
                const swing = Math.sin(age * 8) * 0.4;
                if (leg0) leg0.rotation.x = swing;
                if (leg1) leg1.rotation.x = -swing;
                if (leg2) leg2.rotation.x = -swing;
                if (leg3) leg3.rotation.x = swing;
                if (head) {
                    head.rotation.x = 0;
                    head.rotation.y = 0;
                    head.position.set(0, 0.70, 0.55);
                }
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
            if (mob.health < mob.maxHealth) {
                const fleeDir = _tempVec3.subVectors(mob.position, playerPos).normalize();
                fleeDir.y = 0;
                mob.velocity.x = fleeDir.x * mob.speed * 2.5;
                mob.velocity.z = fleeDir.z * mob.speed * 2.5;
                if (mob.mesh) mob.mesh.rotation.y = Math.atan2(fleeDir.x, fleeDir.z);
            } else {
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    if (Math.random() < 0.5) {
                        mob.wanderTimer = 1 + Math.random() * 2;
                        const angle = Math.random() * Math.PI * 2;
                        mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                    } else {
                        mob.wanderTimer = 2 + Math.random() * 3;
                        mob.wanderDir.set(0, 0, 0);
                    }
                }
                mob.velocity.x = mob.wanderDir.x * mob.speed * 0.5;
                mob.velocity.z = mob.wanderDir.z * mob.speed * 0.5;
                if (mob.wanderDir.lengthSq() > 0 && mob.mesh) mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
            }
        }
    },
    PIGLIN_BRUISER: {
        name: 'Piglin Bruiser', health: 50, damage: 12, speed: 3.5, hostile: true, color: 0xffaaaa,
        size: 0.9, xpDrop: 15, lootChance: 0.6,
        buildMesh: () => {
            const group = new THREE.Group();

            // Authentic Minecraft Java Piglin Brute UV layout on piglin_brute.png (64x64)
            // Body (Torso): 8x12x4 -> (0.50, 0.75, 0.25), UV: { u: 16, v: 16, w: 8, h: 12, d: 4 }
            const bodyGeo = new THREE.BoxGeometry(0.50, 0.75, 0.25);
            const bodyMats = getMobBoxMaterials('PIGLIN_BRUISER', { u: 16, v: 16, w: 8, h: 12, d: 4 }, { part: 'body' });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.set(0, 1.125, 0);
            body.name = 'body';
            body.castShadow = true;
            group.add(body);

            // Head: 10x8x8 -> (0.625, 0.50, 0.50), UV: { u: 0, v: 0, w: 10, h: 8, d: 8 }
            const headGeo = new THREE.BoxGeometry(0.625, 0.50, 0.50);
            const headMats = getMobBoxMaterials('PIGLIN_BRUISER', { u: 0, v: 0, w: 10, h: 8, d: 8 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 1.75, 0);
            head.name = 'head';
            head.castShadow = true;

            // Snout: 4x4x1 -> (0.25, 0.25, 0.0625), UV: { u: 31, v: 1, w: 4, h: 4, d: 1 }
            const snoutGeo = new THREE.BoxGeometry(0.25, 0.25, 0.0625);
            const snoutMats = getMobBoxMaterials('PIGLIN_BRUISER', { u: 31, v: 1, w: 4, h: 4, d: 1 }, { part: 'snout' });
            const snout = new THREE.Mesh(snoutGeo, snoutMats);
            snout.position.set(0, -0.10, 0.28125);
            snout.castShadow = true;
            head.add(snout);

            // Tusks on snout sides: 1x2x1 -> (0.0625, 0.125, 0.0625)
            // Left tusk: { u: 2, v: 4, w: 1, h: 2, d: 1 }
            const tuskGeo = new THREE.BoxGeometry(0.0625, 0.125, 0.0625);
            const leftTuskMats = getMobBoxMaterials('PIGLIN_BRUISER', { u: 2, v: 4, w: 1, h: 2, d: 1 }, { part: 'snout' });
            const leftTusk = new THREE.Mesh(tuskGeo, leftTuskMats);
            leftTusk.position.set(-0.15625, -0.14, 0.26);
            leftTusk.castShadow = true;
            head.add(leftTusk);

            // Right tusk: { u: 2, v: 0, w: 1, h: 2, d: 1 }
            const rightTuskMats = getMobBoxMaterials('PIGLIN_BRUISER', { u: 2, v: 0, w: 1, h: 2, d: 1 }, { part: 'snout' });
            const rightTusk = new THREE.Mesh(tuskGeo, rightTuskMats);
            rightTusk.position.set(0.15625, -0.14, 0.26);
            rightTusk.castShadow = true;
            head.add(rightTusk);

            // Floppy Ears: 1x5x4 -> (0.0625, 0.3125, 0.25)
            // Left ear: { u: 51, v: 6, w: 1, h: 5, d: 4 }, angled outwards
            const earGeo = new THREE.BoxGeometry(0.0625, 0.3125, 0.25);
            const leftEarMats = getMobBoxMaterials('PIGLIN_BRUISER', { u: 51, v: 6, w: 1, h: 5, d: 4 }, { part: 'head_side' });
            const leftEar = new THREE.Mesh(earGeo, leftEarMats);
            leftEar.position.set(-0.34, 0.05, -0.05);
            leftEar.rotation.z = 0.52; // Angled outward
            leftEar.name = 'leftEar';
            leftEar.castShadow = true;
            head.add(leftEar);

            // Right ear: { u: 39, v: 6, w: 1, h: 5, d: 4 }, angled outwards
            const rightEarMats = getMobBoxMaterials('PIGLIN_BRUISER', { u: 39, v: 6, w: 1, h: 5, d: 4 }, { part: 'head_side' });
            const rightEar = new THREE.Mesh(earGeo, rightEarMats);
            rightEar.position.set(0.34, 0.05, -0.05);
            rightEar.rotation.z = -0.52; // Angled outward
            rightEar.name = 'rightEar';
            rightEar.castShadow = true;
            head.add(rightEar);

            group.add(head);

            // Arms: 4x12x4 -> (0.25, 0.75, 0.25)
            // Left Arm: UV: { u: 32, v: 48, w: 4, h: 12, d: 4 }
            const armGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
            const lArmMats = getMobBoxMaterials('PIGLIN_BRUISER', { u: 32, v: 48, w: 4, h: 12, d: 4 }, { part: 'arm' });
            const lArm = new THREE.Mesh(armGeo, lArmMats);
            lArm.position.set(-0.375, 1.125, 0);
            lArm.name = 'leftArm';
            lArm.castShadow = true;
            group.add(lArm);

            // Right Arm: UV: { u: 40, v: 16, w: 4, h: 12, d: 4 }
            const rArmMats = getMobBoxMaterials('PIGLIN_BRUISER', { u: 40, v: 16, w: 4, h: 12, d: 4 }, { part: 'arm' });
            const rArm = new THREE.Mesh(armGeo, rArmMats);
            rArm.position.set(0.375, 1.125, 0);
            rArm.name = 'rightArm';
            rArm.castShadow = true;
            group.add(rArm);

            // Legs: 4x12x4 -> (0.25, 0.75, 0.25)
            // Left Leg: UV: { u: 16, v: 48, w: 4, h: 12, d: 4 }
            const legGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
            const lLegMats = getMobBoxMaterials('PIGLIN_BRUISER', { u: 16, v: 48, w: 4, h: 12, d: 4 }, { part: 'leg' });
            const lLeg = new THREE.Mesh(legGeo, lLegMats);
            lLeg.position.set(-0.125, 0.375, 0);
            lLeg.name = 'leftLeg';
            lLeg.castShadow = true;
            group.add(lLeg);

            // Right Leg: UV: { u: 0, v: 16, w: 4, h: 12, d: 4 }
            const rLegMats = getMobBoxMaterials('PIGLIN_BRUISER', { u: 0, v: 16, w: 4, h: 12, d: 4 }, { part: 'leg' });
            const rLeg = new THREE.Mesh(legGeo, rLegMats);
            rLeg.position.set(0.125, 0.375, 0);
            rLeg.name = 'rightLeg';
            rLeg.castShadow = true;
            group.add(rLeg);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const lArm = mesh.getObjectByName('leftArm');
            const rArm = mesh.getObjectByName('rightArm');
            const lLeg = mesh.getObjectByName('leftLeg');
            const rLeg = mesh.getObjectByName('rightLeg');
            const lEar = mesh.getObjectByName('leftEar');
            const rEar = mesh.getObjectByName('rightEar');

            if (!isMoving) {
                if (lArm) lArm.rotation.x = 0;
                if (rArm) rArm.rotation.x = 0;
                if (lLeg) lLeg.rotation.x = 0;
                if (rLeg) rLeg.rotation.x = 0;
                if (lEar) lEar.rotation.z = 0.52 + Math.sin(age * 2) * 0.05;
                if (rEar) rEar.rotation.z = -0.52 - Math.sin(age * 2) * 0.05;
            } else {
                const swing = Math.sin(age * 8) * 0.5;
                if (lArm) lArm.rotation.x = swing;
                if (rArm) rArm.rotation.x = -swing;
                if (lLeg) lLeg.rotation.x = -swing;
                if (rLeg) rLeg.rotation.x = swing;
                if (lEar) lEar.rotation.z = 0.52 + Math.sin(age * 12) * 0.12;
                if (rEar) rEar.rotation.z = -0.52 - Math.sin(age * 12) * 0.12;
            }
        }
    },
    CREEPER: {
        name: 'Creeper', health: 20, damage: 25, speed: 2.2, hostile: true, color: 0x44cc44,
        size: 0.85, xpDrop: 5, lootChance: 0.5,
        buildMesh: () => {
            const group = new THREE.Group();
            // Torso: 8x12x4 -> (0.50, 0.75, 0.25), UV: { u: 16, v: 16, w: 8, h: 12, d: 4 }
            const bodyGeo = new THREE.BoxGeometry(0.50, 0.75, 0.25);
            const bodyMats = getMobBoxMaterials('CREEPER', { u: 16, v: 16, w: 8, h: 12, d: 4 }, { part: 'body' });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.set(0, 0.75, 0);
            body.name = 'body';
            body.castShadow = true;
            group.add(body);

            // Head: 8x8x8 -> (0.50, 0.50, 0.50), UV: { u: 0, v: 0, w: 8, h: 8, d: 8 }
            const headGeo = new THREE.BoxGeometry(0.50, 0.50, 0.50);
            const headMats = getMobBoxMaterials('CREEPER', { u: 0, v: 0, w: 8, h: 8, d: 8 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 1.375, 0);
            head.name = 'head';
            head.castShadow = true;
            group.add(head);

            // 4 short stubby textured feet: 4x6x4 -> (0.25, 0.375, 0.25), UV: { u: 0, v: 16, w: 4, h: 6, d: 4 }
            const legGeo = new THREE.BoxGeometry(0.25, 0.375, 0.25);
            const legMats = getMobBoxMaterials('CREEPER', { u: 0, v: 16, w: 4, h: 6, d: 4 }, { part: 'leg' });

            const legFL = new THREE.Mesh(legGeo, legMats);
            legFL.position.set(-0.13, 0.1875, 0.13);
            legFL.name = 'leg_fl';
            legFL.castShadow = true;
            group.add(legFL);

            const legFR = new THREE.Mesh(legGeo, legMats);
            legFR.position.set(0.13, 0.1875, 0.13);
            legFR.name = 'leg_fr';
            legFR.castShadow = true;
            group.add(legFR);

            const legBL = new THREE.Mesh(legGeo, legMats);
            legBL.position.set(-0.13, 0.1875, -0.13);
            legBL.name = 'leg_bl';
            legBL.castShadow = true;
            group.add(legBL);

            const legBR = new THREE.Mesh(legGeo, legMats);
            legBR.position.set(0.13, 0.1875, -0.13);
            legBR.name = 'leg_br';
            legBR.castShadow = true;
            group.add(legBR);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const legFL = mesh.getObjectByName('leg_fl');
            const legFR = mesh.getObjectByName('leg_fr');
            const legBL = mesh.getObjectByName('leg_bl');
            const legBR = mesh.getObjectByName('leg_br');
            if (isMoving) {
                // Classic Creeper opposing leg walk cycle
                const swing = Math.sin(age * 8) * 0.45;
                if (legFL) legFL.rotation.x = swing;
                if (legFR) legFR.rotation.x = -swing;
                if (legBL) legBL.rotation.x = -swing;
                if (legBR) legBR.rotation.x = swing;
            } else {
                if (legFL) legFL.rotation.x = 0;
                if (legFR) legFR.rotation.x = 0;
                if (legBL) legBL.rotation.x = 0;
                if (legBR) legBR.rotation.x = 0;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.fuseTimer) mob.fuseTimer = 0;
            if (!mob.isFusing) mob.isFusing = false;

            const dist = mob.position.distanceTo(playerPos);
            // If close to player, start swelling and hissing fuse countdown
            if (dist < 3.2) {
                mob.isFusing = true;
                mob.velocity.x *= 0.5;
                mob.velocity.z *= 0.5;
                mob.fuseTimer += dt;

                // Swell and flash white
                if (mob.mesh) {
                    const swell = 1.0 + (mob.fuseTimer / 1.5) * 0.35;
                    mob.mesh.scale.set(swell, swell, swell);
                    // Flash emissive
                    const flash = Math.sin(mob.fuseTimer * 20) > 0 ? 0.6 : 0.0;
                    mob.mesh.traverse(child => {
                        if (child.isMesh && child.material && child.material.emissive) {
                            child.material.emissive.setHex(0xffffff);
                            child.material.emissiveIntensity = flash;
                        }
                    });
                }

                // Explode when fuse completes
                if (mob.fuseTimer >= 1.5) {
                    mob.alive = false;
                    // Explosion damage to player if in range
                    if (dist < 6) {
                        const dmg = Math.round(35 * (1 - dist / 6));
                        if (world && world.damagePlayer) world.damagePlayer(dmg);
                    }
                    // Destroy blocks in small radius
                    if (world && world.setBlock) {
                        const bx = Math.floor(mob.position.x);
                        const by = Math.floor(mob.position.y);
                        const bz = Math.floor(mob.position.z);
                        for (let dx = -2; dx <= 2; dx++) {
                            for (let dy = -1; dy <= 2; dy++) {
                                for (let dz = -2; dz <= 2; dz++) {
                                    if (dx*dx + dy*dy + dz*dz <= 6) {
                                        const b = world.getBlock(bx + dx, by + dy, bz + dz);
                                        if (b !== BLOCKS.BEDROCK && b !== BLOCKS.AIR) {
                                            world.setBlock(bx + dx, by + dy, bz + dz, BLOCKS.AIR);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return;
                }
            } else {
                // If player fled, defuse and return to normal scale
                if (mob.isFusing) {
                    mob.fuseTimer = Math.max(0, mob.fuseTimer - dt * 2);
                    if (mob.fuseTimer <= 0) {
                        mob.isFusing = false;
                        if (mob.mesh) {
                            mob.mesh.scale.set(1, 1, 1);
                            mob.mesh.traverse(child => {
                                if (child.isMesh && child.material && child.material.emissive) {
                                    child.material.emissive.setHex(0x000000);
                                    child.material.emissiveIntensity = 0;
                                }
                            });
                        }
                    }
                }

                // Approach player
                if (dist < 16) {
                    const dir = _tempVec3.subVectors(playerPos, mob.position);
                    dir.y = 0;
                    if (dir.lengthSq() > 0) dir.normalize();
                    mob.velocity.x = dir.x * mob.speed;
                    mob.velocity.z = dir.z * mob.speed;
                    if (mob.mesh) mob.mesh.rotation.y = Math.atan2(dir.x, dir.z);
                } else {
                    // Wander
                    mob.velocity.x *= 0.8;
                    mob.velocity.z *= 0.8;
                }
            }
        }
    },
    ENDERMAN: {
        name: 'Enderman', health: 40, damage: 7, speed: 3.5, hostile: false, color: 0x161616,
        size: 1.2, xpDrop: 10, lootChance: 0.6,
        buildMesh: () => {
            const group = new THREE.Group();
            // Torso (tall and thin)
            const bodyGeo = new THREE.BoxGeometry(0.35, 0.7, 0.2);
            const body = createBodyPart(bodyGeo, 'ENDERMAN', 0, 0, 'body');
            body.position.y = 1.85;
            body.name = 'body';
            group.add(body);

            // Head (at y = 2.4)
            const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
            const head = createMobHead(headGeo, 'ENDERMAN');
            head.position.set(0, 2.38, 0);
            head.name = 'head';
            group.add(head);

            // Long thin arms
            const armGeo = new THREE.BoxGeometry(0.08, 1.35, 0.08);
            const la = createBodyPart(armGeo, 'ENDERMAN', 0, 0, 'arm');
            la.position.set(-0.24, 1.5, 0);
            la.name = 'leftArm';
            group.add(la);

            const ra = createBodyPart(armGeo, 'ENDERMAN', 0, 0, 'arm');
            ra.position.set(0.24, 1.5, 0);
            ra.name = 'rightArm';
            group.add(ra);

            // Long thin legs
            const legGeo = new THREE.BoxGeometry(0.08, 1.5, 0.08);
            const ll = createBodyPart(legGeo, 'ENDERMAN', 0, 0, 'leg');
            ll.position.set(-0.1, 0.75, 0);
            ll.name = 'leftLeg';
            group.add(ll);

            const rl = createBodyPart(legGeo, 'ENDERMAN', 0, 0, 'leg');
            rl.position.set(0.1, 0.75, 0);
            rl.name = 'rightLeg';
            group.add(rl);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const la = mesh.getObjectByName('leftArm');
            const ra = mesh.getObjectByName('rightArm');
            const ll = mesh.getObjectByName('leftLeg');
            const rl = mesh.getObjectByName('rightLeg');
            const head = mesh.getObjectByName('head');

            if (isMoving) {
                const swing = Math.sin(age * 6) * 0.4;
                if (la) la.rotation.x = swing;
                if (ra) ra.rotation.x = -swing;
                if (ll) ll.rotation.x = -swing * 0.8;
                if (rl) rl.rotation.x = swing * 0.8;
            } else {
                if (la) la.rotation.x *= 0.9;
                if (ra) ra.rotation.x *= 0.9;
                if (ll) ll.rotation.x *= 0.9;
                if (rl) rl.rotation.x *= 0.9;
            }

            // Head vibrating / mouth opening when aggroed
            if (mesh.userData && mesh.userData.aggro && head) {
                head.position.x = (Math.random() - 0.5) * 0.03;
                head.position.z = (Math.random() - 0.5) * 0.03;
            } else if (head) {
                head.position.x = 0;
                head.position.z = 0;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.teleportTimer) mob.teleportTimer = 0;
            const dist = mob.position.distanceTo(playerPos);
            
            // Check if player attacked or got very close
            const isAggro = mob.health < mob.maxHealth || dist < 8;
            if (mob.mesh) mob.mesh.userData.aggro = isAggro;

            mob.teleportTimer -= dt;

            // Teleport randomly if in water or periodically when fighting
            const currentBlock = world ? world.getBlock(Math.floor(mob.position.x), Math.floor(mob.position.y), Math.floor(mob.position.z)) : 0;
            if (currentBlock === BLOCKS.WATER || (isAggro && mob.teleportTimer <= 0 && Math.random() < 0.25)) {
                mob.teleportTimer = 3 + Math.random() * 4;
                // Find random target location within 14 blocks
                const angle = Math.random() * Math.PI * 2;
                const r = 4 + Math.random() * 10;
                const tx = mob.position.x + Math.cos(angle) * r;
                const tz = mob.position.z + Math.sin(angle) * r;
                // Find ground level
                let ty = Math.floor(mob.position.y);
                if (world) {
                    for (let y = Math.min(CHUNK_HEIGHT - 2, ty + 5); y >= Math.max(1, ty - 10); y--) {
                        const b = world.getBlock(Math.floor(tx), y, Math.floor(tz));
                        const bAbove1 = world.getBlock(Math.floor(tx), y + 1, Math.floor(tz));
                        const bAbove2 = world.getBlock(Math.floor(tx), y + 2, Math.floor(tz));
                        const bAbove3 = world.getBlock(Math.floor(tx), y + 3, Math.floor(tz));
                        if (getBlockProperties(b).solid && bAbove1 === BLOCKS.AIR && bAbove2 === BLOCKS.AIR && bAbove3 === BLOCKS.AIR) {
                            mob.position.set(tx, y + 1, tz);
                            mob.velocity.set(0, 0, 0);
                            break;
                        }
                    }
                }
            }

            if (isAggro && dist > 1.8) {
                const dir = _tempVec3.subVectors(playerPos, mob.position);
                dir.y = 0;
                if (dir.lengthSq() > 0) dir.normalize();
                mob.velocity.x = dir.x * mob.speed;
                mob.velocity.z = dir.z * mob.speed;
                if (mob.mesh) mob.mesh.rotation.y = Math.atan2(dir.x, dir.z);
            } else if (!isAggro) {
                mob.velocity.x *= 0.8;
                mob.velocity.z *= 0.8;
            }
        }
    },
    SKELETON: {
        name: 'Skeleton', health: 30, damage: 8, speed: 3, hostile: true, color: 0xddddcc,
        size: 0.8, xpDrop: 15, lootChance: 0.6,
        buildMesh: () => {
            const group = new THREE.Group();
            // Ribcage/body
            const body = createBodyPart(new THREE.BoxGeometry(0.35, 0.45, 0.2), 'SKELETON', 0, 0, 'body');
            body.position.y = 0.8;
            group.add(body);
            // Skull
            const skull = createMobHead(new THREE.BoxGeometry(0.35, 0.35, 0.35), 'SKELETON');
            skull.position.set(0, 1.2, 0);
            skull.name = 'head';
            group.add(skull);
            // Arms (thin bones)
            const armGeo = new THREE.BoxGeometry(0.08, 0.5, 0.08);
            const la = createBodyPart(armGeo, 'SKELETON', 0, 0, 'arm');
            la.position.set(-0.28, 0.65, 0);
            la.name = 'leftArm';
            group.add(la);
            const ra = createBodyPart(armGeo, 'SKELETON', 0, 0, 'arm');
            ra.position.set(0.28, 0.65, 0);
            ra.name = 'rightArm';
            group.add(ra);
            // Legs (thin bones)
            const legGeo = new THREE.BoxGeometry(0.08, 0.45, 0.08);
            const ll = createBodyPart(legGeo, 'SKELETON', 0, 0, 'leg');
            ll.position.set(-0.1, 0.25, 0);
            ll.name = 'leftLeg';
            group.add(ll);
            const rl = createBodyPart(legGeo, 'SKELETON', 0, 0, 'leg');
            rl.position.set(0.1, 0.25, 0);
            rl.name = 'rightLeg';
            group.add(rl);
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            if (isMoving) {
                const swing = Math.sin(age * 8) * 0.5;
                mesh.getObjectByName('leftArm').rotation.x = swing;
                mesh.getObjectByName('rightArm').rotation.x = -swing;
                mesh.getObjectByName('leftLeg').rotation.x = -swing * 0.7;
                mesh.getObjectByName('rightLeg').rotation.x = swing * 0.7;
            } else {
                mesh.rotation.z = Math.sin(age * 1.5) * 0.02;
                mesh.getObjectByName('leftArm').rotation.x *= 0.9;
                mesh.getObjectByName('rightArm').rotation.x *= 0.9;
                mesh.getObjectByName('leftLeg').rotation.x *= 0.9;
                mesh.getObjectByName('rightLeg').rotation.x *= 0.9;
            }
        }
    },
    SPIDER: {
        name: 'Spider', health: 18, damage: 4, speed: 5, hostile: true, color: 0x332222,
        size: 0.7, xpDrop: 8, lootChance: 0.35,
        buildMesh: () => {
            const group = new THREE.Group();
            // Abdomen (dark bulbous rear)
            const abdomen = createBodyPart(new THREE.BoxGeometry(0.5, 0.4, 0.6), 'SPIDER', 0, 0, 'body');
            abdomen.position.set(0, 0.32, -0.32);
            abdomen.name = 'abdomen';
            group.add(abdomen);
            // Cephalothorax / Head with 8 glowing eyes on front face
            const head = createMobHead(new THREE.BoxGeometry(0.38, 0.28, 0.38), 'SPIDER');
            head.position.set(0, 0.3, 0.16);
            head.name = 'head';
            group.add(head);
            // 8 legs
            const legGeo = new THREE.BoxGeometry(0.06, 0.06, 0.45);
            for (let side = -1; side <= 1; side += 2) {
                for (let i = 0; i < 4; i++) {
                    const leg = createBodyPart(legGeo, 'SPIDER', 0, 0, 'leg');
                    const zOff = -0.15 + i * 0.12;
                    leg.position.set(side * 0.32, 0.22, zOff);
                    leg.rotation.y = side * 0.3;
                    leg.rotation.z = side * -0.7;
                    leg.name = `leg_${side > 0 ? 'r' : 'l'}_${i}`;
                    group.add(leg);
                }
            }
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            if (isMoving) {
                for (let s = 0; s < 2; s++) {
                    const side = s === 0 ? 'l' : 'r';
                    for (let i = 0; i < 4; i++) {
                        const leg = mesh.getObjectByName(`leg_${side}_${i}`);
                        if (leg) {
                            const phase = (i + s * 2) * Math.PI / 4;
                            leg.rotation.x = Math.sin(age * 15 + phase) * 0.4;
                        }
                    }
                }
            }
            const ab = mesh.getObjectByName('abdomen');
            const hd = mesh.getObjectByName('head');
            if (ab) ab.position.y = 0.32 + Math.sin(age * 4) * 0.02;
            if (hd) hd.position.y = 0.3 + Math.sin(age * 4 + 0.5) * 0.02;
        }
    },
    ZOMBIE: {
        name: 'Zombie', health: 40, damage: 7, speed: 2, hostile: true, color: 0x557744,
        size: 0.9, xpDrop: 12, lootChance: 0.4,
        buildMesh: () => {
            const group = new THREE.Group();
            // Torso (cyan t-shirt)
            const body = createBodyPart(new THREE.BoxGeometry(0.45, 0.55, 0.3), 'ZOMBIE', 0, 0, 'body');
            body.position.y = 0.75;
            body.name = 'body';
            group.add(body);
            // Head with zombie face on front
            const head = createMobHead(new THREE.BoxGeometry(0.38, 0.38, 0.38), 'ZOMBIE');
            head.position.set(0, 1.2, 0);
            head.name = 'head';
            group.add(head);
            // Arms (stretched forward zombie-style toward +Z)
            const armGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
            const la = createBodyPart(armGeo, 'ZOMBIE', 0, 0, 'arm');
            la.position.set(-0.32, 0.78, 0.18);
            la.rotation.x = Math.PI / 2.2;
            la.name = 'leftArm';
            group.add(la);
            const ra = createBodyPart(armGeo, 'ZOMBIE', 0, 0, 'arm');
            ra.position.set(0.32, 0.78, 0.18);
            ra.rotation.x = Math.PI / 2.2;
            ra.name = 'rightArm';
            group.add(ra);
            // Legs (indigo pants)
            const legGeo = new THREE.BoxGeometry(0.15, 0.45, 0.15);
            const ll = createBodyPart(legGeo, 'ZOMBIE', 0, 0, 'leg');
            ll.position.set(-0.12, 0.225, 0);
            ll.name = 'leftLeg';
            group.add(ll);
            const rl = createBodyPart(legGeo, 'ZOMBIE', 0, 0, 'leg');
            rl.position.set(0.12, 0.225, 0);
            rl.name = 'rightLeg';
            group.add(rl);
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            if (isMoving) {
                // Slow shamble
                const swing = Math.sin(age * 5) * 0.35;
                const ll = mesh.getObjectByName('leftLeg');
                const rl = mesh.getObjectByName('rightLeg');
                if (ll) ll.rotation.x = -swing;
                if (rl) rl.rotation.x = swing;
                // Arms wobble slightly forward
                const la = mesh.getObjectByName('leftArm');
                const ra = mesh.getObjectByName('rightArm');
                if (la) la.rotation.x = Math.PI / 2.2 + Math.sin(age * 5 + 1) * 0.1;
                if (ra) ra.rotation.x = Math.PI / 2.2 + Math.sin(age * 5) * 0.1;
                // Body sway
                const bd = mesh.getObjectByName('body');
                if (bd) bd.rotation.z = Math.sin(age * 5) * 0.04;
            } else {
                const ll = mesh.getObjectByName('leftLeg');
                const rl = mesh.getObjectByName('rightLeg');
                if (ll) ll.rotation.x *= 0.9;
                if (rl) rl.rotation.x *= 0.9;
            }
        }
    },
    BAT: {
        name: 'Bat', health: 10, damage: 3, speed: 6, hostile: true, color: 0x333333,
        size: 0.4, xpDrop: 4, lootChance: 0.2, flying: true,
        buildMesh: () => {
            const group = new THREE.Group();
            // Body: Box (3, 5, 2) in MC coords -> (0.1875, 0.3125, 0.125)
            // Vanilla MC Bat Body UV: { u: 0, v: 0, w: 3, h: 5, d: 2 }
            const bodyGeo = new THREE.BoxGeometry(0.1875, 0.3125, 0.125);
            const bodyMats = getMobBoxMaterials('BAT', { u: 0, v: 0, w: 3, h: 5, d: 2 }, { part: 'body' });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.set(0, 0.35, 0);
            body.castShadow = true;
            body.name = 'body';
            group.add(body);

            // Head: Box (4, 3, 2) in MC coords -> (0.25, 0.1875, 0.125)
            // Vanilla MC Bat Head UV: { u: 0, v: 7, w: 4, h: 3, d: 2 }
            const headGeo = new THREE.BoxGeometry(0.25, 0.1875, 0.125);
            const headMats = getMobBoxMaterials('BAT', { u: 0, v: 7, w: 4, h: 3, d: 2 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 0.55, 0.02);
            head.name = 'head';
            head.castShadow = true;

            // Ears attached to head: Right Ear UV: { u: 1, v: 15, w: 3, h: 5, d: 1 }, Left Ear UV: { u: 8, v: 15, w: 3, h: 5, d: 1 }
            const earGeo = new THREE.BoxGeometry(0.15, 0.22, 0.02);
            const rEarMats = getMobBoxMaterials('BAT', { u: 1, v: 15, w: 3, h: 5, d: 1 }, { part: 'body' });
            const rightEar = new THREE.Mesh(earGeo, rEarMats);
            rightEar.position.set(-0.12, 0.16, 0);
            head.add(rightEar);
            const lEarMats = getMobBoxMaterials('BAT', { u: 8, v: 15, w: 3, h: 5, d: 1 }, { part: 'body' });
            const leftEar = new THREE.Mesh(earGeo, lEarMats);
            leftEar.position.set(0.12, 0.16, 0);
            head.add(leftEar);

            group.add(head);

            // Left Wing with shoulder hinge
            const lWingGeo = new THREE.BoxGeometry(0.40, 0.40, 0.02);
            lWingGeo.translate(0.20, 0, 0);
            const lWingMats = getMobBoxMaterials('BAT', { u: 12, v: 7, w: 8, h: 8, d: 1 }, { part: 'wing' });
            const leftWing = new THREE.Mesh(lWingGeo, lWingMats);
            leftWing.position.set(0.09, 0.42, 0);
            leftWing.name = 'leftWing';
            leftWing.castShadow = true;
            group.add(leftWing);

            // Right Wing with shoulder hinge
            const rWingGeo = new THREE.BoxGeometry(0.40, 0.40, 0.02);
            rWingGeo.translate(-0.20, 0, 0);
            const rWingMats = getMobBoxMaterials('BAT', { u: 12, v: 0, w: 8, h: 8, d: 1 }, { part: 'wing' });
            const rightWing = new THREE.Mesh(rWingGeo, rWingMats);
            rightWing.position.set(-0.09, 0.42, 0);
            rightWing.name = 'rightWing';
            rightWing.castShadow = true;
            group.add(rightWing);

            // Feet UV: { u: 16, v: 16, w: 3, h: 2, d: 1 }
            const feetGeo = new THREE.BoxGeometry(0.1875, 0.125, 0.02);
            const feetMats = getMobBoxMaterials('BAT', { u: 16, v: 16, w: 3, h: 2, d: 1 }, { part: 'body' });
            const feet = new THREE.Mesh(feetGeo, feetMats);
            feet.position.set(0, 0.15, 0);
            group.add(feet);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            // Wing flapping
            const flapSpeed = isMoving ? 20 : 12;
            const flapAmt = 0.8;
            const lw = mesh.getObjectByName('leftWing');
            const rw = mesh.getObjectByName('rightWing');
            if (lw) lw.rotation.z = Math.sin(age * flapSpeed) * flapAmt;
            if (rw) rw.rotation.z = -Math.sin(age * flapSpeed) * flapAmt;
            // Hover bob
            mesh.position.y += Math.sin(age * 3) * 0.003;
        }
    },
    GOLEM: {
        name: 'Iron Golem', health: 100, damage: 18, speed: 1.6, hostile: false, color: 0xd4cfc5,
        size: 1.4, xpDrop: 25, lootChance: 0.7,
        buildMesh: () => {
            const group = new THREE.Group();

            // Broad upper chest: 18x12x11 -> (1.125, 0.75, 0.6875), UV: { u: 0, v: 40, w: 18, h: 12, d: 11 }
            const chestGeo = new THREE.BoxGeometry(1.125, 0.75, 0.6875);
            const chestMats = getMobBoxMaterials('GOLEM', { u: 0, v: 40, w: 18, h: 12, d: 11 }, { part: 'body' });
            const chest = new THREE.Mesh(chestGeo, chestMats);
            chest.position.set(0, 1.6875, 0);
            chest.name = 'chest';
            chest.castShadow = true;
            group.add(chest);

            // Narrow lower torso / waist: 9x5x6 -> (0.5625, 0.3125, 0.375), UV: { u: 0, v: 70, w: 9, h: 5, d: 6 }
            const lowerGeo = new THREE.BoxGeometry(0.5625, 0.3125, 0.375);
            const lowerMats = getMobBoxMaterials('GOLEM', { u: 0, v: 70, w: 9, h: 5, d: 6 }, { part: 'body' });
            const lower = new THREE.Mesh(lowerGeo, lowerMats);
            lower.position.set(0, 1.15625, 0);
            lower.name = 'lower';
            lower.castShadow = true;
            group.add(lower);

            // Head: 8x10x8 -> (0.50, 0.625, 0.50), UV: { u: 0, v: 0, w: 8, h: 10, d: 8 }
            const headGeo = new THREE.BoxGeometry(0.50, 0.625, 0.50);
            const headMats = getMobBoxMaterials('GOLEM', { u: 0, v: 0, w: 8, h: 10, d: 8 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 2.375, 0.05);
            head.name = 'head';
            head.castShadow = true;

            // Protruding 3D Nose: 2x4x2 -> (0.125, 0.25, 0.125), UV: { u: 24, v: 0, w: 2, h: 4, d: 2 }
            const noseGeo = new THREE.BoxGeometry(0.125, 0.25, 0.125);
            const noseMats = getMobBoxMaterials('GOLEM', { u: 24, v: 0, w: 2, h: 4, d: 2 }, { part: 'head_front' });
            const nose = new THREE.Mesh(noseGeo, noseMats);
            nose.position.set(0, -0.08, 0.3125);
            nose.castShadow = true;
            head.add(nose);

            group.add(head);

            // Massive swinging arms: 4x30x6 -> (0.25, 1.875, 0.375)
            // Left Arm: UV: { u: 60, v: 58, w: 4, h: 30, d: 6 }
            const armGeo = new THREE.BoxGeometry(0.25, 1.875, 0.375);
            const laMats = getMobBoxMaterials('GOLEM', { u: 60, v: 58, w: 4, h: 30, d: 6 }, { part: 'arm' });
            const la = new THREE.Mesh(armGeo, laMats);
            la.position.set(-0.6875, 1.45, 0);
            la.name = 'leftArm';
            la.castShadow = true;
            group.add(la);

            // Right Arm: UV: { u: 60, v: 21, w: 4, h: 30, d: 6 }
            const raMats = getMobBoxMaterials('GOLEM', { u: 60, v: 21, w: 4, h: 30, d: 6 }, { part: 'arm' });
            const ra = new THREE.Mesh(armGeo, raMats);
            ra.position.set(0.6875, 1.45, 0);
            ra.name = 'rightArm';
            ra.castShadow = true;
            group.add(ra);

            // Heavy legs: 6x16x5 -> (0.375, 1.0, 0.3125)
            // Left Leg: UV: { u: 60, v: 0, w: 6, h: 16, d: 5 }
            const legGeo = new THREE.BoxGeometry(0.375, 1.0, 0.3125);
            const llMats = getMobBoxMaterials('GOLEM', { u: 60, v: 0, w: 6, h: 16, d: 5 }, { part: 'leg' });
            const ll = new THREE.Mesh(legGeo, llMats);
            ll.position.set(-0.25, 0.50, 0);
            ll.name = 'leftLeg';
            ll.castShadow = true;
            group.add(ll);

            // Right Leg: UV: { u: 37, v: 0, w: 6, h: 16, d: 5 }
            const rlMats = getMobBoxMaterials('GOLEM', { u: 37, v: 0, w: 6, h: 16, d: 5 }, { part: 'leg' });
            const rl = new THREE.Mesh(legGeo, rlMats);
            rl.position.set(0.25, 0.50, 0);
            rl.name = 'rightLeg';
            rl.castShadow = true;
            group.add(rl);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const la = mesh.getObjectByName('leftArm');
            const ra = mesh.getObjectByName('rightArm');
            const ll = mesh.getObjectByName('leftLeg');
            const rl = mesh.getObjectByName('rightLeg');

            if (isMoving) {
                const swing = Math.sin(age * 4.5) * 0.4;
                if (la) la.rotation.x = swing;
                if (ra) ra.rotation.x = -swing;
                if (ll) ll.rotation.x = -swing * 0.7;
                if (rl) rl.rotation.x = swing * 0.7;
                mesh.position.y += Math.abs(Math.sin(age * 4.5)) * 0.02; // heavy stomp
            } else {
                if (la) la.rotation.x *= 0.9;
                if (ra) ra.rotation.x *= 0.9;
                if (ll) ll.rotation.x *= 0.9;
                if (rl) rl.rotation.x *= 0.9;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();

            // Neutral AI: only attacks if provoked (health decreased)
            if (mob.health < mob.maxHealth) {
                const dist = mob.position.distanceTo(playerPos);
                if (dist > 1.8) {
                    const dir = _tempVec3.subVectors(playerPos, mob.position);
                    dir.y = 0;
                    if (dir.lengthSq() > 0) dir.normalize();
                    mob.velocity.x = dir.x * mob.speed * 1.5;
                    mob.velocity.z = dir.z * mob.speed * 1.5;
                    if (mob.mesh) mob.mesh.rotation.y = Math.atan2(dir.x, dir.z);
                } else {
                    mob.velocity.x = 0;
                    mob.velocity.z = 0;
                }
            } else {
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    if (Math.random() < 0.3) {
                        mob.wanderTimer = 2 + Math.random() * 4;
                        const angle = Math.random() * Math.PI * 2;
                        mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                    } else {
                        mob.wanderTimer = 3 + Math.random() * 5;
                        mob.wanderDir.set(0, 0, 0);
                    }
                }
                mob.velocity.x = mob.wanderDir.x * mob.speed * 0.4;
                mob.velocity.z = mob.wanderDir.z * mob.speed * 0.4;
                if (mob.wanderDir.lengthSq() > 0 && mob.mesh) mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
            }
        }
    },
    WARDEN: {
        name: 'Warden', health: 500, damage: 30, speed: 1.4, hostile: true, color: 0x0f2b35,
        size: 1.6, xpDrop: 50, lootChance: 1.0,
        buildMesh: () => {
            const group = new THREE.Group();

            // Broad Sculk Torso / Chest: 18x21x11 -> (1.125, 1.3125, 0.6875), UV: { u: 0, v: 0, w: 18, h: 21, d: 11 }
            const chestGeo = new THREE.BoxGeometry(1.125, 1.3125, 0.6875);
            const chestMats = getMobBoxMaterials('WARDEN', { u: 0, v: 0, w: 18, h: 21, d: 11 }, { part: 'body' });
            const chest = new THREE.Mesh(chestGeo, chestMats);
            chest.position.set(0, 1.65, 0);
            chest.name = 'chest';
            chest.castShadow = true;
            group.add(chest);

            // Glowing Pulsing Soul Heart in torso
            const heartGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
            const heartMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.85 });
            const heart = new THREE.Mesh(heartGeo, heartMat);
            heart.position.set(0, 0, 0.2);
            heart.name = 'heart';
            chest.add(heart);

            // Massive Eyeless Head: 16x16x16 -> (1.0, 1.0, 1.0), UV: { u: 0, v: 32, w: 16, h: 16, d: 16 }
            const headGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
            const headMats = getMobBoxMaterials('WARDEN', { u: 0, v: 32, w: 16, h: 16, d: 16 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 2.7, 0);
            head.name = 'head';
            head.castShadow = true;

            // Left Tendril (Sculk antenna that vibrates): 16x16 plane/box -> (0.06, 0.85, 0.85)
            const tendrilGeo = new THREE.BoxGeometry(0.06, 0.85, 0.85);
            const ltMats = getMobBoxMaterials('WARDEN', { u: 58, v: 0, w: 16, h: 16, d: 1 }, { part: 'tendril' });
            const leftTendril = new THREE.Mesh(tendrilGeo, ltMats);
            leftTendril.position.set(-0.52, 0.35, 0);
            leftTendril.name = 'leftTendril';
            head.add(leftTendril);

            // Right Tendril:
            const rtMats = getMobBoxMaterials('WARDEN', { u: 52, v: 32, w: 16, h: 16, d: 1 }, { part: 'tendril' });
            const rightTendril = new THREE.Mesh(tendrilGeo, rtMats);
            rightTendril.position.set(0.52, 0.35, 0);
            rightTendril.name = 'rightTendril';
            head.add(rightTendril);

            group.add(head);

            // Massive Heavy Arms: 8x28x8 -> (0.5, 1.75, 0.5)
            // Left Arm: UV: { u: 0, v: 64, w: 8, h: 28, d: 8 }
            const armGeo = new THREE.BoxGeometry(0.5, 1.75, 0.5);
            const laMats = getMobBoxMaterials('WARDEN', { u: 0, v: 64, w: 8, h: 28, d: 8 }, { part: 'arm' });
            const la = new THREE.Mesh(armGeo, laMats);
            la.position.set(-0.85, 1.45, 0);
            la.name = 'leftArm';
            la.castShadow = true;
            group.add(la);

            // Right Arm: UV: { u: 44, v: 50, w: 8, h: 28, d: 8 }
            const raMats = getMobBoxMaterials('WARDEN', { u: 44, v: 50, w: 8, h: 28, d: 8 }, { part: 'arm' });
            const ra = new THREE.Mesh(armGeo, raMats);
            ra.position.set(0.85, 1.45, 0);
            ra.name = 'rightArm';
            ra.castShadow = true;
            group.add(ra);

            // Sturdy Legs: 6x13x6 -> (0.375, 0.8125, 0.375)
            // Left Leg: UV: { u: 76, v: 40, w: 6, h: 13, d: 6 }
            const legGeo = new THREE.BoxGeometry(0.375, 0.8125, 0.375);
            const llMats = getMobBoxMaterials('WARDEN', { u: 76, v: 40, w: 6, h: 13, d: 6 }, { part: 'leg' });
            const ll = new THREE.Mesh(legGeo, llMats);
            ll.position.set(-0.35, 0.41, 0);
            ll.name = 'leftLeg';
            ll.castShadow = true;
            group.add(ll);

            // Right Leg: UV: { u: 76, v: 76, w: 6, h: 13, d: 6 }
            const rlMats = getMobBoxMaterials('WARDEN', { u: 76, v: 76, w: 6, h: 13, d: 6 }, { part: 'leg' });
            const rl = new THREE.Mesh(legGeo, rlMats);
            rl.position.set(0.35, 0.41, 0);
            rl.name = 'rightLeg';
            rl.castShadow = true;
            group.add(rl);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const chest = mesh.getObjectByName('chest');
            const heart = mesh.getObjectByName('heart');
            const lt = mesh.getObjectByName('leftTendril');
            const rt = mesh.getObjectByName('rightTendril');
            const la = mesh.getObjectByName('leftArm');
            const ra = mesh.getObjectByName('rightArm');
            const ll = mesh.getObjectByName('leftLeg');
            const rl = mesh.getObjectByName('rightLeg');

            // 1. Tendril wiggles / vibrations
            if (lt) lt.rotation.z = Math.sin(age * 12) * 0.18 + Math.sin(age * 4.5) * 0.08;
            if (rt) rt.rotation.z = -Math.sin(age * 12 + 1) * 0.18 - Math.sin(age * 4.5 + 1) * 0.08;

            // 2. Heartbeat pulsing
            if (heart) {
                const pulse = Math.pow(Math.max(0, Math.sin(age * 3.5)), 4);
                heart.scale.setScalar(1.0 + pulse * 0.4);
                if (heart.material) {
                    heart.material.opacity = 0.5 + pulse * 0.5;
                }
            }

            // 3. Heavy breathing
            if (chest) {
                const breath = Math.sin(age * 2.0) * 0.03;
                chest.scale.set(1.0 + breath, 1.0 + breath * 0.5, 1.0 + breath);
            }

            // 4. Stride / Arm swing
            if (isMoving) {
                const swing = Math.sin(age * 4.0) * 0.45;
                if (la) la.rotation.x = swing;
                if (ra) ra.rotation.x = -swing;
                if (ll) ll.rotation.x = -swing * 0.6;
                if (rl) rl.rotation.x = swing * 0.6;
                mesh.position.y += Math.abs(Math.sin(age * 4.0)) * 0.03;
            } else {
                if (la) la.rotation.x *= 0.9;
                if (ra) ra.rotation.x *= 0.9;
                if (ll) ll.rotation.x *= 0.9;
                if (rl) rl.rotation.x *= 0.9;
            }
        }
    },
    VILLAGER: {
        name: 'Villager', health: 20, damage: 0, speed: 1.0, hostile: false, color: 0xbd8b72,
        size: 0.8, xpDrop: 2, lootChance: 0.1,
        buildMesh: () => {
            const group = new THREE.Group();

            // Head: 8x10x8 -> (0.50, 0.625, 0.50), UV: { u: 0, v: 0, w: 8, h: 10, d: 8 }
            const headGeo = new THREE.BoxGeometry(0.50, 0.625, 0.50);
            const headMats = getMobBoxMaterials('VILLAGER', { u: 0, v: 0, w: 8, h: 10, d: 8 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 1.625, 0);
            head.name = 'head';
            head.castShadow = true;

            // Long 3D Protruding Nose: 2x4x2 -> (0.125, 0.25, 0.125), UV: { u: 24, v: 0, w: 2, h: 4, d: 2 }
            const noseGeo = new THREE.BoxGeometry(0.125, 0.25, 0.125);
            const noseMats = getMobBoxMaterials('VILLAGER', { u: 24, v: 0, w: 2, h: 4, d: 2 }, { part: 'head_front' });
            const nose = new THREE.Mesh(noseGeo, noseMats);
            nose.position.set(0, -0.08, 0.3125);
            nose.castShadow = true;
            head.add(nose);
            group.add(head);

            // Robe / Body: 8x12x6 -> (0.50, 0.75, 0.375), UV: { u: 16, v: 20, w: 8, h: 12, d: 6 }
            const bodyGeo = new THREE.BoxGeometry(0.50, 0.75, 0.375);
            const bodyMats = getMobBoxMaterials('VILLAGER', { u: 16, v: 20, w: 8, h: 12, d: 6 }, { part: 'body' });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.set(0, 0.9375, 0);
            body.name = 'body';
            body.castShadow = true;
            group.add(body);

            // Crossed Arms in front of chest: 8x8x4 -> (0.50, 0.40, 0.25), UV: { u: 40, v: 38, w: 8, h: 8, d: 4 }
            const armsGeo = new THREE.BoxGeometry(0.50, 0.40, 0.25);
            const armsMats = getMobBoxMaterials('VILLAGER', { u: 40, v: 38, w: 8, h: 8, d: 4 }, { part: 'arm' });
            const arms = new THREE.Mesh(armsGeo, armsMats);
            arms.position.set(0, 0.98, 0.22);
            arms.rotation.x = -0.3;
            arms.name = 'arms';
            arms.castShadow = true;
            group.add(arms);

            // Legs under robe: 4x12x4 -> (0.25, 0.65, 0.25)
            const legGeo = new THREE.BoxGeometry(0.25, 0.65, 0.25);
            const llMats = getMobBoxMaterials('VILLAGER', { u: 0, v: 22, w: 4, h: 12, d: 4 }, { part: 'leg' });
            const ll = new THREE.Mesh(legGeo, llMats);
            ll.position.set(-0.13, 0.325, 0);
            ll.name = 'leftLeg';
            ll.castShadow = true;
            group.add(ll);

            const rlMats = getMobBoxMaterials('VILLAGER', { u: 0, v: 22, w: 4, h: 12, d: 4 }, { part: 'leg' });
            const rl = new THREE.Mesh(legGeo, rlMats);
            rl.position.set(0.13, 0.325, 0);
            rl.name = 'rightLeg';
            rl.castShadow = true;
            group.add(rl);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const head = mesh.getObjectByName('head');
            const ll = mesh.getObjectByName('leftLeg');
            const rl = mesh.getObjectByName('rightLeg');

            if (head) {
                head.rotation.y = Math.sin(age * 1.5) * 0.1;
            }

            if (isMoving) {
                const swing = Math.sin(age * 4.5) * 0.4;
                if (ll) ll.rotation.x = swing;
                if (rl) rl.rotation.x = -swing;
            } else {
                if (ll) ll.rotation.x *= 0.85;
                if (rl) rl.rotation.x *= 0.85;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();

            mob.wanderTimer -= dt;
            if (mob.wanderTimer <= 0) {
                if (Math.random() < 0.4) {
                    mob.wanderTimer = 2 + Math.random() * 3;
                    const angle = Math.random() * Math.PI * 2;
                    mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                } else {
                    mob.wanderTimer = 2 + Math.random() * 4;
                    mob.wanderDir.set(0, 0, 0);
                }
            }
            mob.velocity.x = mob.wanderDir.x * mob.speed * 0.6;
            mob.velocity.z = mob.wanderDir.z * mob.speed * 0.6;
            if (mob.wanderDir.lengthSq() > 0 && mob.mesh) {
                mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
            }
        }
    },
    WITCH: {
        name: 'Witch', health: 26, damage: 5, speed: 1.1, hostile: true, color: 0x443152,
        size: 0.85, xpDrop: 5, lootChance: 0.9,
        buildMesh: () => {
            const group = new THREE.Group();

            const headGeo = new THREE.BoxGeometry(0.50, 0.625, 0.50);
            const headMats = getMobBoxMaterials('WITCH', { u: 0, v: 0, w: 8, h: 10, d: 8 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 1.625, 0);
            head.name = 'head';
            head.castShadow = true;

            const noseGeo = new THREE.BoxGeometry(0.125, 0.25, 0.125);
            const noseMats = getMobBoxMaterials('WITCH', { u: 24, v: 0, w: 2, h: 4, d: 2 }, { part: 'head_front' });
            const nose = new THREE.Mesh(noseGeo, noseMats);
            nose.position.set(0, -0.08, 0.3125);
            nose.castShadow = true;
            head.add(nose);

            const brimGeo = new THREE.BoxGeometry(0.65, 0.08, 0.65);
            const brimMats = getMobBoxMaterials('WITCH', { u: 0, v: 64, w: 10, h: 2, d: 10 }, { part: 'hat_brim' });
            const brim = new THREE.Mesh(brimGeo, brimMats);
            brim.position.set(0, 0.35, 0);
            head.add(brim);

            const midGeo = new THREE.BoxGeometry(0.44, 0.25, 0.44);
            const midMats = getMobBoxMaterials('WITCH', { u: 0, v: 76, w: 7, h: 4, d: 7 }, { part: 'hat_mid' });
            const mid = new THREE.Mesh(midGeo, midMats);
            mid.position.set(0, 0.50, -0.03);
            mid.rotation.x = -0.15;
            head.add(mid);

            const topGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
            const topMats = getMobBoxMaterials('WITCH', { u: 0, v: 87, w: 4, h: 4, d: 4 }, { part: 'hat_top' });
            const hatTop = new THREE.Mesh(topGeo, topMats);
            hatTop.position.set(0, 0.70, -0.08);
            hatTop.rotation.x = -0.3;
            head.add(hatTop);

            group.add(head);

            const bodyGeo = new THREE.BoxGeometry(0.50, 0.75, 0.375);
            const bodyMats = getMobBoxMaterials('WITCH', { u: 16, v: 20, w: 8, h: 12, d: 6 }, { part: 'body' });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.set(0, 0.9375, 0);
            body.name = 'body';
            body.castShadow = true;
            group.add(body);

            const armsGeo = new THREE.BoxGeometry(0.50, 0.40, 0.25);
            const armsMats = getMobBoxMaterials('WITCH', { u: 40, v: 38, w: 8, h: 8, d: 4 }, { part: 'arm' });
            const arms = new THREE.Mesh(armsGeo, armsMats);
            arms.position.set(0, 0.98, 0.22);
            arms.rotation.x = -0.3;
            arms.name = 'arms';
            arms.castShadow = true;
            group.add(arms);

            const legGeo = new THREE.BoxGeometry(0.25, 0.65, 0.25);
            const llMats = getMobBoxMaterials('WITCH', { u: 0, v: 22, w: 4, h: 12, d: 4 }, { part: 'leg' });
            const ll = new THREE.Mesh(legGeo, llMats);
            ll.position.set(-0.13, 0.325, 0);
            ll.name = 'leftLeg';
            ll.castShadow = true;
            group.add(ll);

            const rlMats = getMobBoxMaterials('WITCH', { u: 0, v: 22, w: 4, h: 12, d: 4 }, { part: 'leg' });
            const rl = new THREE.Mesh(legGeo, rlMats);
            rl.position.set(0.13, 0.325, 0);
            rl.name = 'rightLeg';
            rl.castShadow = true;
            group.add(rl);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const head = mesh.getObjectByName('head');
            const ll = mesh.getObjectByName('leftLeg');
            const rl = mesh.getObjectByName('rightLeg');

            if (head) {
                head.rotation.y = Math.sin(age * 2.0) * 0.12;
            }

            if (isMoving) {
                const swing = Math.sin(age * 4.5) * 0.4;
                if (ll) ll.rotation.x = swing;
                if (rl) rl.rotation.x = -swing;
            } else {
                if (ll) ll.rotation.x *= 0.85;
                if (rl) rl.rotation.x *= 0.85;
            }
        }
    },
    POLAR_BEAR: {
        name: 'Polar Bear', health: 30, damage: 6, speed: 2.2, hostile: false, color: 0xf5f5f0,
        size: 1.4, xpDrop: 5, lootChance: 0.8,
        buildMesh: () => {
            const group = new THREE.Group();
            // Front Body (Chest): Box(12, 12, 10) -> (0.75, 0.75, 0.625)
            const frontGeo = new THREE.BoxGeometry(0.75, 0.75, 0.625);
            const frontMats = getMobBoxMaterials('POLAR_BEAR', { u: 0, v: 19, w: 12, h: 12, l: 10 }, { isBody: true, part: 'body' });
            const frontBody = new THREE.Mesh(frontGeo, frontMats);
            frontBody.position.set(0, 0.95, 0.25);
            frontBody.name = 'frontBody';
            frontBody.castShadow = true;
            group.add(frontBody);

            // Rear Body (Hips): Box(14, 14, 11) -> (0.875, 0.875, 0.6875)
            const rearGeo = new THREE.BoxGeometry(0.875, 0.875, 0.6875);
            const rearMats = getMobBoxMaterials('POLAR_BEAR', { u: 39, v: 0, w: 14, h: 14, l: 11 }, { isBody: true, part: 'body' });
            const rearBody = new THREE.Mesh(rearGeo, rearMats);
            rearBody.position.set(0, 1.0, -0.38);
            rearBody.name = 'rearBody';
            rearBody.castShadow = true;
            group.add(rearBody);

            // Head: Box(7, 7, 9) -> (0.4375, 0.4375, 0.5625)
            const headGeo = new THREE.BoxGeometry(0.4375, 0.4375, 0.5625);
            const headMats = getMobBoxMaterials('POLAR_BEAR', { u: 0, v: 0, w: 7, h: 7, d: 9 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 1.10, 0.70);
            head.name = 'head';
            head.castShadow = true;

            // Snout: Box(5, 3, 3) -> (0.3125, 0.1875, 0.1875)
            const snoutGeo = new THREE.BoxGeometry(0.3125, 0.1875, 0.1875);
            const snoutMats = getMobBoxMaterials('POLAR_BEAR', { u: 0, v: 44, w: 5, h: 3, d: 3 }, { part: 'snout' });
            const snout = new THREE.Mesh(snoutGeo, snoutMats);
            snout.position.set(0, -0.09, 0.35);
            snout.name = 'snout';
            head.add(snout);

            // Ears: Left & Right Box(2, 2, 1) -> (0.125, 0.125, 0.0625)
            const earGeo = new THREE.BoxGeometry(0.125, 0.125, 0.0625);
            const earMats = getMobBoxMaterials('POLAR_BEAR', { u: 26, v: 0, w: 2, h: 2, d: 1 }, { part: 'snout' });
            const leftEar = new THREE.Mesh(earGeo, earMats);
            leftEar.position.set(-0.20, 0.20, -0.05);
            head.add(leftEar);
            const rightEar = new THREE.Mesh(earGeo, earMats);
            rightEar.position.set(0.20, 0.20, -0.05);
            head.add(rightEar);

            group.add(head);

            // 4 Legs: Box(4, 10, 8) -> (0.25, 0.625, 0.5)
            const legGeo = new THREE.BoxGeometry(0.25, 0.625, 0.5);
            const legMats = getMobBoxMaterials('POLAR_BEAR', { u: 50, v: 22, w: 4, h: 10, d: 8 }, { part: 'leg' });
            for (let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(legGeo, legMats);
                const x = (i % 2 === 0 ? -0.32 : 0.32);
                const z = (i < 2 ? 0.25 : -0.42);
                leg.position.set(x, 0.3125, z);
                leg.name = `leg_${i}`;
                leg.castShadow = true;
                group.add(leg);
            }
            return group;
        },
        animate: (mesh, dt, age, isMoving, mob) => {
            const leg0 = mesh.getObjectByName('leg_0');
            const leg1 = mesh.getObjectByName('leg_1');
            const leg2 = mesh.getObjectByName('leg_2');
            const leg3 = mesh.getObjectByName('leg_3');
            const head = mesh.getObjectByName('head');

            const isRearing = mob && mob.isRearing;
            if (isRearing) {
                // Authentic Minecraft Polar Bear rearing up on hind legs when aggressive!
                mesh.rotation.x = -Math.PI * 0.35; // tilts upward ~65 degrees
                if (leg0) leg0.rotation.x = Math.sin(age * 12) * 0.4 - 0.4;
                if (leg1) leg1.rotation.x = -Math.sin(age * 12) * 0.4 - 0.4;
                if (leg2) leg2.rotation.x = Math.PI * 0.35;
                if (leg3) leg3.rotation.x = Math.PI * 0.35;
                if (head) head.rotation.x = Math.PI * 0.30;
            } else {
                mesh.rotation.x = 0;
                if (isMoving) {
                    const s = Math.sin(age * 6) * 0.5;
                    if (leg0) leg0.rotation.x = s;
                    if (leg1) leg1.rotation.x = -s;
                    if (leg2) leg2.rotation.x = -s;
                    if (leg3) leg3.rotation.x = s;
                } else {
                    if (leg0) leg0.rotation.x = 0;
                    if (leg1) leg1.rotation.x = 0;
                    if (leg2) leg2.rotation.x = 0;
                    if (leg3) leg3.rotation.x = 0;
                }
                if (head) {
                    head.rotation.x = Math.sin(age * 1.5) * 0.05;
                    head.rotation.y = Math.sin(age * 0.8) * 0.08;
                }
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            const dist = mob.position.distanceTo(playerPos);
            if (mob.health < mob.maxHealth) {
                mob.isAggressive = true;
                mob.hostile = true;
            }

            if (mob.isAggressive && dist < 16) {
                mob.isRearing = dist < 5.0;
                const toPlayer = new THREE.Vector3().subVectors(playerPos, mob.position).setY(0).normalize();
                mob.velocity.x = toPlayer.x * mob.speed * 1.4;
                mob.velocity.z = toPlayer.z * mob.speed * 1.4;
                if (mob.mesh) {
                    mob.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
                }
                if (!mob.roarTimer) mob.roarTimer = 0;
                mob.roarTimer -= dt;
                if (mob.roarTimer <= 0) {
                    mob.roarTimer = 3.5 + Math.random() * 2;
                    if (window.game && window.game.audio && window.game.audio.playPolarBearRoar) {
                        window.game.audio.playPolarBearRoar(mob.position);
                    }
                }
            } else {
                mob.isRearing = false;
                if (!mob.wanderTimer) mob.wanderTimer = 0;
                if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    if (Math.random() < 0.4) {
                        mob.wanderTimer = 2.5 + Math.random() * 4;
                        const angle = Math.random() * Math.PI * 2;
                        mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                    } else {
                        mob.wanderTimer = 2 + Math.random() * 3;
                        mob.wanderDir.set(0, 0, 0);
                    }
                }
                mob.velocity.x = mob.wanderDir.x * mob.speed * 0.6;
                mob.velocity.z = mob.wanderDir.z * mob.speed * 0.6;
                if (mob.wanderDir.lengthSq() > 0 && mob.mesh) {
                    mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
                }
            }
        }
    },
    SNOW_GOLEM: {
        name: 'Snow Golem', health: 15, damage: 0, speed: 2.0, hostile: false, color: 0xffffff,
        size: 0.8, xpDrop: 3, lootChance: 0.9,
        buildMesh: () => {
            const group = new THREE.Group();
            // Lower body: Box(12, 12, 12) -> (0.75, 0.75, 0.75)
            const baseGeo = new THREE.BoxGeometry(0.75, 0.75, 0.75);
            const baseMats = getMobBoxMaterials('SNOW_GOLEM', { u: 0, v: 36, w: 12, h: 12, d: 12 }, { part: 'leg' });
            const base = new THREE.Mesh(baseGeo, baseMats);
            base.position.set(0, 0.375, 0);
            base.name = 'base';
            base.castShadow = true;
            group.add(base);

            // Upper body: Box(8, 8, 8) -> (0.5, 0.5, 0.5)
            const torsoGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const torsoMats = getMobBoxMaterials('SNOW_GOLEM', { u: 0, v: 16, w: 8, h: 8, d: 8 }, { part: 'body' });
            const torso = new THREE.Mesh(torsoGeo, torsoMats);
            torso.position.set(0, 0.875, 0);
            torso.name = 'torso';
            torso.castShadow = true;
            group.add(torso);

            // Head (Carved Pumpkin): Box(8, 8, 8) -> (0.5, 0.5, 0.5)
            const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const headMats = getMobBoxMaterials('SNOW_GOLEM', { u: 0, v: 0, w: 8, h: 8, d: 8 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 1.375, 0);
            head.name = 'head';
            head.castShadow = true;
            group.add(head);

            // Stick Arms: Box(12, 2, 2) -> (0.6, 0.08, 0.08)
            const armGeo = new THREE.BoxGeometry(0.6, 0.08, 0.08);
            const armMats = getMobBoxMaterials('SNOW_GOLEM', { u: 32, v: 0, w: 12, h: 2, d: 2 }, { part: 'arm' });
            const leftArm = new THREE.Mesh(armGeo, armMats);
            leftArm.position.set(-0.45, 0.95, 0);
            leftArm.rotation.z = 0.4;
            leftArm.name = 'leftArm';
            group.add(leftArm);

            const rightArm = new THREE.Mesh(armGeo, armMats);
            rightArm.position.set(0.45, 0.95, 0);
            rightArm.rotation.z = -0.4;
            rightArm.name = 'rightArm';
            group.add(rightArm);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const head = mesh.getObjectByName('head');
            const leftArm = mesh.getObjectByName('leftArm');
            const rightArm = mesh.getObjectByName('rightArm');
            const base = mesh.getObjectByName('base');
            if (head) {
                head.rotation.y = Math.sin(age * 2) * 0.15;
            }
            if (isMoving) {
                if (base) base.rotation.y = Math.sin(age * 8) * 0.1;
                if (leftArm) leftArm.rotation.x = Math.sin(age * 6) * 0.3;
                if (rightArm) rightArm.rotation.x = -Math.sin(age * 6) * 0.3;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
            mob.wanderTimer -= dt;
            if (mob.wanderTimer <= 0) {
                if (Math.random() < 0.5) {
                    mob.wanderTimer = 2.0 + Math.random() * 3;
                    const angle = Math.random() * Math.PI * 2;
                    mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                } else {
                    mob.wanderTimer = 1.5 + Math.random() * 2;
                    mob.wanderDir.set(0, 0, 0);
                }
            }
            mob.velocity.x = mob.wanderDir.x * mob.speed * 0.7;
            mob.velocity.z = mob.wanderDir.z * mob.speed * 0.7;
            if (mob.wanderDir.lengthSq() > 0 && mob.mesh) {
                mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
            }

            // Gentle cosmetic snow particles when walking (no world block modification, preventing pillar glitches)
            if (mob.velocity.lengthSq() > 0.01 && window.game && window.game.particleSystem) {
                if (Math.random() < 0.12) {
                    window.game.particleSystem.createBlockBreakParticles(
                        mob.position.x, mob.position.y + 0.1, mob.position.z,
                        (window.BLOCKS && window.BLOCKS.SNOW) || 23, 1
                    );
                }
            }
        }
    },
    COD: {
        name: 'Cod', health: 3, damage: 0, speed: 2.2, hostile: false, color: 0xbbbb99,
        size: 0.3, xpDrop: 1, lootChance: 0.1, waterOnly: true,
        buildMesh: () => {
            const group = new THREE.Group();
            // Body: Box (2, 4, 7) in MC coords -> (0.125, 0.25, 0.4375)
            // Vanilla MC Cod Body UV: { u: 0, v: 0, w: 2, h: 4, d: 7 }
            const bodyGeo = new THREE.BoxGeometry(0.125, 0.25, 0.4375);
            const bodyMats = getMobBoxMaterials('COD', { u: 0, v: 0, w: 2, h: 4, d: 7 }, { part: 'body' });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.set(0, 0.2, 0);
            body.castShadow = true;
            group.add(body);

            // Head: Box (2, 4, 3) in MC coords -> (0.125, 0.25, 0.1875)
            // Vanilla MC Cod Head UV: { u: 11, v: 0, w: 2, h: 4, d: 3 }
            const headGeo = new THREE.BoxGeometry(0.125, 0.25, 0.1875);
            const headMats = getMobBoxMaterials('COD', { u: 11, v: 0, w: 2, h: 4, d: 3 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 0.2, 0.31);
            head.castShadow = true;
            group.add(head);

            // Nose: Box (2, 3, 1) in MC coords -> (0.125, 0.1875, 0.0625)
            // Vanilla MC Cod Nose UV: { u: 0, v: 0, w: 2, h: 3, d: 1 }
            const noseGeo = new THREE.BoxGeometry(0.125, 0.1875, 0.0625);
            const noseMats = getMobBoxMaterials('COD', { u: 0, v: 0, w: 2, h: 3, d: 1 }, { part: 'head_front' });
            const nose = new THREE.Mesh(noseGeo, noseMats);
            nose.position.set(0, 0.17, 0.43);
            group.add(nose);

            // Tail fin: Box (0.02, 4, 4) in MC coords -> (0.02, 0.25, 0.25)
            // Vanilla MC Cod Tail Fin UV: { u: 22, v: 3, w: 1, h: 4, d: 4 }
            const tailGeo = new THREE.BoxGeometry(0.02, 0.25, 0.25);
            const tailMats = getMobBoxMaterials('COD', { u: 22, v: 3, w: 1, h: 4, d: 4 }, { part: 'body' });
            const tail = new THREE.Mesh(tailGeo, tailMats);
            tail.position.set(0, 0.2, -0.34);
            tail.name = 'tail';
            group.add(tail);

            // Left & Right pectoral fins
            const finGeo = new THREE.BoxGeometry(0.12, 0.02, 0.12);
            const finMats = getMobBoxMaterials('COD', { u: 22, v: 1, w: 2, h: 1, d: 2 }, { part: 'body' });
            const lf = new THREE.Mesh(finGeo, finMats);
            lf.position.set(0.1, 0.14, 0.12);
            lf.rotation.z = Math.PI / 4;
            lf.name = 'leftFin';
            group.add(lf);
            const rf = new THREE.Mesh(finGeo, finMats);
            rf.position.set(-0.1, 0.14, 0.12);
            rf.rotation.z = -Math.PI / 4;
            rf.name = 'rightFin';
            group.add(rf);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const speed = isMoving ? 30 : 10;
            const tail = mesh.getObjectByName('tail');
            if (tail) tail.rotation.y = Math.sin(age * speed) * 0.4;
            const lf = mesh.getObjectByName('leftFin');
            const rf = mesh.getObjectByName('rightFin');
            if (lf) lf.rotation.x = Math.sin(age * speed) * 0.3;
            if (rf) rf.rotation.x = Math.sin(age * speed + Math.PI) * 0.3;
        }
    },
    TROPICAL_FISH: {
        name: 'Tropical Fish', health: 3, damage: 0, speed: 2.5, hostile: false, color: 0xff8800,
        size: 0.25, xpDrop: 1, lootChance: 0.1, waterOnly: true,
        buildMesh: () => {
            const group = new THREE.Group();
            // Body: Box (2, 3, 6) in MC coords -> (0.125, 0.1875, 0.375)
            // Vanilla MC Tropical Fish Small Body UV: { u: 0, v: 0, w: 2, h: 3, d: 6 }
            const bodyGeo = new THREE.BoxGeometry(0.125, 0.1875, 0.375);
            const bodyMats = getMobBoxMaterials('TROPICAL_FISH', { u: 0, v: 0, w: 2, h: 3, d: 6 }, { part: 'body' });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.set(0, 0.15, 0);
            body.castShadow = true;
            group.add(body);

            // Tail: Box (0.02, 3, 6) in MC coords -> (0.02, 0.1875, 0.375)
            // Vanilla MC Tropical Fish Small Tail UV: { u: 22, v: 0, w: 1, h: 3, d: 6 }
            const tailGeo = new THREE.BoxGeometry(0.02, 0.1875, 0.3);
            const tailMats = getMobBoxMaterials('TROPICAL_FISH', { u: 22, v: 0, w: 1, h: 3, d: 6 }, { part: 'body' });
            const tail = new THREE.Mesh(tailGeo, tailMats);
            tail.position.set(0, 0.15, -0.32);
            tail.name = 'tail';
            group.add(tail);

            // Left & Right fins
            const finGeo = new THREE.BoxGeometry(0.12, 0.12, 0.02);
            const lFinMats = getMobBoxMaterials('TROPICAL_FISH', { u: 2, v: 12, w: 2, h: 2, d: 1 }, { part: 'body' });
            const lf = new THREE.Mesh(finGeo, lFinMats);
            lf.position.set(0.08, 0.12, 0.05);
            lf.rotation.y = -Math.PI / 4;
            lf.name = 'leftFin';
            group.add(lf);

            const rFinMats = getMobBoxMaterials('TROPICAL_FISH', { u: 2, v: 16, w: 2, h: 2, d: 1 }, { part: 'body' });
            const rf = new THREE.Mesh(finGeo, rFinMats);
            rf.position.set(-0.08, 0.12, 0.05);
            rf.rotation.y = Math.PI / 4;
            rf.name = 'rightFin';
            group.add(rf);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const speed = isMoving ? 25 : 8;
            const tail = mesh.getObjectByName('tail');
            if (tail) tail.rotation.y = Math.sin(age * speed) * 0.4;
            const lf = mesh.getObjectByName('leftFin');
            const rf = mesh.getObjectByName('rightFin');
            if (lf) lf.rotation.x = Math.sin(age * speed) * 0.2;
            if (rf) rf.rotation.x = Math.sin(age * speed) * 0.2;
        }
    },

    SALMON: {
        name: 'Salmon', health: 6, damage: 0, speed: 3.5, hostile: false, color: 0xff5555,
        size: 0.4, xpDrop: 3, lootChance: 0.15, waterOnly: true,
        buildMesh: () => {
            const group = new THREE.Group();
            // Body Front: Box (3, 5, 8) in MC coords -> (0.1875, 0.3125, 0.50)
            // Vanilla MC Salmon Body Front UV: { u: 0, v: 0, w: 3, h: 5, d: 8 }
            const frontGeo = new THREE.BoxGeometry(0.1875, 0.3125, 0.50);
            const frontMats = getMobBoxMaterials('SALMON', { u: 0, v: 0, w: 3, h: 5, d: 8 }, { part: 'body' });
            const bodyFront = new THREE.Mesh(frontGeo, frontMats);
            bodyFront.position.set(0, 0.25, 0.1);
            bodyFront.castShadow = true;
            group.add(bodyFront);

            // Head: Box (2, 4, 3) in MC coords -> (0.125, 0.25, 0.1875)
            // Vanilla MC Salmon Head UV: { u: 22, v: 0, w: 2, h: 4, d: 3 }
            const headGeo = new THREE.BoxGeometry(0.125, 0.25, 0.1875);
            const headMats = getMobBoxMaterials('SALMON', { u: 22, v: 0, w: 2, h: 4, d: 3 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 0.25, 0.44);
            head.castShadow = true;
            group.add(head);

            // Body Back (articulated for swimming): Box (3, 5, 8) in MC coords -> (0.1875, 0.3125, 0.50)
            // Vanilla MC Salmon Body Back UV: { u: 0, v: 13, w: 3, h: 5, d: 8 }
            const backGeo = new THREE.BoxGeometry(0.1875, 0.3125, 0.50);
            const backMats = getMobBoxMaterials('SALMON', { u: 0, v: 13, w: 3, h: 5, d: 8 }, { part: 'body' });
            const bodyBack = new THREE.Mesh(backGeo, backMats);
            bodyBack.position.set(0, 0.25, -0.4);
            bodyBack.name = 'tail';
            bodyBack.castShadow = true;

            // Back fin on Body Back: Box (0.02, 5, 6) in MC coords -> (0.02, 0.3125, 0.375)
            // Vanilla MC Salmon Back Fin UV: { u: 20, v: 10, w: 1, h: 5, d: 6 }
            const finGeo = new THREE.BoxGeometry(0.02, 0.3125, 0.375);
            const finMats = getMobBoxMaterials('SALMON', { u: 20, v: 10, w: 1, h: 5, d: 6 }, { part: 'body' });
            const fin = new THREE.Mesh(finGeo, finMats);
            fin.position.set(0, 0, -0.4);
            bodyBack.add(fin);

            group.add(bodyBack);

            // Pectoral fins
            const pFinGeo = new THREE.BoxGeometry(0.12, 0.02, 0.12);
            const pFinMats = getMobBoxMaterials('SALMON', { u: 0, v: 0, w: 2, h: 1, d: 2 }, { part: 'body' });
            const lf = new THREE.Mesh(pFinGeo, pFinMats);
            lf.position.set(0.12, 0.18, 0.2);
            lf.rotation.z = Math.PI / 4;
            lf.name = 'leftFin';
            group.add(lf);
            const rf = new THREE.Mesh(pFinGeo, pFinMats);
            rf.position.set(-0.12, 0.18, 0.2);
            rf.rotation.z = -Math.PI / 4;
            rf.name = 'rightFin';
            group.add(rf);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const speed = isMoving ? 18 : 5;
            const tail = mesh.getObjectByName('tail');
            if (tail) tail.rotation.y = Math.sin(age * speed) * 0.5;
            const lf = mesh.getObjectByName('leftFin');
            const rf = mesh.getObjectByName('rightFin');
            if (lf) lf.rotation.x = Math.sin(age * speed) * 0.2;
            if (rf) rf.rotation.x = Math.sin(age * speed) * 0.2;
        }
    },

    PUFFERFISH: {
        name: 'Pufferfish', health: 4, damage: 2, speed: 1.5, hostile: true, color: 0xffee00,
        size: 0.35, xpDrop: 4, lootChance: 0.2, waterOnly: true,
        buildMesh: () => {
            const group = new THREE.Group();
            // Authentic Minecraft Big Pufferfish Body: Box (8, 8, 8) in MC coords -> (0.50, 0.50, 0.50)
            // Vanilla MC Pufferfish Body UV: { u: 0, v: 0, w: 8, h: 8, d: 8 }
            const bodyGeo = new THREE.BoxGeometry(0.50, 0.50, 0.50);
            const bodyMats = getMobBoxMaterials('PUFFERFISH', { u: 0, v: 0, w: 8, h: 8, d: 8 }, { part: 'body' });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.set(0, 0.35, 0);
            body.name = 'body';
            body.castShadow = true;
            group.add(body);

            // Left & Right blue fins: Box (2, 1, 2) in MC coords -> (0.125, 0.0625, 0.125)
            // Left fin UV: { u: 24, v: 3, w: 2, h: 1, d: 2 }, Right fin UV: { u: 24, v: 0, w: 2, h: 1, d: 2 }
            const finGeo = new THREE.BoxGeometry(0.125, 0.0625, 0.125);
            const lFinMats = getMobBoxMaterials('PUFFERFISH', { u: 24, v: 3, w: 2, h: 1, d: 2 }, { part: 'body' });
            const leftFin = new THREE.Mesh(finGeo, lFinMats);
            leftFin.position.set(0.31, 0.38, 0.12);
            leftFin.name = 'leftFin';
            group.add(leftFin);

            const rFinMats = getMobBoxMaterials('PUFFERFISH', { u: 24, v: 0, w: 2, h: 1, d: 2 }, { part: 'body' });
            const rightFin = new THREE.Mesh(finGeo, rFinMats);
            rightFin.position.set(-0.31, 0.38, 0.12);
            rightFin.name = 'rightFin';
            group.add(rightFin);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const speed = isMoving ? 15 : 4;
            const leftFin = mesh.getObjectByName('leftFin');
            const rightFin = mesh.getObjectByName('rightFin');
            if (leftFin) leftFin.rotation.z = Math.sin(age * speed) * 0.3;
            if (rightFin) rightFin.rotation.z = -Math.sin(age * speed) * 0.3;
            // Puffs up rhythmically when moving
            const body = mesh.getObjectByName('body');
            if (body) {
                const puff = isMoving ? 1.0 + Math.abs(Math.sin(age * 5)) * 0.25 : 1.0;
                body.scale.set(puff, puff, puff);
            }
        }
    },
    TURTLE: {
        name: 'Turtle', health: 30, damage: 0, speed: 1.2, hostile: false, color: 0x228822,
        size: 0.6, xpDrop: 5, lootChance: 0.5,
        buildMesh: () => {
            const group = new THREE.Group();
            // Authentic Minecraft Adult Turtle Shell: Box (19, 6, 20) in MC coords -> (1.1875, 0.375, 1.25) unrotated
            // Vanilla MC Turtle Shell UV: { u: 7, v: 37, w: 19, h: 6, l: 20 }
            const shellGeo = new THREE.BoxGeometry(1.1875, 0.375, 1.25);
            const shellMats = getMobBoxMaterials('TURTLE', { u: 7, v: 37, w: 19, h: 6, l: 20 }, { isBody: true, part: 'body' });
            const shell = new THREE.Mesh(shellGeo, shellMats);
            shell.position.set(0, 0.35, 0);
            shell.castShadow = true;
            group.add(shell);

            // Belly under shell: Box (11, 3, 18) in MC coords -> (0.6875, 0.1875, 1.125)
            // Vanilla MC Turtle Belly UV: { u: 31, v: 1, w: 11, h: 3, l: 18 }
            const bellyGeo = new THREE.BoxGeometry(0.6875, 0.1875, 1.125);
            const bellyMats = getMobBoxMaterials('TURTLE', { u: 31, v: 1, w: 11, h: 3, l: 18 }, { isBody: true, part: 'body' });
            const belly = new THREE.Mesh(bellyGeo, bellyMats);
            belly.position.set(0, 0.15, 0);
            belly.castShadow = true;
            group.add(belly);

            // Head (faces +Z): Box (6, 5, 6) in MC coords -> (0.375, 0.3125, 0.375)
            // Vanilla MC Turtle Head UV: { u: 3, v: 0, w: 6, h: 5, d: 6 }
            const headGeo = new THREE.BoxGeometry(0.375, 0.3125, 0.375);
            const headMats = getMobBoxMaterials('TURTLE', { u: 3, v: 0, w: 6, h: 5, d: 6 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 0.28, 0.75);
            head.name = 'head';
            head.castShadow = true;
            group.add(head);

            // Flippers / Legs:
            // Left Front Leg: Box (13, 1, 5) -> (0.8125, 0.0625, 0.3125), UV: { u: 27, v: 24, w: 13, h: 1, d: 5 }
            const flGeo = new THREE.BoxGeometry(0.8125, 0.0625, 0.3125);
            const lFrontMats = getMobBoxMaterials('TURTLE', { u: 27, v: 24, w: 13, h: 1, d: 5 }, { part: 'leg' });
            const fl2 = new THREE.Mesh(flGeo, lFrontMats);
            fl2.position.set(0.72, 0.16, 0.35);
            fl2.name = 'fl2';
            fl2.castShadow = true;
            group.add(fl2);

            // Right Front Leg: Box (13, 1, 5) -> (0.8125, 0.0625, 0.3125), UV: { u: 27, v: 30, w: 13, h: 1, d: 5 }
            const rFrontMats = getMobBoxMaterials('TURTLE', { u: 27, v: 30, w: 13, h: 1, d: 5 }, { part: 'leg' });
            const fl1 = new THREE.Mesh(flGeo, rFrontMats);
            fl1.position.set(-0.72, 0.16, 0.35);
            fl1.name = 'fl1';
            fl1.castShadow = true;
            group.add(fl1);

            // Hind Legs: Box (4, 1, 10) -> (0.25, 0.0625, 0.625)
            // Left Hind Leg UV: { u: 1, v: 12, w: 4, h: 1, d: 10 }
            const hindGeo = new THREE.BoxGeometry(0.25, 0.0625, 0.625);
            const lHindMats = getMobBoxMaterials('TURTLE', { u: 1, v: 12, w: 4, h: 1, d: 10 }, { part: 'leg' });
            const fl4 = new THREE.Mesh(hindGeo, lHindMats);
            fl4.position.set(0.35, 0.16, -0.72);
            fl4.name = 'fl4';
            fl4.castShadow = true;
            group.add(fl4);

            // Right Hind Leg UV: { u: 1, v: 23, w: 4, h: 1, d: 10 }
            const rHindMats = getMobBoxMaterials('TURTLE', { u: 1, v: 23, w: 4, h: 1, d: 10 }, { part: 'leg' });
            const fl3 = new THREE.Mesh(hindGeo, rHindMats);
            fl3.position.set(-0.35, 0.16, -0.72);
            fl3.name = 'fl3';
            fl3.castShadow = true;
            group.add(fl3);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const speed = isMoving ? 5 : 1;
            const swing = Math.sin(age * speed) * 0.3;
            const fl1 = mesh.getObjectByName('fl1');
            const fl2 = mesh.getObjectByName('fl2');
            const fl3 = mesh.getObjectByName('fl3');
            const fl4 = mesh.getObjectByName('fl4');
            const head = mesh.getObjectByName('head');
            
            if (fl1) fl1.rotation.y = swing;
            if (fl2) fl2.rotation.y = -swing;
            if (fl3) fl3.rotation.y = -swing;
            if (fl4) fl4.rotation.y = swing;
            if (head) head.rotation.y = Math.sin(age * 2) * 0.1;
        }
    },

    CHICKEN: {
        name: 'Chicken', health: 4, damage: 0, speed: 2.5, hostile: false, color: 0xffffff,
        size: 0.3, xpDrop: 1, lootChance: 0.1,
        buildMesh: () => {
            const group = new THREE.Group();
            // Authentic Minecraft Chicken Body: Box (6, 6, 8) in MC coords -> (0.375, 0.375, 0.50) unrotated
            // Vanilla MC Chicken Body UV: { u: 0, v: 9, w: 6, h: 6, l: 8 }
            const bodyGeo = new THREE.BoxGeometry(0.375, 0.375, 0.50);
            const bodyMats = getMobBoxMaterials('CHICKEN', { u: 0, v: 9, w: 6, h: 6, l: 8 }, { isBody: true, part: 'body' });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.set(0, 0.50, 0);
            body.castShadow = true;
            group.add(body);

            // Head (faces +Z forward): Vanilla MC Chicken Head UV: { u: 0, v: 0, w: 4, h: 6, d: 3 }
            const headGeo = new THREE.BoxGeometry(0.25, 0.375, 0.1875);
            const headMats = getMobBoxMaterials('CHICKEN', { u: 0, v: 0, w: 4, h: 6, d: 3 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 0.72, 0.22);
            head.name = 'head';
            head.castShadow = true;

            // 3D Beak: Vanilla MC Chicken Beak UV: { u: 14, v: 0, w: 4, h: 2, d: 2 } attached to head!
            const beakGeo = new THREE.BoxGeometry(0.25, 0.125, 0.125);
            const beakMats = getMobBoxMaterials('CHICKEN', { u: 14, v: 0, w: 4, h: 2, d: 2 }, { part: 'beak' });
            const beak = new THREE.Mesh(beakGeo, beakMats);
            beak.position.set(0, -0.04, 0.15);
            beak.castShadow = true;
            head.add(beak);

            // 3D Red Wattle: Vanilla MC Chicken Wattle UV: { u: 14, v: 4, w: 2, h: 2, d: 2 } attached to head!
            const wattleGeo = new THREE.BoxGeometry(0.125, 0.125, 0.125);
            const wattleMats = getMobBoxMaterials('CHICKEN', { u: 14, v: 4, w: 2, h: 2, d: 2 }, { part: 'wattle' });
            const wattle = new THREE.Mesh(wattleGeo, wattleMats);
            wattle.position.set(0, -0.15, 0.08);
            wattle.castShadow = true;
            head.add(wattle);

            group.add(head);

            // Wings: Vanilla MC Chicken Wing UV: { u: 24, v: 13, w: 1, h: 4, d: 6 }
            const wingGeo = new THREE.BoxGeometry(0.0625, 0.25, 0.375);
            const wingMats = getMobBoxMaterials('CHICKEN', { u: 24, v: 13, w: 1, h: 4, d: 6 }, { part: 'wing' });
            const leftWing = new THREE.Mesh(wingGeo, wingMats);
            leftWing.position.set(0.22, 0.52, 0);
            leftWing.name = 'leftWing';
            leftWing.castShadow = true;
            group.add(leftWing);
            const rightWing = new THREE.Mesh(wingGeo, wingMats);
            rightWing.position.set(-0.22, 0.52, 0);
            rightWing.name = 'rightWing';
            rightWing.castShadow = true;
            group.add(rightWing);

            // 2 Legs with yellow feet & 3-toed paws:
            // Vanilla MC Chicken Leg UV: shaft at { u: 36, v: 3, w: 1, h: 5, d: 1 }, foot at { u: 32, v: 0, w: 3, h: 1, d: 3 }
            const makeChickenLeg = (isLeft) => {
                const legGroup = new THREE.Group();
                const shaftGeo = new THREE.BoxGeometry(0.0625, 0.3125, 0.0625);
                const shaftMats = getMobBoxMaterials('CHICKEN', { u: 36, v: 3, w: 1, h: 5, d: 1 }, { part: 'leg' });
                const shaft = new THREE.Mesh(shaftGeo, shaftMats);
                shaft.position.set(0, 0.15625, 0);
                shaft.castShadow = true;
                legGroup.add(shaft);

                const footGeo = new THREE.BoxGeometry(0.1875, 0.03, 0.1875);
                const footMats = getMobBoxMaterials('CHICKEN', { u: 32, v: 0, w: 3, h: 1, d: 3 }, { part: 'leg' });
                const foot = new THREE.Mesh(footGeo, footMats);
                foot.position.set(0, 0.015, 0.0625); // Extend toes forward
                foot.castShadow = true;
                legGroup.add(foot);

                legGroup.position.set(isLeft ? 0.09 : -0.09, 0, 0.03);
                legGroup.name = isLeft ? 'leftLeg' : 'rightLeg';
                return legGroup;
            };

            group.add(makeChickenLeg(true));
            group.add(makeChickenLeg(false));

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const leftLeg = mesh.getObjectByName('leftLeg');
            const rightLeg = mesh.getObjectByName('rightLeg');
            const leftWing = mesh.getObjectByName('leftWing');
            const rightWing = mesh.getObjectByName('rightWing');
            const head = mesh.getObjectByName('head');
            if (!isMoving) {
                if (leftLeg) leftLeg.rotation.x = 0;
                if (rightLeg) rightLeg.rotation.x = 0;
                if (leftWing) leftWing.rotation.z = 0;
                if (rightWing) rightWing.rotation.z = 0;
                if (head) {
                    const cycle = (age + 1.2) % 8.5;
                    if (cycle > 4.5 && cycle < 7.5) {
                        // Pecking ground for seeds!
                        const peck = Math.max(0, Math.sin(age * 18));
                        head.rotation.x = peck * 0.65;
                        head.position.y = 0.72 - peck * 0.15;
                        head.position.z = 0.22 + peck * 0.08;
                    } else {
                        head.rotation.x = 0;
                        head.rotation.y = Math.sin(age * 2) * 0.12;
                        head.position.set(0, 0.72, 0.22);
                    }
                }
            } else {
                const swing = Math.sin(age * 12) * 0.55;
                if (leftLeg) leftLeg.rotation.x = swing;
                if (rightLeg) rightLeg.rotation.x = -swing;
                const flap = Math.sin(age * 16) * 0.3;
                if (leftWing) leftWing.rotation.z = flap;
                if (rightWing) rightWing.rotation.z = -flap;
                if (head) {
                    // Authentic chicken head-bob while walking
                    head.rotation.x = 0;
                    head.rotation.y = 0;
                    head.position.y = 0.72;
                    head.position.z = 0.22 + Math.sin(age * 12) * 0.05;
                }
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
            if (mob.velocity.y < -2) {
                mob.velocity.y = -2;
                const lw = mob.mesh && mob.mesh.getObjectByName('leftWing');
                const rw = mob.mesh && mob.mesh.getObjectByName('rightWing');
                if (lw) lw.rotation.z = Math.sin(Date.now() * 0.03) * 0.6;
                if (rw) rw.rotation.z = -Math.sin(Date.now() * 0.03) * 0.6;
            }
            mob.wanderTimer -= dt;
            if (mob.wanderTimer <= 0) {
                mob.wanderTimer = 0.5 + Math.random() * 1.5;
                const angle = Math.random() * Math.PI * 2;
                mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
            }
            const mult = mob.health < mob.maxHealth ? 3.0 : 1.0;
            mob.velocity.x = mob.wanderDir.x * mob.speed * mult;
            mob.velocity.z = mob.wanderDir.z * mob.speed * mult;
            if (mob.wanderDir.lengthSq() > 0 && mob.mesh) mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
        }
    },

    CAMEL: {
        name: 'Camel', health: 32, damage: 0, speed: 2.8, hostile: false, color: 0xc2b280,
        size: 1.0, xpDrop: 3, lootChance: 0.5,
        buildMesh: () => {
            const group = new THREE.Group();
            // Authentic Minecraft Camel Body: Box (15, 12, 27) in MC coords -> (0.9375, 0.75, 1.6875)
            // Vanilla MC Camel Body UV: { u: 0, v: 25, w: 15, h: 12, d: 27 }
            const bodyGeo = new THREE.BoxGeometry(0.9375, 0.75, 1.6875);
            const bodyMats = getMobBoxMaterials('CAMEL', { u: 0, v: 25, w: 15, h: 12, d: 27 }, { part: 'body' });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.set(0, 1.55, 0);
            body.castShadow = true;
            body.name = 'body';
            group.add(body);

            // Hump: Box (9, 5, 11) in MC coords -> (0.5625, 0.3125, 0.6875)
            // Vanilla MC Camel Hump UV: { u: 74, v: 0, w: 9, h: 5, d: 11 }
            const humpGeo = new THREE.BoxGeometry(0.5625, 0.3125, 0.6875);
            const humpMats = getMobBoxMaterials('CAMEL', { u: 74, v: 0, w: 9, h: 5, d: 11 }, { part: 'body' });
            const hump = new THREE.Mesh(humpGeo, humpMats);
            hump.position.set(0, 2.05, -0.15);
            hump.castShadow = true;
            group.add(hump);

            // Neck & Head (faces +Z):
            // Neck: Box (7, 14, 7) in MC coords -> (0.4375, 0.875, 0.4375)
            // Vanilla MC Camel Neck UV: { u: 21, v: 0, w: 7, h: 14, d: 7 }
            const neckGeo = new THREE.BoxGeometry(0.4375, 0.875, 0.4375);
            const neckMats = getMobBoxMaterials('CAMEL', { u: 21, v: 0, w: 7, h: 14, d: 7 }, { part: 'body' });
            const neck = new THREE.Mesh(neckGeo, neckMats);
            neck.position.set(0, 2.0, 0.85);
            neck.name = 'neck';
            neck.castShadow = true;
            group.add(neck);

            // Head: Box (7, 8, 19) in MC coords -> (0.4375, 0.5, 0.65)
            // Vanilla MC Camel Head UV: { u: 60, v: 24, w: 7, h: 8, d: 19 }
            const headGeo = new THREE.BoxGeometry(0.4375, 0.5, 0.65);
            const headMats = getMobBoxMaterials('CAMEL', { u: 60, v: 24, w: 7, h: 8, d: 19 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 2.5, 1.05);
            head.name = 'head';
            head.castShadow = true;

            // Snout attached to head: Box (5, 5, 6) in MC coords -> (0.3125, 0.3125, 0.375)
            // Vanilla MC Camel Snout UV: { u: 50, v: 0, w: 5, h: 5, d: 6 }
            const snoutGeo = new THREE.BoxGeometry(0.3125, 0.3125, 0.375);
            const snoutMats = getMobBoxMaterials('CAMEL', { u: 50, v: 0, w: 5, h: 5, d: 6 }, { part: 'head_front' });
            const snout = new THREE.Mesh(snoutGeo, snoutMats);
            snout.position.set(0, -0.05, 0.45);
            head.add(snout);

            // Left & Right ears attached to head:
            const earGeo = new THREE.BoxGeometry(0.1875, 0.0625, 0.125);
            const lEarMats = getMobBoxMaterials('CAMEL', { u: 45, v: 0, w: 3, h: 1, d: 2 }, { part: 'head_front' });
            const leftEar = new THREE.Mesh(earGeo, lEarMats);
            leftEar.position.set(0.25, 0.18, -0.15);
            head.add(leftEar);
            const rEarMats = getMobBoxMaterials('CAMEL', { u: 67, v: 0, w: 3, h: 1, d: 2 }, { part: 'head_front' });
            const rightEar = new THREE.Mesh(earGeo, rEarMats);
            rightEar.position.set(-0.25, 0.18, -0.15);
            head.add(rightEar);

            group.add(head);

            // 4 Legs: Box (5, 21, 5) in MC coords -> (0.3125, 1.3125, 0.3125)
            const legGeo = new THREE.BoxGeometry(0.3125, 1.3125, 0.3125);
            // Left Front Leg UV: { u: 0, v: 0, w: 5, h: 21, d: 5 }
            const lfMats = getMobBoxMaterials('CAMEL', { u: 0, v: 0, w: 5, h: 21, d: 5 }, { part: 'leg' });
            const legFL = new THREE.Mesh(legGeo, lfMats);
            legFL.position.set(0.35, 0.65625, 0.65);
            legFL.name = 'leg_fl';
            legFL.castShadow = true;
            group.add(legFL);

            // Right Front Leg UV: { u: 0, v: 26, w: 5, h: 21, d: 5 }
            const rfMats = getMobBoxMaterials('CAMEL', { u: 0, v: 26, w: 5, h: 21, d: 5 }, { part: 'leg' });
            const legFR = new THREE.Mesh(legGeo, rfMats);
            legFR.position.set(-0.35, 0.65625, 0.65);
            legFR.name = 'leg_fr';
            legFR.castShadow = true;
            group.add(legFR);

            // Left Hind Leg UV: { u: 58, v: 16, w: 5, h: 21, d: 5 }
            const blMats = getMobBoxMaterials('CAMEL', { u: 58, v: 16, w: 5, h: 21, d: 5 }, { part: 'leg' });
            const legBL = new THREE.Mesh(legGeo, blMats);
            legBL.position.set(0.35, 0.65625, -0.65);
            legBL.name = 'leg_bl';
            legBL.castShadow = true;
            group.add(legBL);

            // Right Hind Leg UV: { u: 94, v: 16, w: 5, h: 21, d: 5 }
            const brMats = getMobBoxMaterials('CAMEL', { u: 94, v: 16, w: 5, h: 21, d: 5 }, { part: 'leg' });
            const legBR = new THREE.Mesh(legGeo, brMats);
            legBR.position.set(-0.35, 0.65625, -0.65);
            legBR.name = 'leg_br';
            legBR.castShadow = true;
            group.add(legBR);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const fl = mesh.getObjectByName('leg_fl');
            const fr = mesh.getObjectByName('leg_fr');
            const bl = mesh.getObjectByName('leg_bl');
            const br = mesh.getObjectByName('leg_br');
            const head = mesh.getObjectByName('head');
            if (isMoving) {
                // Minecraft Camel authentic pacing gait (left side moves, then right side moves)
                const swing = Math.sin(age * 5) * 0.4;
                if (fl) fl.rotation.x = swing;
                if (bl) bl.rotation.x = swing;
                if (fr) fr.rotation.x = -swing;
                if (br) br.rotation.x = -swing;
                if (head) head.rotation.x = Math.sin(age * 5) * 0.08;
            } else {
                if (fl) fl.rotation.x = 0;
                if (fr) fr.rotation.x = 0;
                if (bl) bl.rotation.x = 0;
                if (br) br.rotation.x = 0;
                if (head) head.rotation.x = 0;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
            mob.wanderTimer -= dt;
            if (mob.wanderTimer <= 0) {
                if (Math.random() < 0.4) {
                    mob.wanderTimer = 2.0 + Math.random() * 4.0;
                    const angle = Math.random() * Math.PI * 2;
                    mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                } else {
                    mob.wanderTimer = 3.0 + Math.random() * 5.0;
                    mob.wanderDir.set(0, 0, 0);
                }
            }
            mob.velocity.x = mob.wanderDir.x * mob.speed * 0.4;
            mob.velocity.z = mob.wanderDir.z * mob.speed * 0.4;
            if (mob.wanderDir.lengthSq() > 0 && mob.mesh) mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
        }
    },
    CAT: {
        name: 'Cat', health: 10, damage: 0, speed: 2.4, hostile: false, color: 0x1a1a1a,
        size: 0.5, xpDrop: 2, lootChance: 0.5, lootTable: [{ item: { type: 'material', subtype: 'string' }, weight: 1 }],
        buildMesh: () => {
            const group = new THREE.Group();
            // Slender cat body (4, 4, 10) in MC coords -> (0.25, 0.25, 0.60)
            const bodyGeo = new THREE.BoxGeometry(0.25, 0.25, 0.60);
            const blackMat = new THREE.MeshLambertMaterial({ color: 0x161616 });
            const body = new THREE.Mesh(bodyGeo, blackMat);
            body.position.set(0, 0.35, 0);
            body.name = 'body';
            group.add(body);

            // Head (5, 4, 5) -> (0.30, 0.25, 0.28)
            const headGeo = new THREE.BoxGeometry(0.30, 0.25, 0.28);
            const head = new THREE.Mesh(headGeo, blackMat);
            head.position.set(0, 0.48, 0.32);
            head.name = 'head';

            // Green eyes
            const eyeGeo = new THREE.BoxGeometry(0.06, 0.05, 0.02);
            const eyeMat = new THREE.MeshLambertMaterial({ color: 0x33ff55 });
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
            eyeL.position.set(0.08, 0.04, 0.145);
            head.add(eyeL);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
            eyeR.position.set(-0.08, 0.04, 0.145);
            head.add(eyeR);

            // Two pointed ears
            const earGeo = new THREE.BoxGeometry(0.07, 0.08, 0.06);
            const earL = new THREE.Mesh(earGeo, blackMat);
            earL.position.set(0.10, 0.16, 0);
            head.add(earL);
            const earR = new THREE.Mesh(earGeo, blackMat);
            earR.position.set(-0.10, 0.16, 0);
            head.add(earR);

            group.add(head);

            // 4 Legs (2, 6, 2) -> (0.12, 0.35, 0.12)
            const legGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
            legGeo.translate(0, -0.175, 0);
            const fl = new THREE.Mesh(legGeo, blackMat);
            fl.position.set(-0.08, 0.35, 0.20);
            fl.name = 'front_left_leg';
            group.add(fl);

            const fr = new THREE.Mesh(legGeo, blackMat);
            fr.position.set(0.08, 0.35, 0.20);
            fr.name = 'front_right_leg';
            group.add(fr);

            const bl = new THREE.Mesh(legGeo, blackMat);
            bl.position.set(-0.08, 0.35, -0.20);
            bl.name = 'back_left_leg';
            group.add(bl);

            const br = new THREE.Mesh(legGeo, blackMat);
            br.position.set(0.08, 0.35, -0.20);
            br.name = 'back_right_leg';
            group.add(br);

            // Tail
            const tailGeo = new THREE.BoxGeometry(0.06, 0.06, 0.40);
            tailGeo.translate(0, 0, -0.20);
            const tail = new THREE.Mesh(tailGeo, blackMat);
            tail.position.set(0, 0.42, -0.30);
            tail.rotation.x = Math.PI / 4;
            tail.name = 'tail';
            group.add(tail);

            return group;
        },
        animate: (mesh, animTime, isMoving) => {
            const fl = mesh.getObjectByName('front_left_leg');
            const fr = mesh.getObjectByName('front_right_leg');
            const bl = mesh.getObjectByName('back_left_leg');
            const br = mesh.getObjectByName('back_right_leg');
            const tail = mesh.getObjectByName('tail');
            if (isMoving && fl && fr && bl && br) {
                const s = Math.sin(animTime * 8);
                fl.rotation.x = s * 0.6;
                fr.rotation.x = -s * 0.6;
                bl.rotation.x = -s * 0.6;
                br.rotation.x = s * 0.6;
            } else if (fl && fr && bl && br) {
                fl.rotation.x = 0; fr.rotation.x = 0;
                bl.rotation.x = 0; br.rotation.x = 0;
            }
            if (tail) {
                tail.rotation.y = Math.sin(animTime * 4) * 0.25;
            }
        }
    },
    FROG: {
        name: 'Frog', health: 10, damage: 0, speed: 4.0, hostile: false, color: 0x22cc44,
        size: 0.4, xpDrop: 1, lootChance: 0.2,
        buildMesh: () => {
            const group = new THREE.Group();
            // Authentic Minecraft Frog Body: Box (7, 3, 9) in MC coords -> (0.4375, 0.1875, 0.5625)
            // Vanilla MC Frog Body UV: { u: 3, v: 1, w: 7, h: 3, d: 9 }
            const bodyGeo = new THREE.BoxGeometry(0.4375, 0.1875, 0.5625);
            const bodyMats = getMobBoxMaterials('FROG', { u: 3, v: 1, w: 7, h: 3, d: 9 }, { part: 'body' });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.set(0, 0.22, 0);
            body.castShadow = true;
            group.add(body);

            // Head (faces +Z): Box (7, 3, 9) in MC coords -> (0.4375, 0.1875, 0.45)
            // Vanilla MC Frog Head UV: { u: 0, v: 13, w: 7, h: 3, d: 9 }
            const headGeo = new THREE.BoxGeometry(0.4375, 0.1875, 0.45);
            const headMats = getMobBoxMaterials('FROG', { u: 0, v: 13, w: 7, h: 3, d: 9 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 0.22, 0.25);
            head.name = 'head';
            head.castShadow = true;

            // Eyes attached to head: Box (3, 2, 3) in MC coords -> (0.1875, 0.125, 0.1875)
            const eyeGeo = new THREE.BoxGeometry(0.1875, 0.125, 0.1875);
            // Right Eye UV: { u: 0, v: 0, w: 3, h: 2, d: 3 }
            const rEyeMats = getMobBoxMaterials('FROG', { u: 0, v: 0, w: 3, h: 2, d: 3 }, { part: 'head_top' });
            const re = new THREE.Mesh(eyeGeo, rEyeMats);
            re.position.set(-0.16, 0.14, 0.1);
            head.add(re);

            // Left Eye UV: { u: 0, v: 5, w: 3, h: 2, d: 3 }
            const lEyeMats = getMobBoxMaterials('FROG', { u: 0, v: 5, w: 3, h: 2, d: 3 }, { part: 'head_top' });
            const le = new THREE.Mesh(eyeGeo, lEyeMats);
            le.position.set(0.16, 0.14, 0.1);
            head.add(le);

            group.add(head);

            // Front arms: Box (2, 3, 3) in MC coords -> (0.125, 0.1875, 0.1875)
            const fArmGeo = new THREE.BoxGeometry(0.125, 0.1875, 0.1875);
            // Left Arm UV: { u: 0, v: 32, w: 2, h: 3, d: 3 }
            const lArmMats = getMobBoxMaterials('FROG', { u: 0, v: 32, w: 2, h: 3, d: 3 }, { part: 'leg' });
            const fl = new THREE.Mesh(fArmGeo, lArmMats);
            fl.position.set(0.24, 0.10, 0.2);
            fl.name = 'fl';
            fl.castShadow = true;
            group.add(fl);

            // Right Arm UV: { u: 0, v: 38, w: 2, h: 3, d: 3 }
            const rArmMats = getMobBoxMaterials('FROG', { u: 0, v: 38, w: 2, h: 3, d: 3 }, { part: 'leg' });
            const fr = new THREE.Mesh(fArmGeo, rArmMats);
            fr.position.set(-0.24, 0.10, 0.2);
            fr.name = 'fr';
            fr.castShadow = true;
            group.add(fr);

            // Hind legs: Box (3, 3, 4) in MC coords -> (0.1875, 0.1875, 0.25)
            const hLegGeo = new THREE.BoxGeometry(0.1875, 0.1875, 0.25);
            // Left Hind Leg UV: { u: 14, v: 25, w: 3, h: 3, d: 4 }
            const lLegMats = getMobBoxMaterials('FROG', { u: 14, v: 25, w: 3, h: 3, d: 4 }, { part: 'leg' });
            const hl = new THREE.Mesh(hLegGeo, lLegMats);
            hl.position.set(0.25, 0.10, -0.2);
            hl.name = 'hl';
            hl.castShadow = true;
            group.add(hl);

            // Right Hind Leg UV: { u: 0, v: 25, w: 3, h: 3, d: 4 }
            const rLegMats = getMobBoxMaterials('FROG', { u: 0, v: 25, w: 3, h: 3, d: 4 }, { part: 'leg' });
            const hr = new THREE.Mesh(hLegGeo, rLegMats);
            hr.position.set(-0.25, 0.10, -0.2);
            hr.name = 'hr';
            hr.castShadow = true;
            group.add(hr);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const hl = mesh.getObjectByName('hl');
            const hr = mesh.getObjectByName('hr');
            const fl = mesh.getObjectByName('fl');
            const fr = mesh.getObjectByName('fr');
            if (isMoving) {
                const stretch = Math.sin(age * 12) * 0.45;
                if (hl) hl.rotation.x = stretch;
                if (hr) hr.rotation.x = stretch;
                if (fl) fl.rotation.x = -stretch * 0.5;
                if (fr) fr.rotation.x = -stretch * 0.5;
            } else {
                if (hl) hl.rotation.x = 0;
                if (hr) hr.rotation.x = 0;
                if (fl) fl.rotation.x = 0;
                if (fr) fr.rotation.x = 0;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
            mob.wanderTimer -= dt;
            if (mob.wanderTimer <= 0) {
                mob.wanderTimer = 1.2 + Math.random() * 2.5;
                const angle = Math.random() * Math.PI * 2;
                mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                if (mob.grounded) {
                    mob.velocity.y = 5.5; // Minecraft frog hop
                    mob.grounded = false;
                }
            }
            if (!mob.grounded) {
                mob.velocity.x = mob.wanderDir.x * mob.speed;
                mob.velocity.z = mob.wanderDir.z * mob.speed;
            } else {
                mob.velocity.x *= 0.5;
                mob.velocity.z *= 0.5;
            }
            if (mob.wanderDir.lengthSq() > 0 && mob.mesh) mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
        }
    },
    SWET: {
        name: 'Swet', health: 16, damage: 4, speed: 3.5, hostile: false, color: 0x38bdf8,
        size: 0.8, xpDrop: 3, lootChance: 0.5,
        buildMesh: () => {
            const group = new THREE.Group();
            // Outer translucent gelatinous slime cube
            const outerGeo = new THREE.BoxGeometry(0.75, 0.75, 0.75);
            const outer = createBodyPart(outerGeo, 0x38bdf8);
            outer.position.y = 0.375;
            outer.material.transparent = true;
            outer.material.opacity = 0.65;
            outer.name = 'outer';
            group.add(outer);

            // Inner vibrant blue core
            const coreGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
            const core = createBodyPart(coreGeo, 0x0284c7);
            core.position.y = 0.35;
            core.name = 'core';
            group.add(core);

            // Cute Swet eyes
            const eyeGeo = new THREE.BoxGeometry(0.09, 0.09, 0.02);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
            eyeL.position.set(0.18, 0.42, 0.38);
            group.add(eyeL);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
            eyeR.position.set(-0.18, 0.42, 0.38);
            group.add(eyeR);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const outer = mesh.getObjectByName('outer');
            const core = mesh.getObjectByName('core');
            const bounce = Math.sin(age * 8);
            const squash = 1.0 + bounce * 0.18;
            if (outer) {
                outer.scale.set(1.0 / Math.sqrt(squash), squash, 1.0 / Math.sqrt(squash));
            }
            if (core) {
                core.scale.set(1.0 / Math.sqrt(squash), squash, 1.0 / Math.sqrt(squash));
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
            mob.wanderTimer -= dt;
            if (mob.wanderTimer <= 0) {
                mob.wanderTimer = 1.0 + Math.random() * 2.0;
                const angle = Math.random() * Math.PI * 2;
                mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                if (mob.grounded) {
                    mob.velocity.y = 6.2; // Aether bouncy hop
                    mob.grounded = false;
                }
            }
            if (!mob.grounded) {
                mob.velocity.x = mob.wanderDir.x * mob.speed;
                mob.velocity.z = mob.wanderDir.z * mob.speed;
            } else {
                mob.velocity.x *= 0.5;
                mob.velocity.z *= 0.5;
            }
            if (mob.wanderDir.lengthSq() > 0 && mob.mesh) mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
        }
    },
    AERWHALE: {
        name: 'Aerwhale', health: 40, damage: 0, speed: 1.8, hostile: false, flying: true, color: 0x93c5fd,
        size: 2.2, xpDrop: 5, lootChance: 0.8,
        buildMesh: () => {
            const group = new THREE.Group();
            // Main body (elongated streamlined whale shape)
            const bodyGeo = new THREE.BoxGeometry(1.6, 1.1, 3.0);
            const body = createBodyPart(bodyGeo, 0xdbeafe);
            body.position.set(0, 0, 0);
            body.name = 'body';
            group.add(body);

            // Head snout (front +Z)
            const headGeo = new THREE.BoxGeometry(1.3, 0.9, 1.1);
            const head = createBodyPart(headGeo, 0xbfdbfe);
            head.position.set(0, -0.05, 1.8);
            head.name = 'head';
            group.add(head);

            // Left Flipper / Wing
            const finGeo = new THREE.BoxGeometry(1.2, 0.1, 0.6);
            const finL = createBodyPart(finGeo, 0x93c5fd);
            finL.position.set(1.2, -0.2, 0.3);
            finL.name = 'finL';
            group.add(finL);

            // Right Flipper / Wing
            const finR = createBodyPart(finGeo, 0x93c5fd);
            finR.position.set(-1.2, -0.2, 0.3);
            finR.name = 'finR';
            group.add(finR);

            // Dorsal Fin
            const dorsalGeo = new THREE.BoxGeometry(0.12, 0.6, 0.7);
            const dorsal = createBodyPart(dorsalGeo, 0x60a5fa);
            dorsal.position.set(0, 0.8, -0.3);
            group.add(dorsal);

            // Tail stalk and fluke (-Z)
            const tailGeo = new THREE.BoxGeometry(0.6, 0.5, 1.2);
            const tail = createBodyPart(tailGeo, 0xbfdbfe);
            tail.position.set(0, 0, -2.0);
            tail.name = 'tail';
            
            const flukeGeo = new THREE.BoxGeometry(1.8, 0.08, 0.8);
            const fluke = createBodyPart(flukeGeo, 0x60a5fa);
            fluke.position.set(0, 0, -0.6);
            tail.add(fluke);
            group.add(tail);

            return group;
        },
        animate: (mesh, dt, age) => {
            const finL = mesh.getObjectByName('finL');
            const finR = mesh.getObjectByName('finR');
            const tail = mesh.getObjectByName('tail');
            const sway = Math.sin(age * 2.2);
            if (finL) finL.rotation.z = sway * 0.25;
            if (finR) finR.rotation.z = -sway * 0.25;
            if (tail) tail.rotation.x = Math.sin(age * 2.2 - 0.5) * 0.18;
            mesh.position.y += Math.sin(age * 1.5) * 0.004;
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
            mob.wanderTimer -= dt;
            if (mob.wanderTimer <= 0) {
                mob.wanderTimer = 4.0 + Math.random() * 6.0;
                const angle = Math.random() * Math.PI * 2;
                const targetY = 75 + Math.random() * 35;
                const dy = (targetY - mob.position.y) * 0.1;
                mob.wanderDir.set(Math.cos(angle), Math.max(-0.3, Math.min(0.3, dy)), Math.sin(angle)).normalize();
            }
            mob.velocity.x = mob.wanderDir.x * mob.speed;
            mob.velocity.y = mob.wanderDir.y * mob.speed * 0.5;
            mob.velocity.z = mob.wanderDir.z * mob.speed;
            if (mob.wanderDir.lengthSq() > 0 && mob.mesh) {
                mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
            }
        }
    },
    BLAZE: {
        name: 'Blaze', health: 20, damage: 5, speed: 2.5, hostile: true, flying: true, color: 0xffaa00,
        size: 1.4, xpDrop: 10, lootChance: 1.0,
        buildMesh: () => {
            const group = new THREE.Group();
            const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const headMat = new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                emissive: 0xff5500,
                emissiveIntensity: 0.6,
                roughness: 0.4
            });
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.y = 1.2;
            head.name = 'head';
            group.add(head);

            const eyeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.02);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff88 });
            const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
            leftEye.position.set(-0.13, 1.22, 0.26);
            group.add(leftEye);
            const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
            rightEye.position.set(0.13, 1.22, 0.26);
            group.add(rightEye);

            const rodGeo = new THREE.BoxGeometry(0.1, 0.45, 0.1);
            const rodMat = new THREE.MeshStandardMaterial({
                color: 0xff9900,
                emissive: 0xff4400,
                emissiveIntensity: 0.8
            });

            const tier1 = new THREE.Group();
            tier1.name = 'tier1';
            for (let i = 0; i < 4; i++) {
                const a = i * (Math.PI / 2);
                const r = new THREE.Mesh(rodGeo, rodMat);
                r.position.set(Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45);
                tier1.add(r);
            }
            tier1.position.y = 1.3;
            group.add(tier1);

            const tier2 = new THREE.Group();
            tier2.name = 'tier2';
            for (let i = 0; i < 4; i++) {
                const a = i * (Math.PI / 2) + Math.PI / 4;
                const r = new THREE.Mesh(rodGeo, rodMat);
                r.position.set(Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6);
                tier2.add(r);
            }
            tier2.position.y = 0.9;
            group.add(tier2);

            const tier3 = new THREE.Group();
            tier3.name = 'tier3';
            for (let i = 0; i < 4; i++) {
                const a = i * (Math.PI / 2);
                const r = new THREE.Mesh(rodGeo, rodMat);
                r.position.set(Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4);
                tier3.add(r);
            }
            tier3.position.y = 0.5;
            group.add(tier3);

            return group;
        },
        animate: (mesh, dt, age) => {
            const t1 = mesh.getObjectByName('tier1');
            const t2 = mesh.getObjectByName('tier2');
            const t3 = mesh.getObjectByName('tier3');
            if (t1) {
                t1.rotation.y = age * 3.0;
                t1.position.y = 1.3 + Math.sin(age * 4) * 0.08;
            }
            if (t2) {
                t2.rotation.y = -age * 2.2;
                t2.position.y = 0.9 + Math.cos(age * 3.5) * 0.08;
            }
            if (t3) {
                t3.rotation.y = age * 2.8;
                t3.position.y = 0.5 + Math.sin(age * 5) * 0.08;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.shootCooldown) mob.shootCooldown = 1.0;
            mob.shootCooldown -= dt;

            const dist = mob.position.distanceTo(playerPos);
            const targetY = playerPos.y + 2.5;
            mob.velocity.y += (targetY - mob.position.y) * 2.0 * dt;
            mob.velocity.y = Math.max(-4, Math.min(4, mob.velocity.y));

            if (dist > 5 && dist < 25) {
                const dir = playerPos.clone().sub(mob.position).normalize();
                mob.velocity.x += dir.x * 3.0 * dt;
                mob.velocity.z += dir.z * 3.0 * dt;

                if (mob.shootCooldown <= 0) {
                    mob.shootCooldown = 2.5 + Math.random() * 1.5;
                    if (mob.manager && mob.manager.shootMobFireball) {
                        mob.manager.shootMobFireball(mob.position.clone().add(new THREE.Vector3(0, 1.2, 0)), playerPos);
                    }
                }
            } else {
                mob.velocity.x *= 0.9;
                mob.velocity.z *= 0.9;
            }
        }
    },
    END_CRYSTAL: {
        name: 'End Crystal', health: 1, damage: 0, speed: 0, hostile: false, isStationary: true, isCrystal: true, flying: true,
        size: 1.5, xpDrop: 0, lootChance: 0,
        buildMesh: () => {
            const group = new THREE.Group();
            const baseGeo = new THREE.BoxGeometry(1.2, 0.3, 1.2);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = 0.15;
            group.add(base);

            const outerGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
            const outerMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.55,
                roughness: 0.1
            });
            const outerCube = new THREE.Mesh(outerGeo, outerMat);
            outerCube.position.y = 1.0;
            outerCube.name = 'outerCube';
            group.add(outerCube);

            const innerGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
            const innerMat = new THREE.MeshStandardMaterial({
                color: 0xd946ef,
                transparent: true,
                opacity: 0.7,
                roughness: 0.1
            });
            const innerCube = new THREE.Mesh(innerGeo, innerMat);
            innerCube.position.y = 1.0;
            innerCube.name = 'innerCube';
            group.add(innerCube);

            const coreGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const coreMat = new THREE.MeshBasicMaterial({ color: 0xff55ff });
            const core = new THREE.Mesh(coreGeo, coreMat);
            core.position.y = 1.0;
            core.name = 'core';
            group.add(core);

            return group;
        },
        animate: (mesh, dt, age) => {
            const outer = mesh.getObjectByName('outerCube');
            const inner = mesh.getObjectByName('innerCube');
            const core = mesh.getObjectByName('core');
            if (outer) {
                outer.rotation.y = age * 1.5;
                outer.rotation.x = Math.sin(age * 1.2) * 0.4;
            }
            if (inner) {
                inner.rotation.y = -age * 2.0;
                inner.rotation.z = Math.cos(age * 1.5) * 0.4;
            }
            if (core) {
                core.rotation.y = age * 3.0;
                const s = 1.0 + Math.sin(age * 8) * 0.15;
                core.scale.set(s, s, s);
            }
        },
        updateAI: (mob) => {
            mob.velocity.set(0, 0, 0);
        }
    },
    ENDER_DRAGON: {
        name: 'Ender Dragon', health: 2000, damage: 15, speed: 7.0, hostile: true, flying: true, isBoss: true,
        size: 4.5, xpDrop: 150, lootChance: 1.0,
        buildMesh: () => {
            const group = new THREE.Group();
            const darkMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.7 });
            const greyMat = new THREE.MeshStandardMaterial({ color: 0x333338, roughness: 0.5 });
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd946ef });
            const wingMat = new THREE.MeshStandardMaterial({ color: 0x221128, side: THREE.DoubleSide, roughness: 0.6 });

            const bodyGeo = new THREE.BoxGeometry(1.6, 1.4, 3.4);
            const body = new THREE.Mesh(bodyGeo, darkMat);
            body.position.set(0, 1.2, 0);
            body.name = 'body';
            group.add(body);

            const neckGroup = new THREE.Group();
            neckGroup.name = 'neckGroup';
            neckGroup.position.set(0, 1.4, 1.7);
            for (let i = 0; i < 3; i++) {
                const nGeo = new THREE.BoxGeometry(0.7 - i*0.05, 0.7 - i*0.05, 0.8);
                const nMesh = new THREE.Mesh(nGeo, darkMat);
                nMesh.position.set(0, (i + 1) * 0.4, (i + 1) * 0.7);
                neckGroup.add(nMesh);
            }

            const headGeo = new THREE.BoxGeometry(0.9, 0.8, 1.2);
            const head = new THREE.Mesh(headGeo, darkMat);
            head.position.set(0, 1.7, 2.8);
            head.name = 'head';

            const hornGeo = new THREE.BoxGeometry(0.12, 0.4, 0.12);
            const hornL = new THREE.Mesh(hornGeo, greyMat);
            hornL.position.set(-0.3, 0.45, -0.2);
            hornL.rotation.x = -0.4;
            head.add(hornL);
            const hornR = new THREE.Mesh(hornGeo, greyMat);
            hornR.position.set(0.3, 0.45, -0.2);
            hornR.rotation.x = -0.4;
            head.add(hornR);

            const eyeGeo = new THREE.BoxGeometry(0.2, 0.1, 0.05);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
            eyeL.position.set(-0.35, 0.15, 0.61);
            head.add(eyeL);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
            eyeR.position.set(0.35, 0.15, 0.61);
            head.add(eyeR);

            neckGroup.add(head);
            group.add(neckGroup);

            const leftWing = new THREE.Group();
            leftWing.name = 'leftWing';
            leftWing.position.set(-0.8, 1.6, 0.2);
            const boneL = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 0.3), greyMat);
            boneL.position.set(-1.4, 0, 0);
            leftWing.add(boneL);
            const memGeoL = new THREE.PlaneGeometry(2.8, 2.4);
            const memL = new THREE.Mesh(memGeoL, wingMat);
            memL.rotation.x = Math.PI / 2;
            memL.position.set(-1.4, 0, -0.8);
            leftWing.add(memL);
            group.add(leftWing);

            const rightWing = new THREE.Group();
            rightWing.name = 'rightWing';
            rightWing.position.set(0.8, 1.6, 0.2);
            const boneR = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 0.3), greyMat);
            boneR.position.set(1.4, 0, 0);
            rightWing.add(boneR);
            const memGeoR = new THREE.PlaneGeometry(2.8, 2.4);
            const memR = new THREE.Mesh(memGeoR, wingMat);
            memR.rotation.x = Math.PI / 2;
            memR.position.set(1.4, 0, -0.8);
            rightWing.add(memR);
            group.add(rightWing);

            const tailGroup = new THREE.Group();
            tailGroup.name = 'tailGroup';
            tailGroup.position.set(0, 1.2, -1.7);
            for (let i = 0; i < 4; i++) {
                const tGeo = new THREE.BoxGeometry(0.7 - i*0.12, 0.6 - i*0.1, 0.9);
                const tMesh = new THREE.Mesh(tGeo, darkMat);
                tMesh.position.set(0, -i*0.2, -(i+1)*0.8);
                tailGroup.add(tMesh);
            }
            group.add(tailGroup);

            return group;
        },
        animate: (mesh, dt, age) => {
            const lw = mesh.getObjectByName('leftWing');
            const rw = mesh.getObjectByName('rightWing');
            const neck = mesh.getObjectByName('neckGroup');
            const tail = mesh.getObjectByName('tailGroup');

            const flap = Math.sin(age * 5.0) * 0.45;
            if (lw) lw.rotation.z = -flap;
            if (rw) rw.rotation.z = flap;

            if (tail) tail.rotation.y = Math.sin(age * 3.0) * 0.25;
            if (neck) neck.rotation.y = Math.sin(age * 2.0) * 0.15;
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.dragonState) mob.dragonState = 'CIRCLING';
            if (!mob.stateTimer) mob.stateTimer = 0;
            if (!mob.circleAngle) mob.circleAngle = 0;
            mob.stateTimer += dt;

            if (mob.healingFromCrystal) {
                mob.health = Math.min(mob.maxHealth, mob.health + dt * 8);
            }

            if (mob.dragonState === 'CIRCLING') {
                mob.circleAngle += dt * 0.4;
                const radius = 38;
                const targetX = Math.cos(mob.circleAngle) * radius;
                const targetZ = Math.sin(mob.circleAngle) * radius;
                const targetY = 70 + Math.sin(mob.circleAngle * 2) * 5;

                const dx = targetX - mob.position.x;
                const dy = targetY - mob.position.y;
                const dz = targetZ - mob.position.z;

                mob.velocity.x += dx * 2.5 * dt;
                mob.velocity.y += dy * 2.5 * dt;
                mob.velocity.z += dz * 2.5 * dt;

                const spd = Math.hypot(mob.velocity.x, mob.velocity.z);
                if (spd > 12) {
                    mob.velocity.x = (mob.velocity.x / spd) * 12;
                    mob.velocity.z = (mob.velocity.z / spd) * 12;
                }

                if (spd > 0.5) {
                    mob.rotationY = Math.atan2(mob.velocity.x, mob.velocity.z);
                }

                if (mob.stateTimer > 15) {
                    mob.stateTimer = 0;
                    mob.dragonState = Math.random() < 0.6 ? 'SWOOPING' : 'PERCHING';
                }
            } else if (mob.dragonState === 'SWOOPING') {
                const dir = playerPos.clone().sub(mob.position);
                const dist = dir.length();
                dir.normalize();

                mob.velocity.x += dir.x * 12 * dt;
                mob.velocity.y += dir.y * 12 * dt;
                mob.velocity.z += dir.z * 12 * dt;

                const vLen = mob.velocity.length();
                if (vLen > 18) mob.velocity.multiplyScalar(18 / vLen);

                mob.rotationY = Math.atan2(mob.velocity.x, mob.velocity.z);

                if (dist < 4.0) {
                    if (world && world.damagePlayer) world.damagePlayer(15);
                    mob.velocity.y = 12;
                    mob.dragonState = 'CIRCLING';
                    mob.stateTimer = 0;
                } else if (mob.stateTimer > 6 || mob.position.y < 54) {
                    mob.velocity.y = 10;
                    mob.dragonState = 'CIRCLING';
                    mob.stateTimer = 0;
                }
            } else if (mob.dragonState === 'PERCHING') {
                const targetY = 58;
                const dx = 0 - mob.position.x;
                const dy = targetY - mob.position.y;
                const dz = 0 - mob.position.z;

                mob.velocity.x += dx * 3 * dt;
                mob.velocity.y += dy * 3 * dt;
                mob.velocity.z += dz * 3 * dt;
                mob.velocity.multiplyScalar(0.92);

                const toPlayer = playerPos.clone().sub(mob.position);
                mob.rotationY = Math.atan2(toPlayer.x, toPlayer.z);

                if (!mob.perchShootTimer) mob.perchShootTimer = 0;
                mob.perchShootTimer += dt;
                if (mob.perchShootTimer > 3.0) {
                    mob.perchShootTimer = 0;
                    if (mob.manager && mob.manager.shootDragonFireball) {
                        mob.manager.shootDragonFireball(mob.position.clone().add(new THREE.Vector3(0, 1.5, 0)), playerPos);
                    }
                }

                if (mob.stateTimer > 9) {
                    mob.stateTimer = 0;
                    mob.velocity.y = 14;
                    mob.dragonState = 'CIRCLING';
                }
            }
        }
    }
};

// Weighted mob type table for spawning
const MOB_SPAWN_WEIGHTS = [
    { type: 'SHEEP', weight: 20 },
    { type: 'COW', weight: 20 },
    { type: 'PIG', weight: 20 },
    { type: 'CHICKEN', weight: 20 },
    { type: 'ZOMBIE', weight: 15 },
    { type: 'SKELETON', weight: 15 },
    { type: 'SPIDER', weight: 12 },
    { type: 'CREEPER', weight: 12 },
    { type: 'SLIME', weight: 8 },
    { type: 'ENDERMAN', weight: 5 },
    { type: 'BAT', weight: 6 }
];
const TOTAL_MOB_WEIGHT = MOB_SPAWN_WEIGHTS.reduce((s, e) => s + e.weight, 0);

function pickRandomMobType(dimension = 'overworld', biomeName = 'plains', isDay = false, surfaceBlock = null) {
    if (dimension === 'nether') {
        const netherMobs = ['BLAZE', 'BLAZE', 'ENDERMAN', 'LAVASLIME', 'PIGLIN_BRUISER'];
        return netherMobs[Math.floor(Math.random() * netherMobs.length)];
    }
    if (dimension === 'end') {
        return 'ENDERMAN';
    }
    if (dimension === 'aether') {
        const aetherMobs = ['SWET', 'SWET', 'AERWHALE', 'SHEEP', 'CHICKEN'];
        return aetherMobs[Math.floor(Math.random() * aetherMobs.length)];
    }
    if (dimension === 'caverns') {
        const cavMobs = ['BAT', 'SKELETON', 'ZOMBIE', 'SPIDER', 'CREEPER', 'ENDERMAN'];
        return cavMobs[Math.floor(Math.random() * cavMobs.length)];
    }

    const b = (biomeName || '').toLowerCase();
    const isCold = b.includes('snow') || b.includes('tundra') || b.includes('ice') || b.includes('mountain') || 
                   surfaceBlock === BLOCKS.SNOW || surfaceBlock === BLOCKS.ICE || surfaceBlock === BLOCKS.PACKED_ICE || surfaceBlock === BLOCKS.BLUE_ICE;
    const isDesert = b.includes('desert') || b.includes('badlands') || b.includes('oasis') || 
                     surfaceBlock === BLOCKS.SAND || surfaceBlock === BLOCKS.RED_SAND || surfaceBlock === BLOCKS.TERRACOTTA;
    const isSwamp = b.includes('swamp') || surfaceBlock === BLOCKS.SWAMP_GRASS || surfaceBlock === BLOCKS.MUD;
    const isJungle = b.includes('jungle');
    const isBeach = b.includes('beach');
    const isMushroom = b.includes('mushroom') || surfaceBlock === BLOCKS.MYCELIUM;

    // Day Spawning (strictly passive mobs matching their authentic biome)
    if (isDay) {
        if (isCold) {
            // Strictly snowy mobs: Polar Bears and Snow Golems (and rare white sheep) - NEVER camels!
            const coldRoll = Math.random();
            if (coldRoll < 0.60) return 'POLAR_BEAR';
            if (coldRoll < 0.85) return 'SNOW_GOLEM';
            return 'SHEEP';
        }
        if (isDesert) {
            // Desert mobs: Camels (and rare sheep)
            return Math.random() < 0.80 ? 'CAMEL' : 'SHEEP';
        }
        if (isSwamp) {
            // Swamp mobs: Frogs and slimes
            return Math.random() < 0.70 ? 'FROG' : 'SLIME';
        }
        if (isBeach) {
            return Math.random() < 0.80 ? 'TURTLE' : 'CHICKEN';
        }
        if (isJungle) {
            const jPassives = ['CHICKEN', 'PIG', 'FROG', 'SHEEP'];
            return jPassives[Math.floor(Math.random() * jPassives.length)];
        }
        if (isMushroom) {
            return 'COW';
        }
        // General temperate plains / forest / taiga / savanna:
        // STRICTLY: Cow, Sheep, Pig, Chicken - NO Camels, NO Polar Bears!
        const temperatePassives = ['SHEEP', 'COW', 'PIG', 'CHICKEN'];
        return temperatePassives[Math.floor(Math.random() * temperatePassives.length)];
    }

    // Night Spawning
    if (isCold) {
        // Cold nights: Strays (Skeleton), Zombies, Polar Bears, Snow Golems - NO camels!
        const cNightRoll = Math.random();
        if (cNightRoll < 0.35) return 'POLAR_BEAR';
        if (cNightRoll < 0.65) return 'SKELETON';
        if (cNightRoll < 0.85) return 'ZOMBIE';
        return 'SPIDER';
    }
    if (isDesert) {
        // Desert nights: Camels, Husks (Zombies), Skeletons, Spiders - NO winter mobs!
        const dNightRoll = Math.random();
        if (dNightRoll < 0.25) return 'CAMEL';
        if (dNightRoll < 0.55) return 'ZOMBIE';
        if (dNightRoll < 0.80) return 'SKELETON';
        return 'SPIDER';
    }
    if (isSwamp) {
        const sNightRoll = Math.random();
        if (sNightRoll < 0.35) return 'WITCH';
        if (sNightRoll < 0.70) return 'SLIME';
        return 'FROG';
    }
    if (isMushroom) {
        return 'COW';
    }

    // General Overworld Night Hostiles
    const nightHostiles = ['ZOMBIE', 'SKELETON', 'SPIDER', 'CREEPER', 'ENDERMAN', 'BAT'];
    const weights = [30, 25, 20, 15, 6, 4];
    let totalW = 100;
    let r = Math.random() * totalW;
    for (let i = 0; i < nightHostiles.length; i++) {
        r -= weights[i];
        if (r <= 0) return nightHostiles[i];
    }
    return 'ZOMBIE';
}

// ============================================
// Mobs & Entities
// ============================================
export class ItemEntity {
    constructor(item, count, position, atlas, velocity = null) {
        this.item = item;
        this.count = count;
        this.position = position.clone();
        if (velocity) {
            this.velocity = velocity.clone();
        } else {
            this.velocity = new THREE.Vector3((Math.random()-0.5)*5, 3, (Math.random()-0.5)*5);
        }
        this.alive = true;
        this.mesh = null;
        this.atlas = atlas;
        this.age = 0;
    }

    getMesh() {
        if (!this.mesh) {
            if (this.item.type === 'block') {
                const iconCanvas = this.atlas.getBlockIcon(this.item.subtype);
                const tex = new THREE.CanvasTexture(iconCanvas);
                tex.magFilter = THREE.NearestFilter;
                tex.colorSpace = THREE.SRGBColorSpace;
                const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
                this.mesh = new THREE.Sprite(mat);
                this.mesh.scale.set(0.4, 0.4, 0.4);
            } else if (this.item.type === 'material' || this.item.type === 'equipment' || this.item.type === 'wand' || this.item.type === 'spell' || this.item.type === 'modifier' || this.item.type === 'food' || this.item.type === 'spawn_egg') {
                let cvs;
                let tex;
                const updateTex = (canvas) => {
                    if (tex) {
                        tex.image = canvas;
                        tex.needsUpdate = true;
                    }
                };
                if (this.item.type === 'material' || this.item.type === 'equipment' || this.item.type === 'food' || this.item.type === 'spawn_egg') {
                    cvs = generateItemTexture(this.item.type, this.item.subtype, updateTex);
                } else if (this.item.type === 'wand') {
                    cvs = generateItemTexture('wand', this.item.subtype || 'wand_basic', updateTex);
                } else if (this.item.type === 'spell') {
                    cvs = generateItemTexture('spell', this.item.data.spell.element || 'spell_basic', updateTex);
                } else if (this.item.type === 'modifier') {
                    cvs = generateItemTexture('modifier', this.item.subtype, updateTex);
                }
                tex = new THREE.CanvasTexture(cvs);
                tex.magFilter = THREE.NearestFilter;
                tex.colorSpace = THREE.SRGBColorSpace;
                const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
                this.mesh = new THREE.Sprite(mat);
                this.mesh.scale.set(0.4, 0.4, 0.4);
            } else {
                const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 }); // generic item color
                this.mesh = new THREE.Mesh(geo, mat);
            }
            this.mesh.position.copy(this.position);
        }
        return this.mesh;
    }

    update(dt, world, playerPos) {
        if (!this.alive) return;
        this.age += dt;
        
        this.velocity.y -= 15 * dt; // gravity
        
        const velStep = this.velocity.clone().multiplyScalar(dt);
        const col = world.collide(this.position, velStep, 0.3, 0.3);
        this.position.copy(col.position);
        
        if (col.velocity.x === 0) this.velocity.x = 0;
        if (col.velocity.y === 0) this.velocity.y = 0;
        if (col.velocity.z === 0) this.velocity.z = 0;
        
        if (col.grounded) {
            this.velocity.x *= 0.5;
            this.velocity.z *= 0.5;
        }

        if (this.mesh) {
            this.mesh.position.copy(this.position);
            // Floating animation
            this.mesh.position.y += Math.sin(this.age * 3) * 0.1 + 0.15;
            if (this.mesh.rotation) {
                this.mesh.rotation.y += dt;
            }
        }

        // Pickup range
        if (this.age > 0.5 && this.position.distanceTo(playerPos) < 1.5) {
            this.alive = false;
        }
    }

    dispose() {
        if (this.mesh) {
            if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) {
                this.mesh.material.dispose();
                if (this.mesh.material.map) this.mesh.material.map.dispose();
            }
        }
    }
}

export class Mob {
    constructor(typeKey, position, posY, posZ, options = {}) {
        this.type = typeKey;
        const config = MOB_TYPES[typeKey] || MOB_TYPES.SLIME;
        this.config = config;
        const opts = (typeof posY === 'object' && posY !== null && typeof posY.x !== 'number') ? posY : (options || {});
        if (position && typeof position.clone === 'function') {
            this.position = position.clone();
        } else if (typeof position === 'number') {
            this.position = new THREE.Vector3(position, posY || 0, posZ || 0);
        } else if (position && typeof position.x === 'number') {
            this.position = new THREE.Vector3(position.x, position.y || 0, position.z || 0);
        } else {
            this.position = new THREE.Vector3(0, 0, 0);
        }
        this.velocity = new THREE.Vector3(0,0,0);
        this.health = config.health;
        this.maxHealth = config.health;
        this.damage = config.damage;
        this.speed = config.speed;
        this.hostile = config.hostile;
        this.color = config.color;
        this.size = config.size;
        this.width = config.width || config.size || 0.8;
        this.height = config.height || (config.size ? Math.max(config.size * 1.4, 0.8) : 1.8);
        this.depth = config.depth || this.width;
        this.hitboxWidth = this.width;
        this.hitboxHeight = this.height;
        this.hitboxDepth = this.depth;
        this.flying = config.flying || false;
        this.mesh = null;
        this.alive = true;
        this.grounded = false;
        this.age = 0;
        this.isMoving = false;
        
        this.target = null;
        this.attackCooldown = 0;
        this.tintTimer = 0;
        this.freezeTimer = 0;
        this.burnTimer = 0;
        this.burnTickTimer = 0;
        this.poisonTimer = 0;
        this.poisonTickTimer = 0;
        this.originalSpeed = config.speed;
        
        // 1% chance for any sheep spawned to be a pink sheep
        if (this.type === 'SHEEP') {
            this.isPinkSheep = (opts.isPinkSheep !== undefined) ? opts.isPinkSheep : (Math.random() < 0.01);
        }

        // Health bar
        this.healthBar = null;
    }

    getMesh() {
        if (!this.mesh) {
            if (this.config.buildMesh) {
                this.mesh = this.config.buildMesh();
            } else {
                // Fallback box
                this.mesh = new THREE.Group();
                const geo = new THREE.BoxGeometry(this.size, this.size, this.size);
                const mat = getMobMaterial(this.type);
                const body = new THREE.Mesh(geo, mat);
                body.position.y = this.size/2;
                body.castShadow = true;
                this.mesh.add(body);
            }
            
            // Ensure unique materials so tinting one doesn't tint all
            this.mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(m => m.clone());
                    } else {
                        child.material = child.material.clone();
                    }
                }
            });

            // If Pink Sheep, tint wool parts to authentic Minecraft pink
            if (this.type === 'SHEEP' && this.isPinkSheep) {
                const pinkColor = 0xf48bc9;
                this.mesh.traverse(child => {
                    if (child.isMesh && (child.name === 'body_wool' || child.name === 'head_wool')) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.color.setHex(pinkColor));
                        } else if (child.material) {
                            child.material.color.setHex(pinkColor);
                        }
                    }
                });
            }

            // Measure actual mesh geometry bounds to compute accurate 3D hitbox
            const geomBox = new THREE.Box3().setFromObject(this.mesh);
            const sizeVec = new THREE.Vector3();
            geomBox.getSize(sizeVec);
            
            // Set generous hitbox dimensions matching actual 3D visual bounds with generous minimums for small animals
            this.hitboxWidth = Math.max(this.width, sizeVec.x, 0.6);
            this.hitboxHeight = Math.max(this.height, sizeVec.y, 0.7);
            this.hitboxDepth = Math.max(this.depth, sizeVec.z, 0.6);
            this.height = this.hitboxHeight;
            this.width = this.hitboxWidth;
            this.depth = this.hitboxDepth;

            // Add health bar above mob
            const barGroup = new THREE.Group();
            const bgGeo = new THREE.PlaneGeometry(0.6, 0.06);
            const bgMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
            const bg = new THREE.Mesh(bgGeo, bgMat);
            barGroup.add(bg);
            
            const fgGeo = new THREE.PlaneGeometry(0.58, 0.04);
            const fgMat = new THREE.MeshBasicMaterial({ color: 0xff2244, side: THREE.DoubleSide });
            const fg = new THREE.Mesh(fgGeo, fgMat);
            fg.position.z = 0.001;
            this.healthBar = fg;
            barGroup.add(fg);
            
            barGroup.position.y = this.hitboxHeight + 0.3;
            barGroup.name = 'healthBar';
            this.mesh.add(barGroup);
            
            this.mesh.position.copy(this.position);
        }
        return this.mesh;
    }

    update(dt, world, playerPos, isDay = false, currentDimension = 'overworld') {
        if (!this.alive) return;
        this.age += dt;

        if (this.config.isStationary || this.type === 'END_CRYSTAL') {
            this.velocity.set(0, 0, 0);
            if (this.mesh) {
                this.mesh.position.copy(this.position);
                if (this.config.animate) {
                    this.config.animate(this.mesh, dt, this.age, false);
                }
            }
            return;
        }
        
        const feetBlock = world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y), Math.floor(this.position.z));
        const midBlock = world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y + this.size * 0.5), Math.floor(this.position.z));
        const propsFeet = getBlockProperties(feetBlock);
        const propsMid = getBlockProperties(midBlock);
        const inWater = (propsFeet && (propsFeet.isLiquid || propsFeet.isWaterlogged)) || (propsMid && (propsMid.isLiquid || propsMid.isWaterlogged));

        if (feetBlock === BLOCKS.FIRE || feetBlock === BLOCKS.LAVA || midBlock === BLOCKS.LAVA) {
            this.burnTimer = 2.0;
        }

        // Hostile undead mobs burn in direct sunlight during daytime in Overworld
        if (isDay && currentDimension === 'overworld' && (this.type === 'ZOMBIE' || this.type === 'SKELETON') && !inWater) {
            this.sunCheckTimer = (this.sunCheckTimer || 0) + dt;
            if (this.sunCheckTimer >= 0.5) {
                this.sunCheckTimer = 0;
                const mx = Math.floor(this.position.x);
                const my = Math.floor(this.position.y + this.size);
                const mz = Math.floor(this.position.z);
                let hasRoof = false;
                for (let y = my + 1; y < Math.min(127, my + 16); y++) {
                    const b = world.getBlock(mx, y, mz);
                    if (b !== BLOCKS.AIR && b !== BLOCKS.GLASS) {
                        hasRoof = true;
                        break;
                    }
                }
                if (!hasRoof) {
                    this.burnTimer = 3.0;
                }
            }
        }

        if (!this.flying) {
            if (this.config.waterOnly && inWater) {
                // Buoyancy/swimming for aquatic mobs
                this.velocity.y += (Math.sin(this.age * 3) * 2.0 - this.velocity.y) * dt * 2;
            } else if (inWater) {
                // Buoyancy / swimming for land animals (Minecraft style: float on water, gentle bobbing)
                const targetVy = 2.2;
                this.velocity.y += (targetVy - this.velocity.y) * dt * 6.0;
                this.velocity.x *= Math.pow(0.85, dt * 20);
                this.velocity.z *= Math.pow(0.85, dt * 20);
            } else {
                this.velocity.y -= 25 * dt; // gravity
                if (this.velocity.y < -50) this.velocity.y = -50;
            }
        }
        
        // Decrease tint timer
        if (this.tintTimer > 0) {
            this.tintTimer -= dt;
            if (this.tintTimer <= 0 && this.mesh) {
                // Reset all materials to original colors
                this.mesh.traverse(child => {
                    if (child.isMesh && child.userData.originalColor !== undefined) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach((mat, idx) => {
                                if (Array.isArray(child.userData.originalColor) && child.userData.originalColor[idx] !== undefined) {
                                    if (mat.color) mat.color.setHex(child.userData.originalColor[idx]);
                                }
                            });
                        } else if (child.material && child.material.color) {
                            child.material.color.setHex(child.userData.originalColor);
                        }
                    }
                });
            }
        }

        if (this.freezeTimer > 0) {
            this.freezeTimer -= dt;
            this.speed = this.originalSpeed * 0.3;
            if (this.freezeTimer <= 0) {
                this.speed = this.originalSpeed;
            }
        }
        
        if (this.burnTimer > 0) {
            this.burnTimer -= dt;
            this.burnTickTimer -= dt;
            if (this.burnTickTimer <= 0) {
                this.health -= 2;
                this.burnTickTimer = 1.0;
                                if (this.health <= 0) {
                    this.alive = false;
                }
            }
        }

        if (this.poisonTimer > 0) {
            this.poisonTimer -= dt;
            this.poisonTickTimer -= dt;
            if (this.poisonTickTimer <= 0) {
                this.health -= 1; // 1 damage per half second
                this.poisonTickTimer = 0.5;
                                if (this.health <= 0) {
                    this.alive = false;
                }
                // Tint green temporarily
                if (this.mesh && this.tintTimer <= 0) {
                    this.mesh.traverse(child => {
                        if (child.isMesh && child.material) {
                            if (Array.isArray(child.material)) {
                                if (child.userData.originalColor === undefined) {
                                    child.userData.originalColor = child.material.map(m => m.color ? m.color.getHex() : 0xffffff);
                                }
                                child.material.forEach(m => {
                                    if (m.color) m.color.setHex(0x33CC33);
                                });
                            } else if (child.material.color) {
                                if (child.userData.originalColor === undefined) {
                                    child.userData.originalColor = child.material.color.getHex();
                                }
                                child.material.color.setHex(0x33CC33);
                            }
                        }
                    });
                    this.tintTimer = 0.2;
                }
            }
        }

        // AI Delegation
        this.isMoving = false;
        if (this.config.updateAI) {
            this.config.updateAI(this, dt, world, playerPos);
            // Deduce moving state from velocity (ignore small Y adjustments like floating/bobbing)
            if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1) {
                this.isMoving = true;
            }
        } else {
            // Simple Generic AI
            const dist = this.position.distanceTo(playerPos);
        
        if (!this.wanderTimer) this.wanderTimer = 0;
        if (!this.wanderDir) this.wanderDir = new THREE.Vector3(0, 0, 0);
        
        if (this.hostile && dist < 22) {
            const dir = _tempVec3.subVectors(playerPos, this.position);
            if (!this.flying) dir.y = 0;
            if (dir.length() > 0) dir.normalize();

            // Face player
            if (this.mesh) {
                this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
            }

            // Special Skeleton Ranged Tactical AI
            if (this.type === 'SKELETON') {
                if (!this.shootTimer) this.shootTimer = 1.0 + Math.random() * 1.5;
                this.shootTimer -= dt;

                if (dist < 6.0) {
                    // Back up away from player
                    this.isMoving = true;
                    this.velocity.x = -dir.x * this.speed * 0.8;
                    this.velocity.z = -dir.z * this.speed * 0.8;
                } else if (dist > 14.0) {
                    // Close the distance
                    this.isMoving = true;
                    this.velocity.x = dir.x * this.speed;
                    this.velocity.z = dir.z * this.speed;
                } else {
                    // Strafe side to side while in archery range
                    this.isMoving = true;
                    const strafeX = -dir.z;
                    const strafeZ = dir.x;
                    const strafeSign = (Math.sin(this.age * 2.0) > 0 ? 1 : -1);
                    this.velocity.x = strafeX * this.speed * 0.7 * strafeSign;
                    this.velocity.z = strafeZ * this.speed * 0.7 * strafeSign;
                }

                // Fire arrow
                if (this.shootTimer <= 0 && dist < 20) {
                    this.shootTimer = 1.8 + Math.random() * 0.8;
                    if (this.manager && this.manager.shootSkeletonArrow) {
                        this.manager.shootSkeletonArrow(this.position, playerPos);
                    }
                }
            } else if (dist > 1.5) {
                this.isMoving = true;
                this.velocity.x = dir.x * this.speed;
                this.velocity.z = dir.z * this.speed;
                
                if (this.flying) {
                    const targetY = playerPos.y + 1;
                    this.velocity.y = (targetY - this.position.y) * 2;
                }
            } else {
                this.velocity.x *= 0.8;
                this.velocity.z *= 0.8;
                if (this.attackCooldown <= 0) {
                    this.attackCooldown = 1.0;
                    this.didAttack = true;
                }
            }

            // Smart jump assist & obstacle climbing (non-flying mobs)
            if (!this.flying) {
                const aheadX = Math.floor(this.position.x + dir.x * 0.65);
                const aheadY = Math.floor(this.position.y);
                const aheadZ = Math.floor(this.position.z + dir.z * 0.65);
                const blockAhead = world.getBlock(aheadX, aheadY, aheadZ);
                const isBlocked = getBlockProperties(blockAhead).solid;

                if (isBlocked) {
                    if (this.type === 'SPIDER') {
                        // Spiders climb walls smoothly
                        this.velocity.y = 5.0;
                    } else if (this.grounded) {
                        // Check if block above is open to jump over
                        const blockAbove = world.getBlock(aheadX, aheadY + 1, aheadZ);
                        if (!getBlockProperties(blockAbove).solid) {
                            this.velocity.y = 7.0;
                            this.grounded = false;
                        }
                    }
                }
            }
        } else {
            // Wander
            if (this.wanderTimer <= 0) {
                if (Math.random() < 0.6) {
                    this.wanderTimer = 2 + Math.random() * 3;
                    const angle = Math.random() * Math.PI * 2;
                    this.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                } else {
                    this.wanderTimer = 1 + Math.random() * 3;
                    this.wanderDir.set(0, 0, 0); // stop
                }
            }
            this.wanderTimer -= dt;

            if (this.wanderDir.lengthSq() > 0) {
                this.isMoving = true;
                this.velocity.x = this.wanderDir.x * this.speed * 0.4;
                this.velocity.z = this.wanderDir.z * this.speed * 0.4;
                
                if (this.flying) {
                    // Slight bobbing
                    this.velocity.y = Math.sin(this.age * 2) * 1.5;
                }
                
                if (this.mesh) {
                    this.mesh.rotation.y = Math.atan2(this.wanderDir.x, this.wanderDir.z);
                }

                // Jump over obstacles
                if (!this.flying && this.grounded && Math.random() < dt * 2) {
                    const aheadX = Math.floor(this.position.x + this.wanderDir.x);
                    const aheadY = Math.floor(this.position.y);
                    const aheadZ = Math.floor(this.position.z + this.wanderDir.z);
                    const blockAhead = world.getBlock(aheadX, aheadY, aheadZ);
                    if (getBlockProperties(blockAhead).solid) {
                        this.velocity.y = 6;
                        this.grounded = false;
                    }
                }
            } else {
                this.velocity.x *= 0.8;
                this.velocity.z *= 0.8;
                if (this.flying || this.config.waterOnly) this.velocity.y *= 0.9;
            }
        } // End of else Wander
        } // End of else Generic AI

        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        if (inWater) {
            this.isMoving = true; // Paddle and swim in water
        }

        // Obstacle auto-jump for walking mobs (Minecraft step-up jump over 1-block steps)
        if (!this.flying && !this.config.waterOnly && this.grounded && this.isMoving) {
            const speedSq = this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z;
            if (speedSq > 0.01) {
                const moveSpeed = Math.sqrt(speedSq);
                const dirX = this.velocity.x / moveSpeed;
                const dirZ = this.velocity.z / moveSpeed;
                const aheadX = Math.floor(this.position.x + dirX * 0.6);
                const aheadY = Math.floor(this.position.y + 0.1);
                const aheadZ = Math.floor(this.position.z + dirZ * 0.6);
                const blockAhead = world.getBlock(aheadX, aheadY, aheadZ);
                const blockAbove = world.getBlock(aheadX, aheadY + 1, aheadZ);
                const pAhead = getBlockProperties(blockAhead);
                const pAbove = getBlockProperties(blockAbove);

                if (pAhead && pAhead.solid && (!pAbove || !pAbove.solid)) {
                    this.velocity.y = 6.2;
                    this.grounded = false;
                }
            }
        }

        const velStep = this.velocity.clone().multiplyScalar(dt);
        const scale = this.isBoss ? 2.0 : 1.0;
        const colW = (this.width || (this.size * 0.8)) * scale;
        const colH = (this.height || this.size) * scale;
        const col = world.collide(this.position, velStep, colW, colH);
        this.position.copy(col.position);
        
        if (col.velocity.x === 0) {
            this.velocity.x = 0;
            if (this.wanderDir && Math.abs(this.wanderDir.x) > 0.1) this.wanderDir.x *= -0.8;
        }
        if (col.velocity.z === 0) {
            this.velocity.z = 0;
            if (this.wanderDir && Math.abs(this.wanderDir.z) > 0.1) this.wanderDir.z *= -0.8;
        }
        if (col.velocity.y === 0) this.velocity.y = 0;

        if (!this.flying && !this.config.waterOnly) {
            this.grounded = col.grounded;
        } else {
            // Flying / swimming extra boundary checks
            if (this.position.y < 0) {
                this.position.y = 0;
                this.velocity.y *= -0.5;
            }
        }

        // Void death check for all mobs falling out of the world
        if (this.position.y < -15) {
            this.health = 0;
            this.alive = false;
        }

        // Mob suffocation check when head is inside solid block
        const headY = Math.floor(this.position.y + colH * 0.8);
        const headBlock = world.getBlock(Math.floor(this.position.x), headY, Math.floor(this.position.z));
        if (getBlockProperties(headBlock).solid) {
            this.suffocateTimer = (this.suffocateTimer || 0) + dt;
            if (this.suffocateTimer >= 1.0) {
                this.suffocateTimer = 0;
                this.takeDamage(2);
            }
        } else {
            this.suffocateTimer = 0;
        }
        
        if (this.mesh) {
            // Smoothly interpolate mob mesh position to eliminate physics micro-stutters
            const distSq = this.mesh.position.distanceToSquared(this.position);
            if (distSq > 9 || distSq < 0.00005) {
                this.mesh.position.copy(this.position);
            } else {
                this.mesh.position.lerp(this.position, Math.min(1.0, dt * 25));
            }
            
            // Animate
            if (this.config.animate) {
                this.config.animate(this.mesh, dt, this.age, this.isMoving);
            }
            
            // Update health bar
            if (this.healthBar) {
                const pct = this.health / this.maxHealth;
                this.healthBar.scale.x = Math.max(0, pct);
                this.healthBar.position.x = -(1 - pct) * 0.29;
                // Show only when damaged
                const barGroup = this.mesh.getObjectByName('healthBar');
                if (barGroup) barGroup.visible = this.health < this.maxHealth;
            }
        }
    }

    takeDamage(amt, dir) {
        if (this.type === 'END_CRYSTAL') {
            this.health = 0;
            this.alive = false;
            if (this.manager && this.manager.createExplosion) {
                this.manager.createExplosion(this.position.clone(), 6, 35);
            }
            return;
        }
        this.health -= amt;
        
        // Damage tint — color all child meshes red
        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        if (child.userData.originalColor === undefined) {
                            child.userData.originalColor = child.material.map(m => m.color ? m.color.getHex() : 0xffffff);
                        }
                        child.material.forEach(m => {
                            if (m.color) m.color.setHex(0xff0000);
                        });
                    } else if (child.material.color) {
                        if (child.userData.originalColor === undefined) {
                            child.userData.originalColor = child.material.color.getHex();
                        }
                        child.material.color.setHex(0xff0000);
                    }
                }
            });
            this.tintTimer = 0.2;
        }

        if (dir) {
            this.velocity.add(_tempVec3.copy(dir).multiplyScalar(5));
            this.velocity.y += 3;
            this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        }
        if (this.health <= 0 && this.alive) {
            this.alive = false;
            this.justDied = true;
        }
    }

    freeze(duration) {
        this.freezeTimer = Math.max(this.freezeTimer || 0, duration);
        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        if (child.userData.originalColor === undefined) {
                            child.userData.originalColor = child.material.map(m => m.color ? m.color.getHex() : 0xffffff);
                        }
                        child.material.forEach(m => {
                            if (m.color) m.color.setHex(0x88ccff);
                        });
                    } else if (child.material.color) {
                        if (child.userData.originalColor === undefined) {
                            child.userData.originalColor = child.material.color.getHex();
                        }
                        child.material.color.setHex(0x88ccff); // blue tint
                    }
                }
            });
            this.tintTimer = Math.max(this.tintTimer, duration);
        }
    }

    dispose() {
        if (this.mesh) {
            if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
            this.mesh.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else if (child.material) {
                        child.material.dispose();
                    }
                }
            });
        }
    }
}

export class Boss extends Mob {
    constructor(typeKey, position, bossTheme = 'normal') {
        super(typeKey, position);
        this.health *= 3;
        this.maxHealth = this.health;
        this.damage *= 2;
        this.speed *= 0.8;
        this.isBoss = true;
        this.phase = 1;
        this.abilityTimer = 0;
        this.didSlam = false;
        this.wantsToSummon = false;
        this.bossTheme = bossTheme;
        this.wantsToCastFireball = false;
        this.wantsToFreeze = false;
        this.wantsToPull = false;
        this.wantsToTeleport = false;
        this.wantsToDrain = false;
        this.wantsSonicBoom = false;
    }
    
    getMesh() {
        super.getMesh();
        // Scale boss mesh up significantly
        if (this.mesh) {
            this.mesh.scale.setScalar(2.0);
        }
        return this.mesh;
    }

    update(dt, world, playerPos, isDay = false, currentDimension = 'overworld') {
        super.update(dt, world, playerPos, isDay, currentDimension);
        if (!this.alive) return;

        const dist = this.position.distanceTo(playerPos);
        if (dist > 32) return;

        // Phase Transition (Enrage below 50% health)
        const pct = this.health / this.maxHealth;
        if (this.phase === 1 && pct <= 0.5) {
            this.phase = 2;
            this.speed *= 1.3;
            this.damage *= 1.3;
            if (this.mesh) {
                this.mesh.traverse(child => {
                    if (child.isMesh && child.material && child.material.emissive) {
                        child.material.emissive.setHex(0x550000);
                        child.material.emissiveIntensity = 1.5;
                    }
                });
            }
        }

        // Theme-specific abilities
        this.abilityTimer += dt;
        const abilityInterval = this.phase === 1 ? 5.0 : 3.5;

        if (this.abilityTimer > abilityInterval) {
            this.abilityTimer = 0;
            const r = Math.random();

            switch (this.bossTheme) {
                case 'fire':
                    if (r < 0.5) {
                        this.wantsToCastFireball = true; // Fireball barrage
                    } else {
                        this.velocity.y = 8; this.didSlam = true; // Fire slam
                    }
                    break;
                case 'ice':
                    if (r < 0.5) {
                        this.wantsToFreeze = true; // Freeze blast
                    } else {
                        this.wantsToSummon = true;
                    }
                    break;
                case 'jungle':
                    if (r < 0.5) {
                        this.wantsToPull = true; // Vine grab
                    } else {
                        this.velocity.y = 8; this.didSlam = true;
                    }
                    break;
                case 'desert':
                    if (r < 0.5) {
                        this.wantsToTeleport = true; // Teleport behind player
                    } else {
                        this.velocity.y = 8; this.didSlam = true;
                    }
                    break;
                case 'undead':
                    if (r < 0.4) {
                        this.wantsToDrain = true; // Soul drain
                    } else {
                        this.wantsToSummon = true; // Mass summon
                    }
                    break;
                default: // normal (WARDEN)
                    if (r < 0.5) {
                        this.velocity.y = 8; this.didSlam = true;
                    } else {
                        this.wantsSonicBoom = true;
                    }
                    break;
            }
        }
    }
}

export class EntityManager {
    constructor(scene, atlas) {
        this.scene = scene;
        this.atlas = atlas;
        this.mobs = [];
        this.items = [];
        this.spawnTimer = 0;
    }

    addMob(mob) {
        mob.manager = this;
        this.mobs.push(mob);
        this.scene.add(mob.getMesh());
    }

    spawnItem(item, count, position, velocity = null) {
        const iEntity = new ItemEntity(item, count, position, this.atlas, velocity);
        this.items.push(iEntity);
        this.scene.add(iEntity.getMesh());
    }

    update(dt, world, playerPos, playerInventory, player, timeOfDay = 0.5, currentDimension = 'overworld') {
        // Day: 0.25 to 0.75. Night: 0.75-1.0 and 0.0-0.25
        const isDay = timeOfDay >= 0.25 && timeOfDay <= 0.75;
        // Boss spawner detection (uses tracked world.spawners set for O(1) checks instead of 36,000 getBlock calls)
        this.bossScanTimer = (this.bossScanTimer || 0) + dt;
        if (this.bossScanTimer > 2.0) {
            this.bossScanTimer = 0;
            const px = Math.floor(playerPos.x);
            const py = Math.floor(playerPos.y);
            const pz = Math.floor(playerPos.z);
            let foundX = null, foundY = null, foundZ = null;

            if (world && world.spawners && world.spawners.size > 0) {
                for (const key of world.spawners) {
                    const [sx, sy, sz] = key.split(',').map(Number);
                    if (Math.abs(sx - px) <= 16 && Math.abs(sy - py) <= 16 && Math.abs(sz - pz) <= 16) {
                        foundX = sx; foundY = sy; foundZ = sz;
                        break;
                    }
                }
            } else {
                // Fast local check within 6 blocks
                for (let x = -6; x <= 6 && foundX === null; x++) {
                    for (let y = -6; y <= 6 && foundX === null; y++) {
                        for (let z = -6; z <= 6 && foundX === null; z++) {
                            if (world.getBlock(px+x, py+y, pz+z) === BLOCKS.BOSS_SPAWNER) {
                                foundX = px + x; foundY = py + y; foundZ = pz + z;
                            }
                        }
                    }
                }
            }

            if (foundX !== null) {
                world.setBlock(foundX, foundY, foundZ, BLOCKS.AIR);
                if (world.spawners) world.spawners.delete(`${foundX},${foundY},${foundZ}`);
                // Determine boss type based on surrounding blocks (theme)
                let themeBlock = world.getBlock(foundX, foundY - 1, foundZ);
                let bossType = 'WARDEN';
                let bossTheme = 'normal';
                if (themeBlock === BLOCKS.DUNGEON_FIRE_FLOOR || themeBlock === BLOCKS.NETHER_BRICKS) { bossType = 'PIGLIN_BRUISER'; bossTheme = 'fire'; }
                else if (themeBlock === BLOCKS.DUNGEON_ICE_FLOOR) { bossType = 'SKELETON'; bossTheme = 'ice'; }
                else if (themeBlock === BLOCKS.DUNGEON_JUNGLE_FLOOR) { bossType = 'SPIDER'; bossTheme = 'jungle'; }
                else if (themeBlock === BLOCKS.DUNGEON_DESERT_FLOOR) { bossType = 'ZOMBIE'; bossTheme = 'desert'; }
                else if (themeBlock === BLOCKS.DUNGEON_UNDEAD_FLOOR) { bossType = 'SKELETON'; bossTheme = 'undead'; }
                const boss = new Boss(bossType, new THREE.Vector3(foundX, foundY, foundZ), bossTheme);
                this.addMob(boss);
            }
        }

        // Structure inhabitant spawners (Village, Igloo, Witch Hut) throttled to 1.0s interval
        this.structureCheckTimer = (this.structureCheckTimer || 0) + dt;
        if (this.structureCheckTimer >= 1.0) {
            this.structureCheckTimer = 0;

            // Village inhabitants spawner (Iron Golem + Villagers)
            if (!this.spawnedVillages) this.spawnedVillages = new Set();
            if (currentDimension === 'overworld' && typeof window.getClosestVillagePosition === 'function') {
                const vSeed = (window.worldGenParams ? window.worldGenParams.seed : ((window.game && window.game.planetParams) ? window.game.planetParams.seed : 12345));
                const vPos = window.getClosestVillagePosition(playerPos.x, playerPos.z, vSeed);
                if (vPos) {
                    const distV = Math.hypot(playerPos.x - vPos.x, playerPos.z - vPos.z);
                    const vKey = `${vPos.x}_${vPos.z}`;
                    if (distV < 80 && !this.spawnedVillages.has(vKey)) {
                        this.spawnedVillages.add(vKey);
                        
                        const getGround = (x, z) => {
                            if (world && typeof world.getHighestBlock === 'function') {
                                const h = world.getHighestBlock(Math.floor(x), Math.floor(z));
                                if (h > 0) return h;
                            }
                            if (this.game && this.game.world && typeof this.game.world.getHighestBlock === 'function') {
                                const h = this.game.world.getHighestBlock(Math.floor(x), Math.floor(z));
                                if (h > 0) return h;
                            }
                            return vPos.y || 64;
                        };

                        // Spawn Iron Golem protector in village
                        const gy = getGround(vPos.x + 3, vPos.z + 3);
                        const golem = new Mob('GOLEM', new THREE.Vector3(vPos.x + 3, gy + 1, vPos.z + 3));
                        this.addMob(golem);

                        // Spawn Villagers in various spots across the village: well, blacksmith, library, farm, cabin
                        const vOffsets = [
                            { dx: 2, dz: 0 },
                            { dx: -2, dz: 2 },
                            { dx: 12, dz: 12 },
                            { dx: -12, dz: 12 },
                            { dx: 12, dz: -12 },
                            { dx: -12, dz: -12 }
                        ];
                        for (const off of vOffsets) {
                            const vx = vPos.x + off.dx;
                            const vz = vPos.z + off.dz;
                            const vy = getGround(vx, vz);
                            const villager = new Mob('VILLAGER', new THREE.Vector3(vx, vy + 1, vz));
                            this.addMob(villager);
                        }

                        // Spawn farm animals inside the village animal pen & hay bale area
                        const penY = getGround(vPos.x - 8, vPos.z + 8);
                        const sheep1 = new Mob('SHEEP', new THREE.Vector3(vPos.x - 8, penY + 1, vPos.z + 8));
                        const sheep2 = new Mob('SHEEP', new THREE.Vector3(vPos.x - 7, penY + 1, vPos.z + 9));
                        const cow1 = new Mob('COW', new THREE.Vector3(vPos.x - 9, penY + 1, vPos.z + 8));
                        this.addMob(sheep1);
                        this.addMob(sheep2);
                        this.addMob(cow1);

                        const hayY = getGround(vPos.x + 8, vPos.z + 7);
                        const chicken1 = new Mob('CHICKEN', new THREE.Vector3(vPos.x + 8, hayY + 1, vPos.z + 7));
                        this.addMob(chicken1);
                    }
                }
            }

            // Igloo basement inhabitants spawner (Villager + Zombie in holding cells)
            if (!this.spawnedIgloos) this.spawnedIgloos = new Set();
            if (currentDimension === 'overworld' && typeof window.getClosestIglooPosition === 'function') {
                const iSeed = (window.worldGenParams ? window.worldGenParams.seed : ((window.game && window.game.planetParams) ? window.game.planetParams.seed : 12345));
                const iPos = window.getClosestIglooPosition(playerPos.x, playerPos.z, iSeed);
                if (iPos) {
                    const distI = Math.hypot(playerPos.x - iPos.x, playerPos.z - iPos.z);
                    const iKey = `${iPos.x}_${iPos.z}`;
                    if (distI < 24 && playerPos.y < 52 && !this.spawnedIgloos.has(iKey)) {
                        this.spawnedIgloos.add(iKey);
                        const trapX = iPos.x - 1;
                        const trapZ = iPos.z - 1;
                        const baseY = (iPos.y || 64) - 20;
                        const villager = new Mob('VILLAGER', new THREE.Vector3(trapX - 2.5, baseY + 1, trapZ));
                        this.addMob(villager);
                        const zombie = new Mob('ZOMBIE', new THREE.Vector3(trapX + 2.5, baseY + 1, trapZ));
                        this.addMob(zombie);
                    }
                }
            }

            // Witch Hut inhabitant spawner (Witch inside swamp hut)
            if (!this.spawnedWitchHuts) this.spawnedWitchHuts = new Set();
            if (currentDimension === 'overworld' && typeof window.getClosestWitchHutPosition === 'function') {
                const wParams = window.worldGenParams || (window.game && window.game.planetParams);
                const wSeed = wParams ? wParams.seed : 12345;
                const wPos = window.getClosestWitchHutPosition(playerPos.x, playerPos.z, wSeed, wParams);
                if (wPos) {
                    const distW = Math.hypot(playerPos.x - wPos.x, playerPos.z - wPos.z);
                    const wKey = `${wPos.x}_${wPos.z}`;
                    if (distW < 36 && !this.spawnedWitchHuts.has(wKey)) {
                        this.spawnedWitchHuts.add(wKey);
                        const floorY = (wPos.y || 64) + 3;
                        const witch = new Mob('WITCH', new THREE.Vector3(wPos.x, floorY, wPos.z));
                        this.addMob(witch);
                        const cat = new Mob('CAT', new THREE.Vector3(wPos.x + 1, floorY, wPos.z + 1));
                        this.addMob(cat);
                    }
                }
            }
        }

        // Mob Spawning with timer
        this.spawnTimer += dt;
        if (this.spawnTimer > 1.5 && this.mobs.length < 24) {
            this.spawnTimer = 0;
            const angle = Math.random() * Math.PI * 2;
            const dist = 16 + Math.random() * 22;
            const sx = Math.floor(playerPos.x + Math.cos(angle) * dist);
            const sz = Math.floor(playerPos.z + Math.sin(angle) * dist);

            // 1. Attempt Subterranean / Cave Darkness Spawn (Hostile mobs spawn in the dark regardless of time of day!)
            const tryCaveSpawn = (Math.random() < 0.55 || playerPos.y < 58);
            let caveSpawnFound = false;

            if (tryCaveSpawn && currentDimension === 'overworld') {
                const minY = Math.max(8, Math.floor(playerPos.y - 18));
                const maxY = Math.min(62, Math.floor(playerPos.y + 12));

                for (let y = maxY; y >= minY; y--) {
                    const bFloor = world.getBlock(sx, y - 1, sz);
                    const bAir1 = world.getBlock(sx, y, sz);
                    const bAir2 = world.getBlock(sx, y + 1, sz);

                    const floorProps = getBlockProperties(bFloor);
                    if (floorProps.solid && bFloor !== BLOCKS.LAVA && bAir1 === BLOCKS.AIR && bAir2 === BLOCKS.AIR) {
                        // Check if block has roof overhead blocking daylight (cave / darkness)
                        let hasRoof = false;
                        for (let checkY = y + 2; checkY <= Math.min(127, y + 28); checkY++) {
                            const roofB = world.getBlock(sx, checkY, sz);
                            if (getBlockProperties(roofB).solid) {
                                hasRoof = true;
                                break;
                            }
                        }

                        if (hasRoof || !isDay) {
                            const caveHostiles = ['ZOMBIE', 'SKELETON', 'SPIDER', 'CREEPER', 'ENDERMAN'];
                            if (y <= 36) caveHostiles.push('SLIME');
                            const chosenType = caveHostiles[Math.floor(Math.random() * caveHostiles.length)];

                            const mob = new Mob(chosenType, new THREE.Vector3(sx + 0.5, y, sz + 0.5));
                            this.addMob(mob);
                            caveSpawnFound = true;
                            break;
                        }
                    }
                }
            }

            // 2. Surface Spawning (when cave spawn not used or did not find a spot)
            if (!caveSpawnFound && this.mobs.length < 24) {
                for (let y = 127; y > 0; y--) {
                    const b = world.getBlock(sx, y, sz);
                    if (b !== BLOCKS.AIR && b !== BLOCKS.LAVA) {
                        let type;
                        if (b === BLOCKS.WATER || b === BLOCKS.SWAMP_WATER) {
                            let isReef = false;
                            for (let cx = -2; cx <= 2; cx++) {
                                for (let cz = -2; cz <= 2; cz++) {
                                    const fb = world.getBlock(sx + cx, y - 1, sz + cz);
                                    if (fb >= BLOCKS.TUBE_CORAL && fb <= BLOCKS.HORN_CORAL) {
                                        isReef = true;
                                        break;
                                    }
                                }
                                if (isReef) break;
                            }
                            
                            if (isReef) {
                                const reefAquatic = ['TROPICAL_FISH', 'PUFFERFISH'];
                                type = reefAquatic[Math.floor(Math.random() * reefAquatic.length)];
                            } else {
                                const aquatic = ['SALMON', 'COD', 'TURTLE'];
                                type = aquatic[Math.floor(Math.random() * aquatic.length)];
                            }
                        } else {
                            const biomeBlock = b;
                            let biome = 'plains';
                            if (world && typeof world.getBiomeAt === 'function') {
                                const bObj = world.getBiomeAt(sx, sz);
                                if (bObj && bObj.name) biome = bObj.name;
                            } else {
                                if (biomeBlock === BLOCKS.SAND || biomeBlock === BLOCKS.RED_SAND) biome = 'desert';
                                else if (biomeBlock === BLOCKS.SNOW || biomeBlock === BLOCKS.ICE || biomeBlock === BLOCKS.PACKED_ICE || biomeBlock === BLOCKS.BLUE_ICE) biome = 'snow';
                                else if (biomeBlock === BLOCKS.SWAMP_GRASS || biomeBlock === BLOCKS.MUD) biome = 'swamp';
                                else if (biomeBlock === BLOCKS.ALIEN_GRASS) biome = 'alien';
                            }

                            type = pickRandomMobType(currentDimension, biome, isDay, biomeBlock);
                            while (MOB_TYPES[type].waterOnly) {
                                type = pickRandomMobType(currentDimension, biome, isDay, biomeBlock);
                            }
                        }
                        // Strictly no hostile surface spawns at daytime in Overworld
                        const config = MOB_TYPES[type];
                        const isHostile = (config.damage || 0) > 0 || config.hostile === true;
                        if (isHostile && isDay && currentDimension === 'overworld') break;

                        let spawnY = y + 2;
                        if (config.flying) spawnY = y + 5 + Math.random() * 10;
                        if (config.waterOnly) {
                            spawnY = y;
                            const floorDist = Math.floor(Math.random() * 2);
                            for (let i = 0; i < floorDist; i++) {
                                const below = world.getBlock(sx, spawnY - 1, sz);
                                if (below === BLOCKS.WATER || below === BLOCKS.SWAMP_WATER) spawnY--;
                                else break;
                            }
                        }
                        
                        const spawnCount = config.waterOnly ? (Math.floor(Math.random() * 3) + 2) : 1;
                        for (let i = 0; i < spawnCount; i++) {
                            if (this.mobs.length >= 30) break;
                            const offsetX = config.waterOnly ? (Math.random() - 0.5) * 4 : 0;
                            const offsetZ = config.waterOnly ? (Math.random() - 0.5) * 4 : 0;
                            const mob = new Mob(type, new THREE.Vector3(sx + offsetX, spawnY, sz + offsetZ));
                            this.addMob(mob);
                        }
                        break;
                    }
                }
            }
        }

        // Check End Crystal healing link to Ender Dragon
        const dragonMob = this.mobs.find(m => m.type === 'ENDER_DRAGON' && m.alive);
        if (dragonMob) {
            let closestCrystal = null;
            let closestDist = 70;
            for (const m of this.mobs) {
                if (m.type === 'END_CRYSTAL' && m.alive) {
                    const d = m.position.distanceTo(dragonMob.position);
                    if (d < closestDist) {
                        closestDist = d;
                        closestCrystal = m;
                    }
                }
            }
            dragonMob.healingFromCrystal = !!closestCrystal;
            if (closestCrystal && this.scene) {
                if (!this.crystalBeamMesh) {
                    const bGeo = new THREE.CylinderGeometry(0.12, 0.12, 1, 8);
                    const bMat = new THREE.MeshBasicMaterial({ color: 0xd946ef, transparent: true, opacity: 0.85 });
                    this.crystalBeamMesh = new THREE.Mesh(bGeo, bMat);
                    this.scene.add(this.crystalBeamMesh);
                }
                const start = closestCrystal.position.clone().add(new THREE.Vector3(0, 1.2, 0));
                const end = dragonMob.position.clone().add(new THREE.Vector3(0, 1.5, 0));
                const mid = start.clone().lerp(end, 0.5);
                const dist = start.distanceTo(end);
                this.crystalBeamMesh.position.copy(mid);
                this.crystalBeamMesh.scale.set(1, dist, 1);
                this.crystalBeamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
                this.crystalBeamMesh.visible = true;
            } else if (this.crystalBeamMesh) {
                this.crystalBeamMesh.visible = false;
            }
        } else if (this.crystalBeamMesh) {
            this.crystalBeamMesh.visible = false;
        }

        for (let i = this.mobs.length - 1; i >= 0; i--) {
            const mob = this.mobs[i];
            mob.update(dt, world, playerPos, isDay, currentDimension);
            
            // Mob deals damage to player
            const maxReach = (mob.type === 'WITCH') ? 9.0 : 2.0;
            if (player && mob.alive && mob.didAttack && mob.position.distanceTo(playerPos) < maxReach) {
                player.takeDamage(mob.damage);
                mob.didAttack = false;
                if (mob.type === 'WITCH') {
                    if (window.game && window.game.audio && window.game.audio.playPotionThrow) {
                        window.game.audio.playPotionThrow(mob.position);
                    }
                    if (window.game && window.game.audio && window.game.audio.playPotionSplash) {
                        setTimeout(() => window.game.audio.playPotionSplash(playerPos), 150);
                    }
                    if (window.game && window.game.particles) {
                        window.game.particles.emit(playerPos, 'magic', 18, 0x800080);
                    }
                }
                // Damage flash
                const d = document.getElementById('damage-flash');
                if (d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
            }

            // Boss Abilities
            if (mob.isBoss && player && mob.alive) {
                if (mob.didSlam && mob.grounded && mob.velocity.y <= 0) {
                    mob.didSlam = false;
                    const dist = mob.position.distanceTo(playerPos);
                    if (dist < 10) {
                        player.takeDamage(mob.damage * 1.5);
                        player.velocity.y = 6; // Knockup effect
                        const d = document.getElementById('damage-flash');
                        if (d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
                    }
                }
                if (mob.wantsToSummon) {
                    mob.wantsToSummon = false;
                    const count = mob.bossTheme === 'undead' ? 3 : 1;
                    for (let si = 0; si < count; si++) {
                        const sx = mob.position.x + (Math.random() - 0.5) * 6;
                        const sz = mob.position.z + (Math.random() - 0.5) * 6;
                        let minionTypes = ['SKELETON', 'ZOMBIE', 'SPIDER'];
                        if (mob.bossTheme === 'undead') minionTypes = ['SKELETON', 'ZOMBIE'];
                        else if (mob.bossTheme === 'ice') minionTypes = ['SKELETON'];
                        const minion = new Mob(minionTypes[Math.floor(Math.random() * minionTypes.length)], new THREE.Vector3(sx, mob.position.y + 1, sz));
                        this.addMob(minion);
                    }
                }
                if (mob.wantsToCastFireball) {
                    mob.wantsToCastFireball = false;
                    mob.wantsToCastWind = playerPos.clone().sub(mob.position).normalize();
                }
                if (mob.wantsToFreeze) {
                    mob.wantsToFreeze = false;
                    if (player && mob.position.distanceTo(playerPos) < 12) {
                        player.speedMultiplier = 0.3;
                        setTimeout(() => { if (player) player.speedMultiplier = 1.0; }, 3000);
                    }
                }
                if (mob.wantsToPull) {
                    mob.wantsToPull = false;
                    if (player && mob.position.distanceTo(playerPos) < 16) {
                        const pullDir = mob.position.clone().sub(playerPos).normalize().multiplyScalar(8);
                        player.velocity.x += pullDir.x;
                        player.velocity.z += pullDir.z;
                        player.velocity.y += 2;
                    }
                }
                if (mob.wantsToTeleport) {
                    mob.wantsToTeleport = false;
                    if (player) {
                        const behind = playerPos.clone();
                        const facing = new THREE.Vector3(0, 0, -1).applyQuaternion(player.mesh ? player.mesh.quaternion : new THREE.Quaternion());
                        behind.addScaledVector(facing, -3);
                        mob.position.copy(behind);
                        mob.position.y = playerPos.y;
                    }
                }
                if (mob.wantsToDrain) {
                    mob.wantsToDrain = false;
                    if (player && mob.position.distanceTo(playerPos) < 10) {
                        const drainDmg = 8;
                        player.takeDamage(drainDmg);
                        mob.health = Math.min(mob.maxHealth, mob.health + drainDmg * 2);
                        const d = document.getElementById('damage-flash');
                        if (d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
                    }
                }
                if (mob.wantsSonicBoom) {
                    mob.wantsSonicBoom = false;
                    const dir = playerPos.clone().sub(mob.position).normalize();
                    if (this.shootSonicBoom) {
                        this.shootSonicBoom(mob.position.clone().add(new THREE.Vector3(0, 1.8, 0)), playerPos);
                    } else if (player && mob.position.distanceTo(playerPos) < 24) {
                        player.takeDamage(25);
                        player.velocity.add(dir.clone().multiplyScalar(14)).add(new THREE.Vector3(0, 6, 0));
                        const d = document.getElementById('damage-flash');
                        if (d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
                    }
                }
            }
            
            if (mob.justDied) {
                if (mob.type === 'SHEEP') {
                    const woolBlock = mob.isPinkSheep ? (BLOCKS.PINK_WOOL || BLOCKS.WOOL) : BLOCKS.WOOL;
                    const woolName = mob.isPinkSheep ? 'Pink Wool' : 'Wool';
                    this.spawnItem(Item.blockItem(woolBlock, woolName), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                    this.spawnItem(Item.foodItem('raw_mutton', 12, 'Raw Mutton', 'Heals some health.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'COW') {
                    this.spawnItem(Item.foodItem('raw_beef', 15, 'Raw Beef', 'Heals some health.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                    const leatherCount = Math.floor(Math.random() * 3);
                    if (leatherCount > 0) {
                        this.spawnItem(Item.materialItem('leather', 'Leather', 'Used for crafting armor and items.'), leatherCount, mob.position.clone());
                    }
                } else if (mob.type === 'PIG') {
                    this.spawnItem(Item.foodItem('raw_porkchop', 15, 'Raw Porkchop', 'Heals some health.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'CHICKEN') {
                    this.spawnItem(Item.foodItem('raw_chicken', 10, 'Raw Chicken', 'Heals a little health.'), 1, mob.position.clone());
                    if (Math.random() < 0.5) this.spawnItem(Item.materialItem('feather', 'Feather', 'Used for crafting.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'POLAR_BEAR') {
                    this.spawnItem(Item.foodItem('raw_fish', 10, 'Raw Cod', 'Heals some health.'), 1 + Math.floor(Math.random() * 3), mob.position.clone());
                    if (Math.random() < 0.25) this.spawnItem(Item.foodItem('raw_fish', 10, 'Raw Salmon', 'Heals some health.'), 1, mob.position.clone());
                } else if (mob.type === 'SNOW_GOLEM') {
                    const snowballItem = new Item('material', 'snowball', {}, 'Snowball');
                    snowballItem.stackable = true;
                    snowballItem.maxStack = 16;
                    this.spawnItem(snowballItem, 2 + Math.floor(Math.random() * 5), mob.position.clone());
                } else if (mob.type === 'WITCH') {
                    const dRoll = Math.random();
                    if (dRoll < 0.35) this.spawnItem(Item.materialItem('glowstone_dust', 'Glowstone Dust', 'Magical glowing dust.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                    else if (dRoll < 0.65) this.spawnItem(Item.materialItem('gunpowder', 'Gunpowder', 'Explosive powder.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                    else this.spawnItem(Item.materialItem('stick', 'Stick', 'Crafting component.'), 1 + Math.floor(Math.random() * 3), mob.position.clone());
                } else if (['COD', 'SALMON', 'TROPICAL_FISH', 'PUFFERFISH'].includes(mob.type)) {
                    this.spawnItem(Item.foodItem('raw_fish', 10, 'Raw Fish', 'Heals some health.'), 1, mob.position.clone());
                } else if (mob.type === 'TURTLE') {
                    if (Math.random() < 0.3) this.spawnItem(Item.materialItem('turtle_scute', 'Turtle Scute', 'Tough material.'), 1, mob.position.clone());
                } else if (mob.type === 'CREEPER') {
                    this.spawnItem(Item.materialItem('gunpowder', 'Gunpowder', 'Explosive powder.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'ENDERMAN') {
                    const pearl = new Item('material', 'ender_pearl', {}, 'Ender Pearl');
                    pearl.stackable = true;
                    pearl.maxStack = 16;
                    this.spawnItem(pearl, 1 + (Math.random() < 0.5 ? 1 : 0), mob.position.clone());
                } else if (mob.type === 'BLAZE') {
                    const rod = new Item('material', 'blaze_rod', {}, 'Blaze Rod');
                    rod.stackable = true;
                    rod.maxStack = 64;
                    this.spawnItem(rod, 1 + (Math.random() < 0.5 ? 1 : 0), mob.position.clone());
                } else if (mob.type === 'ENDER_DRAGON') {
                    if (this.onDragonDefeated) {
                        this.onDragonDefeated(mob.position.clone());
                    }
                } else if (mob.type === 'ZOMBIE') {
                    this.spawnItem(Item.materialItem('rotten_flesh', 'Rotten Flesh', 'Gross.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'SKELETON') {
                    this.spawnItem(Item.materialItem('bone', 'Bone', 'Calcium rich.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                    const arrowCount = Math.floor(Math.random() * 3);
                    if (arrowCount > 0) {
                        this.spawnItem(Item.materialItem('arrow', 'Arrow', 'Ammunition for bows.'), arrowCount, mob.position.clone());
                    }
                } else if (mob.type === 'SPIDER') {
                    this.spawnItem(Item.materialItem('string', 'String', 'Silk thread.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'SLIME') {
                    this.spawnItem(Item.materialItem('slime_ball', 'Slimeball', 'Sticky green slime.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'LAVASLIME') {
                    this.spawnItem(Item.materialItem('lavaslime_ball', 'Magma Cream', 'Hot and sticky.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'PIGLIN_BRUISER') {
                    this.spawnItem(Item.materialItem('netherite_scrap', 'Netherite Scrap', 'Tough nether metal.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                    if (Math.random() < 0.2) this.spawnItem(Item.materialItem('gold_ingot', 'Gold Ingot', 'Shiny.'), 1, mob.position.clone());
                } else if (mob.type === 'WARDEN') {
                    const sculkBlock = (window.BLOCKS && window.BLOCKS.SCULK_CATALYST) ? window.BLOCKS.SCULK_CATALYST : 380;
                    this.spawnItem(Item.blockItem(sculkBlock, 'Sculk Catalyst'), 1, mob.position.clone());
                    this.spawnItem(Item.materialItem('diamond', 'Diamond', 'Precious gem.'), 2 + Math.floor(Math.random() * 3), mob.position.clone());
                } else if (mob.type === 'GOLEM') {
                    this.spawnItem(Item.materialItem('iron_ingot', 'Iron Ingot', 'Solid iron.'), 3 + Math.floor(Math.random() * 3), mob.position.clone());
                } else if (mob.type === 'SWET') {
                    const cloudId = (window.BLOCKS && window.BLOCKS.BLUE_AERCLOUD) ? window.BLOCKS.BLUE_AERCLOUD : 135;
                    if (Math.random() < 0.6) {
                        this.spawnItem(Item.blockItem(cloudId, 'Blue Aercloud'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                    } else {
                        this.spawnItem(Item.materialItem('ambrosium_shard', 'Ambrosium Shard', 'Healing Aether shard.'), 1, mob.position.clone());
                    }
                } else if (mob.type === 'AERWHALE') {
                    const whiteCloudId = (window.BLOCKS && window.BLOCKS.AETHER_CLOUD) ? window.BLOCKS.AETHER_CLOUD : 134;
                    this.spawnItem(Item.blockItem(whiteCloudId, 'Cold Aercloud'), 2 + Math.floor(Math.random() * 3), mob.position.clone());
                    if (Math.random() < 0.5) this.spawnItem(Item.materialItem('feather', 'Feather'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                }
                
                // Generic drop logic (Spells/Modifiers)
                if (Math.random() < (mob.config.lootChance || 0.3)) {
                    if (Math.random() < 0.7) {
                        this.spawnItem(Item.spellItem(generateRandomSpell()), 1, mob.position.clone());
                    } else {
                        this.spawnItem(Item.modifierItem(generateRandomModifier()), 1, mob.position.clone());
                    }
                }
                
                // Boss Loot
                if (mob.isBoss) {
                    const r = Math.random();
                    if (r < 0.25) {
                        this.spawnItem(Item.equipmentItem('boss_chestplate', { protection: 5 }, 'Boss Armor', 'Wearable armor that reduces damage.'), 1, mob.position.clone());
                    } else if (r < 0.5) {
                        this.spawnItem(Item.equipmentItem('boss_boots', { flying: true }, 'Flying Boots', 'Allows you to fly.'), 1, mob.position.clone());
                    } else if (r < 0.75) {
                        this.spawnItem(Item.equipmentItem('boss_boots', { speedMult: 2.5 }, 'Speed Boots', 'Run super fast.'), 1, mob.position.clone());
                    } else {
                        this.spawnItem(Item.equipmentItem('boss_axe', { mineSpeed: 5.0 }, 'Super Mine Axe', 'Mines blocks instantly.'), 1, mob.position.clone());
                    }
                    // Boss always drops ender pearls
                    const pearlItem = new Item('material', 'ender_pearl', {}, 'Ender Pearl');
                    pearlItem.stackable = true;
                    pearlItem.maxStack = 16;
                    this.spawnItem(pearlItem, 2 + Math.floor(Math.random() * 3), mob.position.clone().add(new THREE.Vector3(0.5, 0.5, 0)));
                }

                mob.justDied = false;
            }

            // Despawn far mobs (never despawn bosses or End Crystals)
            const isPersistent = mob.isBoss || mob.type === 'ENDER_DRAGON' || mob.type === 'END_CRYSTAL';
            if (!mob.alive || (!isPersistent && mob.position.distanceTo(playerPos) > 60)) {
                mob.dispose();
                this.mobs.splice(i, 1);
            }
        }

        for (let i = this.items.length - 1; i >= 0; i--) {
            const itemE = this.items[i];
            itemE.update(dt, world, playerPos);
            if (!itemE.alive) {
                // Was picked up
                playerInventory.addItem(itemE.item, itemE.count);
                itemE.dispose();
                this.items.splice(i, 1);
            }
        }
    }

    raycast(origin, direction, maxDist = 8) {
        let closestMob = null;
        let closestDist = maxDist;

        // Simple AABB ray intersection
        for (const mob of this.mobs) {
            if (!mob.alive) continue;
            
            // Mob AABB using accurate 3D geometry dimensions + forgiving margin
            const w = (mob.hitboxWidth || mob.width || mob.size || 0.8);
            const h = (mob.hitboxHeight || mob.height || (mob.size * 1.5) || 1.8);
            const d = (mob.hitboxDepth || mob.depth || w);
            const pad = 0.12; // Hitbox margin so attacks never phantom-miss small animals
            
            _tempMin.set(mob.position.x - w/2 - pad, mob.position.y - pad, mob.position.z - d/2 - pad);
            _tempMax.set(mob.position.x + w/2 + pad, mob.position.y + h + pad, mob.position.z + d/2 + pad);
            _tempBox.set(_tempMin, _tempMax);
            _tempRay.set(origin, direction);
            
            if (_tempRay.intersectBox(_tempBox, _tempHit)) {
                const dist = origin.distanceTo(_tempHit);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestMob = mob;
                }
            }
        }
        return { hit: closestMob !== null, mob: closestMob, distance: closestDist };
    }

    // Alias for backwards compatibility
    raycastEntities(origin, direction, maxDist) {
        return this.raycast(origin, direction, maxDist);
    }
}

