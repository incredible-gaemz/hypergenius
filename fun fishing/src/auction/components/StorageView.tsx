import React, { useState, useMemo } from 'react';
import type {
  OwnedItem,
  AuctionEvent,
  ItemCategory,
  ItemCondition,
  ClientContract,
} from '../auctionLogic';
import {
  getItemDef,
  getDirectSellValue,
  getAuctionEstimate,
  checkCompleteSets,
  getSetSellValue,
  PART_ASSEMBLIES,
} from '../auctionLogic';
import { ItemImage } from './ItemImage';

interface StorageViewProps {
  ownedItems: OwnedItem[];
  money: number;
  nextAuction: AuctionEvent | null;
  onSellDirect: (itemUid: string) => void;
  onListAuction: (itemUid: string, startingBid?: number, navigateToAuction?: boolean) => void;
  onApplySupply: (itemUid: string, supplyId: string) => void;
  onSellSet: (setId: string) => void;
  onAppraise?: (itemUid: string) => void;
  onAssemblePart?: (incompleteUid: string, partUid: string) => void;
  supplies: Record<string, number>;
  completeSets: string[];
  contracts?: ClientContract[];
}

type SortMode = 'newest' | 'value-high' | 'value-low' | 'condition';

const CATEGORY_COLORS: Record<ItemCategory, string> = {
  furniture: '#423326',
  electronics: '#283648',
  art: '#442a4a',
  jewelry: '#4d3d22',
  books: '#2a3b2a',
  toys: '#452c38',
  tools: '#36383b',
  kitchenware: '#423d26',
  clothing: '#332f42',
  oddities: '#4a262c',
  sports: '#263b2e',
  music: '#332d45',
};

const CONDITION_STYLES: Record<ItemCondition, { bg: string; text: string; border: string }> = {
  junk: { bg: '#2b1414', text: '#e57373', border: '#602828' },
  dusty: { bg: '#2e2413', text: '#ffb74d', border: '#6b5024' },
  fair: { bg: '#1e2b17', text: '#aed581', border: '#425e30' },
  good: { bg: '#132b1e', text: '#81c784', border: '#2b6040' },
  pristine: { bg: '#132733', text: '#4fc3f7', border: '#285873' },
};

const CONDITION_ORDER: ItemCondition[] = ['junk', 'dusty', 'fair', 'good', 'pristine'];

const CONDITION_RANKS: Record<string, number> = {
  junk: 1,
  dusty: 2,
  fair: 3,
  good: 4,
  pristine: 5,
};

