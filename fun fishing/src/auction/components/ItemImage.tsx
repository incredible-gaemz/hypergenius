import React, { useState, useEffect } from 'react';
import type { ItemCategory, ItemCondition } from '../auctionLogic';

interface ItemImageProps {
  itemId: string;
  condition?: ItemCondition;
  category?: ItemCategory;
  name?: string;
  className?: string;
}

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

export function ItemImage({
  itemId,
  condition,
  category = 'tools',
  name = '',
  className = 'w-16 h-16 sm:w-20 sm:h-20',
}: ItemImageProps) {
  const [useFallback, setUseFallback] = useState(false);
  const isDirty = condition === 'junk' || condition === 'dusty';
  const primarySrc = isDirty
    ? `/auction/items/${itemId}_dirty.jpg`
    : `/auction/items/${itemId}.jpg`;

  const fallbackSrc = `/auction/items/${itemId}.jpg`;
  const [currentSrc, setCurrentSrc] = useState(primarySrc);

  useEffect(() => {
    setCurrentSrc(primarySrc);
    setUseFallback(false);
  }, [primarySrc]);

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setUseFallback(true);
    }
  };

  if (useFallback) {
    const words = name ? name.split(' ') : [itemId.slice(0, 2)];
    const initials = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + (words[1] ? words[1][0] : '');
    return (
      <div
        className={`${className} flex items-center justify-center font-extrabold text-xs shrink-0 select-none border border-[#4a3520] rounded-sm bg-[#1e1711] text-[var(--text-parchment)]`}
        style={{
          backgroundColor: CATEGORY_COLORS[category] || '#241a12',
        }}
      >
        {initials.toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className={`${className} shrink-0 border border-[#3e2d1d] rounded-sm bg-[#14100c] flex items-center justify-center overflow-hidden`}
    >
      <img
        src={currentSrc}
        alt={name || itemId}
        className="w-full h-full object-contain select-none"
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}
