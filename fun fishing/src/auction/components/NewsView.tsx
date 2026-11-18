import React from 'react';
import type { NewsBulletin, ItemCategory } from '../auctionLogic';

interface NewsViewProps {
  currentNews: NewsBulletin | null;
}

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  furniture: 'Furniture',
  electronics: 'Electronics',
  art: 'Art',
  jewelry: 'Jewelry',
  books: 'Books',
  toys: 'Toys',
  tools: 'Tools',
  kitchenware: 'Kitchenware',
  clothing: 'Clothing',
  oddities: 'Oddities',
  sports: 'Sports',
  music: 'Music',
};

export function NewsView({ currentNews }: NewsViewProps) {
  if (!currentNews) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div
          className="w-20 h-20 flex items-center justify-center text-3xl font-bold"
          style={{ color: 'var(--lot-muted)', border: '2px dashed var(--lot-border)' }}
        >
          --
        </div>
        <p style={{ color: 'var(--lot-muted)' }} className="text-sm">
          No active bulletin. Check back soon.
        </p>
      </div>
    );
  }

  const boostPct = Math.round((currentNews.demandMultiplier - 1) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="p-5 border-2 lot-panel"
        style={{
          backgroundColor: 'var(--lot-panel)',
          borderColor: 'var(--lot-border)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs font-bold px-2 py-0.5 uppercase tracking-wider"
            style={{
              backgroundColor: 'var(--lot-accent)',
              color: 'var(--lot-dark)',
            }}
          >
            Market Bulletin
          </span>
          <span className="text-xs" style={{ color: 'var(--lot-muted)' }}>
            Daily Press
          </span>
        </div>

        <h2
          className="text-lg font-bold mt-2 mb-3"
          style={{ color: 'var(--lot-text)' }}
        >
          {currentNews.headline}
        </h2>

        {currentNews.affectedCategories.length > 0 ? (
          <div className="flex flex-col gap-2 mt-4">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--lot-muted)' }}
            >
              Active Demand Surge
            </span>
            <div className="flex flex-wrap gap-2">
              {currentNews.affectedCategories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-2 px-3 py-1.5 border"
                  style={{
                    borderColor: 'var(--lot-border)',
                    backgroundColor: 'var(--lot-dark)',
                  }}
                >
                  <span
                    className="text-sm font-bold"
                    style={{ color: 'var(--lot-text)' }}
                  >
                    {CATEGORY_LABELS[cat]}
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: 'var(--lot-green)' }}
                  >
                    +{boostPct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm mt-2" style={{ color: 'var(--lot-muted)' }}>
            Market remains steady across all categories today.
          </p>
        )}
      </div>
    </div>
  );
}