export function StorageView({
  ownedItems,
  nextAuction,
  onSellDirect,
  onListAuction,
  onApplySupply,
  onSellSet,
  onAppraise,
  onAssemblePart,
  supplies,
  contracts = [],
}: StorageViewProps) {
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [filterCategory, setFilterCategory] = useState<ItemCategory | 'all'>('all');
  const [expandedUid, setExpandedUid] = useState<string | null>(null);

  // Quick consign modal state
  const [consigningItemUid, setConsigningItemUid] = useState<string | null>(null);
  const [consignReserve, setConsignReserve] = useState<number>(0);

  const completedSets = useMemo(() => {
    return checkCompleteSets(ownedItems);
  }, [ownedItems]);

  const itemsWithDefs = useMemo(() => {
    return ownedItems.map((item) => ({
      owned: item,
      def: getItemDef(item.itemId),
    }));
  }, [ownedItems]);

  const filteredItems = useMemo(() => {
    let list = [...itemsWithDefs];

    if (filterCategory !== 'all') {
      list = list.filter((i) => i.def?.category === filterCategory);
    }

    switch (sortMode) {
      case 'newest':
        list.sort((a, b) => b.owned.boughtAt - a.owned.boughtAt);
        break;
      case 'value-high':
        list.sort((a, b) => {
          const valA = a.def ? getDirectSellValue(a.def, a.owned.condition, a.owned.makerMark) : 0;
          const valB = b.def ? getDirectSellValue(b.def, b.owned.condition, b.owned.makerMark) : 0;
          return valB - valA;
        });
        break;
      case 'value-low':
        list.sort((a, b) => {
          const valA = a.def ? getDirectSellValue(a.def, a.owned.condition, a.owned.makerMark) : 0;
          const valB = b.def ? getDirectSellValue(b.def, b.owned.condition, b.owned.makerMark) : 0;
          return valA - valB;
        });
        break;
      case 'condition':
        list.sort((a, b) => {
          const idxA = CONDITION_ORDER.indexOf(a.owned.condition);
          const idxB = CONDITION_ORDER.indexOf(b.owned.condition);
          return idxB - idxA;
        });
        break;
    }

    return list;
  }, [itemsWithDefs, filterCategory, sortMode]);

  // Open quick consign modal
  const handleOpenConsignModal = (itemUid: string) => {
    const item = ownedItems.find((o) => o.uid === itemUid);
    if (!item || !nextAuction) return;
    const def = getItemDef(item.itemId);
    if (!def) return;
    const est = getAuctionEstimate(def, item.condition, nextAuction, null, item.makerMark);
    setConsigningItemUid(itemUid);
    setConsignReserve(Math.max(1, est.expected));
      };

  const handleConfirmConsign = (navigateToAuction: boolean) => {
    if (!consigningItemUid || consignReserve <= 0) return;
        onListAuction(consigningItemUid, consignReserve, navigateToAuction);
    setConsigningItemUid(null);
  };

  const consigningItem = ownedItems.find((o) => o.uid === consigningItemUid);
  const consigningDef = consigningItem ? getItemDef(consigningItem.itemId) : null;
  const consigningEstimate =
    consigningDef && consigningItem && nextAuction
      ? getAuctionEstimate(consigningDef, consigningItem.condition, nextAuction, null, consigningItem.makerMark)
      : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Completed Sets Banner */}
      {completedSets.length > 0 && (
        <div className="curio-tray p-3.5 flex flex-col gap-2.5 border-l-4 border-l-[#81c784]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--wood-brass-bright)] uppercase tracking-wider">
              Complete Sets Assembled ({completedSets.length})
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {completedSets.map((setDef) => {
              const value = getSetSellValue(setDef, ownedItems);
              return (
                <div
                  key={setDef.id}
                  className="curio-slot p-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[var(--text-parchment)]">
                      {setDef.name}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {setDef.itemIds.length} pieces assembled ({setDef.bonusMultiplier}x set bonus)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                                            onSellSet(setDef.id);
                    }}
                    className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#1e3b2b] hover:bg-[#274f39] text-[#98e2b8] border border-[#2f6345] shadow"
                  >
                    Sell Set (${value})
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Storage Filter Controls */}
      <div className="curio-tray p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--wood-brass-bright)] uppercase tracking-wider">
            Curio Vault
          </span>
          <span className="seal-tag bg-[#1c140d] border-[#704d22] text-[var(--wood-brass-bright)] font-bold">
            {ownedItems.length} Items
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="text-xs p-1.5 bg-[var(--wood-darkest)] border border-[var(--wood-border)] text-[var(--text-parchment)]"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="newest">Sort: Newest</option>
            <option value="value-high">Sort: Value (High to Low)</option>
            <option value="value-low">Sort: Value (Low to High)</option>
            <option value="condition">Sort: Condition</option>
          </select>

          <select
            className="text-xs p-1.5 bg-[var(--wood-darkest)] border border-[var(--wood-border)] text-[var(--text-parchment)]"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
          >
            <option value="all">Category: All</option>
            <option value="furniture">Furniture</option>
            <option value="electronics">Electronics</option>
            <option value="art">Art</option>
            <option value="jewelry">Jewelry</option>
            <option value="books">Books</option>
            <option value="toys">Toys</option>
            <option value="tools">Tools</option>
            <option value="kitchenware">Kitchenware</option>
            <option value="clothing">Clothing</option>
            <option value="oddities">Oddities</option>
            <option value="sports">Sports</option>
            <option value="music">Music</option>
          </select>
        </div>
      </div>

      {/* Storage Items List */}
      {filteredItems.length === 0 ? (
        <div className="curio-tray p-8 text-center text-xs text-[var(--text-muted)]">
          {ownedItems.length === 0
            ? 'Your storage vault is empty. Visit shops or the auction block to acquire stock.'
            : 'No items match the selected category filter.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredItems.map(({ owned, def }) => {
            if (!def) return null;

            const isExpanded = expandedUid === owned.uid;
            const cond = CONDITION_STYLES[owned.condition];
            const sellValue = getDirectSellValue(def, owned.condition, owned.makerMark);
            const estimate = nextAuction
              ? getAuctionEstimate(def, owned.condition, nextAuction, null, owned.makerMark)
              : null;
            const canRestore = def.restorable && owned.condition !== 'pristine';

            // Check if matching part exists in storage
            const matchingAssembly = PART_ASSEMBLIES.find(
              (p) => p.incompleteId === owned.itemId
            );
            const matchingPart = matchingAssembly
              ? ownedItems.find((o) => o.itemId === matchingAssembly.partId)
              : null;

            // Check if matches active contract
            const contractMatch = contracts.find(
              (c) =>
                !c.completed &&
                c.category === def.category &&
                (CONDITION_RANKS[owned.condition] || 0) >= (CONDITION_RANKS[c.minCondition] || 0)
            );

            return (
              <div
                key={owned.uid}
                onClick={() => setExpandedUid(isExpanded ? null : owned.uid)}
                className={`curio-slot p-3 flex flex-col gap-2 transition-all cursor-pointer border-2 ${
                  isExpanded ? 'border-[var(--wood-brass-bright)] bg-[#18130e]' : 'border-[var(--wood-border)]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ItemImage
                      itemId={def.id}
                      condition={owned.condition}
                      category={def.category}
                      name={def.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 shrink-0"
                    />

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
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
                        {contractMatch && (
                          <span className="seal-tag bg-[#1e3b2b] text-[#98e2b8] border-[#2f6345] font-bold">
                            Wanted by {contractMatch.clientName} (${contractMatch.rewardMoney})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-xs"
                          style={{
                            backgroundColor: CATEGORY_COLORS[def.category] || '#333',
                            color: '#e8ded0',
                          }}
                        >
                          {def.category}
                        </span>

                        {owned.makerMark === 'unverified' && (
                          <span className="seal-tag bg-[#3b2a1a] border-[#6b4d1b] text-[#f0b040] font-bold">
                            Unverified Mark
                          </span>
                        )}
                        {owned.makerMark === 'authentic' && (
                          <span className="seal-tag bg-[#132b1e] border-[#2b6040] text-[#81c784] font-bold">
                            Genuine Maker Mark
                          </span>
                        )}
                        {owned.makerMark === 'counterfeit' && (
                          <span className="seal-tag bg-[#2b1414] border-[#602828] text-[#e57373] font-bold">
                            Counterfeit Replica
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-xs font-bold text-[var(--wood-brass-bright)]">
                      Val: ${sellValue}
                    </span>
                    {estimate && (
                      <span className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        Est: ${estimate.low}-${estimate.high}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Details & Actions */}
                {isExpanded && (
                  <div className="pt-2 mt-1 border-t border-[var(--wood-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed max-w-md">
                      {def.description} Paid ${owned.boughtFor}.
                    </p>

                    <div className="flex flex-wrap gap-1.5 justify-end items-center shrink-0">
                      {matchingAssembly && matchingPart && onAssemblePart && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                                                        onAssemblePart(owned.uid, matchingPart.uid);
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#c8953c] hover:bg-[#e2ad4f] text-[#100d0a] border border-[#e2ad4f]"
                        >
                          Assemble Part
                        </button>
                      )}

                      {owned.makerMark === 'unverified' && onAppraise && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                                                        onAppraise(owned.uid);
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#3b2a1a] hover:bg-[#4a3520] text-[#f0b040] border border-[#704818]"
                        >
                          Appraise ($25)
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                                                    onSellDirect(owned.uid);
                        }}
                        className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#241e19] hover:bg-[#342a22] text-[var(--text-parchment)] border border-[#4e3e30]"
                      >
                        Quick Sell (${sellValue})
                      </button>

                      {estimate && nextAuction && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenConsignModal(owned.uid);
                          }}
                          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#241e19] hover:bg-[#c8953c] hover:text-[#100d0a] text-[var(--wood-brass)] border border-[#4e3e30] shadow font-bold"
                        >
                          Consign to Auction
                        </button>
                      )}

                      {canRestore && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const availableSupplyId = Object.entries(supplies).find(
                              ([, qty]) => qty > 0
                            )?.[0];
                            if (availableSupplyId) {
                                                            onApplySupply(owned.uid, availableSupplyId);
                            }
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#1c3628] hover:bg-[#254d38] text-[#81c784] border border-[#2d5940] shadow"
                        >
                          Clean Item
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Consign Dialog Modal */}
      {consigningItemUid && consigningItem && consigningDef && consigningEstimate && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4">
          <div className="curio-tray max-w-md w-full p-4 border-2 border-[var(--wood-brass-bright)] flex flex-col gap-3 shadow-2xl bg-[#14100c]">
            <div className="flex items-center justify-between border-b border-[var(--wood-border)] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--wood-brass-bright)]">
                Consign Item to Auction
              </span>
              <button
                onClick={() => setConsigningItemUid(null)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-parchment)]"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 curio-slot p-3">
              <ItemImage
                itemId={consigningDef.id}
                condition={consigningItem.condition}
                category={consigningDef.category}
                name={consigningDef.name}
                className="w-16 h-16 shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-[var(--text-parchment)] truncate">
                  {consigningDef.name}
                </span>
                <span className="text-xs text-[var(--wood-brass-bright)] font-bold mt-0.5">
                  Expected Hammer: ${consigningEstimate.expected}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Range: ${consigningEstimate.low} - ${consigningEstimate.high}
                </span>
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                Reserve Strategy Presets
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                                        setConsignReserve(Math.max(1, Math.round(consigningEstimate.expected * 0.8)));
                  }}
                  className="px-2 py-1.5 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)]"
                >
                  Quick Sale (-20%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                                        setConsignReserve(consigningEstimate.expected);
                  }}
                  className="px-2 py-1.5 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)]"
                >
                  Market Price
                </button>
                <button
                  type="button"
                  onClick={() => {
                                        setConsignReserve(Math.max(1, Math.round(consigningEstimate.expected * 1.25)));
                  }}
                  className="px-2 py-1.5 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)]"
                >
                  High (+25%)
                </button>
              </div>
            </div>

            {/* Starting Bid Input */}
            <div className="flex items-center gap-2 pt-1 border-t border-[var(--wood-border)]">
              <button
                type="button"
                onClick={() => {
                                    setConsignReserve((p) => Math.max(1, p - 5));
                }}
                className="px-3 py-1.5 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)]"
              >
                -$5
              </button>
              <input
                type="number"
                min={1}
                className="flex-1 text-xs p-1.5 bg-[var(--wood-darkest)] border border-[var(--wood-border)] text-[var(--text-parchment)] text-center font-bold"
                value={consignReserve}
                onChange={(e) => setConsignReserve(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <button
                type="button"
                onClick={() => {
                                    setConsignReserve((p) => p + 5);
                }}
                className="px-3 py-1.5 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)]"
              >
                +$5
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1 border-t border-[var(--wood-border)]">
              <button
                type="button"
                onClick={() => handleConfirmConsign(true)}
                className="w-full py-2 text-xs font-bold uppercase tracking-wider bg-[var(--wood-brass)] hover:bg-[var(--wood-brass-bright)] text-[#100d0a] border border-[var(--wood-brass-bright)] shadow"
              >
                Consign & Go to Auction Block →
              </button>
              <button
                type="button"
                onClick={() => handleConfirmConsign(false)}
                className="w-full py-1.5 text-xs font-bold uppercase tracking-wider bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)]"
              >
                Consign & Stay in Storage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
