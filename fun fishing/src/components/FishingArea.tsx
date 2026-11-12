import React from 'react';
import {
  Rod,
  Reel,
  Lure,
  CaughtFish,
  JunkItem,
  FishingAreaDef,
  WeatherDef,
  getWaitSpeedLabel,
  getRarityTextStyle,
  getFishSpriteUrl,
  getMutationFilterStyle,
  getRodSpriteUrl,
  getReelSpriteUrl,
  getLureSpriteUrl,
  getAreaBannerUrl,
  getJunkSpriteUrl,
  getAreaThemeButtonClass,
} from '../game/fishingLogic';

export type CastState =
  | 'idle'
  | 'waiting'
  | 'nibble'
  | 'bite'
  | 'reeling'
  | 'caught'
  | 'junk'
  | 'nothing'
  | 'treasure'
  | 'escaped';

interface FishingAreaProps {
  castState: CastState;
  rod: Rod;
  reel: Reel;
  lure: Lure;
  activeArea: FishingAreaDef;
  weather: WeatherDef;
  reelingRemainingSec: number;
  reelingProgressPercent: number;
  pendingCatch: CaughtFish | null;
  pendingJunk: JunkItem | null;
  pendingTreasureGold?: number | null;
  isNewRecord: boolean;
  liveBaitCharges?: number;
  useLiveBait?: boolean;
  weatherSightingActive?: boolean;
  weatherSightingSpeciesName?: string;
  onToggleLiveBait?: (enabled: boolean) => void;
  onCast: () => void;
  onReel: () => void;
  onCancel: () => void;
  onKeep: () => void;
  onDismissJunk: () => void;
  onClaimTreasure?: () => void;
  onResetToIdle: () => void;
}

