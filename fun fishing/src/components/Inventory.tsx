import React, { useMemo } from 'react';
import {
  CaughtFish,
  FishMarketOrder,
  getRarityTextStyle,
  getRarityBadgeStyle,
  getFishSpriteUrl,
  getMutationFilterStyle,
  RarityTier,
} from '../game/fishingLogic';

interface InventoryProps {
  fishList: CaughtFish[];
  marketOrders?: FishMarketOrder[];
  onSellFish: (catchId: string) => void;
  onSellBatch?: (catchIds: string[]) => void;
  onSellAll: () => void;
  onFulfillOrder?: (orderId: string) => void;
  onDeclineOrder?: (orderId: string) => void;
}

interface FishGroup {
  key: string;
  fishId: number;
  speciesName: string;
  tier: RarityTier;
  mutation?: string;
  mutationName?: string;
  items: CaughtFish[];
  count: number;
  trophyCount: number;
  totalValue: number;
  minWeight: number;
  maxWeight: number;
  avgWeight: number;
  sample: CaughtFish;
}

export const Inventory: React.FC<InventoryProps> = ({
  fishList,
  onSellFish,
  onSellBatch,
  onSellAll,
}) => {
  const totalValue = fishList.reduce((acc, f) => acc + f.value, 0);

  // Group fish by species and mutation strain so they don't consume excessive vertical space
  const groupedFish = useMemo(() => {
    const map = new Map<string, FishGroup>();

    for (const item of fishList) {
      const key = `${item.fishId}_${item.mutation || 'normal'}`;
      let g = map.get(key);
      if (!g) {
        g = {
          key,
          fishId: item.fishId,
          speciesName: item.name,
          tier: item.tier,
          mutation: item.mutation,
          mutationName: item.mutationName,
          items: [],
          count: 0,
          trophyCount: 0,
          totalValue: 0,
          minWeight: item.weight,
          maxWeight: item.weight,
          avgWeight: item.weight,
          sample: item,
        };
        map.set(key, g);
      }
      g.items.push(item);
      g.count++;
      if (item.isTrophy) g.trophyCount++;
      g.totalValue += item.value;
      if (item.weight < g.minWeight) g.minWeight = item.weight;
      if (item.weight > g.maxWeight) g.maxWeight = item.weight;
    }

    for (const g of map.values()) {
      const sumW = g.items.reduce((acc, f) => acc + f.weight, 0);
      g.avgWeight = Number((sumW / g.count).toFixed(2));
    }

    const tierOrder: Record<RarityTier, number> = {
      legendary: 5,
      epic: 4,
      rare: 3,
      uncommon: 2,
      common: 1,
    };

    return Array.from(map.values()).sort((a, b) => {
      const diff = (tierOrder[b.tier] || 0) - (tierOrder[a.tier] || 0);
      if (diff !== 0) return diff;
      return b.count - a.count;
    });
  }, [fishList]);

  return (
    <div className="border border-[#2a2d34] bg-[#181a1f] p-4 text-[#e3e6eb] space-y-4">
      {/* Header bar */}
      <div className="border-b border-[#292d36] pb-3 text-xs space-y-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="font-bold text-[#f1f3f5]">
              {fishList.length} fish held across {groupedFish.length} species strains
            </span>
            {fishList.length > 0 && (
              <span className="text-[#8c94a2] ml-2">
                · Base Total: <span className="text-emerald-400 font-bold">${totalValue.toLocaleString()}</span>
              </span>
            )}
          </div>

          {fishList.length > 0 && (
            <button
              onClick={onSellAll}
              className="px-3 py-1.5 border border-emerald-600/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 font-bold cursor-pointer transition-colors"
            >
              Sell All · ${totalValue.toLocaleString()}
            </button>
          )}
        </div>
      </div>

      {/* Held Fish Groups */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#8c94a2]">
          <span>Held Fish Summary · {groupedFish.length} Types</span>
          <span className="text-[11px]">
            Tip: Supply town contracts, stock the restaurant pantry, or breed in Hatchery.
          </span>
        </div>

        {fishList.length === 0 ? (
          <div className="py-10 text-center border border-[#23262d] bg-[#15171b] text-[#606775] text-xs">
            Your Box is empty. Catch fish with your rod or traps to hold them for orders and breeding.
          </div>
        ) : (
          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {groupedFish.map((group) => (
              <div
                key={group.key}
                className={`p-3 border flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3 ${
                  group.trophyCount > 0
                    ? 'border-amber-600/40 bg-[#1d1b16]'
                    : 'border-[#262830] bg-[#16181d]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getFishSpriteUrl(group.sample) && (
                    <img
                      src={getFishSpriteUrl(group.sample)!}
                      alt={group.speciesName}
                      className="w-14 h-10 object-contain shrink-0 select-none"
                      style={{
                        imageRendering: 'pixelated',
                        ...getMutationFilterStyle(group.mutation),
                      }}
                    />
                  )}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-sm ${getRarityTextStyle(group.tier)}`}>
                        {group.speciesName}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 border border-amber-500/70 bg-amber-950/60 text-amber-300 font-extrabold">
                        x{group.count}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 border uppercase tracking-wider font-semibold ${getRarityBadgeStyle(
                          group.tier
                        )}`}
                      >
                        {group.tier}
                      </span>
                      {group.trophyCount > 0 && (
                        <span className="text-[10px] text-amber-300 border border-amber-500/60 px-1 font-bold">
                          {group.trophyCount === 1 ? '1 Trophy' : `${group.trophyCount} Trophies`}
                        </span>
                      )}
                      {group.mutation && group.mutation !== 'normal' && (
                        <span className="text-[10px] text-cyan-300 border border-cyan-500/60 px-1 font-bold uppercase">
                          {group.mutationName || group.mutation}
                        </span>
                      )}
                    </div>

                    <div className="text-[#8c94a2] flex items-center gap-2 text-[11px] flex-wrap">
                      <span>
                        Weight:{' '}
                        <strong className="text-[#c7ccd6]">
                          {group.minWeight === group.maxWeight
                            ? `${group.minWeight} lbs`
                            : `${group.minWeight} - ${group.maxWeight} lbs`}
                        </strong>
                        {group.count > 1 && (
                          <span className="text-[#717885]"> (avg {group.avgWeight} lbs)</span>
                        )}
                      </span>
                      <span>·</span>
                      <span>
                        Batch Total:{' '}
                        <strong className="text-emerald-400 font-bold">
                          ${group.totalValue.toLocaleString()}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    onClick={() => onSellFish(group.items[0].catchId)}
                    className="px-2.5 py-1 text-xs border border-[#3b404c] bg-[#1e2128] hover:bg-[#282c35] text-emerald-400 font-semibold cursor-pointer transition-colors"
                    title="Sell 1 fish"
                  >
                    Sell 1 · ${group.items[0].value.toLocaleString()}
                  </button>
                  {group.count > 1 && (
                    <button
                      onClick={() => {
                        if (onSellBatch) {
                          onSellBatch(group.items.map((f) => f.catchId));
                        } else {
                          group.items.forEach((f) => onSellFish(f.catchId));
                        }
                      }}
                      className="px-2.5 py-1 text-xs border border-emerald-700/70 bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 font-bold cursor-pointer transition-colors"
                      title={`Sell all ${group.count} fish of this kind`}
                    >
                      Sell All ({group.count}) · ${group.totalValue.toLocaleString()}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
