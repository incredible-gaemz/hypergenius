import React from 'react';
import type {
  ShopDef,
  ShopItem,
  ShopId,
  OwnedItem,
  ItemCondition,
  StorageLockerDef,
  ClientContract,
} from '../auctionLogic';
import { STORAGE_LOCKERS, SETS } from '../auctionLogic';
import { ItemImage } from './ItemImage';

interface ShopViewProps {
  shops: readonly ShopDef[];
  activeShopId: ShopId;
  shopInventories: Record<ShopId, { items: ShopItem[]; generatedAt: number }>;
  money: number;
  ownedItems: OwnedItem[];
  storageCapacity: number;
  onBuy: (shopItem: ShopItem) => void;
  onBuyLocker?: (locker: StorageLockerDef) => void;
  onSwitchShop: (shopId: ShopId) => void;
  onUnlockShop: (shopId: ShopId) => void;
  unlockedShopIds: ShopId[];
  contracts?: ClientContract[];
}

const CONDITION_STYLES: Record<ItemCondition, { bg: string; text: string; border: string }> = {
  junk: { bg: '#2b1414', text: '#e57373', border: '#602828' },
  dusty: { bg: '#2e2413', text: '#ffb74d', border: '#6b5024' },
  fair: { bg: '#1e2b17', text: '#aed581', border: '#425e30' },
  good: { bg: '#132b1e', text: '#81c784', border: '#2b6040' },
  pristine: { bg: '#132733', text: '#4fc3f7', border: '#285873' },
};

const CONDITION_RANKS: Record<string, number> = {
  junk: 1,
  dusty: 2,
  fair: 3,
  good: 4,
  pristine: 5,
};

