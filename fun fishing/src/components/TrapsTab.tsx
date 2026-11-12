import React, { useState } from 'react';
import {
  ActiveTrap,
  TRAP_TYPES,
  TRAP_BAITS,
  TRAP_SLOT_PRICES,
  FISHING_AREAS,
  AreaId,
  calculateTrapCatch,
  CaughtFish,
  getTrapBaitDisplay,
  getFishTrapBaitMultiplier,
  getFishTrapBaitProfile,
  getRarityTextStyle,
} from '../game/fishingLogic';

interface TrapsTabProps {
  money: number;
  traps: ActiveTrap[];
  inventory: CaughtFish[];
  unlockedTrapSlots: number;
  unlockedAreaIds: string[];
  onHarvestTrap: (slotIndex: number) => void;
  onSetTrapArea: (slotIndex: number, areaId: AreaId) => void;
  onBaitTrap: (slotIndex: number, baitId: string) => void;
  onBaitTrapWithFish: (slotIndex: number, catchId: string) => void;
  onUpgradeTrapModel: (slotIndex: number, trapTypeId: string) => void;
  onUnlockTrapSlot: () => void;
}

export const TrapsTab: React.FC<TrapsTabProps> = ({
  money,
  traps,
  inventory,
  unlockedTrapSlots,
  unlockedAreaIds,
  onHarvestTrap,
  onSetTrapArea,
  onBaitTrap,
  onBaitTrapWithFish,
  onUpgradeTrapModel,
  onUnlockTrapSlot,
}) => {
  const [activeSlotMenu, setActiveSlotMenu] = useState<{
    slotIndex: number;
    menu: 'area' | 'bait' | 'upgrade' | null;
  }>({ slotIndex: -1, menu: null });

  const nextSlotCost =
    unlockedTrapSlots < TRAP_SLOT_PRICES.length
      ? TRAP_SLOT_PRICES[unlockedTrapSlots]
      : null;

  return (
    <div className="border border-[#2a2d34] bg-[#181a1f] p-4 text-[#e3e6eb] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#292d36] pb-3 text-xs">
        <div>
          <span className="font-bold text-[#f1f3f5] text-sm">Aquatic Trapping</span>
          <div className="text-[11px] text-[#8c94a2] mt-0.5">
            Traps soak passively in water. Check back every minute or two. Harvested fish go to your Box.
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[#8c94a2]">
            Active Traps: {unlockedTrapSlots} / {TRAP_SLOT_PRICES.length}
          </span>
        </div>
      </div>

      {/* Traps Grid */}
      <div className="space-y-3">
        {unlockedTrapSlots === 0 && (
          <div className="p-6 border border-[#2a2d34] bg-[#14161b] text-center space-y-3">
            <div className="font-bold text-sm text-[#f1f3f5]">
              No Traps Deployed
            </div>
            <div className="text-xs text-[#8c94a2] max-w-md mx-auto leading-relaxed">
              Traps soak passively in water to collect live baitfish, crayfish, and crab while you fish elsewhere. Buy your first trap for $100 to begin trapping.
            </div>
            <button
              onClick={onUnlockTrapSlot}
              disabled={money < 100}
              className={`py-2.5 px-6 border font-bold text-xs transition-colors ${
                money >= 100
                  ? 'border-emerald-600/80 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 cursor-pointer'
                  : 'border-[#282a32] bg-[#1a1c20] text-[#555a64] cursor-not-allowed'
              }`}
            >
              Buy First Trap $100
            </button>
          </div>
        )}

        {traps.slice(0, unlockedTrapSlots).map((trap) => {
          const trapModel =
            TRAP_TYPES.find((t) => t.id === trap.trapTypeId) || TRAP_TYPES[0];
          const area =
            FISHING_AREAS.find((a) => a.id === trap.areaId) || FISHING_AREAS[0];
          const baitDisplay = getTrapBaitDisplay(trap);

          const harvest = calculateTrapCatch(trap);
          const hasCatch = harvest.count > 0;

          const isMenuOpen = activeSlotMenu.slotIndex === trap.slotIndex;

          return (
            <div
              key={trap.slotIndex}
              className={`p-3.5 border transition-all ${
                harvest.isFull
                  ? 'border-amber-600/70 bg-[#211a14]'
                  : hasCatch
                  ? 'border-[#3a404d] bg-[#1a1d23]'
                  : 'border-[#24272e] bg-[#14161a]'
              }`}
            >
              {/* Trap Top Bar */}
              <div className="flex items-start justify-between gap-2 border-b border-[#262932] pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#f1f3f5]">
                      Trap #{trap.slotIndex + 1}: {trapModel.name}
                    </span>
                    {harvest.isFull ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 border border-amber-500/80 bg-amber-950/40 text-amber-300">
                        FULL
                      </span>
                    ) : hasCatch ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 border border-sky-500/80 bg-sky-950/40 text-sky-300">
                        {harvest.count} Fish Trapped
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#717885] px-1.5 py-0.5 border border-[#262830] bg-[#101215]">
                        Soaking...
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#8c94a2] mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#8c94a2]">Waters:</span>
                      <select
                        value={trap.areaId}
                        onChange={(e) => onSetTrapArea(trap.slotIndex, e.target.value as AreaId)}
                        aria-label={`Waters for Trap ${trap.slotIndex + 1}`}
                        className="px-2 py-0.5 border border-[#3b414f] bg-[#121418] text-emerald-300 font-bold text-xs focus:outline-none cursor-pointer"
                        title="Change waters where this trap is placed"
                      >
                        {FISHING_AREAS.filter((a) => unlockedAreaIds.includes(a.id)).map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span>
                      Bait/Lure: <strong className="text-emerald-300">{baitDisplay.name}</strong>
                      {baitDisplay.speedMultiplier > 1 && (
                        <span className="text-[10px] text-emerald-400 ml-1">
                          (+{Math.round((baitDisplay.speedMultiplier - 1) * 100)}% speed)
                        </span>
                      )}
                    </span>
                    {baitDisplay.buffTitle && (
                      <div className="text-[11px] text-amber-300">
                        Buff: <strong>{baitDisplay.buffTitle}</strong> · {baitDisplay.buffDescription}
                      </div>
                    )}
                    <span>
                      Capacity: <strong>{harvest.count} / {trapModel.capacity}</strong>
                    </span>
                    <span>
                      Soak pace: <strong>1 per ~{Math.round(trapModel.fillIntervalSec / baitDisplay.speedMultiplier)}s</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-400">
                    Est. Value: ${harvest.totalValue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Trapped Real Fish List */}
              <div className="py-2.5 min-h-[44px]">
                {harvest.fishes.length === 0 ? (
                  <div className="text-[11px] text-[#717885] italic py-1">
                    Trap is soaking quietly in the current. Nothing caught yet.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-[#8c94a2] font-semibold uppercase tracking-wider">
                      Trapped Fish · {harvest.fishes.length}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {harvest.fishes.map((fish, i) => (
                        <div
                          key={fish.catchId || i}
                          className={`p-2 border text-xs flex items-center justify-between ${
                            fish.isTrophy
                              ? 'border-amber-600/70 bg-[#241e15]'
                              : 'border-[#2d313b] bg-[#171920]'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold ${getRarityTextStyle(fish.tier)}`}>
                                {fish.name}
                              </span>
                              {fish.isTrophy && (
                                <span className="text-[9px] font-bold px-1 py-0.2 border border-amber-500/80 bg-amber-950/60 text-amber-300" title="Trophy">
                                  Trophy
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#8c94a2]">
                              {fish.weight} lbs · {fish.tier}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-400 text-xs">
                              ${fish.value.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#262932] flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() =>
                      setActiveSlotMenu({
                        slotIndex: trap.slotIndex,
                        menu: isMenuOpen && activeSlotMenu.menu === 'area' ? null : 'area',
                      })
                    }
                    className="px-2.5 py-1 text-[11px] border border-[#353944] bg-[#20232b] hover:bg-[#282c36] text-[#c0c5ce] cursor-pointer"
                  >
                    Change Waters
                  </button>

                  <button
                    onClick={() =>
                      setActiveSlotMenu({
                        slotIndex: trap.slotIndex,
                        menu: isMenuOpen && activeSlotMenu.menu === 'bait' ? null : 'bait',
                      })
                    }
                    className="px-2.5 py-1 text-[11px] border border-[#353944] bg-[#20232b] hover:bg-[#282c36] text-[#c0c5ce] cursor-pointer"
                  >
                    Re-Bait Trap
                  </button>

                  <button
                    onClick={() =>
                      setActiveSlotMenu({
                        slotIndex: trap.slotIndex,
                        menu:
                          isMenuOpen && activeSlotMenu.menu === 'upgrade'
                            ? null
                            : 'upgrade',
                      })
                    }
                    className="px-2.5 py-1 text-[11px] border border-[#353944] bg-[#20232b] hover:bg-[#282c36] text-[#c0c5ce] cursor-pointer"
                  >
                    Upgrade Pot
                  </button>
                </div>

                {hasCatch && (
                  <button
                    onClick={() => onHarvestTrap(trap.slotIndex)}
                    className="px-3.5 py-1.5 text-xs font-bold border border-emerald-600/80 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 cursor-pointer"
                  >
                    Hold Fish · {harvest.fishes.length} fish · ${harvest.totalValue.toLocaleString()}
                  </button>
                )}
              </div>

              {/* Inline Submenus */}
              {isMenuOpen && activeSlotMenu.menu === 'area' && (
                <div className="mt-2.5 p-2.5 border border-[#323640] bg-[#121316] space-y-2 text-xs">
                  <div className="font-bold text-[#c0c5ce] text-[11px]">
                    Deploy Trap to Area:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FISHING_AREAS.filter((a) => unlockedAreaIds.includes(a.id)).map(
                      (a) => (
                        <button
                          key={a.id}
                          onClick={() => {
                            onSetTrapArea(trap.slotIndex, a.id);
                            setActiveSlotMenu({ slotIndex: -1, menu: null });
                          }}
                          className={`px-2.5 py-1 border cursor-pointer ${
                            trap.areaId === a.id
                              ? 'border-emerald-600 bg-emerald-950/60 text-emerald-300 font-bold'
                              : 'border-[#2d313a] bg-[#1a1d23] text-[#a0a6b2] hover:text-[#f1f3f5]'
                          }`}
                        >
                          {a.name}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {isMenuOpen && activeSlotMenu.menu === 'bait' && (
                <div className="mt-2.5 p-3 border border-[#323640] bg-[#121316] space-y-3 text-xs">
                  {/* Store Baits */}
                  <div>
                    <div className="font-bold text-[#c0c5ce] text-[11px] mb-1.5">
                      Store Baits:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {TRAP_BAITS.map((b) => {
                        const canAfford = money >= b.price;
                        const isEquipped = trap.baitId === b.id && !trap.baitName;
                        return (
                          <button
                            key={b.id}
                            disabled={!canAfford && b.price > 0}
                            onClick={() => {
                              onBaitTrap(trap.slotIndex, b.id);
                              setActiveSlotMenu({ slotIndex: -1, menu: null });
                            }}
                            className={`p-2 border text-left cursor-pointer flex justify-between items-center ${
                              isEquipped
                                ? 'border-emerald-600 bg-emerald-950/50 text-emerald-300 font-bold'
                                : canAfford
                                ? 'border-[#2d313a] bg-[#1a1d23] hover:bg-[#22252c]'
                                : 'border-[#22252c] bg-[#15171a] text-[#555a64] cursor-not-allowed'
                            }`}
                          >
                            <div>
                              <div>{b.name}</div>
                              <div className="text-[10px] text-[#8c94a2]">
                                {b.description}
                              </div>
                            </div>
                            <span className="font-bold shrink-0 ml-2">
                              {b.price === 0 ? 'Free' : `$${b.price}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fresh Cut Fish Bait from Inventory */}
                  <div className="border-t border-[#262832] pt-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-bold text-[#c0c5ce] text-[11px]">
                        Use Held Fish as Fresh Cut Bait:
                      </div>
                      <span className="text-[10px] text-[#8c94a2]">
                        Box: {inventory.length} fish
                      </span>
                    </div>

                    {inventory.length === 0 ? (
                      <div className="p-2 border border-[#262832] bg-[#16181d] text-[11px] text-[#717885] italic">
                        No fish held in your Box. Catch minnows, panfish, or chubs with your rod to prepare potent fresh cut bait.
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {inventory.slice(0, 15).map((fish) => {
                          const profile = getFishTrapBaitProfile(fish);
                          return (
                            <div
                              key={fish.catchId}
                              className="p-2 border border-[#2d313b] bg-[#161820] flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="font-bold text-[#f1f3f5] flex items-center gap-1.5">
                                  <span>{fish.name}</span>
                                  <span className="text-[10px] text-[#8c94a2]">· {fish.weight} lbs</span>
                                </div>
                                <div className="text-[10px] text-emerald-400">
                                  <strong>{profile.buffTitle}</strong> · {profile.buffDescription}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  onBaitTrapWithFish(trap.slotIndex, fish.catchId);
                                  setActiveSlotMenu({ slotIndex: -1, menu: null });
                                }}
                                className="px-2.5 py-1 border border-emerald-600 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 font-bold cursor-pointer text-xs shrink-0"
                              >
                                Cut as Bait
                              </button>
                            </div>
                          );
                        })}
                        {inventory.length > 15 && (
                          <div className="text-[10px] text-[#8c94a2] text-center pt-1">
                            +{inventory.length - 15} more fish in your Box
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isMenuOpen && activeSlotMenu.menu === 'upgrade' && (
                <div className="mt-2.5 p-2.5 border border-[#323640] bg-[#121316] space-y-2 text-xs">
                  <div className="font-bold text-[#c0c5ce] text-[11px]">
                    Upgrade Trap Pot / Creel:
                  </div>
                  <div className="space-y-1.5">
                    {TRAP_TYPES.map((t) => {
                      const isCurrent = trap.trapTypeId === t.id;
                      const canAfford = money >= t.price;

                      return (
                        <div
                          key={t.id}
                          className={`p-2 border flex items-center justify-between gap-2 ${
                            isCurrent
                              ? 'border-emerald-700/60 bg-[#122319]'
                              : 'border-[#292d36] bg-[#1a1d23]'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-[#f1f3f5]">
                              {t.name}
                            </div>
                            <div className="text-[10px] text-[#8c94a2]">
                              Holds up to {t.capacity} fish · Catch rate: 1 per {t.fillIntervalSec}s
                            </div>
                          </div>

                          <div>
                            {isCurrent ? (
                              <span className="text-[11px] font-bold text-emerald-400">
                                Installed
                              </span>
                            ) : (
                              <button
                                disabled={!canAfford}
                                onClick={() => {
                                  onUpgradeTrapModel(trap.slotIndex, t.id);
                                  setActiveSlotMenu({ slotIndex: -1, menu: null });
                                }}
                                className={`px-2.5 py-1 text-xs font-bold border ${
                                  canAfford
                                    ? 'border-emerald-600 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 cursor-pointer'
                                    : 'border-[#262830] bg-[#181a1d] text-[#555a64] cursor-not-allowed'
                                }`}
                              >
                                Buy ${t.price.toLocaleString()}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Unlock Next Trap Slot */}
        {unlockedTrapSlots > 0 && nextSlotCost !== null && (
          <div className="p-3 border border-dashed border-[#323640] bg-[#14161a] flex items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-[#f1f3f5]">
                Unlock Trap Slot #{unlockedTrapSlots + 1}
              </div>
              <div className="text-[#8c94a2] text-[11px]">
                Deploy an additional trap concurrently in another lake, bayou, or reef.
              </div>
            </div>

            <button
              onClick={onUnlockTrapSlot}
              disabled={money < nextSlotCost}
              className={`px-3 py-1.5 border font-bold text-xs ${
                money >= nextSlotCost
                  ? 'border-emerald-600/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 cursor-pointer'
                  : 'border-[#282a32] bg-[#1a1c20] text-[#555a64] cursor-not-allowed'
              }`}
            >
              Unlock Slot ${nextSlotCost.toLocaleString()}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
