import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Music,
  Check,
  ChevronRight,
  X,
  Volume2,
} from 'lucide-react';

export interface ToneItem {
  title: string;
  subtitle?: string | null;
  uriString: string | null; // null = Default, "NONE" = silent, string = audio
  isDeviceAudio?: boolean;
}

const DEFAULT_PRESET_MUSIC: ToneItem[] = [
  { title: 'Delight', subtitle: 'Default Android Alarm', uriString: 'preset_delight', isDeviceAudio: true },
  { title: 'Cosmic Bell', subtitle: 'Electronic Melody', uriString: 'preset_cosmic', isDeviceAudio: true },
  { title: 'Digital Alarm', subtitle: 'Classic Beep Chime', uriString: 'preset_digital', isDeviceAudio: true },
  { title: 'Morning Breeze', subtitle: 'Acoustic Guitar', uriString: 'preset_morning', isDeviceAudio: true },
  { title: 'Radar Ping', subtitle: 'Echo Pulse', uriString: 'preset_radar', isDeviceAudio: true },
  { title: 'Beacon', subtitle: 'Ambient Glow', uriString: 'preset_beacon', isDeviceAudio: true },
  { title: 'Marimba', subtitle: 'Rhythmic Wooden Chimes', uriString: 'preset_marimba', isDeviceAudio: true },
  { title: 'Daybreak', subtitle: 'Gentle Rise', uriString: 'preset_daybreak', isDeviceAudio: true },
];

const DEFAULT_PRESET_RECORDINGS: ToneItem[] = [
  { title: 'Voice Memo 01', subtitle: 'Voice recording', uriString: 'rec_01', isDeviceAudio: true },
  { title: 'Reminder Note', subtitle: 'Voice recording', uriString: 'rec_02', isDeviceAudio: true },
];

const RECENT_TONES_STORAGE_KEY = 'kairo_recent_tones_v2';

