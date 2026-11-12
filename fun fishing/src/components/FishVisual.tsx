import React from 'react';
import { FishSpecies } from '../game/fishingLogic';

interface FishVisualProps {
  fish: FishSpecies;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isTrophy?: boolean;
  isSecret?: boolean;
  className?: string;
}

export const FishVisual: React.FC<FishVisualProps> = ({
  fish,
  isTrophy = false,
  isSecret = false,
  className = '',
}) => {
  if (isSecret) {
    return (
      <div
        className={`font-mono px-3 py-2 bg-[#121416] border border-dashed border-[#475569] text-[#94a3b8] text-xs text-center ${className}`}
      >
        [ ? ? ? SECRET SPECIMEN ? ? ? ]
      </div>
    );
  }

  return (
    <div
      className={`font-mono px-3 py-2 bg-[#101315] border border-[#2d3748] text-center space-y-1 ${className}`}
    >
      <div className="text-xs uppercase tracking-wider text-[#94a3b8]">
        {fish.tier} Specimen
      </div>
      <div className="font-bold text-sm text-[#f1f5f9]">
        {fish.name}
      </div>
      {isTrophy && (
        <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
          Trophy Catch
        </div>
      )}
    </div>
  );
};
