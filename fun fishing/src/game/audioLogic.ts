/**
 * Cozy Reel - Audio Manager
 * Handles ambient looping background audio and sound effects.
 */

class SoundManager {
  private muted: boolean = false;
  private ambientVolume: number = 0.75; // Default ambient volume (75%)
  private sfxVolume: number = 0.42;     // Balanced reeling SFX volume
  private autoPauseOnTabHide: boolean = true;
  private currentAreaId: string | null = null;
  private ambientTracks: HTMLAudioElement[] = [];
  private reelAudio: HTMLAudioElement | null = null;
  private reelLoopStart: number = 0;
  private reelLoopEnd: number = 0;
  private reelTimeListener: (() => void) | null = null;
  private initialized: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMuted = localStorage.getItem('cozy_reel_muted');
      if (savedMuted !== null) {
        this.muted = savedMuted === 'true';
      }

      const savedAmbientVol = localStorage.getItem('cozy_reel_ambient_vol');
      if (savedAmbientVol !== null) {
        const parsed = parseFloat(savedAmbientVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          // If stored at previous automated defaults (0.18 or 0.32), elevate to requested 0.75
          this.ambientVolume = parsed === 0.18 || parsed === 0.32 ? 0.75 : parsed;
        }
      } else {
        localStorage.setItem('cozy_reel_ambient_vol', '0.75');
      }

      const savedSfxVol = localStorage.getItem('cozy_reel_sfx_vol');
      if (savedSfxVol !== null) {
        const parsed = parseFloat(savedSfxVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          // If stored at previous ultra-quiet 0.22 level, elevate to balanced 0.42
          this.sfxVolume = parsed === 0.22 ? 0.42 : parsed;
        }
      } else {
        localStorage.setItem('cozy_reel_sfx_vol', '0.42');
      }

      const savedAutoPause = localStorage.getItem('cozy_reel_autopause');
      if (savedAutoPause !== null) {
        this.autoPauseOnTabHide = savedAutoPause === 'true';
      }

