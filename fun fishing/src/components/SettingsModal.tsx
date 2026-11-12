import React, { useState, useEffect } from 'react';
import { soundManager } from '../game/audioLogic';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSoundMuted: boolean;
  onToggleMute: () => void;
  onRequestReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isSoundMuted,
  onToggleMute,
  onRequestReset,
}) => {
  const [ambientVol, setAmbientVol] = useState<number>(() =>
    Math.round(soundManager.getAmbientVolume() * 100)
  );
  const [sfxVol, setSfxVol] = useState<number>(() =>
    Math.round(soundManager.getSfxVolume() * 100)
  );
  const [autoPause, setAutoPause] = useState<boolean>(() =>
    soundManager.getAutoPauseOnTabHide()
  );
  const [screenShake, setScreenShake] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('cozy_reel_screenshake');
    return saved !== null ? saved === 'true' : true;
  });
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Sync state if modal opens
  useEffect(() => {
    if (isOpen) {
      setAmbientVol(Math.round(soundManager.getAmbientVolume() * 100));
      setSfxVol(Math.round(soundManager.getSfxVolume() * 100));
      setAutoPause(soundManager.getAutoPauseOnTabHide());
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAmbientChange = (val: number) => {
    setAmbientVol(val);
    soundManager.setAmbientVolume(val / 100);
  };

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    soundManager.setSfxVolume(val / 100);
  };

  const handleToggleAutoPause = () => {
    const next = !autoPause;
    setAutoPause(next);
    soundManager.setAutoPauseOnTabHide(next);
  };

  const handleToggleScreenShake = () => {
    const next = !screenShake;
    setScreenShake(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cozy_reel_screenshake', String(next));
    }
  };

  const handleExportSave = () => {
    try {
      const data = localStorage.getItem('cozy_reel_save_v1');
      if (!data) {
        setCopiedStatus('No save data found');
        setTimeout(() => setCopiedStatus(null), 3000);
        return;
      }
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cozy_reel_save_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setCopiedStatus('Backup downloaded!');
      setTimeout(() => setCopiedStatus(null), 3000);
    } catch {
      setCopiedStatus('Export failed');
      setTimeout(() => setCopiedStatus(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-md border-2 border-[#3e4452] bg-[#121418] text-[#e3e6eb] shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-[#2b303c] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold tracking-wider text-sm pixel-title">
              SETTINGS
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-bold text-[#8c94a2] hover:text-[#f1f3f5] border border-[#2b303c] hover:border-[#4a5160] bg-[#1a1d24] cursor-pointer transition-colors"
            title="Close Settings (Esc)"
          >
            X
          </button>
        </div>

        {/* Audio Section */}
        <div className="space-y-3 bg-[#171920] p-3.5 border border-[#262a35]">
          <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider border-b border-[#242833] pb-1">
            Audio &amp; Sounds
          </div>

          {/* Master Sound Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#f1f3f5]">Master Audio</div>
              <div className="text-[10px] text-[#788292]">
                Toggle all ambient nature tracks and sound effects
              </div>
            </div>
            <button
              onClick={onToggleMute}
              className={`px-3 py-1 text-xs font-bold border cursor-pointer transition-colors ${
                isSoundMuted
                  ? 'border-rose-900 bg-rose-950/60 text-rose-300 hover:bg-rose-900/70'
                  : 'border-emerald-700 bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900/80'
              }`}
            >
              {isSoundMuted ? 'Muted' : 'Enabled'}
            </button>
          </div>

          {/* Ambient Nature Volume Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#c5cbdb] font-semibold">Ambient Soundscapes</span>
              <span className="font-bold text-amber-300 text-[11px]">{ambientVol}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={ambientVol}
              onChange={(e) => handleAmbientChange(Number(e.target.value))}
              disabled={isSoundMuted}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-[#222631] border border-[#343a4a]"
            />
            <div className="text-[10px] text-[#717885]">
              Willow pond, lake, marsh, river + birds, ocean + gulls, coral reef
            </div>
          </div>

          {/* Reeling SFX Volume Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#c5cbdb] font-semibold">Reeling Sound Effects</span>
              <span className="font-bold text-sky-300 text-[11px]">{sfxVol}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={sfxVol}
              onChange={(e) => handleSfxChange(Number(e.target.value))}
              disabled={isSoundMuted}
              className="w-full accent-sky-400 cursor-pointer h-2 bg-[#222631] border border-[#343a4a]"
            />
            <div className="text-[10px] text-[#717885]">
              Mechanical drag reel clicks and tension audio
            </div>
          </div>

          {/* Auto-pause when tab hidden */}
          <div className="flex items-center justify-between pt-1 border-t border-[#222530]">
            <div>
              <div className="text-xs font-semibold text-[#f1f3f5]">Auto-Pause on Tab Switch</div>
              <div className="text-[10px] text-[#788292]">
                Silence audio automatically when viewing other browser tabs
              </div>
            </div>
            <button
              onClick={handleToggleAutoPause}
              className={`px-2.5 py-1 text-xs font-bold border cursor-pointer transition-colors ${
                autoPause
                  ? 'border-sky-700 bg-sky-950/60 text-sky-300 hover:bg-sky-900/60'
                  : 'border-[#363c4c] bg-[#1e222c] text-[#788292]'
              }`}
            >
              {autoPause ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Gameplay & Visuals Section */}
        <div className="space-y-3 bg-[#171920] p-3.5 border border-[#262a35]">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider border-b border-[#242833] pb-1">
            Display &amp; Gameplay
          </div>

          {/* Screen Shake */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#f1f3f5]">Reel &amp; Strike Vibrations</div>
              <div className="text-[10px] text-[#788292]">
                Dynamic visual tension effects when fighting heavy trophy fish
              </div>
            </div>
            <button
              onClick={handleToggleScreenShake}
              className={`px-2.5 py-1 text-xs font-bold border cursor-pointer transition-colors ${
                screenShake
                  ? 'border-emerald-700 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60'
                  : 'border-[#363c4c] bg-[#1e222c] text-[#788292]'
              }`}
            >
              {screenShake ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Save Data Management */}
        <div className="space-y-3 bg-[#171920] p-3.5 border border-[#262a35]">
          <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider border-b border-[#242833] pb-1">
            Game Save Data
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={handleExportSave}
              className="py-1.5 px-3 border border-[#3b4252] bg-[#1e222c] hover:bg-[#282d3b] text-[#e3e6eb] font-bold text-xs cursor-pointer transition-colors"
            >
              Backup Save File
            </button>

            <button
              onClick={() => {
                onClose();
                onRequestReset();
              }}
              className="py-1.5 px-3 border border-rose-800 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs cursor-pointer transition-colors"
            >
              Reset Game Progress
            </button>
          </div>

          {copiedStatus && (
            <div className="text-[11px] text-emerald-400 font-semibold">{copiedStatus}</div>
          )}
        </div>

        {/* Close Button Footer */}
        <div className="pt-1 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2 border-2 border-[#3d4556] bg-[#202530] hover:bg-[#2a3040] text-[#f1f3f5] font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
