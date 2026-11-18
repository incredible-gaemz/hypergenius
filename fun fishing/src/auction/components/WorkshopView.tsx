import React from 'react';
import type {
  OwnedItem,
  ItemCondition,
} from '../auctionLogic';
import { SUPPLY_ITEMS, getItemDef } from '../auctionLogic';
import { ItemImage } from './ItemImage';

interface WorkshopViewProps {
  ownedItems: OwnedItem[];
  supplies: Record<string, number>;
  money: number;
  onBuySupply: (supplyId: string) => void;
  onApplySupply: (itemUid: string, supplyId: string) => void;
}

const CONDITION_STYLES: Record<ItemCondition, { bg: string; text: string; border: string }> = {
  junk: { bg: '#2b1414', text: '#e57373', border: '#602828' },
  dusty: { bg: '#2e2413', text: '#ffb74d', border: '#6b5024' },
  fair: { bg: '#1e2b17', text: '#aed581', border: '#425e30' },
  good: { bg: '#132b1e', text: '#81c784', border: '#2b6040' },
  pristine: { bg: '#132733', text: '#4fc3f7', border: '#285873' },
};

export function WorkshopView({
  ownedItems,
  supplies,
  money,
  onBuySupply,
  onApplySupply,
}: WorkshopViewProps) {
  const restorableItems = ownedItems
    .map((owned) => ({
      owned,
      def: getItemDef(owned.itemId),
    }))
    .filter(
      (item) => item.def && item.def.restorable && item.owned.condition !== 'pristine'
    );

  const totalSuppliesCount = Object.values(supplies).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Workshop Banner */}
      <div className="curio-tray overflow-hidden rounded-sm border border-[var(--wood-border)]">
        <div className="relative h-28 sm:h-36 w-full overflow-hidden">
          <img
            src="/auction/banners/workshop.jpg"
            alt="Workshop"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14100c] via-[#14100c]/70 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 p-3 flex items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[var(--text-parchment)]">
                Workshop & Restoration Bench
              </h2>
              <div className="text-xs text-[var(--text-muted)]">
                Clean off grime and patina to unlock pristine market value
              </div>
            </div>

            <span className="seal-tag bg-[#1c140d] border-[#704d22] text-[var(--wood-brass-bright)] font-bold">
              Supplies: {totalSuppliesCount}
            </span>
          </div>
        </div>
      </div>

      {/* Supplies */}
      <div className="curio-tray p-3 flex flex-col gap-2.5">
        <div className="text-xs font-bold text-[var(--wood-brass-bright)] uppercase tracking-wider">
          Workshop Supplies & Polishing Compounds
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SUPPLY_ITEMS.map((supply) => {
            const qty = supplies[supply.id] ?? 0;
            const canAfford = money >= supply.cost;

            return (
              <div
                key={supply.id}
                className="curio-slot p-2.5 flex items-center justify-between gap-3 border border-[var(--wood-border)]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 border border-[#3e2d1d] rounded-sm bg-[#14100c] flex items-center justify-center overflow-hidden">
                    <img
                      src={`/auction/supplies/${supply.id}.jpg`}
                      alt={supply.name}
                      className="w-full h-full object-contain select-none"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[var(--text-parchment)] truncate">
                        {supply.name}
                      </span>
                      {qty > 0 && (
                        <span className="seal-tag bg-[#1e2b17] border-[#425e30] text-[#aed581] font-bold">
                          x{qty}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                      {supply.description}
                    </span>
                    <span className="text-xs font-bold text-[var(--wood-brass-bright)] mt-1">
                      ${supply.cost}
                    </span>
                  </div>
                </div>

                <button
                  disabled={!canAfford}
                  onClick={() => {
                                        onBuySupply(supply.id);
                  }}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[var(--wood-brass)] hover:bg-[var(--wood-brass-bright)] text-[#100d0a] border border-[var(--wood-brass-bright)] disabled:opacity-30 shrink-0 shadow"
                >
                  Buy
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restorable items in storage */}
      <div className="curio-tray p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--wood-brass-bright)] uppercase tracking-wider">
            Items Requiring Restoration ({restorableItems.length})
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            Restored items command up to +150% at auction
          </span>
        </div>

        {restorableItems.length === 0 ? (
          <div className="curio-slot p-6 text-center text-xs text-[var(--text-muted)]">
            No items in storage currently need cleaning or restoration.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {restorableItems.map(({ owned, def }) => {
              if (!def) return null;
              const cond = CONDITION_STYLES[owned.condition];

              const applicableSupply = SUPPLY_ITEMS.find((s) =>
                s.applicableConditions.includes(owned.condition)
              );
              const hasSupply = applicableSupply
                ? (supplies[applicableSupply.id] ?? 0) > 0
                : false;

              return (
                <div
                  key={owned.uid}
                  className="curio-slot p-3 flex flex-col justify-between gap-2.5 border border-[var(--wood-border)]"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <ItemImage
                      itemId={def.id}
                      condition={owned.condition}
                      category={def.category}
                      name={def.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 shrink-0"
                    />

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs sm:text-sm font-bold text-[var(--text-parchment)] truncate">
                          {def.name}
                        </span>
                        <span
                          className="seal-tag shrink-0 font-bold"
                          style={{
                            backgroundColor: cond.bg,
                            color: cond.text,
                            borderColor: cond.border,
                          }}
                        >
                          {owned.condition}
                        </span>
                      </div>

                      <span className="text-[10px] uppercase text-[var(--text-muted)] mt-1 font-bold">
                        {def.category}
                      </span>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2">
                        {def.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--wood-border)]">
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {applicableSupply ? (
                        <span>Needs: <strong className="text-[var(--text-parchment)]">{applicableSupply.name}</strong></span>
                      ) : (
                        <span>No suitable supply</span>
                      )}
                    </div>

                    {applicableSupply && (
                      <button
                        disabled={!hasSupply}
                        onClick={() => {
                                                    onApplySupply(owned.uid, applicableSupply.id);
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#1e3b2b] hover:bg-[#274f39] text-[#98e2b8] border border-[#2f6345] disabled:opacity-30 shadow"
                      >
                        {hasSupply ? `Apply ${applicableSupply.name}` : `Out of ${applicableSupply.name}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