export const FishingArea: React.FC<FishingAreaProps> = ({
  castState,
  rod,
  reel,
  lure,
  activeArea,
  weather,
  reelingRemainingSec,
  reelingProgressPercent,
  pendingCatch,
  pendingJunk,
  pendingTreasureGold,
  isNewRecord,
  liveBaitCharges = 0,
  useLiveBait = true,
  weatherSightingActive = false,
  weatherSightingSpeciesName,
  onToggleLiveBait,
  onCast,
  onReel,
  onCancel,
  onKeep,
  onDismissJunk,
  onClaimTreasure,
  onResetToIdle,
}) => {
  const isWaiting = castState === 'waiting' || castState === 'nibble';
  const isBite = castState === 'bite';
  const isReeling = castState === 'reeling';
  const isCaught = castState === 'caught' && pendingCatch;
  const isJunk = castState === 'junk' && pendingJunk;
  const isNothing = castState === 'nothing';
  const isEscaped = castState === 'escaped';

  const speedLabel = getWaitSpeedLabel(rod.waitSeconds);

  return (
    <div
      className={`relative border-2 ${activeArea.theme.borderClass} ${activeArea.theme.panelClass} p-5 sm:p-6 text-[#e3e6eb] transition-colors overflow-hidden shadow-xl`}
    >
      {/* Scenic Area Pixel Art Background (No darkening overlay - 100% pure pixel art) */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url(${getAreaBannerUrl(activeArea.id)})`,
          backgroundSize: 'cover',
          backgroundPosition: activeArea.bannerPosition || 'center center',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
        }}
      />

      <div className="relative z-10">
        <div className="min-h-[160px] flex flex-col items-center justify-center text-center py-3">
        {castState === 'idle' && (
          <div className="space-y-3">
            <button
              onClick={onCast}
              className={`w-64 py-3.5 px-6 font-bold text-base tracking-wide cursor-pointer transition-all active:scale-[0.98] ${getAreaThemeButtonClass(activeArea.id)}`}
            >
              Cast Line
            </button>

            {liveBaitCharges > 0 && onToggleLiveBait && (
              <div className="pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer border border-[#2b303c] bg-[#14161c] px-3 py-1.5 text-xs hover:border-sky-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={useLiveBait}
                    onChange={(e) => onToggleLiveBait(e.target.checked)}
                    className="accent-sky-400 cursor-pointer w-3.5 h-3.5"
                  />
                  <span className={`font-bold ${useLiveBait ? 'text-sky-300' : 'text-[#717885]'}`}>
                    Use Live Bait ({liveBaitCharges} left)
                  </span>
                </label>
                <div className="text-[10px] text-sky-400/90 mt-1">
                  {useLiveBait
                    ? 'Faster strikes · attracts trophy game'
                    : 'Off (saving bait)'}
                </div>
              </div>
            )}
          </div>
        )}

        {isWaiting && (
          <div className="w-full max-w-xs space-y-3 py-2 px-4 border-2 border-[#2b303c] bg-[#12141a]/95 shadow-xl">
            {liveBaitCharges > 0 && useLiveBait && (
              <div className="text-[10px] uppercase font-bold tracking-wider text-sky-400">
                Live Bait Rigged
              </div>
            )}
            {castState === 'nibble' ? (
              <div className="space-y-1">
                <div className="text-sm tracking-wide text-amber-300 font-bold animate-pulse">
                  [ Tension on line! ]
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-xs tracking-wide text-[#cbd5e1] font-bold">
                  [ Line in water... ]
                </div>
              </div>
            )}

            <div className="pt-1">
              <button
                onClick={onCancel}
                className="px-3 py-1.5 text-xs font-bold border border-[#3b404c] bg-[#16181f] text-[#8c94a2] hover:text-[#f1f3f5] hover:border-[#5a6272] cursor-pointer inline-flex items-center justify-center transition-colors"
              >
                Cancel Cast
              </button>
            </div>
          </div>
        )}

        {isBite && (
          <div className="space-y-3">
            <button
              onClick={onReel}
              className={`w-64 py-3.5 px-6 font-bold text-base tracking-wide cursor-pointer transition-all active:scale-[0.98] ${getAreaThemeButtonClass(activeArea.id)}`}
            >
              Reel In!
            </button>
          </div>
        )}

        {isReeling && (
          <div className="w-full max-w-xs space-y-2 p-3 border-2 border-[#2b303c] bg-[#12141a]/95">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#f1f3f5]">
                Reeling in...
              </span>
              <span className="text-[#8c94a2]">
                {reelingRemainingSec.toFixed(1)}s
              </span>
            </div>

            <div className="w-full bg-[#16181f] h-3 border border-[#3b404c] overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  activeArea.id === 'pond'
                    ? 'bg-emerald-500'
                    : activeArea.id === 'river'
                    ? 'bg-sky-500'
                    : activeArea.id === 'lake'
                    ? 'bg-teal-500'
                    : activeArea.id === 'bayou'
                    ? 'bg-amber-500'
                    : activeArea.id === 'ocean'
                    ? 'bg-blue-500'
                    : 'bg-fuchsia-500'
                }`}
                style={{ width: `${reelingProgressPercent}%` }}
              />
            </div>
          </div>
        )}

        {isEscaped && (
          <div className="space-y-3 max-w-xs p-4 border-2 border-rose-900/80 bg-[#161214]/95 shadow-xl">
            <div className="text-sm font-bold text-rose-300">
              The line snapped! The fish pulled away.
            </div>
            <button
              onClick={onResetToIdle}
              className={`py-2 px-5 text-xs font-bold cursor-pointer transition-all active:scale-95 ${getAreaThemeButtonClass(activeArea.id)}`}
            >
              Cast Again
            </button>
          </div>
        )}

        {isNothing && (
          <div className="space-y-3 max-w-xs p-4 border-2 border-[#2b303c] bg-[#12141a]/95 shadow-xl">
            <div className="text-sm font-bold text-[#cbd5e1]">
              {lure.id === 'none'
                ? 'Nothing on the bare hook! No fish bit.'
                : 'Nothing on the hook! The bait was stolen.'}
            </div>
            <button
              onClick={onResetToIdle}
              className={`py-2 px-5 text-xs font-bold cursor-pointer transition-all active:scale-95 ${getAreaThemeButtonClass(activeArea.id)}`}
            >
              Cast Again
            </button>
          </div>
        )}

        {isJunk && pendingJunk && (
          <div className="w-full max-w-sm border border-[#323640] bg-[#1d2026] p-4 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-[#292d36] pb-2">
              <div className="text-sm font-bold text-[#f1f3f5]">
                {pendingJunk.id === 'empty_hook' && lure.id === 'none'
                  ? 'Empty Bare Hook (No Bite)'
                  : pendingJunk.name}
              </div>
              <div className="text-xs text-[#8c94a2]">
                Value: ${pendingJunk.value}
              </div>
            </div>

            {/* Junk Item Pixel Art Sprite Preview */}
            <div className="py-3 px-4 border border-[#282b34] bg-[#121418] flex items-center justify-center">
              <img
                src={getJunkSpriteUrl(pendingJunk.id)}
                alt={pendingJunk.name}
                className="h-24 w-auto max-w-full object-contain select-none"
                style={{ imageRendering: 'pixelated' }}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <button
              onClick={onDismissJunk}
              className="w-full py-2 border border-[#3b404c] bg-[#242730] hover:bg-[#2c303b] text-xs font-bold text-[#f1f3f5] cursor-pointer text-center"
            >
              Toss Back &amp; Cast Again
            </button>
          </div>
        )}

        {castState === 'treasure' && (
          <div className="w-full max-w-sm border-2 border-amber-500/90 bg-[#1e1b12] p-5 text-left space-y-4 shadow-xl shadow-amber-950/40">
            <div className="flex items-start justify-between gap-2 border-b border-amber-800/60 pb-2.5">
              <div>
                <div className="text-base font-extrabold text-amber-300 tracking-wide">
                  Sunken Treasure Chest!
                </div>
                <div className="text-[10px] text-amber-400/80 uppercase font-semibold tracking-widest mt-0.5">
                  Ultra-Rare Salvage · 1% Strike
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-black text-amber-300">
                  +${(pendingTreasureGold ?? 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-amber-500/80 uppercase font-bold">
                  Bounty Paid
                </div>
              </div>
            </div>

            <div className="py-2 px-4 flex items-center justify-center">
              <img
                src="./fish/treasure_chest.png"
                alt="Sunken Treasure Chest"
                className="w-24 h-24 object-contain select-none"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <div className="text-xs text-amber-100/90 leading-relaxed bg-amber-950/50 p-2.5 border border-amber-800/40">
              You hauled an ancient iron-strapped pirate chest up from the deep! The lid snaps open to reveal a glittering hoard of doubloons, jewelry, and bullion.
            </div>

            <button
              onClick={onClaimTreasure ?? onResetToIdle}
              className="w-full py-2.5 border border-amber-500 bg-amber-600 hover:bg-amber-500 text-xs font-black text-amber-950 uppercase tracking-wider cursor-pointer shadow-md transition-colors"
            >
              Claim Treasure (+${(pendingTreasureGold ?? 0).toLocaleString()})
            </button>
          </div>
        )}

        {isCaught && pendingCatch && (
          <div className="w-full max-w-sm border border-[#323640] bg-[#1d2026] p-4 text-left space-y-3">
            <div className="flex items-start justify-between gap-2 border-b border-[#292d36] pb-2">
              <div>
                <div className={`text-base font-bold ${getRarityTextStyle(pendingCatch.tier)}`}>
                  {pendingCatch.name}
                </div>
                <div className="text-xs text-[#8c94a2] uppercase tracking-wider text-[11px] mt-0.5">
                  {pendingCatch.tier}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-400">
                  ${pendingCatch.value.toLocaleString()}
                </div>
                <div className="text-xs text-[#8c94a2]">
                  {pendingCatch.weight} lbs
                </div>
              </div>
            </div>

            {getFishSpriteUrl(pendingCatch) && (
              <div className="py-2.5 px-3 border border-[#2a2d36] bg-[#14161c] flex items-center justify-center">
                <img
                  src={getFishSpriteUrl(pendingCatch)!}
                  alt={pendingCatch.name}
                  className="h-28 w-auto max-w-full object-contain select-none"
                  style={{
                    imageRendering: 'pixelated',
                    ...getMutationFilterStyle(pendingCatch.mutation),
                  }}
                />
              </div>
            )}

            {(pendingCatch.isTrophy || isNewRecord) && (
              <div className="flex gap-2 text-xs">
                {pendingCatch.isTrophy && (
                  <span className="px-2 py-0.5 border border-amber-500/70 bg-amber-950/40 text-amber-300 font-bold" title="Trophy">
                    Trophy
                  </span>
                )}
                {isNewRecord && (
                  <span className="px-2 py-0.5 border border-sky-500/70 bg-sky-950/40 text-sky-300 font-bold">
                    New Record
                  </span>
                )}
              </div>
            )}

            <div className="pt-1">
              <button
                onClick={onKeep}
                className="w-full py-2.5 px-4 border border-emerald-600/80 bg-emerald-950/50 hover:bg-emerald-900/60 text-xs font-bold text-emerald-200 cursor-pointer text-center transition-colors"
              >
                Hold Fish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
};
