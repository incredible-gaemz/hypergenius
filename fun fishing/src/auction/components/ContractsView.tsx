import React, { useState } from 'react';
import type { ClientContract, OwnedItem } from '../auctionLogic';
import { getItemDef, getConditionMultiplier } from '../auctionLogic';
import { ItemImage } from './ItemImage';

interface ContractsViewProps {
  contracts: ClientContract[];
  ownedItems: OwnedItem[];
  onFulfillContract: (contractId: string, itemUid: string) => void;
}

const CONDITION_RANKS: Record<string, number> = {
  junk: 1,
  dusty: 2,
  fair: 3,
  good: 4,
  pristine: 5,
};

export function ContractsView({
  contracts,
  ownedItems,
  onFulfillContract,
}: ContractsViewProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>({});

  return (
    <div className="flex flex-col gap-3">
      {/* Contracts Banner */}
      <div className="curio-tray overflow-hidden rounded-sm border border-[var(--wood-border)]">
        <div className="relative h-28 sm:h-36 w-full overflow-hidden">
          <img
            src="/auction/banners/contracts.jpg"
            alt="Collector Contracts"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14100c] via-[#14100c]/70 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 p-3 flex items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[var(--text-parchment)]">
                Private Collector Contracts
              </h2>
              <div className="text-xs text-[var(--text-muted)]">
                Fulfill wanted orders for high payouts and dealer reputation
              </div>
            </div>
            <span className="seal-tag bg-[#1c140d] border-[#704d22] text-[var(--wood-brass-bright)] font-bold">
              {contracts.filter((c) => !c.completed).length} Available
            </span>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {contracts.map((contract) => {
          const eligibleItems = ownedItems.filter((item) => {
            const def = getItemDef(item.itemId);
            if (!def) return false;
            if (def.category !== contract.category) return false;
            return (CONDITION_RANKS[item.condition] || 0) >= (CONDITION_RANKS[contract.minCondition] || 0);
          });

          const chosenUid = selectedItems[contract.id] || (eligibleItems[0]?.uid ?? '');
          const chosenItem = ownedItems.find((o) => o.uid === chosenUid);
          const chosenDef = chosenItem ? getItemDef(chosenItem.itemId) : null;

          return (
            <div
              key={contract.id}
              className={`curio-tray p-3.5 flex flex-col justify-between gap-3 border-2 ${
                contract.completed
                  ? 'border-[#2d4833] opacity-75 bg-[#121914]'
                  : eligibleItems.length > 0
                  ? 'border-[var(--wood-brass-bright)] shadow-md'
                  : 'border-[var(--wood-border)]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-[var(--wood-border)] pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--wood-brass-bright)] uppercase tracking-wider">
                      {contract.clientName}
                    </h3>
                    <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                      {contract.clientTitle}
                    </span>
                  </div>

                  <span
                    className={`seal-tag font-bold ${
                      contract.completed
                        ? 'bg-[#18281c] text-[#7ecb8f] border-[#2e5436]'
                        : 'bg-[#261c12] text-[var(--wood-brass-bright)] border-[#5e4321]'
                    }`}
                  >
                    {contract.completed ? 'FULFILLED' : `+${contract.rewardXp} XP`}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-parchment)] mt-2.5 leading-relaxed">
                  {contract.description}
                </p>

                <div className="mt-3 p-2 bg-[var(--wood-darkest)] border border-[var(--wood-border)] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                      Bounty Reward
                    </span>
                    <span className="text-sm font-extrabold text-[var(--wood-brass-bright)]">
                      ${contract.rewardMoney}
                    </span>
                  </div>

                  <div className="flex flex-col text-right">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                      Min Condition
                    </span>
                    <span className="text-xs font-bold uppercase text-[var(--text-parchment)]">
                      {contract.minCondition}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="pt-2 border-t border-[var(--wood-border)] flex flex-col gap-2">
                {contract.completed ? (
                  <div className="py-2 text-center text-xs font-bold text-[#81c784] seal-tag bg-[#16291c] border-[#2b5936]">
                    Order Delivered & Paid
                  </div>
                ) : eligibleItems.length === 0 ? (
                  <div className="py-2 text-center text-[11px] text-[var(--text-muted)] bg-[var(--wood-darkest)] border border-[var(--wood-border)]">
                    No matching item in storage. Scour shops or auctions!
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {eligibleItems.length > 1 && (
                      <select
                        className="text-xs p-1.5 bg-[var(--wood-darkest)] border border-[var(--wood-border)] text-[var(--text-parchment)]"
                        value={chosenUid}
                        onChange={(e) =>
                          setSelectedItems((prev) => ({
                            ...prev,
                            [contract.id]: e.target.value,
                          }))
                        }
                      >
                        {eligibleItems.map((item) => {
                          const def = getItemDef(item.itemId);
                          return (
                            <option key={item.uid} value={item.uid}>
                              {def?.name} ({item.condition.toUpperCase()})
                            </option>
                          );
                        })}
                      </select>
                    )}

                    {chosenDef && chosenItem && eligibleItems.length === 1 && (
                      <div className="flex items-center gap-2 curio-slot p-1.5">
                        <ItemImage
                          itemId={chosenDef.id}
                          condition={chosenItem.condition}
                          className="w-10 h-10 shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-[var(--text-parchment)] truncate">
                            {chosenDef.name}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] uppercase">
                            {chosenItem.condition}
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                                                                        onFulfillContract(contract.id, chosenUid);
                      }}
                      className="w-full py-2 text-xs font-bold uppercase tracking-wider bg-[#1e3b2b] hover:bg-[#274f39] text-[#98e2b8] border-2 border-[#3f885e] shadow"
                    >
                      Deliver & Collect ${contract.rewardMoney} (+{contract.rewardXp} XP)
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