      this.initUnlockListener();
      this.initVisibilityListener();
    }
  }

  private initUnlockListener() {
    if (typeof window === 'undefined' || this.initialized) return;
    this.initialized = true;

    const unlock = () => {
      if (this.currentAreaId && !this.muted && this.ambientTracks.length > 0) {
        for (const audio of this.ambientTracks) {
          if (audio.paused) {
            audio.play().catch(() => {});
          }
        }
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  private initVisibilityListener() {
    if (typeof window === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (!this.autoPauseOnTabHide) return;
      if (document.hidden) {
        for (const audio of this.ambientTracks) {
          if (!audio.paused) audio.pause();
        }
        if (this.reelAudio && !this.reelAudio.paused) {
          this.reelAudio.pause();
        }
      } else {
        if (!this.muted && this.currentAreaId && this.ambientTracks.length > 0) {
          for (const audio of this.ambientTracks) {
            if (audio.paused) audio.play().catch(() => {});
          }
        }
      }
    });
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    return this.setMuted(!this.muted);
  }

  public setMuted(muted: boolean): boolean {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cozy_reel_muted', String(muted));
    }
    if (muted) {
      this.stopAll();
    } else if (this.currentAreaId) {
      this.playAreaAmbience(this.currentAreaId);
    }
    return this.muted;
  }

  public getAmbientVolume(): number {
    return this.ambientVolume;
  }

  public setAmbientVolume(vol: number) {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('cozy_reel_ambient_vol', String(this.ambientVolume));
    }
    // Update live playing ambient tracks
    this.updateAmbientTracksVolume();
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('cozy_reel_sfx_vol', String(this.sfxVolume));
    }
    if (this.reelAudio) {
      this.reelAudio.volume = this.sfxVolume;
    }
  }

  public getAutoPauseOnTabHide(): boolean {
    return this.autoPauseOnTabHide;
  }

  public setAutoPauseOnTabHide(enabled: boolean) {
    this.autoPauseOnTabHide = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cozy_reel_autopause', String(enabled));
    }
  }

  public stopAll() {
    this.stopAmbience();
    this.stopReelingSfx();
  }

  public stopAmbience() {
    for (const audio of this.ambientTracks) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
    }
    this.ambientTracks = [];
  }

  private updateAmbientTracksVolume() {
    if (!this.currentAreaId) return;
    const baseMult = this.ambientVolume;

    if (this.currentAreaId === 'river' && this.ambientTracks.length >= 2) {
      this.ambientTracks[0].volume = baseMult * 0.95;
      this.ambientTracks[1].volume = baseMult * 0.85;
    } else if (this.currentAreaId === 'ocean' && this.ambientTracks.length >= 2) {
      this.ambientTracks[0].volume = baseMult * 0.95;
      this.ambientTracks[1].volume = baseMult * 0.75;
    } else {
      for (const audio of this.ambientTracks) {
        audio.volume = baseMult;
      }
    }
  }

  public playAreaAmbience(areaId: string) {
    // If already playing this area's ambience, do not restart it midway through
    if (this.currentAreaId === areaId && this.ambientTracks.length > 0) {
      if (!this.muted) {
        for (const audio of this.ambientTracks) {
          if (audio.paused) audio.play().catch(() => {});
        }
      }
      return;
    }

    this.currentAreaId = areaId;
    this.stopAmbience();

    if (this.muted || typeof window === 'undefined') return;

    let trackConfigs: Array<{ src: string; volume: number }> = [];
    const base = this.ambientVolume;

    switch (areaId) {
      case 'pond':
        trackConfigs = [{ src: './audio/pond.mp3', volume: base }];
        break;
      case 'lake':
        trackConfigs = [{ src: './audio/lake.mp3', volume: base }];
        break;
      case 'bayou':
        trackConfigs = [{ src: './audio/marsh.mp3', volume: base }];
        break;
      case 'river':
        trackConfigs = [
          { src: './audio/river.mp3', volume: base * 0.95 },
          { src: './audio/birds.mp3', volume: base * 0.85 },
        ];
        break;
      case 'ocean':
        trackConfigs = [
          { src: './audio/ocean.mp3', volume: base * 0.95 },
          { src: './audio/gulls.mp3', volume: base * 0.75 },
        ];
        break;
      case 'reef':
        trackConfigs = [{ src: './audio/coral.mp3', volume: base }];
        break;
      default:
        trackConfigs = [{ src: './audio/pond.mp3', volume: base }];
    }

    const createdAudios: HTMLAudioElement[] = [];
    for (const cfg of trackConfigs) {
      const audio = new Audio(cfg.src);
      audio.loop = true;
      audio.volume = cfg.volume;
      audio.onended = () => {
        if (!this.muted) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
      };
      createdAudios.push(audio);
      audio.play().catch(() => {});
    }
    this.ambientTracks = createdAudios;
  }

  public startReelingSfx() {
    if (this.muted || typeof window === 'undefined') return;
    if (!this.reelAudio) {
      this.reelAudio = new Audio('./audio/reel.mp3');
      this.reelAudio.preload = 'auto';
    }

    if (this.reelTimeListener) {
      this.reelAudio.removeEventListener('timeupdate', this.reelTimeListener);
      this.reelTimeListener = null;
    }

    this.reelAudio.volume = this.sfxVolume;

    // Pick a random looping section between 3.5 and 6 seconds long from reel.mp3 (41.8s duration)
    const duration =
      this.reelAudio.duration && !isNaN(this.reelAudio.duration) && this.reelAudio.duration > 8
        ? this.reelAudio.duration
        : 41.8;

    const sliceDuration = 3.5 + Math.random() * 2.5; // 3.5s to 6.0s section
    const maxStart = Math.max(0, duration - sliceDuration - 1.0);
    this.reelLoopStart = Math.random() * maxStart;
    this.reelLoopEnd = this.reelLoopStart + sliceDuration;

    try {
      this.reelAudio.currentTime = this.reelLoopStart;
    } catch {}

    // Looping boundary handler to loop this specific random section
    this.reelTimeListener = () => {
      if (!this.reelAudio) return;
      if (this.reelAudio.currentTime >= this.reelLoopEnd) {
        this.reelAudio.currentTime = this.reelLoopStart;
      }
    };
    this.reelAudio.addEventListener('timeupdate', this.reelTimeListener);

    try {
      this.reelAudio.play().catch(() => {});
    } catch {}
  }

  public stopReelingSfx() {
    if (this.reelAudio) {
      if (this.reelTimeListener) {
        this.reelAudio.removeEventListener('timeupdate', this.reelTimeListener);
        this.reelTimeListener = null;
      }
      try {
        this.reelAudio.pause();
      } catch {}
    }
  }
}

export const soundManager = new SoundManager();
