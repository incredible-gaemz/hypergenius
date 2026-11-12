/**
 * Audio disabled as requested: zero Web Audio contexts created, completely silent.
 */

class SoundSystem {
  public toggleMute(): boolean { return true; }
  public getMuted(): boolean { return true; }
  public playCastSplash(): void {}
  public playNibble(): void {}
  public playBiteAlert(): void {}
  public playReelClick(): void {}
  public playCatchFanfare(): void {}
  public playCoins(): void {}
  public playEquip(): void {}
  public playLineSnap(): void {}
}

export const sounds = new SoundSystem();