export const getStoredRecentTones = (): ToneItem[] => {
  try {
    const raw = localStorage.getItem(RECENT_TONES_STORAGE_KEY);
    if (!raw) {
      // Initialize with common Android recent tones
      return [
        { title: 'Delight', subtitle: 'Recently used', uriString: 'preset_delight', isDeviceAudio: true },
        { title: 'Radar Ping', subtitle: 'Recently used', uriString: 'preset_radar', isDeviceAudio: true },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveStoredRecentTone = (tone: ToneItem) => {
  if (!tone.uriString || tone.uriString === 'NONE') return;
  try {
    const current = getStoredRecentTones().filter((t) => t.uriString !== tone.uriString);
    const updated = [tone, ...current].slice(0, 5);
    localStorage.setItem(RECENT_TONES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save recent tone:', e);
  }
};

export const removeStoredRecentTone = (uriString: string | null) => {
  if (!uriString) return;
  try {
    const current = getStoredRecentTones().filter((t) => t.uriString !== uriString);
    localStorage.setItem(RECENT_TONES_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to remove recent tone:', e);
  }
};

// Web Audio synthesizer for pleasant tone previews
let activeAudioCtx: AudioContext | null = null;
const playPreviewChime = (type: string | null) => {
  if (!type || type === 'NONE') return;
  try {
    if (activeAudioCtx) {
      activeAudioCtx.close();
    }
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    activeAudioCtx = ctx;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.35);
    });
  } catch (err) {
    console.warn('Audio preview error:', err);
  }
};

interface TonePickerDialogProps {
  initialUri?: string | null;
  initialTitle?: string | null;
  onDismiss: () => void;
  onConfirm: (uri: string | null, title: string) => void;
}

export const TonePickerDialog: React.FC<TonePickerDialogProps> = ({
  initialUri = null,
  initialTitle = 'Default',
  onDismiss,
  onConfirm,
}) => {
  const [currentView, setCurrentView] = useState<'MAIN' | 'ON_DEVICE'>('MAIN');

  const [selectedUri, setSelectedUri] = useState<string | null>(initialUri);
  const [selectedTitle, setSelectedTitle] = useState<string>(initialTitle || 'Default');
  const defaultToneName = 'Default Alarm Tone';

  const [recentTones, setRecentTones] = useState<ToneItem[]>(() => getStoredRecentTones());
  const [deviceMusicTones, setDeviceMusicTones] = useState<ToneItem[]>(DEFAULT_PRESET_MUSIC);
  const [deviceRecordingTones, setDeviceRecordingTones] = useState<ToneItem[]>(DEFAULT_PRESET_RECORDINGS);

  // Search & tab on "On this device" screen
  const [onDeviceTab, setOnDeviceTab] = useState<number>(0); // 0: Music, 1: Recordings
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    return () => {
      if (activeAudioCtx) {
        activeAudioCtx.close();
      }
    };
  }, []);

  const handleSelectTone = (tone: ToneItem) => {
    setSelectedUri(tone.uriString);
    setSelectedTitle(tone.title);
    if (tone.uriString && tone.uriString !== 'NONE') {
      saveStoredRecentTone(tone);
      setRecentTones(getStoredRecentTones());
      playPreviewChime(tone.uriString);
    }
  };

  const handleRemoveRecent = (e: React.MouseEvent, uri: string | null) => {
    e.stopPropagation();
    removeStoredRecentTone(uri);
    setRecentTones(getStoredRecentTones());
    if (selectedUri === uri) {
      setSelectedUri(null);
      setSelectedTitle(defaultToneName);
    }
  };

  // Upload custom audio file
  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      const newItem: ToneItem = {
        title: file.name.replace(/\.[^/.]+$/, ''),
        subtitle: 'Custom Audio',
        uriString: dataUri,
        isDeviceAudio: true,
      };
      setDeviceMusicTones((prev) => [newItem, ...prev]);
      handleSelectTone(newItem);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    onConfirm(selectedUri, selectedTitle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#15131e] border border-[#333140] rounded-[24px] p-5 shadow-2xl flex flex-col gap-4 text-white max-h-[85vh] overflow-hidden">
        {currentView === 'MAIN' ? (
          /* ==========================================
             SCREEN 1: RINGTONE MAIN (Matches Android img1)
             ========================================== */
          <>
            {/* Top Bar: Back arrow + Title */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onDismiss}
                className="p-1 rounded-full text-white hover:bg-[#252233] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-white">Ringtone</h2>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
              {/* Section 1 Card: Default, None, and Recently Used */}
              <div className="bg-[#201d2c] border border-[#333140] rounded-2xl overflow-hidden flex flex-col">
                {/* Row 1: Default */}
                <div
                  onClick={() => {
                    setSelectedUri(null);
                    setSelectedTitle(defaultToneName);
                    playPreviewChime('default');
                  }}
                  className="px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-[#272336] transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">Default</span>
                    <span className="text-xs font-medium text-[#26E0BA]">
                      {defaultToneName}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedUri === null
                        ? 'border-[#26E0BA] bg-[#26E0BA]'
                        : 'border-[#6b687c]'
                    }`}
                  >
                    {selectedUri === null && (
                      <div className="w-2 h-2 rounded-full bg-[#15131e]" />
                    )}
                  </div>
                </div>

                <div className="h-[1px] bg-[#2d2a3c]" />

                {/* Row 2: None (Silent) */}
                <div
                  onClick={() => {
                    setSelectedUri('NONE');
                    setSelectedTitle('None');
                  }}
                  className="px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-[#272336] transition-colors"
                >
                  <span className="text-sm font-semibold text-white">None</span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedUri === 'NONE'
                        ? 'border-[#26E0BA] bg-[#26E0BA]'
                        : 'border-[#6b687c]'
                    }`}
                  >
                    {selectedUri === 'NONE' && (
                      <div className="w-2 h-2 rounded-full bg-[#15131e]" />
                    )}
                  </div>
                </div>

                {/* Row 3+: Recently Used Tones */}
                {recentTones.length > 0 && (
                  <>
                    <div className="h-[1px] bg-[#2d2a3c]" />
                    {recentTones.map((recent) => {
                      const isSelected = selectedUri === recent.uriString;
                      return (
                        <div
                          key={recent.uriString || recent.title}
                          onClick={() => handleSelectTone(recent)}
                          className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#272336] border-t border-[#2d2a3c] first:border-0 transition-colors"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span
                              className={`text-sm truncate ${
                                isSelected ? 'font-bold text-white' : 'font-medium text-[#f0f0f5]'
                              }`}
                            >
                              {recent.title}
                            </span>
                            <span className="text-[11px] text-[#918ea2] truncate">
                              {recent.subtitle || 'Recently used'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            {/* Small 'x' remove button */}
                            <button
                              type="button"
                              onClick={(e) => handleRemoveRecent(e, recent.uriString)}
                              className="w-5 h-5 rounded-full bg-[#2c293a] flex items-center justify-center text-[#c8c4d9] hover:text-[#ffb4ab] transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>

                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-[#26E0BA] bg-[#26E0BA]' : 'border-[#6b687c]'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-[#15131e]" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Section 2: Custom -> "On this device" */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-[#918ea2] px-1">Custom</span>
                <div
                  onClick={() => setCurrentView('ON_DEVICE')}
                  className="bg-[#201d2c] border border-[#333140] hover:border-[#5a45ff]/40 rounded-2xl px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="text-sm font-semibold text-white">On this device</span>
                  <ChevronRight className="w-5 h-5 text-[#918ea2]" />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onDismiss}
                className="flex-1 py-2.5 rounded-xl border border-[#3a374c] hover:bg-[#252233] text-xs font-semibold text-[#c8c4d9] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl bg-[#5a45ff] hover:bg-[#6b58ff] text-xs font-bold text-[#130067] shadow-lg shadow-[#5a45ff]/20 transition-all active:scale-[0.98]"
              >
                Confirm
              </button>
            </div>
          </>
        ) : (
          /* ==========================================
             SCREEN 2: ON THIS DEVICE (Matches Android img2)
             ========================================== */
          <>
            {/* Top Bar: Back arrow + Title + Search icon */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentView('MAIN')}
                  className="p-1 rounded-full text-white hover:bg-[#252233] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-white">On this device</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchActive(!isSearchActive)}
                className="p-1 rounded-full text-white hover:bg-[#252233] transition-colors"
              >
                {isSearchActive ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>
            </div>

            {/* Search Input */}
            {isSearchActive && (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs or recordings..."
                className="w-full py-2 px-3 bg-[#201d2c] border border-[#26E0BA]/50 rounded-xl text-xs text-white placeholder-[#6b687c] outline-none"
              />
            )}

            {/* Tabs: Music vs Recordings */}
            <div className="flex border-b border-[#2d2a3c]">
              <button
                type="button"
                onClick={() => setOnDeviceTab(0)}
                className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all ${
                  onDeviceTab === 0
                    ? 'border-[#26E0BA] text-white font-bold'
                    : 'border-transparent text-[#918ea2]'
                }`}
              >
                Music
              </button>
              <button
                type="button"
                onClick={() => setOnDeviceTab(1)}
                className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all ${
                  onDeviceTab === 1
                    ? 'border-[#26E0BA] text-white font-bold'
                    : 'border-transparent text-[#918ea2]'
                }`}
              >
                Recordings
              </button>
            </div>

            {/* Direct audio file upload picker */}
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#201d2c] border border-[#26E0BA]/40 hover:bg-[#26E0BA]/10 text-[#26E0BA] text-xs font-medium cursor-pointer transition-colors">
              <Plus className="w-4 h-4" />
              <span>Select audio from files / storage...</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleCustomAudioUpload}
                className="hidden"
              />
            </label>

            {/* List of Audio Tracks */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 min-h-[160px]">
              {(() => {
                const list = onDeviceTab === 0 ? deviceMusicTones : deviceRecordingTones;
                const filtered = searchQuery.trim()
                  ? list.filter(
                      (item) =>
                        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  : list;

                if (filtered.length === 0) {
                  return (
                    <div className="py-8 text-center text-xs text-[#6b687c]">
                      No audio tracks found.
                    </div>
                  );
                }

                return filtered.map((track) => {
                  const isSelected =
                    selectedUri === track.uriString || selectedTitle === track.title;
                  return (
                    <div
                      key={track.uriString || track.title}
                      onClick={() => handleSelectTone(track)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#26E0BA]/10 border border-[#26E0BA]/40'
                          : 'bg-[#201d2c]/60 hover:bg-[#201d2c]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        {/* Red Coral music note container (Matches Android CoralMusicIcon #E84A5F) */}
                        <div className="w-9 h-9 rounded-xl bg-[#E84A5F] flex items-center justify-center flex-shrink-0 text-white shadow-md shadow-[#E84A5F]/20">
                          <Music className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`text-xs truncate ${
                              isSelected ? 'font-bold text-white' : 'font-medium text-[#f0f0f5]'
                            }`}
                          >
                            {track.title}
                          </span>
                          {track.subtitle && (
                            <span className="text-[10px] text-[#918ea2] truncate">
                              {track.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-[#26E0BA] bg-[#26E0BA]' : 'border-[#6b687c]'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-[#15131e]" />
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Done Button */}
            <button
              type="button"
              onClick={() => setCurrentView('MAIN')}
              className="w-full py-2.5 rounded-xl bg-[#26E0BA] hover:bg-[#20caa7] text-xs font-bold text-[#0F0E13] transition-all"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
};
