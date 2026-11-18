import React, { useState, useEffect, useRef } from 'react';
import type {
  AuctionEvent,
  AuctionListing,
  OwnedItem,
  ItemCondition,
} from '../auctionLogic';
import {
  getItemDef,
  getAuctionEstimate,
  rollAuctionResult,
  RIVAL_BIDDERS,
} from '../auctionLogic';
import { ItemImage } from './ItemImage';

interface AuctionViewProps {
  nextAuction: AuctionEvent | null;
  auctionListings: AuctionListing[];
  auctionResults: AuctionListing[];
  ownedItems: OwnedItem[];
  money: number;
  dealerLevelBonus?: number;
  onListItem: (itemUid: string, startingBid: number) => void;
  onCollectProceeds: (listingUid: string) => void;
  onCollectAllProceeds?: () => void;
  onReclaimUnsold: (listingUid: string) => void;
  onCancelListing?: (listingUid: string) => void;
  onBidHouseLot?: (lotUid: string, increment: number) => void;
  onHammerHouseLot?: (lotUid: string) => void;
  onResolveConsignments?: () => void;
  onNewAuctionSession?: () => void;
  onDirectLiveSale?: (listingUid: string, finalPrice: number, bidCount: number) => void;
  onDirectLivePass?: (listingUid: string) => void;
  defaultSubTab?: 'floor' | 'consign';
}

const CONDITION_STYLES: Record<ItemCondition, { bg: string; text: string; border: string }> = {
  junk: { bg: '#2b1414', text: '#e57373', border: '#602828' },
  dusty: { bg: '#2e2413', text: '#ffb74d', border: '#6b5024' },
  fair: { bg: '#1e2b17', text: '#aed581', border: '#425e30' },
  good: { bg: '#132b1e', text: '#81c784', border: '#2b6040' },
  pristine: { bg: '#132733', text: '#4fc3f7', border: '#285873' },
};

interface BiddingStep {
  bidder: string;
  amount: number;
  message: string;
}