export function ShopView({
  shops,
  activeShopId,
  shopInventories,
  money,
  ownedItems,
  storageCapacity,
  onBuy,
  onBuyLocker,
  onSwitchShop,
  onUnlockShop,
  unlockedShopIds,
  contracts = [],
}: ShopViewProps) {
  const activeShop = shops.find((s) => s.id === activeShopId);
  const isUnlocked = activeShop ? unlockedShopIds.includes(activeShop.id) : false;
  const inventory = shopInventories[activeShopId]?.items ?? [];
  const storageFull = ownedItems.length >= storageCapacity;

  // Set pieces tracked
  const ownedIds = new Set(ownedItems.map((o) => o.itemId));

  return (
    <div className="flex flex-col gap-3">
      {/* Store Shelf Selector */}
      <div className="curio-tray p-1.5 flex flex-wrap gap-1">
        {shops.map((shop) => {
          const unlocked = unlockedShopIds.includes(shop.id);
          const isActive = shop.id === activeShopId;

          return (
            <button
              key={shop.id}
              onClick={() => {
                                onSwitchShop(shop.id);
              }}
              className={`flex-1 min-w-[100px] py-2 px-2.5 text-xs font-bold uppercase tracking-wider transition-all border ${
                isActive
                  ? 'curio-tab-active border-[var(--wood-brass-bright)]'
                  : unlocked
                  ? 'curio-tab-inactive border-[var(--wood-border)]'
                  : 'bg-[#100d0a] text-[var(--text-muted)] opacity-60 border-[var(--wood-border)]'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span>{shop.name}</span>
                {!unlocked && <span className="text-[10px] text-[var(--wood-brass)]">${shop.unlockCost}</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Shop Banner & Description */}
      {activeShop && (
        <div className="curio-tray overflow-hidden rounded-sm border border-[var(--wood-border)]">
          <div className="relative h-28 sm:h-36 w-full overflow-hidden">
            <img
              src={`/auction/banners/${activeShop.id}.jpg`}
              alt={activeShop.name}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14100c] via-[#14100c]/70 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 p-3 flex items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[var(--text-parchment)]">
                  {activeShop.name}
                </h2>
                <div className="text-xs text-[var(--text-muted)]">
                  {activeShop.description}
                </div>
              </div>

              {!isUnlocked && (
                <button
                  disabled={money < activeShop.unlockCost}
                  onClick={() => {
                                        onUnlockShop(activeShop.id);
                  }}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[var(--wood-brass)] hover:bg-[var(--wood-brass-bright)] text-[#100d0a] border border-[var(--wood-brass-bright)] disabled:opacity-40 shadow"
                >
                  Unlock Shop (${activeShop.unlockCost})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shop Items Inventory */}
      {isUnlocked ? (
        <div className="flex flex-col gap-3">
          {/* Storage Locker Special Section */}
          {activeShopId === 'storage' && onBuyLocker && (
            <div className="curio-tray p-3.5 flex flex-col gap-3 border-l-4 border-l-[var(--wood-brass)]">
              <div>
                <span className="text-xs font-bold text-[var(--wood-brass-bright)] uppercase tracking-wider">
                  Blind Abandoned Storage Units
                </span>
                <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                  Uncut locks. Claim the entire room contents unseen.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {STORAGE_LOCKERS.map((locker) => {
                  const canAfford = money >= locker.cost;
                  return (
                    <div
                      key={locker.id}
                      className="curio-slot p-3 flex flex-col justify-between gap-2.5 border border-[var(--wood-border)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 border border-[#3e2d1d] rounded-sm bg-[#14100c] flex items-center justify-center overflow-hidden">
                          <img
                            src={`/auction/lockers/${locker.id}.jpg`}
                            alt={locker.name}
                            className="w-full h-full object-contain select-none"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-[var(--text-parchment)] truncate">
                            {locker.name}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            {locker.minItems} to {locker.maxItems} items inside
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--wood-border)]">
                        <span className="text-sm font-bold text-[var(--wood-brass-bright)]">
                          ${locker.cost}
                        </span>
                        <button
                          disabled={!canAfford || storageFull}
                          onClick={() => {
                                                                                    onBuyLocker(locker);
                          }}
                          className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#c8953c] hover:bg-[#e2ad4f] text-[#100d0a] border border-[#e2ad4f] disabled:opacity-30"
                        >
                          Buy Locker
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {inventory.length === 0 ? (
            <div className="curio-tray p-6 text-center text-xs text-[var(--text-muted)]">
              No items in stock. Check back tomorrow.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {inventory.map((shopItem) => {
                const canAfford = money >= shopItem.price;
                const canBuy = canAfford && !storageFull;
                const cond = CONDITION_STYLES[shopItem.condition];

                // Check contract match
                const matchesContract = contracts.find(
                  (c) =>
                    !c.completed &&
                    c.category === shopItem.item.category &&
                    (CONDITION_RANKS[shopItem.condition] || 0) >= (CONDITION_RANKS[c.minCondition] || 0)
                );

                // Check set match
                const parentSet = SETS.find((s) => s.itemIds.includes(shopItem.item.id));
                const isPartNeeded = parentSet && !ownedIds.has(shopItem.item.id);

                return (
                  <div
                    key={shopItem.uid}
                    className="curio-slot p-3 flex flex-col justify-between gap-3 border border-[var(--wood-border)] hover:border-[var(--wood-border-bright)] transition-all"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <ItemImage
                        itemId={shopItem.item.id}
                        condition={shopItem.condition}
                        category={shopItem.item.category}
                        name={shopItem.item.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 shrink-0"
                      />

                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-bold text-[var(--text-parchment)] truncate">
                          {shopItem.item.name}
                        </span>

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className="seal-tag font-bold"
                            style={{
                              backgroundColor: cond.bg,
                              color: cond.text,
                              borderColor: cond.border,
                            }}
                          >
                            {shopItem.condition}
                          </span>
                          {shopItem.makerMark === 'unverified' && (
                            <span className="seal-tag bg-[#332212] text-[#f0b040] border-[#704818] font-bold">
                              Unverified Mark
                            </span>
                          )}
                        </div>

                        {matchesContract && (
                          <span className="seal-tag bg-[#162b1a] text-[#81c784] border-[#295632] font-bold mt-1.5 text-[9px]">
                            Contract Bounty: ${matchesContract.rewardMoney}
                          </span>
                        )}

                        {isPartNeeded && (
                          <span className="seal-tag bg-[#281c10] text-[#e2ad4f] border-[#5e431f] font-bold mt-1 text-[9px]">
                            Set Piece ({parentSet.name})
                          </span>
                        )}

                        <span className="text-[10px] uppercase text-[var(--text-muted)] mt-1 font-bold">
                          {shopItem.item.category}
                        </span>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2">
                          {shopItem.item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--wood-border)]">
                      <span className="text-sm font-black text-[var(--wood-brass-bright)]">
                        ${shopItem.price}
                      </span>
                      <button
                        disabled={!canBuy}
                        onClick={() => {
                                                    onBuy(shopItem);
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#c8953c] hover:bg-[#e2ad4f] text-[#100d0a] border border-[#e2ad4f] disabled:opacity-30 shadow"
                      >
                        Buy Item
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="curio-tray p-8 text-center flex flex-col items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">
            This merchant venue is locked. Pay the entry license fee to unlock its inventory.
          </span>
          <button
            disabled={money < (activeShop?.unlockCost ?? 0)}
            onClick={() => {
                            if (activeShop) onUnlockShop(activeShop.id);
            }}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[var(--wood-brass)] hover:bg-[var(--wood-brass-bright)] text-[#100d0a] border border-[var(--wood-brass-bright)] disabled:opacity-40 shadow mt-2"
          >
            Unlock {activeShop?.name} (${activeShop?.unlockCost})
          </button>
        </div>
      )}
    </div>
  );
}
