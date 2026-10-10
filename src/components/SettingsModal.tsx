import React, { useState } from 'react';
import { X, Key, Check, LogOut, User } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  userCode: string;
  userName: string;
  onClose: () => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  userCode,
  userName,
  onClose,
  onLogout,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(userCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-entrance">
      <div className="bg-[#1a1b22] border border-[#292931] rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#292931]">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-[#5a45ff]" />
            Account & Workspace
          </h3>
          <button
            onClick={onClose}
            className="text-[#918ea2] hover:text-white p-1 rounded-lg transition-colors active:scale-90"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User & Workspace Details */}
        <div className="bg-[#12131a] border border-[#292931] rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#918ea2]">User Name</span>
            <span className="text-xs font-medium text-white">{userName || 'User'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#918ea2]">Workspace Code</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-[#00f5a0] font-bold tracking-wider">
                {userCode}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-md bg-[#292931] hover:bg-[#33343c] text-white transition-colors"
                title="Copy Access Code"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[#00f5a0]" />
                ) : (
                  <Key className="w-3.5 h-3.5 text-[#918ea2]" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#292931]/60">
            <span className="text-xs text-[#918ea2]">Cloud Database</span>
            <span className="text-[11px] font-medium text-[#00f5a0] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f5a0] animate-pulse" />
              Connected
            </span>
          </div>
        </div>

        {/* Logout Action */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[#93000a]/20 hover:bg-[#93000a]/40 border border-[#ffb4ab]/30 text-[#ffb4ab] text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Log Out / Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};
