import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  WhaleSpecies,
  CaughtWhale,
  rollWhaleEncounter,
  getWhaleSpriteUrl,
  getWhaleFightStats,
  WhaleFightStats,
  hasMaxWhalingGear,
  isMegaWhale,
} from '../game/whalingLogic';
import { soundManager } from '../game/audioLogic';

interface WhalingTabProps {
  money: number;
  ownedRodIds?: string[];
  ownedReelIds?: string[];
  onAddMoney: (amount: number) => void;
  onWhaleCaught?: (whale: CaughtWhale) => void;
}

type HuntState = 'idle' | 'searching' | 'spotted' | 'fighting' | 'caught' | 'escaped';

export const WhalingTab: React.FC<WhalingTabProps> = ({
  ownedRodIds = [],
  ownedReelIds = [],
  onAddMoney,
  onWhaleCaught,
}) => {
  const hasMaxGear = hasMaxWhalingGear(ownedRodIds, ownedReelIds);
  const [whaleHold, setWhaleHold] = useState<CaughtWhale[]>(() => {
    try {
      const saved = localStorage.getItem('cozy_reel_whaling_hold_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [state, setState] = useState<HuntState>('idle');
  const [currentWhale, setCurrentWhale] = useState<WhaleSpecies | null>(null);
  const [weightLbs, setWeightLbs] = useState<number>(0);
  const [saleValue, setSaleValue] = useState<number>(0);
  const [lastCaught, setLastCaught] = useState<CaughtWhale | null>(null);
  const [escapeMsg, setEscapeMsg] = useState<string>('');
  const [searchSecondsLeft, setSearchSecondsLeft] = useState<number>(0);

  // Live fight display state
  const [distance, setDistance] = useState<number>(200);
  const [initialDistance, setInitialDistance] = useState<number>(200);
  const [tension, setTension] = useState<number>(25);
  const [whalePulling, setWhalePulling] = useState<boolean>(false);
  const [isPressingReel, setIsPressingReel] = useState<boolean>(false);

  // Refs for smooth, 20 ticks/sec physics loop
  const stateRef = useRef<HuntState>('idle');
  stateRef.current = state;

  const currentWhaleRef = useRef<WhaleSpecies | null>(null);
  currentWhaleRef.current = currentWhale;

  const weightLbsRef = useRef<number>(0);
  weightLbsRef.current = weightLbs;

  const saleValueRef = useRef<number>(0);
  saleValueRef.current = saleValue;

  const fightStatsRef = useRef<WhaleFightStats | null>(null);
  const distanceRef = useRef<number>(200);
  const tensionRef = useRef<number>(25);
  const isReelingRef = useRef<boolean>(false);
  const whalePullingRef = useRef<boolean>(false);

  const loopRef = useRef<NodeJS.Timeout | null>(null);
  const searchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pullSwitchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Ocean audio on open
  useEffect(() => {
    soundManager.playAreaAmbience('ocean');
  }, []);

  // Save hold
  useEffect(() => {
    try {
      localStorage.setItem('cozy_reel_whaling_hold_v1', JSON.stringify(whaleHold));
    } catch {}
  }, [whaleHold]);

  // Clean timers
  useEffect(() => {
    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
      if (pullSwitchTimerRef.current) clearTimeout(pullSwitchTimerRef.current);
      soundManager.stopReelingSfx();
    };
  }, []);

  // Searching for whales (9 to 14 seconds)
  const handleStartSearch = () => {
    setState('searching');
    setEscapeMsg('');
    setCurrentWhale(null);

    const totalSec = Math.floor(9 + Math.random() * 5);
    setSearchSecondsLeft(totalSec);

    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    let remaining = totalSec;

    searchIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setSearchSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(searchIntervalRef.current!);
        const encounter = rollWhaleEncounter(ownedRodIds, ownedReelIds);
        setCurrentWhale(encounter.whale);
        setWeightLbs(encounter.weightLbs);
        setSaleValue(encounter.saleValue);
        setState('spotted');
      }
    }, 1000);
  };

  // Start the fight with scaled stats based on whale species & weight
  const handleHookWhale = () => {
    if (!currentWhale) return;

    if (isMegaWhale(currentWhale.id) && !hasMaxGear) {
      setState('escaped');
      setEscapeMsg(
        `Gear snapped! The titan ${currentWhale.name} tore right through your standard whaling rig. Heavy Hydraulic Boom and Commercial Winch Reel required!`
      );
      return;
    }

    const stats = getWhaleFightStats(currentWhale, weightLbs);
    fightStatsRef.current = stats;

    distanceRef.current = stats.startDistanceM;
    tensionRef.current = 25;
    isReelingRef.current = false;
    whalePullingRef.current = false;

    setDistance(stats.startDistanceM);
    setInitialDistance(stats.startDistanceM);
    setTension(25);
    setWhalePulling(false);
    setIsPressingReel(false);

    setState('fighting');
    startWhalePullCycle(stats);
    startFightPhysicsLoop(stats);
  };

  // Whale pull & rest schedule, dynamically adjusting as the whale tires
  const startWhalePullCycle = (stats: WhaleFightStats) => {
    if (pullSwitchTimerRef.current) clearTimeout(pullSwitchTimerRef.current);

    const nextSwitch = () => {
      if (stateRef.current !== 'fighting') return;

      const isPulling = !whalePullingRef.current;
      whalePullingRef.current = isPulling;
      setWhalePulling(isPulling);

      // Fatigue factor: as distance drops, whale gets tired
      const progress = distanceRef.current / stats.startDistanceM;
      const fatigue = Math.max(0.25, Math.min(1.0, progress));

      let durationMs: number;
      if (isPulling) {
        // Runs are longer when whale is fresh, shorter when tired
        durationMs = stats.pullDurationSec * fatigue * (0.8 + Math.random() * 0.4) * 1000;
      } else {
        // Rests are longer as the whale tires
        const restMultiplier = 1.6 - fatigue * 0.6;
        durationMs = stats.restDurationSec * restMultiplier * (0.8 + Math.random() * 0.4) * 1000;
      }

      pullSwitchTimerRef.current = setTimeout(nextSwitch, Math.max(1200, durationMs));
    };

    // First pull starts after 1.5s
    pullSwitchTimerRef.current = setTimeout(nextSwitch, 1500);
  };

  // 50ms physics tick (20 updates/sec)
  const startFightPhysicsLoop = (stats: WhaleFightStats) => {
    if (loopRef.current) clearInterval(loopRef.current);

    loopRef.current = setInterval(() => {
      if (stateRef.current !== 'fighting' || !currentWhaleRef.current) {
        clearInterval(loopRef.current!);
        return;
      }

      const isReeling = isReelingRef.current;
      const isPulling = whalePullingRef.current;
      const progress = distanceRef.current / stats.startDistanceM;
      const fatigue = Math.max(0.3, Math.min(1.0, progress));

      if (isReeling) {
        if (isPulling) {
          // Reeling against a heavy surge: violent tension spike!
          tensionRef.current += stats.pullStrength * 1.8;
          // Whale still pulls out a bit of line despite the winch
          distanceRef.current = Math.min(
            stats.maxDistanceM,
            distanceRef.current + (stats.runSpeedMps * 0.25 * fatigue) * 0.05
          );
        } else {
          // Reeling while whale rests: winch makes steady headway
          distanceRef.current = Math.max(0, distanceRef.current - (stats.reelSpeedMps * 0.05));
          tensionRef.current += 1.5;
        }
      } else {
        if (isPulling) {
          // Letting the whale run: tension drops safely, whale strips line
          tensionRef.current = Math.max(18, tensionRef.current - 2.5);
          distanceRef.current = Math.min(
            stats.maxDistanceM,
            distanceRef.current + (stats.runSpeedMps * fatigue) * 0.05
          );
        } else {
          // Relaxed line
          tensionRef.current = Math.max(10, tensionRef.current - 3.8);
        }
      }

      // Clamp tension
      tensionRef.current = Math.max(0, Math.min(100, tensionRef.current));

      // Line Snap: tension hits 98%
      if (tensionRef.current >= 98) {
        clearInterval(loopRef.current!);
        if (pullSwitchTimerRef.current) clearTimeout(pullSwitchTimerRef.current);
        soundManager.stopReelingSfx();
        setState('escaped');
        setEscapeMsg('Line snapped! Tension reached the red zone.');
        return;
      }

      // Spooled: whale stripped too much line
      if (distanceRef.current >= stats.maxDistanceM) {
        clearInterval(loopRef.current!);
        if (pullSwitchTimerRef.current) clearTimeout(pullSwitchTimerRef.current);
        soundManager.stopReelingSfx();
        setState('escaped');
        setEscapeMsg('Spooled! The whale stripped all line off the drum.');
        return;
      }

      // Win: Reeled to boat
      if (distanceRef.current <= 0) {
        clearInterval(loopRef.current!);
        if (pullSwitchTimerRef.current) clearTimeout(pullSwitchTimerRef.current);
        soundManager.stopReelingSfx();

        const landed: CaughtWhale = {
          instanceId: `whale_${Date.now()}`,
          speciesId: currentWhaleRef.current.id,
          name: currentWhaleRef.current.name,
          weightLbs: weightLbsRef.current,
          saleValue: saleValueRef.current,
          caughtAt: Date.now(),
        };

        setWhaleHold((prev) => [landed, ...prev]);
        setLastCaught(landed);
        onWhaleCaught?.(landed);
        setState('caught');
        return;
      }

      setTension(Math.round(tensionRef.current));
      setDistance(Math.max(0, Math.round(distanceRef.current)));
    }, 50);
  };

  const startReeling = useCallback(() => {
    if (stateRef.current !== 'fighting') return;
    isReelingRef.current = true;
    setIsPressingReel(true);
    soundManager.startReelingSfx();
  }, []);

  const stopReeling = useCallback(() => {
    isReelingRef.current = false;
    setIsPressingReel(false);
    soundManager.stopReelingSfx();
  }, []);

  const handleSellOne = (instanceId: string, val: number) => {
    setWhaleHold((prev) => prev.filter((w) => w.instanceId !== instanceId));
    onAddMoney(val);
  };

  const handleSellAll = () => {
    const total = whaleHold.reduce((sum, w) => sum + w.saleValue, 0);
    if (total === 0) return;
    setWhaleHold([]);
    onAddMoney(total);
  };

  const totalHoldValue = whaleHold.reduce((sum, w) => sum + w.saleValue, 0);
  const haulPercent =
    initialDistance > 0
      ? Math.max(0, Math.min(100, Math.round(((initialDistance - distance) / initialDistance) * 100)))
      : 0;

  return (
    <div className="border border-[#2a2d34] bg-[#14161b] p-3 sm:p-4 text-[#e3e6eb] space-y-3 sm:space-y-4 select-none">
      {/* Whaling Grounds Viewport */}
      <div className="relative border border-[#2d3340] overflow-hidden min-h-[280px] h-[320px] sm:h-80 md:h-96 bg-[#0a0f18]">
        <img
          src="./areas/whaling.png"
          alt="Whaling Grounds"
          className="w-full h-full object-cover object-center select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14161b] via-transparent to-black/35 pointer-events-none" />

        {/* Center / Bottom Interactive Overlay */}
        <div className="absolute bottom-2.5 inset-x-2.5">
          {state === 'idle' && (
            <button
              onClick={handleStartSearch}
              className="w-full sm:w-auto py-3 px-8 font-bold border border-blue-500 bg-blue-950 hover:bg-blue-900 text-blue-100 text-sm cursor-pointer shadow-xl active:scale-95 transition-all touch-manipulation min-h-[48px]"
            >
              Find Whale
            </button>
          )}

          {state === 'searching' && (
            <div className="w-full py-3.5 px-4 border border-[#3b4356] bg-[#11141c]/95 text-xs sm:text-sm text-sky-300 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping shrink-0" />
                <span className="font-semibold">Looking for whales on the horizon...</span>
              </div>
              <span className="font-mono font-bold text-sky-200 shrink-0 text-sm">
                ~{searchSecondsLeft}s
              </span>
            </div>
          )}

          {state === 'spotted' && currentWhale && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full justify-between bg-[#111622]/95 border border-amber-500 p-3 shadow-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-16 h-12 shrink-0 bg-[#06090e] border border-amber-500/50 flex items-center justify-center p-1">
                  <img
                    src={getWhaleSpriteUrl(currentWhale.id)}
                    alt={currentWhale.name}
                    className="w-full h-full object-contain select-none"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    Whale Surfaced!
                  </div>
                  <div className="font-bold text-sm sm:text-base text-[#f1f3f5] truncate">
                    {currentWhale.name}
                  </div>
                  <div className="text-xs text-[#8c96a8]">
                    ~{weightLbs.toLocaleString()} lbs · ${saleValue.toLocaleString()}
                  </div>
                </div>
              </div>

              <button
                onClick={handleHookWhale}
                className="w-full sm:w-auto py-3 px-7 font-bold border border-amber-400 bg-amber-950 hover:bg-amber-900 text-amber-100 text-sm cursor-pointer active:scale-95 transition-transform shrink-0 min-h-[48px] touch-manipulation shadow-lg"
              >
                Hook Whale
              </button>
            </div>
          )}

          {state === 'fighting' && currentWhale && (
            <div className="w-full bg-[#0a0f16]/95 border-2 border-sky-500 p-3 sm:p-3.5 space-y-2.5 shadow-2xl">
              {/* Header Info */}
              <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-14 h-10 shrink-0 bg-[#06080e] border border-sky-500/40 flex items-center justify-center p-0.5">
                    <img
                      src={getWhaleSpriteUrl(currentWhale.id)}
                      alt={currentWhale.name}
                      className="w-full h-full object-contain select-none"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-[#f1f3f5] block truncate text-xs sm:text-sm">
                      {currentWhale.name} ({weightLbs.toLocaleString()} lbs)
                    </span>
                    <span className="text-sky-300 font-mono font-bold text-xs">
                      {distance}m to boat ({haulPercent}%)
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {whalePulling ? (
                    <span className="px-2.5 py-1 text-xs font-bold border border-rose-500 bg-rose-950 text-rose-200 animate-pulse">
                      PULLING HARD! (Release!)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-bold border border-emerald-500 bg-emerald-950 text-emerald-200">
                      Tired! Hold Reel!
                    </span>
                  )}
                </div>
              </div>

              {/* Distance Meter */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px] text-[#8c96a8]">
                  <span>Haul Distance</span>
                  <span className="font-mono text-sky-300 font-bold">{distance} meters remaining</span>
                </div>
                <div className="w-full h-3 bg-[#141822] border border-[#2b3344] overflow-hidden">
                  <div
                    className="h-full bg-sky-500 transition-all duration-75"
                    style={{ width: `${haulPercent}%` }}
                  />
                </div>
              </div>

              {/* Line Tension Meter */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#8c96a8]">Hydraulic Cable Tension</span>
                  <span
                    className={`font-mono font-bold ${
                      tension >= 80 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                    }`}
                  >
                    {tension}% {tension >= 80 ? '(Danger! Snap Risk!)' : '(Safe)'}
                  </span>
                </div>
                <div className="relative w-full h-3.5 bg-[#141822] border border-[#2b3344] overflow-hidden">
                  {/* Danger red zone on the right */}
                  <div className="absolute right-0 top-0 bottom-0 w-[20%] bg-rose-950/80 border-l border-rose-700/80" />
                  {/* Safe green bar */}
                  <div
                    className={`h-full transition-all duration-75 ${
                      tension >= 80 ? 'bg-rose-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${tension}%` }}
                  />
                </div>
              </div>

              {/* Hold to Reel Button */}
              <button
                onMouseDown={startReeling}
                onMouseUp={stopReeling}
                onMouseLeave={stopReeling}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startReeling();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopReeling();
                }}
                onTouchCancel={stopReeling}
                className={`w-full py-3.5 px-4 font-bold text-sm tracking-wider uppercase cursor-pointer transition-all touch-manipulation min-h-[52px] shadow-lg flex items-center justify-center gap-2 ${
                  isPressingReel
                    ? 'border-2 border-emerald-400 bg-emerald-600 text-white scale-[0.98]'
                    : 'border-2 border-sky-400 bg-sky-950 hover:bg-sky-900 text-sky-100'
                }`}
              >
                <span>{isPressingReel ? 'Reeling In!' : 'Hold to Reel'}</span>
                <span className="text-xs opacity-75 font-normal normal-case hidden sm:inline">
                  (Release when tension is high or whale pulls)
                </span>
              </button>
            </div>
          )}

          {state === 'escaped' && (
            <div className="w-full bg-[#1e1014]/95 border border-rose-600 p-3 space-y-2 shadow-xl">
              <div className="text-xs sm:text-sm font-bold text-rose-300">{escapeMsg}</div>
              <button
                onClick={handleStartSearch}
                className="w-full sm:w-auto py-2.5 px-5 font-bold border border-rose-500 bg-rose-950 hover:bg-rose-900 text-rose-100 text-xs sm:text-sm cursor-pointer min-h-[44px] touch-manipulation"
              >
                Find Another Whale
              </button>
            </div>
          )}

          {state === 'caught' && lastCaught && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full justify-between bg-[#111e16]/95 border border-emerald-500 p-3 shadow-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-16 h-12 shrink-0 bg-[#080f0b] border border-emerald-500/50 flex items-center justify-center p-1">
                  <img
                    src={getWhaleSpriteUrl(lastCaught.speciesId)}
                    alt={lastCaught.name}
                    className="w-full h-full object-contain select-none"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    Caught!
                  </div>
                  <div className="font-bold text-sm sm:text-base text-[#f1f3f5] truncate">
                    {lastCaught.name}
                  </div>
                  <div className="text-xs sm:text-sm text-emerald-300 font-bold">
                    {lastCaught.weightLbs.toLocaleString()} lbs · ${lastCaught.saleValue.toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                onClick={handleStartSearch}
                className="w-full sm:w-auto py-2.5 px-5 font-bold border border-emerald-500 bg-emerald-950 hover:bg-emerald-900 text-emerald-100 text-xs sm:text-sm cursor-pointer shrink-0 min-h-[44px] touch-manipulation shadow-md"
              >
                Find Another Whale
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Whaling Rig Status */}
      {hasMaxGear ? (
        <div className="p-2.5 border border-cyan-800/60 bg-[#0e141c] text-xs flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
            <span className="font-bold text-cyan-200">Max Whaling Gear Active:</span>
            <span className="text-[#a6b4c9]">Heavy Hydraulic Boom & Commercial Winch Reel</span>
          </div>
          <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">
            All Titans Encounterable (Blue, Fin, Bowhead, Sperm)
          </span>
        </div>
      ) : (
        <div className="p-2.5 border border-amber-900/50 bg-[#161311] text-xs flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="font-bold text-amber-300">Standard Whaling Rig:</span>
            <span className="text-[#9ea6b3]">Catching smaller whales. Max rod & reel required for titans.</span>
          </div>
          <span className="text-[11px] text-amber-400 font-semibold">
            Titans Require Heavy Boom ($1,000,000) & Winch Reel ($850,000)
          </span>
        </div>
      )}

      {/* Whale Hold */}
      <div className="border border-[#282d38] bg-[#12141a] p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#222732] pb-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#f1f3f5]">Whale Hold</span>
            <span className="text-[11px] sm:text-xs text-[#8c96a8]">({whaleHold.length})</span>
          </div>
          {whaleHold.length > 0 && (
            <button
              onClick={handleSellAll}
              className="py-1.5 px-3.5 border border-emerald-600 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 font-bold text-xs sm:text-sm cursor-pointer transition-colors min-h-[38px] touch-manipulation shadow-sm"
            >
              Sell All (${totalHoldValue.toLocaleString()})
            </button>
          )}
        </div>

        {whaleHold.length === 0 ? (
          <div className="py-6 text-center text-[#717887] text-xs sm:text-sm">
            Your whale hold is empty. Click Find Whale above to start.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {whaleHold.map((whale) => (
              <div
                key={whale.instanceId}
                className="p-3 border border-[#2b3140] bg-[#161922] flex items-center justify-between gap-3 text-xs sm:text-sm shadow-sm"
              >
                <div className="w-16 h-12 shrink-0 bg-[#0c0e14] border border-[#232834] flex items-center justify-center p-1">
                  <img
                    src={getWhaleSpriteUrl(whale.speciesId)}
                    alt={whale.name}
                    className="w-full h-full object-contain select-none"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="font-bold text-[#f1f3f5] truncate text-xs sm:text-sm">{whale.name}</div>
                  <div className="text-[11px] sm:text-xs text-[#8c96a8]">
                    {whale.weightLbs.toLocaleString()} lbs
                  </div>
                  <div className="font-bold text-emerald-400 text-xs sm:text-sm">
                    ${whale.saleValue.toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => handleSellOne(whale.instanceId, whale.saleValue)}
                  className="py-2 px-3 border border-[#394254] bg-[#1c202c] hover:border-emerald-600 text-[#cbd3e2] hover:text-emerald-300 font-bold text-xs sm:text-sm cursor-pointer transition-colors shrink-0 min-h-[40px] touch-manipulation"
                >
                  Sell
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
