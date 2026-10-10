import React, { useState } from 'react';
import { X, Cloud, RefreshCw, Key, Check, LogOut } from 'lucide-react';
import { AuthManager } from '../services/auth';

interface SettingsModalProps {
  isOpen: boolean;
  userCode: string;
  onClose: () => void;
  onSaveUserCode: (newCode: string) => void;
  onSyncNow: () => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  userCode,
  onClose,
  onSaveUserCode,
  onSyncNow,
  onLogout,
}) => {
  const [code, setCode] = useState(userCode);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length >= 4) {
      onSaveUserCode(code.trim().toUpperCase());
      onClose();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-entrance">
      <div className="bg-[#1a1b22] border border-[#292931] rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#292931]">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[#00f5a0]" />
            Kairo Cloud Sync & Settings
          </h3>
          <button
            onClick={onClose}
            className="text-[#918ea2] hover:text-white p-1 rounded-lg transition-colors active:scale-90"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-[#c8c4d9] mb-1">
              Active Access Code
            </label>
            <p className="text-[#918ea2] text-[11px] mb-2">
              Syncs in real-time with the Kairo Android app using this access code.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. A3K9X2"
                className="bg-[#12131a] border border-[#292931] rounded-xl px-3.5 py-2 text-sm text-white uppercase tracking-wider font-mono focus:border-[#5a45ff] outline-none flex-1"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="p-2.5 rounded-xl bg-[#292931] hover:bg-[#33343c] text-white transition-colors"
                title="Copy Code"
              >
                {copied ? <Check className="w-4 h-4 text-[#00f5a0]" /> : <Key className="w-4 h-4" />}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#5a45ff] hover:bg-[#6e5aff] text-white font-semibold text-xs shadow-md transition-all active:scale-95"
              >
                Update
              </button>
            </div>
          </div>

          <div className="bg-[#12131a] border border-[#292931] rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[#918ea2]">Supabase Realtime:</span>
              <span className="font-medium text-[#00f5a0] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f5a0] animate-pulse" />
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#918ea2]">Current Code:</span>
              <span className="font-mono text-white font-bold">{userCode}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#292931]">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="text-xs text-[#ffb4ab] hover:underline flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Switch Account / Log Out
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onSyncNow();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#292931] hover:bg-[#33343c] text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync Now
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#5a45ff] hover:bg-[#6e5aff] text-white transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
