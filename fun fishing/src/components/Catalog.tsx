import React, { useState, useMemo } from 'react';
import {
  FISH_COLLECTION,
  FISHING_AREAS,
  CatalogEntry,
  getRarityTextStyle,
  getRarityBadgeStyle,
  getRarityOrder,
} from '../game/fishingLogic';

interface CatalogProps {
  catalogMap: Record<number, CatalogEntry>;
}

type SortOption =
  | 'default'
  | 'rarity-desc'
  | 'weight-desc'
  | 'count-desc'
  | 'name-asc'
  | 'value-desc';

export const Catalog: React.FC<CatalogProps> = ({ catalogMap }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [onlyTrophies, setOnlyTrophies] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const totalSpecies = FISH_COLLECTION.length;

  // STRICT: Only species that have actually been caught appear in the log
  const caughtSpecies = useMemo(() => {
    return FISH_COLLECTION.filter((f) => {
      const entry = catalogMap[f.id];
      return Boolean(entry && entry.caughtCount > 0);
    });
  }, [catalogMap]);

  const caughtCount = caughtSpecies.length;

  // Filtered & Sorted list
  const processedSpecies = useMemo(() => {
    let list = caughtSpecies.filter((fish) => {
      const entry = catalogMap[fish.id];

      // Search name
      if (searchQuery.trim()) {
        if (!fish.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
          return false;
        }
      }

      // Area filter
      if (selectedArea !== 'all' && fish.areaId !== selectedArea) {
        return false;
      }

      // Tier filter
      if (selectedTier !== 'all' && fish.tier !== selectedTier) {
        return false;
      }

      // Trophy filter
      if (onlyTrophies && !entry?.hasTrophy) {
        return false;
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      const entryA = catalogMap[a.id];
      const entryB = catalogMap[b.id];

      switch (sortBy) {
        case 'rarity-desc': {
          const diff = getRarityOrder(b.tier) - getRarityOrder(a.tier);
          if (diff !== 0) return diff;
          return (entryB?.maxWeight || 0) - (entryA?.maxWeight || 0);
        }
        case 'weight-desc':
          return (entryB?.maxWeight || 0) - (entryA?.maxWeight || 0);
        case 'count-desc':
          return (entryB?.caughtCount || 0) - (entryA?.caughtCount || 0);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'value-desc':
          return b.basePrice - a.basePrice;
        case 'default':
        default:
          return a.id - b.id;
      }
    });

    return list;
  }, [caughtSpecies, catalogMap, searchQuery, selectedArea, selectedTier, onlyTrophies, sortBy]);

  return (
    <div className="border border-[#2a2d34] bg-[#181a1f] p-4 text-[#e3e6eb] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#292d36] pb-3 text-xs">
        <div>
          <span className="font-bold text-[#f1f3f5] text-sm">
            Species Log ({caughtCount} / {totalSpecies} Caught)
          </span>
          <div className="text-[11px] text-[#8c94a2] mt-0.5">
            Log of all fish you have landed, their rarity, and personal records.
          </div>
        </div>
        <div className="text-right text-xs text-[#8c94a2]">
          Showing {processedSpecies.length} of {caughtCount} caught
        </div>
      </div>

      {/* Controls Bar: Search, Filters & Sorting */}
      <div className="p-3 border border-[#262832] bg-[#141518] space-y-2.5 text-xs">
        {/* Search & Star Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search caught species..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[180px] px-2.5 py-1.5 border border-[#30343f] bg-[#1a1c22] text-[#f1f3f5] placeholder-[#646b78] text-xs focus:outline-none focus:border-[#4a505e]"
          />

          <button
            onClick={() => setOnlyTrophies(!onlyTrophies)}
            className={`px-3 py-1.5 border cursor-pointer font-bold text-xs transition-colors flex items-center gap-1.5 ${
              onlyTrophies
                ? 'border-amber-500/80 bg-amber-950/60 text-amber-300'
                : 'border-[#30343f] bg-[#1c1f26] text-[#8c94a2] hover:text-[#c0c5ce]'
            }`}
          >
            <span className="text-amber-400 font-bold">Trophy</span> Only
          </button>
        </div>

        {/* Dropdown Filters & Sorting Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Waters Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#717885] shrink-0 text-[11px]">Waters:</span>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-2 py-1 border border-[#30343f] bg-[#1a1c22] text-[#e3e6eb] text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Waters ({caughtCount})</option>
              {FISHING_AREAS.map((a) => {
                const count = caughtSpecies.filter((f) => f.areaId === a.id).length;
                return (
                  <option key={a.id} value={a.id}>
                    {a.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Rarity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#717885] shrink-0 text-[11px]">Rarity:</span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-2 py-1 border border-[#30343f] bg-[#1a1c22] text-[#e3e6eb] text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Tiers</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#717885] shrink-0 text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-2 py-1 border border-[#30343f] bg-[#1a1c22] text-[#e3e6eb] text-xs focus:outline-none cursor-pointer font-medium"
            >
              <option value="default">Default (ID)</option>
              <option value="rarity-desc">Rarity (Rarest First)</option>
              <option value="weight-desc">Record (Heaviest)</option>
              <option value="count-desc">Count (Most Caught)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="value-desc">Value (Highest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Discovered Species Grid */}
      {processedSpecies.length === 0 ? (
        <div className="py-12 px-4 text-center border border-[#23262d] bg-[#15171b] space-y-2">
          <div className="text-xs uppercase tracking-wider text-[#717885] font-bold">
            No Catches Recorded
          </div>
          <div className="text-xs text-[#8c94a2] max-w-sm mx-auto">
            {caughtCount === 0
              ? 'No fish landed yet. Cast your rod or deploy traps to record catches in your log.'
              : 'No caught fish match your active search or filters. Try clearing filters.'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {processedSpecies.map((fish) => {
            const entry = catalogMap[fish.id];

            return (
              <div
                key={fish.id}
                className="p-2.5 border border-[#2d313a] bg-[#1a1d23] text-xs flex items-center justify-between gap-3 transition-colors hover:border-[#3c414d]"
              >
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className={`font-bold ${getRarityTextStyle(fish.tier)}`}>
                    {fish.name}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 border uppercase tracking-wider font-semibold ${getRarityBadgeStyle(
                      fish.tier
                    )}`}
                  >
                    {fish.tier}
                  </span>
                  {entry?.hasTrophy && (
                    <span
                      className="text-[10px] px-1.5 py-0.2 border border-amber-500/80 bg-amber-950/60 text-amber-300 font-bold"
                      title="Trophy Record"
                    >
                      Trophy
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-[#8c94a2] shrink-0 text-right">
                  <span className="font-semibold text-[#f1f3f5]">{entry?.maxWeight} lbs</span>
                  <span className="text-[#646b78] mx-1.5">·</span>
                  <span>x{entry?.caughtCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