export function AuctionView({
  nextAuction,
  auctionListings,
  auctionResults,
  ownedItems,
  money,
  dealerLevelBonus = 0,
  onListItem,
  onCollectProceeds,
  onCollectAllProceeds,
  onReclaimUnsold,
  onCancelListing,
  onBidHouseLot,
  onHammerHouseLot,
  onResolveConsignments,
  onNewAuctionSession,
  onDirectLiveSale,
  onDirectLivePass,
  defaultSubTab = 'floor',
}: AuctionViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'floor' | 'consign'>(defaultSubTab);
  const [selectedItemUid, setSelectedItemUid] = useState<string>('');
  const [customStartingBid, setCustomStartingBid] = useState<number>(0);

  // Multi-lot interactive live auction state
  const [isLiveAuctionOpen, setIsLiveAuctionOpen] = useState<boolean>(false);
  const [currentLotIndex, setCurrentLotIndex] = useState<number>(0);
  const [liveLotBidHistory, setLiveLotBidHistory] = useState<BiddingStep[]>([]);
  const [liveCurrentBid, setLiveCurrentBid] = useState<number>(0);
  const [liveCurrentLeader, setLiveCurrentLeader] = useState<string>('');
  const [liveLotStatus, setLiveLotStatus] = useState<'opening' | 'bidding' | 'hammered' | 'passed'>('opening');
  const [hasHypedLot, setHasHypedLot] = useState<boolean>(false);
  const [liveAuctionEarnings, setLiveAuctionEarnings] = useState<number>(0);
  const [liveAuctionSoldLots, setLiveAuctionSoldLots] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Switch to consign tab if user Consigns
  useEffect(() => {
    if (defaultSubTab) {
      setActiveSubTab(defaultSubTab);
    }
  }, [defaultSubTab]);

  const selectedOwned = ownedItems.find((o) => o.uid === selectedItemUid);
  const selectedDef = selectedOwned ? getItemDef(selectedOwned.itemId) : null;
  const estimate =
    selectedDef && selectedOwned && nextAuction
      ? getAuctionEstimate(selectedDef, selectedOwned.condition, nextAuction, null, selectedOwned.makerMark)
      : null;

  const handleSelectChange = (uid: string) => {
    setSelectedItemUid(uid);
    const item = ownedItems.find((o) => o.uid === uid);
    if (item && nextAuction) {
      const def = getItemDef(item.itemId);
      if (def) {
        const est = getAuctionEstimate(def, item.condition, nextAuction, null, item.makerMark);
        setCustomStartingBid(Math.max(1, est.expected));
      }
    }
  };

  const handlePresetBid = (factor: number) => {
    if (!estimate) return;
    const bid = Math.max(1, Math.round(estimate.expected * factor));
    setCustomStartingBid(bid);
      };

  const handleStepBid = (delta: number) => {
    setCustomStartingBid((prev) => Math.max(1, prev + delta));
      };

  const handleListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemUid || customStartingBid <= 0) return;
        onListItem(selectedItemUid, customStartingBid);
    setSelectedItemUid('');
    setCustomStartingBid(0);
  };

  // -------------------------------------------------------------
  // INTERACTIVE LIVE AUCTION SIMULATOR FOR CONSIGNMENTS
  // -------------------------------------------------------------
  const currentConsignment = auctionListings[currentLotIndex];

  const startLiveAuctionSession = () => {
    if (auctionListings.length === 0 || !nextAuction) return;
    setIsLiveAuctionOpen(true);
    setCurrentLotIndex(0);
    setLiveAuctionEarnings(0);
    setLiveAuctionSoldLots(0);
    initLotAt(0);
  };

  const initLotAt = (idx: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const listing = auctionListings[idx];
    if (!listing || !nextAuction) return;

    const def = getItemDef(listing.itemUid);
    const startPrice = listing.startingBid;

    setCurrentLotIndex(idx);
    setLiveCurrentBid(startPrice);
    setLiveCurrentLeader('House Reserve');
    setLiveLotStatus('opening');
    setHasHypedLot(false);

    setLiveLotBidHistory([
      {
        bidder: 'Podium',
        amount: startPrice,
        message: `Auctioneer calls Lot ${idx + 1}: ${def?.name ?? 'Antique Piece'} to the block. Reserve: $${startPrice}.`,
      },
    ]);

    
    // Roll final target outcome
    const outcome = rollAuctionResult(
      def!,
      listing.condition || 'fair',
      nextAuction,
      null,
      startPrice,
      listing.makerMark,
      dealerLevelBonus
    );

    // After 700ms, start bidding rounds
    timerRef.current = setTimeout(() => {
      runBiddingRounds(outcome, startPrice);
    }, 700);
  };

  const runBiddingRounds = (
    outcome: ReturnType<typeof rollAuctionResult>,
    startPrice: number
  ) => {
    if (outcome.sold && outcome.finalPrice >= startPrice) {
      setLiveLotStatus('bidding');

      // Generate 2-4 escalating bids
      const totalSteps = Math.min(Math.max(2, outcome.bidCount), 5);
      const stepDiff = Math.max(5, Math.round((outcome.finalPrice - startPrice) / totalSteps));
      const chosenRivals = [...RIVAL_BIDDERS].sort(() => Math.random() - 0.5);

      let currentStep = 0;
      let currAmount = startPrice;

      const interval = setInterval(() => {
        currentStep++;
        const rival = chosenRivals[currentStep % chosenRivals.length];

        if (currentStep >= totalSteps) {
          clearInterval(interval);
          currAmount = outcome.finalPrice;
          setLiveCurrentBid(currAmount);
          setLiveCurrentLeader(rival);
          
          setLiveLotBidHistory((prev) => [
            ...prev,
            {
              bidder: rival,
              amount: currAmount,
              message: `${rival} raises paddle to $${currAmount}!`,
            },
            {
              bidder: 'Podium',
              amount: currAmount,
              message: 'Going once... Going twice... Any further bids in the room?',
            },
          ]);
        } else {
          currAmount += stepDiff;
          setLiveCurrentBid(currAmount);
          setLiveCurrentLeader(rival);
          
          setLiveLotBidHistory((prev) => [
            ...prev,
            {
              bidder: rival,
              amount: currAmount,
              message: `${rival} enters the floor at $${currAmount}.`,
            },
          ]);
        }
      }, 700);
    } else {
      // Room hesitates
      setLiveLotStatus('opening');
      setLiveLotBidHistory((prev) => [
        ...prev,
        {
          bidder: 'Podium',
          amount: startPrice,
          message: 'The room is silent. Bidders are hesitating at the opening reserve.',
        },
      ]);
    }
  };

  // Player action: Hype Item to stir extra bids
  const handleHypeItem = () => {
    if (hasHypedLot || liveLotStatus === 'hammered' || liveLotStatus === 'passed') return;
    setHasHypedLot(true);
    
    const bump = Math.max(10, Math.round(liveCurrentBid * 0.15));
    const newBid = liveCurrentBid + bump;
    const rival = RIVAL_BIDDERS[Math.floor(Math.random() * RIVAL_BIDDERS.length)];

    setLiveLotBidHistory((prev) => [
      ...prev,
      {
        bidder: 'You',
        amount: liveCurrentBid,
        message: 'You highlight the exquisite craftsmanship and maker details to the crowd!',
      },
      {
        bidder: rival,
        amount: newBid,
        message: `${rival} is swayed! Raises paddle to $${newBid}!`,
      },
    ]);

    setLiveCurrentBid(newBid);
    setLiveCurrentLeader(rival);
    setLiveLotStatus('bidding');
      };

  // Player action: Lower reserve if room stalled
  const handleLowerReserve = () => {
    if (liveLotStatus !== 'opening' || !currentConsignment) return;
    const def = getItemDef(currentConsignment.itemUid);
    const discounted = Math.max(5, Math.round(liveCurrentBid * 0.8));
    setLiveCurrentBid(discounted);
    
    setLiveLotBidHistory((prev) => [
      ...prev,
      {
        bidder: 'Podium',
        amount: discounted,
        message: `Reserve lowered to $${discounted}. Room interest ignites!`,
      },
    ]);

    const outcome = rollAuctionResult(
      def!,
      currentConsignment.condition || 'fair',
      nextAuction!,
      null,
      discounted,
      currentConsignment.makerMark,
      dealerLevelBonus
    );

    setTimeout(() => {
      runBiddingRounds(outcome, discounted);
    }, 500);
  };

  // Finalize current lot sale
  const handleStrikeGavel = () => {
    if (!currentConsignment) return;
        
    const finalAmount = liveCurrentBid;
    const winner = liveCurrentLeader !== 'House Reserve' ? liveCurrentLeader : 'Floor Buyer';

    setLiveLotStatus('hammered');
    setLiveAuctionEarnings((prev) => prev + finalAmount);
    setLiveAuctionSoldLots((prev) => prev + 1);

    setLiveLotBidHistory((prev) => [
      ...prev,
      {
        bidder: 'Podium',
        amount: finalAmount,
        message: `GAVEL STRIKES! SOLD to ${winner} for $${finalAmount}!`,
      },
    ]);

    // Apply sale in app state
    if (onDirectLiveSale) {
      onDirectLiveSale(currentConsignment.uid, finalAmount, liveLotBidHistory.length);
    }
  };

  // Pass lot without selling
  const handlePassCurrentLot = () => {
    if (!currentConsignment) return;
        setLiveLotStatus('passed');

    setLiveLotBidHistory((prev) => [
      ...prev,
      {
        bidder: 'Podium',
        amount: 0,
        message: 'Gavel strikes! Lot passed and returned safely to storage.',
      },
    ]);

    if (onDirectLivePass) {
      onDirectLivePass(currentConsignment.uid);
    }
  };

  // Advance to next consigned lot or finish
  const handleNextLot = () => {
    if (currentLotIndex + 1 < auctionListings.length) {
      initLotAt(currentLotIndex + 1);
    } else {
      // Done with all lots
      setIsLiveAuctionOpen(false);
      onResolveConsignments?.();
          }
  };

  const handleCloseLiveModal = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsLiveAuctionOpen(false);
    onResolveConsignments?.();
  };

  const houseLots = nextAuction?.houseLots ?? [];
  const activeHouseLotsCount = houseLots.filter((l) => l.status === 'active').length;
  const soldResults = auctionResults.filter((r) => r.status === 'sold');
  const totalProceeds = soldResults.reduce((sum, r) => sum + r.finalPrice, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Auction Banner */}
      <div className="curio-tray overflow-hidden rounded-sm border border-[var(--wood-border)]">
        <div className="relative h-28 sm:h-36 w-full overflow-hidden">
          <img
            src="/auction/banners/auction.jpg"
            alt="The Auction Block"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14100c] via-[#14100c]/70 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 p-3 flex items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[var(--text-parchment)]">
                {nextAuction?.themeName ?? 'Auctions'}
              </h2>
              <div className="text-xs text-[var(--text-muted)]">
                House commission fee: {Math.round((nextAuction?.fee ?? 0.1) * 100)}%
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {nextAuction &&
                Object.entries(nextAuction.categoryBonuses).map(([cat, mult]) => (
                  <span
                    key={cat}
                    className="seal-tag bg-[#1c140d] border-[#704d22] text-[var(--wood-brass-bright)] font-bold"
                  >
                    {cat}: {mult}x
                  </span>
                ))}
              {onNewAuctionSession && (
                <button
                  onClick={() => {
                                        onNewAuctionSession();
                  }}
                  className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-[#c8953c] hover:bg-[#e2ad4f] text-[#100d0a] border border-[#e2ad4f] shadow"
                >
                  New Session
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auction Floor Navigation Tabs */}
      <div className="curio-tray p-1.5 flex gap-1">
        <button
          onClick={() => {
                        setActiveSubTab('floor');
          }}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'floor' ? 'curio-tab-active' : 'curio-tab-inactive'
          }`}
        >
          Floor Lots (Bid & Buy) {activeHouseLotsCount > 0 && `(${activeHouseLotsCount})`}
        </button>
        <button
          onClick={() => {
                        setActiveSubTab('consign');
          }}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'consign' ? 'curio-tab-active' : 'curio-tab-inactive'
          }`}
        >
          Consign & Sell {auctionListings.length > 0 && `(${auctionListings.length} on block)`}
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: FLOOR LOTS (BID & BUY) */}
      {/* ========================================================= */}
      {activeSubTab === 'floor' && (
        <div className="curio-tray p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[var(--wood-border)] pb-2">
            <div>
              <span className="text-xs font-bold text-[var(--wood-brass-bright)] uppercase tracking-wider">
                Floor Lots on the Block ({activeHouseLotsCount} Active)
              </span>
              <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                Estate cleanouts, liquidation oddities, and rare rough antiques
              </span>
            </div>
            {onNewAuctionSession && (
              <button
                onClick={() => {
                                    onNewAuctionSession();
                }}
                className="px-3 py-1 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)]"
              >
                Summon New Lots
              </button>
            )}
          </div>

          {houseLots.length === 0 ? (
            <div className="curio-slot p-8 text-center flex flex-col items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">
                The auction podium is currently clear.
              </span>
              {onNewAuctionSession && (
                <button
                  onClick={() => {
                                        onNewAuctionSession();
                  }}
                  className="px-4 py-1.5 text-xs font-bold bg-[var(--wood-brass)] hover:bg-[var(--wood-brass-bright)] text-[#100d0a] border border-[var(--wood-brass-bright)]"
                >
                  Bring Fresh Lots to the Floor
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {houseLots.map((lot) => {
                const def = getItemDef(lot.itemId);
                if (!def) return null;

                const isPlayerTop = lot.highestBidder === 'player';
                const isClosed = lot.status !== 'active';
                const cond = CONDITION_STYLES[lot.condition];

                return (
                  <div
                    key={lot.uid}
                    className={`curio-slot p-3 flex flex-col justify-between gap-3 border-2 ${
                      isPlayerTop
                        ? 'border-[var(--wood-brass-bright)] shadow-md bg-[#18130e]'
                        : 'border-[var(--wood-border)]'
                    }`}
                  >
                    <div>
                      {/* Big Item Showcase */}
                      <div className="flex items-start gap-3">
                        <ItemImage
                          itemId={def.id}
                          condition={lot.condition}
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
                              {lot.condition}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                              {def.category}
                            </span>
                            {lot.makerMark && (
                              <span className="seal-tag bg-[#332514] border-[#6b4d1b] text-[#e6a84c]">
                                Unverified Mark
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-[var(--text-muted)] mt-1.5 line-clamp-2">
                            {def.description}
                          </p>
                        </div>
                      </div>

                      {/* Current Bid & High Bidder Badge */}
                      <div className="mt-3 p-2 bg-[var(--wood-darkest)] border border-[var(--wood-border)] flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                            Current Standing Bid
                          </span>
                          <span className="text-sm font-black text-[var(--wood-brass-bright)]">
                            ${lot.currentBid}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                            Floor Standing
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-xs font-bold uppercase tracking-wider"
                              style={{ color: isPlayerTop ? '#81c784' : '#e2ad4f' }}
                            >
                              {isPlayerTop
                                ? 'YOU HOLD WINNING BID'
                                : lot.highestBidder === 'house'
                                ? 'Opening Floor Call'
                                : `Rival High Bid: ${lot.highestBidder}`}
                            </span>
                            {lot.bidCount > 0 && (
                              <span className="text-[10px] text-[var(--text-muted)]">
                                ({lot.bidCount} bids)
                              </span>
                            )}
                          </div>
                          {!isPlayerTop && lot.highestBidder !== 'house' && (
                            <div className="text-[11px] text-[#e2ad4f] italic mt-0.5">
                              "{lot.highestBidder}: That belongs in my collection!"
                            </div>
                          )}
                          {isPlayerTop && (
                            <div className="text-[11px] text-[#81c784] font-medium mt-0.5">
                              Going once... Going twice... Strike gavel to claim!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bidding Actions & Gavel Down */}
                    {!isClosed ? (
                      <div className="flex flex-col gap-2 pt-1 border-t border-[var(--wood-border)]">
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            disabled={money < lot.currentBid + 10}
                            onClick={() => {
                                                            onBidHouseLot?.(lot.uid, 10);
                            }}
                            className="px-2 py-1.5 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)] disabled:opacity-30"
                          >
                            +$10 Bid
                          </button>
                          <button
                            disabled={money < lot.currentBid + 25}
                            onClick={() => {
                                                            onBidHouseLot?.(lot.uid, 25);
                            }}
                            className="px-2 py-1.5 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)] disabled:opacity-30"
                          >
                            +$25 Raise
                          </button>
                          <button
                            disabled={money < lot.currentBid + 50}
                            onClick={() => {
                                                            onBidHouseLot?.(lot.uid, 50);
                            }}
                            className="px-2 py-1.5 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)] disabled:opacity-30"
                          >
                            +$50 Outbid
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            if (isPlayerTop) {
                                                                                        } else {
                                                          }
                            onHammerHouseLot?.(lot.uid);
                          }}
                          className={`w-full py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                            isPlayerTop
                              ? 'bg-[#1e3b2b] hover:bg-[#274f39] text-[#98e2b8] border-2 border-[#3f885e]'
                              : 'bg-[#241d17] hover:bg-[#322820] text-[var(--text-muted)] border border-[var(--wood-border)]'
                          }`}
                        >
                          {isPlayerTop
                            ? `Strike Gavel! (Win for $${lot.currentBid})`
                            : lot.highestBidder !== 'house'
                            ? `Pass Lot to ${lot.highestBidder}`
                            : 'Pass Lot'}
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 text-center text-xs font-bold seal-tag bg-[#1c1813] border-[#352a20] text-[var(--text-muted)]">
                        {lot.status === 'sold_to_player'
                          ? 'WON - Delivered to your Storage'
                          : lot.status === 'sold_to_rival'
                          ? `SOLD to ${lot.highestBidder}`
                          : 'PASSED'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CONSIGN & SELL */}
      {/* ========================================================= */}
      {activeSubTab === 'consign' && (
        <div className="flex flex-col gap-3">
          {/* Completed Consignments Banner & Instant Payout */}
          {auctionResults.length > 0 && (
            <div className="curio-tray p-3.5 flex flex-col gap-2.5 border-l-4 border-l-[#81c784]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[var(--text-parchment)] uppercase tracking-wider">
                    Completed Consignments ({auctionResults.length})
                  </span>
                  {totalProceeds > 0 && (
                    <span className="text-xs text-[#81c784] font-bold block mt-0.5">
                      Ready for collection: ${totalProceeds} total payout
                    </span>
                  )}
                </div>
                {totalProceeds > 0 && onCollectAllProceeds && (
                  <button
                    onClick={() => {
                                            onCollectAllProceeds();
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold bg-[#1e3b2b] hover:bg-[#274f39] text-[#98e2b8] border border-[#2f6345] shadow"
                  >
                    Collect All (${totalProceeds})
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2 mt-1">
                {auctionResults.map((result) => {
                  const def = getItemDef(result.itemUid);
                  const isSold = result.status === 'sold';

                  return (
                    <div
                      key={result.uid}
                      className="curio-slot p-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {def && (
                          <ItemImage
                            itemId={def.id}
                            condition={result.condition || 'fair'}
                            category={def.category}
                            name={def.name}
                            className="w-14 h-14 sm:w-16 sm:h-16 shrink-0"
                          />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-[var(--text-parchment)] truncate">
                            {def?.name ?? 'Antique'}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            {isSold
                              ? `Hammered at $${result.finalPrice} (${result.bidCount} bids)`
                              : 'Did not meet reserve price'}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSold ? (
                          <button
                            onClick={() => {
                                                            onCollectProceeds(result.uid);
                            }}
                            className="px-3.5 py-1.5 text-xs font-bold bg-[#1e3b2b] hover:bg-[#274f39] text-[#98e2b8] border border-[#2f6345]"
                          >
                            Collect ${result.finalPrice}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                                                            onReclaimUnsold(result.uid);
                            }}
                            className="px-3.5 py-1.5 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)]"
                          >
                            Reclaim to Storage
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Consignments Waiting on the Block */}
          {auctionListings.length > 0 && (
            <div className="curio-tray p-3.5 flex flex-col gap-3 border-l-4 border-l-[var(--wood-brass)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--wood-border)] pb-2">
                <div>
                  <span className="text-xs font-bold text-[var(--wood-brass-bright)] uppercase tracking-wider">
                    Your Consignments on the Block ({auctionListings.length})
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                    Ready for the gavel. Run the live floor or fast settle all!
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={startLiveAuctionSession}
                    className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-[var(--wood-brass)] hover:bg-[var(--wood-brass-bright)] text-[#100d0a] border border-[var(--wood-brass-bright)] shadow"
                  >
                    Run Live Auction Floor
                  </button>
                  {onResolveConsignments && (
                    <button
                      onClick={() => {
                                                                        onResolveConsignments();
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)]"
                    >
                      Fast Settle All
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {auctionListings.map((listing) => {
                  const def = getItemDef(listing.itemUid);
                  return (
                    <div
                      key={listing.uid}
                      className="curio-slot p-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {def && (
                          <ItemImage
                            itemId={def.id}
                            condition={listing.condition || 'fair'}
                            category={def.category}
                            name={def.name}
                            className="w-14 h-14 sm:w-16 sm:h-16 shrink-0"
                          />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-[var(--text-parchment)] truncate">
                            {def?.name ?? 'Antique'}
                          </span>
                          <span className="text-[11px] text-[var(--wood-brass-bright)] font-bold mt-0.5">
                            Reserve: ${listing.startingBid}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="seal-tag bg-[#271d14] border-[#5c4323] text-[var(--wood-brass-bright)] font-bold">
                          On Block
                        </span>
                        {onCancelListing && (
                          <button
                            type="button"
                            onClick={() => {
                                                            onCancelListing(listing.uid);
                            }}
                            className="px-2.5 py-1 text-xs font-bold bg-[#2d1b1b] hover:bg-[#422222] text-[#ff9999] border border-[#6b3535] rounded-sm transition-all"
                            title="Withdraw item and return to storage"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Consign New Item Form */}
          <div className="curio-tray p-3.5 flex flex-col gap-3">
            <div className="text-xs font-bold text-[var(--wood-brass-bright)] uppercase tracking-wider">
              Consign Stock to Auction Block
            </div>

            {ownedItems.length === 0 ? (
              <div className="text-xs text-[var(--text-muted)] p-4 text-center">
                No items in storage. Acquire antique pieces from shop shelves or floor lots to consign.
              </div>
            ) : (
              <form onSubmit={handleListSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold block text-[var(--text-muted)] mb-1">
                    Select Item from Storage
                  </label>
                  <select
                    className="w-full text-xs p-2.5 bg-[var(--wood-darkest)] border border-[var(--wood-border)] text-[var(--text-parchment)]"
                    value={selectedItemUid}
                    onChange={(e) => handleSelectChange(e.target.value)}
                  >
                    <option value="">Choose an item...</option>
                    {ownedItems.map((item) => {
                      const def = getItemDef(item.itemId);
                      if (!def) return null;
                      return (
                        <option key={item.uid} value={item.uid}>
                          {def.name} ({item.condition.toUpperCase()}) - Cost Paid ${item.boughtFor}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedDef && selectedOwned && estimate && (
                  <div className="flex flex-col gap-3 curio-slot p-3.5 border-2 border-[var(--wood-border)]">
                    <div className="flex items-start gap-3.5">
                      <ItemImage
                        itemId={selectedDef.id}
                        condition={selectedOwned.condition}
                        category={selectedDef.category}
                        name={selectedDef.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 shrink-0"
                      />

                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[var(--text-parchment)] truncate">
                            {selectedDef.name}
                          </span>
                          <span
                            className="seal-tag font-bold"
                            style={{
                              backgroundColor: CONDITION_STYLES[selectedOwned.condition].bg,
                              color: CONDITION_STYLES[selectedOwned.condition].text,
                              borderColor: CONDITION_STYLES[selectedOwned.condition].border,
                            }}
                          >
                            {selectedOwned.condition}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--wood-brass-bright)] font-bold mt-1">
                          Est: ${estimate.low} - ${estimate.high} (Market Value ${estimate.expected})
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1">
                          {selectedDef.description}
                        </p>
                      </div>
                    </div>

                    {/* Reserve Presets */}
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--wood-border)]">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                        Reserve Pricing Strategy
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePresetBid(0.8)}
                          className="px-2 py-1.5 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)]"
                        >
                          Quick Sale (-20%)
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePresetBid(1.0)}
                          className="px-2 py-1.5 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)]"
                        >
                          Fair Market (${estimate.expected})
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePresetBid(1.25)}
                          className="px-2 py-1.5 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)]"
                        >
                          High Reserve (+25%)
                        </button>
                      </div>
                    </div>

                    {/* Fine-Tune Reserve */}
                    <div className="pt-2 border-t border-[var(--wood-border)]">
                      <label className="text-[10px] uppercase font-bold block text-[var(--text-muted)] mb-1">
                        Starting Reserve Price ($)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStepBid(-5)}
                          className="px-3.5 py-1.5 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)]"
                        >
                          -$5
                        </button>
                        <input
                          type="number"
                          min={1}
                          className="flex-1 text-xs p-2 bg-[var(--wood-darkest)] border border-[var(--wood-border)] text-[var(--text-parchment)] text-center font-bold"
                          value={customStartingBid}
                          onChange={(e) => setCustomStartingBid(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                        <button
                          type="button"
                          onClick={() => handleStepBid(5)}
                          className="px-3.5 py-1.5 text-xs font-bold bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)]"
                        >
                          +$5
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedItemUid || customStartingBid <= 0}
                  className="mt-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-[var(--wood-brass)] hover:bg-[var(--wood-brass-bright)] text-[#100d0a] border border-[var(--wood-brass-bright)] disabled:opacity-30 shadow"
                >
                  Place Consignment on the Block
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* INTERACTIVE LIVE AUCTION MODAL (FULL EXPERIENCE) */}
      {/* ========================================================= */}
      {isLiveAuctionOpen && currentConsignment && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4">
          <div className="curio-tray max-w-xl w-full p-4 sm:p-5 border-2 border-[var(--wood-brass-bright)] flex flex-col gap-3.5 shadow-2xl bg-[#14100c] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--wood-border)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--wood-brass-bright)]">
                  Live Auction Floor
                </span>
                <span className="seal-tag bg-[#241d17] border-[#4a3a2a] text-[var(--text-parchment)]">
                  Lot {currentLotIndex + 1} of {auctionListings.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="seal-tag bg-[#1e3b2b] text-[#98e2b8] border-[#2f6345] font-bold">
                  Bidding Session
                </span>
                <button
                  onClick={handleCloseLiveModal}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-parchment)] px-1.5"
                  title="Close modal and settle"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Current Item on the Podium */}
            {(() => {
              const def = getItemDef(currentConsignment.itemUid);
              if (!def) return null;
              const cond = CONDITION_STYLES[currentConsignment.condition || 'fair'];

              return (
                <div className="flex items-center gap-3.5 curio-slot p-3.5 border border-[var(--wood-border)]">
                  <ItemImage
                    itemId={def.id}
                    condition={currentConsignment.condition || 'fair'}
                    category={def.category}
                    name={def.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 shrink-0"
                  />

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-sm sm:text-base font-bold text-[var(--text-parchment)] truncate">
                        {def.name}
                      </h4>
                      <span
                        className="seal-tag shrink-0 font-bold"
                        style={{
                          backgroundColor: cond.bg,
                          color: cond.text,
                          borderColor: cond.border,
                        }}
                      >
                        {currentConsignment.condition || 'fair'}
                      </span>
                    </div>

                    <div className="text-xs text-[var(--text-muted)] mt-1">
                      Category: {def.category.toUpperCase()} | Reserve: ${currentConsignment.startingBid}
                    </div>

                    {/* Current Bid Display */}
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-xs text-[var(--text-muted)] uppercase">Current Standing:</span>
                      <span className="text-base sm:text-lg font-black text-[var(--wood-brass-bright)]">
                        ${liveCurrentBid}
                      </span>
                      <span className="text-xs text-[#81c784] font-medium truncate">
                        ({liveCurrentLeader})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Live Auctioneer & Bidding Transcript Log */}
            <div className="p-3 bg-[var(--wood-darkest)] border border-[var(--wood-border)] flex flex-col gap-1.5 text-xs min-h-[140px] max-h-[180px] overflow-y-auto">
              {liveLotBidHistory.map((entry, idx) => (
                <div key={idx} className="flex items-start gap-2 font-mono text-[11px] leading-relaxed">
                  <span className="text-[var(--wood-brass-bright)] font-bold shrink-0">
                    [{entry.bidder}]
                  </span>
                  <span
                    className={
                      entry.message.includes('SOLD')
                        ? 'text-[#81c784] font-bold'
                        : entry.message.includes('passed')
                        ? 'text-[#e57373]'
                        : 'text-[var(--text-parchment)]'
                    }
                  >
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>

            {/* Interactive Player Controls */}
            {liveLotStatus !== 'hammered' && liveLotStatus !== 'passed' ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    disabled={hasHypedLot}
                    onClick={handleHypeItem}
                    className="px-2.5 py-2 text-xs font-bold uppercase tracking-wider bg-[#2e2316] hover:bg-[#42321e] text-[#f0c060] border border-[#6b5025] disabled:opacity-40 shadow-sm"
                  >
                    {hasHypedLot ? 'Item Hyped' : 'Hype Item (+Bids)'}
                  </button>

                  {liveLotStatus === 'opening' && (
                    <button
                      onClick={handleLowerReserve}
                      className="px-2.5 py-2 text-xs font-bold uppercase tracking-wider bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)]"
                    >
                      Drop Reserve (-20%)
                    </button>
                  )}

                  <button
                    onClick={handleStrikeGavel}
                    className="px-2.5 py-2 text-xs font-bold uppercase tracking-wider bg-[#1e3b2b] hover:bg-[#274f39] text-[#98e2b8] border-2 border-[#3f885e] col-span-2 sm:col-span-1 shadow"
                  >
                    Strike Gavel! (Sell ${liveCurrentBid})
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={handlePassCurrentLot}
                    className="text-xs text-[var(--text-muted)] hover:text-[#e57373] underline"
                  >
                    Pass Lot (Return to storage)
                  </button>

                  <button
                    onClick={handleStrikeGavel}
                    className="text-xs text-[var(--wood-brass-bright)] font-bold"
                  >
                    Accept Current High Bid →
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1 border-t border-[var(--wood-border)]">
                <div className="p-2.5 text-center seal-tag font-bold text-xs bg-[#18231c] text-[#81c784] border-[#2e4d38]">
                  Lot {currentLotIndex + 1} Concluded:{' '}
                  {liveLotStatus === 'hammered' ? `Sold for $${liveCurrentBid}` : 'Passed'}
                </div>

                <button
                  onClick={handleNextLot}
                  className="w-full py-2.5 text-xs font-bold uppercase tracking-wider bg-[var(--wood-brass)] hover:bg-[var(--wood-brass-bright)] text-[#100d0a] border border-[var(--wood-brass-bright)] shadow"
                >
                  {currentLotIndex + 1 < auctionListings.length
                    ? `Proceed to Next Lot (${currentLotIndex + 2} of ${auctionListings.length})`
                    : `Conclude Auction Session (Total: $${liveAuctionEarnings})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
